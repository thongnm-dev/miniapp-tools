import { file_item } from "../types/file_item";

export class S3Controller {

    // handle fetch object state
    async handleGetAllState() {
        return await window.s3API.getAllStates();
    }

    async handleGetDownloadList(aws_cd: string) {
        return await window.s3API.get_aws_storage_list(aws_cd);
    }

    async handleGetLocalPathSync() {
        return await window.s3API.getLocalPathSyncDir();
    }

    async handleDownloadFile(params: {user_id: string, aws_cd: string, bug_list: string[], localPath: string}) {
        return await window.s3API.downloadFile(params);
    }

    // handle move object S3
    async handleMoveObjectS3(params: {aws_cd: string, file_items: string[]}) {
        return await window.s3API.moveObjectS3(params);
    }

    async handleUploadFile(params: { user_id: string, destination: string, is_folder_same_name: boolean, file_items: file_item []}) {
        return await window.s3API.uploadFile(params);
    }

    async handleDeleteObjects(params: { user_id: string, upload_id: string, ref_aws_cd: string, delete_items: {aws_cd: string, target: string}[]}) {
        return await window.s3API.deleteObjectS3(params);
    }
}

export const s3Controller = new S3Controller();