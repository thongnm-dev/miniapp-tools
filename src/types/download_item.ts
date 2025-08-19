
export interface download_item {
    id: string,
    download_dtl_id?: string,
    download_ymd?: string, 
    download_hms?: string,
    sync_path: string, 
    download_count?: number, 
    aws_cd?: string,
    aws_name?: string,
    bug_no?: string,
    fileName?: string,
    file_path?: string,
    full_file_path?: string,
    last_modified?: string,
    path_copied?: string
}