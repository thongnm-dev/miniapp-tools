import { ipcMain } from 'electron';
import { s3Service } from '../services/s3-service';
import { IPC_CHANNEL_HANDLERS } from '../_/ipc-channel-handlers';
import * as fs from 'fs';
import { getWorkdir } from '../_/main-config';
import { StringUtils } from '../../core/utils/string-utils';

export const setupS3Handlers = () => {
  ipcMain.handle(IPC_CHANNEL_HANDLERS.S3_GET_ALL_STATES, async (_event) => {
    return await s3Service.getAllStates();
  });

  ipcMain.handle(IPC_CHANNEL_HANDLERS.S3_GET_DOWNLOAD_LIST, async (_event) => {
    return await s3Service.getDownloadList();
  });

  ipcMain.handle(IPC_CHANNEL_HANDLERS.GET_S3_LOCAL_SYNC_WORKDIR, async (_event) => {

    const path = getWorkdir().S3_LOCAL_SYNC_WORKDIR;
    if (StringUtils.isBlank(path) || !await fs.existsSync(path)) {
      return {
        success: false,
        data: ""
      }
    }
    return {
      success: true,
      data: path
    };
  });

  ipcMain.handle(IPC_CHANNEL_HANDLERS.S3_DOWNLOAD_FILES, async (_event, keys: string[], localPath: string) => {
    return await s3Service.downloadFile(keys, localPath);
  });

  // handle move object s3
  ipcMain.handle(IPC_CHANNEL_HANDLERS.S3_MOVE_OBJECT, async (_event, formData: {source: string, destination: string, objectData: string[]}) => {
    return await s3Service.moveObjectS3(formData);
  });
}; 