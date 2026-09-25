import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { chromium } from 'playwright';

const source = readFileSync(new URL('../../js/visualizer/visualizer-effects.js', import.meta.url), 'utf8')
    .replace(/^export /gm, '') + '\nwindow.VisualizerEffects = VisualizerEffects;';

test('Trail Feedback zooms, turns, and moves fading traces in the selected directions', async () => {
    const browser = await chromium.launch({ headless: true });
    try {
        const page = await browser.newPage();
        await page.setContent('<!doctype html><canvas></canvas>');
        await page.addScriptTag({ content: source });
        const centers = await page.evaluate(() => {
            const input = document.querySelector('canvas');
            input.width = input.height = 512;
            const ctx = input.getContext('2d');
            const effect = { type: 'trail-feedback', enabled: true, amount: 1,
                palette: { stops: [{ pos: 0, color: '#ffffff' }], motion: { mode: 'none', speed: 0 } },
                mod: { source: 'none', depth: 0, speed: 0 } };
            const traceCenter = (angle, flowX = 0, flowY = 0, flipX = false, zoom = 2) => {
                const effects = new window.VisualizerEffects();
                ctx.clearRect(0, 0, 512, 512);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(380, 252, 8, 8);
                effects.apply('trace', input, [{ ...effect, angle, flowX, flowY, zoom }], 0, {}, 0, true, flipX);
                ctx.clearRect(0, 0, 512, 512);
                const output = effects.apply('trace', input, [{ ...effect, angle, flowX, flowY, zoom }], 1 / 60, {}, 0, true, flipX).canvas;
                const pixels = output.getContext('2d').getImageData(0, 0, output.width, output.height).data;
                let weight = 0, x = 0, y = 0;
                for (let row = 0; row < output.height; row++) for (let col = 0; col < output.width; col++) {
                    const alpha = pixels[(row * output.width + col) * 4 + 3];
                    weight += alpha; x += col * alpha; y += row * alpha;
                }
                return { x: flipX ? output.width - 1 - x / weight : x / weight, y: y / weight };
            };
            return { clockwise: traceCenter(3), counterclockwise: traceCenter(-3), straight: traceCenter(0),
                neutralZoom: traceCenter(0, 0, 0, false, 0), zoomOut: traceCenter(0, 0, 0, false, -2),
                right: traceCenter(0, 1), left: traceCenter(0, -1),
                down: traceCenter(0, 0, 1), up: traceCenter(0, 0, -1), diagonal: traceCenter(0, 1, -1),
                flippedStraight: traceCenter(0, 0, 0, true), flippedRight: traceCenter(0, 1, 0, true),
                flippedClockwise: traceCenter(3, 0, 0, true) };
        });
        assert.ok(centers.clockwise.y > centers.straight.y + 2.5, JSON.stringify(centers));
        assert.ok(centers.counterclockwise.y < centers.straight.y - 2.5, JSON.stringify(centers));
        assert.ok(centers.straight.x > 240, JSON.stringify(centers));
        assert.ok(Math.abs(centers.straight.y - 166) < 2, JSON.stringify(centers));
        assert.ok(centers.straight.x > centers.neutralZoom.x + 1, JSON.stringify(centers));
        assert.ok(centers.neutralZoom.x > centers.zoomOut.x + 1, JSON.stringify(centers));
        assert.ok(centers.right.x > centers.straight.x + 2.5, JSON.stringify(centers));
        assert.ok(centers.left.x < centers.straight.x - 2.5, JSON.stringify(centers));
        assert.ok(centers.down.y > centers.straight.y + 2.5, JSON.stringify(centers));
        assert.ok(centers.up.y < centers.straight.y - 2.5, JSON.stringify(centers));
        assert.ok(centers.diagonal.x > centers.straight.x + 2.5 && centers.diagonal.y < centers.straight.y - 2.5,
            JSON.stringify(centers));
        assert.ok(centers.flippedRight.x > centers.flippedStraight.x + 2.5, JSON.stringify(centers));
        assert.ok(centers.flippedClockwise.y < centers.flippedStraight.y - 2.5, JSON.stringify(centers));
    } finally {
        await browser.close();
    }
});
