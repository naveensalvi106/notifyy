const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = !app.isPackaged;

// Ensure protocol is registered early
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('com.notify.app', process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient('com.notify.app');
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false, // Don't show until ready but we'll force it
    backgroundColor: '#0a0a0b', // Match dark theme
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
    title: 'Notify',
    autoHideMenuBar: true,
  });

  if (isDev) {
    mainWindow.loadURL('http://127.0.0.1:3000');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // FORCE SHOW immediately after window creation
  mainWindow.show();
  mainWindow.focus();

  // Also show once content is ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
}

// macOS Protocol Handler
app.on('open-url', (event, url) => {
  event.preventDefault();
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
    mainWindow.webContents.send('app-url-open', url);
  }
});

// Windows Protocol Handler (Second Instance)
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  // When someone tries to run a second instance (e.g., clicking the link in the browser)
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      
      // SCAN ALL ARGUMENTS for the protocol (Windows sometimes adds flags at the end)
      const url = commandLine.find(arg => arg.startsWith('com.notify.app://'));
      if (url) {
        console.log('Detected Protocol URL in second instance:', url);
        mainWindow.webContents.send('app-url-open', url);
      }
    }
  });

  app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });

  ipcMain.on('open-external', (event, url) => {
    shell.openExternal(url);
  });

  ipcMain.handle('save-file', async (event, { content, defaultPath }) => {
    const { filePath } = await dialog.showSaveDialog(mainWindow, {
      defaultPath,
      filters: [{ name: 'JSON Files', extensions: ['json'] }]
    });

    if (filePath) {
      fs.writeFileSync(filePath, content, 'utf-8');
      return true;
    }
    return false;
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
