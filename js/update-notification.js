function translate(windowRef, key, fallback, params = {}) {
    const translated = windowRef.uiManager?.t?.(key, params);
    return translated && translated !== key ? translated : fallback;
}

export function createUpdateNotification(updateInfo, {
    documentRef = document,
    windowRef = window
} = {}) {
    const container = documentRef.createElement('div');
    container.className = 'update-notification';
    container.setAttribute?.('role', 'status');

    const releaseButton = documentRef.createElement('button');
    releaseButton.type = 'button';
    releaseButton.className = 'update-release-link';
    releaseButton.textContent = translate(
        windowRef,
        'ui.newVersionAvailable',
        `New ${updateInfo.version} available.`,
        { version: updateInfo.version }
    );
    releaseButton.addEventListener('click', () => {
        if (windowRef.electronAPI?.openExternal) windowRef.electronAPI.openExternal(updateInfo.url);
        else windowRef.open(updateInfo.url, '_blank', 'noopener');
    });
    container.appendChild(releaseButton);

    const downloadUpdate = windowRef.electronAPI?.downloadUpdate;
    if (updateInfo.autoUpdateSupported !== true || typeof downloadUpdate !== 'function') {
        return container;
    }

    const idleLabel = translate(windowRef, 'ui.downloadUpdate', 'Download update');
    const downloadButton = documentRef.createElement('button');
    downloadButton.type = 'button';
    downloadButton.className = 'update-release-link update-download-button';
    downloadButton.textContent = idleLabel;
    downloadButton.title = translate(
        windowRef,
        'ui.downloadUpdateTitle',
        'EffeTune will restart when the update is complete.'
    );
    downloadButton.addEventListener('click', async () => {
        if (downloadButton.disabled) return;

        downloadButton.disabled = true;
        downloadButton.textContent = translate(
            windowRef,
            'ui.downloadingUpdate',
            'Downloading...'
        );

        try {
            const result = await downloadUpdate();
            if (result?.success === true) return;
        } catch (error) {
            console.error('Failed to download update:', error);
        }

        downloadButton.disabled = false;
        downloadButton.textContent = idleLabel;
        windowRef.uiManager?.setError?.('ui.updateDownloadFailed', true);
    });
    container.appendChild(downloadButton);
    return container;
}
