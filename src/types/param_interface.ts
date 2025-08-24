import { file_item } from "./file_item"

//*****************************
// upload parameter
//*****************************
export interface search_upload_params {
    from_date?: string, 
    to_date?: string, 
    aws_cd?: string, 
    bug_no?: string, 
    is_moved_at_s3?: boolean
}

export interface upload_params {
    user_id: string, 
    destination: string, 
    is_folder_same_name: boolean, 
    file_items: file_item []
}

export interface upload_display_params {
    user_id: string, 
    state: string, 
    upload_id: string, 
    select_items: string[] 
}

export interface update_after_move_params {
    aws_cd: string, 
    upload_id: string, 
    selected_items: string[] 
}

export interface get_uploaded_params {
    user_id: string, 
    aws_cd: string, 
    upload_id: string
}
//*****************************
// download parameter
//*****************************

export interface search_download_params {
    from_date?: string, 
    to_date?: string, 
    aws_cd?: string, 
    bug_no?: string, 
    is_moved_at_s3?: boolean,
    is_moved_at_local?: boolean,
}

export interface download_params {
    user_id: string, 
    aws_cd: string, 
    bug_list: string[], 
    localPath: string
}

export interface delete_s3object_params {
    user_id: string, 
    upload_id: string, 
    ref_aws_cd: string, 
    delete_items: { aws_cd: string, target: string }[] 
}

export interface delete_direct_s3object_params {
    aws_cd: string, 
    delete_items: {bug_no: string, subscribe: boolean}[]
}

export interface move_s3object_params {
    aws_cd: string, 
    file_items: string[]
}

export interface copy_s3object_params {
    sourceKey: string, 
    destinationKey: string
}

export interface copy_and_update_download_params {
    download_id: string, 
    destination: string
    download_dtl_ids: string[],
}

export interface upd_after_copied_params {
    download_id: string, 
    download_dtl_id: string, 
    path_copied: string
}

export interface download_dtl_items_params {
    download_id: string, 
    download_dtl_ids: string[]
}