const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

// Keep global references to prevent garbage collection
let serverProcess;
let mainWindow;
let kioskWindow;
let kitchenWindow;
let assemblyWindow;
let managerWindow;

// Professional restaurant POS styling
const WINDOW_CONFIG = {
  webPreferences: {
    nodeIntegration: false,
    contextIsolation: true,
    enableRemoteModule: false,
    webSecurity: true
  },
  titleBarStyle: 'hiddenInset',
  backgroundColor: '#1a1a1a',
  show: false, // Don't show until ready
  frame: true,
  resizable: true,
  minimizable: true,
  maximizable: true,
  closable: true
};

function createMainLauncher() {
  mainWindow = new BrowserWindow({
    ...WINDOW_CONFIG,
    width: 900,
    height: 600,
    title: 'Restaurant Operations System',
    icon: path.join(__dirname, 'assets', 'icon.png'), // We'll create this
    webPreferences: {
      ...WINDOW_CONFIG.webPreferences,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile('public/launcher.html');
  
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    // Start in fullscreen for kiosk-like experience
    if (process.platform !== 'darwin') {
      mainWindow.maximize();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    app.quit();
  });

  // Create professional menu
  createMenuBar();
}

function createKioskWindow() {
  if (kioskWindow) {
    kioskWindow.focus();
    return;
  }

  kioskWindow = new BrowserWindow({
    ...WINDOW_CONFIG,
    width: 1024,
    height: 768,
    title: 'Customer Kiosk - Restaurant Operations',
    fullscreen: true, // Kiosk mode
    kiosk: false, // Allow exit for testing
    webPreferences: {
      ...WINDOW_CONFIG.webPreferences,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  kioskWindow.loadURL('http://localhost:3001/kiosk');
  
  kioskWindow.once('ready-to-show', () => {
    kioskWindow.show();
  });

  kioskWindow.on('closed', () => {
    kioskWindow = null;
  });

  // F11 to toggle fullscreen
  kioskWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F11') {
      kioskWindow.setFullScreen(!kioskWindow.isFullScreen());
    }
  });
}

function createKitchenWindow() {
  if (kitchenWindow) {
    kitchenWindow.focus();
    return;
  }

  kitchenWindow = new BrowserWindow({
    ...WINDOW_CONFIG,
    width: 1920,
    height: 1080,
    title: 'Kitchen Display System',
    webPreferences: {
      ...WINDOW_CONFIG.webPreferences,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  kitchenWindow.loadURL('http://localhost:3001/kitchen');
  
  kitchenWindow.once('ready-to-show', () => {
    kitchenWindow.show();
    kitchenWindow.maximize(); // KVS typically runs maximized
  });

  kitchenWindow.on('closed', () => {
    kitchenWindow = null;
  });

  // Enable keyboard shortcuts for kitchen operations
  kitchenWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown') {
      // Send keyboard events to the kitchen interface
      kitchenWindow.webContents.send('kitchen-keypress', input.key);
    }
  });
}

function createAssemblyWindow() {
  if (assemblyWindow) {
    assemblyWindow.focus();
    return;
  }

  assemblyWindow = new BrowserWindow({
    ...WINDOW_CONFIG,
    width: 1200,
    height: 800,
    title: 'Assembly Station - Order Completion',
    webPreferences: {
      ...WINDOW_CONFIG.webPreferences,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  assemblyWindow.loadURL('http://localhost:3001/assembly');
  
  assemblyWindow.once('ready-to-show', () => {
    assemblyWindow.show();
  });

  assemblyWindow.on('closed', () => {
    assemblyWindow = null;
  });
}

function createManagerWindow() {
  if (managerWindow) {
    managerWindow.focus();
    return;
  }

  managerWindow = new BrowserWindow({
    ...WINDOW_CONFIG,
    width: 1400,
    height: 900,
    title: 'Manager Dashboard - Analytics & Controls',
    webPreferences: {
      ...WINDOW_CONFIG.webPreferences,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  managerWindow.loadURL('http://localhost:3001/manager');
  
  managerWindow.once('ready-to-show', () => {
    managerWindow.show();
  });

  managerWindow.on('closed', () => {
    managerWindow = null;
  });
}

function createMenuBar() {
  const template = [
    {
      label: 'Restaurant POS',
      submenu: [
        {
          label: 'About Restaurant POS',
          role: 'about'
        },
        {
          type: 'separator'
        },
        {
          label: 'Preferences...',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            // Open preferences window
          }
        },
        {
          type: 'separator'
        },
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Stations',
      submenu: [
        {
          label: 'Customer Kiosk',
          accelerator: 'CmdOrCtrl+1',
          click: createKioskWindow
        },
        {
          label: 'Kitchen Display',
          accelerator: 'CmdOrCtrl+2',
          click: createKitchenWindow
        },
        {
          label: 'Assembly Station',
          accelerator: 'CmdOrCtrl+3',
          click: createAssemblyWindow
        },
        {
          label: 'Manager Dashboard',
          accelerator: 'CmdOrCtrl+4',
          click: createManagerWindow
        }
      ]
    },
    {
      label: 'Window',
      role: 'window',
      submenu: [
        {
          label: 'Minimize',
          accelerator: 'CmdOrCtrl+M',
          role: 'minimize'
        },
        {
          label: 'Close',
          accelerator: 'CmdOrCtrl+W',
          role: 'close'
        },
        {
          type: 'separator'
        },
        {
          label: 'Toggle Fullscreen',
          accelerator: 'F11',
          click: (item, focusedWindow) => {
            if (focusedWindow) {
              focusedWindow.setFullScreen(!focusedWindow.isFullScreen());
            }
          }
        }
      ]
    },
    {
      label: 'Help',
      role: 'help',
      submenu: [
        {
          label: 'About Restaurant POS System',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About',
              message: 'Restaurant Operations System',
              detail: 'Professional point-of-sale system with kitchen display, customer kiosk, and management tools.\n\nVersion 2.0.0'
            });
          }
        },
        {
          label: 'Keyboard Shortcuts',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Keyboard Shortcuts',
              message: 'Kitchen Display Shortcuts',
              detail: 'B - Bump off selected order\n1-9 - Select order number\nF1 - Toggle sound\nF11 - Toggle fullscreen\nEsc - Deselect order'
            });
          }
        }
      ]
    }
  ];

  // macOS specific menu adjustments
  if (process.platform === 'darwin') {
    template[0].label = app.getName();
    template[0].submenu[0] = {
      label: `About ${app.getName()}`,
      role: 'about'
    };
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function startBackendServer() {
  return new Promise((resolve, reject) => {
    serverProcess = spawn('node', ['server.js'], {
      cwd: __dirname,
      stdio: 'pipe'
    });

    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('Server:', output);
      
      if (output.includes('running on port')) {
        resolve();
      }
    });

    serverProcess.stderr.on('data', (data) => {
      console.error('Server Error:', data.toString());
    });

    serverProcess.on('close', (code) => {
      console.log(`Server process exited with code ${code}`);
      if (code !== 0) {
        reject(new Error(`Server failed to start with code ${code}`));
      }
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      reject(new Error('Server startup timeout'));
    }, 10000);
  });
}

// App event listeners
app.whenReady().then(async () => {
  try {
    // Start the backend server first
    await startBackendServer();
    
    // Small delay to ensure server is fully ready
    setTimeout(() => {
      createMainLauncher();
    }, 1000);
    
  } catch (error) {
    console.error('Failed to start server:', error);
    dialog.showErrorBox('Startup Error', 'Failed to start the restaurant system server. Please check the console for details.');
    app.quit();
  }
});

app.on('window-all-closed', () => {
  // Kill server process
  if (serverProcess) {
    serverProcess.kill();
  }
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainLauncher();
  }
});

// IPC handlers for window management
ipcMain.handle('open-kiosk', () => {
  createKioskWindow();
});

ipcMain.handle('open-kitchen', () => {
  createKitchenWindow();
});

ipcMain.handle('open-assembly', () => {
  createAssemblyWindow();
});

ipcMain.handle('open-manager', () => {
  createManagerWindow();
});

// Handle app closing
app.on('before-quit', (event) => {
  if (serverProcess) {
    serverProcess.kill();
  }
});