import { designBassManagement } from './design-core.js';
import { setFIRCrossoverFftBackend } from '../fir-crossover/design-core.js';
import { buildIrAssetPayload, IR_ASSET_TOPOLOGY } from '../ir-library/ir-asset-payload.js';
import { createWasmRoomEqFftBackend } from '../room-eq/wasm-fft.js';

const fftBackendPromise = createWasmRoomEqFftBackend()
    .then(backend => {
        setFIRCrossoverFftBackend(backend);
        return backend;
    })
    .catch(error => {
        console.warn('Bass Management is using the JavaScript FFT fallback:', error);
        return null;
    });

globalThis.onmessage = async event => {
    const request = event.data;
    if (request?.type !== 'design') return;
    try {
        await fftBackendPromise;
        const result = designBassManagement(request.config);
        if (result.channels.length === 0) {
            globalThis.postMessage({
                type: 'result',
                requestId: request.requestId,
                inputChannels: [],
                responses: [],
                responseFrequencies: result.responseFrequencies,
                l1Norms: [],
                latencyInfo: result.latencyInfo
            });
            return;
        }
        const paths = result.inputChannels.map((input, irChannel) => ({
            inputSlot: input,
            outputSlot: input,
            irChannel
        }));
        const payload = buildIrAssetPayload({
            channels: result.channels,
            sampleRate: result.config.sampleRate,
            topology: IR_ASSET_TOPOLOGY.matrix,
            paths
        });
        globalThis.postMessage({
            type: 'result',
            requestId: request.requestId,
            payload,
            inputChannels: result.inputChannels,
            responses: result.responses,
            responseFrequencies: result.responseFrequencies,
            l1Norms: result.l1Norms,
            latencyInfo: result.latencyInfo
        }, [payload]);
    } catch (error) {
        globalThis.postMessage({
            type: 'error',
            requestId: request.requestId,
            message: error instanceof Error
                ? error.message
                : 'Bass Management filter design failed.'
        });
    }
};
