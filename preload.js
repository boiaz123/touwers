const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  appVersion: process.env.npm_package_version,
  
  // Resolution management
  setResolution: (width, height) => ipcRenderer.invoke('set-resolution', width, height),
  getResolutions: () => ipcRenderer.invoke('get-resolutions'),
  toggleFullscreen: (enable) => ipcRenderer.invoke('toggle-fullscreen', enable)
});

// Also expose via old API name for backwards compatibility
contextBridge.exposeInMainWorld('electronAPI', {
  appVersion: process.env.npm_package_version
});
