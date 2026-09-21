import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

import { DSP_PARAM_PACKERS } from '../../js/audio/dsp-params.generated.js';
import { instantiateDsp } from '../../js/audio/dsp-wasm-loader.js';
import { buildIrAssetPayload, IR_ASSET_TOPOLOGY } from '../../js/ir-library/ir-asset-payload.js';
import { estimateIrKernelCommitFootprint } from '../../js/ir-library/ir-plugin-contract.js';
import { parseTelemetryPacket, TelemetryFrameType } from '../../js/audio/telemetry-hub.js';

const SAMPLE_RATE = 48000;
const BLOCK_SIZE = 128;
const TAPS = 8192;
const CHANNELS = 4;
const TELEMETRY_BYTES = 32768;

function createStatusReceiver() {
  const window = { audioManager: { outputChannelCount: CHANNELS } };
  const context = vm.createContext({
    window, document: {}, console, performance, setTimeout, clearTimeout,
    __EFFECTUNE_WASM_ONLY__: true,
    MutationObserver: class { observe() {} disconnect() {} }
  });
  for (const file of ['plugin-base.js', 'basics/bass_management.js']) {
    vm.runInContext(fs.readFileSync(new URL(`../../plugins/${file}`, import.meta.url), 'utf8'), context);
  }
  const plugin = new window.BassManagementPlugin();
  plugin.id = 73;
  plugin.audioHostActive = false;
  plugin._scheduleDesign = () => {};
  plugin._statusElement = { textContent: '', dataset: {} };
  const worklet = { port: {} };
  window.workletNode = worklet;
  plugin._messageHandlerWorkletNode = worklet;
  return plugin;
}

function parameters(overrides = {}) {
  const roles = Array(16).fill(3);
  roles[0] = 1;
  const routes = Array(16).fill(0);
  routes[0] = 2;
  return {
    ph: 'IIR',
    tp: String(TAPS),
    ro: roles,
    fc: Array(16).fill(80),
    sl: Array(16).fill(24),
    rt: routes,
    su: 2,
    lf: 120,
    ls: 24,
    lo: false,
    bg: 0,
    lg: 0,
    hg: 0,
    ...overrides
  };
}

for (const artifact of ['effetune-dsp.wasm', 'effetune-dsp.simd.wasm']) {
  test(`Bass Management ${artifact} accepts the app contract`, async () => {
    const wasm = fs.readFileSync(new URL(`../../plugins/dsp/${artifact}`, import.meta.url));
    const binding = await instantiateDsp(wasm);
    try {
      assert.notEqual(binding.createEngine(), 0);
      assert.equal(binding.prepare(SAMPLE_RATE, CHANNELS, BLOCK_SIZE, TELEMETRY_BYTES), 0);
      assert.equal(binding.setTelemetryRate(60), 0);
      const instance = binding.createInstance('BassManagementPlugin');
      assert.notEqual(instance, 0);
      assert.equal(binding.instanceSetTap(instance, 919), 0);
      const packer = DSP_PARAM_PACKERS.get('BassManagementPlugin');
      assert.ok(packer);

      assert.equal(binding.instanceSetParams(
        instance,
        packer.pack(parameters()),
        packer.hash
      ), 0);
      assert.equal(binding.instanceLatency(instance), 0);
      let arena = binding.getArenaViews();
      for (let block = 0; block < 7; block += 1) {
        arena.combined.fill(0.25);
        assert.equal(binding.instanceProcess(
          instance,
          arena.offsets.combined,
          CHANNELS,
          BLOCK_SIZE,
          block * BLOCK_SIZE / SAMPLE_RATE
        ), 0);
      }

      const packet = new ArrayBuffer(TELEMETRY_BYTES);
      const packetBytes = binding.telemetryRead(packet);
      const frames = [];
      const parsed = parseTelemetryPacket(packet, packetBytes, frame => frames.push(frame));
      assert.equal(parsed.ok, true);
      assert.equal(binding.lastTelemetryDroppedFrames, 0);
      assert.equal(frames.length, 1);
      assert.equal(frames[0].frameType, TelemetryFrameType.TAP_CHANNEL_COUNT);
      assert.equal(frames[0].formatVersion, 1);
      assert.equal(frames[0].tapId, 919);
      assert.equal(frames[0].payload.getUint32(0, true), CHANNELS);

      assert.equal(binding.instanceSetParams(
        instance,
        packer.pack(parameters({ ph: 'Linear' })),
        packer.hash
      ), 0);

      const impulse = new Float32Array(TAPS);
      impulse[TAPS / 2] = 1;
      const paths = [{ inputSlot: 0, outputSlot: 0, irChannel: 0 }];
      const payload = buildIrAssetPayload({
        channels: [impulse],
        sampleRate: SAMPLE_RATE,
        topology: IR_ASSET_TOPOLOGY.matrix,
        paths
      });
      const asset = {
        channels: 1,
        frames: TAPS,
        topology: IR_ASSET_TOPOLOGY.matrix,
        headBlock: BLOCK_SIZE,
        rateDivider: 1,
        pathCount: 1,
        inputCount: CHANNELS,
        processingChannels: CHANNELS,
        footprintBytes: estimateIrKernelCommitFootprint({
          frames: TAPS,
          assetChannels: 1,
          topology: IR_ASSET_TOPOLOGY.matrix,
          processingChannels: CHANNELS,
          headBlock: BLOCK_SIZE,
          pathCount: 1,
          inputCount: CHANNELS
        })
      };
      assert.equal(binding.instanceSetAsset(instance, 0, payload, asset, 1), 0);
      assert.equal(binding.instanceLatency(instance), TAPS / 2 + BLOCK_SIZE);
      arena = binding.getArenaViews();

      let state = binding.instanceAssetState(instance, 0) & 0xff;
      for (let block = 0; block < 128 && state === 2; block += 1) {
        arena.combined.fill(0);
        assert.equal(binding.instanceProcess(
          instance,
          arena.offsets.combined,
          CHANNELS,
          BLOCK_SIZE,
          (block + 1) * BLOCK_SIZE / SAMPLE_RATE
        ), 0);
        state = binding.instanceAssetState(instance, 0) & 0xff;
      }
      assert.equal(state, 3);

      // Match the worklet's dry -> stage -> restore replacement handshake.
      let next = parameters({ ph: 'Linear' });
      const plugin = createStatusReceiver();
      const lfeRoles = [1, 2, ...Array(14).fill(3)];
      const lfeRoutes = [4, 4, ...Array(14).fill(0)];
      for (const change of [
        { lo: true },
        { ro: lfeRoles, rt: lfeRoutes, su: 4 },
        { lf: 160 },
        { ls: 48 },
        { lo: false },
        { fc: [100, ...Array(15).fill(80)] },
        { tp: '16384' },
        { ro: [2, ...Array(15).fill(3)], rt: [4, ...Array(15).fill(0)], lo: true },
        { lo: false },
        { lo: true },
        { su: 0, rt: Array(16).fill(0) },
        { su: 4, rt: [4, ...Array(15).fill(0)] }
      ]) {
        next = { ...next, ...change };
        plugin.setParameters(next);
        const inputs = next.su === 0 ? [] : Array.from({ length: CHANNELS }, (_, channel) => channel)
          .filter(channel => next.ro[channel] === 1 || next.ro[channel] === 2 && next.lo);
        if (inputs.length === 0) {
          assert.equal(binding.instanceSetParams(instance, packer.pack(next), packer.hash), 0);
          binding.instanceAssetAbort(instance, 0);
          assert.equal(binding.instanceAssetState(instance, 0) & 255, 0);
          assert.equal(plugin.ph, 'Linear');
          if (next.su === 0) {
            arena = binding.getArenaViews();
            for (let block = 0; block < 80; block += 1) {
              for (let channel = 0; channel < CHANNELS; channel += 1) {
                arena.combined.fill((channel + 1) / 8, channel * BLOCK_SIZE,
                  (channel + 1) * BLOCK_SIZE);
              }
              assert.equal(binding.instanceProcess(
                instance, arena.offsets.combined, CHANNELS, BLOCK_SIZE, 4 + block / 375
              ), 0);
            }
            for (let channel = 0; channel < CHANNELS; channel += 1) {
              assert.ok(Math.abs(arena.combined[channel * BLOCK_SIZE] - (channel + 1) / 8) < 1e-6,
                'removing the final Sub must stop the previous routing');
            }
            assert.equal(plugin._statusElement.dataset.state, '');
            assert.equal(plugin._statusElement.textContent,
              'Select one or more Sub Outputs to configure bass management.');
          } else {
            assert.equal(plugin._statusElement.dataset.state, 'ready');
            assert.equal(plugin._statusElement.textContent,
              'Linear routing is active; no low-pass filters are required.');
          }
          continue;
        }
        const revision = plugin._nextWasmAssetOperationRevision(0);
        plugin._candidateAssetRevision = revision;
        plugin._candidateDesign = {};
        const dry = packer.pack(next);
        dry[0] = -1;
        assert.equal(binding.instanceSetParams(instance, dry, packer.hash), 0);
        arena = binding.getArenaViews();
        arena.combined.fill(0);
        assert.equal(binding.instanceProcess(
          instance, arena.offsets.combined, CHANNELS, BLOCK_SIZE, 1
        ), 0);
        assert.notEqual(binding.instanceAssetState(instance, 0) & 65536, 0);

        const frames = Number(next.tp);
        const channels = inputs.map(() => {
          const ir = new Float32Array(frames);
          ir[frames / 2] = 0.5;
          return ir;
        });
        const replacement = buildIrAssetPayload({
          channels, sampleRate: SAMPLE_RATE, topology: IR_ASSET_TOPOLOGY.matrix,
          paths: inputs.map((channel, irChannel) => ({
            inputSlot: channel, outputSlot: channel, irChannel
          }))
        });
        const descriptor = {
          ...asset, frames, channels: inputs.length, pathCount: inputs.length,
          footprintBytes: estimateIrKernelCommitFootprint({
            frames, assetChannels: inputs.length, topology: IR_ASSET_TOPOLOGY.matrix,
            processingChannels: CHANNELS, headBlock: BLOCK_SIZE,
            pathCount: inputs.length, inputCount: CHANNELS
          })
        };
        assert.equal(binding.instanceSetAsset(instance, 0, replacement, descriptor, 1), 0,
          `replacement rejected: ${JSON.stringify(change)}`);
        assert.equal(binding.instanceSetParams(instance, packer.pack(next), packer.hash), 0);
        arena = binding.getArenaViews();
        for (let block = 0; block < 256; block += 1) {
          arena.combined.fill(0);
          assert.equal(binding.instanceProcess(
            instance, arena.offsets.combined, CHANNELS, BLOCK_SIZE, 2 + block / 375
          ), 0);
          state = binding.instanceAssetState(instance, 0) & 255;
          if (state === 3) break;
          assert.notEqual(state, 4, 'replacement left a persistent error');
        }
        assert.equal(state, 3, `replacement did not become active: ${JSON.stringify(change)}`);
        plugin._handleMessage({ data: {
          type: 'assetState', pluginId: plugin.id, slot: 0,
          operationRevision: revision, state: binding.instanceAssetState(instance, 0)
        } });
        assert.equal(plugin.ph, 'Linear');
        assert.equal(plugin._statusElement.dataset.state, 'ready');
        assert.equal(plugin._statusElement.textContent,
          'Linear-phase bass management filters are active.');
      }
      plugin.cleanup();

      const unconfigured = binding.createInstance('BassManagementPlugin');
      assert.notEqual(unconfigured, 0);
      const initial = parameters({
        ph: 'Linear', su: 0,
        ro: [...Array(CHANNELS).fill(1), ...Array(16 - CHANNELS).fill(0)],
        rt: Array(16).fill(0)
      });
      assert.equal(binding.instanceSetParams(unconfigured, packer.pack(initial), packer.hash), 0);
      arena = binding.getArenaViews();
      for (let block = 0; block < 40; block += 1) {
        for (let channel = 0; channel < CHANNELS; channel += 1) {
          arena.combined.fill((channel + 1) / 8, channel * BLOCK_SIZE,
            (channel + 1) * BLOCK_SIZE);
        }
        assert.equal(binding.instanceProcess(
          unconfigured, arena.offsets.combined, CHANNELS, BLOCK_SIZE, block / 375
        ), 0);
      }
      for (let channel = 0; channel < CHANNELS; channel += 1) {
        assert.ok(Math.abs(arena.combined[channel * BLOCK_SIZE] - (channel + 1) / 8) < 1e-6,
          'initial Managed roles without a Sub must pass all channels through');
      }
      assert.equal(binding.instanceAssetState(unconfigured, 0) & 255, 0);
    } finally {
      binding.close();
    }
  });
}
