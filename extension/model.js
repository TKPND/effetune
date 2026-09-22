import { PluginManager } from '../js/plugin-manager.js';
import { publishDspParamPackers } from '../js/audio/dsp-wasm-loader.js';
import * as generatedParams from '../js/audio/dsp-params.generated.js';
import { getSerializablePluginStateShort, convertLongToShortFormat, applySerializedState } from '../js/utils/serialization-utils.js';
import { getPluginExecutionChannelMode, getPluginExecutionUnsupportedReason } from '../js/audio/plugin-execution-capabilities.js';
import { getReachableEnabledPlugins } from '../js/audio/power-topology.js';
import { DSP_PIPELINE_MAX_BUS } from '../js/audio/dsp-pipeline-descriptor.js';

export async function activatePipelineModels(audio, plugins) {
    const activePlugins = audio.masterBypass ? [] : getReachableEnabledPlugins(plugins);
    const payload = plugins.map(plugin => plugin.getWorkletPluginData(plugin.extensionInitialParameters));
    audio.commitPowerTopologyMutation({ type: 'updatePlugins', plugins: payload, masterBypass: audio.masterBypass });
    audio.syncPrimaryWasmAssetMembership(plugins);
    const expected = audio._replayPipelineWasmAssets(audio.workletNode, plugins, {
        trackState: true,
        assetReadinessPlugins: activePlugins
    });
    const deadline = Date.now() + 15000;
    while (Date.now() < deadline) {
        const revision = audio.getDspExecutionStateSnapshot().topologyRevision;
        if (expected === null || !await audio._waitForWasmAssetsActive(
            audio.workletNode, expected, undefined, Math.max(0, deadline - Date.now())
        )) throw new Error('The effect filters could not be activated.');
        const latency = await audio._requestWorkletLatency(
            audio.workletNode, Math.max(1, Math.min(5000, deadline - Date.now()))
        );
        if (!latency) throw new Error('The audio processor did not confirm the new pipeline.');
        const snapshot = audio.getDspExecutionStateSnapshot();
        // Asset completion can update parameters from a later MessagePort listener,
        // after this latency request was sent. Confirm that update on the next barrier.
        if (snapshot.topologyRevision !== revision) continue;
        const execution = new Map(snapshot.states.map(item => [item.pluginId, item.state]));
        if (activePlugins.some(plugin => execution.get(plugin.id) !== 'active')) {
            throw new Error('The audio processor could not activate every effect.');
        }
        return;
    }
    throw new Error('The audio processor did not confirm the new pipeline.');
}

export async function initializePluginModel() {
    publishDspParamPackers(generatedParams);
    const manager = new PluginManager();
    await manager.loadPlugins();
    return manager;
}

export function getPresetPluginStates(preset) {
    if (Array.isArray(preset)) return preset;
    if (Array.isArray(preset?.plugins)) return preset.plugins;
    if (Array.isArray(preset?.pipeline)) return preset.pipeline.map(convertLongToShortFormat);
    throw new Error('This file does not contain an EffeTune preset.');
}

export function serializePipeline(plugins) {
    return plugins.map(plugin => ({ ...getSerializablePluginStateShort(plugin), id: plugin.id }));
}

export function validatePreset(preset, pluginManager, sampleRate = 48000) {
    const states = getPresetPluginStates(preset);
    if (states.length > 128) throw new Error('This preset has too many effects. Use up to 128 effects.');
    if (preset?.outputChannels !== undefined && preset.outputChannels !== 2) {
        throw new Error('This preset needs a different output layout. The extension supports stereo.');
    }
    for (const state of states) {
        if (!state || typeof state !== 'object' || !pluginManager.isPluginAvailable(state.nm)) {
            throw new Error('This preset contains an unavailable effect. Your current pipeline has been kept.');
        }
        const type = pluginManager.pluginClasses[state.nm].name;
        if (type !== 'SectionPlugin' && !window.dspParamPackers?.has(type)) {
            throw new Error('This effect is unavailable in the extension. Your current pipeline has been kept.');
        }
        if (![state.ib, state.ob, state.inputBus, state.outputBus].every(bus =>
            bus == null || (Number.isInteger(bus) && bus >= 0 && bus <= DSP_PIPELINE_MAX_BUS))) {
            throw new Error('This preset has an invalid audio bus. Choose Main or Bus 1–4.');
        }
        const channel = state.ch ?? state.channel;
        const mode = getPluginExecutionChannelMode(channel, 2);
        if (!mode || getPluginExecutionUnsupportedReason({ constructor: pluginManager.pluginClasses[state.nm] }, { sampleRate, channelMode: mode })) {
            throw new Error('This preset needs a different channel layout or sample rate. Your current pipeline has been kept.');
        }
    }
    return states;
}

export async function createPipelineModels(preset, manager, sampleRate = 48000) {
    const states = validatePreset(preset, manager, sampleRate);
    const models = [];
    const ids = new Set();
    try {
        for (const state of states) {
            // Constructors must not register candidate assets on the active pipeline.
            const worklet = window.workletNode;
            let plugin;
            try {
                window.workletNode = null;
                plugin = manager.createPlugin(state.nm);
            } finally { window.workletNode = worklet; }
            models.push(plugin);
            plugin.audioHostActive = false;
            plugin.setPowerUiEnabled(false);
            const id = Number.isInteger(state.id) && state.id > 0 ? state.id : plugin.id;
            if (ids.has(id)) throw new Error('This preset has repeated effects with invalid identifiers.');
            ids.add(id);
            plugin.id = id;
            manager.nextPluginId = Math.max(manager.nextPluginId, id + 1);
            applySerializedState(plugin, state);
            const parameters = plugin.getParameters({ sampleRate, outputChannelCount: 2, commitSampleRate: true });
            const prepared = typeof plugin.createOfflineDspState === 'function'
                ? await plugin.createOfflineDspState({ sampleRate, outputChannelCount: 2 }) : null;
            if (plugin.externalAssetInfo?.missing || (plugin.externalAssetInfo?.ids?.length && !prepared?.assets?.size)) {
                throw new Error('An impulse response is missing. Import its file in IR Reverb, then load this preset again.');
            }
            if (prepared?.assets) {
                for (const [slot, descriptor] of prepared.assets) {
                    const revision = plugin.setWasmAsset(slot, descriptor);
                    // FIR effects must recognize the offline-prepared asset's completion
                    // even when their separate live design has not finished yet.
                    if (slot === 0 && Object.hasOwn(plugin, '_candidateAssetRevision')) {
                        plugin._candidateAssetRevision = revision;
                    }
                }
            }
            plugin.extensionInitialParameters = prepared?.parameters || parameters;
        }
        return models;
    } catch (error) {
        for (const plugin of models) plugin.cleanup?.();
        throw error;
    }
}
