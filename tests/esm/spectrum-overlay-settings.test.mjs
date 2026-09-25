import assert from 'node:assert/strict';
import test from 'node:test';
import { createOverlayHarness } from '../helpers/spectrum-overlay-harness.mjs';
import { AudioManager } from '../../js/audio-manager.js';
import { VISUAL_SYNC_RULES } from '../../js/audio/visual-sync.js';

function normalMessage(amplitude) {
  return {
    type: 'spectrumOverlay', spectrumPluginId: 7, mode: 'compare', quality: 'normal',
    inputBuffer: new Float32Array(4096).fill(amplitude),
    outputBuffer: new Float32Array(4096).fill(amplitude / 2),
    bufferPosition: 0, sampleRate: 48000
  };
}

test('quality preferences apply to existing, resumed, and newly attached overlays', () => {
  const h = createOverlayHarness();
  let { instance } = h.attach();
  instance.enable();
  assert.equal(h.posts.at(-1).quality, 'normal');
  h.overlay.setSettings({ quality: 'hq', peakHold: true });
  assert.equal(h.posts.at(-1).quality, 'hq');
  const count = h.posts.length;
  h.overlay.setSettings({ quality: 'hq', peakHold: true });
  assert.equal(h.posts.length, count);
  instance.onSpectrumMessage({ ...normalMessage(1), mode: 'after' });
  assert.equal(instance.pending, null, 'queued data from the previous quality must be ignored');
  h.intersect(false);
  h.overlay.setSettings({ quality: 'normal' });
  h.intersect(true);
  assert.equal(h.posts.at(-1).quality, 'normal');
  h.overlay.setSettings({ quality: 'hq' });
  ({ instance } = h.attach());
  assert.equal(h.posts.at(-1).quality, 'hq');
  instance.dispose();
});

test('first attachment loads saved settings and a quality change refreshes visual sync timing', () => {
  const h = createOverlayHarness();
  h.window.appConfig = { spectrumOverlayQuality: 'hq', spectrumOverlayPeakHold: true };
  let updates = 0;
  h.window.audioManager._scheduleVisualSyncUpdate = () => updates++;
  const { instance } = h.attach();
  instance.enable();
  assert.equal(h.overlay.quality, 'hq');
  assert.equal(h.posts.at(-1).quality, 'hq');
  assert.equal(updates, 1);
  h.overlay.setSettings({ peakHold: false });
  assert.equal(updates, 1);
  instance.dispose();
});

test('HQ overlay capture age follows the shared analyzer window and delay reservation', () => {
  const previousWindow = globalThis.window;
  try {
    globalThis.window = { SpectrumOverlay: { quality: 'hq', TARGETS: new Map([['BandPassFilterPlugin', {}]]) } };
    const plugin = { id: 7, constructor: { name: 'BandPassFilterPlugin' } };
    const manager = Object.assign(Object.create(AudioManager.prototype), {
      contextManager: { audioContext: { sampleRate: 48000 } },
      visualSyncEnabled: true, pipeline: [plugin], dspLatencyTaps: { 7: { output: 0 } },
      _getPrimaryWorkletNode: () => null
    });
    for (const sampleRate of [48000, 96000, 192000]) {
      const hqAge = VISUAL_SYNC_RULES.SpectrumAnalyzerPlugin.generationFrames({ pt: 12, sc: 'log-hq' }, sampleRate, 'js');
      assert.equal(VISUAL_SYNC_RULES.spectrumOverlay.generationFrames({ quality: 'hq' }, sampleRate), hqAge);
    }
    assert.equal(manager._visualSyncGeneration(plugin, 'spectrumOverlay'), 10288);
    assert.equal(manager._recomputeVisualSyncDelay(), 10288);
    globalThis.window.SpectrumOverlay.quality = 'normal';
    assert.equal(manager._visualSyncGeneration(plugin, 'spectrumOverlay'), 2048);
    assert.equal(manager._recomputeVisualSyncDelay(), 2048);
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
});

test('Normal Peak Hold tracks both spectra with a 20 dB/s decay and clears when disabled', () => {
  const h = createOverlayHarness();
  const { instance } = h.attach();
  h.overlay.setSettings({ peakHold: true });
  instance.setMode('compare');
  instance.onSpectrumMessage(normalMessage(1));
  h.frame();
  const inputPeak = instance.inputPeaks[0];
  const outputPeak = instance.peaks[0];
  assert.ok(Math.abs(inputPeak) < 0.01);
  assert.ok(Math.abs(outputPeak + 6.0206) < 0.01);
  h.advance(84);
  instance.onSpectrumMessage(normalMessage(0.01));
  h.frame();
  assert.ok(Math.abs(instance.inputPeaks[0] - inputPeak + 2) < 0.01);
  assert.ok(Math.abs(instance.peaks[0] - outputPeak + 2) < 0.01);
  assert.ok(instance.levels[0] < -40);
  h.overlay.setSettings({ peakHold: false });
  assert.equal(instance.peaks, null);
  instance.onSpectrumMessage(normalMessage(0.01));
  h.frame();
  assert.equal(instance.peaks, null);
  assert.ok(instance.levels[0] < -40);
  instance.dispose();
});

test('HQ draws logarithmic cells only through Nyquist and uses producer peaks for comparison', () => {
  const h = createOverlayHarness();
  h.overlay.setSettings({ quality: 'hq', peakHold: true });
  const { instance } = h.attach();
  instance.setMode('compare');
  instance.canvas.width = 800;
  instance.canvas.height = 400;
  const validCellCount = Array.from({ length: 2048 }, (_, i) => 20 * Math.exp(i * Math.log(2000) / 2047))
    .filter(frequency => frequency <= 24000).length;
  const snapshot = (level, peak) => ({
    current: new Float32Array(2048).fill(level),
    peaks: new Float32Array(2048).fill(peak),
    firstValidIndex: 0, validCellCount
  });
  const inputSpectrum = snapshot(-48, -12);
  const outputSpectrum = snapshot(-54, -18);
  instance.onSpectrumMessage({
    type: 'spectrumOverlay', spectrumPluginId: 7, mode: 'compare', quality: 'hq',
    inputSpectrum, outputSpectrum, sampleRate: 48000
  });
  h.frame();
  assert.equal(instance.inputLevels, inputSpectrum.current);
  assert.equal(instance.levels, outputSpectrum.current);
  assert.equal(instance.peaks[0], -18);
  assert.ok(instance.canvas.drawCalls.some(([method, , y]) => method === 'lineTo' && y === 75));
  assert.ok(Math.abs(instance._frequencyAt(0) - 20) < 1e-9);
  assert.equal(instance._frequencyAt(2047), 40000);
  assert.equal(instance.validCellCount, validCellCount);
  h.advance(84);
  h.frame();
  assert.ok(Math.abs(instance.peaks[0] + 20) < 0.01);
  h.overlay.setSettings({ quality: 'normal' });
  assert.equal(instance.levels, null);
  assert.equal(instance.inputPeaks, null);
  instance.dispose();
});
