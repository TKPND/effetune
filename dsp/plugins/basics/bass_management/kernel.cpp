#include "effetune/kernel.h"
#include "BassManagementPluginParams.h"
#include "binary_io.h"
#include "effetune/dsp/biquad.h"
#include "effetune/dsp/partitioned_convolver.h"
#include "effetune/dsp/smoothing.h"
#include "nothrow_storage.h"

#include <array>
#include <bit>
#include <cmath>
#include <cstring>
#include <numbers>
#if defined(__wasm_simd128__)
#include <wasm_simd128.h>
#endif

namespace effetune::plugins::basics {
namespace {
constexpr std::uint32_t kChannels = 16u;
constexpr std::uint32_t kCapacity = 32u * 1024u * 1024u;
constexpr std::uint32_t kDelayCapacity = 16384u + 128u + 1u;
constexpr std::uint32_t kFade = 128u;
using Parameters = generated::BassManagementPluginParams;

std::uint32_t readU32(const std::uint8_t *p) noexcept {
  return static_cast<std::uint32_t>(p[0]) | (static_cast<std::uint32_t>(p[1]) << 8u) |
         (static_cast<std::uint32_t>(p[2]) << 16u) | (static_cast<std::uint32_t>(p[3]) << 24u);
}
bool integer(float value, float low, float high) noexcept {
  return std::isfinite(value) && value >= low && value <= high && std::floor(value) == value;
}
bool slope(float value) noexcept { return value == 24.0F || value == 48.0F || value == 96.0F; }
bool frequency(float value) noexcept { return std::isfinite(value) && value >= 20 && value <= 300; }
std::uint32_t taps(const Parameters &p) noexcept {
  return p.taps == 0.0F ? 8192u : p.taps == 2.0F ? 32768u : 16384u;
}
bool needsLowpass(const Parameters &p, std::uint32_t ch) noexcept {
  return p.roles[ch] == 1.0F || (p.roles[ch] == 2.0F && p.lfeLowpass == 1.0F);
}
bool valid(const Parameters &p, std::uint32_t channels) noexcept {
  if (!integer(p.phase, 0, 1) || !integer(p.taps, 0, 2) || !integer(p.subs, 0, 65535) ||
      !integer(p.lfeLowpass, 0, 1) || !frequency(p.lfeFrequency) || !slope(p.lfeSlope) ||
      !std::isfinite(p.bassGain) || p.bassGain < -24 || p.bassGain > 12 ||
      !std::isfinite(p.lfeGain) || p.lfeGain < -24 || p.lfeGain > 12 ||
      !std::isfinite(p.headroom) || p.headroom < -24 || p.headroom > 0)
    return false;
  const auto subs = static_cast<std::uint32_t>(p.subs);
  const std::uint32_t mask = (1u << channels) - 1u;
  if ((subs & ~mask) != 0u)
    return false;
  for (std::uint32_t ch = 0; ch < kChannels; ++ch) {
    if (!integer(p.roles[ch], 0, 3) || !integer(p.routes[ch], 0, 65535) ||
        !integer(p.routeInversions[ch], 0, 65535) ||
        (static_cast<std::uint32_t>(p.routeInversions[ch]) &
         ~static_cast<std::uint32_t>(p.routes[ch])) != 0u ||
        !frequency(p.frequencies[ch]) || !slope(p.slopes[ch]))
      return false;
    if (ch >= channels) {
      if (p.roles[ch] == 1 || p.roles[ch] == 2 || p.routes[ch] != 0)
        return false;
      continue;
    }
    if (p.roles[ch] <= 1 && (subs & (1u << ch)) != 0u)
      return false;
    const auto route = static_cast<std::uint32_t>(p.routes[ch]);
    if ((route & ~subs) != 0u || ((p.roles[ch] == 1 || p.roles[ch] == 2) && route == 0u))
      return false;
  }
  return true;
}
bool sameFilters(const Parameters &a, const Parameters &b, std::uint32_t channels) noexcept {
  if (a.phase != b.phase || (a.phase == 1 && a.taps != b.taps))
    return false;
  for (std::uint32_t ch = 0; ch < channels; ++ch) {
    const bool x = needsLowpass(a, ch), y = needsLowpass(b, ch);
    if (x != y)
      return false;
    if (x) {
      const float af = a.roles[ch] == 1 ? a.frequencies[ch] : a.lfeFrequency;
      const float bf = b.roles[ch] == 1 ? b.frequencies[ch] : b.lfeFrequency;
      const float as = a.roles[ch] == 1 ? a.slopes[ch] : a.lfeSlope;
      const float bs = b.roles[ch] == 1 ? b.slopes[ch] : b.lfeSlope;
      if (af != bf || as != bs)
        return false;
    }
  }
  return true;
}
bool sameRouting(const Parameters &a, const Parameters &b) noexcept {
  return a.subs == b.subs && std::memcmp(a.roles, b.roles, sizeof(a.roles)) == 0 &&
         std::memcmp(a.routes, b.routes, sizeof(a.routes)) == 0 &&
         std::memcmp(a.routeInversions, b.routeInversions, sizeof(a.routeInversions)) == 0;
}
struct Filter {
  std::array<dsp::BiquadCoefficients, 8> coefficients{};
  std::array<dsp::BiquadTdf2State, 8> states{};
  std::uint32_t count = 0;
  void design(double rate, double fc, int db, bool high) noexcept {
    count = static_cast<std::uint32_t>(db / 12);
    const auto order = count;
    const double k = std::tan(std::numbers::pi_v<double> * fc / rate);
    for (std::uint32_t i = 0; i < order / 2u; ++i) {
      const double q =
          1.0 / (2.0 * std::sin((2.0 * i + 1.0) * std::numbers::pi_v<double> / (2.0 * order)));
      const double denominator = 1 + k / q + k * k;
      const double b = (high ? 1.0 : k * k) / denominator;
      const dsp::BiquadCoefficients c{b, (high ? -2 : 2) * b, b, 2 * (k * k - 1) / denominator,
                                      (1 - k / q + k * k) / denominator};
      coefficients[i] = c;
      coefficients[i + order / 2u] = c;
    }
    states = {};
  }
  float process(float input) noexcept {
    double value = input;
    for (std::uint32_t i = 0; i < count; ++i) {
      value = dsp::processBiquadTdf2Sample(value, coefficients[i], states[i]);
      if (states[i].s1 > -1e-30 && states[i].s1 < 1e-30)
        states[i].s1 = 0;
      if (states[i].s2 > -1e-30 && states[i].s2 < 1e-30)
        states[i].s2 = 0;
    }
    return static_cast<float>(value);
  }
};
void addScaled(float *destination, const float *source, std::uint32_t frames,
               float scale) noexcept {
  std::uint32_t i = 0;
#if defined(__wasm_simd128__)
  const v128_t gain = wasm_f32x4_splat(scale);
  for (; i + 4u <= frames; i += 4u)
    wasm_v128_store(destination + i,
                    wasm_f32x4_add(wasm_v128_load(destination + i),
                                   wasm_f32x4_mul(wasm_v128_load(source + i), gain)));
#endif
  for (; i < frames; ++i)
    destination[i] += source[i] * scale;
}
} // namespace

class BassManagementKernel final : public PluginKernel {
  EFFETUNE_PARAMS(generated::BassManagementPluginParams)
public:
  static std::uint32_t assetCapacityForSlot(std::uint32_t slot) noexcept {
    return slot == 0 ? kCapacity : 0;
  }
  void prepare(const PrepareInfo &info) noexcept override {
    prepared_ = false;
    rate_ = info.sampleRate;
    channels_ = info.maxChannels < kChannels ? info.maxChannels : kChannels;
    frames_ = info.maxFrames;
    clearAsset(0);
    const std::size_t samples = static_cast<std::size_t>(channels_) * frames_;
    if (channels_ == 0 || frames_ == 0 || !std::isfinite(rate_) || rate_ <= 600 ||
        !input_.allocate(samples) || !low_.allocate(samples) || !main_.allocate(samples) ||
        !delay_.allocate(static_cast<std::size_t>(channels_) * kDelayCapacity) ||
        !lp_.allocate(2) || !hp_.allocate(2))
      return;
    prepared_ = true;
    configured_ = false;
    reset();
  }
  bool preparedSuccessfully() const noexcept override { return prepared_; }
  void setRandomSeed(std::uint32_t lo, std::uint32_t hi) noexcept override { salt_ = lo ^ hi; }
  void reset() noexcept override {
    delay_.clear();
    position_ = 0;
    convolver_.reset();
    for (std::size_t bank = 0; bank < lp_.size(); ++bank)
      for (auto &filter : lp_.data()[bank])
        filter.states = {};
    for (std::size_t bank = 0; bank < hp_.size(); ++bank)
      for (auto &filter : hp_.data()[bank])
        filter.states = {};
    const bool ready = resident_ && convolver_.state() == dsp::ConvolverPreparationState::active;
    mix_ = ready ? 1.0F : 0.0F;
    history_ = ready ? latency_ : 0;
    transition_ = 0;
    frequency_fade_ = 0;
    if (asset_state_ == ET_ASSET_STATE_ACTIVE && !ready)
      asset_state_ = ET_ASSET_STATE_PREPARING;
    gains_initialized_ = false;
  }
  std::uint32_t latencySamples() const noexcept override {
    if (!configured_) {
      const Parameters &p = params_pending_ ? staged_params_ : params_;
      return p.phase == 1 ? taps(p) / 2u + 128u : 0;
    }
    return latency_;
  }
  std::uint32_t assetCapacity(std::uint32_t slot) const noexcept override {
    return assetCapacityForSlot(slot);
  }
  std::uint32_t assetState(std::uint32_t slot) const noexcept override {
    if (slot != 0)
      return ET_ASSET_STATE_NONE;
    return asset_state_ | (reason_ << 8u) | (mix_ == 0 ? 1u << 16u : 0u);
  }
  void clearAsset(std::uint32_t slot) noexcept override {
    if (slot != 0)
      return;
    convolver_.clear();
    payload_.release();
    resident_ = false;
    asset_state_ = ET_ASSET_STATE_NONE;
    reason_ = 0;
    mix_ = 0;
  }
  std::uint8_t *beginAsset(std::uint32_t slot, const AssetBeginInfo &info) noexcept override {
    applyPendingParameters();
    Parameters requested = params_;
    // The host stages replacements while the resident filter is held dry.
    if (requested.phase == -1)
      requested.phase = 1;
    if (slot != 0 || !prepared_ || info.processingChannels == 0 ||
        info.processingChannels > channels_ || !valid(requested, info.processingChannels) ||
        requested.phase != 1 || info.frames != taps(requested) || info.topology != 4 ||
        info.headBlock != 128 || info.rateDivider != 1 ||
        info.inputCount != info.processingChannels ||
        info.channels != lowpassCount(requested, info.processingChannels) || info.channels == 0 ||
        info.pathCount != info.channels || info.footprintBytes > kCapacity ||
        info.footprintBytes < info.byteSize ||
        static_cast<std::uint64_t>(info.byteSize) !=
            32u + static_cast<std::uint64_t>(info.channels) *
                      (12u + static_cast<std::uint64_t>(info.frames) * 4u))
      return nullptr;
    // Reject before releasing the resident convolver whenever admission can be checked in advance.
    NothrowStorage<std::uint8_t> probe;
    if (!probe.allocate(static_cast<std::size_t>(info.footprintBytes) + 1024u * 1024u))
      return nullptr;
    probe.release();
    candidate_ = requested;
    begin_ = info;
    convolver_.clear();
    resident_ = false;
    mix_ = 0;
    active_ = candidate_;
    active_channels_ = info.processingChannels;
    configured_ = true;
    latency_ = taps(active_) / 2u + 128u;
    dsp::ConvolverConfig config;
    config.inputs = config.outputs = info.processingChannels;
    config.irChannels = info.channels;
    config.irFrames = info.frames;
    config.latencySamples = 128;
    config.sliceOffset = salt_;
    config.pathCount = info.channels;
    std::uint32_t index = 0;
    for (std::uint32_t ch = 0; ch < info.processingChannels; ++ch)
      if (needsLowpass(candidate_, ch))
        config.paths[index] = {ch, ch, index}, ++index;
    if (!payload_.allocate(info.byteSize / 4u) || !convolver_.reserve(config) ||
        convolver_.memoryBytes() + info.byteSize + workingBytes() > kCapacity ||
        convolver_.memoryBytes() + info.byteSize > info.footprintBytes) {
      failAsset(2);
      return nullptr;
    }
    asset_state_ = ET_ASSET_STATE_STAGED;
    reason_ = 0;
    return reinterpret_cast<std::uint8_t *>(payload_.data());
  }
  et_status commitAsset(std::uint32_t slot, std::uint32_t bytes,
                        std::uint32_t tag) noexcept override {
    if (slot != 0 || asset_state_ != ET_ASSET_STATE_STAGED)
      return ET_ERR_STATE;
    const auto *data = reinterpret_cast<const std::uint8_t *>(payload_.data());
    bool correct = bytes == begin_.byteSize && tag == ET_ASSET_F32_MULTICH &&
                   readU32(data) == 0x31415445u && readU32(data + 4) == begin_.channels &&
                   readU32(data + 8) == begin_.frames &&
                   readU32(data + 12) == static_cast<std::uint32_t>(std::lround(rate_)) &&
                   readU32(data + 16) == 4 && readU32(data + 20) == begin_.pathCount &&
                   readU32(data + 24) == 0 && readU32(data + 28) == 0;
    std::uint32_t index = 0;
    for (std::uint32_t ch = 0; correct && ch < begin_.processingChannels; ++ch) {
      if (!needsLowpass(candidate_, ch))
        continue;
      const auto *path = data + 32u + index * 12u;
      correct = readU32(path) == ch && readU32(path + 4u) == ch && readU32(path + 8u) == index;
      ++index;
    }
    const float *ir = payload_.data() + 8u + begin_.pathCount * 3u;
    const std::size_t count = static_cast<std::size_t>(begin_.channels) * begin_.frames;
    for (std::size_t i = 0; correct && i < count; ++i)
      correct = std::isfinite(ir[i]);
    if (!correct) {
      failAsset(1);
      return ET_ERR_ARGS;
    }
    if (!convolver_.commit(ir, begin_.channels, begin_.frames)) {
      failAsset(3);
      return ET_ERR_STATE;
    }
    asset_params_ = candidate_;
    resident_ = true;
    asset_channels_ = begin_.processingChannels;
    asset_state_ = ET_ASSET_STATE_PREPARING;
    history_ = 0;
    return ET_OK;
  }
  void process(float *audio, std::uint32_t channels, std::uint32_t frames,
               const ProcessInfo &) noexcept override {
    telemetry_channels_ = channels;
    if (!prepared_ || !audio || channels == 0 || channels > channels_ || frames == 0 ||
        frames > frames_)
      return;
    updateConfiguration(channels);
    const bool linear = active_.phase == 1;
    const bool usable = linear && resident_ && asset_channels_ == channels &&
                        sameFilters(active_, asset_params_, channels);
    const std::size_t bytes = static_cast<std::size_t>(channels) * frames * sizeof(float);
    std::memcpy(input_.data(), audio, bytes);
    std::memcpy(low_.data(), audio, bytes);
    if (usable) {
      const auto before = convolver_.state();
      convolver_.process(low_.data(), channels, frames);
      if (before == dsp::ConvolverPreparationState::active ||
          before == dsp::ConvolverPreparationState::warming)
        history_ += frames;
      if (convolver_.state() == dsp::ConvolverPreparationState::active &&
          history_ >= latency_ + frames)
        asset_state_ = ET_ASSET_STATE_ACTIVE;
      if (convolver_.state() == dsp::ConvolverPreparationState::error) {
        resident_ = false;
        asset_state_ = ET_ASSET_STATE_ERROR;
        reason_ = 3;
      }
    }
    const bool ready = !linear || lowpassCount(active_, channels) == 0 ||
                       (usable && asset_state_ == ET_ASSET_STATE_ACTIVE);
    updateGains();
    for (std::uint32_t frame = 0; frame < frames; ++frame) {
      const float bg = static_cast<float>(bass_gain_.next());
      const float lg = static_cast<float>(lfe_gain_.next());
      const float hg = static_cast<float>(head_gain_.next());
      const bool dry = params_.phase == -1 || !ready;
      const float target = dry ? 0.0F : 1.0F;
      if (mix_ < target)
        mix_ = mix_ + 1.0F / kFade > 1 ? 1 : mix_ + 1.0F / kFade;
      if (mix_ > target)
        mix_ = mix_ - 1.0F / kFade < 0 ? 0 : mix_ - 1.0F / kFade;
      float structuralGain = 1;
      if (transition_ != 0) {
        structuralGain = transition_ > kFade ? static_cast<float>(transition_ - kFade) / kFade
                                             : 1 - static_cast<float>(transition_) / kFade;
      }
      for (std::uint32_t ch = 0; ch < channels; ++ch) {
        const std::size_t i = static_cast<std::size_t>(ch) * frames + frame;
        const float input = input_.data()[i];
        float *ring = delay_.data() + static_cast<std::size_t>(ch) * kDelayCapacity;
        ring[position_] = input;
        const std::uint32_t read = (position_ + kDelayCapacity - latency_) % kDelayCapacity;
        const float delayed = ring[read];
        float low = 0, high = delayed;
        if (needsLowpass(active_, ch)) {
          if (linear) {
            low = usable && ready ? low_.data()[i] : 0;
            high = delayed - low;
          } else {
            low = lp_.data()[bank_][ch].process(input);
            high = hp_.data()[bank_][ch].process(input);
            if (frequency_fade_ != 0) {
              const float blend = 1 - static_cast<float>(frequency_fade_) / kFade;
              const float otherLow = lp_.data()[1u - bank_][ch].process(input);
              const float otherHigh = hp_.data()[1u - bank_][ch].process(input);
              low += (otherLow - low) * blend;
              high += (otherHigh - high) * blend;
            }
          }
        }
        const float role = active_.roles[ch];
        const bool sub = integer(active_.subs, 0, 65535) &&
                         (static_cast<std::uint32_t>(active_.subs) & (1u << ch)) != 0;
        main_.data()[i] =
            !sub && role <= 1
                ? (role == 1 ? delayed + (high - delayed) * mix_ : delayed) * hg * structuralGain
                : 0;
        low_.data()[i] = (role == 1   ? low * bg
                          : role == 2 ? (active_.lfeLowpass == 1 ? low : delayed) * lg
                                      : 0) *
                         mix_ * hg * structuralGain;
      }
      position_ = (position_ + 1u) % kDelayCapacity;
      if (frequency_fade_ != 0 && --frequency_fade_ == 0)
        bank_ = 1u - bank_;
      if (transition_ != 0 && transition_ != kFade)
        --transition_;
    }
    std::memcpy(audio, main_.data(), bytes);
    // All inputs have been consumed before any Sub output is assembled.
    for (std::uint32_t ch = 0; ch < channels; ++ch) {
      if (active_.roles[ch] != 1 && active_.roles[ch] != 2)
        continue;
      if (!integer(active_.routes[ch], 1, 65535))
        continue;
      const auto routes = static_cast<std::uint32_t>(active_.routes[ch]);
      const auto inversions = static_cast<std::uint32_t>(active_.routeInversions[ch]);
      const float weight = 1.0F / static_cast<float>(std::popcount(routes));
      for (std::uint32_t out = 0; out < channels; ++out)
        if ((routes & (1u << out)) != 0)
          addScaled(audio + static_cast<std::size_t>(out) * frames,
                    low_.data() + static_cast<std::size_t>(ch) * frames, frames,
                    (inversions & (1u << out)) != 0u ? -weight : weight);
    }
  }
  void writeTelemetry(TelemetryWriter &writer) noexcept override {
    std::array<std::uint8_t, 4> bytes{};
    binary_io::writeU32(bytes.data(), telemetry_channels_);
    writer.write(9, 1, bytes.data(), 4);
  }

private:
  static std::uint32_t lowpassCount(const Parameters &p, std::uint32_t channels) noexcept {
    std::uint32_t count = 0;
    for (std::uint32_t ch = 0; ch < channels; ++ch)
      if (needsLowpass(p, ch))
        ++count;
    return count;
  }
  std::size_t workingBytes() const noexcept {
    return (input_.size() + low_.size() + main_.size() + delay_.size()) * sizeof(float) +
           (lp_.size() + hp_.size()) * sizeof(std::array<Filter, kChannels>);
  }
  void failAsset(std::uint32_t reason) noexcept {
    convolver_.clear();
    payload_.release();
    resident_ = false;
    mix_ = 0;
    asset_state_ = ET_ASSET_STATE_ERROR;
    reason_ = reason;
  }
  void design(std::uint32_t bank, const Parameters &p, std::uint32_t channels) noexcept {
    for (std::uint32_t ch = 0; ch < channels; ++ch) {
      if (!needsLowpass(p, ch))
        continue;
      const float fc = p.roles[ch] == 1 ? p.frequencies[ch] : p.lfeFrequency;
      const int db = static_cast<int>(p.roles[ch] == 1 ? p.slopes[ch] : p.lfeSlope);
      lp_.data()[bank][ch].design(rate_, fc, db, false);
      hp_.data()[bank][ch].design(rate_, fc, db, true);
    }
  }
  void activate(const Parameters &p, std::uint32_t channels) noexcept {
    active_ = p;
    active_channels_ = channels;
    configured_ = true;
    latency_ = p.phase == 1 ? taps(p) / 2u + 128u : 0;
    if (p.phase == 0) {
      design(bank_, p, channels);
      mix_ = 1;
    } else if (!resident_ || !sameFilters(p, asset_params_, channels))
      mix_ = 0;
  }
  void updateConfiguration(std::uint32_t channels) noexcept {
    Parameters requested = params_;
    if (requested.subs == 0) {
      // No destination means routing is not configured; keep every input audible.
      for (std::uint32_t ch = 0; ch < kChannels; ++ch) {
        requested.roles[ch] = 0;
        requested.routes[ch] = 0;
        requested.routeInversions[ch] = 0;
      }
    }
    const bool requestedValid = valid(requested, channels);
    if (!configured_ || active_channels_ != channels) {
      if (requestedValid)
        activate(requested, channels);
      else {
        active_ = requested;
        active_channels_ = channels;
        configured_ = true;
        active_.bassGain = active_.lfeGain = active_.headroom = 0;
        latency_ = requested.phase == 1 ? taps(requested) / 2u + 128u : 0;
        for (std::uint32_t ch = 0; ch < kChannels; ++ch) {
          active_.routes[ch] = 0;
          if (active_.roles[ch] == 1)
            active_.roles[ch] = 0;
        }
        mix_ = 0;
      }
      delay_.clear();
      position_ = 0;
      transition_ = 0;
      frequency_fade_ = 0;
      return;
    }
    if (transition_ == kFade) {
      activate(pending_, channels);
      transition_ = kFade - 1u;
    }
    if (!requestedValid || transition_ != 0)
      return;
    if (active_.phase == 1 && requested.phase == 1 && !sameFilters(active_, requested, channels) &&
        lowpassCount(requested, channels) != 0)
      return;
    if (!sameRouting(active_, requested) || active_.phase != requested.phase ||
        active_.lfeLowpass != requested.lfeLowpass ||
        (active_.phase == 1 && active_.taps != requested.taps)) {
      pending_ = requested;
      transition_ = 2u * kFade;
      return;
    }
    if (active_.phase == 0 && !sameFilters(active_, requested, channels)) {
      if (frequency_fade_ != 0)
        return;
      design(1u - bank_, requested, channels);
      frequency_fade_ = kFade;
    }
    active_ = requested;
  }
  void updateGains() noexcept {
    const double bg = std::pow(10.0, active_.bassGain / 20.0);
    const double lg = std::pow(10.0, active_.lfeGain / 20.0);
    const double hg = std::pow(10.0, active_.headroom / 20.0);
    if (!gains_initialized_) {
      bass_gain_.reset(bg);
      lfe_gain_.reset(lg);
      head_gain_.reset(hg);
      gains_initialized_ = true;
    }
    if (bass_gain_.target() != bg)
      bass_gain_.setTarget(bg, kFade);
    if (lfe_gain_.target() != lg)
      lfe_gain_.setTarget(lg, kFade);
    if (head_gain_.target() != hg)
      head_gain_.setTarget(hg, kFade);
  }
  Parameters active_{}, pending_{}, candidate_{}, asset_params_{};
  bool prepared_ = false, configured_ = false, resident_ = false, gains_initialized_ = false;
  float rate_ = 48000, mix_ = 0;
  std::uint32_t channels_ = 0, frames_ = 0, active_channels_ = 0, asset_channels_ = 0;
  std::uint32_t position_ = 0, latency_ = 0, salt_ = 0, telemetry_channels_ = 0;
  std::uint32_t asset_state_ = ET_ASSET_STATE_NONE, reason_ = 0, transition_ = 0,
                frequency_fade_ = 0, bank_ = 0;
  std::uint64_t history_ = 0;
  AssetBeginInfo begin_{};
  NothrowStorage<float> input_, low_, main_, delay_, payload_;
  dsp::PartitionedConvolver convolver_;
  NothrowStorage<std::array<Filter, kChannels>> lp_, hp_;
  dsp::LinearSmoother bass_gain_, lfe_gain_, head_gain_;
};
} // namespace effetune::plugins::basics
EFFETUNE_REGISTER_KERNEL(BassManagementPlugin, effetune::plugins::basics::BassManagementKernel)
