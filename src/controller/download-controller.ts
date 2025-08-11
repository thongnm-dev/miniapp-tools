export class DownloadController {
    async get_downloads(user_id: string) {
        return await window.downloadAPI.get_downloads(user_id);
    }

    async get_download_dtls(fetchId: string) {
        return await window.downloadAPI.get_download_dtls(fetchId);
    }

    async allow_download(bugs: string[]) {
        return await window.downloadAPI.allow_download(bugs);
    }

    async allow_remove(bugs: string[]) {
        return await window.downloadAPI.allow_remove(bugs);
    }
}

export const downloadController = new DownloadController();