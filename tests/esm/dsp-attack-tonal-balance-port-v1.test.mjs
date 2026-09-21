import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const pluginPath = path.join(repoRoot, 'plugins', 'dynamics', 'attack_tonal_balance.js');

async function loadPlugin() {
  const source = await fs.readFile(pluginPath, 'utf8');
  class PluginBase {
    constructor(name, description) {
      this.name = name;
      this.description = description;
      this.enabled = true;
    }
    registerProcessor(processor) { this.processor = processor; }
    parseFiniteNumber(value, minimum, maximum, fallback) {
      const number = Number(value);
      if (!Number.isFinite(number)) return fallback;
      return number < minimum ? minimum : (number > maximum ? maximum : number);
    }
    updateParameters() { this.updateCount = (this.updateCount || 0) + 1; }
    createParameterControl(label, minimum, maximum, step, value, onChange, unit, key) {
      const inputs = [
        { type: 'range', disabled: false },
        { type: 'number', disabled: false }
      ];
      return {
        kind: 'parameter', label, minimum, maximum, step, value, onChange, unit, key, inputs,
        querySelectorAll() { return inputs; }
      };
    }
    createCheckboxControl(label, checked, onChange, key) {
      return { kind: 'checkbox', label, checked, onChange, key };
    }
    registerUIRefresh(refresh) { this.uiRefresh = refresh; }
  }
  const document = {
    createElement() {
      return {
        children: [], className: '',
        appendChild(child) { this.children.push(child); }
      };
    }
  };
  const context = { PluginBase, document, window: {} };
  vm.runInNewContext(source, context, { filename: pluginPath });
  return context.window.AttackTonalBalancePlugin;
}

test('Attack Tonal Balance exposes the WASM-only reset-on-resume contract', async () => {
  const Plugin = await loadPlugin();
  assert.equal(Plugin.executionCapabilities.requiresWasm, true);
  assert.equal(Object.isFrozen(Plugin.executionCapabilities), true);

  const plugin = new Plugin();
  assert.equal(plugin.processor, 'return data;');
  assert.equal(plugin.getTemporalCapability(), 'reset-on-resume');
});

test('Attack Tonal Balance keeps a compact validated parameter ABI', async () => {
  const Plugin = await loadPlugin();
  const plugin = new Plugin();
  assert.deepEqual(JSON.parse(JSON.stringify(plugin.getParameters())), {
    type: 'AttackTonalBalancePlugin', at: 0, tn: 0, ae: true, te: true, enabled: true
  });

  plugin.setParameters({ at: -99, tn: 5.5, ae: false, te: true, enabled: false });
  assert.deepEqual(JSON.parse(JSON.stringify(plugin.getParameters())), {
    type: 'AttackTonalBalancePlugin', at: -12, tn: 5.5,
    ae: false, te: true, enabled: false
  });
  plugin.setParameters({ at: Number.NaN, tn: 99, ae: true, te: false, enabled: true });
  assert.deepEqual(JSON.parse(JSON.stringify(plugin.getParameters())), {
    type: 'AttackTonalBalancePlugin', at: -12, tn: 12,
    ae: true, te: false, enabled: true
  });

  const restored = new Plugin();
  restored.setParameters(JSON.parse(JSON.stringify(plugin.getParameters())));
  assert.deepEqual(JSON.parse(JSON.stringify(restored.getParameters())),
    JSON.parse(JSON.stringify(plugin.getParameters())));
});

test('Attack Tonal Balance JavaScript fallback is sample-exact pass-through', async () => {
  const Plugin = await loadPlugin();
  const plugin = new Plugin();
  const run = new Function('data', 'parameters', plugin.processor);
  const audio = new Float32Array([0.25, -0.5, Number.NaN, 0.75]);
  const result = run(audio, { enabled: true });
  assert.equal(result, audio);
  assert.equal(Number.isNaN(result[2]), true);
});

test('Attack Tonal Balance uses independent standard checkboxes and gain controls', async () => {
  const Plugin = await loadPlugin();
  const plugin = new Plugin();
  const ui = plugin.createUI();
  assert.equal(ui.className, 'plugin-parameter-ui');
  assert.deepEqual(ui.children.map(control => control.kind === 'checkbox' ? {
    kind: control.kind,
    label: control.label,
    checked: control.checked,
    key: control.key
  } : {
    kind: control.kind,
    label: control.label,
    minimum: control.minimum,
    maximum: control.maximum,
    step: control.step,
    value: control.value,
    unit: control.unit,
    key: control.key
  }), [
    { kind: 'checkbox', label: 'Attack Enabled', checked: true, key: 'ae' },
    { kind: 'parameter', label: 'Attack', minimum: -12, maximum: 12,
      step: 0.5, value: 0, unit: 'dB', key: 'at' },
    { kind: 'checkbox', label: 'Tonal Enabled', checked: true, key: 'te' },
    { kind: 'parameter', label: 'Tonal', minimum: -12, maximum: 12,
      step: 0.5, value: 0, unit: 'dB', key: 'tn' }
  ]);

  assert.deepEqual(ui.children[1].inputs.map(input => [input.type, input.disabled]), [
    ['range', false], ['number', false]
  ]);
  assert.deepEqual(ui.children[3].inputs.map(input => [input.type, input.disabled]), [
    ['range', false], ['number', false]
  ]);

  ui.children[0].onChange(false);
  assert.deepEqual(ui.children[1].inputs.map(input => input.disabled), [true, true]);
  assert.deepEqual(ui.children[3].inputs.map(input => input.disabled), [false, false]);
  plugin.setParameters({ at: 4.5, te: false, tn: -3 });
  assert.deepEqual(ui.children[1].inputs.map(input => input.disabled), [true, true]);
  assert.deepEqual(ui.children[3].inputs.map(input => input.disabled), [true, true]);
  assert.deepEqual(JSON.parse(JSON.stringify(plugin.getParameters())), {
    type: 'AttackTonalBalancePlugin', at: 4.5, tn: -3,
    ae: false, te: false, enabled: true
  });

  plugin.setParameters({ ae: true, te: true });
  assert.deepEqual(ui.children[1].inputs.map(input => input.disabled), [false, false]);
  assert.deepEqual(ui.children[3].inputs.map(input => input.disabled), [false, false]);
  assert.equal(plugin.at, 4.5);
  assert.equal(plugin.tn, -3);

  const restored = new Plugin();
  restored.setParameters({ at: 2.5, tn: -1.5, ae: false, te: true });
  const restoredUI = restored.createUI();
  assert.deepEqual(restoredUI.children[1].inputs.map(input => input.disabled), [true, true]);
  assert.deepEqual(restoredUI.children[3].inputs.map(input => input.disabled), [false, false]);
  assert.equal(restored.at, 2.5);
  assert.equal(restored.tn, -1.5);
});

test('Attack Tonal Balance is registered and enabled in display order', async () => {
  const source = await fs.readFile(path.join(repoRoot, 'plugins', 'plugins.txt'), 'utf8');
  const attackEntry =
    'dynamics/attack_tonal_balance: Attack Tonal Balance | Dynamics | AttackTonalBalancePlugin';
  assert.ok(source.indexOf(attackEntry) > source.indexOf('delay/time_alignment:'));
  assert.ok(source.indexOf(attackEntry) < source.indexOf('dynamics/auto_leveler:'));

  const rollout = await import(`${pathToFileURL(path.join(repoRoot, 'js', 'audio', 'dsp-rollout.js'))}` +
    `?attack-tonal-balance=${Date.now()}`);
  const attackIndex = rollout.SHIPPED_ENABLED_TYPES.indexOf('AttackTonalBalancePlugin');
  assert.notEqual(attackIndex, -1);
  assert.equal(rollout.SHIPPED_ENABLED_TYPES[attackIndex - 1], 'TimeAlignmentPlugin');
  assert.equal(rollout.SHIPPED_ENABLED_TYPES[attackIndex + 1], 'AutoLevelerPlugin');
});
