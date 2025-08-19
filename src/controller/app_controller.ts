

export class AppController {
    async get_all_items() {
        return await window.appAPI.get_all_items();
    }
    async get_download_items() {
        return await window.appAPI.get_download_items();
    }
    async get_upload_items() {
        return await window.appAPI.get_upload_items();
    }
    async get_delete_items(aws_cd: string) {
        return await window.appAPI.get_delete_items(aws_cd);
    }
}

export const appController = new  AppController();