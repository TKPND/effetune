import {
    analyzeFIRAtFrequencies,
    designFIRCrossover
} from '../fir-crossover/design-core.js';

const ALLOWED_TAPS = new Set([8192, 16384, 32768]);
const ALLOWED_SLOPES = new Set([24, 48, 96]);
const MAX_CHANNELS = 16;

function finiteNumber(value, minimum, maximum, fallback) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.max(minimum, Math.min(maximum, number));
}

function normalizeArray(values, count, normalize, fallback) {
    return Array.from({ length: count }, (_, index) =>
        normalize(values?.[index], fallback));
}

export function normalizeBassManagementDesignConfig(candidate = {}) {
    const sampleRate = Math.round(finiteNumber(candidate.sampleRate, 8000, 768000, 48000));
    const channelCount = Math.round(finiteNumber(candidate.channelCount, 1, MAX_CHANNELS, 2));
    const tapsValue = Number(candidate.taps);
    const taps = ALLOWED_TAPS.has(tapsValue) ? tapsValue : 16384;
    const roles = normalizeArray(candidate.roles, MAX_CHANNELS, (value, fallback) => {
        const role = Math.round(Number(value));
        return role >= 0 && role <= 3 ? role : fallback;
    }, 0);
    const frequencies = normalizeArray(candidate.frequencies, MAX_CHANNELS,
        (value, fallback) => finiteNumber(value, 20, 300, fallback), 80);
    const slopes = normalizeArray(candidate.slopes, MAX_CHANNELS, (value, fallback) => {
        const slope = Math.round(Number(value));
        return ALLOWED_SLOPES.has(slope) ? slope : fallback;
    }, 24);
    const lfeFrequency = finiteNumber(candidate.lfeFrequency, 20, 300, 120);
    const lfeSlopeValue = Math.round(Number(candidate.lfeSlope));
    const lfeSlope = ALLOWED_SLOPES.has(lfeSlopeValue) ? lfeSlopeValue : 24;
    return {
        sampleRate,
        channelCount,
        taps,
        roles,
        frequencies,
        slopes,
        lfeLowpass: candidate.lfeLowpass === true,
        lfeFrequency,
        lfeSlope
    };
}

export function bassManagementResponseFrequencies(sampleRate, count = 160) {
    const maximum = Math.min(20000, sampleRate * 0.48);
    const minimumLog = Math.log(10);
    const span = Math.log(maximum) - minimumLog;
    return Array.from({ length: count }, (_, index) =>
        Math.exp(minimumLog + span * index / Math.max(1, count - 1)));
}

export function designBassManagement(candidate = {}) {
    const config = normalizeBassManagementDesignConfig(candidate);
    const responseFrequencies = bassManagementResponseFrequencies(config.sampleRate);
    const channels = [];
    const inputChannels = [];
    const responses = [];
    const l1Norms = [];
    const designs = new Map();

    for (let input = 0; input < config.channelCount; input += 1) {
        const role = config.roles[input];
        if (role !== 1 && !(role === 2 && config.lfeLowpass)) continue;
        const cutoff = role === 1 ? config.frequencies[input] : config.lfeFrequency;
        const slope = role === 1 ? config.slopes[input] : config.lfeSlope;
        const key = `${cutoff}:${slope}`;
        let designed = designs.get(key);
        if (!designed) {
            const crossover = designFIRCrossover({
                sampleRate: config.sampleRate,
                taps: config.taps,
                phase: 'lin',
                bandCount: 2,
                frequencies: [cutoff, cutoff, cutoff],
                slopes: [slope, slope, slope]
            });
            const impulse = crossover.channels[0];
            let l1Norm = 0;
            for (const sample of impulse) l1Norm += sample < 0 ? -sample : sample;
            designed = {
                impulse,
                response: analyzeFIRAtFrequencies(
                    impulse,
                    config.sampleRate,
                    responseFrequencies
                ),
                l1Norm
            };
            designs.set(key, designed);
        }
        channels.push(Float32Array.from(designed.impulse));
        inputChannels.push(input);
        responses.push(Float32Array.from(designed.response));
        l1Norms.push(designed.l1Norm);
    }

    return {
        channels,
        inputChannels,
        responses,
        responseFrequencies,
        l1Norms,
        config,
        latencyInfo: {
            filterDelaySamples: config.taps / 2,
            blockDelaySamples: 128,
            totalDelaySamples: config.taps / 2 + 128,
            resolutionHz: config.sampleRate / config.taps
        }
    };
}
