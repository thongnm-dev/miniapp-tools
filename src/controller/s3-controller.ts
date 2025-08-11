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

    async handleDownloadFile(keys: string[], localPath: string) {
        return await window.s3API.downloadFile(keys, localPath);
    }

    // handle move object S3
    async handleMoveObjectS3(formData: {source: string, destination: string, objectData: string[]}) {
        return await window.s3API.moveObjectS3(formData);
    }
}

export const s3Controller = new S3Controller();