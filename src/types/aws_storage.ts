export interface aws_storage {
    aws_cd: string,
    aws_name: string,
    aws_name_alias?: string,
    subscribe: string,
    is_upload?: boolean,
    is_download?: boolean,
    file_only?: boolean,
    link_available?: string[]
    exclude_subscribe?: string[]
}