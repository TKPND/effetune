export const PIPELINE_ANALYZER_MAX_OUTPUT_SLOTS = 4;

export function getPipelineAnalyzerOutputCapacity(channelCount) {
    if (!Number.isInteger(channelCount) || channelCount < 1) return 0;
    return channelCount < PIPELINE_ANALYZER_MAX_OUTPUT_SLOTS
        ? channelCount
        : PIPELINE_ANALYZER_MAX_OUTPUT_SLOTS;
}
