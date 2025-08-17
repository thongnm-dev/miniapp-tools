import { ipcMain } from "electron";
import { IPC_CHANNEL_HANDLERS } from "../_/ipc-channel-handlers";
import { uploadService } from "../services/upload-service";


export const setupUploadHandlers = () => {

    // GET ALLOW DOWNLOAD
    ipcMain.handle(IPC_CHANNEL_HANDLERS.ALLOW_UPLOAD_OBJECT_S3, async (_event, params: { user_id: string, state: string, upload_id: string, select_items: string[] }) => {
        return await uploadService.display_upload_button(params);
    });
}