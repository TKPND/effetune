import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { TelemetryFrameType } from '../../js/audio/telemetry-hub.js';
import { validateParamSpec } from '../../scripts/gen-dsp-params.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const dspRoot = path.join(repoRoot, 'dsp', 'plugins', 'lofi', 'tv_audio_simulator');

test('TV Audio Simulator freezes its public parameter and parity-case contracts', async () => {
  const schemaPath = path.join(dspRoot, 'params.json');
  const [schemaText, casesText] = await Promise.all([
    fs.readFile(schemaPath, 'utf8'),
    fs.readFile(path.join(dspRoot, 'cases.json'), 'utf8')
  ]);
  const raw = JSON.parse(schemaText);
  const schema = validateParamSpec(raw, schemaPath);
  const cases = JSON.parse(casesText).cases;

  assert.equal(schema.type, 'TVAudioSimulatorPlugin');
  assert.equal(schema.floatCount, 14);
  assert.deepEqual(raw.fields.map(field => field.key),
    ['rd', 'ss', 'tx', 'pr', 'st', 'tn', 'bw', 'mp', 'dl', 'fd', 'sm', 'bz', 'og', 'mx']);
  assert.deepEqual(raw.fields.find(field => field.key === 'ss').values,
    ['M/EIA-J', 'M/BTSC', 'M/A2', 'B/G A2', 'B/G NICAM', 'I NICAM', 'D/K Mono', 'L AM']);
  assert.deepEqual(raw.fields.find(field => field.key === 'tx').values, ['Stereo', 'Mono', 'Dual']);
  assert.deepEqual(raw.fields.find(field => field.key === 'sm').values,
    ['Auto', 'Stereo', 'Main', 'Sub']);
  assert.equal(raw.fields.find(field => field.key === 'bw').publicName, 'ifBandwidth');
  assert.deepEqual(cases.map(entry => entry.id), [
    'eiaj-dual-sub-48000',
    'btsc-stereo-weak-signal',
    'a2-stereo-44100',
    'nicam-i-fallback-sweep-192000',
    'dk-mono-buzz-96000',
    'l-am-mono-96000'
  ]);
  assert.ok(cases.every(entry => entry.params?.fr === true),
    'parity cases must explicitly enable deterministic reference processing');
});

test('TV Audio Simulator has one end-to-end registration and telemetry identity', async () => {
  const [plugins, registry, cmake, bindingsSource, overlayText] = await Promise.all([
    fs.readFile(path.join(repoRoot, 'plugins', 'plugins.txt'), 'utf8'),
    fs.readFile(path.join(repoRoot, 'dsp', 'registry.inc'), 'utf8'),
    fs.readFile(path.join(repoRoot, 'dsp', 'CMakeLists.txt'), 'utf8'),
    fs.readFile(path.join(repoRoot, 'scripts', 'gen-dsp-library-bindings.mjs'), 'utf8'),
    fs.readFile(path.join(repoRoot, 'dsp', 'bindings', 'common', 'effects-v1.overlay.json'), 'utf8')
  ]);
  const overlay = JSON.parse(overlayText).effects.find(
    entry => entry.internalType === 'TVAudioSimulatorPlugin'
  );

  assert.match(plugins,
    /^lofi\/tv_audio_simulator: TV Audio Simulator \| Lo-Fi \| TVAudioSimulatorPlugin \| css$/m);
  assert.match(registry,
    /^EFFETUNE_PLUGIN\(TVAudioSimulatorPlugin, lofi\/tv_audio_simulator\)$/m);
  assert.match(cmake, /effetune_dsp_tv_audio_simulator_tests/);
  assert.match(bindingsSource,
    /TVAudioSimulatorPlugin: 'dsp\/plugins\/lofi\/tv_audio_simulator'/);
  assert.deepEqual(overlay.sampleRates,
    [44100, 48000, 88200, 96000, 176400, 192000, 352800, 384000]);
  assert.equal(overlay.parameters.ifBand.name, 'ifBandwidth');
  assert.deepEqual(overlay.telemetry, ['tvAudioStatus', 'tvAudioSpectrum']);
  assert.equal(TelemetryFrameType.TAP_TV_AUDIO_SIMULATOR, 25);
  assert.equal(new Set(Object.values(TelemetryFrameType)).size,
    Object.values(TelemetryFrameType).length, 'central telemetry frame IDs must be unique');
});
