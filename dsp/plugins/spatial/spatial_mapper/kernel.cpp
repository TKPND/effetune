#include "effetune/kernel.h"
#include "SpatialMapperPluginParams.h"
#include "effetune/dsp/pffft_incremental.h"
#include "effetune/dsp/stage_scheduler.h"

#include <pffft.h>

#include <algorithm>
#include <array>
#include <cmath>
#include <cstddef>
#include <cstdint>
#include <cstring>
#include <memory>
#include <new>
#include <vector>

namespace effetune::plugins::spatial {
namespace {
constexpr double kPi = 3.14159265358979323846;
constexpr std::uint32_t kChannels = 16u;
constexpr std::uint32_t kBands = 48u;
constexpr std::uint32_t kPairs = 136u;
constexpr std::uint32_t kSlotSamples = 16u;
constexpr std::uint32_t kSlots = 256u;
constexpr std::uint32_t kStages = 8192u;
constexpr std::array<std::uint32_t, 5> kBandCounts{8u, 16u, 24u, 32u, 48u};

struct Complex {
  float re = 0.0F;
  float im = 0.0F;
  Complex operator+(Complex b) const noexcept { return {re + b.re, im + b.im}; }
  Complex operator-(Complex b) const noexcept { return {re - b.re, im - b.im}; }
  Complex operator*(float b) const noexcept { return {re * b, im * b}; }
  Complex operator*(Complex b) const noexcept {
    return {re * b.re - im * b.im, re * b.im + im * b.re};
  }
  Complex conjugate() const noexcept { return {re, -im}; }
  float power() const noexcept { return re * re + im * im; }
};

float bounded(float value, float low, float high, float fallback) noexcept {
  if (!std::isfinite(value))
    return fallback;
  return value < low ? low : value > high ? high : value;
}

class Buffer final {
public:
  ~Buffer() { pffft_aligned_free(data_); }
  bool allocate(std::size_t count) noexcept {
    pffft_aligned_free(data_);
    count_ = count;
    data_ = static_cast<float *>(pffft_aligned_malloc(count * sizeof(float)));
    if (data_ != nullptr)
      clear();
    return data_ != nullptr;
  }
  void clear() noexcept {
    if (data_ != nullptr)
      std::memset(data_, 0, count_ * sizeof(float));
  }
  float *data() noexcept { return data_; }
  const float *data() const noexcept { return data_; }
  float &operator[](std::size_t index) noexcept { return data_[index]; }
  const float &operator[](std::size_t index) const noexcept { return data_[index]; }

private:
  float *data_ = nullptr;
  std::size_t count_ = 0u;
};

struct BandState {
  std::array<Complex, kPairs> covariance{};
  std::array<Complex, kPairs> accumulated{};
  std::array<Complex, kChannels> direction{};
  std::array<double, 3> inputEnergy{};
  std::array<double, 3> outputEnergy{};
  std::array<float, 3> normalization{1.0F, 1.0F, 1.0F};
  float direct = 0.0F;
  float diffuse = 0.0F;
};

enum class Stage : std::uint8_t {
  Window,
  BeginForward,
  Forward,
  Covariance,
  Analyze,
  Route,
  Normalize,
  Sum,
  Reorder,
  BeginInverse,
  Inverse,
  Overlap
};
} // namespace

class SpatialMapperKernel final : public PluginKernel {
  EFFETUNE_PARAMS(generated::SpatialMapperPluginParams)

public:
  SpatialMapperKernel() {
    params_.inputChannels = 2.0F;
    params_.bands = 2.0F;
    params_.directness = params_.separation = params_.diffuseExtraction = params_.phaseSensitivity =
        params_.temporalSmoothing = 50.0F;
    params_.energyPreservation = 1.0F;
    for (std::uint32_t i = 0u; i < 256u; ++i) {
      params_.directMatrix[i] = params_.diffuseMatrix[i] = params_.residualMatrix[i] =
          i % 17u == 0u ? 1.0F : 0.0F;
    }
  }
  ~SpatialMapperKernel() override { releaseTransforms(); }

  void prepare(const PrepareInfo &info) override {
    prepared_ = false;
    releaseTransforms();
    sample_rate_ = info.sampleRate;
    channels_ = info.maxChannels;
    max_frames_ = info.maxFrames;
    if (!std::isfinite(sample_rate_) || sample_rate_ <= 0.0 || channels_ == 0u ||
        channels_ > kChannels || max_frames_ == 0u)
      return;
    double requested = std::pow(2.0, std::round(std::log2(sample_rate_ * (2048.0 / 48000.0))));
    requested = requested < 256.0 ? 256.0 : requested > 16384.0 ? 16384.0 : requested;
    fft_ = static_cast<std::uint32_t>(requested);
    while (fft_ > 256u && static_cast<double>(fft_ + fft_ / 4u) / sample_rate_ > 0.120)
      fft_ >>= 1u;
    hop_ = fft_ / 4u;
    timeline_ = fft_ + hop_;
    bins_ = fft_ / 2u + 1u;
    slots_ = hop_ / kSlotSamples;
    if (slots_ > kSlots)
      return;
    setup_ = pffft_new_setup(static_cast<int>(fft_), PFFFT_REAL);
    if (setup_ == nullptr)
      return;
    const int width = pffft_simd_size();
    const int budget = width > 0 ? 1024 / width : 256;
    forward_.reset(new (std::nothrow) dsp::PffftOrderedRealForward(setup_, budget));
    inverse_.reset(new (std::nothrow) dsp::PffftOrderedRealForward(setup_, budget));
    const std::size_t timeline_count = static_cast<std::size_t>(channels_) * timeline_;
    const std::size_t spectrum_count = static_cast<std::size_t>(channels_) * fft_;
    if (forward_ == nullptr || inverse_ == nullptr || !forward_->valid() || !inverse_->valid() ||
        !input_.allocate(timeline_count) || !output_.allocate(timeline_count) ||
        !dry_.allocate(timeline_count) || !dry_gain_ring_.allocate(timeline_count) ||
        !spectra_.allocate(spectrum_count) || !routed_.allocate(3u * spectrum_count) ||
        !window_.allocate(fft_) || !time_.allocate(fft_) || !unordered_.allocate(fft_) ||
        !work_.allocate(fft_))
      return;
    steps_ = static_cast<std::uint32_t>(forward_->stepCount());
    if (steps_ == 0u)
      return;
    states_.resize(kBands);
    matrices_.resize(768u);
    band_tables_.resize(5u * bins_);
    for (std::uint32_t table = 0u; table < 5u; ++table) {
      const std::uint32_t count = kBandCounts[table];
      std::uint32_t begin = 0u;
      const double maximum_erb = std::log1p(sample_rate_ * 0.5 / 228.7);
      for (std::uint32_t band = 0u; band < count; ++band) {
        auto end = static_cast<std::uint32_t>(
            std::llround(228.7 * std::expm1(maximum_erb * static_cast<double>(band + 1u) / count) *
                         fft_ / sample_rate_));
        if (end <= begin)
          end = begin + 1u;
        const std::uint32_t maximum_end = bins_ - (count - band - 1u);
        if (end > maximum_end || band + 1u == count)
          end = maximum_end;
        for (std::uint32_t bin = begin; bin < end; ++bin)
          band_tables_[table * bins_ + bin] = band;
        begin = end;
      }
    }
    for (std::uint32_t i = 0u; i < fft_; ++i)
      window_[i] = static_cast<float>(std::sqrt(0.5 - 0.5 * std::cos(2.0 * kPi * i / fft_)));
    schedule_.reset(new (std::nothrow) Schedule());
    if (schedule_ == nullptr || !buildSchedule())
      return;
    prepared_ = true;
    reset();
  }

  bool preparedSuccessfully() const noexcept override { return prepared_; }
  std::uint32_t latencySamples() const noexcept override { return prepared_ ? timeline_ : 0u; }

  void reset() noexcept override {
    if (!prepared_)
      return;
    input_.clear();
    output_.clear();
    dry_.clear();
    dry_gain_ring_.clear();
    spectra_.clear();
    routed_.clear();
    time_.clear();
    unordered_.clear();
    work_.clear();
    std::fill(states_.begin(), states_.end(), BandState{});
    position_ = current_channels_ = slot_ = job_channels_ = effective_inputs_ = 0u;
    absolute_ = job_start_ = 0u;
    next_hop_ = hop_;
    active_ = false;
    initialized_ = false;
    failure_ = false;
    band_index_ = 2u;
    dry_gain_.fill(0.0F);
  }

  void process(float *audio, std::uint32_t channel_count, std::uint32_t frame_count,
               const ProcessInfo &) noexcept override {
    if (!prepared_ || audio == nullptr || channel_count == 0u || channel_count > channels_ ||
        frame_count == 0u || frame_count > max_frames_)
      return;
    if (current_channels_ != 0u && current_channels_ != channel_count)
      reset();
    current_channels_ = channel_count;
    for (std::uint32_t frame = 0u; frame < frame_count; ++frame) {
      for (std::uint32_t channel = 0u; channel < channel_count; ++channel) {
        const std::size_t block = static_cast<std::size_t>(channel) * frame_count + frame;
        const std::size_t ring = static_cast<std::size_t>(channel) * timeline_ + position_;
        const float value = std::isfinite(audio[block]) ? audio[block] : 0.0F;
        audio[block] = output_[ring] + dry_gain_ring_[ring] * dry_[ring];
        input_[ring] = dry_[ring] = value;
        output_[ring] = dry_gain_ring_[ring] = 0.0F;
      }
      if (++position_ == timeline_)
        position_ = 0u;
      ++absolute_;
      dsp::advanceStagedJob(active_, slot_, slots_, absolute_, job_start_, kSlotSamples, *schedule_,
                            [this](const dsp::SchedulerStage &stage) noexcept { run(stage); });
      if (absolute_ == next_hop_) {
        startJob(channel_count);
        next_hop_ += hop_;
      }
    }
  }

private:
  using Schedule = dsp::StageSchedule<kStages, kSlots>;
  void releaseTransforms() noexcept {
    forward_.reset();
    inverse_.reset();
    if (setup_ != nullptr)
      pffft_destroy_setup(setup_);
    setup_ = nullptr;
  }
  void add(Stage stage, std::uint32_t channel, std::uint32_t begin, std::uint32_t end,
           std::uint32_t weight) noexcept {
    schedule_->addStage(static_cast<std::uint8_t>(stage), channel, begin, end, weight);
  }
  void chunks(Stage stage, std::uint32_t channel, std::uint32_t count, std::uint32_t size,
              std::uint32_t cost) noexcept {
    for (std::uint32_t begin = 0u; begin < count; begin += size) {
      const std::uint32_t end = begin + size < count ? begin + size : count;
      add(stage, channel, begin, end, (end - begin) * cost);
    }
  }
  bool buildSchedule() noexcept {
    schedule_->clear();
    // Scalar PFFFT steps cost about twice as much as SIMD steps at the same work budget.
    const bool scalar_fft = pffft_simd_size() == 1;
    const std::uint32_t fft_weight = scalar_fft ? 22000u : 10000u;
    for (std::uint32_t channel = 0u; channel < channels_; ++channel) {
      chunks(Stage::Window, channel, fft_, 256u, 20u);
      add(Stage::BeginForward, channel, 0u, 0u, 512u);
      for (std::uint32_t step = 0u; step < steps_; ++step)
        add(Stage::Forward, channel, step, step + 1u, fft_weight);
    }
    chunks(Stage::Covariance, 0u, bins_, 16u, channels_ * channels_ * 8u);
    for (std::uint32_t band = 0u; band < kBands; ++band)
      add(Stage::Analyze, band, 0u, 0u, channels_ * channels_ * 64u);
    chunks(Stage::Route, 0u, bins_, 16u, channels_ * channels_ * 18u);
    for (std::uint32_t band = 0u; band < kBands; ++band)
      add(Stage::Normalize, band, 0u, 0u, 512u);
    chunks(Stage::Sum, 0u, bins_, 64u, channels_ * 48u);
    for (std::uint32_t channel = 0u; channel < channels_; ++channel) {
      add(Stage::Reorder, channel, 0u, 0u, scalar_fft ? fft_ * 2u : fft_);
      add(Stage::BeginInverse, channel, 0u, 0u, 512u);
      for (std::uint32_t step = 0u; step < steps_; ++step)
        add(Stage::Inverse, channel, step, step + 1u, fft_weight);
      chunks(Stage::Overlap, channel, fft_, 256u, 20u);
    }
    return schedule_->partition(slots_);
  }

  float smooth(float previous, float target) const noexcept {
    const float coefficient = target > previous ? steering_attack_ : steering_release_;
    return target + coefficient * (previous - target);
  }
  void startJob(std::uint32_t channel_count) noexcept {
    if (active_) {
      failure_ = true;
      return;
    }
    const auto selected = static_cast<std::uint32_t>(bounded(params_.bands, 0.0F, 4.0F, 2.0F));
    auto inputs = static_cast<std::uint32_t>(bounded(params_.inputChannels, 1.0F, 16.0F, 2.0F));
    if (inputs > channel_count)
      inputs = channel_count;
    if (selected != band_index_ || inputs != effective_inputs_)
      std::fill(states_.begin(), states_.end(), BandState{});
    band_index_ = selected;
    effective_inputs_ = inputs;
    job_channels_ = channel_count;
    const double scale =
        std::pow(4.0, (bounded(params_.temporalSmoothing, 0.0F, 100.0F, 50.0F) - 50.0) / 50.0);
    const double seconds = static_cast<double>(hop_) / sample_rate_ / scale;
    covariance_attack_ = static_cast<float>(std::exp(-seconds / 0.030));
    covariance_release_ = static_cast<float>(std::exp(-seconds / 0.200));
    steering_attack_ = static_cast<float>(std::exp(-seconds / 0.020));
    steering_release_ = static_cast<float>(std::exp(-seconds / 0.150));
    directness_ = bounded(params_.directness, 0.0F, 100.0F, 50.0F) * 0.01F;
    extraction_ = bounded(params_.diffuseExtraction, 0.0F, 100.0F, 50.0F) * 0.01F;
    contrast_ = 0.5F + bounded(params_.separation, 0.0F, 100.0F, 50.0F) * 0.015F;
    phase_ = bounded(params_.phaseSensitivity, 0.0F, 100.0F, 50.0F) * 0.01F;
    preserve_ = params_.energyPreservation >= 0.5F;
    const std::array<const float *, 3> targets{params_.directMatrix, params_.diffuseMatrix,
                                               params_.residualMatrix};
    std::array<bool, kChannels> written{};
    for (std::uint32_t component = 0u; component < 3u; ++component) {
      for (std::uint32_t index = 0u; index < 256u; ++index) {
        const float target = bounded(targets[component][index], -1.0F, 1.0F, 0.0F);
        if (index % 16u < inputs && target != 0.0F)
          written[index / 16u] = true;
        float &value = matrices_[component * 256u + index];
        value = initialized_ ? smooth(value, target) : target;
      }
    }
    for (std::uint32_t channel = 0u; channel < channel_count; ++channel) {
      const float target = channel >= inputs && !written[channel] ? 1.0F : 0.0F;
      dry_gain_[channel] = initialized_ ? smooth(dry_gain_[channel], target) : target;
    }
    for (auto &state : states_) {
      state.accumulated.fill({});
      state.inputEnergy.fill(0.0);
      state.outputEnergy.fill(0.0);
    }
    initialized_ = true;
    job_start_ = absolute_;
    input_origin_ = (position_ + timeline_ - fft_) % timeline_;
    output_origin_ = (position_ + hop_) % timeline_;
    slot_ = 0u;
    active_ = true;
  }

  Complex read(const float *spectrum, std::uint32_t bin) const noexcept {
    if (bin == 0u)
      return {spectrum[0], 0.0F};
    if (bin + 1u == bins_)
      return {spectrum[1], 0.0F};
    return {spectrum[2u * bin], spectrum[2u * bin + 1u]};
  }
  void write(float *spectrum, std::uint32_t bin, Complex value) noexcept {
    if (bin == 0u)
      spectrum[0] = value.re;
    else if (bin + 1u == bins_)
      spectrum[1] = value.re;
    else {
      spectrum[2u * bin] = value.re;
      spectrum[2u * bin + 1u] = value.im;
    }
  }
  BandState &bandFor(std::uint32_t bin) noexcept {
    return states_[band_tables_[band_index_ * bins_ + bin]];
  }
  void accumulate(std::uint32_t begin, std::uint32_t end) noexcept {
    std::array<Complex, kChannels> x{};
    for (std::uint32_t bin = begin; bin < end; ++bin) {
      auto &state = bandFor(bin);
      for (std::uint32_t i = 0u; i < effective_inputs_; ++i)
        x[i] = read(spectra_.data() + static_cast<std::size_t>(i) * fft_, bin);
      std::uint32_t pair = 0u;
      const float weight = bin == 0u || bin + 1u == bins_ ? 1.0F : 2.0F;
      for (std::uint32_t i = 0u; i < effective_inputs_; ++i)
        for (std::uint32_t j = i; j < effective_inputs_; ++j, ++pair)
          state.accumulated[pair] = state.accumulated[pair] + (x[i] * x[j].conjugate()) * weight;
    }
  }
  void multiply(const BandState &state, const std::array<Complex, kChannels> &x,
                std::array<Complex, kChannels> &result) const noexcept {
    result.fill({});
    std::uint32_t pair = 0u;
    for (std::uint32_t i = 0u; i < effective_inputs_; ++i) {
      for (std::uint32_t j = i; j < effective_inputs_; ++j, ++pair) {
        result[i] = result[i] + state.covariance[pair] * x[j];
        if (j != i)
          result[j] = result[j] + state.covariance[pair].conjugate() * x[i];
      }
    }
  }
  void analyze(std::uint32_t band) noexcept {
    if (band >= kBandCounts[band_index_])
      return;
    auto &state = states_[band];
    double previous_trace = 0.0, trace = 0.0;
    std::uint32_t pair = 0u;
    for (std::uint32_t i = 0u; i < effective_inputs_; ++i) {
      previous_trace += state.covariance[pair].re;
      trace += state.accumulated[pair].re;
      pair += effective_inputs_ - i;
    }
    const float coefficient = trace > previous_trace ? covariance_attack_ : covariance_release_;
    const std::uint32_t pairs = effective_inputs_ * (effective_inputs_ + 1u) / 2u;
    for (std::uint32_t index = 0u; index < pairs; ++index)
      state.covariance[index] =
          state.accumulated[index] * (1.0F - coefficient) + state.covariance[index] * coefficient;
    trace = trace * (1.0 - coefficient) + previous_trace * coefficient;
    float diffuseness = 0.0F;
    if (trace > 1.0e-20) {
      std::array<Complex, kChannels> product{};
      for (std::uint32_t iteration = 0u; iteration < 5u; ++iteration) {
        multiply(state, state.direction, product);
        double power = 0.0;
        for (std::uint32_t i = 0u; i < effective_inputs_; ++i)
          power += product[i].power();
        if (power <= trace * trace * 1.0e-16) {
          std::uint32_t strongest = 0u;
          float maximum = -1.0F;
          pair = 0u;
          for (std::uint32_t i = 0u; i < effective_inputs_; ++i) {
            if (state.covariance[pair].re > maximum) {
              maximum = state.covariance[pair].re;
              strongest = i;
            }
            pair += effective_inputs_ - i;
          }
          state.direction.fill({});
          state.direction[strongest] = {1.0F, 0.0F};
          continue;
        }
        const float scale = static_cast<float>(1.0 / std::sqrt(power));
        for (std::uint32_t i = 0u; i < effective_inputs_; ++i)
          state.direction[i] = product[i] * scale;
      }
      multiply(state, state.direction, product);
      double eigenvalue = 0.0, magnitude_sum = 0.0;
      Complex sum{};
      for (std::uint32_t i = 0u; i < effective_inputs_; ++i) {
        eigenvalue += (state.direction[i].conjugate() * product[i]).re;
        sum = sum + state.direction[i];
        magnitude_sum += std::sqrt(state.direction[i].power());
      }
      if (effective_inputs_ > 1u) {
        diffuseness = bounded(static_cast<float>((1.0 - eigenvalue / trace) * effective_inputs_ /
                                                 (effective_inputs_ - 1u)),
                              0.0F, 1.0F, 0.0F);
        const float alignment =
            magnitude_sum > 0.0
                ? bounded(static_cast<float>(sum.power() / (magnitude_sum * magnitude_sum)), 0.0F,
                          1.0F, 1.0F)
                : 1.0F;
        diffuseness += (1.0F - diffuseness) * phase_ * (1.0F - alignment);
      }
    }
    const float direct = directness_ * std::pow(1.0F - diffuseness, contrast_);
    const float diffuse = effective_inputs_ > 1u && trace > 1.0e-20
                              ? extraction_ * std::pow(diffuseness, contrast_)
                              : 0.0F;
    state.direct = smooth(state.direct, direct);
    state.diffuse = smooth(state.diffuse, diffuse);
  }

  void route(std::uint32_t begin, std::uint32_t end) noexcept {
    std::array<Complex, kChannels> x{};
    std::array<std::array<Complex, kChannels>, 3> component{};
    for (std::uint32_t bin = begin; bin < end; ++bin) {
      auto &state = bandFor(bin);
      Complex projection{};
      for (std::uint32_t input = 0u; input < effective_inputs_; ++input) {
        x[input] = read(spectra_.data() + static_cast<std::size_t>(input) * fft_, bin);
        projection = projection + state.direction[input].conjugate() * x[input];
      }
      const double weight = bin == 0u || bin + 1u == bins_ ? 1.0 : 2.0;
      for (std::uint32_t input = 0u; input < effective_inputs_; ++input) {
        const Complex direct = state.direction[input] * projection;
        component[0][input] = direct * state.direct;
        component[1][input] = (x[input] - direct) * state.diffuse;
        component[2][input] = x[input] - component[0][input] - component[1][input];
        for (std::uint32_t c = 0u; c < 3u; ++c)
          state.inputEnergy[c] += weight * component[c][input].power();
      }
      for (std::uint32_t c = 0u; c < 3u; ++c) {
        for (std::uint32_t out = 0u; out < job_channels_; ++out) {
          Complex value{};
          const float *matrix = matrices_.data() + c * 256u + out * 16u;
          for (std::uint32_t input = 0u; input < effective_inputs_; ++input) {
            if (matrix[input] != 0.0F)
              value = value + component[c][input] * matrix[input];
          }
          state.outputEnergy[c] += weight * value.power();
          write(routed_.data() + (static_cast<std::size_t>(c) * channels_ + out) * fft_, bin,
                value);
        }
      }
    }
  }
  void normalize(std::uint32_t band) noexcept {
    if (band >= kBandCounts[band_index_])
      return;
    auto &state = states_[band];
    for (std::uint32_t c = 0u; c < 3u; ++c) {
      float target = 1.0F;
      if (preserve_ && state.inputEnergy[c] > 1.0e-20) {
        target = state.outputEnergy[c] > 1.0e-20
                     ? static_cast<float>(std::sqrt(state.inputEnergy[c] / state.outputEnergy[c]))
                     : 0.0F;
        if (target > 8.0F)
          target = 8.0F;
      }
      state.normalization[c] = smooth(state.normalization[c], target);
    }
  }
  void sum(std::uint32_t begin, std::uint32_t end) noexcept {
    for (std::uint32_t bin = begin; bin < end; ++bin) {
      const auto &state = bandFor(bin);
      for (std::uint32_t out = 0u; out < job_channels_; ++out) {
        Complex value{};
        for (std::uint32_t c = 0u; c < 3u; ++c)
          value =
              value +
              read(routed_.data() + (static_cast<std::size_t>(c) * channels_ + out) * fft_, bin) *
                  state.normalization[c];
        write(spectra_.data() + static_cast<std::size_t>(out) * fft_, bin, value);
      }
    }
  }

  void run(const dsp::SchedulerStage &stage) noexcept {
    if (failure_)
      return;
    const auto kind = static_cast<Stage>(stage.kind);
    const auto channel = static_cast<std::uint32_t>(stage.channel);
    if ((kind == Stage::Window || kind == Stage::BeginForward || kind == Stage::Forward) &&
        channel >= effective_inputs_)
      return;
    if ((kind == Stage::Reorder || kind == Stage::BeginInverse || kind == Stage::Inverse ||
         kind == Stage::Overlap) &&
        channel >= job_channels_)
      return;
    float *spectrum =
        spectra_.data() + static_cast<std::size_t>(channel < channels_ ? channel : 0u) * fft_;
    switch (kind) {
    case Stage::Window:
      for (std::uint32_t i = stage.begin; i < stage.end; ++i)
        time_[i] = input_[static_cast<std::size_t>(channel) * timeline_ +
                          (input_origin_ + i) % timeline_] *
                   window_[i];
      break;
    case Stage::BeginForward:
      failure_ = !forward_->begin(time_.data(), spectrum, work_.data());
      break;
    case Stage::Forward:
      failure_ = forward_->step() < 0;
      break;
    case Stage::Covariance:
      accumulate(stage.begin, stage.end);
      break;
    case Stage::Analyze:
      analyze(channel);
      break;
    case Stage::Route:
      route(stage.begin, stage.end);
      break;
    case Stage::Normalize:
      normalize(channel);
      break;
    case Stage::Sum:
      sum(stage.begin, stage.end);
      break;
    case Stage::Reorder:
      pffft_zreorder(setup_, spectrum, unordered_.data(), PFFFT_BACKWARD);
      break;
    case Stage::BeginInverse:
      failure_ = !inverse_->beginUnorderedBackward(unordered_.data(), time_.data(), work_.data());
      break;
    case Stage::Inverse:
      failure_ = inverse_->step() < 0;
      break;
    case Stage::Overlap:
      for (std::uint32_t i = stage.begin; i < stage.end; ++i) {
        const std::size_t ring =
            static_cast<std::size_t>(channel) * timeline_ + (output_origin_ + i) % timeline_;
        output_[ring] += time_[i] * window_[i] * (0.5F / static_cast<float>(fft_));
        // Use the same WOLA envelope for dry and wet role transitions.
        dry_gain_ring_[ring] += dry_gain_[channel] * window_[i] * window_[i] * 0.5F;
      }
      break;
    }
  }

  PFFFT_Setup *setup_ = nullptr;
  std::unique_ptr<dsp::PffftOrderedRealForward> forward_, inverse_;
  std::unique_ptr<Schedule> schedule_;
  Buffer input_, output_, dry_, dry_gain_ring_, spectra_, routed_, window_, time_, unordered_,
      work_;
  std::vector<BandState> states_;
  std::vector<float> matrices_;
  std::vector<std::uint32_t> band_tables_;
  std::array<float, kChannels> dry_gain_{};
  double sample_rate_ = 0.0;
  float covariance_attack_ = 0.0F, covariance_release_ = 0.0F;
  float steering_attack_ = 0.0F, steering_release_ = 0.0F;
  float directness_ = 0.5F, extraction_ = 0.5F, contrast_ = 1.25F, phase_ = 0.5F;
  std::uint32_t channels_ = 0u, max_frames_ = 0u, current_channels_ = 0u;
  std::uint32_t fft_ = 0u, hop_ = 0u, timeline_ = 0u, bins_ = 0u, slots_ = 0u, steps_ = 0u;
  std::uint32_t position_ = 0u, slot_ = 0u, input_origin_ = 0u, output_origin_ = 0u;
  std::uint32_t job_channels_ = 0u, effective_inputs_ = 0u, band_index_ = 2u;
  std::uint64_t absolute_ = 0u, next_hop_ = 0u, job_start_ = 0u;
  bool prepared_ = false, initialized_ = false, active_ = false, failure_ = false, preserve_ = true;
};
} // namespace effetune::plugins::spatial

EFFETUNE_REGISTER_KERNEL(SpatialMapperPlugin, effetune::plugins::spatial::SpatialMapperKernel)
