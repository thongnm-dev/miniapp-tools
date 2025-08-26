import { file_item } from "../../types/file_item";
import { get_uploaded_params, search_upload_params, update_after_move_params, upload_display_params } from "../../types/param_interface";
import { upload_item } from "../../types/upload_item";
import { ServiceReturn } from "../@types/service-return";
import { getDatabaseConfig } from "../_/main-config";
import { DatabaseService } from "./database-service";

export interface ins_upload_params {
    user_id: string, 
    state: string, 
    is_folder_same_name: boolean, 
    file_items: file_item[]
}

export class UploadService {
    private db: DatabaseService;

    constructor(db: DatabaseService) {
        this.db = db;
    }

    // 
    async get_upload_assignments(params: {user_id: string, state: string}): Promise<ServiceReturn<upload_item[]>> {

        if (!this.db) return { success: false, message: ""};
        try {

            const client = await this.db.getClient();
            const result = await client.query(`
                                SELECT
                                    t1.shipment_time,
                                    t1.aws_cd,
                                    t1.is_completed,
                                    t1.is_for_dev,
                                    t3.bug_no,
                                    t3.file_name,
                                    t3.att_type,
                                    t3.file_path
                                FROM
                                    shipment_hdr t1
                                INNER JOIN shipment_dtl t2
                                    ON t1.id = t2.shipment_id
                                INNER JOIN shipment_attach t3
                                    ON t1.id = t2.shipment_id
                                    AND t2.id = t3.shipment_dtl_id
                                WHERE 1 = 1
                                    AND t1.shipment_date = to_char(now(), 'yyyyMMdd')
                                    AND t1.is_completed = FALSE
                                    AND t1.is_for_dev = $1
                                    AND t1.aws_cd = $2
                                GROUP BY
                                    t1.shipment_time,
                                    t1.aws_cd,
                                    t1.is_completed,
                                    t1.is_for_dev,
                                    t3.bug_no,
                                    t3.file_name,
                                    t3.att_type,
                                    t3.file_path
                                `, []);
                for (const row of result?.rows || []) {

                }
            return {
                success: true
            }
        } catch (err) {
            return {success: false, message: (err as Error).message}
        }
    }

    // insert upload data
    async ins_upload(params: ins_upload_params): Promise<ServiceReturn<string>> {
        if (!this.db) {
            return { success: false, message: ""}
        };
        try {

            const client = await this.db.getClient();

            const upload_dtls = params.file_items.reduce((acc: { [key: string]: file_item[] }, item) => {
                if (!acc[item.parent_name]) {
                    acc[item.parent_name] = [];
                }
                acc[item.parent_name].push(item);

                return acc;
            }, {}) as {[key: string]: file_item[]};

            const upload_count = Object.entries(upload_dtls).length;

            await client.query(`BEGIN`);
            const result = await client.query(`
                INSERT INTO upload_hdr
                    (upload_ymd, upload_hms, aws_cd, upload_count, created_by, is_moved_at_s3)
                    VALUES(TO_CHAR(NOW() , 'YYYYMMDD'), TO_CHAR(NOW() , 'HH24mmss'), $1, $2, $3, $4) RETURNING id;
                `, [params.state, upload_count, params.user_id, params.is_folder_same_name]);

            // insert upload dtl
            const upload_id = result?.rows[0]?.id;
            for (const [bug_no, items] of Object.entries(upload_dtls)) {
                const resultDtl = await client.query(`
                        INSERT INTO upload_dtl
                        (upload_id, bug_no)
                        VALUES($1, $2) RETURNING id;
                    `, [upload_id, bug_no]);

                const upload_dtl_id = resultDtl?.rows[0]?.id;
                // insert upload dtl attachment
                let promise_dtl_att = [];
                for (const dtl_att of items) {
                    promise_dtl_att.push(client.query(`
                        INSERT INTO public.upload_attach
                            (upload_id, upload_dtl_id, file_name, file_path)
                            VALUES($1, $2, $3, $4);
                    `, [upload_id, upload_dtl_id, dtl_att.name, dtl_att.full_path]));
                }

                await Promise.all(promise_dtl_att);
            }
            await client.query(`COMMIT`);

            return {success: true, data: upload_id}
        } catch (err) {
            (await this.db.getClient()).query("ROLLBACK")
            return {success: false, message: (err as Error).message}
        }
    }

    // get all uploaded list
    async get_uploaded_items(params: get_uploaded_params): Promise<ServiceReturn<upload_item[]>> {
        if (!this.db) return { success: false, message: ""};
        try {

            const client = await this.db.getClient();
            const result = await client.query(`
                    SELECT
                        t2.bug_no
                        , CASE WHEN t1.aws_cd = '03' THEN '02' ELSE '04' END AS aws_cd
                    FROM 
                        upload_hdr t1
                    INNER JOIN aws_storage t3
                        ON t1.aws_cd = t3.code 
                    INNER JOIN upload_dtl t2
                        ON t1.id = t2.upload_id
                    WHERE 1 = 1
                        AND t1.id = $1
                        AND t1.aws_cd = $2
                        AND t1.created_by = $3
                `, [params.upload_id, params.aws_cd, params.user_id]);

            const upload_items: upload_item [] = [];
            for (const row of result?.rows || []) {
                upload_items.push({
                    bug_no: row.bug_no,
                    aws_cd: row.aws_cd,
                });
            }
            return { success: true, data: upload_items };
        } catch (err) {
            return {success: false, message: "Không thể lấy dữ liệu tập tin đã tải lên."}
        }
    }

    async display_upload_button(params: upload_display_params) : Promise<ServiceReturn<boolean>> {
        if (!this.db) return { success: false, message: "", data: false};

        try {
            const client = await this.db.getClient();
            const result = await client.query(`
                    SELECT
                        COUNT(*)
                    FROM 
                        upload_hdr t1
                    INNER JOIN upload_dtl t2
                        ON t1.id = t2.upload_id 
                    WHERE 1 = 1
                        AND t1.id = $1
                        AND t1.aws_cd = $2
                        AND t1.created_by = $3
                        AND t2.bug_no = ANY($4::text[])
                `, [params.upload_id, params.state, params.user_id, params.select_items]);

                const rowCount = parseInt(result.rows[0].count, 10);

            if (rowCount === params.select_items.length) {
                return { success: true, data: false};
            } else if (rowCount !== params.select_items.length) {
                return { success: true, data: true};
            }

            return { success: true, data: false};
        } catch (err) {
            return {success: false, data: false}
        }
    }

    // update state after move
    async update_state_after_move(params: update_after_move_params): Promise<ServiceReturn<boolean>> {
        if (!this.db) {
            return { success: false };
        }

        try {
            const client = await this.db.getClient();
            await client.query(`BEGIN`);
            await client.query(`
                UPDATE upload_hdr SET 
                    is_moved_at_s3 = true
                WHERE 1 = 1
                    AND id = $1
                    AND aws_cd = $2
                    AND upload_count = (SELECT COUNT(1) FROM upload_dtl WHERE upload_id = $1 AND bug_no = ANY($3::text[]));
                    `, [params.upload_id, params.aws_cd, params.selected_items]);
            await client.query(`COMMIT`);

            return { success: true, data: true};
        } catch (error) {
            (await this.db.getClient()).query("ROLLBACK")
            return { success: false, message: (error as Error).message };
        }
    }

    // search upload history
    async search_upload_histories(params: search_upload_params): Promise<ServiceReturn<upload_item[]>> {
        try {

            const client = await this.db.getClient();
            const result = await client.query(`
                    SELECT
                          t1.upload_ymd
                        , t1.aws_cd
                        , t4.name AS aws_name
                        , t1.is_moved_at_s3
                        , t2.bug_no
                        , string_agg(t3.file_name , ', ') AS att_files
                    FROM 
                        upload_hdr t1
                    INNER JOIN upload_dtl t2
                        ON t1.id = t2.upload_id 
                    INNER JOIN upload_attach t3
                        ON t1.id = t3.upload_id 
                        AND t2.id = t3.upload_dtl_id
                    INNER JOIN aws_storage t4
                        ON t1.aws_cd = t4.code 
                    WHERE 1 = 1
                        AND (
                            (TRIM($1) = '' AND TRIM($2) <> '' AND t1.upload_ymd <= $2::TEXT)
                            OR (TRIM($1) <> '' AND TRIM($2) = '' AND t1.upload_ymd >= $1::TEXT)
                            OR (TRIM($1) <> '' AND TRIM($2) <> '' AND t1.upload_ymd BETWEEN $1::TEXT AND $2::TEXT)
                            OR (TRIM($1) = '' AND TRIM($2) = ''))
                        AND (TRIM($3) = '' OR t1.aws_cd = $3)
                        AND (TRIM($4) = '' OR t2.bug_no LIKE '%' ||$4|| '%')
                        AND ($5 = FALSE OR t1.is_moved_at_s3 = $5)
                    GROUP BY 
                          t1.upload_ymd
                        , t1.aws_cd
                        , t4."name"
                        , t1.is_moved_at_s3
                        , t2.bug_no
                    ORDER BY 
                          t1.upload_ymd
                        , t1.aws_cd
                        , t2.bug_no
                `, [params.from_date || "", params.to_date || "", params.aws_cd, params.bug_no, params.is_moved_at_s3]);
            const upload_items: upload_item [] = [];

            for (const row of result?.rows || []) {
                upload_items.push({
                    upload_ymd: row.upload_ymd,
                    aws_name: row.aws_name,
                    is_moved_at_s3: row.is_moved_at_s3,
                    bug_no: row.bug_no,
                    att_files: row.att_files,
                });
            }
            return { success: true, data: upload_items };
        } catch (err) {
            return { success: false, message: (err as Error).message }
        }
    }
}

export const uploadService = new UploadService(new DatabaseService(getDatabaseConfig()));