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

test('URL rules keep literal and wildcard boundaries in hosts and paths', () => {
    const presets = { music: {} };
    const matches = (url, pattern) => matchUrlRule(url, [{ pattern, preset: 'music', enabled: true }], presets);

    assert.equal(matches('https://Foo.Example.Com/album/live/01.flac', '*foo*.example.com/album/*/0*.flac'), 'music');
    assert.equal(matches('https://foo.example.com/album/live/01.flac', '*foo*.example.com/album/*/02*.flac'), null);
    assert.equal(matches('https://foo.example.com/album/live/01.flac', '*foo*.example.com/Album/*'), null);
    assert.equal(matches('https://foo.example.com/a+b.(c)', 'foo.example.com/a+b.(c)'), 'music');
    assert.equal(matches('https://foo.example.com/a', 'foo.example.com/a*a'), null);
    assert.equal(matches('https://foo.example.com/aa', 'foo.example.com/a*a'), 'music');
});

test('URL rules handle repeated wildcard text without regex backtracking', () => {
    const rule = [{ pattern: 'example.com/*a*a*a*x', preset: 'music', enabled: true }];
    const presets = { music: {} };
    const repeated = 'a'.repeat(1024);
    assert.equal(matchUrlRule(`https://example.com/${repeated}y`, rule, presets), null);
    assert.equal(matchUrlRule(`https://example.com/${repeated}x`, rule, presets), 'music');
});
