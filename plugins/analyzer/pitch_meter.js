const PITCH_METER_FRAME_TYPE = 26;
const PITCH_METER_TELEMETRY_VERSION = 1;
const PITCH_METER_PAYLOAD_BYTES = 44;
const PITCH_METER_FIRST_MIDI = 21;
const PITCH_METER_LAST_MIDI = 108;
const PITCH_METER_DEFAULT_MIN_MIDI = 36;
const PITCH_METER_DEFAULT_MAX_MIDI = 96;
const PITCH_METER_HISTORY_WIDTH = 1024;
const PITCH_METER_TIME_SPAN_SECONDS = 2;
const PITCH_METER_COLUMN_PERIOD = PITCH_METER_TIME_SPAN_SECONDS / PITCH_METER_HISTORY_WIDTH;
const PITCH_METER_KEY_GUTTER_CSS_PX = 45;
const PITCH_METER_BLACK_KEY_DEPTH_CSS_PX = 28;
const PITCH_METER_LAYOUTS = ['Vertical', 'Horizontal'];
const PITCH_METER_BLACK_KEY_CLASSES = new Set([1, 3, 6, 8, 10]);
const PITCH_METER_WHITE_KEY_CLASSES = [0, 2, 4, 5, 7, 9, 11];
const PITCH_METER_WHITE_KEY_MIDIS = Array.from(
    { length: PITCH_METER_LAST_MIDI - PITCH_METER_FIRST_MIDI + 1 },
    (_, pitch) => PITCH_METER_FIRST_MIDI + pitch
).filter(midi => !PITCH_METER_BLACK_KEY_CLASSES.has(midi % 12));
const PITCH_METER_NOTE_NAMES = [
    'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'
];

function isNewerPitchMeterCounter(candidate, current) {
    const delta = (candidate - current) >>> 0;
    return delta !== 0 && delta < 0x80000000;
}

function pitchMeterNoteName(midi) {
    const note = Math.round(midi);
    return `${PITCH_METER_NOTE_NAMES[note % 12]}${Math.floor(note / 12) - 1}`;
}

class PitchMeterPlugin extends PluginBase {
    static executionCapabilities = Object.freeze({ requiresWasm: true });

    constructor() {
        super('Pitch Meter', 'Tracks the fundamental pitch of a single note');
        this.rf = 440;
        this.mn = PITCH_METER_DEFAULT_MIN_MIDI;
        this.mx = PITCH_METER_DEFAULT_MAX_MIDI;
        this.ly = 'Horizontal';

        this.pitchHistory = new Float32Array(PITCH_METER_HISTORY_WIDTH);
        this.confidenceHistory = new Float32Array(PITCH_METER_HISTORY_WIDTH);
        this.voicedHistory = new Uint8Array(PITCH_METER_HISTORY_WIDTH);
        this.writeColumn = 0;
        this.columnPhase = 0;
        this.lastFrameIndex = null;
        this.lastPitchMidi = 0;
        this.lastConfidence = 0;
        this.lastVoiced = false;
        this.activeGeneration = null;
        this.generationFence = null;
        this.timeFence = null;
        this.lastObservedTimeSeconds = null;
        this.currentNote = '';
        this.currentCents = '';

        this._dspTelemetryHub = null;
        this._dspTelemetryTapId = null;
        this._dspTelemetryUnsubscribe = null;
        this._boundTelemetry = frame => this.handleTelemetry(frame);

        this.canvas = null;
        this.canvasCtx = null;
        this.observer = null;
        this.resizeGraphDisposer = null;
        this.graphDpr = 1;
        this.isVisible = false;
        this.animationFrameId = null;

        this.registerProcessor('return data;');
    }

    reset() {
        this.rf = 440;
        this.mn = PITCH_METER_DEFAULT_MIN_MIDI;
        this.mx = PITCH_METER_DEFAULT_MAX_MIDI;
        this.ly = 'Horizontal';
        this.beginTelemetryEpoch();
        this.updateParameters();
    }

    getParameters() {
        this.ensureDspTelemetrySubscription();
        return {
            type: this.constructor.name,
            enabled: this.enabled,
            rf: this.rf,
            mn: this.mn,
            mx: this.mx,
            ly: this.ly
        };
    }

    setParameters(params = {}) {
        if (params.enabled !== undefined) this.enabled = params.enabled !== false;
        const previousReferenceA4 = this.rf;
        if (params.rf !== undefined) {
            this.rf = this.parseFiniteNumber(params.rf, 400, 480, this.rf);
        }
        if (PITCH_METER_LAYOUTS.includes(params.ly) && params.ly !== this.ly) {
            this.ly = params.ly;
            this.drawGraph();
        }
        const previousMinMidi = this.mn;
        const previousMaxMidi = this.mx;
        if (params.mn !== undefined) {
            this.mn = Math.round(this.parseFiniteNumber(
                params.mn, PITCH_METER_FIRST_MIDI, PITCH_METER_LAST_MIDI, this.mn
            ));
            if (this.mn > this.mx) this.mx = this.mn;
        }
        if (params.mx !== undefined) {
            this.mx = Math.round(this.parseFiniteNumber(
                params.mx, PITCH_METER_FIRST_MIDI, PITCH_METER_LAST_MIDI, this.mx
            ));
            if (this.mx < this.mn) this.mn = this.mx;
        }
        if (this.rf !== previousReferenceA4 || this.mn !== previousMinMidi ||
            this.mx !== previousMaxMidi) {
            this.beginTelemetryEpoch();
            this.drawGraph();
        }
        this.updateParameters();
    }

    _setupMessageHandler() {
        const previousWorkletNode = this._messageHandlerWorkletNode;
        super._setupMessageHandler();
        if (this.pitchHistory && this._messageHandlerWorkletNode !== previousWorkletNode) {
            this.beginTelemetryEpoch();
        }
        this.ensureDspTelemetrySubscription();
    }

    onMessage(message) {
        this.ensureDspTelemetrySubscription();
        super.onMessage(message);
    }

    ensureDspTelemetrySubscription() {
        const hub = window.dspTelemetryHub;
        const tapId = this.id;
        const validTapId = Number.isInteger(tapId) && tapId >= 0 && tapId <= 0xffffffff;
        const validHub = hub && typeof hub.subscribe === 'function';
        if (!validTapId || !validHub) {
            if (this._dspTelemetryUnsubscribe &&
                (hub !== this._dspTelemetryHub || tapId !== this._dspTelemetryTapId)) {
                this.disposeDspTelemetrySubscription();
            }
            return false;
        }
        if (this._dspTelemetryUnsubscribe && hub === this._dspTelemetryHub &&
            tapId === this._dspTelemetryTapId) {
            return true;
        }
        this.disposeDspTelemetrySubscription();
        try {
            const unsubscribe = hub.subscribe(tapId, PITCH_METER_FRAME_TYPE, this._boundTelemetry);
            if (typeof unsubscribe !== 'function') {
                hub.unsubscribe?.(tapId, PITCH_METER_FRAME_TYPE, this._boundTelemetry);
                return false;
            }
            this._dspTelemetryHub = hub;
            this._dspTelemetryTapId = tapId;
            this._dspTelemetryUnsubscribe = unsubscribe;
            return true;
        } catch (error) {
            return false;
        }
    }

    disposeDspTelemetrySubscription() {
        const unsubscribe = this._dspTelemetryUnsubscribe;
        this._dspTelemetryHub = null;
        this._dspTelemetryTapId = null;
        this._dspTelemetryUnsubscribe = null;
        if (!unsubscribe) return;
        try {
            unsubscribe();
        } catch (error) {
            // Ignore stale telemetry subscription cleanup failures.
        }
    }

    parseTelemetryFrame(frame) {
        if (frame?.frameType !== PITCH_METER_FRAME_TYPE ||
            frame.formatVersion !== PITCH_METER_TELEMETRY_VERSION) return null;
        const payload = frame.payload;
        if (!payload || typeof payload.getFloat32 !== 'function' ||
            typeof payload.getUint16 !== 'function' ||
            typeof payload.getUint32 !== 'function' ||
            payload.byteLength !== PITCH_METER_PAYLOAD_BYTES) return null;

        const snapshot = {
            sampleRate: payload.getFloat32(0, true),
            timeSeconds: payload.getFloat32(4, true),
            hopSeconds: payload.getFloat32(8, true),
            frameIndex: payload.getUint32(12, true),
            generation: payload.getUint32(16, true),
            f0Hz: payload.getFloat32(20, true),
            midi: payload.getFloat32(24, true),
            cents: payload.getFloat32(28, true),
            confidence: payload.getFloat32(32, true),
            levelDb: payload.getFloat32(36, true),
            voiced: (payload.getUint16(40, true) & 1) !== 0
        };
        const flags = payload.getUint16(40, true);
        const reserved = payload.getUint16(42, true);
        if (!Number.isFinite(snapshot.sampleRate) || snapshot.sampleRate <= 0 ||
            !Number.isFinite(snapshot.timeSeconds) || snapshot.timeSeconds < 0 ||
            !Number.isFinite(snapshot.hopSeconds) || snapshot.hopSeconds <= 0 ||
            snapshot.generation === 0 || flags > 1 || reserved !== 0 ||
            !Number.isFinite(snapshot.f0Hz) || !Number.isFinite(snapshot.midi) ||
            !Number.isFinite(snapshot.cents) || !Number.isFinite(snapshot.confidence) ||
            snapshot.confidence < 0 || snapshot.confidence > 1 ||
            !Number.isFinite(snapshot.levelDb)) return null;
        if (snapshot.voiced) {
            if (snapshot.f0Hz <= 0 || snapshot.midi < PITCH_METER_FIRST_MIDI - 0.5 ||
                snapshot.midi > PITCH_METER_LAST_MIDI + 0.5 ||
                snapshot.cents < -50 || snapshot.cents > 50) return null;
        } else if (snapshot.f0Hz !== 0 || snapshot.midi !== 0 ||
            snapshot.cents !== 0 || snapshot.confidence !== 0) return null;
        return snapshot;
    }

    beginTelemetryEpoch() {
        const audioTime = window.audioContext?.currentTime;
        this.timeFence = Number.isFinite(audioTime) && audioTime >= 0
            ? Math.fround(audioTime)
            : this.lastObservedTimeSeconds;
        if (this.activeGeneration !== null) this.generationFence = this.activeGeneration;
        this.activeGeneration = null;
        this.clearHistory();
    }

    clearHistory() {
        this.pitchHistory.fill(0);
        this.confidenceHistory.fill(0);
        this.voicedHistory.fill(0);
        this.writeColumn = 0;
        this.columnPhase = 0;
        this.lastFrameIndex = null;
        this.lastPitchMidi = 0;
        this.lastConfidence = 0;
        this.lastVoiced = false;
        this.currentNote = '';
        this.currentCents = '';
    }

    writeHistory(snapshot) {
        let advance = 1;
        let delta = 0;
        if (this.lastFrameIndex !== null) {
            delta = (snapshot.frameIndex - this.lastFrameIndex) >>> 0;
            if (delta === 0 || delta >= 0x80000000) return false;
            this.columnPhase += delta * snapshot.hopSeconds / PITCH_METER_COLUMN_PERIOD;
            advance = Math.floor(this.columnPhase);
            this.columnPhase -= advance;
        }
        if (advance >= PITCH_METER_HISTORY_WIDTH) {
            this.clearHistory();
            advance = 1;
        }
        if (advance === 0) {
            const column = (this.writeColumn + PITCH_METER_HISTORY_WIDTH - 1) %
                PITCH_METER_HISTORY_WIDTH;
            this.storeHistoryColumn(column, snapshot.midi, snapshot.confidence, snapshot.voiced);
        } else {
            const interpolate = delta === 1 && this.lastVoiced && snapshot.voiced;
            for (let offset = 0; offset < advance; offset++) {
                const column = (this.writeColumn + offset) % PITCH_METER_HISTORY_WIDTH;
                const fraction = (offset + 1) / advance;
                const midi = interpolate
                    ? this.lastPitchMidi + (snapshot.midi - this.lastPitchMidi) * fraction
                    : snapshot.midi;
                const confidence = interpolate
                    ? this.lastConfidence + (snapshot.confidence - this.lastConfidence) * fraction
                    : snapshot.confidence;
                const voiced = interpolate || (offset === advance - 1 && snapshot.voiced);
                this.storeHistoryColumn(column, midi, confidence, voiced);
            }
            this.writeColumn = (this.writeColumn + advance) % PITCH_METER_HISTORY_WIDTH;
        }
        this.lastFrameIndex = snapshot.frameIndex;
        this.lastPitchMidi = snapshot.midi;
        this.lastConfidence = snapshot.confidence;
        this.lastVoiced = snapshot.voiced;
        return true;
    }

    storeHistoryColumn(column, midi, confidence, voiced) {
        this.pitchHistory[column] = voiced ? midi : 0;
        this.confidenceHistory[column] = voiced ? confidence : 0;
        this.voicedHistory[column] = voiced ? 1 : 0;
    }

    handleTelemetry(frame) {
        if (!frame || !this.enabled || !this._sectionEnabled) return;
        const snapshot = this.parseTelemetryFrame(frame);
        if (!snapshot) return;
        if (this.activeGeneration === null) {
            const afterTimeFence = this.timeFence === null || snapshot.timeSeconds > this.timeFence;
            const afterGenerationFence = this.generationFence !== null &&
                isNewerPitchMeterCounter(snapshot.generation, this.generationFence);
            if (!afterTimeFence && !afterGenerationFence) return;
            this.activeGeneration = snapshot.generation;
            this.generationFence = null;
            this.timeFence = null;
        } else if (snapshot.generation !== this.activeGeneration) {
            if (!isNewerPitchMeterCounter(snapshot.generation, this.activeGeneration)) return;
            this.clearHistory();
            this.activeGeneration = snapshot.generation;
        }
        if (!this.writeHistory(snapshot)) return;
        this.lastObservedTimeSeconds = snapshot.timeSeconds;
        this.currentNote = snapshot.voiced ? pitchMeterNoteName(snapshot.midi) : '';
        this.currentCents = snapshot.voiced
            ? `${snapshot.cents >= 0 ? '+' : ''}${snapshot.cents.toFixed(1)} cent`
            : '';
    }

    createNoteRangeControl(label, value, setter, modelKey) {
        const row = document.createElement('div');
        row.className = 'parameter-row';
        const paramName = label.toLowerCase().replace(/\s+/g, '-');
        const sliderId = `${this.id}-${this.name}-${paramName}-slider`;
        const valueId = `${this.id}-${this.name}-${paramName}-value`;
        const labelElement = document.createElement('label');
        labelElement.textContent = `${label}:`;
        labelElement.htmlFor = sliderId;
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.id = sliderId;
        slider.name = sliderId;
        slider.min = PITCH_METER_FIRST_MIDI;
        slider.max = PITCH_METER_LAST_MIDI;
        slider.step = 1;
        slider.value = value;
        slider.autocomplete = 'off';
        const valueInput = document.createElement('input');
        valueInput.type = 'text';
        valueInput.id = valueId;
        valueInput.name = valueId;
        valueInput.readOnly = true;
        valueInput.value = pitchMeterNoteName(value);
        valueInput.autocomplete = 'off';
        valueInput.style.flexGrow = '0';
        valueInput.style.width = '80px';
        valueInput.style.boxSizing = 'border-box';
        slider.addEventListener('input', event => {
            const nextValue = Number(event.target.value);
            if (!Number.isFinite(nextValue)) return;
            setter(nextValue);
            valueInput.value = pitchMeterNoteName(this[modelKey]);
        });
        this._registerUIControl(modelKey, [slider], modelValue => {
            const midi = Math.round(Number(modelValue));
            if (!Number.isFinite(midi)) return;
            slider.value = midi;
            window.uiManager?.refreshRangeFillStyling?.(slider);
            valueInput.value = pitchMeterNoteName(midi);
        });
        row.appendChild(labelElement);
        row.appendChild(slider);
        row.appendChild(valueInput);
        return row;
    }

    createUI() {
        this.ensureDspTelemetrySubscription();
        this.observer?.disconnect();
        this.resizeGraphDisposer?.();
        this.resizeGraphDisposer = null;
        const container = document.createElement('div');
        container.className = 'plugin-parameter-ui';
        container.appendChild(this.createRadioGroup(
            'Layout', PITCH_METER_LAYOUTS, this.ly,
            value => this.setParameters({ ly: value }), 'ly'
        ));
        container.appendChild(this.createParameterControl(
            'Reference A4', 400, 480, 1, this.rf,
            value => this.setParameters({ rf: value }), 'Hz', 'rf'
        ));
        container.appendChild(this.createNoteRangeControl(
            'Lowest Note', this.mn,
            value => {
                this.setParameters({ mn: value });
                this.syncUIControls?.();
            }, 'mn'
        ));
        container.appendChild(this.createNoteRangeControl(
            'Highest Note', this.mx,
            value => {
                this.setParameters({ mx: value });
                this.syncUIControls?.();
            }, 'mx'
        ));
        const graph = this.createResponsiveGraph({
            maxWidth: 1024,
            aspectRatio: '32 / 15',
            mobileAspectRatio: '4 / 3',
            onResize: ({ canvas, dpr }) => {
                this.canvas = canvas;
                this.graphDpr = dpr;
                this.canvasCtx = canvas.getContext('2d', { alpha: false });
                this.drawGraph();
            }
        });
        this.canvas = graph.canvas;
        this.canvasCtx = this.canvas.getContext('2d', { alpha: false });
        this.resizeGraphDisposer = graph.dispose;
        this.canvas.setAttribute('aria-label', 'Single-note pitch history');
        container.appendChild(graph.container);
        if (typeof IntersectionObserver === 'function') {
            this.observer = new IntersectionObserver(this.handleIntersect.bind(this));
            this.observer.observe(this.canvas);
        } else {
            this.drawGraph();
        }
        return container;
    }

    handleIntersect(entries) {
        entries.forEach(entry => {
            this.isVisible = entry.isIntersecting;
            if (this.isVisible) {
                if (this.canRunAnimation()) this.startAnimation();
                else this.renderPowerUiOnce(() => this.drawGraph());
            } else {
                this.stopAnimation();
            }
        });
    }

    startAnimation() {
        if (this.animationFrameId !== null || !this.enabled || !this._sectionEnabled) return;
        const animate = () => {
            if (!this.isVisible) {
                this.stopAnimation();
                return;
            }
            this.drawGraph();
            this.animationFrameId = this.requestPowerAnimationFrame(animate, 'analyzer');
        };
        animate();
    }

    stopAnimation() {
        if (this.animationFrameId === null) return;
        if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
    }

    _displayPalette() {
        const read = name => window.ThemePalette?.get(name) ?? '';
        const background = read('graph-bg-deep');
        const soft = read('graph-base-soft');
        const backgroundRgb = background.match(/[\d.]+/g)?.slice(0, 3).map(Number);
        const light = backgroundRgb?.every(channel => channel > 127) === true;
        const darkBand = backgroundRgb?.length === 3
            ? `rgb(${backgroundRgb.map(channel => channel + 8).join(', ')})` // theme-allow: Theme-derived keyboard band color.
            : soft;
        return {
            background,
            whiteBand: background,
            blackBand: light ? soft : darkBand,
            whiteKey: light ? '#fff' : '#ddd', // theme-allow: Theme-dependent keyboard color.
            blackKey: '#222', // theme-allow: Fixed self-painted black key color.
            trace: read('graph-trace'),
            label: read('graph-label'),
            strongGrid: read('graph-grid-strong'),
            subtleGrid: read('graph-grid-subtle')
        };
    }

    drawGraph() {
        if (!this.canvas || !this.canvasCtx) return;
        const context = this.canvasCtx;
        const palette = this._displayPalette();
        const horizontal = this.ly === 'Horizontal';
        const width = horizontal ? this.canvas.height : this.canvas.width;
        const height = horizontal ? this.canvas.width : this.canvas.height;
        const dpr = this.graphDpr || 1;
        const gutter = PITCH_METER_KEY_GUTTER_CSS_PX * dpr;
        const blackKeyDepth = PITCH_METER_BLACK_KEY_DEPTH_CSS_PX * dpr;
        const rollWidth = width - gutter;
        context.fillStyle = palette.background;
        context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        if (rollWidth <= 0 || height <= 0) return;
        if (horizontal) {
            context.save();
            context.translate(this.canvas.width, 0);
            context.rotate(Math.PI / 2);
        }
        const noteCount = this.mx - this.mn + 1;
        const rowHeight = height / noteCount;
        for (let midi = this.mn; midi <= this.mx; midi++) {
            const y = (this.mx - midi) * rowHeight;
            const black = PITCH_METER_BLACK_KEY_CLASSES.has(midi % 12);
            context.fillStyle = black ? palette.blackBand : palette.whiteBand;
            context.fillRect(0, y, rollWidth, rowHeight);
            if (midi % 12 === 0 || midi % 12 === 5) {
                context.strokeStyle = midi % 12 === 0 ? palette.strongGrid : palette.subtleGrid;
                context.beginPath();
                context.moveTo(0, y + rowHeight);
                context.lineTo(rollWidth, y + rowHeight);
                context.stroke();
            }
        }
        const whiteKeyHeight = 12 * rowHeight / 7;
        context.fillStyle = palette.whiteKey;
        for (const midi of PITCH_METER_WHITE_KEY_MIDIS) {
            const pitchClass = midi % 12;
            const whiteIndex = PITCH_METER_WHITE_KEY_CLASSES.indexOf(pitchClass);
            const octaveC = midi - pitchClass;
            const cBoundary = (octaveC - this.mn) * rowHeight;
            const center = cBoundary + (whiteIndex + 0.5) * whiteKeyHeight;
            const start = center - whiteKeyHeight / 2;
            const end = center + whiteKeyHeight / 2;
            const clippedStart = start < 0 ? 0 : start;
            const clippedEnd = end > height ? height : end;
            if (clippedStart >= clippedEnd) continue;
            context.fillRect(rollWidth, height - clippedEnd, gutter, clippedEnd - clippedStart);
        }
        context.strokeStyle = palette.label;
        for (const midi of PITCH_METER_WHITE_KEY_MIDIS) {
            const pitchClass = midi % 12;
            const whiteIndex = PITCH_METER_WHITE_KEY_CLASSES.indexOf(pitchClass);
            const octaveC = midi - pitchClass;
            const boundary = (octaveC - this.mn) * rowHeight + whiteIndex * whiteKeyHeight;
            if (boundary <= 0 || boundary >= height) continue;
            const y = height - boundary;
            context.beginPath();
            context.moveTo(rollWidth, y);
            context.lineTo(width, y);
            context.stroke();
        }
        context.fillStyle = palette.blackKey;
        for (let midi = this.mn; midi <= this.mx; midi++) {
            if (!PITCH_METER_BLACK_KEY_CLASSES.has(midi % 12)) continue;
            context.fillRect(rollWidth, (this.mx - midi) * rowHeight,
                blackKeyDepth, rowHeight);
        }
        context.strokeStyle = palette.label;
        context.beginPath();
        context.moveTo(rollWidth, 0);
        context.lineTo(rollWidth, height);
        context.stroke();
        context.fillStyle = '#111'; // theme-allow: Text on the self-painted white keys.
        context.font = `${8 * dpr}px Arial`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        for (let midi = this.mn; midi <= this.mx; midi++) {
            if (midi % 12 !== 0) continue;
            const label = pitchMeterNoteName(midi);
            const y = (this.mx - midi + 0.5) * rowHeight;
            if (horizontal) {
                context.save();
                context.translate(width - 2 * dpr, y);
                context.rotate(-Math.PI / 2);
                context.textBaseline = 'bottom';
                context.fillText(label, 0, 0);
                context.restore();
            } else {
                context.fillText(label, rollWidth + gutter * 0.72, y);
            }
        }
        context.lineWidth = 2 * dpr;
        for (let index = 1; index < PITCH_METER_HISTORY_WIDTH; index++) {
            const previousColumn = (this.writeColumn + index - 1) % PITCH_METER_HISTORY_WIDTH;
            const column = (this.writeColumn + index) % PITCH_METER_HISTORY_WIDTH;
            if (!this.voicedHistory[previousColumn] || !this.voicedHistory[column]) continue;
            const previousMidi = this.pitchHistory[previousColumn];
            const midi = this.pitchHistory[column];
            if (previousMidi < this.mn - 0.5 || previousMidi > this.mx + 0.5 ||
                midi < this.mn - 0.5 || midi > this.mx + 0.5) {
                continue;
            }
            context.strokeStyle = palette.trace;
            context.globalAlpha = 0.2 + 0.8 * (
                this.confidenceHistory[previousColumn] + this.confidenceHistory[column]
            ) * 0.5;
            context.beginPath();
            context.moveTo((index - 1) * rollWidth / (PITCH_METER_HISTORY_WIDTH - 1),
                (this.mx - previousMidi + 0.5) * rowHeight);
            context.lineTo(index * rollWidth / (PITCH_METER_HISTORY_WIDTH - 1),
                (this.mx - midi + 0.5) * rowHeight);
            context.stroke();
        }
        context.globalAlpha = 1;
        if (horizontal) context.restore();
        if (this.currentNote) {
            const padding = 8 * dpr;
            const gap = 16 * dpr;
            const fontSize = 48 * dpr;
            context.font = `${fontSize}px Arial`;
            const noteWidth = context.measureText('G#8').width;
            context.font = `${fontSize}px monospace`;
            const centsWidth = context.measureText('-50.0 cent').width;
            const labelWidth = noteWidth + gap + centsWidth;
            const availableWidth = this.canvas.width - (horizontal ? 0 : gutter) - 2 * padding;
            if (availableWidth <= 0) return;
            // Reserve fixed slots so note changes and cent digits never move the decimal point.
            const scale = Math.min(1, availableWidth / labelWidth);
            const noteColor = window.NoteSpectrogramPlugin?.noteColors[Math.round(this.lastPitchMidi) % 12];
            context.fillStyle = noteColor
                ? `rgb(${noteColor.join(', ')})` // theme-allow: Shared Note Spectrogram note colormap.
                : palette.label;
            context.font = `${fontSize * scale}px Arial`;
            context.textAlign = 'left';
            context.textBaseline = 'top';
            context.fillText(this.currentNote, padding, padding);
            context.fillStyle = palette.label;
            context.font = `${fontSize * scale}px monospace`;
            context.textAlign = 'right';
            context.fillText(this.currentCents, padding + labelWidth * scale, padding);
        }
    }

    cleanup() {
        this.stopAnimation();
        this.disposeDspTelemetrySubscription();
        if (this.observer) {
            if (this.canvas) this.observer.unobserve(this.canvas);
            this.observer.disconnect();
        }
        this.resizeGraphDisposer?.();
        this.resizeGraphDisposer = null;
        this.canvas = null;
        this.canvasCtx = null;
        this.observer = null;
        super.cleanup();
    }
}

window.PitchMeterPlugin = PitchMeterPlugin;
