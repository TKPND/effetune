function createAppUpdater({
  app,
  platform = process.platform,
  env = process.env,
  loadUpdater = () => require('electron-updater').autoUpdater
}) {
  let updater;
  let downloadPromise;

  function isSupported() {
    return platform === 'win32' && app.isPackaged === true && !env.PORTABLE_EXECUTABLE_DIR;
  }

  function downloadUpdate() {
    if (!isSupported()) {
      return Promise.reject(new Error('In-app updates are unavailable for this installation'));
    }
    if (downloadPromise) return downloadPromise;

    downloadPromise = (async () => {
      if (!updater) {
        updater = loadUpdater();
        updater.autoDownload = false;
        updater.autoInstallOnAppQuit = false;
        updater.logger = console;
      }
      const result = await updater.checkForUpdates();
      if (!result?.isUpdateAvailable) {
        throw new Error('No update is available');
      }
      await updater.downloadUpdate();
      // Start the installer only after normal service and window shutdown.
      app.once('quit', () => updater.install(true, true));
    })().catch(error => {
      downloadPromise = null;
      throw error;
    });
    return downloadPromise;
  }

  return { isSupported, downloadUpdate };
}

module.exports = { createAppUpdater };
