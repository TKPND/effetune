import assert from 'node:assert/strict';
import test from 'node:test';

import {
  designBassManagement,
  normalizeBassManagementDesignConfig
} from '../../js/bass-management/design-core.js';

test('Bass Management linear design creates one diagonal low-pass IR per filtered input', () => {
  const result = designBassManagement({
    sampleRate: 48000,
    channelCount: 6,
    taps: 8192,
    roles: [1, 0, 2, 3, 1, 3],
    frequencies: [80, 80, 80, 80, 140, 80],
    slopes: [24, 24, 24, 24, 96, 24],
    lfeLowpass: true,
    lfeFrequency: 120,
    lfeSlope: 48
  });

  assert.deepEqual(result.inputChannels, [0, 2, 4]);
  assert.equal(result.channels.length, 3);
  assert.ok(result.channels.every(channel => channel.length === 8192));
  assert.ok(result.channels.every(channel => Array.from(channel).every(Number.isFinite)));
  assert.equal(result.responses.length, 3);
  assert.ok(result.responses.every(response => response.length === result.responseFrequencies.length));
  assert.ok(result.l1Norms.every(value => Number.isFinite(value) && value >= 1));
  assert.deepEqual(result.latencyInfo, {
    filterDelaySamples: 4096,
    blockDelaySamples: 128,
    totalDelaySamples: 4224,
    resolutionHz: 48000 / 8192
  });
});

test('Bass Management uses the measured finite-IR response and complementary delayed Main', () => {
  const result = designBassManagement({
    sampleRate: 48000,
    channelCount: 2,
    taps: 8192,
    roles: [1, 0],
    frequencies: [80, 80],
    slopes: [96, 24]
  });
  const low = result.channels[0];
  const delay = result.latencyInfo.filterDelaySamples;
  let maximumReconstructionError = 0;
  for (let index = 0; index < low.length; index += 1) {
    const high = (index === delay ? 1 : 0) - low[index];
    const reconstructed = low[index] + high;
    maximumReconstructionError = Math.max(
      maximumReconstructionError,
      Math.abs(reconstructed - (index === delay ? 1 : 0))
    );
  }
  assert.ok(maximumReconstructionError < 1e-7);
  const lowerIndex = result.responseFrequencies.findIndex((frequency, index, values) =>
    frequency <= 80 && values[index + 1] >= 80);
  const lowerFrequency = result.responseFrequencies[lowerIndex];
  const upperFrequency = result.responseFrequencies[lowerIndex + 1];
  const fraction = (Math.log(80) - Math.log(lowerFrequency)) /
    (Math.log(upperFrequency) - Math.log(lowerFrequency));
  const cutoffMagnitude = result.responses[0][lowerIndex] +
    (result.responses[0][lowerIndex + 1] - result.responses[0][lowerIndex]) * fraction;
  assert.ok(Math.abs(cutoffMagnitude - 0.5) < 0.08);
});

test('Bass Management design normalization limits quality and channel settings', () => {
  const config = normalizeBassManagementDesignConfig({
    sampleRate: 1,
    channelCount: 99,
    taps: 65536,
    roles: [7, 1],
    frequencies: [1, 999],
    slopes: [72, 48],
    lfeFrequency: Infinity,
    lfeSlope: 72
  });
  assert.equal(config.sampleRate, 8000);
  assert.equal(config.channelCount, 16);
  assert.equal(config.taps, 16384);
  assert.deepEqual(config.roles.slice(0, 2), [0, 1]);
  assert.deepEqual(config.frequencies.slice(0, 2), [20, 300]);
  assert.deepEqual(config.slopes.slice(0, 2), [24, 48]);
  assert.equal(config.lfeFrequency, 120);
  assert.equal(config.lfeSlope, 24);
});
