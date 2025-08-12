import { ipcMain, dialog, shell, BrowserWindow } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { IPC_CHANNEL_HANDLERS } from '../_/ipc-channel-handlers';
import { fsService } from '../services/fs-service';

export const setupFSHandlers = () => {
    // IPC handlers for file system operations
    ipcMain.handle(IPC_CHANNEL_HANDLERS.SELECT_DIRECTORY, async (_event) => {
        try {
            if (!BrowserWindow.getAllWindows().length) {
                return { success: false, message: 'Main window not available' };
            }

            const mainWindow = BrowserWindow.getAllWindows()[0];
            const result = await dialog.showOpenDialog(mainWindow, {
                title: 'Select Directory',
                properties: ['openDirectory'],
            });

            if (!result.canceled && result.filePaths.length > 0) {
                return { success: true, data: result.filePaths[0], message: 'Directory selected successfully' };
            }

            return { success: false, message: 'No directory selected' };
        } catch (error) {
            return { success: false, message: (error as Error).message };
        }
    });

    ipcMain.handle(IPC_CHANNEL_HANDLERS.SELECT_MULTI_DIR, async (_event) => {
        try {
            if (!BrowserWindow.getAllWindows().length) {
                return { success: false, message: 'Main window not available' };
            }

            const mainWindow = BrowserWindow.getAllWindows()[0];
            const result = await dialog.showOpenDialog(mainWindow, {
                title: 'Select Directory',
                properties: ['openDirectory', 'multiSelections'],
            });

            if (!result.canceled && result.filePaths.length > 0) {
                return { success: true, data: result.filePaths, message: 'Directory selected successfully' };
            }

            return { success: false, message: 'No directory selected' };
        } catch (error) {
            return { success: false, message: (error as Error).message };
        }
    });

    // check exist directory
    ipcMain.handle(IPC_CHANNEL_HANDLERS.IS_EXIST_DIR, async (_event, dirPath: string) => {
        return await fsService.isExitDirectory(dirPath);
    });

    // Read directory
    ipcMain.handle(IPC_CHANNEL_HANDLERS.READ_DIRECTORY, async (_event, dirPath: string, options: {onlyExcel?: boolean, fileExtension?: string }) => {
        return await fsService.readDirectory(dirPath, options);
    });

    // Read directory to tree
    ipcMain.handle(IPC_CHANNEL_HANDLERS.READ_MULTI_DIR, async (_event, dirPath: string[], options?: { isHistory?: boolean, onlyExcel?: boolean, fileExtension?: string }) => {
        return await fsService.readMultiDir(dirPath, options);
    });

    // Read file
    ipcMain.handle(IPC_CHANNEL_HANDLERS.READ_FILE, async (_event, filePath: string) => {
        try {
            const data = fs.readFileSync(filePath, 'utf8');
            return { success: true, data };
        } catch (error) {
            return { success: false, message: (error as Error).message };
        }
    });

    // Open file
    ipcMain.handle(IPC_CHANNEL_HANDLERS.OPEN_FILE, async (_event, filePath: string) => {
        try {
            await shell.openPath(filePath);
            if (BrowserWindow.getAllWindows().length > 0) {
                const mainWindow = BrowserWindow.getAllWindows()[0];
                mainWindow.show();
                mainWindow.focus();
            }
            return { success: true };
        } catch (error) {
            return { success: false, message: (error as Error).message };
        }
    });

    // File copy/move operations
    ipcMain.handle(IPC_CHANNEL_HANDLERS.COPY_FILES, async (_event, filePaths: string[], destinationPath: string) => {
        return await fsService.copy(filePaths, destinationPath);
    });

    // Move files
    ipcMain.handle(IPC_CHANNEL_HANDLERS.MOVE_FILES, async (_event, filePaths: string[], destinationPath: string) => {
        try {
            const results = [];

            for (const filePath of filePaths) {
                const fileName = path.basename(filePath);
                const destinationFilePath = path.join(destinationPath, fileName);

                // Check if file already exists in destination
                if (fs.existsSync(destinationFilePath)) {
                    results.push({
                        success: false,
                        path: filePath,
                        message: `File ${fileName} already exists in destination`
                    });
                    continue;
                }

                // Move the file
                fs.renameSync(filePath, destinationFilePath);
                results.push({
                    success: true,
                    path: filePath,
                    destination: destinationFilePath
                });
            }

            return { success: true, results };
        } catch (error) {
            return { success: false, message: (error as Error).message };
        }
    });

    // delete file
    ipcMain.handle(IPC_CHANNEL_HANDLERS.DELETE_FILE, async (_event, filePath: string) => {
        try {
            fs.unlinkSync(filePath);
            return { success: true };
        } catch (error) {
            return { success: false, message: (error as Error).message };
        }
    });
}; 