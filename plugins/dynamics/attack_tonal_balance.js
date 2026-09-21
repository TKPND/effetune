const ATTACK_TONAL_BALANCE_PASS_THROUGH_PROCESSOR = 'return data;';

class AttackTonalBalancePlugin extends PluginBase {
    static executionCapabilities = Object.freeze({ requiresWasm: true });

    constructor() {
        super('Attack Tonal Balance',
            'Adjusts short attacks and sustained tonal structure independently');
        this.at = 0;
        this.tn = 0;
        this.ae = true;
        this.te = true;
        this.temporalCapability = 'reset-on-resume';
        this.registerProcessor(ATTACK_TONAL_BALANCE_PASS_THROUGH_PROCESSOR);
    }

    getTemporalCapability() {
        return 'reset-on-resume';
    }

    setParameters(params = {}) {
        if (!params || typeof params !== 'object') return;
        if (params.at !== undefined) this.at = this.parseFiniteNumber(params.at, -12, 12, this.at);
        if (params.tn !== undefined) this.tn = this.parseFiniteNumber(params.tn, -12, 12, this.tn);
        if (params.ae !== undefined) this.ae = params.ae !== false;
        if (params.te !== undefined) this.te = params.te !== false;
        if (params.enabled !== undefined) this.enabled = params.enabled !== false;
        this._syncGainControlAvailability();
        this.updateParameters();
    }

    getParameters() {
        return {
            type: this.constructor.name,
            at: this.at,
            tn: this.tn,
            ae: this.ae,
            te: this.te,
            enabled: this.enabled
        };
    }

    createUI() {
        const container = document.createElement('div');
        container.className = 'plugin-parameter-ui';
        container.appendChild(this.createCheckboxControl(
            'Attack Enabled', this.ae,
            value => this.setParameters({ ae: value }), 'ae'));
        const attackGain = this.createParameterControl(
            'Attack', -12, 12, 0.5, this.at,
            value => this.setParameters({ at: value }), 'dB', 'at');
        this._attackGainInputs = attackGain.querySelectorAll('input[type="range"], input[type="number"]');
        container.appendChild(attackGain);
        container.appendChild(this.createCheckboxControl(
            'Tonal Enabled', this.te,
            value => this.setParameters({ te: value }), 'te'));
        const tonalGain = this.createParameterControl(
            'Tonal', -12, 12, 0.5, this.tn,
            value => this.setParameters({ tn: value }), 'dB', 'tn');
        this._tonalGainInputs = tonalGain.querySelectorAll('input[type="range"], input[type="number"]');
        container.appendChild(tonalGain);
        this._syncGainControlAvailability();
        this.registerUIRefresh(() => this._syncGainControlAvailability());
        return container;
    }

    _syncGainControlAvailability() {
        this._attackGainInputs?.forEach(input => { input.disabled = !this.ae; });
        this._tonalGainInputs?.forEach(input => { input.disabled = !this.te; });
    }
}

window.AttackTonalBalancePlugin = AttackTonalBalancePlugin;
