import { search_upload_params, upload_display_params } from "../types/param_interface";


export class UploadController {
    async display_upload_button(params: upload_display_params) {
        return await window.uploadAPI.display_upload_button(params);
    }

    async search_upload_histories(params: search_upload_params) {
        return await window.uploadAPI.search_upload_histories(params);
    }
}

export const uploadController = new  UploadController();