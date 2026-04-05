const { app, BrowserWindow, session } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

// Enable @electron/remote for React integration
require('@electron/remote/main').initialize();

function createWindow() {
  const mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false, // ← ESSENTIAL for iframes
      allowRunningInsecureContent: true,
      webviewTag: true,
      nativeWindowOpen: true,
      enableRemoteModule: true,
      partition: 'persist:main',
      plugins: true, // Required for YouTube
      sandbox: false // Important for iframe permissions
    },
    icon: path.join(__dirname, 'public/favicon.ico'),
    show: false // Don't show until ready (prevents flickering)
  });

  // Maximize to fill screen (taskbar stays visible like a browser)
  mainWindow.maximize();

  // Enable @electron/remote for this window
  require('@electron/remote/main').enable(mainWindow.webContents);

  // Set User Agent to avoid YouTube restrictions
  mainWindow.webContents.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  );

  // Load the React app
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../build/index.html'));
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Configure session permissions for iframes
  const ses = mainWindow.webContents.session;

  // Set permissions for YouTube and other video sites
  ses.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowedPermissions = [
      'media',
      'geolocation',
      'notifications',
      'midiSysex',
      'pointerLock',
      'fullscreen',
      'openExternal'
    ];
    
    if (allowedPermissions.includes(permission)) {
      callback(true); // Allow
    } else {
      callback(false); // Deny
    }
  });

  // Configure content security policy
  ses.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
           "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; " +
            "script-src * 'unsafe-inline' 'unsafe-eval' blob: data:; " +
            "style-src * 'unsafe-inline' blob: data:; " +
            "img-src * data: blob:; " +
            "media-src * data: blob:; " +
            "frame-src *; " +
            "connect-src *;"
        ]
      }
    });
  });

  // Handle new window events (for iframes opening in new windows)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Allow iframes to open
    return { action: 'allow' };
  });

  // Optional: Log for debugging
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.log('Failed to load:', errorDescription);
  });

  mainWindow.webContents.on('console-message', (event, level, message) => {
    console.log('Renderer console:', message);
  });
}

// App ready event
app.whenReady().then(() => {
  
app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors');
app.commandLine.appendSwitch('disable-site-isolation-trials');
app.commandLine.appendSwitch('disable-web-security');
app.commandLine.appendSwitch('allow-running-insecure-content');
app.commandLine.appendSwitch('ignore-certificate-errors');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.commandLine.appendSwitch('enable-features', 'SharedArrayBuffer');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-setuid-sandbox');

  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Handle certificate errors (common for local development)
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  event.preventDefault();
  callback(true); // Allow the certificate error
});

// Optional: For YouTube embeds specifically
app.on('web-contents-created', (event, contents) => {
  if (contents.getType() === 'webview' || contents.getType() === 'iframe') {
    // Allow autoplay for embedded videos
    contents.setAudioMuted(false);
  }
});