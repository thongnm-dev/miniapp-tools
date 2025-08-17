

export class UploadController {
    async display_upload_button(params: { user_id: string, state: string, upload_id: string, select_items: string[]}) {
        return await window.uploadAPI.display_upload_button(params);
    }
}

export const uploadController = new  UploadController();