import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import { DSP_PARAM_PACKERS } from '../../js/audio/dsp-params.generated.js';
import { instantiateDsp } from '../../js/audio/dsp-wasm-loader.js';
import { parseTelemetryPacket, TelemetryFrameType } from '../../js/audio/telemetry-hub.js';

const SAMPLE_RATE = 48000;
const CHANNELS = 2;
const BLOCK_SIZE = 128;
const TELEMETRY_BYTES = 256 * 1024;
const TAP_ID = 207;
const TONE_HZ = 440;

function median(values) {
  const ordered = values.slice().sort((a, b) => a - b);
  return ordered[Math.floor(ordered.length / 2)];
}

for (const artifact of ['effetune-dsp.wasm', 'effetune-dsp.simd.wasm']) {
  test(`Pitch Meter in ${artifact} reports a stable 440 Hz tone through v1 telemetry`, async () => {
    const bytes = fs.readFileSync(new URL(`../../plugins/dsp/${artifact}`, import.meta.url));
    const binding = await instantiateDsp(bytes);
    try {
      assert.notEqual(binding.createEngine(), 0);
      assert.equal(binding.prepare(SAMPLE_RATE, CHANNELS, BLOCK_SIZE, TELEMETRY_BYTES), 0);
      assert.equal(binding.setTelemetryRate(60), 0);
      const instanceId = binding.createInstance('PitchMeterPlugin');
      assert.notEqual(instanceId, 0);
      assert.equal(binding.instanceSetTap(instanceId, TAP_ID), 0);
      const packer = DSP_PARAM_PACKERS.get('PitchMeterPlugin');
      assert.ok(packer);
      assert.equal(binding.instanceSetParams(
        instanceId,
        packer.pack({ rf: 440, mn: 36, mx: 96 }),
        packer.hash
      ), 0);

      const arena = binding.getArenaViews();
      const totalBlocks = Math.ceil(0.7 * SAMPLE_RATE / BLOCK_SIZE);
      let processedFrames = 0;
      for (let block = 0; block < totalBlocks; block++) {
        for (let frame = 0; frame < BLOCK_SIZE; frame++) {
          const sample = 0.25 * Math.sin(
            2 * Math.PI * TONE_HZ * (processedFrames + frame) / SAMPLE_RATE + 0.123456
          );
          arena.combined[frame] = sample;
          arena.combined[BLOCK_SIZE + frame] = sample;
        }
        const input = new Float32Array(arena.combined.subarray(0, BLOCK_SIZE * CHANNELS));
        assert.equal(binding.instanceProcess(
          instanceId,
          arena.offsets.combined,
          CHANNELS,
          BLOCK_SIZE,
          processedFrames / SAMPLE_RATE
        ), 0);
        const expected = new Float32Array(input.length);
        for (let channel = 0; channel < CHANNELS; channel++) {
          for (let frame = 0; frame < BLOCK_SIZE; frame++) {
            const noise = ((processedFrames + frame) & 1) === 0 ? 1e-19 : -1e-19;
            const index = channel * BLOCK_SIZE + frame;
            expected[index] = Math.fround(input[index] + noise);
          }
        }
        assert.deepEqual(
          new Float32Array(arena.combined.subarray(0, BLOCK_SIZE * CHANNELS)),
          expected,
          'analysis preserves the engine pass-through contract'
        );
        processedFrames += BLOCK_SIZE;
      }

      const packet = new ArrayBuffer(TELEMETRY_BYTES);
      const packetBytes = binding.telemetryRead(packet);
      assert.equal(binding.lastTelemetryDroppedFrames, 0);
      const frames = [];
      const parsed = parseTelemetryPacket(packet, packetBytes, frame => frames.push(frame));
      assert.equal(parsed.ok, true);
      assert.ok(frames.length > 10);
      const voicedErrors = [];
      let previousFrameIndex;
      let generation;
      for (const frame of frames) {
        assert.equal(frame.frameType, TelemetryFrameType.TAP_PITCH_METER);
        assert.equal(frame.formatVersion, 1);
        assert.equal(frame.tapId, TAP_ID);
        assert.equal(frame.payloadBytes, 44);
        const payload = frame.payload;
        assert.equal(payload.getFloat32(0, true), SAMPLE_RATE);
        assert.ok(Math.abs(payload.getFloat32(8, true) - 0.01) < 1e-7);
        const frameIndex = payload.getUint32(12, true);
        const frameGeneration = payload.getUint32(16, true);
        if (previousFrameIndex !== undefined) {
          assert.equal(frameIndex, (previousFrameIndex + 1) >>> 0);
        }
        previousFrameIndex = frameIndex;
        if (generation === undefined) generation = frameGeneration;
        assert.equal(frameGeneration, generation);
        assert.notEqual(generation, 0);
        assert.equal(payload.getUint16(42, true), 0);
        if ((payload.getUint16(40, true) & 1) === 0) continue;
        const f0Hz = payload.getFloat32(20, true);
        const midi = payload.getFloat32(24, true);
        const cents = payload.getFloat32(28, true);
        const confidence = payload.getFloat32(32, true);
        const levelDb = payload.getFloat32(36, true);
        assert.ok(Number.isFinite(f0Hz) && f0Hz > 0);
        assert.ok(Number.isFinite(midi));
        assert.ok(Number.isFinite(cents) && cents >= -50 && cents <= 50);
        assert.ok(confidence >= 0 && confidence <= 1);
        assert.ok(Number.isFinite(levelDb));
        if (payload.getFloat32(4, true) >= 0.25) {
          voicedErrors.push(Math.abs(1200 * Math.log2(f0Hz / TONE_HZ)));
        }
      }
      assert.ok(voicedErrors.length > 10, 'settled tone produces voiced observations');
      assert.ok(median(voicedErrors) <= 5,
        `median settled error was ${median(voicedErrors)} cents`);
    } finally {
      binding.close();
    }
  });

  test(`Pitch Meter in ${artifact} retains +/-10 cent estimates at both MIDI endpoints`, async () => {
    const bytes = fs.readFileSync(new URL(`../../plugins/dsp/${artifact}`, import.meta.url));
    const binding = await instantiateDsp(bytes);
    try {
      assert.notEqual(binding.createEngine(), 0);
      assert.equal(binding.prepare(SAMPLE_RATE, CHANNELS, BLOCK_SIZE, TELEMETRY_BYTES), 0);
      assert.equal(binding.setTelemetryRate(60), 0);
      const instanceId = binding.createInstance('PitchMeterPlugin');
      assert.notEqual(instanceId, 0);
      assert.equal(binding.instanceSetTap(instanceId, TAP_ID), 0);
      const packer = DSP_PARAM_PACKERS.get('PitchMeterPlugin');
      assert.equal(binding.instanceSetParams(
        instanceId,
        packer.pack({ rf: 440, mn: 21, mx: 108 }),
        packer.hash
      ), 0);
      const arena = binding.getArenaViews();
      const packet = new ArrayBuffer(TELEMETRY_BYTES);
      for (const targetMidi of [20.9, 108.1]) {
        assert.equal(binding.resetInstance(instanceId), 0);
        binding.telemetryRead(packet);
        const toneHz = 440 * 2 ** ((targetMidi - 69) / 12);
        const totalBlocks = Math.ceil(SAMPLE_RATE / BLOCK_SIZE);
        let processedFrames = 0;
        for (let block = 0; block < totalBlocks; block++) {
          for (let frame = 0; frame < BLOCK_SIZE; frame++) {
            const sample = 0.35 * Math.sin(
              2 * Math.PI * toneHz * (processedFrames + frame) / SAMPLE_RATE + 0.123456
            );
            arena.combined[frame] = sample;
            arena.combined[BLOCK_SIZE + frame] = sample;
          }
          assert.equal(binding.instanceProcess(
            instanceId,
            arena.offsets.combined,
            CHANNELS,
            BLOCK_SIZE,
            processedFrames / SAMPLE_RATE
          ), 0);
          processedFrames += BLOCK_SIZE;
        }
        const frames = [];
        const packetBytes = binding.telemetryRead(packet);
        assert.equal(binding.lastTelemetryDroppedFrames, 0);
        assert.equal(parseTelemetryPacket(packet, packetBytes, frame => frames.push(frame)).ok,
          true);
        const errors = frames
          .filter(frame => frame.payload.getFloat32(4, true) >= 0.5 &&
            (frame.payload.getUint16(40, true) & 1) !== 0)
          .map(frame => Math.abs(frame.payload.getFloat32(24, true) - targetMidi) * 100);
        assert.ok(errors.length > 5, `MIDI ${targetMidi} produces settled voiced frames`);
        assert.ok(median(errors) <= 5,
          `MIDI ${targetMidi} median settled error was ${median(errors)} cents`);
      }
    } finally {
      binding.close();
    }
  });
}
