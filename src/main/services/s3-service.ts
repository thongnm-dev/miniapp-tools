import { S3Client, ListObjectsV2Command, ListObjectsV2Output, GetObjectCommand, CopyObjectCommand, DeleteObjectCommand, _Object, PutObjectRequest } from "@aws-sdk/client-s3";
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
    async getDownloadList(): Promise<ServiceReturn<{ [key: string]: { bugs: string[] } }>> {

        try {
            const bugs: { [key: string]: { state: string, path: string, bugs: string[] } } = {};

            const GET_LIST_OF_BUGS = FETCH_STATES_LIST.filter((item) => item.is_to_alx);
            for (const S3_GET_ITEM of GET_LIST_OF_BUGS) {
                let continuationToken: string | undefined = undefined;
                let _prefix_path = this.config.folderName + '/' + S3_GET_ITEM.path + '/' + S3_GET_ITEM.subscribe + '/';

                let folders: string[] = [];
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
                                folders.push(commonPrefix.Prefix);
                            }
                        });
                    }

                    continuationToken = response.NextContinuationToken;
                } while (continuationToken);

                bugs[S3_GET_ITEM.code] = {
                    state: S3_GET_ITEM.code,
                    path: S3_GET_ITEM.path + '/' + S3_GET_ITEM.subscribe,
                    bugs: folders.map(prefix => {
                        let trimmed = prefix.endsWith('/') ? prefix.slice(0, -1) : prefix;
                        let parts = trimmed.split('/');
                        return parts[parts.length - 1];
                    })
                }
            }
            return {
                success: true,
                data: bugs
            }
        } catch (err) {
            return {
                success: false, message: "The service have been occurs..."
            }
        }
    }

    // download file from s3
    async downloadFile(user_id: string, keys: string[], localPath: string): Promise<ServiceReturn<boolean>> {

        const paths_downloaded: string[] = [];
        try {
            if (StringUtils.isBlank(localPath)) {
                return { success: false, message: "The local path is blank." };
            }

            if (!await fsService.isExitDirectory(localPath)) {
                return { success: false, message: "The local path is not exist." };
            }

            const bugs_info: { [key: string]: { state: string, parent: string, bugs: string[] } } = {};

            const S3_FOLDER_GETLIST = FETCH_STATES_LIST.filter((item) => item.is_to_alx);

            // get bugs info
            const bugs_download = S3_FOLDER_GETLIST.filter((item) => keys.includes(item.code)) as { code: string, path: string, subscribe: string }[];

            // loop bugs download
            for (const bug_path_info of bugs_download) {
                let bugs: string[] = [];
                let continuationToken: string | undefined = undefined;

                // prefix path of bugs
                let _prefix_path = this.config.folderName + '/' + bug_path_info.path + '/' + bug_path_info.subscribe + '/';

                do {
                    const params = {
                        Bucket: this.config.bucketName,
                        Prefix: _prefix_path,
                        Delimiter: '/',
                        ContinuationToken: continuationToken,
                    };

                    const command = new ListObjectsV2Command(params);

                    // send command to s3
                    const response: ListObjectsV2Output = await this.s3.send(command);

                    if (response.CommonPrefixes) {
                        response.CommonPrefixes.forEach(commonPrefix => {
                            if (commonPrefix.Prefix) {
                                bugs.push(commonPrefix.Prefix);
                            }
                        });
                    }
                } while (continuationToken);

                // save bugs info
                bugs_info[bug_path_info.path] = {
                    state: bug_path_info.path,
                    parent: _prefix_path,
                    bugs: bugs.filter(folder => folder !== _prefix_path)
                }
            }

            // get date time
            let yyyyMMdd = DateUtils.getNow('yyyyMMdd');
            let hhmm = DateUtils.getNow('HHmm');
            const storage_path_local = localPath || getWorkdir().S3_LOCAL_SYNC_WORKDIR || path.join(__dirname, "/Temp/S3_DOWNLOAD");

            // loop bugs download
            let downloadResults: {
                state: string,
                user_id: string,
                date: string,
                time: string,
                sync_path: string,
                bug_attachs: { bug_no: string, last_modified?: Date, path: string, s3_path: string }[]
            }[] = [];

            for (const bug_path_info of bugs_download) {
                if (bugs_info[bug_path_info.path].bugs.length > 0) {
                    const state = bugs_info[bug_path_info.path].state;
                    let bug_attachs: Promise<{ bug_no: string, last_modified?: Date, path: string, s3_path: string }[]>[] = [];
                    const storage_path = storage_path_local + '/' + bugs_info[bug_path_info.path].state + '/' + yyyyMMdd + '/' + hhmm;
                    for (const bug of bugs_info[bug_path_info.path].bugs) {
                        bug_attachs.push(this.downloadFiles(bug, storage_path));
                    }
                    paths_downloaded.push(storage_path);
                    const bug_attachs_results = await Promise.all(bug_attachs);
                    downloadResults.push(
                        {
                            state: state,
                            date: yyyyMMdd,
                            time: hhmm,
                            user_id: user_id,
                            sync_path: storage_path,
                            bug_attachs: bug_attachs_results.flat()
                        }
                    );
                }
            }

            // insert fetch tran
            const result = await downloadService.ins_download(downloadResults);

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
    async uploadFile(params: { destination: string, fileUploads: {file_path: string, sub_bucket: string} }): Promise<ServiceReturn<string>> {
        try {
            let _destination_path = this.config.folderName + '/' + params.destination + '/';

            // for (const objectKey of formData.objectData) {
            //     _destination_path = _destination_path + objectKey.bug_no + "/"
            //     const params: PutObjectRequest = {
            //         Bucket: this.config.bucketName,
            //         Key: _destination_path
            //     };

            //     // await this.s3.send(params);
            // }
            return { success: true };
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
    public async moveObjectS3(formData: { source: string, destination: string, objectData: string[] }): Promise<ServiceReturn<string>> {

        try {
            const s3client = this.s3;

            async function listObjects(bucketName: string, prefix: string): Promise<_Object[]> {
                const command = new ListObjectsV2Command({
                    Bucket: bucketName,
                    Prefix: prefix,
                });
                const response = await s3client.send(command);
                return response.Contents || [];
            }

            const _source_path = this.config.folderName + '/' + formData.source + '/';
            const _destination_path = this.config.folderName + '/' + formData.destination + '/';

            for (const objectKey of formData.objectData) {
                let _source_bug_path = _source_path + objectKey + '/';
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

            const result = await downloadService.updateAfterMoveAtS3(formData.objectData);

            return {
                success: result.success,
                message: result.message
            }
        } catch (error) {
            return { success: false, message: (error as Error).message };
        }
    }

    // delete object
    public async deletObjectS3(formData: { source: string, objectData: string[] }): Promise<ServiceReturn<string>> {

        try {
            const s3client = this.s3;

            async function listObjects(bucketName: string, prefix: string): Promise<_Object[]> {
                const command = new ListObjectsV2Command({
                    Bucket: bucketName,
                    Prefix: prefix,
                });
                const response = await s3client.send(command);
                return response.Contents || [];
            }

            const _source_path = this.config.folderName + '/' + formData.source + '/';

            for (const objectKey of formData.objectData) {
                let _source_bug_path = _source_path + objectKey + '/';
                const objectDatas = await listObjects(this.config.bucketName, _source_bug_path) || [];

                const _objectTarget = objectDatas.filter((item) => item.Key !== _source_path);
                for (const objectData of _objectTarget) {
                    const oldKey = objectData.Key || "";
                    // perform delete object
                    const commandDelete = new DeleteObjectCommand({
                        Bucket: this.config.bucketName,
                        Key: oldKey
                    })

                    await this.s3.send(commandDelete);
                }
            }

            return { success: true, message: "Đã xoá thành công."}
        } catch (error) {
            return { success: false, message: (error as Error).message };
        }
    }
}

export const s3Service = new S3Service(getS3Config()); 