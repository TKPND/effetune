import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import '../../plugins/multires-spectrum.js';
import { DSP_PARAM_PACKERS } from '../../js/audio/dsp-params.generated.js';
import { instantiateDsp } from '../../js/audio/dsp-wasm-loader.js';
import { parseTelemetryPacket } from '../../js/audio/telemetry-hub.js';

const sandbox = { window: {}, PluginBase: class {}, Float32Array, Math, MultiresSpectrum: globalThis.MultiresSpectrum };
vm.createContext(sandbox);
for (const name of ['note_spectrogram', 'chroma_spiral']) {
  vm.runInContext(fs.readFileSync(new URL(`../../plugins/analyzer/${name}.js`, import.meta.url), 'utf8'), sandbox);
}
const Plugin = sandbox.window.ChromaSpiralPlugin;
const processJs = new Function('context', 'data', 'parameters', Plugin.processorFunction);
const bytes = 256 * 1024;
const blockSize = 128;
const tapId = 208;

function fill(input, origin, rate, midis) {
  for (let i = 0; i < blockSize; i++) {
    let sample = 0;
    for (const midi of midis) {
      sample += 0.2 * Math.sin(2 * Math.PI * 440 * 2 ** ((midi - 69) / 12) * (origin + i) / rate);
    }
    input[i] = input[blockSize + i] = sample;
  }
}

function verify(snapshot, rate, midis) {
  assert.ok(snapshot, 'produced a decodable HQ frame');
  assert.equal(snapshot.points, rate === 44100 || rate === 48000 ? 13 : 14);
  assert.equal(snapshot.hopSamples, Math.max((1 << snapshot.points) / 2, Math.ceil(rate / 30)));
  assert.equal(snapshot.cellCount, 2048);
  const cells = [...Plugin.spectrumCells(snapshot, 1, 7)];
  const peaks = cells.filter((cell, index) =>
    cell.level >= (cells[index - 1]?.level ?? -Infinity) &&
    cell.level > (cells[index + 1]?.level ?? -Infinity));
  const strongest = peaks.sort((a, b) => b.level - a.level).slice(0, midis.length)
    .map(cell => Math.round(cell.midi)).sort((a, b) => a - b);
  assert.deepEqual(strongest, midis);
  return strongest;
}

for (const artifact of ['effetune-dsp.wasm', 'effetune-dsp.simd.wasm']) {
  test(`Chroma Spiral ${artifact} and JS agree on A4, C2, and C major at 44.1/96 kHz`, async () => {
    const binding = await instantiateDsp(fs.readFileSync(new URL(`../../plugins/dsp/${artifact}`, import.meta.url)));
    try {
      assert.notEqual(binding.createEngine(), 0);
      for (const rate of [44100, 96000]) {
        assert.equal(binding.prepare(rate, 2, blockSize, bytes), 0);
        assert.equal(binding.setTelemetryRate(60), 0);
        const instance = binding.createInstance('ChromaSpiralPlugin');
        assert.notEqual(instance, 0);
        assert.equal(binding.instanceSetTap(instance, tapId), 0);
        const packer = DSP_PARAM_PACKERS.get('ChromaSpiralPlugin');
        assert.ok(packer);
        assert.equal(binding.instanceSetParams(instance, packer.pack({}), packer.hash), 0);
        for (const midis of [[69], [36], [60, 64, 67]]) {
          assert.equal(binding.resetInstance(instance), 0);
          const arena = binding.getArenaViews();
          const context = {};
          globalThis.MultiresSpectrum.prepare(context, rate, 4);
          const packet = new ArrayBuffer(bytes);
          binding.telemetryRead(packet);
          let wasmSnapshot;
          let jsSnapshot;
          for (let origin = 0; origin < rate * 1.15; origin += blockSize) {
            fill(arena.combined, origin, rate, midis);
            const input = new Float32Array(arena.combined.subarray(0, blockSize * 2));
            const original = input.slice();
            processJs(context, input, { channelCount: 2, blockSize });
            assert.deepEqual(input.subarray(0), original, 'JS is audio pass-through');
            if (context.multiresFrame) {
              jsSnapshot = globalThis.MultiresSpectrum.decode(context.multiresFrame, 4);
              context.multiresSpectrum.release(context.multiresFrame);
            }
            assert.equal(binding.instanceProcess(instance, arena.offsets.combined, 2, blockSize, origin / rate), 0);
            for (let i = 0; i < original.length; i++) {
              const noise = ((origin + i % blockSize) & 1) === 0 ? 1e-19 : -1e-19;
              const canonical = Math.abs(original[i]) <= Math.fround(3.9810717055349695e-15) ? 0 : original[i];
              assert.equal(arena.combined[i], Math.fround(canonical + Math.fround(noise)),
                'WASM preserves the engine anti-denormal pass-through contract');
            }
            const length = binding.telemetryRead(packet);
            assert.equal(binding.lastTelemetryDroppedFrames, 0);
            if (length) assert.equal(parseTelemetryPacket(packet, length, frame => {
              assert.equal(frame.tapId, tapId);
              assert.equal(frame.frameType, 4);
              assert.equal(frame.formatVersion, 2);
              wasmSnapshot = globalThis.MultiresSpectrum.decode(frame, 4);
            }).ok, true);
          }
          assert.deepEqual(verify(wasmSnapshot, rate, midis), verify(jsSnapshot, rate, midis));
        }
        binding.destroyInstance(instance);
      }
    } finally {
      binding.close();
    }
  });
}
