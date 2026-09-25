import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { chromium } from 'playwright';

const source = readFileSync(new URL('../../js/visualizer/visualizer-effects.js', import.meta.url), 'utf8')
    .replace(/^export /gm, '') + '\nwindow.VisualizerEffects = VisualizerEffects;';

test('maximum modulation Depth follows the full Level range without Amount clipping', async () => {
    const browser = await chromium.launch({ headless: true });
    try {
        const page = await browser.newPage();
        await page.setContent('<!doctype html><canvas width="16" height="16"></canvas>');
        await page.addScriptTag({ content: source });
        const result = await page.evaluate(() => {
            const effects = new window.VisualizerEffects();
            const canvas = document.querySelector('canvas');
            const effect = { type: 'opacity', enabled: true, amount: 1,
                palette: { stops: [{ pos: 0, color: '#ffffff' }], motion: { mode: 'none', speed: 0 } },
                mod: { source: 'level', depth: 1, speed: 1 } };
            const fullDepth = [0, .5, 1].map(level =>
                effects.apply('level', canvas, [effect], 0, { level }, 0, true).opacity);
            effect.amount = .8;
            effect.mod.depth = .5;
            effect.mod.source = 'bass';
            const halfDepth = effects.apply('bass', canvas, [effect], 0, { bass: .2 }, 0, true).opacity;
            effect.mod.source = 'none';
            const unmodulated = effects.apply('none', canvas, [effect], 0, {}, 0, true).opacity;
            return { fullDepth, halfDepth, unmodulated };
        });
        assert.deepEqual(result.fullDepth, [0, .5, 1]);
        assert.equal(result.halfDepth, .5);
        assert.equal(result.unmodulated, .8);
    } finally {
        await browser.close();
    }
});

test('Glow spreads an edge beyond the item while a point does not become a full cross', async () => {
    const browser = await chromium.launch({ headless: true });
    try {
        const page = await browser.newPage();
        await page.setContent('<!doctype html><canvas></canvas>');
        await page.addScriptTag({ content: source });
        const result = await page.evaluate(() => {
            const effects = new window.VisualizerEffects();
            const glow = { type: 'glow', enabled: true, amount: .5,
                palette: { stops: [{ pos: 0, color: '#ffffff' }], motion: { mode: 'none', speed: 0 } },
                mod: { source: 'none', depth: 0, speed: 0 } };
            const input = document.querySelector('canvas');
            input.width = input.height = 128;
            const ctx = input.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(60, 60, 8, 8);
            const point = effects.apply('point', input, [glow], 0, {}, 0, true);
            const pointPixels = point.canvas.getContext('2d').getImageData(0, 0, point.canvas.width, point.canvas.height).data;
            const bounds = data => {
                let left = Infinity, right = -1, top = Infinity, bottom = -1;
                for (let y = 0; y < point.canvas.height; y++) for (let x = 0; x < point.canvas.width; x++) {
                    if (data[(y * point.canvas.width + x) * 4 + 3] < 24) continue;
                    left = Math.min(left, x); right = Math.max(right, x);
                    top = Math.min(top, y); bottom = Math.max(bottom, y);
                }
                return { left, right, top, bottom };
            };
            const pointBounds = bounds(pointPixels);
            const sample = (id, x, y, w, h) => {
                ctx.clearRect(0, 0, 128, 128);
                ctx.fillRect(x, y, w, h);
                const output = effects.apply(id, input, [glow], 0, {}, 0, true);
                const canvas = output.canvas, data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
                let minX = canvas.width, maxX = -1, minY = canvas.height, maxY = -1, edgeMax = 0;
                for (let cy = 0; cy < canvas.height; cy++) for (let cx = 0; cx < canvas.width; cx++) {
                    const alpha = data[(cy * canvas.width + cx) * 4 + 3];
                    if (cx === 0 || cy === 0 || cx === canvas.width - 1 || cy === canvas.height - 1)
                        edgeMax = Math.max(edgeMax, alpha);
                    if (alpha < 24) continue;
                    minX = Math.min(minX, cx); maxX = Math.max(maxX, cx);
                    minY = Math.min(minY, cy); maxY = Math.max(maxY, cy);
                }
                return { minX, maxX, minY, maxY, edgeMax };
            };
            const samples = {
                top: sample('top', 52, 0, 24, 4),
                right: sample('right', 124, 52, 4, 24),
                corner: sample('corner', 0, 0, 4, 4),
                shortLine: sample('short-line', 1, 56, 4, 16)
            };
            ctx.clearRect(0, 0, 128, 128);
            ctx.fillRect(120, 48, 8, 32);
            const edge = effects.apply('edge', input, [glow], 0, {}, 0, true);
            const innerWidth = Math.round(input.width * .65);
            const pad = (edge.canvas.width - innerWidth) / 2;
            const pixels = edge.canvas.getContext('2d').getImageData(0, 0, edge.canvas.width, edge.canvas.height).data;
            let outerAlpha = 0, outermostAlpha = 0;
            for (let y = 0; y < edge.canvas.height; y++) for (let x = Math.ceil(pad + innerWidth); x < edge.canvas.width; x++)
                outerAlpha += pixels[(y * edge.canvas.width + x) * 4 + 3];
            for (let y = 0; y < edge.canvas.height; y++)
                outermostAlpha = Math.max(outermostAlpha, pixels[(y * edge.canvas.width + edge.canvas.width - 1) * 4 + 3]);
            const signal = document.createElement('canvas');
            signal.width = 256; signal.height = 160;
            const signalCtx = signal.getContext('2d');
            const shimmer = [];
            for (let frame = 0; frame < 8; frame++) {
                signalCtx.clearRect(0, 0, signal.width, signal.height);
                signalCtx.fillStyle = '#ffffff';
                signalCtx.fillRect(114 + frame, 36, 1, 90);
                signalCtx.fillRect(112 + frame, 35, 5, 2);
                const output = effects.apply('moving-signal', signal, [{ ...glow, amount: .6 }], frame / 60, {}, 0, true).canvas;
                const data = output.getContext('2d').getImageData(0, 0, output.width, output.height).data;
                let bright = 0;
                for (let index = 3; index < data.length; index += 4) if (data[index] >= 96) bright++;
                shimmer.push(bright);
            }
            const low = effects.apply('low', input, [glow], 0, {}, 1, true);
            const lowInnerWidth = Math.round(input.width * .35);
            const lowPaddingWork = (low.canvas.width - lowInnerWidth) / 2;
            const disabled = effects.apply('edge', input, [{ ...glow, enabled: false },
                { ...glow, type: 'opacity', amount: 1 }], 0, {}, 0, true);
            const noGlow = effects.apply('edge', input, [], 0, {}, 0, true);
            return { pointBounds, pointWidth: point.canvas.width, pointHeight: point.canvas.height, samples,
                edgeWidth: edge.canvas.width, innerWidth, outerAlpha, outermostAlpha,
                shimmer,
                paddingX: edge.paddingX, paddingY: edge.paddingY,
                lowPaddingX: low.paddingX, lowExpectedPaddingX: lowPaddingWork * input.width / lowInnerWidth,
                disabledWidth: disabled.canvas.width, disabledPaddingX: disabled.paddingX,
                noGlowCanvas: noGlow.canvas === input, noGlowPaddingX: noGlow.paddingX || 0 };
        });
        assert.ok(result.pointBounds.right - result.pointBounds.left < result.pointWidth / 2, JSON.stringify(result));
        assert.ok(result.pointBounds.bottom - result.pointBounds.top < result.pointHeight / 2, JSON.stringify(result));
        assert.ok(result.paddingX > 0 && result.paddingY > 0, JSON.stringify(result));
        assert.ok(result.edgeWidth > result.innerWidth && result.outerAlpha > 0, JSON.stringify(result));
        assert.ok(result.outermostAlpha <= 2, JSON.stringify(result));
        assert.ok(Object.values(result.samples).every(sample => sample.edgeMax <= 2), JSON.stringify(result));
        assert.equal(result.lowPaddingX, result.lowExpectedPaddingX);
        assert.equal(result.disabledWidth, result.innerWidth);
        assert.equal(result.disabledPaddingX, 0);
        assert.ok(Math.max(...result.shimmer) > 150, JSON.stringify(result));
        assert.ok(Math.max(...result.shimmer) - Math.min(...result.shimmer) > 100, JSON.stringify(result));
        assert.equal(result.noGlowCanvas, true);
        assert.equal(result.noGlowPaddingX, 0);
    } finally {
        await browser.close();
    }
});

test('Glow remains in both trail histories beyond the original item bounds', async () => {
    const browser = await chromium.launch({ headless: true });
    try {
        const page = await browser.newPage();
        await page.setContent('<!doctype html><canvas></canvas>');
        await page.addScriptTag({ content: source });
        const results = await page.evaluate(() => {
            const effects = new window.VisualizerEffects();
            const input = document.querySelector('canvas');
            input.width = input.height = 128;
            const context = input.getContext('2d');
            const palette = { stops: [{ pos: 0, color: '#ffffff' }], motion: { mode: 'none', speed: 0 } };
            const mod = { source: 'none', depth: 0, speed: 0 };
            const glow = { type: 'glow', enabled: true, amount: .5, palette, mod };
            return ['trail', 'trail-feedback'].map(type => {
                const trail = { type, enabled: true, amount: .7, palette, mod };
                context.clearRect(0, 0, 128, 128);
                context.fillStyle = '#ffffff';
                context.fillRect(118, 118, 8, 8);
                const first = effects.apply(type, input, [glow, trail], 0, {}, 0, true);
                const inner = Math.round(input.width * .65);
                const sample = output => {
                    const canvas = output.canvas;
                    const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
                    let total = 0;
                    for (let y = inner + 5; y < canvas.height; y++)
                        for (let x = inner + 5; x < canvas.width; x++) total += data[(y * canvas.width + x) * 4 + 3];
                    return total;
                };
                const firstAlpha = sample(first);
                context.clearRect(0, 0, 128, 128);
                const secondAlpha = sample(effects.apply(type, input, [glow, trail], 1 / 60, {}, 0, true));
                return { type, firstAlpha, secondAlpha };
            });
        });
        for (const result of results) {
            assert.ok(result.firstAlpha > 0, JSON.stringify(result));
            assert.ok(result.secondAlpha > 0, JSON.stringify(result));
        }
    } finally {
        await browser.close();
    }
});

test('source motion stays inside the item before Glow while animated shake refreshes static input', async () => {
    const browser = await chromium.launch({ headless: true });
    try {
        const page = await browser.newPage();
        await page.setContent('<!doctype html><canvas></canvas>');
        await page.addScriptTag({ content: source });
        const result = await page.evaluate(() => {
            const effects = new window.VisualizerEffects();
            const input = document.querySelector('canvas');
            input.width = input.height = 128;
            const ctx = input.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(24, 56, 4, 16);
            ctx.fillRect(120, 56, 8, 16);
            const palette = { stops: [{ pos: 0, color: '#ffffff' }], motion: { mode: 'none', speed: 0 } };
            const mod = { source: 'none', depth: 0, speed: 0 };
            const pulse = { type: 'scale-pulse', enabled: true, amount: 1, palette, mod };
            const glow = { ...pulse, type: 'glow', amount: .5 };
            const pulseOnly = effects.apply('pulse', input, [pulse], 0, {}, 0, true);
            const pulsePixels = pulseOnly.canvas.getContext('2d').getImageData(0, 0, pulseOnly.canvas.width, pulseOnly.canvas.height).data;
            const width = pulseOnly.canvas.width, height = pulseOnly.canvas.height;
            let inside = 0, rightEdge = 0;
            for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
                const alpha = pulsePixels[(y * width + x) * 4 + 3];
                inside += alpha;
                if (x >= width - 4) rightEdge += alpha;
            }
            ctx.clearRect(0, 0, input.width, input.height);
            ctx.fillRect(108, 56, 8, 16);
            const withGlow = effects.apply('glow-pulse', input, [pulse, glow], 0, {}, 0, true);
            const glowPixels = withGlow.canvas.getContext('2d').getImageData(0, 0, withGlow.canvas.width, withGlow.canvas.height).data;
            const innerRight = Math.round(input.width * .65) + (withGlow.canvas.width - Math.round(input.width * .65)) / 2;
            let outsideGlow = 0;
            for (let y = 0; y < withGlow.canvas.height; y++) for (let x = Math.ceil(innerRight); x < withGlow.canvas.width; x++)
                outsideGlow += glowPixels[(y * withGlow.canvas.width + x) * 4 + 3];
            ctx.clearRect(0, 0, input.width, input.height);
            ctx.fillRect(60, 60, 8, 8);
            const shake = { ...pulse, type: 'shake' };
            const first = effects.apply('shake', input, [shake], 0, {}, 0, true);
            const firstPixels = first.canvas.getContext('2d').getImageData(0, 0, first.canvas.width, first.canvas.height).data;
            const second = effects.apply('shake', input, [shake], 1 / 60, {}, 0, false);
            const secondPixels = second.canvas.getContext('2d').getImageData(0, 0, second.canvas.width, second.canvas.height).data;
            let changedPixels = 0;
            for (let index = 3; index < firstPixels.length; index += 4)
                if (firstPixels[index] !== secondPixels[index]) changedPixels++;
            return { inside, rightEdge, outsideGlow, changedPixels,
                pulseTransform: [pulseOnly.scale, pulseOnly.x, pulseOnly.y],
                shakeTransform: [second.scale, second.x, second.y] };
        });
        assert.ok(result.inside > 0, JSON.stringify(result));
        assert.equal(result.rightEdge, 0, JSON.stringify(result));
        assert.ok(result.outsideGlow > 0, JSON.stringify(result));
        assert.ok(result.changedPixels > 0, JSON.stringify(result));
        assert.deepEqual(result.pulseTransform, [1, 0, 0]);
        assert.deepEqual(result.shakeTransform, [1, 0, 0]);
    } finally {
        await browser.close();
    }
});
