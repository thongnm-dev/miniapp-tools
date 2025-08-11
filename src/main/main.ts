import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { config } from 'dotenv';
config();

import { databaseService } from './services/database-service';
import { cleanupFolderWatcher } from './handlers/fs-watch-handler';
import { initHandlers } from './handlers/_';

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'default',
    frame: true,
    autoHideMenuBar: true,
    show: true,
    icon: path.join(__dirname, '../../public/assets/ws.ico') // Optional: add an icon
  });

  // Load the index.html file
  if (process.argv.includes('--dev')) {
    mainWindow.loadURL('http://localhost:3000');
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Initialize database when app starts
app.whenReady().then(async () => {
  createWindow();

  try {

    // Initialize database
    if (!(await databaseService.connect()).success) {
      console.error('Không thể kết nối database...');
    } else {
      if (process.argv.includes('--dev')) {
        await databaseService.initializeDatabase();
      }

      // Setup all IPC handlers
      initHandlers();
    }

  } catch (error) {
    // You might want to show a dialog to the user about configuration issues
  }
});

// Quit when all windows are closed
app.on('window-all-closed', async () => {
  await databaseService.disconnect();
  cleanupFolderWatcher();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});