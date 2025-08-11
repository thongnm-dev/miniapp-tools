import { ipcMain, BrowserWindow } from 'electron';
import * as fs from 'fs';
import { IPC_CHANNEL_HANDLERS } from '../_/ipc-channel-handlers';

let folderWatcher: fs.FSWatcher | null = null;

export const setupFSWatchHandlers = () => {
  // Folder watching IPC handlers (legacy - keeping for backward compatibility)
  ipcMain.on(IPC_CHANNEL_HANDLERS.WATCH_FOLDER, (_event, folderPath: string) => {

    if (fs.existsSync(folderPath)) {
      if (folderWatcher) {
        folderWatcher.close();
        folderWatcher = null;
      }
      folderWatcher = fs.watch(folderPath, { persistent: true }, (_eventType, filename) => {
        if (filename) {
          if (BrowserWindow.getAllWindows().length > 0) {
            BrowserWindow.getAllWindows()[0].webContents.send(IPC_CHANNEL_HANDLERS.FOLDER_CHANGED);
          }
        }
      });
    }
  });

  ipcMain.on(IPC_CHANNEL_HANDLERS.UNWATCH_FOLDER, () => {
    if (folderWatcher) {
      folderWatcher.close();
      folderWatcher = null;
    }
  });
};

export const cleanupFolderWatcher = () => {
  if (folderWatcher) {
    folderWatcher.close();
    folderWatcher = null;
  }
}; 