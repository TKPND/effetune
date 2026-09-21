#include "BassExtenderPluginParams.h"
#include "allocation_guard.h"
#include "effetune/kernel.h"

#include <algorithm>
#include <array>
#include <cmath>
#include <cstddef>
#include <cstdint>
#include <cstdio>
#include <vector>

extern "C" const effetune::KernelDescriptor *et_kernel_descriptor_BassExtenderPlugin() noexcept;
namespace {
constexpr double kPi = 3.14159265358979323846;
using Params = effetune::generated::BassExtenderPluginParams;
int failures = 0;
void check(bool ok, const char *message) {
  if (!ok) {
    std::fprintf(stderr, "Bass Extender: %s\n", message);
    ++failures;
  }
}
class Harness final {
public:
  explicit Harness(float rate) {
    descriptor_ = et_kernel_descriptor_BassExtenderPlugin();
    check(descriptor_->objectSize <= storage_.size(), "storage capacity");
    kernel_ = descriptor_->construct(storage_.data());
    kernel_->prepare({rate, 2, 257});
    kernel_->reset();
    check(kernel_->preparedSuccessfully(), "prepared");
    check(kernel_->latencySamples() == 0, "zero dry latency");
  }
  ~Harness() { descriptor_->destroy(kernel_); }
  void stage(float amount, float output = 0) {
    Params p{amount, output};
    check(kernel_->stageParameters(&p.amount, Params::kFloatCount, Params::kHash) == ET_OK,
          "stage");
    kernel_->applyPendingParameters();
  }
  void reset() { kernel_->reset(); }
  std::vector<float> render(const std::vector<float> &input, std::uint32_t channels = 1,
                            std::uint32_t block_size = 127) {
    const auto frames = static_cast<std::uint32_t>(input.size() / channels);
    std::vector<float> output(input.size()), block(static_cast<std::size_t>(block_size) * channels);
    for (std::uint32_t start = 0; start < frames; start += block_size) {
      const auto count = std::min(block_size, frames - start);
      for (std::uint32_t ch = 0; ch < channels; ++ch)
        std::copy_n(input.data() + ch * frames + start, count, block.data() + ch * count);
      {
        effetune::allocation_guard::Scope scope;
        kernel_->process(block.data(), channels, count, {0});
      }
      for (std::uint32_t ch = 0; ch < channels; ++ch)
        std::copy_n(block.data() + ch * count, count, output.data() + ch * frames + start);
    }
    return output;
  }

private:
  alignas(std::max_align_t) std::array<std::byte, 8192> storage_{};
  const effetune::KernelDescriptor *descriptor_ = nullptr;
  effetune::PluginKernel *kernel_ = nullptr;
};
std::vector<float> tone(double rate, double frequency, double phase = 0, double seconds = 1) {
  std::vector<float> audio(static_cast<std::size_t>(rate * seconds));
  for (std::size_t n = 0; n < audio.size(); ++n)
    audio[n] = static_cast<float>(
        0.25 * std::sin(2 * kPi * frequency * static_cast<double>(n) / rate + phase));
  return audio;
}
double amplitude(const std::vector<float> &audio, double rate, double frequency) {
  double re = 0, im = 0, weight = 0;
  const auto start = audio.size() / 2;
  for (std::size_t n = start; n < audio.size(); ++n) {
    const double phase = 2 * kPi * frequency * static_cast<double>(n) / rate;
    const double window = 0.5 - 0.5 * std::cos(2 * kPi * static_cast<double>(n - start) /
                                               static_cast<double>(audio.size() - start));
    re += window * audio[n] * std::cos(phase);
    im += window * audio[n] * std::sin(phase);
    weight += window;
  }
  return 2 * std::sqrt(re * re + im * im) / weight;
}
std::vector<float> difference(std::vector<float> output, const std::vector<float> &input) {
  for (std::size_t n = 0; n < output.size(); ++n)
    output[n] -= input[n];
  return output;
}
void testTones() {
  for (const float rate : {44100.0F, 48000.0F, 96000.0F, 192000.0F}) {
    for (const double frequency :
         {60.0, 70.0, 80.0, 82.0, 95.0, 108.0, 112.0, 130.0, 146.0, 150.0, 170.0, 200.0}) {
      for (const double phase : {0.0, 1.7}) {
        Harness h(rate);
        h.stage(100);
        const auto input = tone(rate, frequency, phase);
        const auto wet = difference(h.render(input), input);
        const double sub = amplitude(wet, rate, frequency * 0.5);
        const double third = amplitude(wet, rate, frequency * 1.5);
        std::printf("tone %.0f %.0f phase %.1f: sub %.6f third %.6f\n", rate, frequency, phase, sub,
                    third);
        check(sub > 0.105 && sub < 0.24, "bounded octave-down generation without band holes");
        check(third < sub * 0.15, "suppressed third modulation harmonic");
        check(amplitude(wet, rate, 0) < 0.003, "suppressed DC");
      }
    }
  }
}
void testStateAndMix() {
  constexpr float rate = 48000;
  const auto input = tone(rate, 100);
  Harness h(rate);
  h.stage(0);
  check(h.render(input) == input, "amount zero exact dry");
  h.reset();
  h.stage(100);
  const auto whole = h.render(input, 1, 257);
  h.reset();
  check(h.render(input, 1, 1) == whole, "one-sample blocks and reset replay");
  std::vector<float> stereo(input.size() * 2);
  for (std::size_t n = 0; n < input.size(); ++n) {
    stereo[n] = input[n];
    stereo[input.size() + n] = -input[n];
  }
  h.reset();
  check(h.render(stereo, 2) == stereo, "antiphase dry remains unchanged");
  for (std::size_t n = 0; n < input.size(); ++n)
    stereo[input.size() + n] = input[n] * 0.5F;
  h.reset();
  const auto wet = difference(h.render(stereo, 2), stereo);
  for (std::size_t n = 0; n < input.size(); ++n)
    check(std::abs(wet[n] - wet[input.size() + n]) < 4e-8F, "shared stereo generated signal");
  std::vector<float> mixed = input;
  std::uint32_t rng = 91;
  for (std::size_t n = 0; n < mixed.size(); ++n) {
    rng = rng * 1664525u + 1013904223u;
    const double t = static_cast<double>(n) / rate;
    mixed[n] +=
        static_cast<float>(0.15 * std::sin(2 * kPi * 107 * t) + 0.15 * std::sin(2 * kPi * 200 * t) +
                           0.1 * std::exp(-12 * t) * std::sin(2 * kPi * 65 * t) +
                           0.05 * (static_cast<double>(rng) / 2147483648.0 - 1));
  }
  mixed.resize(input.size() * 3, 0);
  h.reset();
  const auto output = h.render(mixed);
  for (const float sample : output)
    check(std::isfinite(sample) && std::abs(sample) < 1.5F, "mixed transient and noise bounded");
  check(*std::max_element(output.end() - 4800, output.end()) < 1e-6F &&
            *std::min_element(output.end() - 4800, output.end()) > -1e-6F,
        "decay to silence");
  h.reset();
  check(h.render(std::vector<float>(48000, 0)) == std::vector<float>(48000, 0), "silent reset");
  h.reset();
  h.stage(25, -6);
  const auto quiet = h.render(input);
  check(amplitude(quiet, rate, 100) < 0.127, "output gain applies to dry signal");
  h.stage(0);
  const auto switched = h.render(input);
  for (std::size_t n = 1000; n < switched.size(); ++n)
    check(switched[n] == input[n], "smoothed controls reach exact dry");
}
} // namespace
int main() {
  testTones();
  testStateAndMix();
  return failures == 0 ? 0 : 1;
}
