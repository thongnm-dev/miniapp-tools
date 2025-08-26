import { DatabaseService } from "./database-service";
import { getDatabaseConfig } from "../_/main-config";
import { ServiceReturn } from "../@types/service-return";
import * as path from 'path';
import { download_item } from "../../types/download_item";
import { download_dtl_items_params, search_download_params, upd_after_copied_params } from "../../types/param_interface";

export class DownloadService {
    private db: DatabaseService;

    constructor(db: DatabaseService) {
        this.db = db;
    }

    // insert download logs
    async ins_download(params: {
        aws_cd: string,
        date: string,
        user_id: string,
        sync_path: string,
        bug_attachs: { bug_no: string, last_modified?: Date, path: string, s3_path: string }[]
    }): Promise<ServiceReturn<string>> {

        if (!this.db) {
            return { success: false };
        }
        try {
            const client = await this.db.getClient();
            await client.query(`BEGIN`);

            const result = await client.query(`
                    INSERT INTO download_hdr 
                        (download_ymd, download_hms, aws_cd, sync_path, download_count, created_by) 
                    VALUES
                        ($1, TO_CHAR(NOW() , 'HH24mmss'), $2, $3, $4, $5)
                    RETURNING id`,
                [params.date, params.aws_cd, params.sync_path, params.bug_attachs.length, params.user_id]);

            if (result?.rows[0]?.id) {
                let promise_dtl = [];
                for (const detail of params.bug_attachs) {
                    const download_id = result.rows[0].id;
                    promise_dtl.push(client.query(`
                        INSERT INTO download_dtl 
                            (download_id, bug_no, last_modified, sync_path) 
                        VALUES
                            ($1, $2, $3, $4)`, [download_id, detail.bug_no, detail.last_modified, detail.path]));
                }
                await Promise.all(promise_dtl);
            }

            await client.query(`COMMIT`);
            return { success: true }
        } catch (e) {
            (await this.db.getClient()).query("ROLLBACK")
            return { success: false, message: (e as Error).message }
        }
    }

    // get download logs
    async get_downloads(user_id: string): Promise<ServiceReturn<download_item[]>> {

        if (!this.db) {
            return { success: false };
        }
        try {
            const client = await this.db.getClient();
            const result = await client.query(`
                            SELECT
                                t1.id,
                                t1.download_ymd,
                                t1.download_hms,
                                t1.sync_path,
                                t1.download_count,
                                t3."name" AS aws_name
                            FROM download_hdr t1
                            INNER JOIN download_dtl t2
                                ON t1.id = t2.download_id
                            INNER JOIN aws_storage t3
                                ON t1.aws_cd = t3.code 
                            WHERE 1 = 1
                                AND t1.download_count > 0 
                                AND t1.is_moved_at_local = false
                                AND t1.created_by = $1
                            GROUP BY
                                t1.id,
                                t3."name",
                                t1.download_ymd,
                                t1.download_hms,
                                t1.sync_path,
                                t1.download_count
                            ORDER BY 
                                (t1.download_ymd || t1.download_hms) desc `, [user_id]);

            const download_items: download_item[] = [];
            for (const row of result?.rows || []) {
                download_items.push({
                    id: row.id,
                    download_ymd: row.download_ymd,
                    download_hms: row.download_hms,
                    sync_path: row.sync_path,
                    download_count: row.download_count,
                    aws_name: row.aws_name
                });
            }
            return { success: true, data: download_items };
        } catch (error) {
            return { success: false, message: "Đăng ký dữ liệu upload tập tin thất bại." };
        }
    }

    // get detail of download logs
    async get_download_dtls(download_id: string): Promise<ServiceReturn<download_item[]>> {
        if (!this.db) {
            return { success: false };
        }
        try {
            const client = await this.db.getClient();
            const result = await client.query(`
                        SELECT
                            t1.id,
                            t2.id AS download_dtl_id,
                            t1.download_ymd,
                            t2.bug_no,
                            to_char(t2.last_modified, 'yyyy/MM/dd HH24:mm:ss') AS last_modified,
                            t2.sync_path,
                            t2.path_copied,
                            t3."name" AS aws_name
                        FROM download_hdr t1
                        INNER JOIN download_dtl t2
                            ON t1.id = t2.download_id
                        INNER JOIN aws_storage t3
                            ON t1.aws_cd = t3.code 
                        WHERE 1 = 1
                            AND t1.id = $1
                        GROUP BY
                            t3."name",
                            t1.download_ymd,
                            t2.bug_no,
                            t2.last_modified,
                            t2.sync_path,
                            t2.path_copied,
                            t1.id,
                            t2.id
                        ORDER BY 
                            t3."name",
                            t2.bug_no,
                            t2.last_modified`, [download_id]);
            const download_items: download_item[] = [];
            for (const row of result?.rows || []) {

                const fileName = path.basename(row.sync_path);
                const file_path = path.dirname(row.sync_path);
                download_items.push({
                    id: row.download_dtl_id,
                    download_ymd: row.download_ymd,
                    bug_no: row.bug_no,
                    fileName: fileName,
                    file_path: file_path,
                    last_modified: row.download_hm,
                    sync_path: row.sync_path,
                    path_copied: row.path_copied,
                    aws_name: row.s3_state
                });
            }
            return { success: true, data: download_items };
        } catch (error) {
            return { success: false, message: (error as Error).message };
        }
    }

    // Get download detail item
    async get_download_dtl_items(params: download_dtl_items_params): Promise<ServiceReturn<download_item[]>> {
        if (!this.db) {
            return { success: false };
        }
        try {
            const client = await this.db.getClient();
            const result = await client.query(`
                        SELECT
                            t1.id,
                            t2.id AS download_dtl_id,
                            t2.bug_no,
                            t1.sync_path,
                            t2.sync_path AS full_file_path,
                            t2.path_copied
                        FROM download_hdr t1
                        INNER JOIN download_dtl t2
                            ON t1.id = t2.download_id
                        WHERE 1 = 1
                            AND t1.id = $1
                            AND t2.id = ANY($2)`, [params.download_id, params.download_dtl_ids]);
            const download_items: download_item[] = [];
            for (const row of result?.rows || []) {

                const fileName = path.basename(row.full_file_path);
                const file_path = path.dirname(row.full_file_path);
                download_items.push({
                    id: row.id,
                    download_dtl_id: row.download_dtl_id,
                    bug_no: row.bug_no,
                    fileName: fileName,
                    file_path: file_path,
                    sync_path: row.sync_path,
                    full_file_path: row.full_file_path
                });
            }
            return { success: true, data: download_items };
        } catch (error) {
            return { success: false, message: (error as Error).message };
        }
    }

    // check permit download action
    async allow_download(bugs: string[]): Promise<ServiceReturn<boolean>> {
        if (!this.db) {
            return { success: false };
        }

        try {
            const client = await this.db.getClient();
            const result = await client.query(`
                            SELECT
                                COUNT(*)
                            FROM (
                                SELECT 
                                    t2.bug_no
                                FROM download_hdr t1
                                INNER JOIN download_dtl t2
                                    ON t1.id = t2.download_id
                                WHERE 1 = 1
                                    AND t2.is_moved_at_s3 = false
                                    AND t2.bug_no = ANY($1::text[])
                                GROUP BY t2.bug_no
                             ) as t`, [bugs]);

            const rowCount = parseInt(result.rows[0].count, 10);

            if (rowCount == 0 && bugs.length > 0) {
                return { success: true, data: true };
            } else if (rowCount !== bugs.length) {
                return { success: true, data: true };
            }
            return { success: true, data: false };
        } catch (error) {
            return { success: false, message: (error as Error).message };
        }
    }

    // check move action
    async allow_remove(bugs: string[]): Promise<ServiceReturn<boolean>> {
        if (!this.db) {
            return { success: false };
        }

        try {
            const client = await this.db.getClient();
            const result = await client.query(`
                            SELECT
                                COUNT(*)
                            FROM (
                                SELECT 
                                    t2.bug_no
                                FROM download_hdr t1
                                INNER JOIN download_dtl t2
                                    ON t1.id = t2.download_id
                                WHERE 1 = 1
                                    AND t2.is_moved_at_s3 = false
                                    AND t2.bug_no = ANY($1::text[])
                                GROUP BY t2.bug_no
                            ) as t `, [bugs]);

            const rowCount = parseInt(result.rows[0].count, 10);

            if (rowCount == 0 && bugs.length > 0) {
                return { success: true, data: false };
            } else if (rowCount !== bugs.length) {
                return { success: true, data: false };
            }
            return { success: true, data: true };
        } catch (error) {
            return { success: false, message: (error as Error).message };
        }
    }

    // UPDATE STATUS AFTER MOVE AT S3
    async updateAfterMoveAtS3(bugs: string[]): Promise<ServiceReturn<boolean>> {
        if (!this.db) {
            return { success: false };
        }

        try {
            const client = await this.db.getClient();
            await client.query(`BEGIN`);
            await client.query(`
                UPDATE download_dtl SET 
                    is_moved_at_s3 = true
                WHERE 1 = 1
                    AND is_moved_at_s3 = false 
                    AND bug_no = ANY($1::text[]) `, [bugs]);
            await client.query(`COMMIT`);
            return { success: true, data: true };
        } catch (error) {
            (await this.db.getClient()).query("ROLLBACK")
            return { success: false, message: (error as Error).message };
        }
    }

    // update path
    async update_path_after_copied(params: upd_after_copied_params): Promise<ServiceReturn<boolean>> {
        if (!this.db) {
            return { success: false };
        }

        try {
            const client = await this.db.getClient();
            await client.query(`BEGIN`);
            await client.query(`
                UPDATE download_dtl SET 
                    path_copied = $1
                WHERE 1 = 1
                    AND id = $2
                    AND download_id = $3
                    `, [params.path_copied, params.download_dtl_id, params.download_id]);

            await client.query(`
                UPDATE download_hdr SET 
                    is_moved_at_local = true
                WHERE 1 = 1
                    AND download_count = (SELECT COUNT(1) FROM download_dtl WHERE download_id = $1 AND COALESCE(TRIM(path_copied), '') <> '' )
                    AND id = $1
                    `, [params.download_id]);
            await client.query(`COMMIT`);

            return { success: true, data: true };
        } catch (error) {
            (await this.db.getClient()).query("ROLLBACK")
            return { success: false, message: (error as Error).message };
        }
    }

    // search upload history
    async search_download_histories(params: search_download_params): Promise<ServiceReturn<download_item[]>> {
        try {

            const client = await this.db.getClient();
            const result = await client.query(`
                        SELECT
                              t1.id
                            , t1.download_ymd
                            , t1.aws_cd
                            , t3.name AS aws_name
                            , t1.is_moved_at_local
                            , t2.bug_no
                        FROM download_hdr t1
                        INNER JOIN download_dtl t2
                            ON t1.id = t2.download_id
                        INNER JOIN aws_storage t3
                            ON t1.aws_cd = t3.code 
                        WHERE 1 = 1
                            AND (
                                (TRIM($1) = '' AND TRIM($2) <> '' AND t1.download_ymd <= $2::TEXT)
                                OR (TRIM($1) <> '' AND TRIM($2) = '' AND t1.download_ymd >= $1::TEXT)
                                OR (TRIM($1) <> '' AND TRIM($2) <> '' AND t1.download_ymd BETWEEN $1::TEXT AND $2::TEXT)
                                OR (TRIM($1) = '' AND TRIM($2) = ''))
                            AND (TRIM($3) = '' OR t1.aws_cd = $3)
                            AND (TRIM($4) = '' OR t2.bug_no LIKE '%' ||$4|| '%')
                            AND ($5 = FALSE OR t1.is_moved_at_local = $5)
                            AND ($6 = FALSE OR t2.is_moved_at_s3 = $6)
                        GROUP BY
                              t1.id
                            , t1.download_ymd
                            , t1.aws_cd
                            , t3."name"
                            , t1.is_moved_at_local
                            , t2.bug_no
                        ORDER BY 
                              t1.download_ymd
                            , t1.aws_cd
                            , t2.bug_no
                    `, [params.from_date || "", params.to_date || "", params.aws_cd, params.bug_no, params.is_moved_at_local, params.is_moved_at_s3]);
            const upload_items: download_item[] = [];

            for (const row of result?.rows || []) {
                upload_items.push({
                    id: row.id,
                    download_ymd: row.download_ymd,
                    aws_name: row.aws_name,
                    is_moved_at_local: row.is_moved_at_local,
                    bug_no: row.bug_no,
                });
            }
            return { success: true, data: upload_items };
        } catch (err) {
            return { success: false, message: (err as Error).message }
        }
    }
}

export const downloadService = new DownloadService(new DatabaseService(getDatabaseConfig()));