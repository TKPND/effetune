import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveTargetTab } from '../../extension/target-tab.js';

test('target-tab resolution keeps the active page when the popup is not a browser tab', () => {
  const activeTab = { id: 7, title: 'Listening tab' };
  assert.equal(resolveTargetTab({ currentTab: undefined, activeTab }), activeTab);
});

test('target-tab resolution uses the opener when the popup tab itself is active', () => {
  assert.deepEqual(resolveTargetTab({
    currentTab: { id: 9, openerTabId: 7 },
    activeTab: { id: 9, title: 'EffeTune' }
  }), { id: 7 });
});

test('target-tab resolution fails closed when the active popup tab has no opener', () => {
  assert.equal(resolveTargetTab({
    currentTab: { id: 9 },
    activeTab: { id: 9, title: 'EffeTune' }
  }), null);
});
