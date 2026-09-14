import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import { Element, frequencyAxisSource } from '../helpers/spectrum-overlay-harness.mjs';

const previewSource = fs.readFileSync(new URL('../../plugins/frequency-preview.js', import.meta.url), 'utf8');

function harness(name = 'BandPassFilterPlugin') {
  class PreviewElement extends Element {
    constructor(tag) {
      super(tag);
      this.clientLeft = this.clientTop = 0;
      this.rect = { left: 10, top: 20, width: 400, height: 200 };
    }
    getBoundingClientRect() { return this.rect; }
    removeEventListener(type) { this.listeners.delete(type); }
    closest() { return this.excluded ? this : null; }
    hasPointerCapture(id) { return this.capture === id; }
    setPointerCapture(id) { this.capture = id; }
    releasePointerCapture() { this.capture = null; }
    getContext() {
      const context = super.getContext();
      for (const method of ['setTransform', 'fillRect']) {
        context[method] = (...args) => this.drawCalls.push([method, ...args]);
      }
      return context;
    }
  }
  const frames = new Map();
  const posts = [];
  let frameId = 0;
  const plugin = { id: 1, constructor: { name }, mn: 60, mx: 71, ly: 'Horizontal', rf: 442 };
  const window = new PreviewElement();
  window.devicePixelRatio = 2;
  window.audioManager = { pipeline: [plugin], setFrequencyPreview: frequency => posts.push(frequency) };
  const document = new PreviewElement();
  document.createElement = tag => new PreviewElement(tag);
  const context = {
    window, document,
    getComputedStyle: element => ({ position: element.style.position || 'static', touchAction: element.style.touchAction || 'auto' }),
    requestAnimationFrame(callback) { frames.set(++frameId, callback); return frameId; },
    cancelAnimationFrame(id) { frames.delete(id); },
    ResizeObserver: class { observe() {} disconnect() {} }
  };
  vm.runInNewContext(frequencyAxisSource, context);
  vm.runInNewContext(previewSource, context);
  const root = new PreviewElement();
  const mount = root.appendChild(new PreviewElement());
  const plot = mount.appendChild(new PreviewElement('canvas'));
  root.querySelector = () => plot;
  const preview = window.FrequencyPreview;
  const instance = preview.attach(plugin, root);
  function event(type, overrides = {}) {
    const data = { button: 0, pointerId: 2, pointerType: 'mouse', target: plot,
      clientX: 210, clientY: 80, preventDefault() { this.defaultPrevented = true; }, ...overrides };
    mount.listeners.get(type)?.(data);
    return data;
  }
  return { window, document, plugin, mount, plot, posts, preview, instance, frames, event,
    frame() { const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(callback => callback()); } };
}

test('preview excludes existing controls and consumed pointer gestures', () => {
  const h = harness();
  h.event('pointerdown', { defaultPrevented: true });
  h.plot.excluded = true;
  h.event('pointerdown');
  h.plot.excluded = false;
  h.event('pointerdown', { button: 2 });
  assert.deepEqual(h.posts, []);
  h.event('pointerdown');
  assert.ok(Math.abs(h.posts[0] - Math.sqrt(10 * 40000)) < 1e-8);
  assert.equal(h.mount.style.touchAction, 'pan-y');
  h.preview.stop();
});

test('drag updates coalesce and every stop path cancels pending moves', () => {
  for (const end of ['pointerup', 'pointercancel', 'lostpointercapture', 'removed', 'blur', 'pagehide', 'hidden', 'dispose', 'stop']) {
    const h = harness();
    h.event('pointerdown');
    h.event('pointermove', { clientX: 310 });
    h.event('pointermove', { clientX: 410 });
    assert.equal(h.posts.length, 1);
    h.frame();
    assert.equal(h.posts.at(-1), 40000);
    h.event('pointermove', { clientX: 100 });
    if (end === 'hidden') { h.document.hidden = true; h.document.listeners.get('visibilitychange')(); }
    else if (end === 'removed') {
      h.mount.capture = null;
      h.mount.remove();
      h.document.listeners.get('lostpointercapture')({ pointerId: 2 });
    }
    else if (end === 'blur' || end === 'pagehide') h.window.listeners.get(end)();
    else if (end === 'dispose') h.instance.dispose();
    else if (end === 'stop') h.preview.stop();
    else h.event(end);
    assert.equal(h.posts.at(-1), null, end);
    assert.equal(h.frames.size, 0, end);
    const count = h.posts.length;
    h.event('pointermove');
    h.frame();
    h.preview.stop();
    assert.equal(h.posts.length, count, end);
  }
});

test('note preview follows displayed black and white keys and its note band', () => {
  const h = harness('PitchMeterPlugin');
  // C-sharp row, first over its black key, then the white C key beneath it.
  h.event('pointerdown', { clientX: 60, clientY: 180 });
  assert.equal(h.posts.at(-1), 442 * 2 ** ((61 - 69) / 12));
  h.event('pointermove', { clientX: 60, clientY: 210 });
  h.frame();
  assert.equal(h.posts.at(-1), 442 * 2 ** ((60 - 69) / 12));
  assert.ok(h.instance.canvas.drawCalls.some(call => call[0] === 'fillRect'));
  h.preview.stop();
});

test('canvas-relative mapping preserves graph margins and replacement stops the owner', () => {
  const h = harness();
  h.plot.rect = { left: 30, top: 20, width: 360, height: 200 };
  h.event('pointerdown', { clientX: 390 });
  assert.equal(h.posts.at(-1), 40000);
  assert.equal(h.instance.canvas.style.left, '20px');
  h.preview.attach(h.plugin, { querySelector: () => h.plot });
  assert.equal(h.posts.at(-1), null);
});
