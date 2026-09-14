(() => {
    const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
    const noteFrequency = (midi, a4 = 440) => a4 * 2 ** ((midi - 69) / 12);
    const nearestSemitone = (frequency, a4 = 440) =>
        noteFrequency(Math.round(69 + 12 * Math.log2(frequency / a4)), a4);

    function frequencyToPosition(frequency, length, min, max, scale = 'log', orientation = 'x') {
        const fraction = scale === 'linear' ? (frequency - min) / (max - min)
            : Math.log(frequency / min) / Math.log(max / min);
        return (orientation === 'y' ? 1 - fraction : fraction) * length;
    }

    function positionToFrequency(position, length, min, max, scale = 'log', orientation = 'x') {
        const fraction = clamp(position / length, 0, 1);
        const value = orientation === 'y' ? 1 - fraction : fraction;
        return scale === 'linear' ? min + value * (max - min) : min * (max / min) ** value;
    }

    function noteAxisKeys(mn, mx, length) {
        const rowHeight = length / (mx - mn + 1);
        const whiteClasses = [0, 2, 4, 5, 7, 9, 11];
        const keys = [];
        // White keys may extend into the visible range from the adjoining octave.
        for (let midi = Math.floor(mn / 12) * 12; midi <= Math.ceil((mx + 1) / 12) * 12; midi++) {
            const pitchClass = (midi % 12 + 12) % 12;
            const whiteIndex = whiteClasses.indexOf(pitchClass);
            const black = whiteIndex < 0;
            if (black && (midi < mn || midi > mx)) continue;
            const start = clamp((midi - mn) * rowHeight, 0, length);
            const end = clamp((midi - mn + 1) * rowHeight, 0, length);
            const whiteStart = clamp((midi - pitchClass - mn) * rowHeight + whiteIndex * 12 * rowHeight / 7, 0, length);
            const whiteEnd = clamp((midi - pitchClass - mn) * rowHeight + (whiteIndex + 1) * 12 * rowHeight / 7, 0, length);
            if (!black && whiteEnd <= whiteStart) continue;
            keys.push({ midi, black, start, end, whiteStart, whiteEnd });
        }
        return keys;
    }

    function hitKey(keys, along, across, gutter, blackDepth) {
        if (across < 0 || across > gutter) return null;
        if (across <= blackDepth) {
            const black = keys.find(key => key.black && along >= key.start && along <= key.end);
            if (black) return black;
        }
        return keys.find(key => !key.black && along >= key.whiteStart && along <= key.whiteEnd) || null;
    }

    const targets = new Map([
        ['BandPassFilterPlugin', ['band-pass-filter-graph', 10, 40000]],
        ['CombFilterPlugin', ['comb-filter-graph', 1, 40000]],
        ['FifteenBandGEQPlugin', ['fifteen-band-geq-graph-container', 20, 20000]],
        ['HiPassFilterPlugin', ['hi-pass-filter-graph', 10, 40000]],
        ['LoPassFilterPlugin', ['lo-pass-filter-graph', 10, 40000]],
        ['LoudnessEqualizerPlugin', ['loudness-equalizer-graph', 20, 20000]],
        ['NarrowRangePlugin', ['narrow-range-graph', 20, 40000]],
        ['TiltEQPlugin', ['tilt-eq-graph-container', 20, 20000]],
        ['ToneControlPlugin', ['tone-control-graph-container', 20, 20000]],
        ['ChannelDividerPlugin', ['channel-divider-graph', 10, 40000]],
        ['FIRCrossoverPlugin', ['fir-crossover-graph', 10, 40000]],
        ['FiveBandDynamicEQ', ['fbdyn-graph', 10, 40000]],
        ['FiveBandPEQPlugin', ['five-band-peq-graph', 10, 40000, 20]],
        ['FifteenBandPEQPlugin', ['fifteen-band-peq-graph', 10, 40000, 20]],
        ['FiveBandFIRPEQPlugin', ['five-band-fir-peq-graph', 10, 40000, 20]],
        ['RoomEqPlugin', ['room-eq-additional-eq-graph', 10, 40000, 20]],
        ['EarphoneCableSimPlugin', ['earphone-cable-sim-graph', 10, 40000, 20]],
        ['SubSynthPlugin', ['sub-synth-graph', 5, 1000]],
        ['GroupDelayEqPlugin', ['group-delay-eq-graph-container', 20, 20000]],
        ['ExciterPlugin', ['exciter-hpf-graph', 20, 20000]],
        ['DSD64IMDSimulatorPlugin', ['dsd64-imd-df-graph', 0, 20000]],
        ['GroupDelayPEQPlugin', ['group-delay-peq-graph', 10, 40000, 20]],
        ['SpectrumAnalyzerPlugin', ['graph-container', 20, 40000]],
        ['SpectrogramPlugin', ['graph-container', 20, 40000]],
        ['NoteSpectrogramPlugin', ['graph-container', 0, 0]],
        ['PitchMeterPlugin', ['graph-container', 0, 0]],
        ['PhaseSelectEqPlugin', ['graph-container', 20, 40000]]
    ].map(([name, [graph, minFreq, maxFreq, inset = 0]]) => [name, {
        plotSelector: `.${graph}${inset ? '' : ' canvas'}`,
        ...(inset ? { mountSelector: `.${graph}` } : {}),
        minFreq, maxFreq, inset, scale: 'log', orientation: 'x',
        axisCheck: inset ? { ownerOf: plugin => plugin, freqToXName: 'freqToX' }
            : [`Math.log10(${minFreq})`, `Math.log10(${maxFreq})`]
    }]));
    targets.get('RoomEqPlugin').ownerOf = plugin => plugin._additionalEqEditor;
    targets.get('RoomEqPlugin').axisCheck.ownerOf = targets.get('RoomEqPlugin').ownerOf;
    targets.get('RoomEqPlugin').isActive = plugin => !plugin._responseView || plugin._responseView === 'frequency';
    targets.get('FiveBandDynamicEQ').axisCheck = ['const minFreq = 10;', 'const maxFreq = 40000;'];
    targets.get('DSD64IMDSimulatorPlugin').scale = 'linear';
    targets.get('DSD64IMDSimulatorPlugin').axisCheck = ['freq / fMax', 'const fMax = 20000;'];

    for (const name of ['SpectrumAnalyzerPlugin', 'SpectrogramPlugin']) {
        const vertical = name === 'SpectrogramPlugin';
        const target = targets.get(name);
        target.axisCheck = ['getKeyboardGeometry(length)', 'const blackDepth = gutter / 1.6;'];
        target.axis = (plugin, box) => {
            const orientation = vertical ? 'y' : 'x';
            const length = vertical ? box.height : box.width;
            const crossLength = vertical ? box.width : box.height;
            const gutter = plugin.kb && crossLength > (vertical ? 28 : 44.8) ? (vertical ? 28 : 44.8) : 0;
            const scale = plugin.sc === 'linear' ? 'linear' : 'log';
            return {
                orientation, length, crossLength, gutter, blackDepth: gutter / 1.6, a4: 440,
                keys: gutter ? plugin.getKeyboardGeometry(length) : null,
                toPos: frequency => vertical ? plugin.freqToY(frequency) / 255 * length : plugin.frequencyToX(frequency, length),
                toFreq: position => positionToFrequency(position, length, 20, 40000, scale, orientation)
            };
        };
    }
    for (const name of ['NoteSpectrogramPlugin', 'PitchMeterPlugin']) {
        const target = targets.get(name);
        target.axisCheck = ['12 * rowHeight / 7', "this.ly === 'Horizontal'"];
        target.axis = (plugin, box) => {
            const orientation = plugin.ly === 'Horizontal' ? 'x' : 'y';
            const length = orientation === 'x' ? box.width : box.height;
            const crossLength = orientation === 'x' ? box.height : box.width;
            const a4 = name === 'PitchMeterPlugin' ? plugin.rf : 440;
            const rowHeight = length / (plugin.mx - plugin.mn + 1);
            const keys = noteAxisKeys(plugin.mn, plugin.mx, length);
            if (orientation === 'y') {
                for (const key of keys) {
                    [key.start, key.end] = [length - key.end, length - key.start];
                    [key.whiteStart, key.whiteEnd] = [length - key.whiteEnd, length - key.whiteStart];
                }
            }
            return {
                orientation, length, crossLength, a4, keys, rowHeight,
                gutter: name === 'PitchMeterPlugin' ? 45 : 44.8, blackDepth: 28,
                toPos(frequency) {
                    const midi = 69 + 12 * Math.log2(frequency / a4);
                    const position = (midi - plugin.mn + 0.5) * rowHeight;
                    return orientation === 'x' ? position : length - position;
                },
                toFreq(position) {
                    const along = orientation === 'x' ? position : length - position;
                    return noteFrequency(clamp(Math.floor(along / rowHeight) + plugin.mn, plugin.mn, plugin.mx), a4);
                }
            };
        };
    }
    targets.get('PhaseSelectEqPlugin').axisCheck = ['_frequencyToY(frequency)', '_yToFrequency(y)', 'this.sampleRate * 0.49'];
    targets.get('PhaseSelectEqPlugin').axis = (plugin, box) => ({
        orientation: 'y', length: box.height, crossLength: box.width, gutter: 0,
        toPos: frequency => plugin._frequencyToY(frequency),
        toFreq: position => plugin._yToFrequency(position)
    });

    function getAxis(plugin, target, box) {
        if (target.axis) return target.axis(plugin, box);
        const length = box.width;
        const owner = target.ownerOf ? target.ownerOf(plugin) : plugin;
        return {
            orientation: 'x', length, crossLength: box.height, gutter: 0,
            toPos: frequency => target.inset ? owner.freqToX(frequency) * length / 100
                : frequencyToPosition(frequency, length, target.minFreq, target.maxFreq, target.scale),
            toFreq: position => Math.max(0.01, positionToFrequency(position, length, target.minFreq, target.maxFreq, target.scale))
        };
    }

    function pruneDetached(instances) {
        const pipeline = window.pipelineManager?.audioManager?.pipeline || window.audioManager?.pipeline;
        if (!pipeline) return;
        const ids = new Set(pipeline.map(plugin => plugin.id));
        for (const [id, instance] of instances) if (!ids.has(id)) instance.dispose();
    }

    window.FrequencyAxis = { targets, getAxis, pruneDetached, frequencyToPosition,
        positionToFrequency, nearestSemitone, noteFrequency, noteAxisKeys, hitKey };
})();
