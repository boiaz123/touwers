const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');

let mainWindow;
let server;

// Fixed resolution options matching ResolutionSettings
const RESOLUTIONS = {
  '1280x720': { width: 1280, height: 720, label: '720p' },
  '1920x1080': { width: 1920, height: 1080, label: '1080p (Recommended)' },
  '2560x1440': { width: 2560, height: 1440, label: '1440p (QHD)' },
  '3840x2160': { width: 3840, height: 2160, label: '2160p (4K)' }
};

function getResolution(key = '1920x1080') {
  return RESOLUTIONS[key] || RESOLUTIONS['1920x1080'];
}

// Start the Express server
function startServer() {
  return new Promise((resolve, reject) => {
    const express = require('express');
    const cors = require('cors');
    
    const expressApp = express();
    const PORT = process.env.PORT || 3000;

    expressApp.use(cors());
    expressApp.use(express.static(path.join(__dirname, 'public')));
    expressApp.use(express.json());

    expressApp.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });

    // Serve any file as index.html for SPA routing
    expressApp.get('/*', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });

    server = expressApp.listen(PORT, '127.0.0.1', () => {
      console.log(`Tower Defense server running on http://127.0.0.1:${PORT}`);
      resolve(`http://127.0.0.1:${PORT}`);
    });

    server.on('error', (err) => {
      console.error('Server error:', err);
      reject(err);
    });
  });
}

function createWindow(url) {
  // Get saved resolution from localStorage or use default
  const resolution = getResolution('1920x1080');
  
  mainWindow = new BrowserWindow({
    width: resolution.width,
    height: resolution.height,
    fullscreen: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadURL(url);

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Window loaded successfully');
  });

  mainWindow.webContents.on('crashed', () => {
    console.error('Window crashed');
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC handlers for resolution management
ipcMain.handle('set-resolution', async (event, width, height) => {
  if (mainWindow) {
    try {
      mainWindow.setSize(width, height);
      console.log(`Window resized to ${width}x${height}`);
      return { success: true, width, height };
    } catch (error) {
      console.error('Error setting resolution:', error);
      return { success: false, error: error.message };
    }
  }
  return { success: false, error: 'Main window not available' };
});

ipcMain.handle('get-resolutions', async (event) => {
  return RESOLUTIONS;
});

ipcMain.handle('toggle-fullscreen', async (event, enable) => {
  if (mainWindow) {
    mainWindow.setFullScreen(enable);
    return { success: true, fullscreen: enable };
  }
  return { success: false };
});

app.disableHardwareAcceleration();

app.on('ready', async () => {
  try {
    const serverUrl = await startServer();
    createWindow(serverUrl);
  } catch (err) {
    console.error('Failed to start server:', err);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (server) {
      server.close();
    }
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    startServer().then(url => createWindow(url));
  }
});

process.on('exit', () => {
  if (server) {
    server.close();
  }
});


