import { upload_display_params } from "../types/param_interface";


export class UploadController {
    async display_upload_button(params: upload_display_params) {
        return await window.uploadAPI.display_upload_button(params);
    }
}

export const uploadController = new  UploadController();