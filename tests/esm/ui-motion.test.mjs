import assert from 'node:assert/strict';
import test from 'node:test';

import { cancelExitMotion, runExitMotion } from '../../js/ui/motion.js';
import { withGlobals } from '../helpers/global-test-utils.mjs';

class FakeElement {
  constructor() {
    const classes = new Set();
    this.classList = {
      add: name => classes.add(name),
      remove: name => classes.delete(name),
      contains: name => classes.has(name)
    };
    this.listeners = new Map();
  }

  addEventListener(type, listener) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(listener);
  }

  removeEventListener(type, listener) {
    this.listeners.get(type)?.delete(listener);
  }

  dispatch(type, target = this) {
    for (const listener of this.listeners.get(type) || []) listener({ target });
  }
}

function createMotionGlobals() {
  const timers = [];
  const cleared = [];
  return {
    timers,
    cleared,
    globals: {
      getComputedStyle: () => ({
        getPropertyValue: name => name === '--et-motion-exit' ? '160ms' : ''
      }),
      setTimeout(callback, delay) {
        timers.push({ callback, delay });
        return timers.length;
      },
      clearTimeout: timer => cleared.push(timer)
    }
  };
}

test('exit motion ignores child events and completes once on its own end event', async () => {
  const element = new FakeElement();
  const harness = createMotionGlobals();
  let done = 0;
  await withGlobals(harness.globals, () => {
    runExitMotion(element, () => done++);
    assert.equal(element.classList.contains('mobile-closing'), true);
    assert.equal(element.inert, true);
    assert.equal(done, 0);
    assert.equal(harness.timers[0].delay, 260);

    element.dispatch('animationend', new FakeElement());
    element.dispatch('transitionend', new FakeElement());
    assert.equal(done, 0);
    assert.equal(element.classList.contains('mobile-closing'), true);

    element.dispatch('animationend');
    assert.equal(element.classList.contains('mobile-closing'), false);
    assert.equal(done, 1);
    assert.equal(element.inert, true);
    assert.deepEqual(harness.cleared, [1]);
    assert.equal(element.listeners.get('animationend').size, 0);
    assert.equal(element.listeners.get('transitionend').size, 0);
    element.dispatch('transitionend');
    harness.timers[0].callback();
    assert.equal(done, 1);
  });
});

test('cancelling an exit keeps its delayed completion from changing reusable input state', async () => {
  const element = new FakeElement();
  const harness = createMotionGlobals();
  await withGlobals(harness.globals, () => {
    runExitMotion(element);
    cancelExitMotion(element);
    element.inert = false;
    harness.timers[0].callback();

    assert.equal(element.inert, false);
    assert.equal(element.classList.contains('mobile-closing'), true);
  });
});

test('exit motion clears focus from a closing subtree before making it inert', async () => {
  const element = new FakeElement();
  const activeElement = { blurred: false, blur() { this.blurred = true; } };
  element.contains = candidate => candidate === activeElement;
  const harness = createMotionGlobals();
  await withGlobals({ ...harness.globals, document: { activeElement } }, () => {
    runExitMotion(element);
    assert.equal(activeElement.blurred, true);
    assert.equal(element.inert, true);
  });
});

test('exit fallback completes once and a new exit cancels the previous exit', async () => {
  const element = new FakeElement();
  const harness = createMotionGlobals();
  let oldDone = 0;
  let done = 0;
  await withGlobals(harness.globals, () => {
    runExitMotion(element, () => oldDone++);
    runExitMotion(element, () => done++);
    assert.deepEqual(harness.cleared, [1]);
    assert.equal(element.listeners.get('animationend').size, 1);
    assert.equal(element.listeners.get('transitionend').size, 1);

    harness.timers[0].callback();
    assert.equal(oldDone, 0);
    assert.equal(done, 0);
    assert.equal(element.classList.contains('mobile-closing'), true);

    harness.timers[1].callback();
    assert.equal(element.classList.contains('mobile-closing'), false);
    assert.equal(done, 1);
    assert.deepEqual(harness.cleared, [1, 2]);
    harness.timers[1].callback();
    element.dispatch('animationend');
    assert.equal(done, 1);
    assert.equal(oldDone, 0);
  });
});

test('missing or zero exit duration completes synchronously without classList', async () => {
  for (const getComputedStyle of [
    undefined,
    () => ({ getPropertyValue: () => '' }),
    () => ({ getPropertyValue: () => '0ms' })
  ]) {
    await withGlobals({
      getComputedStyle,
      setTimeout: () => assert.fail('immediate exits must not schedule a timer')
    }, () => {
      let done = false;
      runExitMotion({}, () => { done = true; });
      assert.equal(done, true);
      assert.doesNotThrow(() => runExitMotion({}));
    });
  }
});
