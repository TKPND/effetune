#ifndef EFFETUNE_DSP_TELEMETRY_SPECTRUM_H
#define EFFETUNE_DSP_TELEMETRY_SPECTRUM_H

#include <array>
#include <cmath>
#include <cstdint>
#include <vector>

namespace effetune::dsp {

// Shared FM/TV HUD analyzer. Capture one requested window, then keep it fixed
// while spreading the Goertzel recurrence over subsequent host audio frames.
class TelemetrySpectrum final {
public:
  static constexpr std::uint32_t kBins = 48u;
  static constexpr std::uint32_t kWindow = 1024u;
  static constexpr std::uint32_t kStepsPerFrame = 64u;

  void prepare(double sample_rate, double maximum_hz) {
    windowed_.resize(kWindow);
    hann_.resize(kWindow);
    double sum = 0.0;
    for (std::uint32_t index = 0u; index < kWindow; ++index) {
      const double window = 0.5 - 0.5 * std::cos(kTwoPi * static_cast<double>(index) /
                                                 static_cast<double>(kWindow - 1u));
      hann_[index] = static_cast<float>(window);
      sum += window;
    }
    inverse_window_sum_ = sum > 0.0 ? 2.0 / sum : 0.0;
    configure(sample_rate, maximum_hz);
  }

  void configure(double sample_rate, double maximum_hz) noexcept {
    const double ratio = std::log(maximum_hz / 300.0) / static_cast<double>(kBins - 1u);
    for (std::uint32_t bin = 0u; bin < kBins; ++bin) {
      const double frequency = 300.0 * std::exp(ratio * static_cast<double>(bin));
      coefficients_[bin] = 2.0 * std::cos(kTwoPi * frequency / sample_rate);
    }
    // A new frequency grid must never publish an old or partly computed window.
    reset();
  }

  void reset() noexcept {
    active_ = false;
    completed_.fill(-140.0F);
  }

  void request() noexcept {
    if (active_) {
      return;
    }
    active_ = true;
    captured_ = 0u;
    bin_ = 0u;
    position_ = 0u;
    s1_ = s2_ = 0.0;
  }

  void capture(float sample) noexcept {
    if (active_ && captured_ < kWindow) {
      windowed_[captured_] = sample * hann_[captured_];
      ++captured_;
    }
  }

  void process(std::uint32_t host_frames) noexcept {
    if (!active_ || captured_ != kWindow) {
      return;
    }
    std::uint64_t remaining = static_cast<std::uint64_t>(host_frames) * kStepsPerFrame;
    while (remaining != 0u && active_) {
      const double coefficient = coefficients_[bin_];
      const std::uint32_t available = kWindow - position_;
      const auto count = remaining < available ? static_cast<std::uint32_t>(remaining) : available;
      const std::uint32_t end = position_ + count;
      for (; position_ < end; ++position_) {
        const double s0 = static_cast<double>(windowed_[position_]) + coefficient * s1_ - s2_;
        s2_ = s1_;
        s1_ = s0;
      }
      remaining -= count;
      if (position_ != kWindow) {
        continue;
      }
      double power = s1_ * s1_ + s2_ * s2_ - coefficient * s1_ * s2_;
      if (power < 0.0) {
        power = 0.0;
      }
      double magnitude = std::sqrt(power) * inverse_window_sum_;
      if (magnitude < 1.0e-7) {
        magnitude = 1.0e-7;
      }
      const float db = static_cast<float>(20.0 * std::log10(magnitude));
      pending_[bin_] = db > 20.0F ? 20.0F : db;
      if (++bin_ == kBins) {
        completed_ = pending_;
        active_ = false;
      }
      position_ = 0u;
      s1_ = s2_ = 0.0;
    }
  }

  [[nodiscard]] const std::array<float, kBins> &values() const noexcept { return completed_; }

private:
  static constexpr double kTwoPi = 6.283185307179586476925286766559;
  std::vector<float> windowed_;
  std::vector<float> hann_;
  std::array<double, kBins> coefficients_{};
  std::array<float, kBins> pending_{};
  std::array<float, kBins> completed_{};
  double inverse_window_sum_ = 0.0;
  double s1_ = 0.0;
  double s2_ = 0.0;
  std::uint32_t captured_ = 0u;
  std::uint32_t bin_ = 0u;
  std::uint32_t position_ = 0u;
  bool active_ = false;
};

} // namespace effetune::dsp

#endif
