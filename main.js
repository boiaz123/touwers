const { app, BrowserWindow } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');

let mainWindow;
let server;

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
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      sandbox: true
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


