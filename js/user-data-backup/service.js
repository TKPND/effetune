import { MAX_BACKUP_BYTES, MAX_ITEMS, prepareItems, selectItems, chooseName, replaceReferences,
    nameIssue, references, clone, canonical } from './portable.js';
import { createArchive, openArchive, checkCancelled, loadZipClass } from './archive.js';

const missingMessage = 'Required data is not available. Choose a backup that includes the data, or import the same original data and try again.';

function catalog(items, unavailable = []) {
    return { items, unavailable, maxBytes: MAX_BACKUP_BYTES };
}

function itemResult(item, extra = {}) {
    return { key: item.key, name: item.name, targetName: item.targetName || item.name, ...extra };
}

function orderedItems(items) {
    const byKey = new Map(items.map(item => [item.key, item]));
    const done = new Set();
    const visiting = new Set();
    const result = [];
    const visit = item => {
        if (done.has(item.key) || visiting.has(item.key)) return;
        visiting.add(item.key);
        for (const dependency of item.dependencies || []) {
            const source = byKey.get(dependency.key);
            if (source) visit(source);
        }
        visiting.delete(item.key);
        done.add(item.key);
        result.push(item);
    };
    items.forEach(visit);
    return result;
}

export class UserDataBackupService {
    constructor({ adapter, appVersion = 'unknown', loadZip = loadZipClass }) {
        this.adapter = adapter;
        this.appVersion = appVersion;
        this.loadZip = loadZip;
        this.running = false;
    }

    async readItems() {
        const snapshot = await this.adapter.readSnapshot();
        if (!Array.isArray(snapshot.items) || snapshot.items.length > MAX_ITEMS) {
            throw new Error('There are too many saved items for one backup.');
        }
        const items = await prepareItems(snapshot.items);
        for (const item of items) {
            const issue = await this.adapter.validateItem?.(item);
            if (issue) { item.available = false; item.reason = issue; }
            if ((item.kind === 'pipeline' || item.kind === 'plugin') && this.adapter.canApplyPreset) {
                const applicable = await this.adapter.canApplyPreset(item);
                item.applicable = applicable === true;
                if (typeof applicable === 'string') item.applyReason = applicable;
            }
        }
        const byKey = new Map(items.map(item => [item.key, item]));
        let changed;
        do {
            changed = false;
            for (const item of items) {
                if (item.available && item.dependencies.some(dependency => dependency.required &&
                    byKey.get(dependency.key)?.available !== true)) {
                    item.available = false;
                    item.reason = missingMessage;
                    changed = true;
                }
            }
        } while (changed);
        return catalog(items, snapshot.unavailable || []);
    }

    listBackup() { return this.readItems(); }

    select(source, keys) { return selectItems(source, keys); }

    async createBackup(source, keys, options = {}) {
        if (this.running) throw new Error('Wait for the current backup or restore to finish.');
        this.running = true;
        try {
            checkCancelled(options.signal);
            const selected = this.select(source, keys);
            if (!selected.size) throw new Error('Select at least one item to back up.');
            const current = await this.readItems();
            const before = new Map(source.items.map(item => [item.key, item]));
            const items = current.items.filter(item => selected.has(item.key));
            if (items.length !== selected.size || items.some(item => !item.available ||
                item.fingerprint !== before.get(item.key)?.fingerprint || item.name !== before.get(item.key)?.name ||
                canonical(item.dependencies) !== canonical(before.get(item.key)?.dependencies))) {
                throw new Error('Saved data changed while the backup was open. Refresh the list and select the items again.');
            }
            const embeddedBytes = items.reduce((total, item) => total +
                ((item.kind === 'ir' && options.embedIr === false) ||
                (item.kind === 'measurement' && options.embedMeasurements === false) ? 0 : item.bytes || 0), 0);
            if (embeddedBytes > MAX_BACKUP_BYTES) throw new Error('This selection exceeds 256 MB. Select fewer items and create separate backups.');
            const byId = new Map(current.items.map(item => [`${item.kind}:${item.id}`, item]));
            for (const item of items) {
                for (const reference of references(item)) {
                    const dependency = byId.get(`${reference.kind}:${reference.id}`);
                    if (!reference.required && dependency && !selected.has(dependency.key)) {
                        reference.target[reference.property] = `unresolved:${dependency.fingerprint}`;
                    }
                }
            }
            const blob = await createArchive(items, { ...options, appVersion: this.appVersion, loadZip: this.loadZip });
            return { blob, fileName: `EffeTune-${new Date().toISOString().slice(0, 10)}.effetune_backup`,
                result: { count: items.length, referenceOnly: items.filter(item =>
                    (item.kind === 'ir' && options.embedIr === false) ||
                    (item.kind === 'measurement' && options.embedMeasurements === false)).length } };
        } finally { this.running = false; }
    }

    async openBackup(file) {
        const archive = await openArchive(file, { loadZip: this.loadZip });
        const source = { ...catalog(archive.items), archive };
        const plan = await this.planRestore(source, []);
        source.items = plan.items;
        return source;
    }

    async planRestore(source, keys) {
        const current = await this.readItems();
        const unavailable = new Set(current.unavailable.map(area => typeof area === 'string' ? area : area.kind));
        const items = source.items.map(item => {
            const value = { ...item, available: true, reason: nameIssue(item), selected: false };
            if (unavailable.has(item.kind)) value.reason = 'This storage is unavailable. Try again after restoring access to it.';
            const chosen = chooseName(item, current.items);
            value.targetName = chosen.name;
            value.target = chosen.existing;
            value.status = chosen.existing ? 'reuse' : chosen.name === item.name ? 'add' : 'rename';
            if (!item.embedded && !chosen.existing) { value.reason = missingMessage; value.status = 'missing'; }
            if (value.reason) { value.available = false; if (value.status !== 'missing') value.status = 'unavailable'; }
            return value;
        });
        for (const item of items) {
            // Binary measurement validation follows hydration, before the first write.
            const issue = item.kind !== 'measurement' || !item.embedded
                ? await this.adapter.validateItem?.(item) : null;
            if (issue) { item.reason = issue; item.available = false; item.status = 'unavailable'; }
            if (item.kind === 'pipeline' || item.kind === 'plugin') {
                const applicable = await this.adapter.canApplyPreset?.(item);
                item.applicable = applicable !== false && typeof applicable !== 'string';
                if (typeof applicable === 'string') item.applyReason = applicable;
            }
        }
        const byKey = new Map(items.map(item => [item.key, item]));
        let changed;
        do {
            changed = false;
            for (const item of items) {
                if (item.available && item.dependencies.some(dependency => dependency.required &&
                    byKey.get(dependency.key)?.available !== true)) {
                    item.available = false;
                    item.status = 'missing';
                    item.reason = missingMessage;
                    changed = true;
                }
            }
        } while (changed);
        const selectedKeys = selectItems({ items }, keys);
        const planned = [...current.items];
        for (const item of orderedItems(items.filter(value => selectedKeys.has(value.key)))) {
            item.selected = true;
            const chosen = chooseName(item, planned);
            item.targetName = chosen.name;
            item.target = chosen.existing;
            item.status = chosen.existing ? 'reuse' : chosen.name === item.name ? 'add' : 'rename';
            if (!chosen.existing) planned.push({ ...item, name: chosen.name,
                id: item.kind === 'measurement' ? crypto.randomUUID() : item.id, plannedKey: item.key });
        }
        return { catalog: source, items, selectedKeys, unavailable: current.unavailable };
    }

    async restore(plan, { signal, onProgress } = {}) {
        if (this.running) throw new Error('Wait for the current backup or restore to finish.');
        this.running = true;
        const result = { added: [], reused: [], renamed: [], failed: [], unprocessed: [], cancelled: false };
        try {
            checkCancelled(signal);
            const source = plan.catalog;
            if (!source.archive) throw new Error('Open a backup file before restoring.');
            const selected = source.items.filter(item => plan.selectedKeys.has(item.key));
            if (!selected.length) throw new Error('Select at least one item to restore.');
            const hydrated = await source.archive.hydrate(selected, signal);
            const hydratedByKey = new Map(hydrated.map(item => [item.key, item]));
            const fingerprintInputs = source.items.map(item => hydratedByKey.get(item.key) ||
                { ...item, embedded: false, data: undefined, available: true });
            const checked = await prepareItems(fingerprintInputs);
            const byId = new Map(source.items.map(item => [`${item.kind}:${item.id}`, item]));
            for (const item of checked.filter(value => plan.selectedKeys.has(value.key))) {
                if (!item.available || item.fingerprint !== source.items.find(value => value.key === item.key).fingerprint) {
                    throw new Error('The backup content does not match its item description. Choose another copy of the file.');
                }
                if (!item.embedded) continue;
                const issue = await this.adapter.validateItem?.(item);
                if (issue) throw new Error(issue);
                const declared = source.items.find(value => value.key === item.key).dependencies;
                for (const reference of references(item)) {
                    const dependency = byId.get(`${reference.kind}:${reference.id}`);
                    if (reference.required && (!dependency || !plan.selectedKeys.has(dependency.key) ||
                        !declared.some(value => value.key === dependency.key && value.required))) {
                        throw new Error('The backup is missing a required item reference.');
                    }
                }
            }
            checkCancelled(signal);
            // Re-plan only after all selected content has passed validation.
            const latest = await this.planRestore(source, plan.selectedKeys);
            if (latest.selectedKeys.size !== plan.selectedKeys.size) throw new Error('Required data or storage is no longer available. Refresh the restore list and try again.');
            const items = orderedItems(latest.items.filter(item => latest.selectedKeys.has(item.key)));
            const targets = new Map();
            // Reserve IDs before writing to support calibration links between measurements.
            for (const item of items) {
                if (item.target && !item.target.plannedKey) targets.set(item.key, { id: item.target.id, name: item.target.name });
                else if (!item.target) targets.set(item.key, { id: item.kind === 'measurement' ? crypto.randomUUID() : item.id,
                    name: item.targetName });
            }
            const completed = new Set();
            let stopped = false;
            for (const [index, item] of items.entries()) {
                if (stopped || signal?.aborted) {
                    result.cancelled ||= !!signal?.aborted;
                    result.unprocessed.push(itemResult(item));
                    continue;
                }
                try {
                    if (item.target) {
                        if (item.target.plannedKey) {
                            const target = targets.get(item.target.plannedKey);
                            if (!target || !completed.has(item.target.plannedKey)) throw new Error('The matching item could not be restored.');
                            targets.set(item.key, target);
                        }
                        result.reused.push(itemResult(item));
                    } else {
                        for (const dependency of item.dependencies) {
                            if (dependency.required && !completed.has(dependency.key)) throw new Error('Required data could not be restored.');
                        }
                        const raw = hydratedByKey.get(item.key);
                        const data = replaceReferences(raw, source.items, targets);
                        if (item.kind === 'measurement') {
                            data.measurement.id = targets.get(item.key).id;
                            data.measurement.name = item.targetName;
                            for (const response of data.impulseResponses) response.measurementId = data.measurement.id;
                        }
                        const saved = await this.adapter.appendItem(raw, { name: item.targetName, data });
                        if (!saved || typeof saved.id !== 'string') throw new Error('The item could not be saved.');
                        targets.set(item.key, saved);
                        const savedResult = itemResult(item, { targetName: saved.name, ...(saved.mirrorWarning ? { mirrorWarning: saved.mirrorWarning } : {}) });
                        result.added.push(savedResult);
                        if (saved.name !== item.name) result.renamed.push(savedResult);
                    }
                    completed.add(item.key);
                    onProgress?.({ completed: index + 1, total: items.length, currentName: item.name });
                } catch (error) {
                    console.error('User data restore failed:', error);
                    result.failed.push(itemResult(item, { reason: 'This item could not be saved. Check available storage and try again.' }));
                    targets.delete(item.key);
                    stopped = true;
                }
            }
            return result;
        } finally { this.running = false; }
    }
}
