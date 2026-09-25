#include "effetune/kernel.h"

#include <array>
#include <cmath>
#include <cstddef>
#include <cstdint>
#include <cstdio>
#include <cstring>
#include <vector>

extern "C" const effetune::KernelDescriptor *et_kernel_descriptor_ChromaSpiralPlugin() noexcept;

namespace {

constexpr double kPi = 3.14159265358979323846264338327950288;
constexpr std::uint32_t kCells = 2048u;
constexpr std::uint32_t kPayloadBytes = 48u + kCells * 8u;
int failures = 0;

void check(bool condition, const char *expression, int line) noexcept {
  if (!condition) {
    std::fprintf(stderr, "chroma_spiral/native_test.cpp:%d: check failed: %s\n", line, expression);
    ++failures;
  }
}

#define CHROMA_CHECK(expression) check(static_cast<bool>(expression), #expression, __LINE__)

std::uint16_t readU16(const std::uint8_t *input) noexcept {
  return static_cast<std::uint16_t>(input[0]) |
         static_cast<std::uint16_t>(static_cast<std::uint16_t>(input[1]) << 8u);
}

std::uint32_t readU32(const std::uint8_t *input) noexcept {
  return static_cast<std::uint32_t>(input[0]) | (static_cast<std::uint32_t>(input[1]) << 8u) |
         (static_cast<std::uint32_t>(input[2]) << 16u) |
         (static_cast<std::uint32_t>(input[3]) << 24u);
}

float readF32(const std::uint8_t *input) noexcept {
  const std::uint32_t bits = readU32(input);
  float value = 0.0F;
  std::memcpy(&value, &bits, sizeof(value));
  return value;
}

struct Harness {
  alignas(std::max_align_t) std::array<std::byte, 8192u> storage{};
  std::array<std::uint8_t, 32768u> telemetry_storage{};
  std::array<std::uint8_t, 32768u> output{};
  const effetune::KernelDescriptor *descriptor = et_kernel_descriptor_ChromaSpiralPlugin();
  effetune::PluginKernel *kernel = nullptr;
  effetune::TelemetryRing ring;
  std::uint32_t sequence = 0u;

  explicit Harness(float sample_rate) {
    CHROMA_CHECK(descriptor != nullptr && descriptor->objectSize <= storage.size());
    CHROMA_CHECK(descriptor != nullptr && descriptor->paramsFloatCount == 0u);
    kernel = descriptor->construct(storage.data());
    ring.adopt(telemetry_storage.data(), static_cast<std::uint32_t>(telemetry_storage.size()));
    kernel->prepare({sample_rate, 4u, 257u});
  }

  ~Harness() { descriptor->destroy(kernel); }

  std::uint32_t read() {
    effetune::TelemetryWriter writer(ring, 73u, sequence);
    kernel->writeTelemetry(writer);
    std::uint32_t dropped = 0u;
    const auto bytes =
        ring.read(output.data(), static_cast<std::uint32_t>(output.size()), &dropped);
    CHROMA_CHECK(dropped == 0u);
    return bytes;
  }
};

std::vector<std::uint8_t> render(float sample_rate, std::uint32_t points,
                                 const std::vector<double> &tones,
                                 const std::vector<std::uint32_t> &blocks,
                                 std::uint32_t channels = 2u) {
  Harness harness(sample_rate);
  std::array<float, 257u * 4u> audio{};
  const auto total = static_cast<std::uint32_t>(sample_rate * 1.6F);
  std::uint32_t processed = 0u;
  std::uint32_t block_index = 0u;
  while (processed < total) {
    const auto requested = blocks[block_index++ % blocks.size()];
    const auto frames = requested < total - processed ? requested : total - processed;
    for (std::uint32_t frame = 0u; frame < frames; ++frame) {
      double value = 0.0;
      for (const double frequency : tones) {
        value += 0.2 * std::sin(2.0 * kPi * frequency * (processed + frame) / sample_rate);
      }
      for (std::uint32_t channel = 0u; channel < channels; ++channel) {
        audio[channel * frames + frame] = static_cast<float>(value);
      }
    }
    const auto original = audio;
    harness.kernel->process(audio.data(), channels, frames,
                            {static_cast<double>(processed) / sample_rate});
    CHROMA_CHECK(std::memcmp(audio.data(), original.data(), sizeof(float) * frames * channels) ==
                 0);
    processed += frames;
  }
  CHROMA_CHECK(harness.read() == 16u + kPayloadBytes);
  const auto *frame = harness.output.data();
  const auto *payload = frame + 16u;
  CHROMA_CHECK(readU16(frame) == 4u && readU16(frame + 2u) == 2u);
  CHROMA_CHECK(readU32(frame + 4u) == 73u);
  CHROMA_CHECK(readU16(frame + 12u) == kPayloadBytes);
  CHROMA_CHECK(readF32(payload) == sample_rate);
  CHROMA_CHECK(readU16(payload + 4u) == points);
  const auto fft_hop = (1u << points) / 2u;
  const auto rate_hop = static_cast<std::uint32_t>(std::ceil(sample_rate / 30.0));
  CHROMA_CHECK(readU32(payload + 8u) == (fft_hop > rate_hop ? fft_hop : rate_hop));
  CHROMA_CHECK(readU32(payload + 28u) == kCells);
  CHROMA_CHECK(readF32(payload + 32u) == 20.0F && readF32(payload + 36u) == 40000.0F);
  const auto first = readU32(payload + 40u);
  const auto count = readU32(payload + 44u);
  CHROMA_CHECK(first < kCells && count > 0u && first + count <= kCells);
  for (std::uint32_t index = 0u; index < kCells; ++index) {
    const float level = readF32(payload + 48u + index * 4u);
    const float peak = readF32(payload + 48u + (kCells + index) * 4u);
    CHROMA_CHECK(std::isfinite(level) && std::isfinite(peak));
    if (index < first || index >= first + count) {
      CHROMA_CHECK(level == -240.0F && peak == -240.0F);
    }
  }
  const std::vector<std::uint8_t> result(payload, payload + kPayloadBytes);
  CHROMA_CHECK(harness.read() == 0u);
  harness.kernel->reset();
  CHROMA_CHECK(harness.read() == 0u);
  return result;
}

void checkTonePeak(const std::vector<std::uint8_t> &payload, double frequency, bool local) {
  const double position = std::log(frequency / 20.0) / std::log(2000.0) * (kCells - 1u);
  const auto expected = static_cast<std::uint32_t>(std::round(position));
  const auto first = local ? expected - 25u : readU32(payload.data() + 40u);
  const auto end = local ? expected + 26u : first + readU32(payload.data() + 44u);
  std::uint32_t maximum = first;
  for (auto index = first + 1u; index < end; ++index) {
    if (readF32(payload.data() + 48u + index * 4u) > readF32(payload.data() + 48u + maximum * 4u)) {
      maximum = index;
    }
  }
  const double peak_frequency = 20.0 * std::exp(std::log(2000.0) * maximum / (kCells - 1u));
  const double bin_width = readF32(payload.data()) / (4.0 * (1u << readU16(payload.data() + 4u)));
  const double half_cell_width =
      frequency * (std::exp(std::log(2000.0) / (2.0 * (kCells - 1u))) - 1.0);
  // The unchanged HQ mapper resolves FFT bins, then samples the log-frequency grid.
  CHROMA_CHECK(std::abs(peak_frequency - frequency) <= bin_width / 2.0 + half_cell_width);
  CHROMA_CHECK(std::round(69.0 + 12.0 * std::log2(peak_frequency / 440.0)) ==
               std::round(69.0 + 12.0 * std::log2(frequency / 440.0)));
  CHROMA_CHECK(readF32(payload.data() + 48u + maximum * 4u) > -20.0F);
}

} // namespace

int main() {
  for (const float rate : {44100.0F, 96000.0F}) {
    const std::uint32_t points = rate == 44100.0F ? 13u : 14u;
    for (const double tone : {440.0, 65.40639132514966}) {
      const auto regular = render(rate, points, {tone}, {128u});
      const auto variable = render(rate, points, {tone}, {1u, 17u, 97u, 257u}, 1u);
      CHROMA_CHECK(regular == variable);
      checkTonePeak(regular, tone, false);
    }
    const std::vector<double> chord{261.6255653005986, 329.6275569128699, 391.9954359817493};
    const auto payload = render(rate, points, chord, {31u, 128u, 257u}, 4u);
    for (const double tone : chord) {
      checkTonePeak(payload, tone, true);
    }
  }
  for (const float rate : {48000.0F, 88200.0F, 192000.0F}) {
    render(rate, rate == 48000.0F ? 13u : 14u, {440.0}, {128u});
  }
  if (failures != 0) {
    return 1;
  }
  std::puts("All Chroma Spiral native tests passed");
  return 0;
}
