const BASS_EXTENDER_SAMPLE_RATES = Object.freeze([
    44100, 48000, 88200, 96000, 176400, 192000
]);
const BASS_EXTENDER_PASS_THROUGH_PROCESSOR = 'return data;';
const BASS_EXTENDER_BYPASS_REASONS = Object.freeze({
    unsupportedSampleRate: 'This sample rate is not supported.',
    unsupportedChannelMode: 'This channel setting is not supported.',
    wasmUnavailable: 'WASM audio processing is unavailable.',
    rolloutDisabled: 'DSP processing is disabled.',
    runtimeFallback: 'Audio processing was interrupted.',
    engineStopped: 'Audio processing has stopped.'
});

class BassExtenderPlugin extends PluginBase {
    static executionCapabilities = Object.freeze({
        requiresWasm: true,
        supportedSampleRates: BASS_EXTENDER_SAMPLE_RATES,
        supportedChannelModes: Object.freeze(['mono', 'stereo-pair'])
    });

    constructor() {
        super('Bass Extender',
            'Adds generated low bass to recordings with thin low-frequency content');
        this.am = 25;
        this.og = 0;
        this.temporalCapability = 'reset-on-resume';
        this.executionState = { state: 'pending', reason: null };
        this._statusElement = null;
        this.registerProcessor(BASS_EXTENDER_PASS_THROUGH_PROCESSOR);
    }

    getTemporalCapability() {
        return 'reset-on-resume';
    }

    getParameters() {
        return {
            type: this.constructor.name,
            am: this.am,
            og: this.og,
            enabled: this.enabled
        };
    }

    setParameters(params) {
        if (params.am !== undefined) {
            this.am = Math.round(this.parseFiniteNumber(params.am, 0, 100, this.am));
        }
        if (params.og !== undefined) {
            this.og = Math.round(this.parseFiniteNumber(params.og, -24, 0, this.og) * 10) / 10;
        }
        if (params.enabled !== undefined) this.enabled = params.enabled !== false;
        this.updateParameters();
    }

    onMessage(message) {
        if (message?.type !== 'dspExecutionState' || message.pluginId !== this.id ||
            message.pluginType !== this.constructor.name || message.validated !== true) return;
        this.executionState = { state: message.state, reason: message.reason || null };
        this._renderStatusMessage();
    }

    _executionStatusText() {
        if (this.executionState.state !== 'bypassed') return '';
        const reason = BASS_EXTENDER_BYPASS_REASONS[this.executionState.reason];
        return reason ? `${reason} ${this.name} is bypassed. Audio remains unchanged.` : '';
    }

    _renderStatusMessage() {
        if (!this._statusElement) return;
        const message = this._executionStatusText();
        this._statusElement.textContent = message;
        this._statusElement.hidden = !message;
    }

    _createStatusElement() {
        const status = document.createElement('div');
        status.className = 'plugin-execution-status';
        status.setAttribute('role', 'status');
        status.setAttribute('aria-live', 'polite');
        this._statusElement = status;
        this._renderStatusMessage();
        return status;
    }

    createUI() {
        const container = document.createElement('div');
        container.className = 'bass-extender-plugin-ui plugin-parameter-ui';
        container.appendChild(this.createParameterControl(
            'Amount', 0, 100, 1, this.am,
            value => this.setParameters({ am: value }), '%', 'am'));
        container.appendChild(this.createParameterControl(
            'Output', -24, 0, 0.1, this.og,
            value => this.setParameters({ og: value }), 'dB', 'og'));
        container.appendChild(this._createStatusElement());
        return container;
    }
}

window.BassExtenderPlugin = BassExtenderPlugin;
