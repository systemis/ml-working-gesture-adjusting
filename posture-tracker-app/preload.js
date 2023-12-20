const { contextBridge, ipcRenderer } = require('electron/renderer')

contextBridge.exposeInMainWorld('electronAPI', {
  notify: (message) => ipcRenderer.send("message", message),
})