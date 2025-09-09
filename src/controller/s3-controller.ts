import { aws_storage } from "../types/aws_storage";
import { delete_direct_s3object_params, delete_s3object_params, download_params, move_s3object_params, upload_params } from "../types/param_interface";

export class S3Controller {

    // handle fetch object state
    async get_all_s3objects(aws_storages: aws_storage[]) {
        return await window.s3API.get_all_s3objects(aws_storages);
    }

    async handleGetDownloadList(aws_cd: string) {
        return await window.s3API.get_aws_storage_list(aws_cd);
    }

    async handleGetLocalPathSync() {
        return await window.s3API.getLocalPathSyncDir();
    }

    async check_exist_to_download(aws_storages: aws_storage[]) {
        return await window.s3API.check_exist_to_download(aws_storages);
    }

    async handleDownloadFile(params: download_params) {
        return await window.s3API.downloadFile(params);
    }

    // handle move object S3
    async handleMoveObjectS3(params: move_s3object_params) {
        return await window.s3API.moveObjectS3(params);
    }

    async handleUploadFile(params: upload_params) {
        return await window.s3API.uploadFile(params);
    }

    async handleOnlyDeleteObjects(params: delete_direct_s3object_params) {
        return await window.s3API.delete_objects_direct(params);
    }

    async handleDeleteObjects(params: delete_s3object_params) {
        return await window.s3API.deleteObjectS3(params);
    }

    // FOR BI TOOLS
    async get_all_biobjects(aws_storages: aws_storage[]) {
        return await window.s3API.get_all_biobjects(aws_storages);
    }

    async handleDownloadBIFile(params: download_params) {
        return await window.s3API.downloadBIFile(params);
    }
}

export const s3Controller = new S3Controller();