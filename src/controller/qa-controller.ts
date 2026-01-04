import { qa_delete_params, qa_download_params, qa_upload_params } from "../types/param_interface";


export class QAController {

    async load(isTo: boolean) {
        return await window.QaAPI.load(isTo);
    }

    async upload(params: qa_upload_params) {
        return await window.QaAPI.upload(params);
    }

    async download(params: qa_download_params) {
        return await window.QaAPI.download(params);
    }

    async delete(params: qa_delete_params) {
        return await window.QaAPI.delete(params);
    }
} 

export const qaController = new QAController();