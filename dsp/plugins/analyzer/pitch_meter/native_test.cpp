#include "allocation_guard.h"
#include "effetune/kernel.h"
#include <algorithm>
#include <array>
#include <cmath>
#include <cstdio>
#include <cstring>
#include <vector>

extern "C" const effetune::KernelDescriptor *et_kernel_descriptor_PitchMeterPlugin() noexcept;
namespace {
constexpr double pi = 3.14159265358979323846;
int failures = 0;
void check(bool ok, const char *text, int line) {
  if (!ok) {
    std::fprintf(stderr, "pitch_meter:%d %s\n", line, text);
    ++failures;
  }
}
#define CHECK(x) check(static_cast<bool>(x), #x, __LINE__)
std::uint32_t u32(const std::uint8_t *p) {
  return p[0] | (std::uint32_t(p[1]) << 8u) | (std::uint32_t(p[2]) << 16u) |
         (std::uint32_t(p[3]) << 24u);
}
float f32(const std::uint8_t *p) {
  auto bits = u32(p);
  float value;
  std::memcpy(&value, &bits, 4);
  return value;
}
struct Frame {
  float time, frequency, midi, cents, confidence, level;
  std::uint32_t index, generation;
  bool voiced;
};
struct Harness {
  alignas(std::max_align_t) std::array<std::byte, 8192> storage{};
  const effetune::KernelDescriptor *descriptor = et_kernel_descriptor_PitchMeterPlugin();
  effetune::PluginKernel *kernel;
  std::vector<std::uint8_t> ring_bytes = std::vector<std::uint8_t>(65536),
                            bytes = std::vector<std::uint8_t>(65536);
  effetune::TelemetryRing ring;
  std::uint32_t sequence = 0;
  explicit Harness(float rate, float minimum = 36, float maximum = 96, float reference = 440) {
    CHECK(descriptor->objectSize <= storage.size());
    CHECK(descriptor->paramsFloatCount == 3u);
    kernel = descriptor->construct(storage.data());
    kernel->prepare({rate, 4u, 1024u});
    CHECK(kernel->preparedSuccessfully());
    const std::array params = {reference, minimum, maximum};
    CHECK(kernel->stageParameters(params.data(), 3u, descriptor->paramsHash) == ET_OK);
    kernel->applyPendingParameters();
    ring.adopt(ring_bytes.data(), static_cast<std::uint32_t>(ring_bytes.size()));
  }
  ~Harness() { descriptor->destroy(kernel); }
  std::vector<Frame> take() {
    effetune::TelemetryWriter writer(ring, 207u, sequence);
    {
      const effetune::allocation_guard::Scope guard;
      kernel->writeTelemetry(writer);
    }
    std::uint32_t dropped = 0;
    const auto size = ring.read(bytes.data(), static_cast<std::uint32_t>(bytes.size()), &dropped);
    CHECK(dropped == 0u);
    CHECK(size % 60u == 0u);
    std::vector<Frame> frames;
    for (auto offset = 0u; offset < size; offset += 60u) {
      const auto *h = bytes.data() + offset;
      const auto *p = h + 16;
      CHECK(h[0] == 26u && h[2] == 1u && h[12] == 44u);
      frames.push_back({f32(p + 4), f32(p + 20), f32(p + 24), f32(p + 28), f32(p + 32), f32(p + 36),
                        u32(p + 12), u32(p + 16), (p[40] & 1u) != 0u});
    }
    return frames;
  }
};
enum Signal {
  Sine,
  Harmonics,
  Odd,
  Missing,
  Decay,
  Tremolo,
  Inharmonic,
  Vibrato,
  Glide,
  White20,
  Pink20,
  White10,
  Pink10,
  Silence,
  Noise,
  Background,
  Notes
};
const char *names[] = {"sine",       "harmonics", "odd",   "missing",   "decay",  "tremolo",
                       "inharmonic", "vibrato",   "glide", "white20",   "pink20", "white10",
                       "pink10",     "silence",   "noise", "background"};
std::vector<Frame> run(Harness &h, float rate, double midi, Signal signal,
                       const std::vector<std::uint32_t> &blocks = {97u, 113u, 89u},
                       std::uint32_t channels = 2u, bool cancel = false, double gain = 1.0) {
  const auto count = static_cast<std::uint32_t>(rate * .65);
  const auto frequency = 440.0 * std::exp2((midi - 69.0) / 12.0);
  std::uint32_t random = 12345u, processed = 0u, block = 0u;
  double phase = 0.0, pink_sum = 0.0, amplitude = 0.0, amplitude_target = 0.0;
  const auto randomSample = [&random]() {
    random ^= random << 13u;
    random ^= random >> 17u;
    random ^= random << 5u;
    return static_cast<double>(random) / 4294967296.0 * 2.0 - 1.0;
  };
  std::array<double, 12> pink_rows{};
  for (auto &row : pink_rows) {
    row = randomSample();
    pink_sum += row;
  }
  std::vector<Frame> result;
  while (processed < count) {
    const auto size = std::min(blocks[block++ % blocks.size()], count - processed);
    std::vector<float> audio(static_cast<std::size_t>(channels) * size);
    for (auto i = 0u; i < size; ++i) {
      const double time = static_cast<double>(processed + i) / rate;
      double cents = signal == Vibrato ? 50.0 * std::sin(2.0 * pi * 6.0 * time)
                                       : (signal == Glide ? 1200.0 * time : 0.0);
      if (signal == Notes)
        cents = time < .2 ? 0.0 : (time < .4 ? 100.0 : 1200.0);
      const double f = frequency * std::exp2(cents / 1200.0);
      double value = 0.0;
      for (int harmonic = signal == Missing ? 2 : 1; harmonic <= (signal == Sine ? 1 : 8);
           ++harmonic) {
        if ((signal == Odd && harmonic % 2 == 0) || harmonic * f >= rate * .45)
          continue;
        const double stretch =
            signal == Inharmonic ? std::sqrt(1.0 + .001 * harmonic * harmonic) : 1.0;
        value += .15 / harmonic * std::sin(phase * harmonic * stretch);
      }
      phase += 2.0 * pi * f / rate;
      if (signal == Decay)
        value *= std::exp(-3.0 * time);
      const double noise = randomSample();
      if (signal == Tremolo) {
        if ((processed + i) % static_cast<std::uint32_t>(rate * .1) == 0u)
          amplitude_target = noise;
        amplitude += (amplitude_target - amplitude) * (40.0 / rate);
        value *= std::exp2(amplitude);
      }
      // Voss-McCartney octaves plus white noise give a bounded 1/f test source.
      auto counter = processed + i + 1u;
      std::size_t row = 0u;
      while ((counter & 1u) == 0u && row + 1u < pink_rows.size()) {
        counter >>= 1u;
        ++row;
      }
      pink_sum -= pink_rows[row];
      pink_rows[row] = randomSample();
      pink_sum += pink_rows[row];
      const double pink = (pink_sum + noise) / std::sqrt(13.0);
      if (signal == White20 || signal == White10)
        value += noise * (signal == White20 ? .022 : .07);
      if (signal == Pink20 || signal == Pink10)
        value += pink * (signal == Pink20 ? .022 : .07);
      if (signal == Silence)
        value = 0.0;
      if (signal == Noise)
        value = noise * .2;
      if (signal == Background)
        value += .02 * (std::sin(2 * pi * 130.81 * time) + std::sin(2 * pi * 164.81 * time) +
                        std::sin(2 * pi * 196 * time));
      value *= gain;
      for (auto ch = 0u; ch < channels; ++ch)
        audio[ch * size + i] =
            static_cast<float>(ch > 1u ? .37 : ((cancel && ch == 1u) ? -value : value));
    }
    const auto original = audio;
    {
      const effetune::allocation_guard::Scope guard;
      h.kernel->process(audio.data(), channels, size, {static_cast<double>(processed) / rate});
    }
    CHECK(std::memcmp(original.data(), audio.data(), audio.size() * sizeof(float)) == 0);
    auto frames = h.take();
    result.insert(result.end(), frames.begin(), frames.end());
    processed += size;
  }
  return result;
}
void evaluate(float rate, double midi, Signal signal, bool extended = false) {
  Harness harness(rate, extended ? 21.0F : 36.0F, extended ? 108.0F : 96.0F);
  const auto frames = run(harness, rate, midi, signal);
  CHECK(!frames.empty());
  const double min_frequency = 440.0 * std::exp2(((extended ? 21.0 : 36.0) - 69.0) / 12.0);
  const double window = std::ceil(std::max(3.1 * rate / min_frequency + 4.0, rate * .015)) / rate;
  std::vector<double> errors;
  if (signal == Sine || signal == Harmonics || signal == Odd || signal == Missing) {
    const auto onset = std::find_if(frames.begin(), frames.end(), [midi](const auto &frame) {
      return frame.voiced && std::abs(frame.midi - midi) < .5;
    });
    CHECK(onset != frames.end());
    if (onset != frames.end())
      CHECK(onset->time <= window + .011);
  }
  int voiced = 0, total = 0, gross = 0, octave = 0;
  for (const auto &frame : frames) {
    CHECK(std::isfinite(frame.frequency) && std::isfinite(frame.level));
    CHECK(frame.confidence >= 0 && frame.confidence <= 1);
    if (frame.time < window + .03)
      continue;
    ++total;
    if (!frame.voiced) {
      CHECK(frame.frequency == 0 && frame.midi == 0 && frame.cents == 0 && frame.confidence == 0);
      continue;
    }
    ++voiced;
    double truth = midi * 100.0;
    if (signal == Vibrato)
      truth += 50.0 *
               (std::cos(2 * pi * 6 * (frame.time - window)) - std::cos(2 * pi * 6 * frame.time)) /
               (2 * pi * 6 * window);
    if (signal == Glide)
      truth += 1200.0 * (frame.time - window * .5);
    if (signal == Inharmonic)
      truth += 600.0 * std::log2(1.001);
    const double error = std::abs(1200.0 * std::log2(frame.frequency / 440.0) + 6900.0 - truth);
    errors.push_back(error);
    if (error > 50)
      ++gross;
    if (std::abs(error - 1200.0) < 50)
      ++octave;
  }
  std::sort(errors.begin(), errors.end());
  const double median = errors.empty() ? 0 : errors[errors.size() / 2];
  const double p95 =
      errors.empty() ? 0 : errors[static_cast<std::size_t>((errors.size() - 1) * .95)];
  std::printf("%g Hz midi=%g %s detection=%d/%d median=%.3f p95=%.3f gross=%d octave=%d\n", rate,
              midi, names[signal], voiced, total, median, p95, gross, octave);
  if (signal == Background)
    return;
  if (signal == Silence || signal == Noise) {
    CHECK(voiced <= total * .01);
    return;
  }
  CHECK(voiced >= total * ((signal == White10 || signal == Pink10) ? .90 : .95));
  CHECK(gross <= voiced * ((signal == White10 || signal == Pink10)
                               ? .05
                               : (signal == White20 || signal == Pink20
                                      ? .02
                                      : (signal == Vibrato || signal == Glide ? .01 : .005))));
  if (signal == Inharmonic || signal == White10 || signal == Pink10)
    return;
  CHECK(
      p95 <=
      (signal == Vibrato || signal == Glide || signal == White20 || signal == Pink20 ? 5.0 : 3.0));
  if (signal <= Tremolo)
    CHECK(median <= 1.0);
}
} // namespace
int main() {
  Harness volume_a4(48000), volume_quiet(48000), volume_a1(48000, 21), volume_silence(48000);
  const auto a4_level = run(volume_a4, 48000, 69, Sine).back().level;
  const auto quiet_level =
      run(volume_quiet, 48000, 69, Sine, {97u, 113u, 89u}, 2u, false, 0.1).back().level;
  const auto a1_level = run(volume_a1, 48000, 33, Sine, {97u, 113u, 89u}).back().level;
  const auto silence_level = run(volume_silence, 48000, 69, Silence).back().level;
  std::printf("pitch volume A4 %.3f dB, quiet %.3f dB, A1 %.3f dB\n", a4_level, quiet_level,
              a1_level);
  CHECK(std::abs(a4_level - (20.0 * std::log10(.15) + 3.0 * std::log2(440.0 / 100.0))) < 1.5);
  CHECK(std::abs((quiet_level - a4_level) + 20.0) < 0.5);
  CHECK(std::abs((a4_level - a1_level) - 3.0 * std::log2(440.0 / 100.0)) < 1.5);
  CHECK(silence_level == -240.0F);
  for (const auto rate : {48000.0F, 96000.0F, 192000.0F}) {
    for (const auto midi : {36.0, 60.0, 84.0, 96.0})
      for (int signal = Sine; signal <= Background; ++signal) {
        if ((signal == Glide && midi > 84) || (signal == Vibrato && (midi == 36 || midi == 96)))
          continue;
        evaluate(rate, midi, static_cast<Signal>(signal));
      }
    evaluate(rate, 21, Sine, true);
    evaluate(rate, 108, Sine, true);
  }
  Harness first(96000), second(96000);
  const auto a = run(first, 96000, 60, Harmonics, {128u});
  const auto b = run(second, 96000, 60, Harmonics);
  CHECK(a.size() == b.size());
  for (std::size_t i = 0; i < std::min(a.size(), b.size()); ++i) {
    CHECK(a[i].index == b[i].index && a[i].generation == b[i].generation);
    CHECK(a[i].frequency == b[i].frequency && a[i].time == b[i].time);
  }
  Harness cancel(48000);
  for (const auto &frame : run(cancel, 48000, 60, Harmonics, {97u}, 4u, true))
    CHECK(!frame.voiced);
  Harness sequence(96000);
  const auto notes = run(sequence, 96000, 60, Notes);
  for (const auto change : {.2, .4}) {
    const double expected = change < .3 ? 61 : 72;
    const auto detected =
        std::find_if(notes.begin(), notes.end(), [change, expected](const auto &frame) {
          return frame.time >= change && frame.voiced && std::abs(frame.midi - expected) < .5;
        });
    CHECK(detected != notes.end());
    if (detected != notes.end())
      CHECK(detected->time - change < .058);
  }
  const auto old_generation = a.back().generation;
  first.kernel->reset();
  CHECK(first.take().empty());
  const auto reset_frames = run(first, 96000, 60, Sine);
  CHECK(reset_frames.back().generation > old_generation);
  first.kernel->prepare({48000, 4u, 1024u});
  const auto prepared = run(first, 48000, 69, Sine);
  CHECK(prepared.back().voiced && std::abs(prepared.back().frequency - 440.0F) < .1F);
  const std::array<float, 3> changed = {442.0F, 72.0F, 36.0F};
  CHECK(first.kernel->stageParameters(changed.data(), 3u, first.descriptor->paramsHash) == ET_OK);
  first.kernel->applyPendingParameters();
  const auto changed_frames = run(first, 48000, 72, Sine);
  CHECK(changed_frames.back().generation > prepared.back().generation);
  CHECK(changed_frames.back().voiced);
  CHECK(std::abs(changed_frames.back().midi - (72.0 + 12.0 * std::log2(440.0 / 442.0))) < .01);
  return failures ? 1 : 0;
}
