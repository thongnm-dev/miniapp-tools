import { _Object, DeleteObjectCommand, GetObjectCommand, ListObjectsV2Command, ListObjectsV2Output, paginateListObjectsV2, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { S3Config } from "./s3-service";
import { getDatabaseConfig, getS3Config, getWorkdir } from "../_/main-config";
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
import { DatabaseService } from "./database-service";
import { file_item } from "../../types/file_item";

export class QAService {
    private s3: S3Client;
    private config: S3Config;
    private work_folders: Record<string, string> = {};
    private db: DatabaseService;

    private qa_targets: Record<string, string> = {
        'TO': 'alx ＝＞ ec',
        "FROM": 'ec ＝＞ alx'
    };

    constructor(config: S3Config, db: DatabaseService) {
        this.config = config;
        this.db = db;

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
                    Prefix: _prefix_path,
                    ContinuationToken: continuationToken,
                });

            for await (const page of paginators) {
                if (page.CommonPrefixes) {
                    allObjects.push(...page.CommonPrefixes);
                }
                continuationToken = page.NextContinuationToken;
            }
        } while (continuationToken);

        const qa_items: qa_item[] = allObjects
            .map((obj): qa_item => {
                const parts = obj.Prefix?.split('/') || [];

                const folderName = parts[parts.length - 2];

                return { name: folderName };
            }).sort((a, b) => b.name.localeCompare(a.name)).slice(0, 15);
        return { success: true, data: qa_items }
    }

    async upload(params: qa_upload_params): Promise<ServiceReturn<boolean>> {

        try {
            let yyyyMMdd = DateUtils.getNow('yyyyMMdd');
            let _destination_path = this.work_folders['QA_SPECIFICATIONS'] + '/' + this.qa_targets[params.qa_target] + "/";
            // let _destination_path = "80_system/Attach/11_alx/20_ＱＡ管理/alx ＝＞ ec/";

            if (!this.db) {
                return { success: false };
            }

            const client = await this.db.getClient();
            await client.query(`BEGIN`);
            const result = await client.query(`
                            SELECT
                                LPAD(COUNT(1) + 1 || '', 2, '0') AS qa_inc
                            FROM
                                qa
                            WHERE 1 = 1
                                AND upload_flg = true
                                AND qa_ymd = $1
                        `, [yyyyMMdd]);

            let qa_inc = result.rows[0].qa_inc;
            const sub_folder = yyyyMMdd + "_" + qa_inc;
            for (const item of params.qa_items) {
                const result = await fsService.readFileToStream(item.full_path);
                if (!result.success) {
                    continue
                }

                let split = item.full_path.indexOf(item.parent_name);

                let child_folder = item.full_path.substring(split + item.parent_name.length + 1, item.full_path.length);

                let destination_path = _destination_path + sub_folder + "/" + item.parent_name + "/" + child_folder.replace("\\", "/");

                const _params = new PutObjectCommand({
                    Bucket: this.config.bucketName,
                    Key: destination_path,
                    Body: result.data
                });
                await this.s3.send(_params);
            }

            await client.query(`
                INSERT INTO qa 
                    (qa_ymd, qa_inc, upload_flg, uploaded, uploaded_count, created_by) 
                VALUES
                    ($1, $2, true, true, 0, $3)
                RETURNING id`,
            [yyyyMMdd, qa_inc, params.user_id]);

            // const grouped = params.qa_items.reduce((acc: { [key: string]: file_item[] }, item) => {
            //     if (!acc[item.parent_name]) {
            //         acc[item.parent_name] = [];
            //     }
            //     // Push the current item into its category array
            //     acc[item.parent_name].push(item);

            //     return acc;
            // }, {});

            // for (const [folder, children] of Object.entries(grouped)) {
            //     const regex = /^\d{8}_\d{2}$/;
            //     const isValid = regex.test(folder);
            //     let qa_ymd = isValid ? folder.split("_")[0] : yyyyMMdd;
            //     let qa_inc = isValid ? folder.split("_")[1] : "";
                
            //     if (!isValid) {
            //         const result = await client.query(`
            //                 SELECT
            //                     LPAD(COUNT(1) + 1 || '', 2, '0') AS qa_inc
            //                 FROM
            //                     qa
            //                 WHERE 1 = 1
            //                     AND upload_flg = true
            //                     AND qa_ymd = $1
            //             `, [yyyyMMdd]);

            //         qa_inc = result.rows[0].qa_inc;
            //     }
                
            //     let sub_folder = qa_ymd + "_" + qa_inc;
            //     for (const item of children) {
            //         const result = await fsService.readFileToStream(item.full_path);
            //         if (!result.success) {
            //             continue
            //         }
            //         let destination_path = _destination_path + sub_folder + "/" + item.name;

            //         if (item.sub_folder) {
            //             destination_path = _destination_path + sub_folder + "/" + item.sub_folder.replace("\\", "/");
            //         }
            //         const _params = new PutObjectCommand({
            //             Bucket: this.config.bucketName,
            //             Key: destination_path,
            //             Body: result.data
            //         });
            //         await this.s3.send(_params);
            //     }

            //     await client.query(`
            //         INSERT INTO qa 
            //             (qa_ymd, qa_inc, upload_flg, uploaded, uploaded_count, created_by) 
            //         VALUES
            //             ($1, $2, true, true, 0, $3)
            //         RETURNING id`,
            //     [qa_ymd, qa_inc, params.user_id]);
            // }

            await client.query(`COMMIT`);
            return { success: true, data: true }

        } catch (error) {
            (await this.db.getClient()).query("ROLLBACK");
            return { success: false, message: (error as Error).message };
        }
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

        try {
            let _prefix_path = this.work_folders['QA_SPECIFICATIONS'] + '/' + this.qa_targets[params.qa_target] + "/";

            let results = [];
            for (const qa_item of params.qa_items) {
                let _source_bug_path = _prefix_path + qa_item + '/';
                const objectDatas = await this.listObjects(this.config.bucketName, _source_bug_path) || [];
                const _objectTarget = objectDatas.filter((item) => item.Key !== _source_bug_path);

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
            }
            return { success: true, data: true }
        } catch (error) {
            return { success: false, message: (error as Error).message };
        }
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

    private async listObjects(bucketName: string, prefix: string): Promise<_Object[]> {
        const command = new ListObjectsV2Command({
            Bucket: bucketName,
            Prefix: prefix,
        });
        const response = await this.s3.send(command);
        return response.Contents || [];
    }
}
export const qAService = new QAService(getS3Config(), new DatabaseService(getDatabaseConfig()));