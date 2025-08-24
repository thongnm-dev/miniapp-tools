import { ipcMain } from "electron";
import { IPC_CHANNEL_HANDLERS } from "../_/ipc-channel-handlers";
import { uploadService } from "../services/upload-service";
import { search_upload_params, upload_display_params } from "../../types/param_interface";

export const setupUploadHandlers = () => {

    // GET ALLOW DOWNLOAD
    ipcMain.handle(IPC_CHANNEL_HANDLERS.ALLOW_UPLOAD_OBJECT_S3, async (_event, params: upload_display_params) => {
        return await uploadService.display_upload_button(params);
    });

    ipcMain.handle(IPC_CHANNEL_HANDLERS.SEARCH_UPLOAD_HISTORY, async (_event, params: search_upload_params) => {
        return await uploadService.search_upload_histories(params);
    });
}