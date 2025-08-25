import { app, BrowserWindow, dialog } from 'electron';
import * as path from 'path';
import { config } from 'dotenv';
config();

import { databaseService } from './services/database-service';
import { cleanupFolderWatcher } from './handlers/fs-watch-handler';
import { initHandlers } from './handlers/_';
import { autoUpdater } from 'electron-updater';

let mainWindow: BrowserWindow;

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
        icon: path.join(__dirname, '../../build/icon.ico')
    });

    // Load the index.html file
    if (process.argv.includes('--dev')) {
        mainWindow.loadURL('http://localhost:3000');
    } else {
        mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }

    // Show window when ready to prevent visual flash
    mainWindow.once('ready-to-show', () => {
        mainWindow?.show();
    });

    // Handle window closed
    mainWindow.on('closed', () => {
        // mainWindow = null;
    });
}

// Initialize database when app starts
app.whenReady().then(async () => {
    createWindow();

    autoUpdater.checkForUpdatesAndNotify();

    autoUpdater.on('download-progress', (p) => {
        // Gửi progress sang renderer nếu cần
        // win.webContents.send('update-progress', p);
        mainWindow?.setProgressBar(p.percent / 100);
    });

    autoUpdater.on('update-downloaded', () => {
        const res = dialog.showMessageBoxSync(mainWindow, {
            type: 'info',
            buttons: ['Khởi động lại', 'Để sau'],
            title: 'Cập nhật sẵn sàng',
            message: 'Bản cập nhật đã tải xong. Khởi động lại để áp dụng?'
        });

        if (res === 0)
            autoUpdater.quitAndInstall(); // restart & apply
    });
    try {
        // Setup all IPC handlers
        initHandlers();
        await databaseService.connect();

        if (! await databaseService.isConnected()) {
            throw new Error();
        }

        if (process.argv.includes('--dev')) {
            await databaseService.initializeDatabase();
        }
    } catch (error) {
        const res = dialog.showMessageBoxSync(mainWindow, {
            type: 'error',
            buttons: ['Đóng'],
            title: 'Không thể kết nối cơ sở dữ liệu',
            message: 'Kết nối cơ sở dữ liệu thất bại. Vui lòng liên hệ bộ phận phát triển.'
        });
        if (res === 0)
            app.quit();
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