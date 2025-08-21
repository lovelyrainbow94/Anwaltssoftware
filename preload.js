const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openFileDialog: () => ipcRenderer.invoke('dialog:openFile'),
  importFile: (caseId) => ipcRenderer.invoke('dialog:importFile', caseId),
  linkFile: () => ipcRenderer.invoke('dialog:linkFile'),
  openFile: (filePath) => ipcRenderer.send('shell:openFile', filePath),
  deleteImportedFile: (filePath) => ipcRenderer.invoke('fs:deleteFile', filePath),
  exportData: (data) => ipcRenderer.invoke('data:export', data),
  importData: () => ipcRenderer.invoke('data:import'),
  saveStructure: () => ipcRenderer.invoke('data:saveStructure')
});
