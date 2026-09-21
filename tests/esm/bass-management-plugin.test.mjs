import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const pluginSource = fs.readFileSync(
  path.join(root, 'plugins/basics/bass_management.js'),
  'utf8'
);

class PluginBase {
  constructor(name, description) {
    this.name = name;
    this.description = description;
    this.enabled = true;
    this._sectionEnabled = true;
    this.id = 73;
    this.channel = null;
    this._wasmAssetOperationRevisions = new Map();
  }

  registerProcessor(source) { this.processorSource = source; }
  updateParameters() {}
  cleanup() {}
  isHeldByUser() { return false; }
  getParameters() {
    return {
      type: this.constructor.name,
      id: this.id,
      enabled: this.enabled,
      ...(this.channel !== null && { channel: this.channel })
    };
  }
  getSerializableParameters() {
    const { type, id, ...parameters } = this.getParameters();
    return parameters;
  }
  _setValidatedParameters(params) {
    if (params.enabled !== undefined) this.enabled = Boolean(params.enabled);
    if (params.channel !== undefined) this.channel = params.channel;
  }
  parseFiniteNumber(value, minimum, maximum, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(minimum, Math.min(maximum, number)) : fallback;
  }
  _nextWasmAssetOperationRevision(slot) {
    const revision = (this._wasmAssetOperationRevisions.get(slot) || 0) + 1;
    this._wasmAssetOperationRevisions.set(slot, revision);
    return revision;
  }
  _isCurrentWasmAssetOperation(slot, revision) {
    return this._wasmAssetOperationRevisions.get(slot) === revision;
  }
  setWasmAsset(slot, descriptor) {
    this.asset = { slot, descriptor };
    return this._nextWasmAssetOperationRevision(slot);
  }
  clearWasmAsset() { this.asset = null; }
}

function loadPlugin({ channelCount = 8, sampleRate = 48000 } = {}) {
  const window = { workletNode: { channelCount, context: { sampleRate } } };
  const context = vm.createContext({
    PluginBase,
    window,
    console,
    ArrayBuffer,
    setTimeout,
    clearTimeout,
    globalThis: null
  });
  context.globalThis = context;
  vm.runInContext(pluginSource, context, { filename: 'bass_management.js' });
  return { Plugin: window.BassManagementPlugin, context };
}

function configuredPlugin() {
  const { Plugin } = loadPlugin();
  const plugin = new Plugin();
  plugin._scheduleDesign = () => {};
  const roles = Array(16).fill(3);
  roles[0] = 1;
  roles[1] = 1;
  roles[2] = 2;
  plugin.setParameters({
    ro: roles,
    su: (1 << 2) | (1 << 3),
    rt: [12, 12, 4, ...Array(13).fill(0)]
  });
  return plugin;
}

test('Bass Management defaults the current bus to Managed pending a Sub output', () => {
  const { Plugin } = loadPlugin();
  const plugin = new Plugin();
  assert.equal(plugin.channel, 'A');
  assert.equal(plugin.ph, 'IIR');
  assert.equal(plugin.tp, '16384');
  assert.equal(plugin.su, 0);
  assert.deepEqual(Array.from(plugin.ro), [
    ...Array(8).fill(1), ...Array(8).fill(0)
  ]);
  assert.ok(plugin.ri.every(mask => mask === 0));
  assert.equal(plugin._configurationError(), '');
  assert.equal(plugin.offlineDspAssetRequired, false);
  assert.deepEqual(Array.from(Plugin.executionCapabilities.supportedChannelModes), ['all']);
});

test('Bass Management keeps an unconfigured Linear bus neutral without designing an asset', async () => {
  const { Plugin } = loadPlugin();
  const plugin = new Plugin();
  let designs = 0;
  plugin._scheduleDesign = () => { designs += 1; };

  plugin.setParameters({ ph: 'Linear' });

  assert.equal(designs, 0);
  assert.equal(plugin._statusState, '');
  assert.equal(plugin._statusMessage, 'Select one or more Sub Outputs to configure bass management.');
  const state = await plugin.createOfflineDspState({ sampleRate: 48000, outputChannelCount: 8 });
  assert.equal(state.offlineDspAssetRequired, false);
  assert.equal(state.assets.size, 0);
});

test('Bass Management keeps crossover controls at whole-Hertz precision', () => {
  const { Plugin } = loadPlugin();
  const plugin = new Plugin();
  const frequencies = [...plugin.fc];
  frequencies[0] = 77.46;
  plugin.setParameters({ fc: frequencies, lf: 119.6 });
  assert.equal(plugin.fc[0], 77);
  assert.equal(plugin.lf, 120);
});

test('Bass Management reports routing errors without silently changing channel numbers', () => {
  const plugin = configuredPlugin();
  assert.equal(plugin._configurationError(), '');
  plugin.setParameters({ su: 1 });
  assert.match(plugin._configurationError(), /both a Main input and a Sub output/);
  assert.equal(plugin.su, 1);
  plugin.setParameters({ su: 4, rt: [8, 4, 4, ...Array(13).fill(0)] });
  assert.match(plugin._configurationError(), /not an available Sub/);
  assert.equal(plugin.rt[0], 8);
  plugin.setParameters({ channel: 'L' });
  assert.match(plugin._configurationError(), /Set Ch to All/);

  const { Plugin } = loadPlugin({ channelCount: 2 });
  const outsideWidth = new Plugin();
  const roles = Array(16).fill(3);
  roles[2] = 1;
  outsideWidth.setParameters({ ro: roles, rt: [0, 0, 1, ...Array(13).fill(0)] });
  assert.match(outsideWidth._configurationError(), /outside the current processing width/);
});

test('Adding a Sub output makes it LFE and enables every input route at normal polarity', () => {
  const plugin = configuredPlugin();
  const roles = [...plugin.ro];
  roles[4] = 1;
  roles[6] = 0;
  plugin.setParameters({
    ro: roles,
    ri: [4, 0, 4, 8, 4, ...Array(11).fill(0)]
  });
  const setParameters = plugin.setParameters.bind(plugin);
  let updates = 0;
  plugin.setParameters = parameters => {
    updates += 1;
    return setParameters(parameters);
  };

  plugin._setSubOutputEnabled(5, true);

  assert.equal(updates, 1);
  assert.equal(plugin.su, 44);
  assert.deepEqual(Array.from(plugin.rt.slice(0, 8)), [44, 44, 36, 32, 32, 32, 32, 32]);
  assert.deepEqual(Array.from(plugin.ri.slice(0, 8)), [4, 0, 4, 0, 0, 0, 0, 0]);
  assert.equal(plugin.ro[5], 2);
  assert.equal(plugin.ro[6], 0);
  assert.equal(plugin._configurationError(), '');

  plugin._setSubOutputEnabled(5, false);
  assert.equal(updates, 2);
  assert.equal(plugin.su, 12);
  assert.deepEqual(Array.from(plugin.rt.slice(0, 8)), [12, 12, 4, 0, 0, 0, 0, 0]);
  assert.deepEqual(Array.from(plugin.ri.slice(0, 8)), [4, 0, 4, 0, 0, 0, 0, 0]);
  assert.equal(plugin.ro[5], 2);

  const loaded = configuredPlugin();
  loaded.setParameters({ su: 44 });
  assert.deepEqual(Array.from(loaded.rt.slice(0, 3)), [12, 12, 4]);
});

test('Routing and gain edits do not redesign an unchanged linear filter bank', () => {
  const plugin = configuredPlugin();
  plugin.ph = 'Linear';
  plugin._activeDesign = { inputChannels: [0, 1] };
  let designs = 0;
  plugin._scheduleDesign = () => { designs += 1; };
  const routes = [...plugin.rt];
  routes[0] = 4;
  const inversions = [...plugin.ri];
  inversions[0] = 4;
  plugin.setParameters({ rt: routes, ri: inversions, bg: -3, hg: -6 });
  assert.equal(designs, 0);
  assert.equal(plugin.getParameters().ri[0], 4);
  plugin.setParameters({ rt: [8, ...plugin.rt.slice(1)] });
  assert.equal(plugin.ri[0], 0);
  assert.equal(designs, 0);
  const frequencies = [...plugin.fc];
  frequencies[0] = 100;
  plugin.setParameters({ fc: frequencies });
  assert.equal(designs, 1);
});

test('Bass Management stages a diagonal matrix asset for the measured bus width', async () => {
  const plugin = configuredPlugin();
  plugin.ph = 'Linear';
  plugin.tp = '8192';
  plugin._processingChannelCount = 8;
  const payload = new ArrayBuffer(32 + 2 * 12 + 2 * 8192 * 4);
  const result = {
    payload,
    inputChannels: [0, 1],
    responses: [],
    responseFrequencies: [],
    l1Norms: [1, 1]
  };
  plugin._getRuntime = async () => ({
    IR_ASSET_TOPOLOGY: { matrix: 4 },
    estimateIrKernelCommitFootprint: () => payload.byteLength
  });
  assert.equal(await plugin._stageDesign(result), true);
  assert.equal(plugin.asset.slot, 0);
  assert.equal(plugin.asset.descriptor.pathCount, 2);
  assert.equal(plugin.asset.descriptor.inputCount, 8);
  assert.equal(plugin.asset.descriptor.processingChannels, 8);
  assert.equal(plugin.asset.descriptor.headBlock, 128);
  assert.equal(plugin.asset.descriptor.rateDivider, 1);
});

test('Bass Management offline state needs assets only for filtered Linear inputs', async () => {
  const plugin = configuredPlugin();
  let state = await plugin.createOfflineDspState({ sampleRate: 48000, outputChannelCount: 8 });
  assert.equal(state.offlineDspAssetRequired, false);
  assert.equal(state.assets.size, 0);

  plugin.ph = 'Linear';
  plugin.tp = '8192';
  const payload = new ArrayBuffer(64);
  let closed = false;
  plugin._getRuntime = async () => ({
    IR_ASSET_TOPOLOGY: { matrix: 4 },
    estimateIrKernelCommitFootprint: () => 4096,
    createBassManagementDesigner: () => ({
      design: async () => ({ payload, inputChannels: [0, 1] }),
      close() { closed = true; }
    })
  });
  state = await plugin.createOfflineDspState({ sampleRate: 96000, outputChannelCount: 8 });
  assert.equal(closed, true);
  assert.equal(state.offlineDspAssetRequired, true);
  assert.equal(state.assets.get(0).pathCount, 2);
  assert.equal(state.assets.get(0).inputCount, 8);
  assert.equal(state.assets.get(0).processingChannels, 8);
  assert.equal(state.assets.get(0).warmupSamples, 4224);
});

test('Bass Management channel telemetry accepts only the shared bounded frame', () => {
  const { Plugin } = loadPlugin();
  const plugin = new Plugin();
  plugin._scheduleDesign = () => {};
  const payload = new DataView(new ArrayBuffer(4));
  payload.setUint32(0, 16, true);
  assert.equal(plugin.parseDspChannelCountTelemetryFrame({
    frameType: 9,
    formatVersion: 1,
    payload
  }), 16);
  payload.setUint32(0, 17, true);
  assert.equal(plugin.parseDspChannelCountTelemetryFrame({
    frameType: 9,
    formatVersion: 1,
    payload
  }), null);
});
