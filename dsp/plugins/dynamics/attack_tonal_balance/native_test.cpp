#include "AttackTonalBalancePluginParams.h"
#include "allocation_guard.h"
#include "effetune/kernel.h"

#include <pffft.h>

#include <algorithm>
#include <array>
#include <chrono>
#include <cmath>
#include <cstddef>
#include <cstdint>
#include <cstdio>
#include <cstring>
#include <limits>
#include <vector>

extern "C" const effetune::KernelDescriptor *
et_kernel_descriptor_AttackTonalBalancePlugin() noexcept;
extern "C" bool et_attack_tonal_balance_read_scheduler_trace(
    effetune::PluginKernel *kernel, std::uint32_t *stage_count, std::uint32_t *slot_count,
    std::uint32_t *stage_capacity, std::uint32_t *slot_capacity, bool *job_active,
    std::uint32_t *overrun_count, std::uint32_t *failure_count) noexcept;

extern "C" bool et_attack_tonal_balance_masks_valid(effetune::PluginKernel *) noexcept;

namespace {

using Params = effetune::generated::AttackTonalBalancePluginParams;
constexpr double kPi = 3.1415926535897932384626433832795;
constexpr std::uint32_t kBlockSize = 128u;
// Match Engine::kKernelStorageBytes so this test catches kernels that cannot be instantiated.
constexpr std::size_t kKernelStorageBytes = 16384u;
int failures = 0;

void check(bool condition, const char *expression, int line) noexcept {
  if (condition) {
    return;
  }
  std::fprintf(stderr, "attack_tonal_balance/native_test.cpp:%d: check failed: %s\n", line,
               expression);
  ++failures;
}

#define AT_CHECK(expression) check(static_cast<bool>(expression), #expression, __LINE__)

Params parameters(float attack = 0.0F, float tonal = 0.0F, bool attack_enabled = true,
                  bool tonal_enabled = true) noexcept {
  return {attack, tonal, attack_enabled ? 1.0F : 0.0F, tonal_enabled ? 1.0F : 0.0F};
}

std::uint32_t fftSizeForRate(double sample_rate) noexcept {
  double requested = std::pow(2.0, std::round(std::log2(sample_rate * 0.085)));
  if (requested < 256.0) {
    requested = 256.0;
  } else if (requested > 16384.0) {
    requested = 16384.0;
  }
  auto size = static_cast<std::uint32_t>(requested);
  while (size > 256u && static_cast<double>(size + size / 4u) / sample_rate > 0.120) {
    size >>= 1u;
  }
  return size;
}

class Harness final {
public:
  Harness(float sample_rate, std::uint32_t channels, std::uint32_t max_frames = kBlockSize)
      : Harness(sample_rate, channels, channels, max_frames) {}

  Harness(float sample_rate, std::uint32_t max_channels, std::uint32_t channels,
          std::uint32_t max_frames)
      : sample_rate_(sample_rate), channels_(channels), max_channels_(max_channels),
        max_frames_(max_frames) {
    descriptor_ = et_kernel_descriptor_AttackTonalBalancePlugin();
    AT_CHECK(descriptor_ != nullptr);
    if (descriptor_ == nullptr) {
      return;
    }
    AT_CHECK(descriptor_->objectSize <= storage_.size());
    AT_CHECK(descriptor_->paramsHash == Params::kHash);
    AT_CHECK(descriptor_->paramsFloatCount == Params::kFloatCount);
    kernel_ = descriptor_->construct(storage_.data());
    AT_CHECK(kernel_ != nullptr);
    if (kernel_ != nullptr) {
      prepare(sample_rate_, max_channels_, channels_);
      stage(parameters());
      if (!kernel_->preparedSuccessfully()) {
        std::uint32_t stage_count = 0u;
        std::uint32_t slot_count = 0u;
        std::uint32_t stage_capacity = 0u;
        std::uint32_t slot_capacity = 0u;
        std::uint32_t overrun_count = 0u;
        std::uint32_t failure_count = 0u;
        bool job_active = false;
        (void)et_attack_tonal_balance_read_scheduler_trace(
            kernel_, &stage_count, &slot_count, &stage_capacity, &slot_capacity, &job_active,
            &overrun_count, &failure_count);
        std::fprintf(stderr, "prepare %.0f Hz/%u ch: stages=%u/%u slots=%u/%u steps=%u/%u\n",
                     sample_rate_, channels_, stage_count, stage_capacity, slot_count,
                     slot_capacity, overrun_count, failure_count);
      }
    }
  }

  ~Harness() {
    if (kernel_ != nullptr) {
      descriptor_->destroy(kernel_);
    }
  }

  Harness(const Harness &) = delete;
  Harness &operator=(const Harness &) = delete;

  void prepare(float sample_rate, std::uint32_t channels) noexcept {
    prepare(sample_rate, channels, channels);
  }

  void prepare(float sample_rate, std::uint32_t max_channels, std::uint32_t channels) noexcept {
    sample_rate_ = sample_rate;
    max_channels_ = max_channels;
    channels_ = channels;
    kernel_->prepare({sample_rate_, max_channels_, max_frames_});
    AT_CHECK(kernel_->preparedSuccessfully());
  }

  void stage(const Params &value) noexcept {
    const auto *packed = reinterpret_cast<const float *>(&value);
    AT_CHECK(kernel_->stageParameters(packed, Params::kFloatCount, Params::kHash) == ET_OK);
    kernel_->applyPendingParameters();
  }

  std::vector<float> process(const std::vector<float> &input, bool profile = false) noexcept {
    AT_CHECK(input.size() % channels_ == 0u);
    const auto frames = static_cast<std::uint32_t>(input.size() / channels_);
    std::vector<float> output(input.size(), 0.0F);
    std::vector<float> block(static_cast<std::size_t>(channels_) * max_frames_, 0.0F);
    std::vector<double> durations;
    if (profile)
      durations.reserve((frames + max_frames_ - 1u) / max_frames_);
    for (std::uint32_t offset = 0u; offset < frames; offset += max_frames_) {
      const std::uint32_t count = frames - offset < max_frames_ ? frames - offset : max_frames_;
      for (std::uint32_t channel = 0u; channel < channels_; ++channel) {
        std::memcpy(block.data() + static_cast<std::size_t>(channel) * count,
                    input.data() + static_cast<std::size_t>(channel) * frames + offset,
                    count * sizeof(float));
      }
      {
        effetune::allocation_guard::Scope allocation_scope;
        const auto started =
            profile ? std::chrono::steady_clock::now() : std::chrono::steady_clock::time_point{};
        kernel_->process(block.data(), channels_, count, {0.0});
        if (profile)
          durations.push_back(
              std::chrono::duration<double, std::micro>(std::chrono::steady_clock::now() - started)
                  .count());
      }
      for (std::uint32_t channel = 0u; channel < channels_; ++channel) {
        std::memcpy(output.data() + static_cast<std::size_t>(channel) * frames + offset,
                    block.data() + static_cast<std::size_t>(channel) * count,
                    count * sizeof(float));
      }
    }
    if (profile) {
      std::sort(durations.begin(), durations.end());
      const double deadline = static_cast<double>(max_frames_) / sample_rate_ * 1.0e6;
      std::printf("callback %.0f Hz/%u ch/%u frames p99=%.2f us max=%.2f us deadline=%.2f us\n",
                  sample_rate_, channels_, max_frames_, durations[durations.size() * 99u / 100u],
                  durations.back(), deadline);
    }
    return output;
  }

  void channels(std::uint32_t value) noexcept { channels_ = value; }

  void reset() noexcept {
    effetune::allocation_guard::Scope allocation_scope;
    kernel_->reset();
  }

  [[nodiscard]] std::uint32_t latency() const noexcept { return kernel_->latencySamples(); }

  void checkScheduler() noexcept {
    std::uint32_t stage_count = 0u;
    std::uint32_t slot_count = 0u;
    std::uint32_t stage_capacity = 0u;
    std::uint32_t slot_capacity = 0u;
    std::uint32_t overrun_count = 0u;
    std::uint32_t failure_count = 0u;
    bool job_active = false;
    AT_CHECK(et_attack_tonal_balance_read_scheduler_trace(
        kernel_, &stage_count, &slot_count, &stage_capacity, &slot_capacity, &job_active,
        &overrun_count, &failure_count));
    AT_CHECK(stage_count <= stage_capacity);
    AT_CHECK(slot_count <= slot_capacity);
    AT_CHECK(overrun_count == 0u);
    AT_CHECK(failure_count == 0u);
    AT_CHECK(et_attack_tonal_balance_masks_valid(kernel_));
    (void)job_active;
  }

private:
  alignas(std::max_align_t) std::array<std::byte, kKernelStorageBytes> storage_{};
  const effetune::KernelDescriptor *descriptor_ = nullptr;
  effetune::PluginKernel *kernel_ = nullptr;
  float sample_rate_ = 0.0F;
  std::uint32_t channels_ = 0u;
  std::uint32_t max_channels_ = 0u;
  std::uint32_t max_frames_ = 0u;
};

std::vector<float> signal(std::uint32_t frames, std::uint32_t channels, double rate,
                          bool tonal = true, bool attack = true) {
  std::vector<float> result(static_cast<std::size_t>(frames) * channels);
  for (std::uint32_t ch = 0; ch < channels; ++ch) {
    for (std::uint32_t i = 0; i < frames; ++i) {
      double value = tonal ? 0.1 * std::sin(2.0 * kPi * 1000.0 * i / rate) : 0.0;
      if (attack && i % static_cast<std::uint32_t>(rate / 4.0) == 100u)
        value += 0.4;
      result[static_cast<std::size_t>(ch) * frames + i] = static_cast<float>(value / (ch + 1u));
    }
  }
  return result;
}

double energy(const std::vector<float> &audio, std::size_t begin, std::size_t end) {
  double sum = 0.0;
  for (std::size_t i = begin; i < end; ++i)
    sum += static_cast<double>(audio[i]) * audio[i];
  return sum;
}

void testNeutralAndRates() {
  for (float rate : {8000.0F, 32000.0F, 44100.0F, 48000.0F, 96000.0F, 192000.0F}) {
    for (std::uint32_t channels : {1u, 2u, 16u}) {
      Harness h(rate, channels, 129u);
      const auto n = fftSizeForRate(rate);
      AT_CHECK(h.latency() == n + n / 4u);
      const std::uint32_t frames = n * 4u;
      const auto input = signal(frames, channels, rate);
      const auto output = h.process(input);
      double error = 0.0;
      for (std::uint32_t ch = 0; ch < channels; ++ch) {
        for (std::uint32_t i = 0; i < frames; ++i) {
          const auto index = static_cast<std::size_t>(ch) * frames + i;
          const double expected = i < h.latency() ? 0.0 : input[index - h.latency()];
          error = std::max(error, std::abs(output[index] - expected));
        }
      }
      AT_CHECK(error < 2.0e-5);
      h.checkScheduler();
    }
  }
}

void testSeparation() {
  constexpr std::uint32_t frames = 48000u;
  for (bool is_tone : {false, true}) {
    const auto input = signal(frames, 1u, 48000.0, is_tone, !is_tone);
    double energies[5]{};
    const Params settings[] = {parameters(), parameters(12, 0), parameters(-12, 0),
                               parameters(0, 12), parameters(0, -12)};
    for (std::size_t i = 0; i < 5u; ++i) {
      Harness h(48000.0F, 1u);
      h.stage(settings[i]);
      const auto output = h.process(input);
      energies[i] = energy(output, 24000u, frames);
      h.checkScheduler();
    }
    if (is_tone) {
      AT_CHECK(energies[3] > energies[0] * 10.0);
      AT_CHECK(energies[4] < energies[0] * 0.15);
      AT_CHECK(energies[1] < energies[3]);
    } else {
      AT_CHECK(energies[1] > energies[0] * 10.0);
      AT_CHECK(energies[2] < energies[0] * 0.15);
      AT_CHECK(energies[3] < energies[1]);
    }
  }
  // With a shared mask, unequal channel levels retain their exact relationship.
  const auto mixed = signal(frames, 3u, 48000.0);
  Harness h(48000.0F, 3u);
  h.stage(parameters(6, -6));
  const auto output = h.process(mixed);
  for (std::uint32_t i = 0; i < frames; ++i) {
    AT_CHECK(std::abs(output[i] - 2.0F * output[frames + i]) < 2.0e-5F);
    AT_CHECK(std::abs(output[i] - 3.0F * output[2u * frames + i]) < 2.0e-5F);
  }
  h.checkScheduler();
  h.reset();
  const auto silent = h.process(std::vector<float>(frames * 3u, 0.0F));
  AT_CHECK(std::all_of(silent.begin(), silent.end(), [](float v) { return v == 0.0F; }));
  h.checkScheduler();
}

void testComponentSwitches() {
  constexpr std::uint32_t frames = 24000u;
  const auto render = [](const std::vector<float> &input, const Params &params) {
    Harness h(48000.0F, 1u);
    h.stage(params);
    const auto output = h.process(input);
    h.checkScheduler();
    return output;
  };
  for (bool is_tone : {false, true}) {
    const auto input = signal(frames, 1u, 48000.0, is_tone, !is_tone);
    const auto neutral = render(input, parameters());
    const auto muted = render(input, parameters(0, 0, is_tone, !is_tone));
    AT_CHECK(energy(muted, 12000u, frames) < energy(neutral, 12000u, frames) * 0.01);
  }

  const auto input = signal(frames, 1u, 48000.0);
  const auto neutral = render(input, parameters());
  const auto attack_off = render(input, parameters(0, 0, false, true));
  const auto tonal_off = render(input, parameters(0, 0, true, false));
  const auto residual = render(input, parameters(0, 0, false, false));
  AT_CHECK(attack_off == render(input, parameters(12, 0, false, true)));
  AT_CHECK(tonal_off == render(input, parameters(0, -12, true, false)));
  AT_CHECK(residual == render(input, parameters(-12, 12, false, false)));
  AT_CHECK(energy(residual, 12000u, frames) > 1.0e-8);
  // Complementary masks keep the residual at unity for every switch combination.
  for (std::size_t i = 0u; i < neutral.size(); ++i) {
    AT_CHECK(std::isfinite(residual[i]));
    AT_CHECK(std::abs(neutral[i] - attack_off[i] - tonal_off[i] + residual[i]) < 2.0e-5F);
  }
}

void testBlockResetAndConfiguration() {
  const auto input = signal(24000u, 2u, 48000.0);
  std::vector<float> reference;
  for (std::uint32_t block : {1u, 16u, 63u, 128u, 257u}) {
    Harness h(48000.0F, 16u, 2u, block);
    h.stage(parameters(6, -6, false, true));
    const auto output = h.process(input);
    if (reference.empty())
      reference = output;
    AT_CHECK(output == reference);
    h.reset();
    AT_CHECK(output == h.process(input));
    h.checkScheduler();
    h.channels(1u);
    const auto mono = signal(24000u, 1u, 48000.0);
    Harness fresh(48000.0F, 16u, 1u, block);
    fresh.stage(parameters(6, -6, false, true));
    AT_CHECK(h.process(mono) == fresh.process(mono));
    h.prepare(44100.0F, 3u);
    const auto changed = signal(16000u, 3u, 44100.0);
    Harness rebuilt(44100.0F, 3u, block);
    rebuilt.stage(parameters(6, -6, false, true));
    AT_CHECK(h.process(changed) == rebuilt.process(changed));
  }
}

void testAutomation() {
  const auto input = signal(32000u, 1u, 48000.0, true, false);
  const std::uint32_t hop = fftSizeForRate(48000.0) / 4u;
  const std::uint32_t start = 12u * hop;
  const auto render = [&](std::uint32_t change, const Params &target) {
    Harness h(48000.0F, 1u);
    h.stage(parameters());
    auto before = h.process(std::vector<float>(input.begin(), input.begin() + change));
    h.stage(target);
    const auto after = h.process(std::vector<float>(input.begin() + change, input.end()));
    before.insert(before.end(), after.begin(), after.end());
    h.checkScheduler();
    return before;
  };
  for (const Params target : {parameters(12, 12), parameters(0, 0, false, false)}) {
    const auto mid = render(start + hop / 2u, target);
    AT_CHECK(mid == render(start + hop - 1u, target));
    double jump = 0.0;
    for (std::size_t i = start; i < mid.size(); ++i) {
      AT_CHECK(std::isfinite(mid[i]));
      jump = std::max(jump, std::abs(double(mid[i]) - mid[i - 1u]));
    }
    AT_CHECK(jump < 0.06);
  }
  // A continuous steady tone isolates gain-transition discontinuities.
  Harness sweep(48000.0F, 1u);
  for (int step = -24; step <= 24; ++step) {
    sweep.stage(parameters(static_cast<float>(step) * 0.5F, -static_cast<float>(step) * 0.5F));
    const auto output = sweep.process(signal(1008u, 1u, 48000.0, true, false));
    AT_CHECK(std::all_of(output.begin(), output.end(), [](float v) { return std::isfinite(v); }));
  }
  sweep.checkScheduler();
}

void testChannelRotation() {
  constexpr std::uint32_t frames = 24000u;
  auto original = signal(frames, 2u, 48000.0);
  for (std::uint32_t i = 0; i < frames; ++i) {
    original[frames + i] = static_cast<float>(0.05 * std::sin(2.0 * kPi * 1730.0 * i / 48000.0));
  }
  auto rotated = original;
  constexpr double scale = 0.7071067811865475244;
  for (std::uint32_t i = 0; i < frames; ++i) {
    rotated[i] = static_cast<float>((original[i] - original[frames + i]) * scale);
    rotated[frames + i] = static_cast<float>((original[i] + original[frames + i]) * scale);
  }
  Harness a(48000.0F, 2u), b(48000.0F, 2u);
  a.stage(parameters(6, -6));
  b.stage(parameters(6, -6));
  const auto out = a.process(original), transformed = b.process(rotated);
  double error = 0.0;
  for (std::uint32_t i = 0; i < frames; ++i) {
    error = std::max(error, std::abs(transformed[i] - (out[i] - out[frames + i]) * scale));
    error = std::max(error, std::abs(transformed[frames + i] - (out[i] + out[frames + i]) * scale));
  }
  AT_CHECK(error < 2.0e-5);
}

void benchmark() {
  for (float rate : {44100.0F, 48000.0F, 96000.0F, 192000.0F}) {
    for (std::uint32_t channels : {1u, 2u, 16u}) {
      for (std::uint32_t block : {16u, 128u}) {
        Harness h(rate, channels, block);
        h.stage(parameters(6, -6));
        const auto input = signal(static_cast<std::uint32_t>(rate), channels, rate);
        (void)h.process(input, true);
        h.checkScheduler();
      }
    }
  }
}

} // namespace

int main() {
  testNeutralAndRates();
  testSeparation();
  testComponentSwitches();
  testBlockResetAndConfiguration();
  testAutomation();
  testChannelRotation();
  benchmark();
  if (failures != 0)
    return 1;
  std::puts("Attack Tonal Balance native tests passed.");
  return 0;
}
