import { ExtensionClient } from './protocol.js';
import { resolveTargetTab } from './target-tab.js';

export const POPUP_STATUS = Object.freeze({
  stopped: 'Not processing',
  starting: 'Starting…',
  processing: 'Processing',
  stopping: 'Stopping…',
  error: 'Needs attention'
});

export const MAX_SESSIONS = 4;

function isLiveSession(session) {
  return session?.status === 'starting' || session?.status === 'processing';
}

function friendlyError(action) {
  if (action === 'start') {
    return 'EffeTune could not capture this tab. Make sure the tab is playing audio, then try again.';
  }
  if (action === 'preset') {
    return 'That preset could not be applied. Your current pipeline was kept.';
  }
  return 'Something went wrong. Try again.';
}

function setOptions(select, presets) {
  const previous = select.value;
  const names = Object.keys(presets || {}).sort((left, right) => left.localeCompare(right));
  select.replaceChildren();
  if (names.length === 0) {
    select.add(new Option('No saved presets', ''));
  } else {
    for (const name of names) select.add(new Option(name, name));
    if (names.includes(previous)) select.value = previous;
  }
  return names.length;
}

export function renderPopup(elements, snapshot) {
  const allSessions = snapshot.sessions || [];
  const sessions = allSessions.filter(isLiveSession);
  const selectedId = elements.getSelectedSessionId?.();
  const selected = sessions.find(session => session.sessionId === selectedId) || sessions[0] || null;
  elements.setSelectedSessionId?.(selected?.sessionId || null);
  elements.sessionCount.textContent = `${sessions.length} / ${MAX_SESSIONS}`;
  elements.empty.hidden = sessions.length !== 0;
  elements.renderSessions(allSessions, selected?.sessionId || null);
  elements.start.disabled = sessions.length >= MAX_SESSIONS;
  elements.startHint.hidden = sessions.length < MAX_SESSIONS;
  elements.startHint.textContent = sessions.length >= MAX_SESSIONS
    ? 'Stop a processing tab before starting another.'
    : '';
  const presetCount = setOptions(elements.preset, snapshot.presets);
  elements.preset.disabled = presetCount === 0 || !selected;
  elements.applyPreset.disabled = presetCount === 0 || !selected;
  elements.edit.disabled = false;
  const errorSession = allSessions.find(session => session.status === 'error');
  if (errorSession) {
    elements.message.textContent = 'Processing stopped. Choose a tab that is playing audio and try again.';
    elements.message.hidden = false;
    if (errorSession.error) console.error('[EffeTune extension]', errorSession.error);
  } else {
    elements.message.hidden = true;
  }
  return selected;
}

export async function createPopupController({ client = new ExtensionClient(), chromeApi = chrome, documentRef = document } = {}) {
  const elements = {
    sessionCount: documentRef.getElementById('sessionCount'),
    sessionList: documentRef.getElementById('sessionList'),
    empty: documentRef.getElementById('emptySessions'),
    start: documentRef.getElementById('startButton'),
    startHint: documentRef.getElementById('startHint'),
    preset: documentRef.getElementById('presetSelect'),
    applyPreset: documentRef.getElementById('applyPresetButton'),
    edit: documentRef.getElementById('editPipelineButton'),
    message: documentRef.getElementById('popupMessage')
  };
  let selectedSessionId = null;
  elements.getSelectedSessionId = () => selectedSessionId;
  elements.setSelectedSessionId = sessionId => { selectedSessionId = sessionId; };
  elements.renderSessions = (sessions, selectedId) => {
    elements.sessionList.replaceChildren(...sessions.map(session => {
      const row = documentRef.createElement('article');
      row.className = 'session-row';
      row.dataset.sessionId = session.sessionId;
      const main = documentRef.createElement('label');
      main.className = 'session-row-main';
      const radio = documentRef.createElement('input');
      radio.type = 'radio';
      radio.name = 'selectedSession';
      radio.value = session.sessionId;
      radio.checked = session.sessionId === selectedId;
      radio.disabled = !isLiveSession(session);
      radio.addEventListener('change', () => {
        selectedSessionId = session.sessionId;
        renderPopup(elements, snapshot);
      });
      const copy = documentRef.createElement('span');
      copy.className = 'session-row-copy';
      const title = documentRef.createElement('span');
      title.className = 'session-title';
      title.textContent = session.title || 'Untitled tab';
      title.title = session.title || '';
      const status = documentRef.createElement('span');
      status.className = 'session-status';
      const indicator = documentRef.createElement('span');
      indicator.className = `status-indicator ${session.status === 'processing' ? 'processing' :
        session.status === 'starting' ? 'pending' : session.status === 'error' ? 'error' : ''}`.trim();
      indicator.setAttribute('aria-hidden', 'true');
      status.append(indicator, documentRef.createTextNode(POPUP_STATUS[session.status] || POPUP_STATUS.error));
      copy.append(title, status);
      main.append(radio, copy);
      const actions = documentRef.createElement('div');
      actions.className = 'session-actions';
      const bypassLabel = documentRef.createElement('label');
      const bypass = documentRef.createElement('input');
      bypass.type = 'checkbox';
      bypass.role = 'switch';
      bypass.checked = session.masterBypass === true;
      bypass.disabled = session.status !== 'processing';
      bypass.addEventListener('change', () => run('bypass', () =>
        client.request('setBypass', { sessionId: session.sessionId, enabled: bypass.checked })));
      bypassLabel.append(bypass, documentRef.createTextNode('Bypass'));
      const stop = documentRef.createElement('button');
      stop.type = 'button';
      stop.textContent = 'Stop';
      stop.disabled = session.status !== 'processing';
      stop.addEventListener('click', () => run('stop', () =>
        client.request('stop', { sessionId: session.sessionId })));
      actions.append(bypassLabel, stop);
      row.append(main, actions);
      return row;
    }));
  };
  let snapshot = await client.connect();
  renderPopup(elements, snapshot);

  const run = async (action, callback) => {
    elements.message.hidden = true;
    try {
      const result = await callback();
      if (result?.revision !== undefined) {
        snapshot = result;
        renderPopup(elements, snapshot);
      }
    } catch (error) {
      console.error(`[EffeTune extension] ${action} failed`, error);
      elements.message.textContent = friendlyError(action);
      elements.message.hidden = false;
    }
  };

  client.addEventListener('state', event => {
    snapshot = event.detail;
    renderPopup(elements, snapshot);
  });

  elements.start.addEventListener('click', async () => {
    let currentTab;
    let activeTab;
    try {
      [currentTab, [activeTab]] = await Promise.all([
        chromeApi.tabs.getCurrent(),
        chromeApi.tabs.query({ active: true, currentWindow: true })
      ]);
    } catch (error) {
      console.error('[EffeTune extension] Target tab lookup failed', error);
      elements.message.textContent = friendlyError('start');
      elements.message.hidden = false;
      return;
    }
    const tab = resolveTargetTab({ currentTab, activeTab });
    if (!tab) {
      elements.message.textContent = 'Start EffeTune from the toolbar of a tab that is playing audio.';
      elements.message.hidden = false;
      return;
    }
    await run('start', async () => {
      const result = await client.request('start', { tabId: tab.id, title: tab.title || 'Current tab' });
      selectedSessionId = result?.sessionId || selectedSessionId;
      return result;
    });
  });
  elements.applyPreset.addEventListener('click', () => {
    if (elements.preset.value && selectedSessionId) run('preset', () =>
      client.request('applyPreset', { sessionId: selectedSessionId, name: elements.preset.value }));
  });
  elements.edit.addEventListener('click', () => run('editor', () => client.request('openEditor')));

  return { client, getSnapshot: () => snapshot };
}

if (typeof chrome !== 'undefined' && typeof document !== 'undefined') {
  createPopupController().catch(error => {
    console.error('[EffeTune extension] Popup initialization failed', error);
    const message = document.getElementById('popupMessage');
    if (message) {
      message.textContent = 'EffeTune could not connect. Close this window and try again.';
      message.hidden = false;
    }
  });
}
