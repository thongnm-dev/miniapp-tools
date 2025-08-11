export class S3Controller {

    // handle fetch object state
    async handleFetchObjectState() {
        return await window.s3API.fetchObjectState();
    }

    async handlePullAllObjects() {
        return await window.s3API.pullAllObjects();
    }

    async handlePullObjectToDownload() {
        return await window.s3API.pullObjectToDownload();
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