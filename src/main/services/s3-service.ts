import { S3Client, ListObjectsV2Command, ListObjectsV2Output, GetObjectCommand, CopyObjectCommand, DeleteObjectCommand, _Object, PutObjectCommand } from "@aws-sdk/client-s3";
import { getS3Config, getWorkdir } from '../_/main-config';
import { FETCH_STATES_LIST } from "../../config/constants";
import { Readable } from "stream";
import { pipeline } from 'stream/promises';
import { createWriteStream, existsSync, mkdirSync } from "fs";
import { DateUtils } from "../../core/utils/date-utils";
import { downloadService } from "./download-service";
import { fsService } from "./fs-service";
import { ServiceReturn } from "../@types/service-return";
import { StringUtils } from "../../core/utils/string-utils";
import path from "path";
import { file_item } from "../../types/file_item";
import { uploadService } from "./upload-service";
import { upload_item } from "../../types/upload_item";
import { aws_storage } from "../../types/aws_storage";
import { appService } from "./app-service";

export interface S3Config {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucketName: string;
    folderName: string;
}

export class S3Service {
    private s3: S3Client;
    private config: S3Config;

    constructor(config: S3Config) {
        this.config = config;

        this.s3 = new S3Client({
            region: config.region,
            credentials: {
                accessKeyId: config.accessKeyId,
                secretAccessKey: config.secretAccessKey,
            },
        });
    }

    // fetch state from s3
    async getAllStates(): Promise<{ success: boolean; data?: { [key: string]: { bugs: { bug_no: string; message: string }[] } }; message?: string }> {
        try {

            const bug_list: { [key: string]: { state: string, bugs: { bug_no: string; message: string }[] } } = {};

            for (const S3_GET_ITEM of FETCH_STATES_LIST) {
                let continuationToken: string | undefined = undefined;

                let _prefix_path = this.config.folderName + '/' + S3_GET_ITEM.path + '/';

                let bug_no_list_moved: string[] = [];
                do {
                    const params = {
                        Bucket: this.config.bucketName,
                        Prefix: _prefix_path,
                        Delimiter: "/",
                        ContinuationToken: continuationToken,
                    };

                    const command = new ListObjectsV2Command(params);
                    const response: ListObjectsV2Output = await this.s3.send(command);

                    if (response.CommonPrefixes) {
                        response.CommonPrefixes.forEach(commonPrefix => {
                            if (commonPrefix.Prefix && !commonPrefix.Prefix.includes(S3_GET_ITEM.subscribe)) {
                                bug_no_list_moved.push(commonPrefix.Prefix);
                            }
                        });
                    }

                    continuationToken = response.NextContinuationToken;
                } while (continuationToken);

                continuationToken = undefined;
                _prefix_path = this.config.folderName + '/' + S3_GET_ITEM.path + '/' + S3_GET_ITEM.subscribe + "/";
                let bug_no_list_not_moved: string[] = [];
                do {
                    const params = {
                        Bucket: this.config.bucketName,
                        Prefix: _prefix_path,
                        Delimiter: "/",
                        ContinuationToken: continuationToken,
                    };

                    const command = new ListObjectsV2Command(params);
                    const response: ListObjectsV2Output = await this.s3.send(command);

                    if (response.CommonPrefixes) {
                        response.CommonPrefixes.forEach(commonPrefix => {
                            if (commonPrefix.Prefix) {
                                bug_no_list_not_moved.push(commonPrefix.Prefix);
                            }
                        });
                    }

                    continuationToken = response.NextContinuationToken;
                } while (continuationToken);

                const bug_no_list_moved_map = bug_no_list_moved
                    .map(prefix => {
                        let trimmed = prefix.endsWith('/') ? prefix.slice(0, -1) : prefix;
                        let parts = trimmed.split('/');
                        return {
                            bug_no: parts[parts.length - 1],
                            message: ""
                        };
                    });

                const bug_no_list_not_moved_map = bug_no_list_not_moved
                    .map(prefix => {
                        let trimmed = prefix.endsWith('/') ? prefix.slice(0, -1) : prefix;
                        let parts = trimmed.split('/');
                        return {
                            bug_no: parts[parts.length - 1],
                            message: "Chưa di chuyển ra ngoài..!"
                        };
                    });

                const bug_no_list = [...bug_no_list_moved_map, ...bug_no_list_not_moved_map];
                bug_list[S3_GET_ITEM.code] = {
                    state: S3_GET_ITEM.code,
                    bugs: bug_no_list
                }
            }

            return { success: true, data: bug_list };
        } catch (error) {
            return { success: false, message: (error as Error).message };
        }
    }

    // fetch to download
    async get_aws_storage_list(aws_cd: string): Promise<ServiceReturn<string[]>> {

        try {
            const result_getaws = await appService.get_aws_item(aws_cd);

            if (!result_getaws.success || !result_getaws.data) {
                return { success: false, message: "Thông tin nơi lưu trữ trên S3 không tồn tại." };
            }

            const S3_OBJECT_TARGET = result_getaws.data || {} as aws_storage;

            let continuationToken: string | undefined = undefined;
            let _prefix_path = this.config.folderName + '/' + S3_OBJECT_TARGET.aws_name + '/' + S3_OBJECT_TARGET.subscribe + '/';

            let bugs: string[] = [];
            do {
                const params = {
                    Bucket: this.config.bucketName,
                    Prefix: _prefix_path,
                    Delimiter: "/",
                    ContinuationToken: continuationToken,
                };

                const command = new ListObjectsV2Command(params);
                const response: ListObjectsV2Output = await this.s3.send(command);

                if (response.CommonPrefixes) {
                    response.CommonPrefixes.forEach(commonPrefix => {
                        if (commonPrefix.Prefix) {
                            bugs.push(commonPrefix.Prefix);
                        }
                    });
                }

                continuationToken = response.NextContinuationToken;
            } while (continuationToken);

            const result = bugs.map(prefix => {
                let trimmed = prefix.endsWith('/') ? prefix.slice(0, -1) : prefix;
                let parts = trimmed.split('/');
                return parts[parts.length - 1];
            })
            return { success: true, data: result }
        } catch (error) {
            return { success: false, message: (error as Error).message };
        }
    }

    // download file from s3
    async downloadFile(params: { user_id: string, aws_cd: string, bug_list: string[], localPath: string }): Promise<ServiceReturn<boolean>> {

        const paths_downloaded: string[] = [];
        try {
            if (StringUtils.isBlank(params.localPath)) {
                return { success: false, message: "Đường dẫn nơi lưu chưa được thiết lập." };
            }

            if (!await fsService.isExitDirectory(params.localPath)) {
                return { success: false, message: "Đường dẫn nơi lưu không tồn tại." };
            }

            // get bugs info
            const result_getaws = await appService.get_aws_item(params.aws_cd);

            if (!result_getaws.success || !result_getaws.data) {
                return { success: false, message: "Thông tin nơi lưu trữ trên S3 không tồn tại." };
            }

            const S3_OBJECT_TARGET = result_getaws.data || {} as aws_storage;

            // prefix path of bugs
            let _prefix_path = this.config.folderName + '/' + S3_OBJECT_TARGET.aws_name + '/' + S3_OBJECT_TARGET.subscribe + '/';

            // get date time
            let yyyyMMdd = DateUtils.getNow('yyyyMMdd');
            let hhmm = DateUtils.getNow('HHmm');
            const storage_path_local = params.localPath || getWorkdir().S3_LOCAL_SYNC_WORKDIR || path.join(__dirname, "/Temp/S3_DOWNLOAD");

            let bug_attachs: Promise<{ bug_no: string, last_modified?: Date, path: string, s3_path: string }[]>[] = [];
            const storage_path = storage_path_local + '/' + S3_OBJECT_TARGET.aws_name + '/' + yyyyMMdd + '/' + hhmm;
            for (const bug of params.bug_list) {
                const path_download = _prefix_path + bug + "/"
                bug_attachs.push(this.downloadFiles(path_download, storage_path));
            }
            paths_downloaded.push(storage_path);
            const bug_attachs_results = await Promise.all(bug_attachs);
            const param_ins =
            {
                aws_cd: S3_OBJECT_TARGET.aws_cd,
                date: yyyyMMdd,
                user_id: params.user_id,
                sync_path: storage_path,
                bug_attachs: bug_attachs_results.flat()
            }

            // insert fetch tran
            const result = await downloadService.ins_download(param_ins);

            if (!result.success) {
                await fsService.deleteFile(paths_downloaded);
            }
            return { success: result.success, message: result.message };
        } catch (error) {

            await fsService.deleteFile(paths_downloaded);
            return { success: false, message: (error as Error).message };
        }
    }

    // download directory from s3
    private async downloadFiles(prefix: string, localPath: string):
        Promise<{ bug_no: string, last_modified?: Date, path: string, s3_path: string }[]> {

        let continuationToken: string | undefined = undefined;

        let result: { bug_no: string, last_modified?: Date, path: string, s3_path: string }[] = [];

        do {
            const params = {
                Bucket: this.config.bucketName,
                Prefix: prefix,
                Delimiter: '/',
                ContinuationToken: continuationToken,
            };

            const command = new ListObjectsV2Command(params);
            const response: ListObjectsV2Output = await this.s3.send(command);
            const contents = response.Contents;

            if (contents) {
                await Promise.all(
                    contents.map(async (object) => {
                        if (object.Key) {
                            const key = object.Key;
                            const LastModified = object.LastModified;
                            const fileName = key.split('/').pop();
                            if (fileName) {
                                // Remove trailing slash if present
                                const trimmed = prefix.endsWith('/') ? prefix.slice(0, -1) : prefix;
                                // Split by slash and return the last part
                                const parts = trimmed.split('/');
                                const bug_no = parts[parts.length - 1];
                                let subPath = localPath + '/' + bug_no;

                                if (!existsSync(subPath)) {
                                    mkdirSync(subPath, { recursive: true });
                                }

                                const localFilePath = `${subPath}/${fileName}`;
                                const getObjectParams = {
                                    Bucket: this.config.bucketName,
                                    Key: key,
                                };

                                const getObjectCommand = new GetObjectCommand(getObjectParams);
                                const data = await this.s3.send(getObjectCommand);
                                if (data.Body) {
                                    const stream = data.Body as Readable;
                                    const fileStream = createWriteStream(localFilePath);
                                    await pipeline(stream, fileStream);

                                    // storage download info
                                    result.push({
                                        bug_no: bug_no,
                                        last_modified: LastModified || undefined,
                                        path: localFilePath,
                                        s3_path: key
                                    });
                                }
                            }
                        }
                    })
                );
            }

            continuationToken = response.NextContinuationToken;
        } while (continuationToken);

        return result;
    }

    // upload file to s3
    async uploadFile(params: { user_id: string, destination: string, is_folder_same_name: boolean, file_items: file_item[] }):
        Promise<ServiceReturn<{ upload_id: string, uploaded_items: upload_item[] }>> {
        try {

            const result_getaws = await appService.get_aws_item(params.destination);

            if (!result_getaws.success || !result_getaws.data) {
                return { success: false, message: "Thông tin nơi lưu trữ trên S3 không tồn tại." };
            }

            const S3_OBJECT_TARGET = result_getaws.data || {} as aws_storage;

            let _destination_path = this.config.folderName + '/' + S3_OBJECT_TARGET.aws_name + '/' + S3_OBJECT_TARGET.subscribe + "/";

            let results = [];
            let uploaded_items: file_item[] = [];

            for (const item of params.file_items) {
                const result = await fsService.readFileToStream(item.full_path);
                if (!result.success) {
                    continue
                }

                let destination_path = _destination_path + item.parent_name + "/" + item.name;

                if (S3_OBJECT_TARGET.aws_cd === "01" && params.is_folder_same_name) {
                    let parent_name = path.basename(item.full_path, path.extname(item.full_path));;
                    destination_path = _destination_path + parent_name + "/" + item.name;
                    item.parent_name = parent_name;
                }
                try {
                    const params = new PutObjectCommand({
                        Bucket: this.config.bucketName,
                        Key: destination_path,
                        Body: result.data
                    });
                    results.push(this.s3.send(params));
                    uploaded_items.push(item);
                } catch { }
            }

            await Promise.all(results);

            const param_ins = {
                user_id: params.user_id,
                state: S3_OBJECT_TARGET.aws_cd,
                file_items: uploaded_items,
                is_folder_same_name: params.is_folder_same_name
            }

            const resultIns = await uploadService.ins_upload(param_ins);

            if (!resultIns.success) {
                return { success: false, message: resultIns.message };
            }

            if (params.is_folder_same_name) {
                const listData = uploaded_items.map((file) => { return { bug_no: file.parent_name, file_name: file.name } as upload_item; });

                const result_data = {
                    upload_id: resultIns.data || "",
                    uploaded_items: listData
                }
                return { success: true, message: "Đã thực hiện tải tập thành công", data: result_data };
            }

            const params_getuploaded = {
                user_id: params.user_id,
                aws_cd: S3_OBJECT_TARGET.aws_cd,
                upload_id: resultIns.data || "",
            };

            const result_uploaded = await uploadService.get_uploaded_items(params_getuploaded);

            if (!result_uploaded.success) {
                const listData = uploaded_items.map((file) => { return { bug_no: file.parent_name, file_name: file.name } as upload_item; });

                const result_data = {
                    upload_id: params_getuploaded.upload_id,
                    uploaded_items: listData
                }
                return { success: true, message: result_uploaded.message, data: result_data };
            }

            const result_data = {
                upload_id: params_getuploaded.upload_id,
                uploaded_items: result_uploaded.data || []
            }
            return { success: true, data: result_data };
        } catch (error) {
            return { success: false, message: (error as Error).message };
        }
    }

    // copy object from the folder to another folder
    public async copyObject(sourceKey: string, destinationKey: string): Promise<ServiceReturn<{ src: string, des: string }>> {

        try {
            const command = new CopyObjectCommand({
                Bucket: this.config.bucketName,
                CopySource: encodeURIComponent(`${this.config.bucketName}/${sourceKey}`),
                Key: destinationKey
            })

            await this.s3.send(command);

            const result = {
                src: sourceKey,
                des: destinationKey
            }

            return {
                success: true,
                data: result
            }
        } catch (error) {
            return { success: false, message: (error as Error).message };
        }
    }

    // move object from the folder to another folder
    public async moveObjectS3(params: { aws_cd: string, file_items: string[] }): Promise<ServiceReturn<string>> {

        try {

            const result_getaws = await appService.get_aws_item(params.aws_cd);

            if (!result_getaws.success || !result_getaws.data) {
                return { success: false, message: "Thông tin nơi lưu trữ trên S3 không tồn tại." };
            }
            const S3_OBJECT_TARGET = result_getaws.data || {} as aws_storage;
            const s3client = this.s3;

            async function listObjects(bucketName: string, prefix: string): Promise<_Object[]> {
                const command = new ListObjectsV2Command({
                    Bucket: bucketName,
                    Prefix: prefix,
                });
                const response = await s3client.send(command);
                return response.Contents || [];
            }

            const _source_path = this.config.folderName + '/' + S3_OBJECT_TARGET.aws_name + '/' + S3_OBJECT_TARGET.subscribe + "/";
            const _destination_path = this.config.folderName + '/' + S3_OBJECT_TARGET.aws_name + '/';

            for (const item of params.file_items) {
                let _source_bug_path = _source_path + item + '/';
                const objectDatas = await listObjects(this.config.bucketName, _source_bug_path) || [];

                const _objectTarget = objectDatas.filter((item) => item.Key !== _source_path);
                for (const objectData of _objectTarget) {
                    const oldKey = objectData.Key || "";
                    const newKey = objectData.Key?.replace(_source_path, _destination_path) || "";

                    // perform copy object
                    const commandCopy = new CopyObjectCommand({
                        Bucket: this.config.bucketName,
                        CopySource: encodeURIComponent(`${this.config.bucketName}/${oldKey}`),
                        Key: newKey
                    });

                    await this.s3.send(commandCopy);

                    // perform delete object
                    const commandDelete = new DeleteObjectCommand({
                        Bucket: this.config.bucketName,
                        Key: oldKey
                    })

                    await this.s3.send(commandDelete);
                }
            }

            const result = await downloadService.updateAfterMoveAtS3(params.file_items);

            return {
                success: result.success,
                message: result.message
            }
        } catch (error) {
            return { success: false, message: (error as Error).message };
        }
    }

    // delete object
    public async deleteObjectS3(params: { user_id: string, upload_id: string, ref_aws_cd: string, delete_items: { aws_cd: string, target: string }[] }):
        Promise<ServiceReturn<string[]>> {

        try {

            const result = await appService.get_delete_items(params.ref_aws_cd);

            if (!result.success || result.data?.length == 0) {
                return { success: false, message: "Thông tin nơi lưu trữ trên S3 không tồn tại." };
            }
            const S3_OBJECT_TARGET = result.data || [];

            for (const delete_item of params.delete_items) {
                if (!S3_OBJECT_TARGET.find((item) => item.aws_cd === delete_item.aws_cd)) {
                    return { success: false, message: "Thông tin thiết lập đích xoá trên S3 không khớp." };
                }
            }

            const s3client = this.s3;

            async function listObjects(bucketName: string, prefix: string): Promise<_Object[]> {
                const command = new ListObjectsV2Command({
                    Bucket: bucketName,
                    Prefix: prefix,
                });
                const response = await s3client.send(command);
                return response.Contents || [];
            }

            let results = [];
            let deleted_items: Set<string> = new Set();
            for (const delete_item of params.delete_items) {
                const TARGET_DELETE = S3_OBJECT_TARGET.find((item) => item.aws_cd === delete_item.aws_cd) as aws_storage;
                const _source_path = this.config.folderName + '/' + TARGET_DELETE.aws_name + '/';
                let _source_bug_path = _source_path + delete_item.target + '/';
                const objectDatas = await listObjects(this.config.bucketName, _source_bug_path) || [];
                const _objectTarget = objectDatas.filter((item) => item.Key !== _source_path);

                for (const objectData of _objectTarget) {
                    try {
                        const oldKey = objectData.Key || "";
                        // perform delete object
                        const commandDelete = new DeleteObjectCommand({
                            Bucket: this.config.bucketName,
                            Key: oldKey
                        })
                        results.push(this.s3.send(commandDelete));
                    } catch { }
                }
                await Promise.all(results);
                deleted_items.add(delete_item.target);
            }

            const OBJECT_TARGET = FETCH_STATES_LIST.filter((item) => item.code === params.ref_aws_cd && item.is_to_alx === false)[0];
            const param_upd = {
                state: OBJECT_TARGET.path,
                upload_id: params.upload_id,
                selected_items: Array.from(deleted_items)
            }
            await uploadService.update_state_after_move(param_upd);
            return { success: true, message: "Đã xoá thành công.", data: Array.from(deleted_items) }
        } catch (error) {
            return { success: false, message: (error as Error).message };
        }
    }
}

export const s3Service = new S3Service(getS3Config()); 