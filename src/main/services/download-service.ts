import { DatabaseService } from "./database-service";
import { getDatabaseConfig } from "../_/main-config";
import { ServiceReturn } from "../@types/service-return";
import * as path from 'path';

export interface download_item {
    id: number, 
    download_ymd: string, 
    download_hm?: string, 
    sync_path: string, 
    download_count?: number, 
    s3_state: string,
    bug_no?: string,
    fileName?: string,
    file_path?: string,
    last_modified?: string,
    path_copied?: string
}

export class DownloadService {
    private db: DatabaseService;

    constructor(db: DatabaseService) {
        this.db = db;
    }

    // insert tran logs
    async ins_download(dataObjects: {
        state: string,
        date: string,
        time: string,
        user_id: string,
        sync_path: string,
        bug_attachs: { bug_no: string, last_modified?: Date, path: string, s3_path: string }[]
    }[]): Promise<ServiceReturn<string>> {

        if (!this.db) {
            return { success: false };
        }
        try {
            const client = await this.db.getClient();
            await client.query(`BEGIN`);
            for (const data of dataObjects) {
                const result = await client.query(`
                        INSERT INTO download_hdr 
                            (download_ymd, download_hm, s3_state, sync_path, download_count, created_by) 
                        VALUES
                            ($1, $2, $3, $4, $5, $6)
                        RETURNING id`,
                    [data.date, data.time, data.state, data.sync_path, data.bug_attachs.length, data.user_id]);

                if (result?.rows[0]?.id) {
                    for (const detail of data.bug_attachs) {
                        const download_id = result.rows[0].id;
                        await client.query(`
                            INSERT INTO download_dtl 
                                (download_id, bug_no, last_modified, sync_path, s3_state) 
                            VALUES
                                ($1, $2, $3, $4, $5)`, [download_id, detail.bug_no, detail.last_modified, detail.path, data.state]);
                    }
                }
            }

            await client.query(`COMMIT`);
            return { success: true }
        } catch (e) {
            return { success: false, message: (e as Error).message }
        }
    }

    // get fetch trans
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
                                t1.download_hm,
                                t1.sync_path,
                                t1.download_count,
                                t1.s3_state
                            FROM download_hdr t1
                            INNER JOIN download_dtl t2
                                ON t1.id = t2.download_id
                            WHERE 1 = 1
                                AND t1.download_count > 0 
                                AND t1.is_moved_at_local = false
                                AND t1.created_by = $1
                            GROUP BY
                                t1.id,
                                t1.s3_state,
                                t1.download_ymd,
                                t1.download_hm,
                                t1.sync_path,
                                t1.download_count
                            ORDER BY 
                                (t1.download_ymd || t1.download_hm) desc `, [user_id]);

            const fetchTrans: {id: number, download_ymd: string, download_hm: string, sync_path: string, download_count: number, s3_state: string}[] = [];
            for (const row of result?.rows || []) {
                fetchTrans.push({
                    id: row.id,
                    download_ymd: row.download_ymd,
                    download_hm: row.download_hm,
                    sync_path: row.sync_path,
                    download_count: row.download_count,
                    s3_state: row.s3_state
                });
            }
            return { success: true, data: fetchTrans };
        } catch (error) {
            return { success: false, message: (error as Error).message };
        }
    }

    // fetch
    async get_download_dtls(fetchId: string): Promise<ServiceReturn<download_item[]>> {
        if (!this.db) {
            return { success: false };
        }
        try {
            const client = await this.db.getClient();
            const result = await client.query(`
                        SELECT
                            t1.id,
                            t1.download_ymd,
                            t2.bug_no,
                            to_char(t2.last_modified, 'yyyy/MM/dd HH24:mm:ss') AS last_modified,
                            t2.sync_path,
                            t2.path_copied,
                            t2.s3_state
                        FROM download_hdr t1
                        INNER JOIN download_dtl t2
                            ON t1.id = t2.download_id
                        WHERE 1 = 1
                            AND t1.id = $1
                            AND ((t2.path_copied = '' OR t2.path_copied IS NULL))
                        GROUP BY
                            t2.s3_state,
                            t1.download_ymd,
                            t2.bug_no,
                            t2.last_modified,
                            t2.sync_path,
                            t2.path_copied
                        ORDER BY 
                            t2.s3_state,
                            t2.bug_no,
                            t2.last_modified`, [fetchId]);
            const download_items: download_item[] = [];
            for (const row of result?.rows || []) {

                const fileName = path.basename(row.sync_path);
                const file_path = path.dirname(row.sync_path);
                download_items.push({
                    id:  row.id,
                    download_ymd: row.download_ymd,
                    bug_no: row.bug_no,
                    fileName: fileName,
                    file_path: file_path,
                    last_modified: row.download_hm,
                    sync_path: row.sync_path,
                    path_copied: row.path_copied,
                    s3_state: row.s3_state
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
                return { success: true, data: true};
            } else if (rowCount !== bugs.length) {
                return { success: true, data: true};
            }
            return { success: true, data: false};
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
                return { success: true, data: false};
            } else if (rowCount !== bugs.length) {
                return { success: true, data: false};
            }
            return { success: true, data: true};
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
            await client.query(`
                UPDATE download_dtl SET 
                    is_moved_at_s3 = true
                WHERE 1 = 1
                    AND is_moved_at_s3 = false 
                    AND bug_no = ANY($1::text[]) `, [bugs]);

            return { success: true, data: true};
        } catch (error) {
            return { success: false, message: (error as Error).message };
        }
    }
}

export const downloadService = new DownloadService(new DatabaseService(getDatabaseConfig()));