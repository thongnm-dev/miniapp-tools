import { ipcMain } from 'electron';
import { IPC_CHANNEL_HANDLERS } from '../_/ipc-channel-handlers';
import { downloadService } from '../services/download-service';

export const setupDownloadHandlers = () => {
    // GET DOWNLOADS
    ipcMain.handle(IPC_CHANNEL_HANDLERS.GET_DONWLOADS, async (_event, user_id: string) => {
        return await downloadService.get_downloads(user_id);
    });

    // GET DOWNLOAD DETAILS
    ipcMain.handle(IPC_CHANNEL_HANDLERS.GET_DOWNLOAD_DLTS, async (_event, fetchId: string) => {
        return await downloadService.get_download_dtls(fetchId);
    });

    // GET ALLOW DOWNLOAD
    ipcMain.handle(IPC_CHANNEL_HANDLERS.ALLOW_DOWNLOAD_OBJECT_S3, async (_event, bugs: string[]) => {
        return await downloadService.allow_download(bugs);
    });

    // GET ALLOW REMOVE
    ipcMain.handle(IPC_CHANNEL_HANDLERS.ALLOW_MOVE_OBJECT_S3, async (_event, bugs: string[]) => {
        return await downloadService.allow_remove(bugs);
    });
}