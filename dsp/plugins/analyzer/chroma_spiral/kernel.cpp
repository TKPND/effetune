#include "effetune/kernel.h"
#include "ChromaSpiralPluginParams.h"
#include "effetune/dsp/spectrum_hq_sink.h"

#include <cstdint>
#include <memory>
#include <new>

namespace effetune::plugins::analyzer {
namespace {

std::uint32_t automaticPoints(float sample_rate) noexcept {
  std::uint32_t points = 8u;
  while (points < 14u && sample_rate / (4.0 * (1u << points)) > 1.5) {
    ++points;
  }
  return points;
}

} // namespace

class ChromaSpiralKernel final : public PluginKernel {
  EFFETUNE_PARAMS(generated::ChromaSpiralPluginParams)

public:
  void prepare(const PrepareInfo &info) override {
    ready_ = false;
    points_ = automaticPoints(info.sampleRate);
    spectrum_.reset(new (std::nothrow)::effetune::dsp::MultiresSpectrum());
    sink_.reset(new (std::nothrow)::effetune::dsp::SpectrumHqSink(info.sampleRate));
    ready_ = spectrum_ != nullptr && sink_ != nullptr && spectrum_->prepare(info.sampleRate, false);
    reset();
  }

  void reset() noexcept override {
    if (ready_) {
      spectrum_->reset(points_);
      sink_->reset();
    }
  }

  void process(float *audio, std::uint32_t channel_count, std::uint32_t frame_count,
               const ProcessInfo &) noexcept override {
    if (!ready_ || audio == nullptr || channel_count == 0u) {
      return;
    }
    for (std::uint32_t frame = 0u; frame < frame_count; ++frame) {
      const float left = audio[frame];
      const float right = channel_count > 1u ? audio[frame_count + frame] : left;
      spectrum_->push((left + right) * 0.5F, *sink_);
    }
  }

  void writeTelemetry(TelemetryWriter &writer) noexcept override {
    if (ready_) {
      sink_->writeTelemetry(writer);
    }
  }

private:
  std::unique_ptr<::effetune::dsp::MultiresSpectrum> spectrum_;
  std::unique_ptr<::effetune::dsp::SpectrumHqSink> sink_;
  std::uint32_t points_ = 13u;
  bool ready_ = false;
};

static_assert(sizeof(ChromaSpiralKernel) <= 8192u);

} // namespace effetune::plugins::analyzer

EFFETUNE_REGISTER_KERNEL(ChromaSpiralPlugin, effetune::plugins::analyzer::ChromaSpiralKernel)
