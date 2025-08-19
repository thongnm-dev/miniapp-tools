import { ipcMain } from "electron";
import { IPC_CHANNEL_HANDLERS } from "../_/ipc-channel-handlers";
import { appService } from "../services/app-service";


export const setupAppHandlers = () => {

    ipcMain.handle(IPC_CHANNEL_HANDLERS.APP_API_GET_ALL_AWS_STORE, async (_event) => {
        return await appService.get_all_items();
    });

    ipcMain.handle(IPC_CHANNEL_HANDLERS.APP_API_GET_DOWNLOAD_ITEMS, async (_event) => {
        return await appService.get_download_items();
    });

    ipcMain.handle(IPC_CHANNEL_HANDLERS.APP_API_GET_UPLOAD_ITEMS, async (_event) => {
        return await appService.get_upload_items();
    });

    ipcMain.handle(IPC_CHANNEL_HANDLERS.APP_API_GET_DELETE_ITEMS, async (_event, aws_cd: string) => {
        return await appService.get_delete_items(aws_cd);
    });
}