const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

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
    show: false,
    backgroundColor: '#0a0a0b',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
    title: 'Notify',
    autoHideMenuBar: true,
  });

  // ROBUST PATH RESOLUTION
  const possiblePaths = [
    path.join(app.getAppPath(), 'dist', 'index.html'),
    path.join(__dirname, '..', 'dist', 'index.html'),
    path.join(process.resourcesPath, 'app', 'dist', 'index.html'),
    path.join(process.resourcesPath, 'app.asar', 'dist', 'index.html'),
    // If we are in the electron folder, maybe dist is adjacent
    path.join(__dirname, 'dist', 'index.html')
  ];

  let pathToLoad = '';
  for (const p of possiblePaths) {
    console.log('Checking path:', p);
    if (fs.existsSync(p)) {
      pathToLoad = p;
      console.log('FOUND VALID PATH:', p);
      break;
    }
  }

  if (pathToLoad) {
    mainWindow.loadFile(pathToLoad).catch(err => {
      console.error('Load Failure:', err);
      dialog.showErrorBox('Load Failure', 'Failed to load app files: ' + err.message + '\n\nPath attempted: ' + pathToLoad);
    });
  } else {
    const errorMsg = 'Could NOT find app files at any of these locations:\n\n' + possiblePaths.join('\n') + '\n\nPlease ensure you have run "npm run build".';
    console.error(errorMsg);
    dialog.showErrorBox('Files Not Found', errorMsg);
  }

  // Safety timeout to show window even if DOM takes time to signal
  const showTimeout = setTimeout(() => {
    if (mainWindow && !mainWindow.isVisible()) {
      console.log('Safety show triggered');
      mainWindow.show();
    }
  }, 3000);

  mainWindow.once('ready-to-show', () => {
    clearTimeout(showTimeout);
    mainWindow.show();
    mainWindow.setTitle('Notify');
    console.log('Window ready-to-show');
  });

  mainWindow.on('page-title-updated', (e) => e.preventDefault());
}

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.on('ready', () => {
    dialog.showErrorBox('App Already Running', 'Another instance of Notify is already running. Please check your system tray or task manager.');
    app.quit();
  });
} else {
  app.on('second-instance', (event, commandLine) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      const url = commandLine.find(arg => arg.startsWith('com.notify.app://'));
      if (url) {
        mainWindow.webContents.send('app-url-open', url);
      }
    }
  });

  app.whenReady().then(() => {
    console.log('App ready, creating window...');
    createWindow();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  }).catch(err => {
    dialog.showErrorBox('Startup Error', 'Electron failed to initialize: ' + err.message);
  });

  ipcMain.on('open-external', (event, url) => {
    shell.openExternal(url);
  });

  ipcMain.handle('save-file', async (event, { content, defaultPath }) => {
    try {
      const { filePath } = await dialog.showSaveDialog(mainWindow, {
        defaultPath,
        filters: [{ name: 'JSON Files', extensions: ['json'] }]
      });
      if (filePath) {
        fs.writeFileSync(filePath, content, 'utf-8');
        return true;
      }
    } catch (err) {
      console.error('Save error:', err);
    }
    return false;
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
