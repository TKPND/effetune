const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const test = require('node:test');

const { initializeGpuAcceleration } = require('../../electron/gpu-acceleration.cjs');

function createHarness(initialConfig = {}) {
  const app = new EventEmitter();
  const calls = [];
  let currentConfig = { ...initialConfig };
  let time = 0;
  let saveSucceeds = true;
  let quitting = false;
  app.disableHardwareAcceleration = () => calls.push('disable');
  app.quit = () => calls.push('quit');
  const config = {
    loadConfig: () => ({ ...currentConfig }),
    saveConfig: next => {
      calls.push(['save', { ...next }]);
      if (!saveSucceeds) return false;
      currentConfig = { ...next };
      return true;
    }
  };
  const startup = initializeGpuAcceleration({
    app, config,
    queueRestart: () => calls.push('relaunch'),
    isQuitting: () => quitting,
    now: () => time,
    onDiagnostic: () => {}
  });
  return {
    calls, startup,
    get config() { return currentConfig; },
    fail(reason = 'crashed', type = 'GPU') {
      app.emit('child-process-gone', {}, { type, reason, exitCode: 1 });
    },
    saveConfig(next) { config.saveConfig(next); },
    finishQuit() { app.emit('will-quit'); },
    setTime(value) { time = value; },
    setSaveSucceeds(value) { saveSucceeds = value; },
    setQuitting(value) { quitting = value; }
  };
}

test('hardware acceleration starts on and repeated GPU failures restart once in software mode', () => {
  const harness = createHarness({ theme: 'dark' });
  assert.equal(harness.startup.fallbackPending, false);
  assert.deepEqual(harness.calls, []);

  harness.fail();
  harness.fail('launch-failed');
  assert.deepEqual(harness.calls, []);
  harness.fail('abnormal-exit');
  harness.fail();

  assert.deepEqual(harness.config, {
    theme: 'dark', hardwareAcceleration: false, graphicsFallbackPending: true
  });
  assert.deepEqual(harness.calls, [
    ['save', harness.config], 'relaunch', 'quit'
  ]);
});

test('software mode is selected before ready and does not react to GPU process failures', () => {
  const harness = createHarness({ hardwareAcceleration: false, graphicsFallbackPending: true });
  assert.equal(harness.startup.fallbackPending, true);
  for (let index = 0; index < 4; index++) harness.fail();
  assert.deepEqual(harness.calls, ['disable']);
});

test('shutdown preserves the software fallback after a stale renderer config save', () => {
  const harness = createHarness({ theme: 'dark' });
  for (let index = 0; index < 3; index++) harness.fail();
  harness.saveConfig({ theme: 'light', hardwareAcceleration: true });
  harness.finishQuit();

  assert.deepEqual(harness.config, {
    theme: 'light', hardwareAcceleration: false, graphicsFallbackPending: true
  });
});

test('unrelated exits, quitting, and failures outside the time window do not trigger recovery', () => {
  const harness = createHarness();
  harness.fail('crashed', 'Utility');
  harness.fail('clean-exit');
  harness.fail('oom');
  harness.fail();
  harness.setTime(60_000);
  harness.fail();
  harness.setQuitting(true);
  harness.fail();
  assert.deepEqual(harness.calls, []);
});

test('failed persistence does not restart into the same graphics failure', () => {
  const harness = createHarness();
  harness.setSaveSucceeds(false);
  for (let index = 0; index < 3; index++) harness.fail();
  assert.equal(harness.calls.filter(call => call === 'relaunch').length, 0);
  assert.equal(harness.calls.filter(call => call === 'quit').length, 0);
});
