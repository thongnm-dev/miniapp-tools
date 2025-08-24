import { ipcMain } from 'electron';
import { s3Service } from '../services/s3-service';
import { IPC_CHANNEL_HANDLERS } from '../_/ipc-channel-handlers';
import * as fs from 'fs';
import { getWorkdir } from '../_/main-config';
import { StringUtils } from '../../core/utils/string-utils';
import { file_item } from '../../types/file_item';
import { aws_storage } from '../../types/aws_storage';

export const setupS3Handlers = () => {
  ipcMain.handle(IPC_CHANNEL_HANDLERS.S3_GET_ALL_STATES, async (_event, aws_storages: aws_storage[]) => {
    return await s3Service.get_all_s3objects(aws_storages);
  });

  ipcMain.handle(IPC_CHANNEL_HANDLERS.S3_GET_DOWNLOAD_LIST, async (_event, aws_cd: string) => {
    return await s3Service.get_aws_storage_list(aws_cd);
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

  ipcMain.handle(IPC_CHANNEL_HANDLERS.S3_DOWNLOAD_FILES, async (_event, params: {user_id: string, aws_cd: string, bug_list: string[], localPath: string}) => {
    return await s3Service.downloadFile(params);
  });

  // handle move object s3
  ipcMain.handle(IPC_CHANNEL_HANDLERS.S3_MOVE_OBJECT, async (_event, params: {aws_cd: string, file_items: string[]}) => {
    return await s3Service.moveObjectS3(params);
  });

  // handle move object s3
  ipcMain.handle(IPC_CHANNEL_HANDLERS.S3_UPLOAD_OBJECTS, 
      async (_event, params: { user_id: string, destination: string, is_folder_same_name: boolean, file_items: file_item[]}) => {
      return await s3Service.uploadFile(params);
  });

  ipcMain.handle(IPC_CHANNEL_HANDLERS.S3_DELETE_OBJECTS, 
      async (_event, params: { user_id: string, upload_id: string, ref_aws_cd: string, delete_items: {aws_cd: string, target: string}[]}) => {
    return await s3Service.deleteObjectS3(params);
  });

  ipcMain.handle(IPC_CHANNEL_HANDLERS.S3_DELETE_OBJECTS_DIRECTLY, 
      async (_event, params: { aws_cd: string, delete_items: {bug_no: string, subscribe: boolean}[]}) => {
    return await s3Service.deleteObjectS3Directly(params);
  });
}; 