#include "SpatialMapperPluginParams.h"
#include "allocation_guard.h"
#include "effetune/kernel.h"

#include <algorithm>
#include <array>
#include <cmath>
#include <cstddef>
#include <cstdint>
#include <cstdio>
#include <cstring>
#include <vector>

extern "C" const effetune::KernelDescriptor *et_kernel_descriptor_SpatialMapperPlugin() noexcept;

namespace {
using Params = effetune::generated::SpatialMapperPluginParams;
int failures = 0;
void check(bool success, const char *expression, int line) {
  if (!success) {
    std::fprintf(stderr, "spatial_mapper:%d: %s\n", line, expression);
    ++failures;
  }
}
#define CHECK(expression) check(static_cast<bool>(expression), #expression, __LINE__)

Params defaults() {
  Params p{};
  p.inputChannels = 2.0F;
  p.bands = 2.0F;
  p.directness = p.separation = p.diffuseExtraction = p.phaseSensitivity = p.temporalSmoothing =
      50.0F;
  p.energyPreservation = 1.0F;
  for (std::uint32_t i = 0u; i < 256u; ++i)
    p.directMatrix[i] = p.diffuseMatrix[i] = p.residualMatrix[i] = i % 17u == 0u ? 1.0F : 0.0F;
  return p;
}

class Harness {
public:
  Harness(std::uint32_t rate, std::uint32_t channels, Params p, std::uint32_t block = 128u)
      : channels_(channels), block_(block),
        descriptor_(et_kernel_descriptor_SpatialMapperPlugin()) {
    CHECK(descriptor_->objectSize <= storage_.size());
    if (descriptor_->objectSize > storage_.size())
      return;
    kernel_ = descriptor_->construct(storage_.data());
    stage(p);
    kernel_->prepare({static_cast<float>(rate), channels, block});
    CHECK(kernel_->preparedSuccessfully());
  }
  ~Harness() {
    if (kernel_ != nullptr)
      descriptor_->destroy(kernel_);
  }
  Harness(const Harness &) = delete;
  Harness &operator=(const Harness &) = delete;
  void stage(const Params &p) {
    CHECK(kernel_->stageParameters(reinterpret_cast<const float *>(&p), Params::kFloatCount,
                                   Params::kHash) == ET_OK);
    kernel_->applyPendingParameters();
  }
  std::uint32_t latency() const { return kernel_->latencySamples(); }
  void reset() {
    effetune::allocation_guard::Scope guard;
    kernel_->reset();
  }
  std::vector<float> process(const std::vector<float> &input) {
    const auto frames = static_cast<std::uint32_t>(input.size() / channels_);
    std::vector<float> result(input.size());
    std::vector<float> block(static_cast<std::size_t>(channels_) * block_);
    for (std::uint32_t offset = 0u; offset < frames; offset += block_) {
      const std::uint32_t count = frames - offset < block_ ? frames - offset : block_;
      for (std::uint32_t c = 0u; c < channels_; ++c)
        std::memcpy(block.data() + static_cast<std::size_t>(c) * count,
                    input.data() + static_cast<std::size_t>(c) * frames + offset,
                    count * sizeof(float));
      {
        effetune::allocation_guard::Scope guard;
        kernel_->process(block.data(), channels_, count, {0.0});
      }
      for (std::uint32_t c = 0u; c < channels_; ++c)
        std::memcpy(result.data() + static_cast<std::size_t>(c) * frames + offset,
                    block.data() + static_cast<std::size_t>(c) * count, count * sizeof(float));
    }
    CHECK(effetune::allocation_guard::violationCount() == 0u);
    return result;
  }

private:
  alignas(std::max_align_t) std::array<std::byte, 16384u> storage_{};
  std::uint32_t channels_, block_;
  const effetune::KernelDescriptor *descriptor_;
  effetune::PluginKernel *kernel_ = nullptr;
};

std::vector<float> signal(std::uint32_t channels, std::uint32_t frames, bool coherent = false,
                          std::uint32_t offset = 0u) {
  std::vector<float> result(static_cast<std::size_t>(channels) * frames);
  for (std::uint32_t c = 0u; c < channels; ++c)
    for (std::uint32_t i = 0u; i < frames; ++i) {
      const double frequency = coherent ? 0.037 : 0.021 + c * 0.004;
      result[static_cast<std::size_t>(c) * frames + i] =
          static_cast<float>(0.2 * std::sin((i + offset) * frequency) +
                             0.07 * std::sin((i + offset) * (frequency * 2.31)));
    }
  return result;
}
double energy(const std::vector<float> &values, std::uint32_t channels, std::uint32_t start) {
  const std::size_t frames = values.size() / channels;
  double total = 0.0;
  for (std::uint32_t c = 0u; c < channels; ++c)
    for (std::size_t i = start; i < frames; ++i) {
      const double v = values[static_cast<std::size_t>(c) * frames + i];
      total += v * v;
    }
  return total;
}

void reconstruction() {
  for (const auto channels : {1u, 2u, 6u, 16u}) {
    for (const auto rate : {48000u, 96000u, 192000u}) {
      const std::uint32_t frames = rate / 3u;
      auto input = signal(channels, frames);
      Params parameters = defaults();
      if (channels == 16u) {
        parameters.inputChannels = 16.0F;
        parameters.bands = 4.0F;
      }
      Harness h(rate, channels, parameters, 257u);
      const auto output = h.process(input);
      CHECK(h.latency() == (rate == 48000u ? 2560u : rate == 96000u ? 5120u : 10240u));
      float error = 0.0F;
      for (std::uint32_t c = 0u; c < channels; ++c)
        for (std::uint32_t i = 0u; i < frames; ++i) {
          const float expected = i >= h.latency()
                                     ? input[static_cast<std::size_t>(c) * frames + i - h.latency()]
                                     : 0.0F;
          const float difference =
              std::abs(output[static_cast<std::size_t>(c) * frames + i] - expected);
          if (difference > error)
            error = difference;
        }
      if (error >= 2.0e-5F)
        std::fprintf(stderr, "identity %uHz/%uch max=%g\n", rate, channels,
                     static_cast<double>(error));
      CHECK(error < 2.0e-5F);
      h.reset();
      CHECK(h.process(input) == output);
    }
  }
}

void coherentSeparation() {
  constexpr std::uint32_t frames = 48000u;
  auto input = signal(2u, frames, true);
  Params p = defaults();
  p.directness = 100.0F;
  p.diffuseExtraction = 100.0F;
  p.temporalSmoothing = 0.0F;
  std::fill(std::begin(p.diffuseMatrix), std::end(p.diffuseMatrix), 0.0F);
  std::fill(std::begin(p.residualMatrix), std::end(p.residualMatrix), 0.0F);
  Harness same(48000u, 2u, p);
  const auto direct = same.process(input);
  CHECK(energy(direct, 2u, 24000u) / energy(input, 2u, 24000u) > 0.97);
  for (std::uint32_t i = frames; i < frames * 2u; ++i)
    input[i] = -input[i];
  p.phaseSensitivity = 0.0F;
  Harness anti(48000u, 2u, p);
  const auto antiphase = anti.process(input);
  CHECK(energy(antiphase, 2u, 24000u) / energy(direct, 2u, 24000u) > 0.98);
  p.phaseSensitivity = 100.0F;
  Harness sensitive(48000u, 2u, p);
  CHECK(energy(sensitive.process(input), 2u, 24000u) / energy(antiphase, 2u, 24000u) < 0.001);
  std::fill(input.begin(), input.begin() + frames, 0.0F);
  Harness right(48000u, 2u, p);
  CHECK(energy(right.process(input), 2u, 24000u) / energy(input, 2u, 24000u) > 0.97);
}

void routingAndEnergy() {
  constexpr std::uint32_t frames = 48000u;
  const auto input = signal(6u, frames, true);
  Params p = defaults();
  p.directness = 100.0F;
  p.diffuseExtraction = 0.0F;
  p.temporalSmoothing = 0.0F;
  p.phaseSensitivity = 0.0F;
  std::fill(std::begin(p.directMatrix), std::end(p.directMatrix), 0.0F);
  std::fill(std::begin(p.diffuseMatrix), std::end(p.diffuseMatrix), 0.0F);
  std::fill(std::begin(p.residualMatrix), std::end(p.residualMatrix), 0.0F);
  p.directMatrix[32u] = p.directMatrix[33u] = 0.25F;
  Harness on(48000u, 6u, p);
  const auto result = on.process(input);
  double original = 0.0, center = 0.0;
  for (std::uint32_t i = 24000u; i < frames; ++i) {
    original += 2.0 * static_cast<double>(input[i]) * input[i];
    center += static_cast<double>(result[2u * frames + i]) * result[2u * frames + i];
    CHECK(std::abs(result[i]) < 1.0e-7F && std::abs(result[frames + i]) < 1.0e-7F);
    CHECK(std::abs(result[3u * frames + i] - input[3u * frames + i - on.latency()]) < 2.0e-6F);
  }
  CHECK(center / original > 0.97 && center / original < 1.03);
  p.energyPreservation = 0.0F;
  Harness off(48000u, 6u, p);
  const auto unnormalized = off.process(input);
  double off_center = 0.0;
  for (std::uint32_t i = 24000u; i < frames; ++i)
    off_center +=
        static_cast<double>(unnormalized[2u * frames + i]) * unnormalized[2u * frames + i];
  CHECK(off_center / center > 0.12 && off_center / center < 0.13);
  p.inputChannels = 16.0F;
  p.directMatrix[32u] = p.directMatrix[33u] = 0.0F;
  Harness zero(48000u, 2u, p, 63u);
  CHECK(energy(zero.process(signal(2u, frames)), 2u, 0u) == 0.0);
  CHECK(energy(zero.process(std::vector<float>(frames * 2u)), 2u, 0u) == 0.0);
}

void transitions() {
  Params p = defaults();
  constexpr std::uint32_t frames = 24000u;
  Harness h(48000u, 6u, p, 63u);
  const auto input = signal(6u, frames, true);
  (void)h.process(input);
  std::uint32_t offset = frames;
  for (const float channels : {6.0F, 1.0F, 2.0F}) {
    p.inputChannels = channels;
    p.directness = channels == 1.0F ? 0.0F : 100.0F;
    p.bands = channels == 6.0F ? 4.0F : 0.0F;
    p.directMatrix[32u] = channels == 1.0F ? 0.0F : -0.5F;
    h.stage(p);
    const auto output = h.process(signal(6u, frames, true, offset));
    offset += frames;
    float step = 0.0F;
    for (std::uint32_t c = 0u; c < 6u; ++c)
      for (std::uint32_t i = 1u; i < frames; ++i) {
        const auto index = static_cast<std::size_t>(c) * frames + i;
        CHECK(std::isfinite(output[index]));
        const float difference = std::abs(output[index] - output[index - 1u]);
        if (difference > step)
          step = difference;
      }
    CHECK(step < 0.10F);
  }
}
} // namespace

int main() {
  reconstruction();
  coherentSeparation();
  routingAndEnergy();
  transitions();
  return failures == 0 ? 0 : 1;
}
