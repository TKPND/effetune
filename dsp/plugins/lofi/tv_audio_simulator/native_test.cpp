// Numeric television audio, channel selection, and realtime lifecycle checks.
#include "TVAudioSimulatorPluginParams.h"
#include "allocation_guard.h"
#include "effetune/kernel.h"
#include "effetune/telemetry.h"

#include <array>
#include <cmath>
#include <cstddef>
#include <cstdint>
#include <cstdio>
#include <cstring>
#include <vector>

extern "C" const effetune::KernelDescriptor *et_kernel_descriptor_TVAudioSimulatorPlugin() noexcept;

namespace {
using Params = effetune::generated::TVAudioSimulatorPluginParams;
constexpr double kTwoPi = 6.283185307179586476925286766559;
int failures = 0;
void check(bool condition, const char *message) {
  if (!condition) {
    std::fprintf(stderr, "TV audio check failed: %s\n", message);
    ++failures;
  }
}
Params defaults(int standard = 0) {
  return {1.0F,   static_cast<float>(standard),
          0.0F,   0.0F,
          60.0F,  0.0F,
          230.0F, 0.0F,
          5.0F,   0.0F,
          1.0F,   -80.0F,
          0.0F,   100.0F};
}
class Harness {
public:
  explicit Harness(float rate = 96000.0F) {
    descriptor = et_kernel_descriptor_TVAudioSimulatorPlugin();
    check(descriptor != nullptr && descriptor->objectSize <= storage.size(),
          "kernel descriptor/storage");
    kernel = descriptor->construct(storage.data());
    kernel->prepare({rate, 4u, 128u});
    check(kernel->preparedSuccessfully(), "supported sample rate prepares");
    kernel->setRandomSeed(12345u, 67890u);
  }
  ~Harness() { descriptor->destroy(kernel); }
  void stage(const Params &params) {
    check(kernel->stageParameters(&params.broadcast, Params::kFloatCount, Params::kHash) == ET_OK,
          "parameter contract");
  }
  void process(float *data, std::uint32_t frames = 128u, std::uint32_t channels = 2u) {
    effetune::allocation_guard::Scope scope;
    kernel->applyPendingParameters();
    kernel->process(data, channels, frames, {0.0});
  }
  std::array<float, 5> telemetry(std::array<float, 48> *spectrum = nullptr) {
    std::array<std::uint8_t, 1024> ring_storage{}, output{};
    effetune::TelemetryRing ring;
    ring.adopt(ring_storage.data(), 1024u);
    std::uint32_t sequence = 0u, dropped = 0u;
    effetune::TelemetryWriter writer(ring, 0u, sequence);
    kernel->writeTelemetry(writer);
    const auto size = ring.read(output.data(), 1024u, &dropped);
    check(size == 232u && dropped == 0u && output[0] == 25u, "independent TV telemetry frame");
    std::array<float, 5> values{};
    std::memcpy(values.data(), output.data() + 16u, 20u);
    if (spectrum != nullptr) {
      std::memcpy(spectrum->data(), output.data() + 40u, sizeof(*spectrum));
    }
    for (float value : values)
      check(std::isfinite(value), "finite telemetry");
    return values;
  }
  effetune::PluginKernel *kernel = nullptr;

private:
  alignas(std::max_align_t) std::array<std::byte, 8192> storage{};
  const effetune::KernelDescriptor *descriptor = nullptr;
};

struct ToneResult {
  double left, right, rms;
};
ToneResult tone(Harness &h, const Params &params, double rate, double frequency, double left_gain,
                double right_gain, double seconds = 0.3) {
  h.stage(params);
  const auto frames_total = static_cast<std::uint32_t>(rate * seconds);
  const auto start = frames_total / 2u;
  double lr = 0.0, li = 0.0, rr = 0.0, ri = 0.0, energy = 0.0;
  std::uint32_t count = 0;
  for (std::uint32_t offset = 0; offset < frames_total;) {
    const auto frames = frames_total - offset < 128u ? frames_total - offset : 128u;
    std::array<float, 256> audio{};
    for (std::uint32_t i = 0; i < frames; ++i) {
      const double sine = std::sin(kTwoPi * frequency * (offset + i) / rate);
      audio[i] = static_cast<float>(left_gain * sine);
      audio[frames + i] = static_cast<float>(right_gain * sine);
    }
    h.process(audio.data(), frames);
    for (std::uint32_t i = 0; i < frames; ++i) {
      check(std::isfinite(audio[i]) && std::isfinite(audio[frames + i]), "finite audio");
      if (offset + i < start)
        continue;
      const double phase = kTwoPi * frequency * (offset + i) / rate;
      lr += audio[i] * std::cos(phase);
      li += audio[i] * std::sin(phase);
      rr += audio[frames + i] * std::cos(phase);
      ri += audio[frames + i] * std::sin(phase);
      const double sample = audio[i];
      energy += sample * sample;
      ++count;
    }
    offset += frames;
  }
  return {2.0 * std::sqrt(lr * lr + li * li) / count, 2.0 * std::sqrt(rr * rr + ri * ri) / count,
          std::sqrt(energy / count)};
}

void testStandards() {
  for (int standard = 0; standard < 8; ++standard) {
    Harness h;
    auto params = defaults(standard);
    const auto result = tone(h, params, 96000.0, 1000.0, 0.12, 0.0);
    std::printf("standard %d 1k left %.6f right %.6f rms %.6f\n", standard, result.left,
                result.right, result.rms);
    check(result.left > 0.03 && result.left < 0.2, "nominal gain remains useful");
    if (standard < 6)
      check(result.right < result.left * 0.35, "stereo channel separation at 1 kHz");
    else
      check(std::abs(result.left - result.right) < 1.0e-5,
            "mono standards duplicate the main channel");
    h.telemetry();
  }
  for (int standard : {0, 2, 3, 4, 5}) {
    Harness h;
    auto params = defaults(standard);
    params.txMode = 2;
    params.receiveMode = 3;
    const auto result = tone(h, params, 96000.0, 1000.0, 0.0, 0.12);
    check(result.left > 0.07 && result.left < 0.18, "Dual/Sub recovers second programme");
    check(std::abs(result.left - result.right) < 1.0e-5, "Sub is mono");
  }
  for (int standard : {1, 6, 7}) {
    Harness h;
    auto params = defaults(standard);
    params.txMode = 2;
    params.receiveMode = 3;
    const auto result = tone(h, params, 96000.0, 1000.0, 0.12, 0.0);
    check(result.left > 0.08 && std::abs(result.left - result.right) < 1.0e-5,
          "unsupported Dual/Sub uses main mono");
  }
  for (int standard : {0, 2, 3}) {
    for (double frequency : {1000.0, 5000.0, 10000.0}) {
      Harness h;
      const auto result = tone(h, defaults(standard), 96000.0, frequency, 0.0, 0.08);
      std::printf("secondary standard %d %.0f Hz leakage %.6f wanted %.6f\n", standard, frequency,
                  result.left, result.right);
      check(result.left < 0.12 * result.right,
            "FM subchannel alignment maintains separation through 10 kHz");
    }
  }
  {
    Harness h;
    const auto result = tone(h, defaults(), 96000.0, 12000.0, 0.08, 0.0);
    const double residual = result.rms * result.rms - 0.5 * result.left * result.left;
    const double distortion = residual > 0.0 ? std::sqrt(2.0 * residual) / result.left : 0.0;
    std::printf("EIA-J 12k magnitude %.6f residual ratio %.6f\n", result.left, distortion);
    check(result.left > 0.05 && distortion < 0.15,
          "EIA-J upper audio band survives the MPX resampler");
  }
}

void testRatesAndLifecycle() {
  for (float rate :
       {44100.0F, 48000.0F, 88200.0F, 96000.0F, 176400.0F, 192000.0F, 352800.0F, 384000.0F}) {
    for (int standard : {0, 3, 5, 7}) {
      Harness h(rate);
      auto params = defaults(standard);
      params.multipath = 30;
      params.fading = 2;
      params.pathDelay = 50;
      const auto result = tone(h, params, rate, 1000.0, 0.08, 0.06, 0.035);
      check(result.rms < 4.0, "all-rate output stays bounded");
      params.mix = 0;
      h.kernel->reset();
      h.stage(params);
      const auto latency = h.kernel->latencySamples();
      for (std::uint32_t i = 0; i < latency + 2u; ++i) {
        std::array<float, 2> impulse{i == 0u ? 1.0F : 0.0F, 0.0F};
        h.process(impulse.data(), 1u);
        check(impulse[0] == (i == latency ? 1.0F : 0.0F), "mix zero follows reported dry delay");
      }
    }
  }
}

void testDigitalFallbackAndBuzz() {
  Harness h;
  auto p = defaults(5);
  tone(h, p, 96000, 1000, 0.1, 0.0);
  check(h.telemetry()[2] > 0.9F && h.telemetry()[3] > 0.99F, "strong NICAM locks digitally");
  p.signal = 20;
  tone(h, p, 96000, 1000, 0.1, 0.0);
  check(std::abs(h.telemetry()[2] - 2.0F / 3.0F) < 0.01F, "NICAM first conceals isolated errors");
  p.signal = 16;
  tone(h, p, 96000, 1000, 0.1, 0.0);
  check(std::abs(h.telemetry()[2] - 1.0F / 3.0F) < 0.01F, "NICAM mutes before analogue fallback");
  p.signal = 0;
  tone(h, p, 96000, 1000, 0.1, 0.0);
  check(h.telemetry()[2] < 0.1F && h.telemetry()[3] < 0.01F,
        "weak NICAM falls back to analogue mono");
  p.signal = 60;
  tone(h, p, 96000, 1000, 0.1, 0.0);
  check(h.telemetry()[2] > 0.9F && h.telemetry()[3] > 0.99F, "NICAM reacquires with hysteresis");
  p.broadcast = 0;
  tone(h, p, 96000, 1000, 0.1, 0.0);
  check(h.telemetry()[2] == 0.0F && h.telemetry()[3] < 0.01F, "off-air disables digital audio");
  for (int standard : {0, 6}) {
    Harness buzz;
    p = defaults(standard);
    p.txMode = 1;
    p.buzz = -20;
    const auto result = tone(buzz, p, 96000, standard == 0 ? 60.0 : 50.0, 0, 0);
    check(result.left > 0.07 && result.left < 0.14, "video buzz follows field frequency");
  }
}

void testReceptionMeasurements() {
  double strong_secondary_snr = 0.0;
  for (float signal : {60.0F, 25.0F, 15.0F}) {
    for (float receive : {2.0F, 3.0F}) {
      Harness h;
      auto p = defaults(3);
      p.txMode = 2;
      p.receiveMode = receive;
      p.signal = signal;
      const auto result = tone(h, p, 96000, 1000, 0.08, 0.08);
      const double residual = result.rms * result.rms - 0.5 * result.left * result.left;
      const double snr =
          residual > 1.0e-15 ? 20.0 * std::log10(result.left / std::sqrt(2.0 * residual)) : 120.0;
      std::printf("A2 signal %.0f receive %.0f SNR %.2f dB\n", signal, receive, snr);
      if (signal == 60 && receive == 3)
        strong_secondary_snr = snr;
      if (signal == 15 && receive == 3)
        check(snr < strong_secondary_snr - 10.0, "A2 secondary degrades with RF reception");
    }
  }
  for (double amplitude : {0.03, 0.12, 0.3}) {
    Harness h;
    const auto result = tone(h, defaults(1), 96000, 1000, amplitude, -amplitude);
    const double gain = result.left / amplitude;
    std::printf("BTSC L-R input %.2f steady gain %.4f\n", amplitude, gain);
    check(gain > 0.65 && gain < 1.25, "BTSC companding retains programme level over a 20 dB range");
  }
}

void testModeContinuity() {
  Harness h;
  auto p = defaults();
  float previous = 0.0F;
  double maximum_step = 0.0;
  for (std::uint32_t block = 0u; block < 400u; ++block) {
    p.standard = static_cast<float>((block / 50u) % 8u);
    p.txMode = static_cast<float>((block / 17u) % 3u);
    p.receiveMode = static_cast<float>((block / 11u) % 4u);
    h.stage(p);
    std::array<float, 256> audio{};
    for (std::uint32_t i = 0u; i < 128u; ++i) {
      const double phase = kTwoPi * 1000.0 * (block * 128u + i) / 96000.0;
      audio[i] = static_cast<float>(0.1 * std::sin(phase));
      audio[128u + i] = static_cast<float>(0.07 * std::cos(phase));
    }
    h.process(audio.data());
    for (std::uint32_t i = 0u; i < 128u; ++i) {
      const double step = std::abs(static_cast<double>(audio[i]) - previous);
      if (step > maximum_step)
        maximum_step = step;
      previous = audio[i];
    }
  }
  std::printf("mode switches maximum adjacent step %.6f\n", maximum_step);
  check(maximum_step < 0.05, "programme and standard changes preserve a continuous output");
}

void testIneffectiveReceiveChanges() {
  // Each row describes one audible route shared by the listed receive choices.
  struct Case {
    int standard, tx;
    std::array<int, 4> receives;
  };
  constexpr std::array<Case, 12> cases{{{0, 1, {0, 1, 2, 3}},
                                        {1, 1, {0, 1, 2, 3}},
                                        {2, 1, {0, 1, 2, 3}},
                                        {3, 1, {0, 1, 2, 3}},
                                        {4, 1, {0, 1, 2, 3}},
                                        {5, 1, {0, 1, 2, 3}},
                                        {6, 0, {0, 1, 2, 3}},
                                        {7, 0, {0, 1, 2, 3}},
                                        {1, 2, {0, 1, 2, 3}},
                                        {0, 2, {0, 1, 2, 0}},
                                        {0, 0, {2, 3, 2, 3}},
                                        {5, 0, {0, 1, 0, 1}}}};
  for (const auto &item : cases) {
    Harness unchanged, changed;
    auto original = defaults(item.standard);
    original.txMode = static_cast<float>(item.tx);
    original.receiveMode = static_cast<float>(item.receives[0]);
    unchanged.stage(original);
    changed.stage(original);
    bool identical = true;
    for (std::uint32_t block = 0u; block < 100u; ++block) {
      if (block >= 20u && block % 20u == 0u) {
        auto altered = original;
        altered.receiveMode = static_cast<float>(item.receives[(block / 20u) % 4u]);
        changed.stage(altered);
      }
      std::array<float, 256> reference{};
      for (std::uint32_t i = 0u; i < 128u; ++i) {
        const double phase = kTwoPi * 1000.0 * (block * 128u + i) / 96000.0;
        reference[i] = static_cast<float>(0.1 * std::sin(phase));
        reference[128u + i] = static_cast<float>(0.07 * std::cos(phase));
      }
      auto actual = reference;
      unchanged.process(reference.data());
      changed.process(actual.data());
      identical = identical && actual == reference;
    }
    check(identical, "inaudible receive choices leave the running audio bit-exact");
  }
}
void testSpectrumLifecycleAndAudioIsolation() {
  Harness reference(48000.0F), observed(48000.0F);
  constexpr std::array<std::uint32_t, 7> quanta{8u, 16u, 32u, 64u, 128u, 13u, 1u};
  std::uint32_t absolute = 0u;
  std::array<float, 48> spectrum{};
  for (int standard : {0, 4, 7, 1}) {
    reference.stage(defaults(standard));
    observed.stage(defaults(standard));
    bool completed = false;
    for (std::uint32_t block = 0u; block < 100u; ++block) {
      const std::uint32_t frames = quanta[block % quanta.size()];
      std::array<float, 256> original{};
      for (std::uint32_t frame = 0u; frame < frames; ++frame) {
        original[frame] = original[frames + frame] =
            static_cast<float>(0.2 * std::sin(kTwoPi * 1000.0 * (absolute + frame) / 48000.0));
      }
      auto actual = original;
      reference.process(original.data(), frames);
      observed.process(actual.data(), frames);
      observed.telemetry(&spectrum);
      check(actual == original, "spectrum capture and analysis leave TV audio bit-exact");
      bool empty = true;
      for (float value : spectrum) {
        check(std::isfinite(value), "distributed spectrum is finite");
        empty = empty && value == -140.0F;
      }
      if (block == 0u) {
        check(empty, "standard change discards previous spectrum and pending work");
      }
      completed = completed || !empty;
      absolute += frames;
    }
    check(completed, "spectrum completes at MPX and NICAM host capture rates");
  }
  observed.kernel->reset();
  std::array<float, 256> silent{};
  observed.process(silent.data(), 8u);
  observed.telemetry(&spectrum);
  for (float value : spectrum) {
    check(value == -140.0F, "kernel reset discards the old completed spectrum");
  }
}
} // namespace

int main() {
  testSpectrumLifecycleAndAudioIsolation();
  testStandards();
  testRatesAndLifecycle();
  testDigitalFallbackAndBuzz();
  testReceptionMeasurements();
  testModeContinuity();
  testIneffectiveReceiveChanges();
  return failures == 0 ? 0 : 1;
}
