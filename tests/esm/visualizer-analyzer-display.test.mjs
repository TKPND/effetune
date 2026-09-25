import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import '../../plugins/multires-spectrum.js';
import { createAnalyzerDisplay } from '../../js/visualizer/visualizer-analyzer-display.js';
import { VisualizerRenderer } from '../../js/visualizer/visualizer-renderer.js';
import { createDefaultLayout, createItem } from '../../js/visualizer/visualizer-model.js';
import { VisualizerSources } from '../../js/visualizer/visualizer-sources.js';
import { withGlobals } from '../helpers/global-test-utils.mjs';

function canvas() {
    const calls = [];
    const context = new Proxy({
        calls,
        createImageData: (width, height) => ({ data: new Uint8ClampedArray(width * height * 4) }),
        measureText: text => ({ width: text.length * 7, actualBoundingBoxAscent: 10, actualBoundingBoxDescent: 2 }),
        createLinearGradient: () => ({ addColorStop() {} }),
        createRadialGradient: () => ({ addColorStop() {} }),
        createConicGradient: (...coordinates) => {
            const gradient = { coordinates, stops: [], addColorStop(position, color) { this.stops.push([position, color]); } };
            calls.push(['createConicGradient', gradient]);
            return gradient;
        }
    }, {
        get(target, key) { return key in target ? target[key] : (...args) => calls.push([key, ...args]); },
        set(target, key, value) {
            if (key === 'fillStyle' || key === 'strokeStyle') calls.push([key, value]);
            target[key] = value;
            return true;
        }
    });
    return { width: 800, height: 400, getContext: () => context, context };
}

function runtime() {
    let constructions = 0, registrations = 0;
    class PluginBase {
        constructor() { constructions++; }
        registerProcessor() { registrations++; }
        updateParameters() {}
        parseFiniteNumber(value, min, max, fallback) {
            return Number.isFinite(Number(value)) ? Math.max(min, Math.min(max, Number(value))) : fallback;
        }
    }
    const window = { ThemePalette: { get: name => name === 'graph-trace' ? 'rgba(0,255,0,1)' : 'rgba(16,16,16,1)' } };
    const document = { createElement: () => canvas() };
    for (const file of ['spectrum_analyzer', 'spectrogram', 'oscilloscope', 'stereo_meter', 'note_spectrogram', 'level_meter']) {
        vm.runInNewContext(readFileSync(new URL(`../../plugins/analyzer/${file}.js`, import.meta.url), 'utf8'),
            { window, document, PluginBase, performance: { now: () => 1000 }, Float32Array, DataView, ArrayBuffer,
                MultiresSpectrum: globalThis.MultiresSpectrum, console });
    }
    const subscribers = new Map();
    const sources = {
        subscribeItem(id, callback) { subscribers.set(id, callback); return () => subscribers.delete(id); },
        getFrame: () => null, getModulators: () => ({ level: 0, bass: 0 })
    };
    return { window, document, sources, subscribers, counts: () => [constructions, registrations] };
}

function noteFrame(index = 1) {
    const payload = new DataView(new ArrayBuffer(28 + 440 * 8));
    payload.setFloat32(0, 48000, true);
    payload.setFloat32(4, index * .01, true);
    payload.setUint16(8, 440, true);
    payload.setUint16(10, 21, true);
    payload.setFloat32(12, .01, true);
    payload.setUint32(16, index, true);
    payload.setUint32(20, 5, true);
    payload.setUint32(24, 1, true);
    for (let pitch = 0; pitch < 440; pitch++) {
        payload.setFloat32(28 + pitch * 4, pitch === 197 ? .8 : 0, true);
        payload.setFloat32(28 + 440 * 4 + pitch * 4, pitch === 197 ? -42 : -240, true);
    }
    return { frameType: 24, formatVersion: 3, payload };
}

test('Notes and HQ Spectrum accept the first frame after returning to Visualizer', async () => {
    const env = runtime(), subscriptions = new Map();
    let published = [];
    env.document.hidden = false;
    env.document.addEventListener = () => {};
    env.document.removeEventListener = () => {};
    const manager = {
        telemetryHub: { subscribe(tapId, _type, callback) {
            subscriptions.set(tapId, callback);
            return () => subscriptions.delete(tapId);
        } },
        setVisualizerSources(sources) { published = sources; }
    };
    await withGlobals(env, () => {
        const spectrum = createItem('spectrum', 'spectrum');
        spectrum.params.sc = 'log-hq';
        const notes = createItem('notes', 'notes');
        const sources = new VisualizerSources(manager);
        sources.setLayout({ items: [spectrum, notes] });
        sources.setVisible(true);
        const spectrumDisplay = createAnalyzerDisplay(spectrum, canvas(), sources);
        const notesDisplay = createAnalyzerDisplay(notes, canvas(), sources);
        env.window.SpectrumAnalyzerPlugin.prototype.parseDspSpectrumTelemetryFrame = frame => frame.snapshot;
        const send = (type, frame) => {
            const source = published.find(entry => entry.type === type);
            assert.ok(source);
            subscriptions.get(source.tapId)(frame, {});
        };
        const spectrumFrame = frameIndex => ({ frameType: 4, formatVersion: 2,
            snapshot: { highQuality: true, points: 12, generation: 1, frameIndex,
                sampleRate: 48000, current: Float32Array.of(-12), peaks: Float32Array.of(-12) } });
        send('SpectrumAnalyzerPlugin', spectrumFrame(100));
        send('NoteSpectrogramPlugin', noteFrame(100));
        assert.equal(spectrumDisplay.plugin.hqFrameIndex, 100);
        assert.equal(notesDisplay.plugin.lastFrameIndex, 100);

        sources.setVisible(false);
        sources.setVisible(true);
        send('SpectrumAnalyzerPlugin', spectrumFrame(0));
        send('NoteSpectrogramPlugin', noteFrame(1));
        assert.equal(spectrumDisplay.plugin.hqFrameIndex, 0);
        assert.equal(notesDisplay.plugin.lastFrameIndex, 1);
        spectrumDisplay.dispose();
        notesDisplay.dispose();
        sources.dispose();
    });
});

test('Visualizer uses the original analyzer drawing methods without constructing audio pipeline plugins', async () => {
    const env = runtime();
    await withGlobals(env, () => {
        for (const [type, name, method] of [
            ['spectrum', 'SpectrumAnalyzerPlugin', 'drawGraph'],
            ['spectrogram', 'SpectrogramPlugin', 'drawGraph'],
            ['oscilloscope', 'OscilloscopePlugin', 'drawWaveform'],
            ['stereo', 'StereoMeterPlugin', 'drawMeter'],
            ['notes', 'NoteSpectrogramPlugin', 'drawGraph'],
            ['level-meter', 'LevelMeterPlugin', 'updateMeter']
        ]) {
            const baseline = env.counts();
            const item = createItem(type, type), target = canvas();
            const display = createAnalyzerDisplay(item, target, env.sources);
            assert.equal(display.plugin[method], env.window[name].prototype[method]);
            display.draw(item, 1, 400);
            assert.equal(display.plugin.graphDpr, 2);
            assert.deepEqual(env.counts(), baseline);
            const original = new env.window[name]();
            for (const key of Object.keys(item.params).filter(key => key in original)) {
                assert.equal(display.plugin[key], item.params[key], `${type}.${key}`);
            }
            display.dispose();
            assert.equal(env.subscribers.has(type), false);
        }
    });
});

test('Oscilloscope displays telemetry through the native trace with Visualizer palette and axes', async () => {
    const env = runtime();
    await withGlobals(env, () => {
        const item = createItem('oscilloscope', 'scope'), target = canvas();
        const display = createAnalyzerDisplay(item, target, env.sources);
        assert.ok(display);
        const payload = new DataView(new ArrayBuffer(16 + 4 * 4));
        payload.setFloat32(0, 48000, true);
        payload.setUint32(4, 4, true);
        payload.setUint32(8, 0, true);
        [0, 0.5, -0.5, 0].forEach((value, index) => payload.setFloat32(16 + index * 4, value, true));
        const source = {};
        env.subscribers.get('scope')({ frameType: 3, formatVersion: 2, payload, source }, {});
        target.context.calls.length = 0;
        display.draw(item, 1, 400);
        assert.equal(display.plugin.scopeSnapshot.values.length, 4);
        assert.ok(target.context.calls.some(call => call[0] === 'strokeStyle' && call[1] === item.palette.color));
        assert.equal(target.context.calls.filter(call => call[0] === 'fillText').length, 0);
        assert.ok(target.context.calls.some(call => call[0] === 'clearRect'));
        item.params.showAxes = item.params.showAxisNumbers = true;
        target.context.calls.length = 0;
        display.draw(item, 1, 400);
        assert.ok(target.context.calls.some(call => call[0] === 'fillText' && call[1] === 'Time (ms)'));
        item.params.showAxes = false;
        target.context.calls.length = 0;
        display.draw(item, 1, 400);
        assert.ok(target.context.calls.some(call => call[0] === 'fillText' && call[1] === 'Time (ms)'),
            'Axis labels remain visible without grid lines');
        assert.equal(target.context.calls.filter(call => call[0] === 'stroke').length, 1,
            'Only the waveform is stroked when axes and grid are hidden');
        const gradients = [];
        target.context.createLinearGradient = (...coordinates) => {
            assert.ok(coordinates.every(Number.isFinite), 'Gradient coordinates must be finite');
            const gradient = { coordinates, stops: [], addColorStop(position, color) { this.stops.push([position, color]); } };
            gradients.push(gradient);
            return gradient;
        };
        item.palette.color = '#ff0000';
        target.context.calls.length = 0;
        display.draw(item, 2, 400);
        assert.ok(target.context.calls.some(call => call[0] === 'strokeStyle' && call[1] === '#ff0000'));
        item.palette.mode = 'gradient';
        item.palette.stops = [{ pos: 0, color: '#ff0000' }, { pos: 1, color: '#0000ff' }];
        item.palette.motion = { mode: 'hue', speed: 0.5 };
        display.draw(item, 3, 400);
        display.draw(item, 4, 400);
        assert.equal(gradients.length, 2);
        assert.deepEqual(gradients.map(gradient => gradient.coordinates), [[0, 0, 800, 0], [0, 0, 800, 0]]);
        assert.notDeepEqual(gradients[0].stops, gradients[1].stops);
        const oldSnapshot = display.plugin.scopeSnapshot;
        env.subscribers.get('scope')({ frameType: 3, formatVersion: 2, payload, source: {} }, {});
        assert.notEqual(display.plugin.scopeSnapshot, oldSnapshot);
        display.dispose();
    });
});

test('A one-second stereo window batches all 48000 samples by age instead of changing canvas color per point', async () => {
    const env = runtime();
    await withGlobals(env, () => {
        const item = createItem('stereo', 'stereo'), target = canvas();
        item.params.wt = 1;
        item.palette.mode = 'gradient';
        item.palette.stops = [{ pos: 0, color: '#ff0000' }, { pos: 1, color: '#0000ff' }];
        const display = createAnalyzerDisplay(item, target, env.sources);
        display.plugin.sampleRate = 48000;
        display.plugin.currentMeasurements = {
            xBuffer: new Float32Array(48000).fill(.5), yBuffer: new Float32Array(48000).fill(.3),
            currentPosition: 0, peakBuffer: new Float32Array(360)
        };
        display.plugin.dspStereoFieldSnapshot = { correlation: 0, balance: 0 };
        target.context.calls.length = 0;
        display.draw(item, 1, 800);
        const count = name => target.context.calls.filter(call => call[0] === name).length;
        assert.ok(count('fillStyle') <= 270, `${count('fillStyle')} fillStyle changes`);
        assert.equal(count('rect'), 48000);
        assert.equal(count('fill'), 256);
        assert.ok(count('fillRect') < 10);
        assert.equal(count('createConicGradient'), 256);
        const gradients = target.context.calls.filter(call => call[0] === 'createConicGradient').map(call => call[1]);
        assert.deepEqual(gradients[255].coordinates, [-Math.PI / 2, 400, 200]);
        assert.deepEqual(gradients[0].stops[0], [0, 'rgba(255,0,0,0)']);
        assert.deepEqual(gradients[128].stops[0], [0, `rgba(255,0,0,${128 / 255})`]);
        assert.deepEqual(gradients[255].stops[0], [0, 'rgba(255,0,0,1)']);
        assert.deepEqual(gradients[255].stops.at(-1), [1, 'rgba(0,0,255,1)']);
        target.context.calls.length = 0;
        display.draw(item, 2, 800);
        assert.equal(count('createConicGradient'), 0);
        assert.equal(count('fill'), 256);
        target.width = 1000;
        display.draw(item, 3, 1000);
        assert.equal(count('createConicGradient'), 256);
        item.palette.motion = { mode: 'hue', speed: .5 };
        target.context.calls.length = 0;
        display.draw(item, 4, 1000);
        assert.equal(count('createConicGradient'), 256);
        assert.equal(count('fill'), 256);
        assert.equal(count('rect'), 48000);
        assert.ok(count('fillStyle') <= 270);
        assert.ok(count('fillRect') < 10);
        item.palette.stops = [{ pos: 0, color: '#ff0000' }];
        target.context.calls.length = 0;
        display.draw(item, 5, 1000);
        assert.equal(count('createConicGradient'), 0);
        assert.equal(count('fill'), 256);
        assert.equal(count('rect'), 48000);
        assert.ok(count('fillStyle') <= 270);
        assert.ok(count('fillRect') < 10);
    });
});

test('Stereo correlation and balance controls hide each meter without hiding the waveform or other meter', async () => {
    const env = runtime();
    await withGlobals(env, () => {
        const item = createItem('stereo', 'stereo'), target = canvas();
        item.params.showAxes = item.params.showAxisNumbers = true;
        const display = createAnalyzerDisplay(item, target, env.sources);
        display.plugin.sampleRate = 100;
        display.plugin.currentMeasurements = {
            xBuffer: new Float32Array(100).fill(.5), yBuffer: new Float32Array(100).fill(.3),
            currentPosition: 0, peakBuffer: new Float32Array(360)
        };
        display.plugin.dspStereoFieldSnapshot = { correlation: .5, balance: 6 };
        const draw = () => {
            target.context.calls.length = 0;
            display.draw(item, 1, 800);
            const calls = target.context.calls;
            return {
                correlationBar: calls.some(call => call[0] === 'fillRect' && call[1] === 0),
                balanceBar: calls.some(call => call[0] === 'fillRect' && call[2] === 384),
                labels: calls.filter(call => call[0] === 'fillText').map(call => call[1]),
                waveform: calls.some(call => call[0] === 'rect'),
                peak: calls.some(call => call[0] === 'closePath')
            };
        };
        const both = draw();
        assert.equal(both.correlationBar, true);
        assert.equal(both.balanceBar, true);
        assert.ok(both.labels.includes('LR Correlation') && both.labels.includes('LR Balance'));
        item.params.showCorrelation = false;
        const balanceOnly = draw();
        assert.equal(balanceOnly.correlationBar, false);
        assert.equal(balanceOnly.balanceBar, true);
        assert.ok(!balanceOnly.labels.includes('LR Correlation') && balanceOnly.labels.includes('LR Balance'));
        assert.ok(!balanceOnly.labels.includes('0.5') && balanceOnly.labels.includes('6dB'));
        item.params.showCorrelation = true;
        item.params.showBalance = false;
        const correlationOnly = draw();
        assert.equal(correlationOnly.correlationBar, true);
        assert.equal(correlationOnly.balanceBar, false);
        assert.ok(correlationOnly.labels.includes('LR Correlation') && !correlationOnly.labels.includes('LR Balance'));
        assert.ok(correlationOnly.labels.includes('0.5') && !correlationOnly.labels.includes('6dB'));
        item.params.showCorrelation = false;
        const neither = draw();
        assert.equal(neither.correlationBar, false);
        assert.equal(neither.balanceBar, false);
        assert.equal(neither.waveform, true);
        assert.equal(neither.peak, true);
        display.dispose();
    });
});

test('Notes retain received history across canvas size, pixel ratio and palette changes without copying the keyboard into it', async () => {
    const env = runtime();
    await withGlobals(env, () => {
        const stage = canvas(), renderer = new VisualizerRenderer(stage), item = createItem('notes', 'notes');
        item.params.vl = false;
        item.params.kb = item.params.showAxisNumbers = true;
        const layout = createDefaultLayout(); layout.items = [item];
        renderer.draw(layout, env.sources, {}, 1, { pixelRatio: 2 });
        env.subscribers.get('notes')(noteFrame(), {});
        const state = renderer.layers.get('notes'), plugin = state.display.plugin;
        assert.equal(plugin.lastFrameIndex, 1);
        const history = plugin.history, recorded = history.slice(), column = plugin.writeColumn;
        assert.ok(recorded.some(value => value > 0));
        stage.width = 1000; stage.height = 600;
        item.palette.stops[0].color = '#ff0000';
        renderer.draw(layout, env.sources, {}, 1, { pixelRatio: 1 });
        assert.equal(renderer.layers.get('notes'), state);
        assert.equal(plugin.history, history);
        assert.deepEqual(history, recorded);
        assert.equal(plugin.writeColumn, column);
        assert.equal(plugin.graphDpr, 1);
        assert.notEqual(plugin.tempCanvas, state.canvas);
        assert.notEqual(plugin.scaledHistoryCanvas, state.canvas);
        assert.ok(state.canvas.context.calls.some(call => call[0] === 'fillText'));
        for (const historyCanvas of [plugin.tempCanvas, plugin.scaledHistoryCanvas]) {
            assert.equal(historyCanvas.context.calls.some(call => call[0] === 'fillText'), false);
            assert.equal(historyCanvas.context.calls.some(call => call[0] === 'drawImage' && call[1] === state.canvas), false);
        }
        env.subscribers.get('notes')(noteFrame(2), {});
        assert.equal(plugin.lastFrameIndex, 2);
        layout.items = [];
        renderer.draw(layout, env.sources, {}, 1);
        assert.equal(env.subscribers.size, 0);
    });
});

test('Notes use the keyboard space for history and hide its meters until the keyboard is shown again', async () => {
    const env = runtime();
    await withGlobals(env, () => {
        for (const ly of ['Horizontal', 'Vertical']) {
            const item = createItem('notes', 'notes'), target = canvas();
            assert.equal(item.params.kb, false);
            assert.equal(item.params.showAxes, false);
            assert.equal(item.params.showAxisNumbers, false);
            item.params.ly = ly;
            const display = createAnalyzerDisplay(item, target, env.sources);
            env.subscribers.get('notes')(noteFrame(), {});
            const plugin = display.plugin, history = plugin.history, column = plugin.writeColumn;
            plugin.meterCurrent.fill(-24);
            const draw = themeColors => {
                target.context.calls.length = 0;
                display.draw(item, 1, 800, themeColors);
                return target.context.calls.slice();
            };
            const hidden = draw();
            assert.equal(hidden.some(call => call[0] === 'fillRect'), false);
            assert.equal(hidden.some(call => call[0] === 'fillText'), false);
            assert.equal(hidden.some(call => call[0] === 'arc'), false);
            const extent = calls => Math.max(...calls.filter(call => call[0] === 'drawImage').map(call => call[6] + call[8]));
            const fullExtent = ly === 'Horizontal' ? target.height : target.width;
            assert.equal(extent(hidden), fullExtent);
            item.params.kb = true;
            const shown = draw();
            assert.ok(shown.some(call => call[0] === 'fillRect'));
            assert.ok(shown.some(call => call[0] === 'arc'), 'Showing the keyboard restores its meters');
            assert.ok(shown.some(call => call[0] === 'fillText' && /^C\d+$/.test(call[1])),
                'Keyboard note names remain visible when axis numbers are off');
            const keyboardDepth = 44.8 * (ly === 'Horizontal'
                ? target.width / 1024 : target.height / 480);
            assert.ok(Math.abs(extent(shown) - (fullExtent - keyboardDepth)) < 1e-8,
                `${ly}: ${extent(shown)} vs ${fullExtent - keyboardDepth}`);
            assert.equal(target.context.fillStyle, '#111');
            item.params.kb = false;
            item.params.showAxisNumbers = true;
            const labels = draw();
            assert.equal(labels.some(call => call[0] === 'fillRect'), false);
            assert.ok(labels.some(call => call[0] === 'fillText'), 'Pitch labels are independent');
            assert.equal(target.context.fillStyle, 'rgb(102,102,102)');
            draw({ 'graph-label': '#eeeeee' });
            assert.equal(target.context.fillStyle, 'rgb(238,238,238)');
            item.params.showAxisNumbers = false;
            assert.equal(draw().some(call => call[0] === 'fillText'), false);
            item.params.showAxisNumbers = true;
            assert.equal(extent(labels), fullExtent);
            if (ly === 'Vertical') {
                assert.equal(target.context.textAlign, 'right');
                assert.ok(labels.filter(call => call[0] === 'fillText').every(call => call[2] === target.width - 2));
            }
            item.params.showAxisNumbers = false;
            delete item.params.kb;
            const nativeDefault = draw();
            assert.ok(nativeDefault.some(call => call[0] === 'fillRect'), 'An unspecified native option keeps the keyboard');
            assert.ok(nativeDefault.some(call => call[0] === 'fillText' && /^C\d+$/.test(call[1])));
            assert.equal(target.context.fillStyle, '#111');
            assert.equal(plugin.history, history);
            assert.equal(plugin.writeColumn, column);
            display.dispose();
        }
    });
});

test('Axis lines and labels can be hidden independently while the spectrum trace remains', async () => {
    const env = runtime();
    await withGlobals(env, () => {
        const item = createItem('spectrum', 'spectrum'), target = canvas();
        item.params.showAxes = item.params.showAxisNumbers = true;
        const display = createAnalyzerDisplay(item, target, env.sources);
        const count = () => {
            target.context.calls.length = 0;
            display.draw(item, 1, 800);
            return { strokes: target.context.calls.filter(call => call[0] === 'stroke').length,
                labels: target.context.calls.filter(call => call[0] === 'fillText').map(call => call[1]) };
        };
        const all = count();
        item.params.showAxes = false;
        const labels = count();
        assert.deepEqual(labels.labels, all.labels);
        assert.ok(labels.strokes > 0 && labels.strokes < all.strokes);
        item.params.showAxisNumbers = false;
        assert.equal(count().labels.length, 0);
        item.params.showAxes = true;
        const axes = count();
        assert.equal(axes.labels.length, 0);
        assert.equal(axes.strokes, all.strokes);
        item.params.kb = true;
        assert.ok(count().labels.some(label => /^C\d+$/.test(label)),
            'Keyboard C labels remain when axis numbers are off');
        item.params.kb = false;
        assert.equal(count().labels.length, 0);
        item.params.showAxisNumbers = true;
        assert.ok(count().labels.length > 0, 'Graph axis labels remain independently available');
    });
});

test('Spectrogram keyboard octave labels remain when graph labels hide and octave colors repeat by pitch', async () => {
    const env = runtime();
    await withGlobals(env, () => {
        const item = createItem('spectrogram', 'spectrogram'), target = canvas();
        item.params.kb = true;
        item.params.showAxisNumbers = true;
        const display = createAnalyzerDisplay(item, target, env.sources);
        target.context.calls.length = 0;
        display.draw(item, 1, 800);
        assert.ok(target.context.calls.some(call => call[0] === 'strokeText'));
        item.params.showAxisNumbers = false;
        target.context.calls.length = 0;
        display.draw(item, 1, 800);
        assert.ok(target.context.calls.some(call => call[0] === 'strokeText'));
        item.params.kb = false;
        target.context.calls.length = 0;
        display.draw(item, 1, 800);
        assert.equal(target.context.calls.some(call => call[0] === 'fillText' || call[0] === 'strokeText'), false);
        item.params.showAxisNumbers = true;
        target.context.calls.length = 0;
        display.draw(item, 1, 800);
        assert.ok(target.context.calls.some(call => call[0] === 'fillText'), 'Graph labels remain independently available');

        const notes = createItem('notes', 'notes');
        notes.palette.mode = 'gradient';
        notes.palette.stops = [{ pos: 0, color: '#ff0000' }, { pos: 1, color: '#0000ff' }];
        notes.palette.mapping = 'octave';
        const noteDisplay = createAnalyzerDisplay(notes, canvas(), env.sources);
        const color = midi => noteDisplay.plugin.displayOptions.noteColor(midi);
        assert.deepEqual(color(60), color(72));
        assert.notDeepEqual(color(60), color(66));
        notes.palette.mapping = 'range';
        noteDisplay.draw(notes, 1, 800);
        assert.notDeepEqual(color(60), color(72));

    });
});

test('Layout theme colors and reset remain independent of the app theme and preserve soft grid alpha', async () => {
    const env = runtime();
    await withGlobals(env, () => {
        const theme = env.window.ThemePalette;
        const originalGet = theme.get;
        for (const type of ['spectrum', 'spectrogram', 'stereo', 'notes']) {
            const item = createItem(type, type), target = canvas();
            item.params.showAxes = item.params.showAxisNumbers = true;
            if (type !== 'stereo') item.params.kb = true;
            const display = createAnalyzerDisplay(item, target, env.sources);
            if (type === 'stereo') {
                display.plugin.currentMeasurements = { xBuffer: new Float32Array(128), yBuffer: new Float32Array(128),
                    currentPosition: 0, peakBuffer: new Float32Array(360) };
            }
            target.context.calls.length = 0;
            display.draw(item, 1, 800, {
                'graph-label': '#123456', 'graph-bg-deep': '#ffffff', 'text-primary': '#ab12cd'
            });
            assert.ok(target.context.calls.some(call => call[0] === 'strokeStyle' || call[0] === 'fillStyle'
                ? call[1] === 'rgb(18,52,86)' : false), `${type} uses the layout label color`);
            if (type === 'stereo') assert.ok(target.context.calls.some(call =>
                call[0] === 'strokeStyle' && call[1] === 'rgb(171,18,205)'),
            'Stereo peak contour uses the layout theme color');
            assert.equal(display.plugin.displayOptions.themePalette.get('graph-trace'), 'rgb(0,255,0)');
            assert.equal(display.plugin.displayOptions.themePalette.get('graph-grid-soft'), 'rgba(246,248,251,0.2)');
            assert.equal(theme.get, originalGet, 'The global theme is never replaced');
            assert.equal(env.subscribers.size, 1, 'Color changes preserve the existing source subscription');
            target.context.calls.length = 0;
            display.draw(item, 1, 800);
            assert.equal(target.context.calls.some(call => call[1] === 'rgb(18,52,86)'), false);
            theme.get = role => role === 'graph-label' ? 'rgba(40,50,60,1)' : originalGet(role);
            display.draw(item, 1, 800);
            assert.equal(target.context.calls.some(call => call[1] === 'rgba(40,50,60,1)'), false);
            assert.equal(display.plugin.displayOptions.themePalette.get('graph-label'), 'rgb(102,102,102)');
            display.draw(item, 1, 800, { 'graph-grid-soft': '#12345633' });
            assert.equal(display.plugin.displayOptions.themePalette.get('graph-grid-soft'), 'rgba(18,52,86,0.2)');
            theme.get = originalGet;
            display.dispose();
        }
    });
});

test('Fixed Note Colors follow pitch without palette motion while Spectrogram keeps signal intensity', async () => {
    const env = runtime();
    await withGlobals(env, () => {
        const Note = env.window.NoteSpectrogramPlugin;
        assert.deepEqual(Array.from(Note.noteColor(60)), Array.from(Note.noteColors[0]));
        assert.deepEqual(Array.from(Note.noteColor(60.5)), Array.from(Note.noteColors[0], (value, index) =>
            (value + Note.noteColors[1][index]) / 2));
        const makeItem = type => {
            const item = createItem(type, type);
            item.palette.mode = 'note-colors';
            item.palette.motion.mode = 'hue';
            item.palette.motion.speed = 1;
            return item;
        };
        const spectrum = makeItem('spectrum');
        const spectrumDisplay = createAnalyzerDisplay(spectrum, canvas(), env.sources);
        const gradientContext = { createLinearGradient: () => ({ stops: [], addColorStop(position, color) {
            this.stops.push([position, color]);
        } }) };
        spectrumDisplay.draw(spectrum, 1, 800);
        const traceStyle = spectrumDisplay.plugin.displayOptions.traceStyle;
        const originalGradient = traceStyle(gradientContext, 800);
        const frequency = midi => 440 * 2 ** ((midi - 69) / 12);
        const stopAt = (gradient, position) => gradient.stops.find(([x]) => Math.abs(x - position) < 1e-9);
        const midiPosition = midi => spectrumDisplay.plugin.frequencyToX(frequency(midi), 800) / 800;
        const logA = midiPosition(33);
        assert.equal(originalGradient.stops[0][0], 0);
        assert.equal(originalGradient.stops.at(-1)[0], 1);
        for (const midi of [33, 45, 57])
            assert.equal(stopAt(originalGradient, midiPosition(midi))?.[1], `rgb(${Note.noteColors[9].join(',')})`);
        assert.equal(stopAt(originalGradient, midiPosition(60))?.[1], `rgb(${Note.noteColors[0].join(',')})`);
        assert.equal(traceStyle(gradientContext, 800), originalGradient);
        spectrumDisplay.draw(spectrum, 2, 800);
        assert.equal(spectrumDisplay.plugin.displayOptions.traceStyle, traceStyle);
        assert.deepEqual(traceStyle(gradientContext, 800).stops, originalGradient.stops);
        assert.equal(spectrumDisplay.phase, 0, 'Hue motion does not animate fixed note colors');
        spectrum.params.sc = 'linear';
        spectrumDisplay.draw(spectrum, 2, 800);
        const linearGradient = spectrumDisplay.plugin.displayOptions.traceStyle(gradientContext, 800);
        assert.notEqual(linearGradient, originalGradient);
        assert.ok(midiPosition(33) < logA && midiPosition(33) < .01);
        for (const midi of [33, 45, 57])
            assert.equal(stopAt(linearGradient, midiPosition(midi))?.[1], `rgb(${Note.noteColors[9].join(',')})`);
        assert.equal(stopAt(linearGradient, midiPosition(60))?.[1], `rgb(${Note.noteColors[0].join(',')})`);
        spectrumDisplay.dispose();

        const spectrogram = makeItem('spectrogram');
        const spectrogramDisplay = createAnalyzerDisplay(spectrogram, canvas(), env.sources);
        const plugin = spectrogramDisplay.plugin;
        const lut = plugin.displayOptions.frequencyColorLut;
        assert.equal(lut.length, 256 * 3);
        for (const row of [0, 64, 128, 192, 255]) {
            const midi = 69 + 12 * Math.log2(plugin.displayRowToFrequency(row) / 440);
            assert.deepEqual(Array.from(lut.slice(row * 3, row * 3 + 3)),
                Array.from(Note.noteColor(midi), Math.round));
        }
        plugin.paintDspSpectrogramColumn(0, new Uint8Array(256).fill(128));
        for (const row of [64, 192]) {
            const offset = row * 1024 * 4;
            assert.deepEqual(Array.from(plugin.imageDataCache.data.slice(offset, offset + 3)),
                Array.from(lut.slice(row * 3, row * 3 + 3)));
            assert.equal(plugin.imageDataCache.data[offset + 3], 128);
        }
        spectrogramDisplay.draw(spectrogram, 2, 800);
        assert.equal(plugin.displayOptions.frequencyColorLut, lut);
        plugin.dspSpectrogramActive = true;
        plugin.spectrogramIntensityBuffer.fill(128);
        spectrogram.palette.mode = 'gradient';
        spectrogram.palette.stops = [{ pos: 0, color: '#0000ff' }, { pos: 1, color: '#ff0000' }];
        spectrogram.palette.motion.mode = 'none';
        spectrogramDisplay.draw(spectrogram, 2, 800);
        const gradientLut = plugin.displayOptions.frequencyColorLut;
        assert.deepEqual(Array.from(gradientLut.slice(0, 3)), [255, 0, 0]);
        assert.deepEqual(Array.from(gradientLut.slice(255 * 3, 255 * 3 + 3)), [0, 0, 255]);
        const historyOffset = (128 * 1024 + 100) * 4;
        assert.deepEqual(Array.from(plugin.imageDataCache.data.slice(historyOffset, historyOffset + 3)),
            Array.from(gradientLut.slice(128 * 3, 128 * 3 + 3)));
        assert.equal(plugin.imageDataCache.data[historyOffset + 3], 128);
        plugin.paintDspSpectrogramColumn(0, new Uint8Array(256).fill(64));
        plugin.paintDspSpectrogramColumn(1, new Uint8Array(256).fill(224));
        for (const row of [64, 192]) {
            const first = (row * 1024) * 4, second = first + 4;
            assert.deepEqual(Array.from(plugin.imageDataCache.data.slice(first, first + 3)),
                Array.from(plugin.imageDataCache.data.slice(second, second + 3)));
            assert.equal(plugin.imageDataCache.data[first + 3], 64);
            assert.equal(plugin.imageDataCache.data[second + 3], 224);
        }
        spectrogram.palette.motion.mode = 'hue';
        spectrogramDisplay.draw(spectrogram, 3, 800);
        assert.notDeepEqual(Array.from(plugin.displayOptions.frequencyColorLut), Array.from(gradientLut));
        assert.deepEqual(Array.from(plugin.imageDataCache.data.slice(historyOffset, historyOffset + 3)),
            Array.from(plugin.displayOptions.frequencyColorLut.slice(128 * 3, 128 * 3 + 3)));
        assert.equal(plugin.imageDataCache.data[historyOffset + 3], 128);
        spectrogram.palette.mode = 'note-colors';
        spectrogramDisplay.draw(spectrogram, 4, 800);
        assert.deepEqual(Array.from(plugin.displayOptions.frequencyColorLut), Array.from(lut));
        spectrogramDisplay.dispose();

        const notes = makeItem('notes');
        const notesDisplay = createAnalyzerDisplay(notes, canvas(), env.sources);
        assert.deepEqual(Array.from(notesDisplay.plugin.displayOptions.noteColor(60)), Array.from(Note.noteColors[0]));
        notesDisplay.draw(notes, 2, 800);
        assert.equal(notesDisplay.phase, 0);
        notesDisplay.dispose();
    });
});

test('Spectrum Note Colors use each bar center for both the bar and peak', async () => {
    const env = runtime();
    await withGlobals(env, () => {
        const item = createItem('spectrum', 'note-bars');
        item.palette.mode = 'note-colors';
        item.params.dm = 'bar';
        const target = canvas();
        const fills = [];
        target.context.fillRect = (...rect) => fills.push({ rect, color: target.context.fillStyle });
        const display = createAnalyzerDisplay(item, target, env.sources);
        const plugin = display.plugin;
        assert.equal(plugin.displayOptions.quantizeBars, true);
        const spectrum = new Float32Array(48).fill(-Infinity);
        const peaks = new Float32Array(48).fill(-Infinity);
        for (const band of [10, 11]) { spectrum[band] = -30; peaks[band] = -20; }
        const bands = { spectrum, peaks, firstFilled: 10, lastFilled: 11 };
        for (const scale of ['linear', 'log', 'log-hq']) {
            item.params.sc = scale;
            display.draw(item, 1, 800);
            fills.length = 0;
            plugin.drawSpectrumBars(target.context, bands, 800, 400, 1);
            const expected = [10, 11].map(band => {
                const frequency = plugin.displayXToFrequency((band + .5) / 48);
                const midi = 69 + 12 * Math.log2(frequency / 440);
                return `rgb(${env.window.NoteSpectrogramPlugin.noteColor(midi).map(Math.round).join(',')})`;
            });
            assert.deepEqual(fills.map(fill => fill.color), [...expected, ...expected], scale);
        }
        item.palette.mode = 'gradient';
        item.params.quantizeBars = false;
        display.draw(item, 1, 800);
        assert.equal(plugin.displayOptions.barColor, null);
        assert.equal(plugin.displayOptions.quantizeBars, false);
        display.dispose();
    });
});

test('Solid fixes the signal color while Heatmap moves native Spectrogram brightness into alpha', async () => {
    const env = runtime();
    await withGlobals(env, () => {
        const solid = createItem('spectrum', 'solid');
        solid.palette.color = '#123456';
        const spectrum = createAnalyzerDisplay(solid, canvas(), env.sources);
        assert.equal(spectrum.plugin.displayOptions.traceStyle(), '#123456');
        const gradients = [];
        const gradientContext = { createLinearGradient(...coordinates) {
            gradients.push(coordinates);
            return { addColorStop() {} };
        } };
        solid.palette.mode = 'heatmap';
        solid.params.kb = true;
        spectrum.draw(solid, 1, 800);
        spectrum.plugin.displayOptions.traceStyle(gradientContext, 800, 300);
        assert.deepEqual(gradients[0], [0, 300, 0, 0]);
        spectrum.dispose();

        const stereoItem = createItem('stereo', 'stereo-solid');
        stereoItem.palette.color = '#123456';
        const stereo = createAnalyzerDisplay(stereoItem, canvas(), env.sources);
        assert.equal(stereo.plugin.displayOptions.sampleStyle(gradientContext, 0, 0, 128),
            `rgba(18,52,86,${128 / 255})`);
        stereo.dispose();

        const item = createItem('spectrogram', 'heatmap'), target = canvas();
        const display = createAnalyzerDisplay(item, target, env.sources);
        const plugin = display.plugin;
        item.palette.color = '#123456';
        display.draw(item, 1, 800);
        assert.deepEqual(Array.from(plugin.displayOptions.frequencyColorLut.slice(0, 6)),
            [18, 52, 86, 18, 52, 86]);
        plugin.paintDspSpectrogramColumn(0, new Uint8Array(256).fill(128));
        assert.deepEqual(Array.from(plugin.imageDataCache.data.slice(0, 4)), [18, 52, 86, 128]);

        item.palette.mode = 'heatmap';
        item.palette.motion = { mode: 'hue', speed: 1 };
        plugin.dspSpectrogramActive = true;
        plugin.spectrogramIntensityBuffer.fill(128);
        display.draw(item, 2, 800);
        const { rgb, rgba } = env.window.SpectrogramPlugin.getHeatmapLuts();
        assert.equal(display.phase, 0);
        assert.equal(plugin.displayOptions.frequencyColorLut, null);
        assert.deepEqual(Array.from(plugin.imageDataCache.data.slice(0, 4)), Array.from(rgba.slice(128 * 4, 128 * 4 + 4)));
        for (const intensity of [0, 32, 128, 224, 255]) {
            const source = intensity * 3, output = intensity * 4, alpha = rgba[output + 3] / 255;
            for (let channel = 0; channel < 3; channel++)
                assert.ok(Math.abs(Math.round(rgba[output + channel] * alpha) - rgb[source + channel]) <= 1);
        }
        assert.equal(rgba[3], 0, 'Native black becomes transparent');
        const native = new env.window.SpectrogramPlugin();
        assert.equal(native.displayOptions?.heatmapColorLut, undefined);
        native.setColor('Heatmap');
        assert.equal(native.createSpectrogramColorLut(), rgb, 'Native Heatmap retains its original opaque RGB palette');

        const levels = new Uint8Array(256).fill(64);
        plugin.paintDspSpectrogramColumn(0, levels);
        levels.fill(224);
        plugin.paintDspSpectrogramColumn(1, levels);
        assert.deepEqual(Array.from(plugin.imageDataCache.data.slice(0, 4)), Array.from(rgba.slice(64 * 4, 64 * 4 + 4)));
        assert.deepEqual(Array.from(plugin.imageDataCache.data.slice(4, 8)), Array.from(rgba.slice(224 * 4, 224 * 4 + 4)));
        plugin.spectrogramBuffer.fill(-48);
        plugin.paintLegacySpectrogramImage();
        assert.deepEqual(Array.from(plugin.imageDataCache.data.slice(0, 4)), Array.from(rgba.slice(128 * 4, 128 * 4 + 4)));
        display.dispose();
    });
});

test('Notes Heatmap uses confidence for history and volume bars without a second intensity fade', async () => {
    const env = runtime();
    await withGlobals(env, () => {
        const item = createItem('notes', 'notes'); item.palette.mode = 'heatmap';
        const display = createAnalyzerDisplay(item, canvas(), env.sources);
        const plugin = display.plugin;
        const confidence = .5, index = Math.round(confidence * 255) * 4;
        const rgba = env.window.SpectrogramPlugin.getHeatmapLuts().rgba;
        plugin.history[197] = confidence;
        plugin.paintHistoryImage();
        const row = 88 - 1 - (60 - 21);
        const pixel = (row * 1024) * 4;
        assert.deepEqual(Array.from(plugin.imageData.data.slice(pixel, pixel + 4)),
            Array.from(rgba.slice(index, index + 4)));
        const gradients = [];
        const context = { createLinearGradient: () => {
            const gradient = { stops: [], addColorStop(position, color) { this.stops.push([position, color]); } };
            gradients.push(gradient); return gradient;
        }, fillRect() {} };
        plugin._paintVolumeBar(context, 0, 0, { midi: 60, best: 197, confidence }, 8, plugin._displayPalette());
        assert.ok(gradients[0].stops.some(([, color]) => color.endsWith(`, ${rgba[index + 3] / 255})`)));
        plugin.mn = plugin.mx = 60;
        plugin.vl = true;
        plugin._normalizedLevel = () => confidence;
        const glow = { createRadialGradient: context.createLinearGradient,
            beginPath() {}, moveTo() {}, arc() {}, closePath() {}, fill() {} };
        plugin._drawVolumeMeters(glow, 100, 8, plugin._displayPalette());
        assert.ok(gradients[1].stops.some(([, color]) => color.endsWith(`, ${rgba[index + 3] / 255 * .5})`)));
        assert.equal(display.phase, 0);
        display.dispose();
    });
});

test('Visualizer keyboards keep their key depth in proportion as graph items resize', async () => {
    const env = runtime();
    await withGlobals(env, () => {
        for (const [type, layouts] of [
            ['spectrum', [null]], ['spectrogram', [null]],
            ['notes', ['Horizontal', 'Vertical']]
        ]) for (const ly of layouts) {
            const ratios = [];
            for (const [scale, pixelRatio] of [[.5, 1], [1, 1], [2, 1], [1, 2]]) {
                const item = createItem(type, type);
                item.params.kb = true;
                if (ly) item.params.ly = ly;
                const target = canvas();
                target.width = 1024 * scale;
                target.height = 480 * scale;
                const display = createAnalyzerDisplay(item, target, env.sources);
                target.context.calls.length = 0;
                display.draw(item, 1, target.width / pixelRatio);
                const calls = target.context.calls;
                const depth = type === 'spectrum'
                    ? calls.find(call => call[0] === 'rect' && call[1] === 0 &&
                        call[2] > 0 && call[3] === target.width)?.[4]
                    : type === 'spectrogram'
                        ? calls.find(call => call[0] === 'rect' && call[1] > 0 &&
                            call[2] === 0 && call[4] === target.height)?.[3]
                        : Math.max(...calls.filter(call => call[0] === 'fillRect').map(call => call[3]));
                assert.ok(depth > 0, `${type} ${ly ?? ''}: keyboard visible at ${scale}x`);
                const blackDepth = type === 'spectrum' ? 4 : 3;
                assert.ok(calls.some(call => call[0] === 'fillRect' &&
                    Math.abs(call[blackDepth] - depth / 1.6) < 1e-8),
                `${type} ${ly ?? ''}: black keys retain their depth relative to white keys`);
                const pitchLength = type === 'spectrum' ? target.width
                    : type === 'spectrogram' || ly === 'Vertical' ? target.height : target.width;
                ratios.push(depth / pitchLength);
                item.params.kb = false;
                target.context.calls.length = 0;
                display.draw(item, 1, target.width / pixelRatio);
                const hidden = target.context.calls;
                assert.equal(type === 'spectrum'
                    ? hidden.some(call => call[0] === 'rect' && call[1] === 0 && call[2] > 0 && call[3] === target.width)
                    : type === 'spectrogram'
                        ? hidden.some(call => call[0] === 'rect' && call[1] > 0 && call[2] === 0 && call[4] === target.height)
                        : hidden.some(call => call[0] === 'fillRect'), false,
                `${type} ${ly ?? ''}: hidden keyboard has no gutter`);
                display.dispose();
            }
            for (const ratio of ratios.slice(1)) {
                assert.ok(Math.abs(ratio - ratios[0]) < 1e-10,
                    `${type} ${ly ?? ''}: keyboard key aspect remains stable`);
            }
        }
    });
});
