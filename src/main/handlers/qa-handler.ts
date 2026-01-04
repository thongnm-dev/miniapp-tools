import { ipcMain } from "electron";
import { qa_delete_params, qa_download_params, qa_upload_params } from "../../types/param_interface";
import { qAService } from "../services/qa-service";
import { IPC_CHANNEL_HANDLERS } from "../_/ipc-channel-handlers";


export const setupQAHandlers = () => {

    ipcMain.handle(IPC_CHANNEL_HANDLERS.QA_API_GETS, async (_event, isTo: boolean) => {
        return await qAService.load(isTo);
    });
    ipcMain.handle(IPC_CHANNEL_HANDLERS.QA_API_UPLOAD, async (_event, params: qa_upload_params) => {
        return await qAService.upload(params);
    });
    ipcMain.handle(IPC_CHANNEL_HANDLERS.QA_API_DOWNLOAD, async (_event, params: qa_download_params) => {
        return await qAService.download(params);
    });
    ipcMain.handle(IPC_CHANNEL_HANDLERS.QA_API_DEL, async (_event, params: qa_delete_params) => {
        return await qAService.delete(params);
    });
}