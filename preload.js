const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  openKiosk: () => ipcRenderer.invoke('open-kiosk'),
  openKitchen: () => ipcRenderer.invoke('open-kitchen'),
  openAssembly: () => ipcRenderer.invoke('open-assembly'),
  openManager: () => ipcRenderer.invoke('open-manager'),
  
  // Kitchen keyboard events
  onKitchenKeypress: (callback) => ipcRenderer.on('kitchen-keypress', callback),
  removeKitchenKeypressListeners: () => ipcRenderer.removeAllListeners('kitchen-keypress'),
  
  // System info
  platform: process.platform,
  version: process.versions
});

// Professional POS system utilities
contextBridge.exposeInMainWorld('posAPI', {
  // Professional formatting functions
  formatCurrency: (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  },
  
  formatTime: (date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(date);
  },
  
  formatDate: (date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric'
    }).format(date);
  }
});