const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs-extra');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile('index.html');

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  // Setup app data directory for imported files
  const appDataPath = app.getPath('userData');
  const importedFilesPath = path.join(appDataPath, 'imported-case-files');
  fs.ensureDirSync(importedFilesPath);

  // IPC handler for importing a file
  ipcMain.handle('dialog:importFile', async (event, caseId) => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile']
    });
    if (canceled || filePaths.length === 0) {
      return null;
    }
    const sourcePath = filePaths[0];
    const originalFilename = path.basename(sourcePath);
    const caseDirectory = path.join(importedFilesPath, String(caseId));
    fs.ensureDirSync(caseDirectory);
    const destinationPath = path.join(caseDirectory, originalFilename);

    try {
      await fs.copy(sourcePath, destinationPath, { overwrite: true });
      return {
        type: 'imported',
        name: originalFilename,
        path: destinationPath,
      };
    } catch (err) {
      console.error('File import failed:', err);
      return { error: 'File import failed' };
    }
  });

  // IPC handler for linking an external file
  ipcMain.handle('dialog:linkFile', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile']
    });
    if (canceled || filePaths.length === 0) {
      return null;
    }
    const sourcePath = filePaths[0];
    const filename = path.basename(sourcePath);
    return {
      type: 'linked',
      name: filename,
      path: sourcePath,
    };
  });

  // IPC handler to open a file with the default system program
  ipcMain.on('shell:openFile', (event, filePath) => {
    fs.pathExists(filePath, (err, exists) => {
      if (exists) {
        shell.openPath(filePath);
      } else {
        dialog.showErrorBox('File Not Found', `The file at ${filePath} could not be found.`);
      }
    });
  });

  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  // IPC handler to delete a file
  ipcMain.handle('fs:deleteFile', async (event, filePath) => {
    try {
      // Basic security check: ensure the path is within the imported files directory
      if (!filePath.startsWith(importedFilesPath)) {
        throw new Error('Attempt to delete file outside of the allowed directory.');
      }
      await fs.remove(filePath);
      return { success: true };
    } catch (err) {
      console.error('File deletion failed:', err);
      return { success: false, error: err.message };
    }
  });

  // IPC handler for exporting all data
  ipcMain.handle('data:export', async (event, data) => {
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Alle Daten exportieren',
      defaultPath: `aufgabenplaner-pro-backup-${Date.now()}.json`,
      filters: [{ name: 'JSON Files', extensions: ['json'] }]
    });

    if (canceled || !filePath) {
      return { success: false, message: 'Export abgebrochen' };
    }

    try {
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
      return { success: true, message: 'Daten erfolgreich exportiert' };
    } catch (err) {
      console.error('Data export failed:', err);
      return { success: false, error: err.message };
    }
  });

  // IPC handler for importing data
  ipcMain.handle('data:import', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'Daten importieren',
      filters: [{ name: 'JSON Files', extensions: ['json'] }],
      properties: ['openFile']
    });

    if (canceled || filePaths.length === 0) {
      return { success: false, message: 'Import abgebrochen' };
    }

    try {
      const fileContent = await fs.readFile(filePaths[0], 'utf-8');
      const data = JSON.parse(fileContent);
      return { success: true, data: data };
    } catch (err) {
      console.error('Data import failed:', err);
      return { success: false, error: err.message };
    }
  });

    // IPC handler for saving the data structure file
  ipcMain.handle('data:saveStructure', async () => {
    const dataStructureInfo = `
Aufgabenplaner Pro - Datenstruktur

Die JSON-Sicherungsdatei hat das folgende Format:

{
  "clients": [
    {
      "id": 167... (Timestamp),
      "name": "string",
      "email": "string",
      "phone": "string",
      "address": "string"
    }
  ],
  "cases": [
    {
      "id": 167... (Timestamp),
      "title": "string",
      "clientId": 167... (ID from a client),
      "description": "string",
      "documents": [
        {
          "type": "'imported' or 'linked'",
          "name": "string (filename)",
          "path": "string (absolute path to file)"
        }
      ]
    }
  ],
  "tasks": [
    {
      "id": 167... (Timestamp),
      "title": "string",
      "caseId": 167... (ID from a case) | null,
      "dueDate": "string (YYYY-MM-DD)",
      "status": "'Offen' | 'In Bearbeitung' | 'Erledigt'"
    }
  ],
  "deadlines": [
    {
      "id": 167... (Timestamp),
      "title": "string",
      "caseId": 167... (ID from a case) | null,
      "endDate": "string (YYYY-MM-DD)"
    }
  ]
}
    `;
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Datenstruktur speichern',
      defaultPath: 'aufgabenplaner-pro-datenstruktur.txt',
      filters: [{ name: 'Text Files', extensions: ['txt'] }]
    });

    if (canceled || !filePath) {
      return { success: false, message: 'Speichern abgebrochen' };
    }

    try {
      await fs.writeFile(filePath, dataStructureInfo.trim());
      return { success: true, message: 'Datenstruktur erfolgreich gespeichert' };
    } catch (err) {
      console.error('Saving data structure failed:', err);
      return { success: false, error: err.message };
    }
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
