import assert from 'node:assert/strict';
import test from 'node:test';

import {
  AssetError,
  BassManagement,
  ValidationError,
  createChain,
  encodeEta1,
  importLegacyPreset
} from '../dist/index.js';

function parameters(overrides = {}) {
  const roles = Array(16).fill(3);
  roles[0] = 1;
  roles[1] = 1;
  roles[2] = 2;
  return {
    phase: 'IIR',
    taps: '8192',
    roles,
    frequencies: Array(16).fill(80),
    slopes: Array(16).fill(24),
    routes: [12, 12, 4, ...Array(13).fill(0)],
    subs: 12,
    lfeFrequency: 120,
    lfeSlope: 24,
    lfeLowpass: false,
    bassGain: 0,
    lfeGain: 0,
    headroom: 0,
    ...overrides
  };
}

function linearAsset({ path = { inputSlot: 0, outputSlot: 0, irChannel: 0 } } = {}) {
  const impulse = new Float32Array(8192);
  impulse[4096] = 0.5;
  return encodeEta1({
    channels: [impulse],
    sampleRate: 48000,
    topology: 'matrix',
    paths: [path]
  });
}

test('BassManagement IIR and configured no-filter Linear configurations do not require assets', async () => {
  const iir = await createChain([
    new BassManagement({ id: 'bass', channel: 'all', ...parameters() })
  ], { variant: 'baseline' });
  try {
    const stream = await iir.stream({ sampleRate: 48000, channels: 4, blockSize: 64 });
    assert.equal(stream.latencySamples, 0);
    stream.close();
  } finally {
    iir.close();
  }

  const roles = Array(16).fill(3);
  roles[0] = 0;
  roles[1] = 0;
  const linear = await createChain([
    new BassManagement({
      id: 'bass',
      channel: 'all',
      ...parameters({
        phase: 'Linear',
        roles,
        routes: Array(16).fill(0),
        subs: 0
      })
    })
  ], { variant: 'baseline' });
  try {
    const stream = await linear.stream({ sampleRate: 48000, channels: 4, blockSize: 64 });
    assert.equal(stream.latencySamples, 4224);
    stream.close();
  } finally {
    linear.close();
  }
});

test('BassManagement preserves unconfigured Managed/LFE roles without requiring assets', async () => {
  const roles = [1, 2, ...Array(14).fill(0)];
  const frequencies = Array(16).fill(81);
  const slopes = Array(16).fill(48);
  const routes = Array(16).fill(0);
  const routeInversions = Array(16).fill(0);
  for (const phase of ['IIR', 'Linear']) {
    const effect = new BassManagement({ id: `bass-${phase}`, phase, taps: '8192', roles });
    assert.deepEqual(effect.toJSON().parameters.roles, roles);

    const chain = await createChain([effect], { variant: 'baseline' });
    try {
      const stream = await chain.stream({ sampleRate: 48000, channels: 2, blockSize: 64 });
      assert.equal(stream.latencySamples, phase === 'Linear' ? 4224 : 0);
      stream.close();
    } finally {
      chain.close();
    }

    const imported = importLegacyPreset({
      pipeline: [{
        name: 'Bass Management',
        enabled: true,
        channel: 'A',
        parameters: {
          ph: phase,
          tp: '8192',
          ro: roles,
          fc: frequencies,
          sl: slopes,
          rt: routes,
          ri: routeInversions,
          su: 0,
          lf: 121,
          ls: 96,
          lo: true,
          bg: -1,
          lg: 2,
          hg: -3
        }
      }]
    });
    assert.deepEqual(imported.chain[0].parameters, {
      phase,
      taps: '8192',
      roles,
      frequencies,
      slopes,
      routes,
      subs: 0,
      lfeFrequency: 121,
      lfeSlope: 96,
      lfeLowpass: true,
      bassGain: -1,
      lfeGain: 2,
      headroom: -3,
      routeInversions
    });
    assert.deepEqual(imported.chain[0].assets, {});
  }

  const configuredRoutes = [12, 12, 4, ...Array(13).fill(0)];
  const configuredInversions = [8, 4, 4, ...Array(13).fill(0)];
  const configured = importLegacyPreset({
    pipeline: [{
      name: 'Bass Management',
      enabled: true,
      channel: 'A',
      parameters: {
        ph: 'IIR', tp: '16384', ro: parameters().roles, fc: frequencies, sl: slopes,
        rt: configuredRoutes, ri: configuredInversions, su: 12,
        lf: 120, ls: 24, lo: false, bg: 0, lg: 0, hg: 0
      }
    }]
  }).chain[0];
  assert.deepEqual(configured.parameters.routes, configuredRoutes);
  assert.deepEqual(configured.parameters.routeInversions, configuredInversions);

  assert.throws(() => importLegacyPreset({
    pipeline: [{
      name: 'Bass Management',
      enabled: true,
      channel: 'A',
      parameters: { ro: Array(8).fill(1) }
    }]
  }), ValidationError);
});

test('BassManagement validates All-channel routing against the stream width', async () => {
  const invalidEffects = [
    new BassManagement({ id: 'bass', channel: 'left', ...parameters() }),
    new BassManagement({ id: 'bass', channel: 'all', ...parameters({ subs: 1 }) }),
    new BassManagement({
      id: 'bass',
      channel: 'all',
      ...parameters({ routes: [8, 12, 4, ...Array(13).fill(0)], subs: 4 })
    })
  ];
  for (const effect of invalidEffects) {
    await assert.rejects(
      createChain([effect], { variant: 'baseline' }),
      ValidationError
    );
  }

  const chain = await createChain([
    new BassManagement({ id: 'bass', channel: 'all', ...parameters() })
  ], { variant: 'baseline' });
  try {
    await assert.rejects(
      chain.stream({ sampleRate: 48000, channels: 3 }),
      ValidationError
    );
  } finally {
    chain.close();
  }
});

test('BassManagement Linear requires a matching diagonal low-pass asset', async () => {
  const roles = Array(16).fill(3);
  roles[1] = 1;
  const effectOptions = {
    id: 'bass',
    channel: 'all',
    ...parameters({
      phase: 'Linear',
      roles,
      routes: [0, 1, ...Array(14).fill(0)],
      subs: 1,
      assets: { impulseResponse: 'filters' }
    })
  };
  await assert.rejects(
    createChain([
      new BassManagement({ ...effectOptions, assets: undefined })
    ], { variant: 'baseline' }),
    AssetError
  );

  const chain = await createChain([new BassManagement(effectOptions)], {
    variant: 'baseline',
    assetResolver: () => linearAsset({
      path: { inputSlot: 1, outputSlot: 1, irChannel: 0 }
    })
  });
  try {
    const stream = await chain.stream({ sampleRate: 48000, channels: 2, blockSize: 64 });
    assert.equal(stream.latencySamples, 4224);
    stream.close();
  } finally {
    chain.close();
  }

  const mismatched = await createChain([new BassManagement(effectOptions)], {
    variant: 'baseline',
    assetResolver: () => linearAsset({
      path: { inputSlot: 0, outputSlot: 0, irChannel: 0 }
    })
  });
  try {
    await assert.rejects(
      mismatched.stream({ sampleRate: 48000, channels: 2 }),
      AssetError
    );
  } finally {
    mismatched.close();
  }
});

test('BassManagement streams allow gain updates and reject routing reconfiguration', async () => {
  const chain = await createChain([
    new BassManagement({ id: 'bass', channel: 'all', ...parameters() })
  ], { variant: 'baseline' });
  const stream = await chain.stream({ sampleRate: 48000, channels: 4, blockSize: 64 });
  try {
    stream.setParam('bass', 'bassGain', -3);
    stream.setParam('bass', 'headroom', -6);
    assert.equal(stream.effects[0].parameters.bassGain, -3);
    assert.equal(stream.effects[0].parameters.headroom, -6);
    assert.throws(
      () => stream.setParam('bass', 'routes', [4, 12, 4, ...Array(13).fill(0)]),
      error => error instanceof ValidationError &&
        error.message.includes('cannot be updated while a stream is open')
    );
    assert.throws(
      () => stream.setParam('bass', 'routeInversions', [8, ...Array(15).fill(0)]),
      ValidationError
    );
  } finally {
    stream.close();
    chain.close();
  }
});

test('BassManagement route inversions are restricted to enabled routes and round-trip', async () => {
  const routeInversions = [8, 0, 4, ...Array(13).fill(0)];
  const effect = new BassManagement({ ...parameters(), routeInversions });
  assert.deepEqual(effect.toJSON().parameters.routeInversions, routeInversions);
  const chain = await createChain([effect], { variant: 'baseline' });
  chain.close();
  await assert.rejects(createChain([
    new BassManagement({ ...parameters(), routeInversions: [1, ...Array(15).fill(0)] })
  ], { variant: 'baseline' }), ValidationError);
});
