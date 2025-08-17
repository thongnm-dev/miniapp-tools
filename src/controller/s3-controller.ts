import { file_item } from "../types/file_item";

export class S3Controller {

    // handle fetch object state
    async handleGetAllState() {
        return await window.s3API.getAllStates();
    }

    async handleGetDownloadList() {
        return await window.s3API.getDownloadList();
    }

    async handleGetLocalPathSync() {
        return await window.s3API.getLocalPathSyncDir();
    }

    async handleDownloadFile(user_id: string, keys: string[], localPath: string) {
        return await window.s3API.downloadFile(user_id, keys, localPath);
    }

    // handle move object S3
    async handleMoveObjectS3(formData: {source: string, file_items: string[]}) {
        return await window.s3API.moveObjectS3(formData);
    }

    async handleUploadFile(params: { user_id: string, destination: string, is_folder_same_name: boolean, file_items: file_item []}) {
        return await window.s3API.uploadFile(params);
    }

    async handleDeleteObjects(params: { user_id: string, upload_id: string, relative_source: string, delete_items: {source: string, target: string}[]}) {
        return await window.s3API.deleteObjectS3(params);
    }
}

export const s3Controller = new S3Controller();