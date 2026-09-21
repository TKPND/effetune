import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { SHIPPED_ENABLED_TYPES } from '../../js/audio/dsp-rollout.js';
import { packBassExtenderPluginParams } from '../../js/audio/dsp-params.generated.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

async function loadPlugin() {
  const source = await fs.readFile(
    path.join(repoRoot, 'plugins', 'saturation', 'bass_extender.js'), 'utf8');
  class PluginBase {
    constructor(name, description) {
      this.name = name;
      this.description = description;
      this.enabled = true;
      this.id = 'bass-extender-test';
    }
    registerProcessor(processor) { this.processor = processor; }
    parseFiniteNumber(value, minimum, maximum, fallback) {
      const number = Number(value);
      if (!Number.isFinite(number)) return fallback;
      return number < minimum ? minimum : (number > maximum ? maximum : number);
    }
    updateParameters() { this.updateCount = (this.updateCount || 0) + 1; }
    createParameterControl(label, minimum, maximum, step, value, onChange, unit) {
      return { label, minimum, maximum, step, value, onChange, unit };
    }
  }
  const document = {
    createElement(tagName) {
      return {
        tagName,
        children: [],
        hidden: false,
        textContent: '',
        attributes: {},
        appendChild(child) { this.children.push(child); },
        setAttribute(name, value) { this.attributes[name] = value; }
      };
    }
  };
  const context = { PluginBase, document, window: {} };
  vm.runInNewContext(source, context, { filename: 'bass_extender.js' });
  return context.window.BassExtenderPlugin;
}

test('Bass Extender exposes the WASM-only mono/stereo reset-on-resume contract', async () => {
  const Plugin = await loadPlugin();
  assert.equal(Plugin.executionCapabilities.requiresWasm, true);
  assert.deepEqual(Array.from(Plugin.executionCapabilities.supportedSampleRates), [
    44100, 48000, 88200, 96000, 176400, 192000
  ]);
  assert.deepEqual(Array.from(Plugin.executionCapabilities.supportedChannelModes), [
    'mono', 'stereo-pair'
  ]);
  assert.equal(Object.isFrozen(Plugin.executionCapabilities), true);

  const plugin = new Plugin();
  assert.equal(plugin.processor, 'return data;');
  assert.equal(plugin.getTemporalCapability(), 'reset-on-resume');
  assert.equal(SHIPPED_ENABLED_TYPES.includes('BassExtenderPlugin'), true);
});

test('Bass Extender keeps the calibrated two-parameter ABI', async () => {
  const Plugin = await loadPlugin();
  const plugin = new Plugin();
  assert.deepEqual(JSON.parse(JSON.stringify(plugin.getParameters())), {
    type: 'BassExtenderPlugin', am: 25, og: 0, enabled: true
  });

  plugin.setParameters({ am: 127, og: -30, enabled: false });
  assert.deepEqual(JSON.parse(JSON.stringify(plugin.getParameters())), {
    type: 'BassExtenderPlugin', am: 100, og: -24, enabled: false
  });
  plugin.setParameters({ am: 24.6, og: -1.24, enabled: true });
  assert.deepEqual({ am: plugin.am, og: plugin.og, enabled: plugin.enabled }, {
    am: 25, og: -1.2, enabled: true
  });
  plugin.setParameters({ am: Number.NaN, og: Number.NaN });
  assert.deepEqual({ am: plugin.am, og: plugin.og }, { am: 25, og: -1.2 });
});

test('Bass Extender generated parameter packing follows the UI contract', () => {
  assert.deepEqual(Array.from(packBassExtenderPluginParams()), [25, 0]);
  assert.deepEqual(
    Array.from(packBassExtenderPluginParams({ am: 101, og: -25 })), [100, -24]
  );
});

test('Bass Extender uses the standard two-control UI and validated bypass status', async () => {
  const Plugin = await loadPlugin();
  const plugin = new Plugin();
  const ui = plugin.createUI();
  assert.equal(ui.className, 'bass-extender-plugin-ui plugin-parameter-ui');
  assert.deepEqual(ui.children.slice(0, 2).map(control => ({
    label: control.label,
    minimum: control.minimum,
    maximum: control.maximum,
    step: control.step,
    value: control.value,
    unit: control.unit
  })), [
    { label: 'Amount', minimum: 0, maximum: 100, step: 1, value: 25, unit: '%' },
    { label: 'Output', minimum: -24, maximum: 0, step: 0.1, value: 0, unit: 'dB' }
  ]);

  const status = ui.children[2];
  plugin.onMessage({
    type: 'dspExecutionState', pluginId: plugin.id,
    pluginType: 'BassExtenderPlugin', state: 'bypassed', reason: 'wasmUnavailable'
  });
  assert.equal(status.hidden, true);
  plugin.onMessage({
    type: 'dspExecutionState', pluginId: plugin.id,
    pluginType: 'BassExtenderPlugin', state: 'bypassed', reason: 'wasmUnavailable', validated: true
  });
  assert.equal(status.hidden, false);
  assert.equal(status.textContent,
    'WASM audio processing is unavailable. Bass Extender is bypassed. Audio remains unchanged.');
  plugin.onMessage({
    type: 'dspExecutionState', pluginId: plugin.id,
    pluginType: 'BassExtenderPlugin', state: 'active', validated: true
  });
  assert.equal(status.hidden, true);
  assert.equal(status.textContent, '');
});
