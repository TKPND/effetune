#include "effetune/kernel.h"
#include "BassExtenderPluginParams.h"
#include "effetune/dsp/biquad.h"
#include "effetune/dsp/smoothing.h"

#include <array>
#include <cmath>
#include <cstdint>

#if defined(__wasm_simd128__)
#include <wasm_simd128.h>
#endif

namespace effetune::plugins::saturation {
namespace {
constexpr double kPi = 3.1415926535897932384626433832795;
constexpr std::array<double, 5> kEdges{60.0, 81.072, 109.545, 148.017, 200.0};

// Two double-precision SIMD vectors preserve low-frequency pole accuracy at 192 kHz.
struct FilterBank final {
  std::array<double, 4> b0{}, b1{}, b2{}, a1{}, a2{}, s1{}, s2{};
  void set(std::size_t band, const dsp::BiquadCoefficients &c) noexcept {
    b0[band] = c.b0;
    b1[band] = c.b1;
    b2[band] = c.b2;
    a1[band] = c.a1;
    a2[band] = c.a2;
  }
  void reset() noexcept {
    s1.fill(0.0);
    s2.fill(0.0);
  }
  void process(std::array<double, 4> &samples) noexcept {
#if defined(__wasm_simd128__)
    for (std::size_t band = 0; band < 4; band += 2) {
      const v128_t x = wasm_v128_load(samples.data() + band);
      const v128_t y = wasm_f64x2_add(wasm_f64x2_mul(wasm_v128_load(b0.data() + band), x),
                                      wasm_v128_load(s1.data() + band));
      const v128_t next1 =
          wasm_f64x2_add(wasm_f64x2_sub(wasm_f64x2_mul(wasm_v128_load(b1.data() + band), x),
                                        wasm_f64x2_mul(wasm_v128_load(a1.data() + band), y)),
                         wasm_v128_load(s2.data() + band));
      const v128_t next2 = wasm_f64x2_sub(wasm_f64x2_mul(wasm_v128_load(b2.data() + band), x),
                                          wasm_f64x2_mul(wasm_v128_load(a2.data() + band), y));
      wasm_v128_store(s1.data() + band, next1);
      wasm_v128_store(s2.data() + band, next2);
      wasm_v128_store(samples.data() + band, y);
    }
#else
    for (std::size_t band = 0; band < 4; ++band) {
      const double x = samples[band];
      const double y = b0[band] * x + s1[band];
      s1[band] = b1[band] * x - a1[band] * y + s2[band];
      s2[band] = b2[band] * x - a2[band] * y;
      samples[band] = y;
    }
#endif
  }
};

dsp::BiquadCoefficients bandpass(double frequency, double q, double rate) noexcept {
  const double omega = 2.0 * kPi * frequency / rate;
  const double alpha = std::sin(omega) / (2.0 * q);
  const double inverse = 1.0 / (1.0 + alpha);
  return {alpha * inverse, 0.0, -alpha * inverse, -2.0 * std::cos(omega) * inverse,
          (1.0 - alpha) * inverse};
}

struct Divider final {
  dsp::AttackReleaseEnvelope envelope;
  dsp::OnePole fade;
  double sign = 1.0;
  std::uint32_t elapsed = 0, minimum_period = 0, maximum_period = 0;
  bool armed = false, have_crossing = false, qualified = false;
  void reset() noexcept {
    envelope.reset();
    fade.reset();
    sign = 1.0;
    elapsed = 0;
    armed = false;
    have_crossing = false;
    qualified = false;
  }
  double process(double input) noexcept {
    const double level = envelope.process(input < 0.0 ? -input : input);
    const double threshold = level * 0.05 + 1.0e-7;
    if (elapsed <= maximum_period)
      ++elapsed;
    if (level < 1.0e-5 || elapsed > maximum_period) {
      qualified = false;
      if (level < 1.0e-5) {
        have_crossing = false;
        armed = false;
      }
    }
    if (level >= 1.0e-5) {
      if (input < -threshold)
        armed = true;
      if (armed && input > threshold) {
        qualified = have_crossing && elapsed >= minimum_period && elapsed <= maximum_period;
        if (qualified)
          sign = -sign;
        have_crossing = true;
        elapsed = 0;
        armed = false;
      }
    }
    return input * sign * fade.process(qualified ? 1.0 : 0.0);
  }
};
} // namespace

class BassExtenderKernel final : public PluginKernel {
  EFFETUNE_PARAMS(generated::BassExtenderPluginParams)
public:
  void prepare(const PrepareInfo &info) override {
    const double rate = info.sampleRate;
    prepared_ = (rate == 44100.0 || rate == 48000.0 || rate == 88200.0 || rate == 96000.0 ||
                 rate == 176400.0 || rate == 192000.0) &&
                info.maxChannels > 0u && info.maxFrames > 0u;
    max_channels_ = info.maxChannels;
    if (!prepared_)
      return;
    ramp_frames_ = static_cast<std::uint32_t>(rate * 0.01);
    for (std::size_t band = 0; band < 4; ++band) {
      const double center = std::sqrt(kEdges[band] * kEdges[band + 1]);
      for (FilterBank &filter : analysis_)
        filter.set(band, bandpass(center, 2.0, rate));
      for (FilterBank &filter : synthesis_)
        filter.set(band, bandpass(center * 0.5, 1.0, rate));
      Divider &divider = dividers_[band];
      divider.minimum_period = static_cast<std::uint32_t>(rate / (kEdges[band + 1] * 1.08));
      divider.maximum_period = static_cast<std::uint32_t>(std::ceil(rate / (kEdges[band] / 1.08)));
      divider.envelope.setTimesMilliseconds(3.0, 35.0, rate);
      divider.fade.setTimeMilliseconds(12.0, rate);
    }
    reset();
  }
  [[nodiscard]] bool preparedSuccessfully() const noexcept override { return prepared_; }
  void reset() noexcept override {
    for (FilterBank &filter : analysis_)
      filter.reset();
    for (FilterBank &filter : synthesis_)
      filter.reset();
    for (Divider &divider : dividers_)
      divider.reset();
    last_channels_ = 0;
    controls_initialized_ = false;
  }
  void process(float *audio, std::uint32_t channels, std::uint32_t frames,
               const ProcessInfo &) noexcept override {
    if (!prepared_ || audio == nullptr || channels == 0u || channels > 2u ||
        channels > max_channels_)
      return;
    if (channels != last_channels_) {
      reset();
      last_channels_ = channels;
    }
    const double amount = static_cast<double>(params_.amount) * 0.01;
    const double output = std::pow(10.0, static_cast<double>(params_.outputGain) / 20.0);
    if (!controls_initialized_) {
      amount_.reset(amount);
      output_.reset(output);
      controls_initialized_ = true;
    }
    if (amount_.target() != amount)
      amount_.setTarget(amount, ramp_frames_);
    if (output_.target() != output)
      output_.setTarget(output, ramp_frames_);
    for (std::uint32_t frame = 0; frame < frames; ++frame) {
      const double input =
          channels == 1u
              ? audio[frame]
              : (static_cast<double>(audio[frame]) + static_cast<double>(audio[frames + frame])) *
                    0.5;
      std::array<double, 4> bands{input, input, input, input};
      for (FilterBank &filter : analysis_)
        filter.process(bands);
      for (std::size_t band = 0; band < 4; ++band)
        bands[band] = dividers_[band].process(bands[band]);
      for (FilterBank &filter : synthesis_)
        filter.process(bands);
      const double wet = (bands[0] + bands[1] + bands[2] + bands[3]) * amount_.next();
      const double gain = output_.next();
      for (std::uint32_t channel = 0; channel < channels; ++channel) {
        const std::size_t offset = static_cast<std::size_t>(channel) * frames + frame;
        audio[offset] = static_cast<float>((static_cast<double>(audio[offset]) + wet) * gain);
      }
    }
  }

private:
  std::array<FilterBank, 2> analysis_{}, synthesis_{};
  std::array<Divider, 4> dividers_{};
  dsp::LinearSmoother amount_, output_;
  std::uint32_t ramp_frames_ = 0, max_channels_ = 0, last_channels_ = 0;
  bool controls_initialized_ = false, prepared_ = false;
};
} // namespace effetune::plugins::saturation

EFFETUNE_REGISTER_KERNEL(BassExtenderPlugin, effetune::plugins::saturation::BassExtenderKernel)
