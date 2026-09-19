import assert from 'node:assert/strict';
import test from 'node:test';
import { matchUrlRule, validateRules } from '../../extension/url-rules.js';

test('URL rules use ordered, anchored host/path matching and ignore queries', () => {
    const presets = { specific: {}, general: {} };
    const rules = [
        { pattern: '*.example.com/music/*', preset: 'specific', enabled: true },
        { pattern: '*.example.com/*', preset: 'general', enabled: true }
    ];
    assert.equal(matchUrlRule('https://WWW.EXAMPLE.COM/music/album?mode=x', rules, presets), 'specific');
    assert.equal(matchUrlRule('http://www.example.com/other', rules, presets), 'general');
    assert.equal(matchUrlRule('https://www.example.com/Music/album', rules, presets), 'general');
    assert.equal(matchUrlRule('https://www.example.com.evil.test/music/a', rules, presets), null);
    assert.equal(matchUrlRule('chrome://extensions', rules, presets), null);
    assert.equal(matchUrlRule('invalid', rules, presets), null);
    assert.equal(matchUrlRule('https://www.example.com/music/a', [{ ...rules[0], enabled: false }], presets), null);
    assert.equal(matchUrlRule('https://www.example.com/music/a', rules, {}), null);
    assert.equal(matchUrlRule('https://example.com/a', [{ pattern: 'example.com', preset: 'general', enabled: true }], presets), 'general');
});

test('URL rule validation accepts the editor schema and rejects URL schemes', () => {
    const rules = [{ pattern: 'example.com/*', preset: 'Music', enabled: true }];
    assert.deepEqual(validateRules(rules), rules);
    assert.throws(() => validateRules([{ ...rules[0], pattern: 'https://example.com/*' }]));
    assert.throws(() => validateRules([{ ...rules[0], pattern: '' }]));
});
