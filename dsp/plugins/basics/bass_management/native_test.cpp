#include "BassManagementPluginParams.h"
#include "effetune/kernel.h"

#include <array>
#include <chrono>
#include <cmath>
#include <cstdio>
#include <cstring>
#include <memory>
#include <numbers>
#include <vector>

extern "C" const effetune::KernelDescriptor *et_kernel_descriptor_BassManagementPlugin() noexcept;
namespace {
using Params = effetune::generated::BassManagementPluginParams;
int failures = 0;
void check(bool okay, const char *expression, int line) {
  if (!okay) {
    std::fprintf(stderr, "bass_management:%d: %s\n", line, expression);
    ++failures;
  }
}
#define CHECK(x) check(static_cast<bool>(x), #x, __LINE__)
bool near(double a, double b, double tolerance = 0.0002) { return std::abs(a - b) <= tolerance; }
Params defaults() {
  Params p{};
  p.taps = 0;
  p.lfeFrequency = 120;
  p.lfeSlope = 24;
  for (int ch = 0; ch < 16; ++ch) {
    p.frequencies[ch] = 80;
    p.slopes[ch] = 24;
  }
  return p;
}
struct Harness {
  const effetune::KernelDescriptor *descriptor = et_kernel_descriptor_BassManagementPlugin();
  std::unique_ptr<std::byte[]> storage{new std::byte[descriptor->objectSize]};
  effetune::PluginKernel *kernel = descriptor->construct(storage.get());
  Params p = defaults();
  std::uint32_t channels;
  explicit Harness(std::uint32_t count = 4) : channels(count) {
    CHECK(descriptor->objectSize <= 16384);
    kernel->prepare({48000, 16, 128});
    CHECK(kernel->preparedSuccessfully());
    stage();
  }
  ~Harness() { descriptor->destroy(kernel); }
  void stage() {
    CHECK(kernel->stageParameters(reinterpret_cast<const float *>(&p), Params::kFloatCount,
                                  Params::kHash) == ET_OK);
    kernel->applyPendingParameters();
  }
  void process(float *data, std::uint32_t frames = 128) {
    kernel->process(data, channels, frames, {0});
  }
  void settle(std::uint32_t blocks = 8) {
    std::array<float, 2048> audio{};
    for (std::uint32_t i = 0; i < blocks; ++i) {
      audio.fill(0);
      process(audio.data());
    }
  }
  void routeLfe() {
    p.roles[0] = 2;
    p.roles[1] = 2;
    p.roles[2] = p.roles[3] = 3;
    p.subs = 12;
    p.routes[0] = 12;
    p.routes[1] = 4;
    stage();
  }
  bool asset(bool wrongPath = false) {
    std::uint32_t count = 0;
    for (std::uint32_t ch = 0; ch < channels; ++ch)
      if (p.roles[ch] == 1 || (p.roles[ch] == 2 && p.lfeLowpass == 1))
        ++count;
    const std::uint32_t tapCount = p.taps == 0 ? 8192 : p.taps == 1 ? 16384 : 32768;
    const std::uint32_t bytes = 32 + count * 12 + count * tapCount * 4;
    const effetune::AssetBeginInfo info{
        count, tapCount, 4, 128, 1, count, channels, channels, 31u * 1024u * 1024u, bytes};
    auto *data = kernel->beginAsset(0, info);
    if (!data)
      return false;
    std::memset(data, 0, bytes);
    const auto u32 = [&](std::uint32_t offset, std::uint32_t value) {
      std::memcpy(data + offset, &value, 4);
    };
    u32(0, 0x31415445);
    u32(4, count);
    u32(8, tapCount);
    u32(12, 48000);
    u32(16, 4);
    u32(20, count);
    std::uint32_t index = 0;
    for (std::uint32_t ch = 0; ch < channels; ++ch) {
      if (p.roles[ch] != 1 && !(p.roles[ch] == 2 && p.lfeLowpass == 1))
        continue;
      u32(32 + index * 12, ch);
      u32(36 + index * 12, wrongPath ? (ch + 1) % channels : ch);
      u32(40 + index * 12, index);
      const float half = 0.5F;
      std::memcpy(data + 32 + count * 12 + (index * tapCount + tapCount / 2) * 4, &half, 4);
      ++index;
    }
    return kernel->commitAsset(0, bytes, ET_ASSET_F32_MULTICH) == ET_OK;
  }
};
void routing() {
  Harness h;
  std::array<float, 512> audio{};
  audio[0] = 1;
  audio[128] = 2;
  audio[256] = 3;
  audio[384] = 4;
  const auto original = audio;
  h.process(audio.data());
  CHECK(audio == original);
  h.routeLfe();
  h.settle();
  audio.fill(0);
  audio[0] = 2;
  audio[128] = 3;
  audio[256] = 100;
  audio[384] = 100;
  h.process(audio.data());
  CHECK(audio[0] == 0 && audio[128] == 0);
  CHECK(near(audio[256], 4));
  CHECK(near(audio[384], 1));
  // Invalid destination must leave the previous valid configuration running.
  h.p.routes[0] = 16;
  h.stage();
  audio.fill(0);
  audio[0] = 2;
  h.process(audio.data());
  CHECK(near(audio[256], 1));
  CHECK(near(audio[384], 1));
  // Same-number LFE input/Sub output is read exactly once.
  h.p.routes[0] = 12;
  h.p.roles[2] = 2;
  h.p.routes[2] = 12;
  h.stage();
  h.settle();
  audio.fill(0);
  audio[256] = 2;
  h.process(audio.data());
  CHECK(near(audio[256], 1));
  CHECK(near(audio[384], 1));
  Harness three(5);
  three.p.roles[0] = 2;
  three.p.routes[0] = 28;
  three.p.subs = 28;
  three.p.roles[2] = three.p.roles[3] = three.p.roles[4] = 3;
  three.stage();
  three.settle();
  std::array<float, 640> triple{};
  triple[0] = 3;
  three.process(triple.data());
  CHECK(near(triple[256], 1) && near(triple[384], 1) && near(triple[512], 1));
}
void iirResponseAndFrames() {
  for (const int db : {24, 48, 96}) {
    Harness h;
    h.p.roles[0] = 1;
    h.p.routes[0] = 12;
    h.p.roles[2] = h.p.roles[3] = 3;
    h.p.subs = 12;
    h.p.slopes[0] = static_cast<float>(db);
    h.stage();
    h.settle();
    double lowEnergy = 0, highEnergy = 0, sumEnergy = 0, inputEnergy = 0;
    std::array<float, 512> audio{};
    for (std::uint32_t offset = 0; offset < 96000; offset += 128) {
      audio.fill(0);
      for (std::uint32_t i = 0; i < 128; ++i)
        audio[i] = static_cast<float>(std::sin(2 * std::numbers::pi * 80 * (offset + i) / 48000));
      h.process(audio.data());
      if (offset < 48000)
        continue;
      for (std::uint32_t i = 0; i < 128; ++i) {
        const double x = std::sin(2 * std::numbers::pi * 80 * (offset + i) / 48000);
        const double low = audio[256 + i] + audio[384 + i], high = audio[i];
        lowEnergy += low * low;
        highEnergy += high * high;
        sumEnergy += (low + high) * (low + high);
        inputEnergy += x * x;
      }
    }
    CHECK(near(std::sqrt(lowEnergy / inputEnergy), 0.5, 0.002));
    CHECK(near(std::sqrt(highEnergy / inputEnergy), 0.5, 0.002));
    CHECK(near(std::sqrt(sumEnergy / inputEnergy), 1, 0.002));
  }
  Harness a, b;
  a.routeLfe();
  b.routeLfe();
  a.settle();
  b.settle();
  std::array<float, 512> whole{};
  whole[0] = 2;
  whole[127] = 4;
  a.process(whole.data());
  std::array<float, 4> one{2, 0, 0, 0};
  b.process(one.data(), 1);
  std::array<float, 508> rest{};
  rest[126] = 4;
  b.process(rest.data(), 127);
  CHECK(near(whole[256], one[2]));
  CHECK(near(whole[383], rest[380]));
}
void routeInversion() {
  Harness h;
  h.routeLfe();
  h.p.routeInversions[0] = 8;
  h.p.routeInversions[1] = 4;
  h.stage();
  h.settle();
  std::array<float, 512> audio{};
  audio[0] = 2;
  audio[128] = 3;
  h.process(audio.data());
  CHECK(near(audio[256], -2));
  CHECK(near(audio[384], -1));
  h.p.routeInversions[0] = 16;
  h.stage();
  audio.fill(0);
  audio[0] = 2;
  h.process(audio.data());
  CHECK(near(audio[256], 1) && near(audio[384], -1));
  h.p.routeInversions[0] = 8;
  h.stage();
  h.kernel->reset();
  h.settle();
  audio.fill(0);
  audio[0] = 2;
  h.process(audio.data());
  CHECK(near(audio[256], 1) && near(audio[384], -1));
}
void linear() {
  Harness delayOnly;
  delayOnly.p.phase = 1;
  delayOnly.stage();
  delayOnly.settle();
  CHECK(delayOnly.kernel->latencySamples() == 4224);
  delayOnly.p.taps = 1;
  delayOnly.stage();
  delayOnly.settle();
  CHECK(delayOnly.kernel->latencySamples() == 8320);
  Harness h;
  h.p.phase = 1;
  h.p.roles[0] = 1;
  h.p.routes[0] = 12;
  h.p.routeInversions[0] = 8;
  h.p.roles[2] = h.p.roles[3] = 3;
  h.p.subs = 12;
  h.stage();
  CHECK(h.asset());
  h.settle(1500);
  CHECK((h.kernel->assetState(0) & 255u) == ET_ASSET_STATE_ACTIVE);
  CHECK(h.kernel->latencySamples() == 4224);
  std::array<float, 512> audio{};
  bool found = false;
  for (std::uint32_t block = 0; block < 40; ++block) {
    audio.fill(0);
    if (block == 0) {
      audio[0] = 1;
      audio[128] = 2;
    }
    h.process(audio.data());
    for (std::uint32_t i = 0; i < 128; ++i) {
      const auto t = block * 128 + i;
      CHECK(near(audio[i] + audio[256 + i] - audio[384 + i], t == 4224 ? 1 : 0));
      CHECK(near(audio[128 + i], t == 4224 ? 2 : 0));
      if (t == 4224) {
        CHECK(near(audio[i], 0.5));
        CHECK(near(audio[256 + i], 0.25));
        CHECK(near(audio[384 + i], -0.25));
        found = true;
      }
    }
  }
  CHECK(found);
  // An admitted replacement with invalid paths invalidates the released convolver.
  CHECK(!h.asset(true));
  CHECK((h.kernel->assetState(0) & 255u) == ET_ASSET_STATE_ERROR);
  h.settle(40);
  for (std::uint32_t block = 0; block < 40; ++block) {
    audio.fill(0);
    if (block == 0)
      audio[0] = 1;
    h.process(audio.data());
    for (std::uint32_t i = 0; i < 128; ++i) {
      CHECK(near(audio[i], block * 128 + i == 4224 ? 1 : 0));
      CHECK(audio[256 + i] == 0 && audio[384 + i] == 0);
    }
  }
  CHECK(h.asset());
  h.settle(1500);
  h.kernel->reset();
  h.settle(1500);
  audio.fill(0);
  h.process(audio.data());
  for (float x : audio)
    CHECK(near(x, 0));
}
void linearReplacement() {
  Harness h;
  h.p.phase = 1;
  h.p.roles[0] = 1;
  h.p.roles[1] = 2;
  h.p.roles[2] = h.p.roles[3] = 3;
  h.p.routes[0] = h.p.routes[1] = 4;
  h.p.subs = 4;
  h.stage();
  CHECK(h.asset());
  h.settle(150);
  for (int change = 0; change < 6; ++change) {
    if (change == 0)
      h.p.lfeLowpass = 1;
    else if (change == 1)
      h.p.lfeFrequency = 160;
    else if (change == 2)
      h.p.lfeSlope = 48;
    else if (change == 3)
      h.p.lfeLowpass = 0;
    else if (change == 4)
      h.p.frequencies[0] = 100;
    else
      h.p.taps = 1;
    h.p.phase = -1;
    h.stage();
    h.settle(2);
    CHECK((h.kernel->assetState(0) & (1u << 16u)) != 0);
    CHECK(h.asset());
    h.p.phase = 1;
    h.stage();
    h.settle(200);
    CHECK((h.kernel->assetState(0) & 255u) == ET_ASSET_STATE_ACTIVE);
  }
  h.p.phase = -2;
  h.stage();
  CHECK(!h.asset());
  CHECK((h.kernel->assetState(0) & 255u) == ET_ASSET_STATE_ACTIVE);
}
void noSubPassThrough() {
  for (float phase : {0.0F, 1.0F}) {
    Harness h;
    h.p.phase = phase;
    h.p.roles[0] = 1;
    h.p.roles[1] = 2;
    h.p.roles[2] = h.p.roles[3] = 3;
    h.p.routes[0] = h.p.routes[1] = 4;
    h.p.subs = 4;
    h.stage();
    if (phase == 1)
      CHECK(h.asset());
    h.settle(150);
    h.p.subs = 0;
    for (auto &route : h.p.routes)
      route = 0;
    h.p.headroom = -6;
    h.stage();
    h.kernel->clearAsset(0);
    h.settle(200);
    const std::uint32_t delay = phase == 1 ? 4224 : 0;
    CHECK(h.kernel->latencySamples() == delay);
    const double gain = std::pow(10.0, -6.0 / 20.0);
    std::array<float, 512> audio{};
    for (std::uint32_t block = 0; block < 40; ++block) {
      audio.fill(0);
      if (block == 0)
        for (std::uint32_t ch = 0; ch < 4; ++ch)
          audio[ch * 128] = static_cast<float>(ch + 1);
      h.process(audio.data());
      for (std::uint32_t ch = 0; ch < 4; ++ch)
        for (std::uint32_t frame = 0; frame < 128; ++frame)
          CHECK(near(audio[ch * 128 + frame], block * 128 + frame == delay ? (ch + 1) * gain : 0));
    }
  }
}
void capacity() {
  for (int quality = 0; quality < 3; ++quality) {
    Harness h(16);
    h.p.phase = 1;
    h.p.taps = static_cast<float>(quality);
    h.p.lfeLowpass = 1;
    h.p.subs = 1;
    for (int ch = 0; ch < 16; ++ch) {
      h.p.roles[ch] = 2;
      h.p.routes[ch] = 1;
    }
    h.stage();
    const bool admitted = h.asset();
    CHECK(admitted);
    if (!admitted)
      continue;
    h.settle(2000);
    CHECK((h.kernel->assetState(0) & 255u) == ET_ASSET_STATE_ACTIVE);
    std::array<float, 2048> audio{};
    double maximum = 0;
    const auto start = std::chrono::steady_clock::now();
    for (int callback = 0; callback < 256; ++callback) {
      audio.fill(0);
      const auto before = std::chrono::steady_clock::now();
      h.process(audio.data(), callback % 3 == 0 ? 1u : callback % 3 == 1 ? 127u : 128u);
      const double ms =
          std::chrono::duration<double, std::milli>(std::chrono::steady_clock::now() - before)
              .count();
      if (ms > maximum)
        maximum = ms;
    }
    std::printf(
        "16 LP paths, %d taps: admission passed; 256 mixed-size callbacks %.3f ms, peak %.3f ms\n",
        quality == 0   ? 8192
        : quality == 1 ? 16384
                       : 32768,
        std::chrono::duration<double, std::milli>(std::chrono::steady_clock::now() - start).count(),
        maximum);
  }
}
} // namespace
int main(int argc, char **) {
  if (argc > 1) {
    capacity();
    return failures == 0 ? 0 : 1;
  }
  routing();
  iirResponseAndFrames();
  routeInversion();
  linear();
  linearReplacement();
  noSubPassThrough();
  return failures == 0 ? 0 : 1;
}
