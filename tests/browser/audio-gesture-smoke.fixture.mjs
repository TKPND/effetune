import { App } from '../../js/app.js';
import { UIManager } from '../../js/ui-manager.js';
import { AudioContextManager } from '../../js/audio/audio-context-manager.js';
import { PowerPolicyController } from '../../js/audio/power-policy-controller.js';
import { NO_AUDIO_INPUT_DEVICE_ID } from '../../js/audio/audio-device-constants.js';
import { CatalogPlaybackBridge } from '../../js/ui/audio-player/catalog-playback-bridge.js';
import { StateManager } from '../../js/ui/audio-player/state-manager.js';

const cold = new URLSearchParams(location.search).has('cold');
const audioContext = new AudioContext();
const contextManager = new AudioContextManager();
contextManager.audioContext = audioContext;
window.audioPreferences = { inputDeviceId: NO_AUDIO_INPUT_DEVICE_ID };
const audioManager = {
  audioContext,
  contextManager,
  ioManager: {
    getInputSnapshot: () => ({ state: 'not-configured', inputConfigured: false }),
    beginReacquireAudioInput() { throw new Error('Player-only playback must not acquire a microphone'); },
    playOutputBridgeForGesture: () => Promise.resolve(true)
  }
};
const controller = new PowerPolicyController(audioManager, { enabled: true });
audioManager.powerPolicyController = controller;
contextManager.setPowerStateDelegate(controller);

// This fixture isolates native autoplay and production gesture/queue coordination.
// Actual worklet promotion, render proofs, and rollback run in the other power smokes.
let commits = 0;
controller._configureWorklets = () => {};
controller.requestReconcile = () => Promise.resolve();
controller.handlePageLifecycleEvent = () => {};
controller._applyWorkletState = async (state, directive) => {
  commits++;
  controller.effectiveState = state;
  controller.processingDirective = directive;
  return true;
};

const attempts = [];
const events = [];
let stallNextOutput = !cold;
const resume = contextManager.resumeForPowerPolicy.bind(contextManager);
contextManager.resumeForPowerPolicy = kind => {
  attempts.push({ active: navigator.userActivation.isActive, state: audioContext.state });
  const result = resume(kind);
  if (stallNextOutput) {
    stallNextOutput = false;
    // WebKit can retain an unresolved pre-gesture resume. Keep that result pending
    // even if Chromium resolves its native promise on activation.
    void result.catch(() => {});
    return new Promise(() => {});
  }
  return result;
};
for (const type of ['pointerdown', 'pointerup', 'touchend']) {
  document.addEventListener(type, event => {
    events.push({ type, active: navigator.userActivation.isActive, trusted: event.isTrusted });
    render();
  }, true);
}

let played = 0;
let stage = 'ready';
let loadFinishedWithActivation = null;
const stateManager = new StateManager({});
stateManager.addListener('*', () => render());
const player = {
  stateManager,
  ui: { container: document.body },
  resumeAudioContextInGesture: () => controller.beginUserGestureResume('player-only-play'),
  playbackManager: {
    async installBulkPlayProvisional() {
      if (!await controller.ensureActive('player-only-play')) return { accepted: false };
      const source = audioContext.createBufferSource();
      source.buffer = audioContext.createBuffer(1, 128, audioContext.sampleRate);
      source.connect(audioContext.destination);
      source.start();
      played++;
      stage = 'played';
      return { accepted: true };
    }
  }
};
const waitForActivationToExpire = () => new Promise(resolve => {
  const check = () => {
    if (navigator.userActivation.isActive) setTimeout(check, 50);
    else resolve();
  };
  check();
});
const uiManager = {
  audioManager,
  audioPlayer: cold ? null : player,
  beginPlaybackSelectionGestureResume: UIManager.prototype.beginPlaybackSelectionGestureResume,
  async createAudioPlayer() {
    stage = 'loading';
    render();
    await waitForActivationToExpire();
    loadFinishedWithActivation = navigator.userActivation.isActive;
    this.audioPlayer = player;
    return player;
  }
};
let operationId = 0;
const service = {
  async start() {
    return {
      kind: 'started', operationId: `play-${++operationId}`,
      provisionalEntry: { entryInstanceId: 'entry-1', trackUid: 'track-1' }
    };
  },
  async status() { return null; },
  subscribeOperation() { return () => {}; },
  async readSequencePage() { return { items: [] }; },
  async resolveSequenceEntrySource() { return {}; }
};
const bridge = new CatalogPlaybackBridge({ uiManager, service });
function render() {
  document.querySelector('#status').textContent = JSON.stringify({
    stage, played, commits, attempts, events, loadFinishedWithActivation,
    contextState: audioContext.state, pending: stateManager.state.isPlaybackPending
  });
  console.debug(`[audio-gesture-smoke] ${document.querySelector('#status').textContent}`);
}
document.querySelector('#play').addEventListener('click', () => {
  void bridge.start({ operationKind: 'play' })
    .then(receipt => bridge.operations.get(receipt.operationId).provisionalPromise)
    .then(async () => {
      render();
      if (!cold && played === 1) {
        await waitForActivationToExpire();
        await audioContext.suspend();
        controller.effectiveState = 'SUSPENDED';
        stallNextOutput = true;
        window.dispatchEvent(new Event('focus'));
        stage = 'resuspended';
        render();
      }
    });
});
if (!cold) {
  App.prototype.setupEventListeners.call({ audioManager, uiManager });
  window.dispatchEvent(new Event('focus'));
}
render();
