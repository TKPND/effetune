import test from 'node:test';
import assert from 'node:assert/strict';
import { createReferenceSession } from '../../tools/dsp-parity/node-host.mjs';

const effects = ['HardClipping', 'Saturation', 'Exciter', 'HarmonicDistortion',
  'MultibandSaturation', 'DynamicSaturation'];

async function render(type, params, input, blockSize = 128) {
  const session = await createReferenceSession(`${type}Plugin`, { params });
  return session.process(input, { sampleRate: 48000, frames: input.length,
    channels: 1, blockSize });
}

function toneMagnitude(signal, frequency, start = 1024) {
  let real = 0;
  let imaginary = 0;
  for (let i = start; i < signal.length; i++) {
    const angle = 2 * Math.PI * frequency * i / 48000;
    real += signal[i] * Math.cos(angle);
    imaginary += signal[i] * Math.sin(angle);
  }
  return 2 * Math.hypot(real, imaginary) / (signal.length - start);
}

test('Oversampling defaults to 1x and survives parameter round trips', async () => {
  for (const type of effects) {
    const { plugin } = await createReferenceSession(`${type}Plugin`);
    assert.equal(plugin.getParameters().os, 1, type);
    for (const os of [2, 4, 8]) {
      plugin.setParameters({ os });
      assert.equal(plugin.getParameters().os, os, type);
    }
    plugin.setParameters({ os: 3 });
    assert.equal(plugin.getParameters().os, 8, type);
  }
});

test('Oversampling removes folded harmonics from 10 kHz distortion at 48 kHz', async () => {
  const input = Float32Array.from({ length: 5824 }, (_, i) => Math.sin(2 * Math.PI * 10000 * i / 48000));
  for (const [type, params] of [
    ['HardClipping', { th: -12 }],
    ['Saturation', { dr: 10, bs: 0, gn: 0 }],
    ['Exciter', { dr: 10, bs: 0, hs: 0, mx: 100 }],
    ['HarmonicDistortion', { h2: 0, h3: 30, h4: 0, h5: 30, sn: 1 }],
    ['MultibandSaturation', { bands: Array.from({ length: 3 }, () => ({ dr: 10, bs: 0, mx: 100, gn: 0 })) }],
    ['DynamicSaturation', { sd: 10, dd: 10, db: 0, cm: 100 }]
  ]) {
    const original = await render(type, { ...params, os: 1 }, input);
    const filtered = await render(type, { ...params, os: type === 'HardClipping' ? 16 : 8 }, input);
    const before = toneMagnitude(original, 18000);
    const after = toneMagnitude(filtered, 18000);
    assert.ok(after < before * 0.02, `${type}: folded 18 kHz ${before} -> ${after}`);
  }
});

test('Oversampled FIR state is independent of audio block boundaries', async () => {
  const input = Float32Array.from({ length: 513 }, (_, i) => 0.4 * Math.sin(i * 0.47));
  for (const type of effects) {
    const whole = await render(type, { os: 4 }, input, 128);
    const split = await render(type, { os: 4 }, input, 17);
    let difference = 0;
    for (let i = 0; i < input.length; i++) difference = Math.max(difference, Math.abs(whole[i] - split[i]));
    assert.ok(difference < 1e-5, `${type}: ${difference}`);
  }
});

test('Dry saturation retains unity gain and the declared 64-sample delay', async () => {
  const input = new Float32Array(256);
  input[0] = 1;
  const output = await render('Saturation', { os: 8, mx: 0, gn: 0 }, input);
  assert.equal(output[64], 1);
  assert.equal(output.reduce((sum, value) => sum + Math.abs(value), 0), 1);
});

test('Brickwall Limiter oversampling preserves the audible passband and integer latency', async () => {
  const params = { th: 0, sm: 0, la: 0, ig: 0 };
  for (const os of [2, 4, 8]) {
    const input = Float32Array.from({ length: 5824 }, (_, i) => 0.1 * Math.sin(2 * Math.PI * 20000 * i / 48000));
    const output = await render('BrickwallLimiter', { ...params, os }, input);
    assert.ok(Math.abs(toneMagnitude(output, 20000) - 0.1) < 0.0001, `${os}x passband`);
    const impulse = new Float32Array(257);
    impulse[0] = 0.1;
    const response = await render('BrickwallLimiter', { ...params, os }, impulse);
    const peak = response.reduce((index, value, i) => Math.abs(value) > Math.abs(response[index]) ? i : index, 0);
    assert.equal(peak, 65, `${os}x latency`);
    const split = await render('BrickwallLimiter', { ...params, os }, input, 17);
    assert.deepEqual(split, output);
  }
});

test('Brickwall Limiter contains reconstruction peaks and reduces folded harmonics', async () => {
  const input = Float32Array.from({ length: 14400 }, (_, i) => Math.sin(2 * Math.PI * 10000 * i / 48000));
  const params = { th: -12, sm: 0, la: 0, ig: 0, rl: 10 };
  const original = await render('BrickwallLimiter', { ...params, os: 1 }, input);
  const filtered = await render('BrickwallLimiter', { ...params, os: 8 }, input);
  assert.ok(filtered.every(value => Math.abs(value) <= Math.fround(10 ** (-12 / 20))));
  // The final ceiling guard may add harmonics; require a net reduction as well as peak containment.
  assert.ok(toneMagnitude(filtered, 18000, 9600) < toneMagnitude(original, 18000, 9600) * 0.25);
});

test('Oversampling history survives bypass without adopting bypass channel changes', async () => {
  for (const type of effects) {
    const options = { sampleRate: 48000, frames: 128, channels: 1, blockSize: 128 };
    const prefix = Float32Array.from({ length: 128 }, (_, i) => 0.2 * Math.sin(i));
    const paused = await createReferenceSession(`${type}Plugin`, { params: { os: 4 } });
    const active = await createReferenceSession(`${type}Plugin`, { params: { os: 4 } });
    await paused.process(prefix, options);
    await active.process(prefix, options);
    paused.plugin.enabled = false;
    await paused.process(new Float32Array(256), { ...options, channels: 2 });
    paused.plugin.enabled = true;
    assert.deepEqual(await paused.process(prefix, options), await active.process(prefix, options), type);
  }
});
