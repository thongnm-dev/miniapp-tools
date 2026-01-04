import { GetObjectCommand, ListObjectsV2Command, ListObjectsV2Output, paginateListObjectsV2, S3Client } from "@aws-sdk/client-s3";
import { S3Config } from "./s3-service";
import { getS3Config, getWorkdir } from "../_/main-config";
import { ServiceReturn } from "../@types/service-return";
import { qa_item } from "../../types/qa_item";
import { qa_delete_params, qa_download_params, qa_upload_params } from "../../types/param_interface";
import { appService } from "./app-service";
import { StringUtils } from "../../core/utils/string-utils";
import { fsService } from "./fs-service";
import { DateUtils } from "../../core/utils/date-utils";
import path from "path";
import { createWriteStream, existsSync, mkdirSync } from "fs";
import { Readable } from "stream";
import { pipeline } from 'stream/promises';

export class QAService {
    private s3: S3Client;
    private config: S3Config;
    private work_folders: Record<string, string> = {};

    private qa_targets: Record<string, string> = {
        'TO': 'alx ＝＞ ec',
        "FROM": 'ec ＝＞ alx'
    };

    constructor(config: S3Config) {
        this.config = config;

        this.s3 = new S3Client({
            region: config.region,
            credentials: {
                accessKeyId: config.accessKeyId,
                secretAccessKey: config.secretAccessKey,
            },
        });

        appService.get_aws_work_folder()
            .then(res => {
                if (res.success) {
                    this.work_folders = res.data || {};
                }
            })
    }

    async load(isTo: boolean): Promise<ServiceReturn<qa_item[]>> {

        let KEY = isTo ? 'TO' : 'FROM';
        let _prefix_path = this.work_folders['QA_SPECIFICATIONS'] + '/' + this.qa_targets[KEY] + '/';

        let continuationToken: string | undefined = undefined;
        const allObjects = [];
        do {
            const paginators = paginateListObjectsV2({ client: this.s3 }
                , {
                    Bucket: this.config.bucketName,
                    Delimiter: "/",
                    MaxKeys: 20,
                    Prefix: _prefix_path,
                    ContinuationToken: continuationToken
                });

            for await (const page of paginators) {
                if (page.CommonPrefixes) {
                    allObjects.push(...page.CommonPrefixes);
                }
                continuationToken = page.NextContinuationToken;
            }
        } while (continuationToken);

        const qa_items: qa_item[] = allObjects
            .slice(0, 20)
            .map((obj): qa_item => {
                const parts = obj.Prefix?.split('/') || [];

                const folderName = parts[parts.length - 2];

                return { name: folderName };
            });
        return { success: true, data: qa_items }
    }

    async upload(params: qa_upload_params): Promise<ServiceReturn<boolean>> {

        return { success: true, data: true }
    }

    async download(params: qa_download_params): Promise<ServiceReturn<boolean>> {

        const paths_downloaded: string[] = [];
        try {
            if (StringUtils.isBlank(params.localPath)) {
                return { success: false, message: "Đường dẫn nơi lưu chưa được thiết lập." };
            }

            if (!await fsService.isExitDirectory(params.localPath)) {
                return { success: false, message: "Đường dẫn nơi lưu không tồn tại." };
            }

            // prefix path of bugs
            let _prefix_path = this.work_folders['QA_SPECIFICATIONS'] + '/' + this.qa_targets[params.qa_target] + "/";

            // get date time
            let yyyyMMdd = DateUtils.getNow('yyyyMMdd');
            let hhmm = DateUtils.getNow('HHmm');
            const storage_path_local = params.localPath || getWorkdir().S3_LOCAL_SYNC_WORKDIR || path.join(__dirname, "/Temp/S3_DOWNLOAD");

            const storage_path = storage_path_local + '/' + yyyyMMdd + '/' + hhmm;
            for (const qa of params.qa_items) {
                const path_download = _prefix_path + qa + "/"
                await this.downloadFiles(path_download, storage_path, qa);
            }
            paths_downloaded.push(storage_path);

            return { success: true, message: "Đã tải về thành công!" };
        } catch (error) {
            await fsService.deleteFile(paths_downloaded);
            return { success: false, message: (error as Error).message };
        }
    }

    async delete(params: qa_delete_params): Promise<ServiceReturn<boolean>> {

        return { success: true, data: true }
    }

    private async downloadFiles(prefix: string, localPath: string, qa: string): Promise<void> {

        let continuationToken: string | undefined = undefined;
        do {
            const params = {
                Bucket: this.config.bucketName,
                Prefix: prefix,
                ContinuationToken: continuationToken,
                Delimiter: "/",
            };

            const command = new ListObjectsV2Command(params);
            const response: ListObjectsV2Output = await this.s3.send(command);
            const contents = response.Contents;

            for (const item of contents || []) {
                if (item.Key) {
                    const key = item.Key;
                    const fileName = key.split('/').pop();

                    if (fileName) {
                        let subPath = localPath + '/' + qa;
                        if (!existsSync(subPath)) {
                            mkdirSync(subPath, { recursive: true });
                        }

                        const localFilePath = `${subPath}/${fileName}`;
                        const getObjectParams = {
                            Bucket: this.config.bucketName,
                            Key: key,
                            Delimiter: "/",
                        };

                        const getObjectCommand = new GetObjectCommand(getObjectParams);
                        const data = await this.s3.send(getObjectCommand);
                        if (data.Body) {
                            const stream = data.Body as Readable;
                            const fileStream = createWriteStream(localFilePath);
                            await pipeline(stream, fileStream);
                        }
                    }
                }
            }
            continuationToken = response.NextContinuationToken;
        } while (continuationToken);
    }
}
export const qAService = new QAService(getS3Config());