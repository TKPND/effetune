// Delay mobile exits until their CSS motion finishes; other layouts finish synchronously.
const pending = new WeakMap();

export function cancelExitMotion(element) {
    pending.get(element)?.();
}

export function runExitMotion(element, onDone) {
    const activeElement = globalThis.document?.activeElement;
    if (element.contains?.(activeElement)) activeElement?.blur?.();
    element.inert = true;
    const ms = parseFloat(globalThis.getComputedStyle?.(element)?.getPropertyValue?.('--et-motion-exit'));
    if (!(ms > 0)) {
        onDone?.();
        return;
    }

    cancelExitMotion(element);
    element.classList.add('mobile-closing');
    let active = true;
    const onEnd = event => {
        if (event.target === element) finish();
    };
    const timer = setTimeout(finish, ms + 100);
    element.addEventListener('animationend', onEnd);
    element.addEventListener('transitionend', onEnd);
    pending.set(element, cancel);

    function cancel() {
        active = false;
        element.removeEventListener('animationend', onEnd);
        element.removeEventListener('transitionend', onEnd);
        clearTimeout(timer);
        pending.delete(element);
    }

    function finish() {
        if (!active) return;
        cancel();
        element.classList.remove('mobile-closing');
        onDone?.();
    }
}
