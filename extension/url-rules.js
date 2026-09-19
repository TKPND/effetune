export function matchUrlRule(url, rules, presets) {
    let parsed;
    try { parsed = new URL(url); } catch { return null; }
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    for (const rule of rules) {
        if (!rule.enabled || !Object.hasOwn(presets, rule.preset)) continue;
        const slash = rule.pattern.indexOf('/');
        const host = slash < 0 ? rule.pattern : rule.pattern.slice(0, slash);
        const path = slash < 0 ? '/*' : rule.pattern.slice(slash);
        const expression = value => '^' + value.split('*').map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$';
        if (new RegExp(expression(host), 'i').test(parsed.host) && new RegExp(expression(path)).test(parsed.pathname)) return rule.preset;
    }
    return null;
}

export function validateRules(rules) {
    if (!Array.isArray(rules) || rules.some(rule => !rule || typeof rule.pattern !== 'string' ||
        !rule.pattern.trim() || rule.pattern.includes('://') || /[?#\s]/.test(rule.pattern) ||
        typeof rule.preset !== 'string' || typeof rule.enabled !== 'boolean')) {
        throw new Error('Use a website and path, such as example.com/*, for each URL rule.');
    }
    return rules.map(({ pattern, preset, enabled }) => ({ pattern: pattern.trim(), preset, enabled }));
}
