export function numberedIrOriginalNames(originals, number) {
    return originals.map(({ fileName }) => {
        const dot = fileName.lastIndexOf('.');
        return dot > 0
            ? `${fileName.slice(0, dot)} (${number})${fileName.slice(dot)}`
            : `${fileName} (${number})`;
    });
}

export function irOriginalNamesForLabel(originals, label) {
    const names = originals.map(original => original.fileName);
    if (names.join(' + ') === label) return names;
    const marker = label.lastIndexOf(' (');
    const end = label.indexOf(')', marker);
    const suffix = marker >= 0 && end > marker ? label.slice(marker + 2, end) : '';
    const number = /^\d+$/.test(suffix) ? Number(suffix) : 0;
    if (Number.isSafeInteger(number) && number >= 2) {
        const numbered = numberedIrOriginalNames(originals, number);
        if (numbered.join(' + ') === label) return numbered;
    }
    throw new Error('The impulse response name does not match the planned name.');
}
