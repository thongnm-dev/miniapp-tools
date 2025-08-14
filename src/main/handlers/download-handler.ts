import { ipcMain } from 'electron';
import { IPC_CHANNEL_HANDLERS } from '../_/ipc-channel-handlers';
import { downloadService } from '../services/download-service';
import { fsService } from '../services/fs-service';

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

    // GET ALLOW REMOVE
    ipcMain.handle(IPC_CHANNEL_HANDLERS.COPY_AND_UPDATE_PATH_DOWNLOAD, async (_event, params: {download_id: string, download_dtl_ids: string[], destination: string}) => {
        
        const result = await downloadService.get_download_dtl_items(params.download_id, params.download_dtl_ids);

        if (!result.success) {
            return result;
        }

        let copiedPaths: string[] = [];
        try {

            const destinationHis = (await fsService.makeFolder(params.destination)).data || "";

            copiedPaths.push(destinationHis);

            for (const item of result.data || []) {
                const fileSubPath = item.bug_no + "/" + item.fileName;

                const copiedResult = await fsService.copy(item.full_file_path || "", fileSubPath, params.destination, destinationHis);

                if (!copiedResult.success) {
                    await fsService.deleteFile(copiedPaths);
                    return { success: false, message: "Thực hiện sao chép dữ liệu thất bại.."};
                }

                for (const path of copiedResult.data || []) {
                    const resUpd = await downloadService.update_path_after_copied(item.id, item.download_dtl_id || "", path.destination);

                    if (!resUpd.success) {
                        await fsService.deleteFile([path.destination]);
                        return { success: false, message: "Thực hiện sao chép dữ liệu thất bại.."};
                    }
                    copiedPaths.push(path.destination)
                }
            }

            return { success: true, message: "Thực hiện sao chép dữ liệu thành công.."};
        } catch (error) {
            await fsService.deleteFile(copiedPaths);
            return { success: false, message: (error as Error).message };
        }
    });
}