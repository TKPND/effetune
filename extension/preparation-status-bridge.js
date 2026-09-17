import { getSerializablePluginStateShort } from '../js/utils/serialization-utils.js';
import { getReachableEnabledPlugins } from '../js/audio/power-topology.js';

const refreshers = new WeakMap();

export function hasPreparationStatus(plugin) {
  return typeof plugin._setStatus === 'function' && typeof plugin.onWasmAssetState === 'function';
}

function settingsKey(plugin) {
  const settings = getSerializablePluginStateShort(plugin);
  return JSON.stringify(Object.keys(settings).sort().map(key => [key, settings[key]]));
}

export function capturePreparationStatuses(plugins, masterBypass = false) {
  const active = new Set(masterBypass ? [] : getReachableEnabledPlugins(plugins));
  return plugins.filter(hasPreparationStatus).map(plugin => {
    const bypassed = !active.has(plugin) && ['preparing', 'ready'].includes(plugin._statusState);
    return {
      id: plugin.id,
      settings: settingsKey(plugin),
      message: bypassed ? 'Processing is bypassed for this effect.' : plugin._statusMessage,
      state: bypassed ? '' : plugin._statusState,
      assetState: plugin._assetState
    };
  });
}

export function observePreparationStatus(plugin, changed) {
  if (!hasPreparationStatus(plugin)) return;
  const setStatus = plugin._setStatus.bind(plugin);
  plugin._setStatus = (message, state = '') => {
    setStatus(message, state);
    changed();
  };
}

export function mirrorPreparationStatus(plugin, getStatuses) {
  if (!hasPreparationStatus(plugin)) return;
  const setStatus = plugin._setStatus.bind(plugin);
  const currentStatus = () => plugin._requestedAssetDefinition ? null : getStatuses()?.find(item =>
    item.id === plugin.id && item.settings === settingsKey(plugin));
  // The editor owns preparation for its graph, but only the audio host can
  // confirm asset activation. Its operation revisions belong to another instance.
  plugin._setStatus = (message, state = '') => {
    const status = state === 'preparing' || state === 'ready' ? currentStatus() : null;
    setStatus(status?.message ?? message, status?.state ?? state);
  };
  const refresh = () => {
    const status = currentStatus();
    if (!status) return;
    if (Number.isInteger(status.assetState)) plugin._assetState = status.assetState;
    setStatus(status.message, status.state);
  };
  const renderStatus = plugin._renderStatus?.bind(plugin);
  if (renderStatus) {
    plugin._renderStatus = () => {
      refresh();
      renderStatus();
    };
  }
  refreshers.set(plugin, () => {
    refresh();
    renderStatus?.();
  });
}

export function refreshPreparationStatuses(plugins) {
  for (const plugin of plugins) {
    refreshers.get(plugin)?.();
  }
}
