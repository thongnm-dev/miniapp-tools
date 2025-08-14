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

    async copy_and_update_path_download(params: {download_id: string, download_dtl_ids: string[], destination: string}) {
        return await window.downloadAPI.copy_and_update_path_download(params);
    }
}

export const downloadController = new DownloadController();