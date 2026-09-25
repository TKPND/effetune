#include "effetune/kernel.h"
#include "PitchMeterPluginParams.h"
#include "binary_io.h"
#include "effetune/dsp/pffft_incremental.h"
#include "effetune/dsp/stage_scheduler.h"
#include <algorithm>
#include <array>
#include <cmath>
#include <cstdint>
#include <memory>
#include <vector>

namespace effetune::plugins::analyzer {
namespace {
using dsp::PffftOrderedRealForward;
using Schedule = dsp::StageSchedule<16384u, 512u>;
enum Stage : std::uint8_t {
  Capture,
  ForwardBegin,
  Forward,
  Power,
  InverseBegin,
  Inverse,
  Normalize,
  Publish
};
struct AlignedDeleter {
  void operator()(float *p) const noexcept { pffft_aligned_free(p); }
};
using Buffer = std::unique_ptr<float, AlignedDeleter>;
struct Transform {
  PFFFT_Setup *setup;
  PffftOrderedRealForward forward, inverse;
  explicit Transform(std::uint32_t size)
      : setup(pffft_new_setup(static_cast<int>(size), PFFFT_REAL)), forward(setup), inverse(setup) {
  }
  ~Transform() { pffft_destroy_setup(setup); }
};
constexpr std::uint32_t kPayloadBytes = 44u, kPending = 32u;
double clamp(double value, double lo, double hi) noexcept {
  return value < lo ? lo : (value > hi ? hi : value);
}
} // namespace

// Clean-room NSDF/key-maxima detector based on McLeod and Wyvill (2005).
// No third-party pitch-detector implementation or learned model is used.
class PitchMeterKernel final : public PluginKernel {
  EFFETUNE_PARAMS(generated::PitchMeterPluginParams)
public:
  void prepare(const PrepareInfo &info) override {
    ready_ = false;
    window_ = 0u;
    rate_ = std::isfinite(info.sampleRate) && info.sampleRate > 0 ? info.sampleRate : 48000.0;
    hop_ = static_cast<std::uint32_t>(clamp(std::round(rate_ * .01 / 16.0) * 16.0, 16, 8192));
    max_window_ = static_cast<std::uint32_t>(std::ceil(3.1 * rate_ / 25.0)) + 8u;
    capacity_ = 128u;
    while (capacity_ < 2u * max_window_)
      capacity_ *= 2u;
    transforms_.clear();
    for (auto size = 128u; size <= capacity_; size *= 2u) {
      auto transform = std::make_unique<Transform>(size);
      if (!transform->setup || !transform->forward.valid() || !transform->inverse.valid())
        return;
      transforms_.push_back(std::move(transform));
    }
    for (auto &buffer : buffers_) {
      buffer.reset(static_cast<float *>(
          pffft_aligned_malloc(static_cast<std::size_t>(capacity_) * sizeof(float))));
      if (!buffer)
        return;
    }
    ring_.resize(max_window_ + hop_ + 16u);
    prefix_.resize(max_window_ + 1u);
    nsdf_.resize(max_window_ + 1u);
    volume_power_.resize(capacity_ / 2u + 1u);
    schedule_ = std::make_unique<Schedule>();
    ready_ = true;
    sync_ = true;
    reset();
  }
  bool preparedSuccessfully() const noexcept override { return ready_; }
  void reset() noexcept override {
    if (++generation_ == 0u)
      ++generation_;
    std::fill(ring_.begin(), ring_.end(), 0.0F);
    position_ = filled_ = frame_index_ = pending_read_ = pending_count_ = 0u;
    until_hop_ = hop_;
    until_slot_ = 16u;
    slot_ = 0u;
    active_ = false;
    channels_ = 0u;
    previous_frequency_ = 0.0;
  }
  void process(float *audio, std::uint32_t channels, std::uint32_t frames,
               const ProcessInfo &info) noexcept override {
    if (!ready_ || !audio || channels == 0u)
      return;
    synchronize();
    if (channels_ != 0u && channels_ != channels)
      reset();
    channels_ = channels;
    for (std::uint32_t i = 0u; i < frames; ++i) {
      const double left = std::isfinite(audio[i]) ? audio[i] : 0.0;
      const double right = channels > 1u && std::isfinite(audio[frames + i])
                               ? audio[frames + i]
                               : (channels > 1u ? 0.0 : left);
      ring_[position_] = static_cast<float>((left + right) * .5);
      position_ = (position_ + 1u) % static_cast<std::uint32_t>(ring_.size());
      if (filled_ < window_)
        ++filled_;
      if (active_ && --until_slot_ == 0u) {
        for (auto index = schedule_->slotBegin(slot_); index < schedule_->slotEnd(slot_); ++index)
          runStage(schedule_->stage(index));
        active_ = ++slot_ < hop_ / 16u;
        until_slot_ = 16u;
      }
      if (--until_hop_ == 0u) {
        origin_ = (position_ + static_cast<std::uint32_t>(ring_.size()) - window_) %
                  static_cast<std::uint32_t>(ring_.size());
        time_ = info.timeSeconds + static_cast<double>(i + 1u) / rate_;
        ++frame_index_;
        energy_ = compensation_ = 0.0;
        prefix_[0] = 0.0;
        silent_ = filled_ < window_;
        active_ = true;
        slot_ = 0u;
        until_slot_ = 16u;
        until_hop_ = hop_;
      }
    }
  }
  void writeTelemetry(TelemetryWriter &writer) noexcept override {
    while (pending_count_) {
      if (!writer.write(26u, 1u, pending_[pending_read_].data(), kPayloadBytes))
        return;
      pending_read_ = (pending_read_ + 1u) % kPending;
      --pending_count_;
    }
  }

private:
  void synchronize() noexcept {
    if (!sync_ && !paramsDirty())
      return;
    sync_ = false;
    const auto bounded = [](float value, double lo, double hi, double fallback) {
      return std::isfinite(value) ? clamp(value, lo, hi) : fallback;
    };
    const auto reference = bounded(params_.referenceA4, 400, 480, 440);
    const auto minimum = std::round(bounded(params_.minimumMidi, 21, 108, 36));
    const auto maximum = std::max(minimum, std::round(bounded(params_.maximumMidi, 21, 108, 96)));
    if (reference == reference_ && minimum == minimum_ && maximum == maximum_ && window_ != 0u)
      return;
    reference_ = reference;
    minimum_ = minimum;
    maximum_ = maximum;
    min_period_ = rate_ / (reference_ * std::exp2((maximum_ - 69.0) / 12.0));
    max_period_ = rate_ / (reference_ * std::exp2((minimum_ - 69.0) / 12.0));
    window_ =
        static_cast<std::uint32_t>(std::ceil(std::max(3.1 * max_period_ + 4.0, rate_ * .015)));
    size_ = 128u;
    std::size_t transform = 0u;
    while (size_ < 2u * window_) {
      size_ *= 2u;
      ++transform;
    }
    transform_ = transforms_[transform].get();
    static_cast<void>(transform_->inverse.beginUnorderedBackward(
        buffers_[2].get(), buffers_[3].get(), buffers_[1].get()));
    max_lag_ = window_ * 2u / 3u;
    schedule_->clear();
    const auto range = [&](Stage stage, std::uint32_t count, std::uint32_t weight) {
      for (auto begin = 0u; begin < count; begin += 128u) {
        const auto end = std::min(begin + 128u, count);
        schedule_->addStage(stage, 0u, begin, end, (end - begin) * weight);
      }
    };
    range(Capture, size_, 3u);
    schedule_->addStage(ForwardBegin, 0u, 0u, 0u, 1u);
    for (int i = 0; i < transform_->forward.stepCount(); ++i)
      schedule_->addStage(Forward, 0u, 0u, 0u, 256u);
    range(Power, size_ / 2u, 4u);
    schedule_->addStage(InverseBegin, 0u, 0u, 0u, size_);
    for (int i = 0; i < transform_->inverse.stepCount(); ++i)
      schedule_->addStage(Inverse, 0u, 0u, 0u, 256u);
    range(Normalize, max_lag_ + 1u, 4u);
    schedule_->addStage(Publish, 0u, 0u, 0u, window_ * 10u);
    ready_ = schedule_->partition(hop_ / 16u);
    reset();
  }
  void runStage(const dsp::SchedulerStage &stage) noexcept {
    auto *samples = buffers_[0].get();
    auto *spectrum = buffers_[1].get();
    auto *work = buffers_[2].get();
    auto *correlation = buffers_[3].get();
    switch (stage.kind) {
    case Capture:
      for (auto i = stage.begin; i < stage.end; ++i) {
        samples[i] = i < window_ ? ring_[(origin_ + i) % ring_.size()] : 0.0F;
        if (i < window_) {
          const double value = static_cast<double>(samples[i]) * samples[i] - compensation_;
          const double sum = energy_ + value;
          compensation_ = (sum - energy_) - value;
          energy_ = sum;
          prefix_[i + 1u] = energy_;
        }
      }
      break;
    case ForwardBegin:
      silent_ = silent_ || energy_ / window_ < 2.511886431509582e-10;
      if (!silent_)
        static_cast<void>(transform_->forward.begin(samples, spectrum, work));
      break;
    case Forward:
      if (!silent_)
        static_cast<void>(transform_->forward.step());
      break;
    case Power:
      if (!silent_)
        for (auto bin = stage.begin; bin < stage.end; ++bin) {
          const auto index = bin * 2u;
          if (bin == 0u) {
            correlation[0] = spectrum[0] * spectrum[0];
            correlation[1] = spectrum[1] * spectrum[1];
            volume_power_[0] = correlation[0];
            volume_power_[size_ / 2u] = correlation[1];
          } else {
            correlation[index] =
                spectrum[index] * spectrum[index] + spectrum[index + 1u] * spectrum[index + 1u];
            correlation[index + 1u] = 0.0F;
            volume_power_[bin] = correlation[index];
          }
        }
      break;
    case InverseBegin:
      if (!silent_) {
        pffft_zreorder(transform_->setup, correlation, work, PFFFT_BACKWARD);
        static_cast<void>(transform_->inverse.beginUnorderedBackward(work, correlation, spectrum));
      }
      break;
    case Inverse:
      if (!silent_)
        static_cast<void>(transform_->inverse.step());
      break;
    case Normalize:
      if (!silent_)
        for (auto lag = stage.begin; lag < stage.end; ++lag) {
          const double denominator = prefix_[window_ - lag] + energy_ - prefix_[lag];
          nsdf_[lag] = denominator > 1e-20 ? 2.0 * correlation[lag] / (size_ * denominator) : 0.0;
        }
      break;
    case Publish:
      publish();
      break;
    }
  }
  double direct(std::uint32_t lag) const noexcept {
    const auto *samples = buffers_[0].get();
    double correlation = 0.0;
    for (auto i = 0u; i + lag < window_; ++i)
      correlation += static_cast<double>(samples[i]) * samples[i + lag];
    const double denominator = prefix_[window_ - lag] + energy_ - prefix_[lag];
    return denominator > 1e-20 ? 2.0 * correlation / denominator : 0.0;
  }
  double refined(std::uint32_t lag) const noexcept {
    const double a = direct(lag - 1u), b = direct(lag), c = direct(lag + 1u);
    const double curvature = a - 2.0 * b + c;
    return lag + (curvature < -1e-14 ? clamp(.5 * (a - c) / curvature, -.5, .5) : 0.0);
  }
  double select(double &clarity) const noexcept {
    double best = 0.0;
    const auto lo = static_cast<std::uint32_t>(std::max(2.0, std::floor(min_period_ / 1.03) - 1.0));
    const auto hi =
        std::min(max_lag_ - 1u, static_cast<std::uint32_t>(std::ceil(max_period_ * 1.03) + 1.0));
    std::array<std::uint32_t, 512> peaks{};
    std::uint32_t count = 0u, peak = 0u;
    bool crossed = false;
    for (auto lag = 1u; lag <= hi; ++lag) {
      if (nsdf_[lag] <= 0.0) {
        crossed = true;
        if (peak != 0u && count < peaks.size()) {
          peaks[count++] = peak;
          best = std::max(best, nsdf_[peak]);
        }
        peak = 0u;
      } else if (crossed && lag >= lo && nsdf_[lag] > nsdf_[lag - 1u] &&
                 nsdf_[lag] >= nsdf_[lag + 1u] && (peak == 0u || nsdf_[lag] > nsdf_[peak]))
        peak = lag;
    }
    if (peak != 0u && count < peaks.size()) {
      peaks[count++] = peak;
      best = std::max(best, nsdf_[peak]);
    }
    if (best < (previous_frequency_ > 0.0 ? .65 : .75))
      return 0.0;
    for (auto index = 0u; index < count; ++index) {
      const auto lag = peaks[index];
      if (nsdf_[lag] < best * .92)
        continue;
      double period = refined(lag);
      if (period < min_period_ / 1.03 || period > max_period_ * 1.03)
        continue;
      clarity = clamp(nsdf_[lag], 0.0, 1.0);
      // Longer integer multiples reduce parabolic bias at short sample periods.
      const auto multiple = static_cast<std::uint32_t>(clamp(std::ceil(40.0 / period), 2.0, 8.0));
      const auto target = static_cast<std::uint32_t>(std::round(period * multiple));
      if (multiple > 1u && target + 1u < max_lag_ && nsdf_[target] > best * .92)
        period = refined(target) / multiple;
      return rate_ / period;
    }
    return 0.0;
  }
  double pitchLevel(double frequency) const noexcept {
    if (frequency <= 0.0 || silent_)
      return -240.0;
    constexpr auto cents_ratio = 1.029302236643492;
    const auto bin_hz = rate_ / size_;
    double power = 0.0;
    for (auto harmonic = 1u; harmonic <= 16u; ++harmonic) {
      const auto partial = harmonic * frequency;
      if (!(partial < rate_ * 0.5))
        break;
      const auto center_bin = partial / bin_hz;
      const auto lower = std::min(partial / cents_ratio / bin_hz, center_bin - 2.0);
      const auto upper = std::max(partial * cents_ratio / bin_hz, center_bin + 2.0);
      const auto begin = static_cast<std::uint32_t>(std::floor(std::max(lower, 0.0)));
      const auto end = std::min(static_cast<std::uint32_t>(std::ceil(upper)), size_ / 2u);
      for (auto bin = begin; bin <= end; ++bin)
        power += volume_power_[bin];
    }
    const auto amplitude = std::sqrt(power * 4.0 / (size_ * static_cast<double>(window_)));
    if (amplitude <= 1e-12)
      return -240.0;
    const auto correction = 3.0 * std::log2(std::max(frequency, 100.0) / 100.0);
    return std::max(-240.0, 20.0 * std::log10(amplitude) + correction);
  }
  void publish() noexcept {
    double confidence = 0.0;
    const double frequency = silent_ ? 0.0 : select(confidence);
    previous_frequency_ = frequency;
    const double midi = frequency > 0 ? 69.0 + 12.0 * std::log2(frequency / reference_) : 0.0;
    const double level = pitchLevel(frequency);
    if (pending_count_ == kPending) {
      pending_read_ = (pending_read_ + 1u) % kPending;
      --pending_count_;
    }
    auto *payload = pending_[(pending_read_ + pending_count_) % kPending].data();
    binary_io::writeF32(payload, static_cast<float>(rate_));
    binary_io::writeF32(payload + 4u, static_cast<float>(time_));
    binary_io::writeF32(payload + 8u, static_cast<float>(hop_ / rate_));
    binary_io::writeU32(payload + 12u, frame_index_);
    binary_io::writeU32(payload + 16u, generation_);
    binary_io::writeF32(payload + 20u, static_cast<float>(frequency));
    binary_io::writeF32(payload + 24u, static_cast<float>(midi));
    binary_io::writeF32(payload + 28u, static_cast<float>((midi - std::round(midi)) * 100.0));
    binary_io::writeF32(payload + 32u, static_cast<float>(confidence));
    binary_io::writeF32(payload + 36u, static_cast<float>(level));
    binary_io::writeU16(payload + 40u, frequency > 0 ? 1u : 0u);
    binary_io::writeU16(payload + 42u, 0u);
    ++pending_count_;
  }
  std::array<Buffer, 4> buffers_;
  std::vector<std::unique_ptr<Transform>> transforms_;
  Transform *transform_ = nullptr;
  std::unique_ptr<Schedule> schedule_;
  std::vector<float> ring_, volume_power_;
  std::vector<double> prefix_, nsdf_;
  std::array<std::array<std::uint8_t, kPayloadBytes>, kPending> pending_{};
  double rate_ = 48000, reference_ = 440, minimum_ = 36, maximum_ = 96, min_period_ = 0,
         max_period_ = 0;
  double energy_ = 0, compensation_ = 0, previous_frequency_ = 0, time_ = 0;
  std::uint32_t max_window_ = 0, window_ = 0, max_lag_ = 0, capacity_ = 0, size_ = 0, hop_ = 480;
  std::uint32_t position_ = 0, origin_ = 0, filled_ = 0, until_hop_ = 480, until_slot_ = 16,
                slot_ = 0;
  std::uint32_t frame_index_ = 0, generation_ = 0, channels_ = 0, pending_read_ = 0,
                pending_count_ = 0;
  bool ready_ = false, sync_ = true, active_ = false, silent_ = true;
};
static_assert(sizeof(PitchMeterKernel) <= 8192u);
} // namespace effetune::plugins::analyzer
EFFETUNE_REGISTER_KERNEL(PitchMeterPlugin, effetune::plugins::analyzer::PitchMeterKernel)
