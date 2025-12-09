const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  appVersion: process.env.npm_package_version,
});
