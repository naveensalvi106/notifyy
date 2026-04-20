const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  isElectron: true,
  onAppUrlOpen: (callback) => ipcRenderer.on('app-url-open', (_event, url) => callback(url)),
  openExternal: (url) => ipcRenderer.send('open-external', url),
  saveFile: (data) => ipcRenderer.invoke('save-file', data),
});
