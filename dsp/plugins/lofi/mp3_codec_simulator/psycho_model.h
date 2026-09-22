#pragma once

#include "mp3_core.h"

#include <algorithm>
#include <array>
#include <cmath>

namespace effetune::plugins::lofi::mp3 {

struct PsychoBand final {
  std::uint16_t begin = 0u;
  std::uint16_t end = 0u;
  std::uint16_t frequencyBegin = 0u;
  std::uint16_t frequencyEnd = 0u;
};

using PsychoBands = std::array<PsychoBand, kMaximumScaleFactors>;
using MaskThresholds = std::array<double, kMaximumScaleFactors>;

inline PsychoBands psychoBands(Profile profile, BlockType block) noexcept {
  PsychoBands result{};
  if (block == BlockType::Short) {
    const auto &boundaries =
        profile == Profile::Mpeg1 ? kMpeg1ShortBoundaries : kMpeg2ShortBoundaries;
    std::uint16_t cursor = 0u;
    for (std::uint32_t band = 0u; band + 1u < boundaries.size(); ++band) {
      const auto width = static_cast<std::uint16_t>(boundaries[band + 1u] - boundaries[band]);
      for (std::uint32_t window = 0u; window < 3u; ++window) {
        result[band * 3u + window] = {cursor, static_cast<std::uint16_t>(cursor + width),
                                      static_cast<std::uint16_t>(3u * boundaries[band]),
                                      static_cast<std::uint16_t>(3u * boundaries[band + 1u])};
        cursor = static_cast<std::uint16_t>(cursor + width);
      }
    }
  } else {
    const auto &boundaries =
        profile == Profile::Mpeg1 ? kMpeg1LongBoundaries : kMpeg2LongBoundaries;
    for (std::uint32_t band = 0u; band + 1u < boundaries.size(); ++band) {
      result[band] = {boundaries[band], boundaries[band + 1u], boundaries[band],
                      boundaries[band + 1u]};
    }
  }
  return result;
}

// Thresholds are sums of squared MDCT errors, in the exact coefficient order
// used by the quantizer. A short block has 13 bands times three separate windows.
inline MaskThresholds
maskingThresholds(const float *spectrum, const PsychoBands &bands, BlockType block, float nmr_db,
                  std::array<double, 13> *previous_short_energy = nullptr) noexcept {
  MaskThresholds energy{};
  MaskThresholds flatness{};
  const std::uint32_t count = block == BlockType::Short ? 39u : 22u;
  for (std::uint32_t factor = 0u; factor < count; ++factor) {
    const PsychoBand &band = bands[factor];
    double logarithm = 0.0;
    for (std::uint32_t line = band.begin; line < band.end; ++line) {
      const double value = spectrum[line];
      const double power = value * value + 1.0e-30;
      energy[factor] += power;
      logarithm += std::log(power);
    }
    const double width = band.end - band.begin;
    const double ratio = std::exp(logarithm / width) / (energy[factor] / width);
    flatness[factor] = ratio < 1.0 ? ratio : 1.0;
  }
  const double nmr = std::pow(10.0, static_cast<double>(nmr_db) / 10.0);
  MaskThresholds result{};
  const std::uint32_t stride = block == BlockType::Short ? 3u : 1u;
  for (std::uint32_t factor = 0u; factor < count; ++factor) {
    const PsychoBand &band = bands[factor];
    const double center = 0.5 * (band.frequencyBegin + band.frequencyEnd);
    double spread = energy[factor];
    for (const int direction : {-1, 1}) {
      const int neighbor = static_cast<int>(factor) + direction * static_cast<int>(stride);
      if (neighbor < 0 || neighbor >= static_cast<int>(count)) {
        continue;
      }
      const PsychoBand &other = bands[static_cast<std::uint32_t>(neighbor)];
      const double other_center = 0.5 * (other.frequencyBegin + other.frequencyEnd);
      const double distance = std::abs(std::log2((center + 8.0) / (other_center + 8.0)));
      spread += energy[static_cast<std::uint32_t>(neighbor)] * std::exp2(-8.0 * distance) *
                (direction < 0 ? 0.18 : 0.08);
    }
    // Digital audibility floor: -120 dB power relative to a unit MDCT
    // coefficient, summed over this band (no assumed listening SPL).
    const double floor = 1.0e-12 * (band.end - band.begin);
    double threshold = spread * (0.025 + 0.11 * flatness[factor]) * nmr;
    const double energy_limit = energy[factor] * 0.5;
    if (threshold > energy_limit) {
      threshold = energy_limit;
    }
    if (block == BlockType::Short && previous_short_energy != nullptr) {
      const std::uint32_t band_index = factor / 3u;
      const double previous =
          factor % 3u == 0u ? (*previous_short_energy)[band_index] : energy[factor - 1u];
      const double temporal_limit = (0.025 * energy[factor] + 0.1 * previous) * nmr;
      if (threshold > temporal_limit) {
        threshold = temporal_limit;
      }
      if (factor % 3u == 2u) {
        (*previous_short_energy)[band_index] = energy[factor];
      }
    }
    result[factor] = threshold > floor ? threshold : floor;
  }
  return result;
}

// A marked 96-sample onset spans [begin, begin+95]. The 512-tap
// polyphase history carries it through begin+95+511. An MDCT reads
// 18 previous and 18 current 32-sample slots; their endpoints range
// from granule*576-545 to granule*576+575, all on the codec sample axis.
inline constexpr bool attackOverlapsTransform(std::uint8_t attacks, int input_granule,
                                              int transform_granule) noexcept {
  const int first_slot_end = transform_granule * 576 - 545;
  const int last_slot_end = transform_granule * 576 + 575;
  for (int window = 0; window < 6; ++window) {
    const int begin = input_granule * 576 + window * 96;
    if ((attacks & (1u << window)) != 0u && begin <= last_slot_end &&
        begin + 95 + 511 >= first_slot_end) {
      return true;
    }
  }
  return false;
}

} // namespace effetune::plugins::lofi::mp3
