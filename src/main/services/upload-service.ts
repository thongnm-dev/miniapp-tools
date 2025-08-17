import { file_item } from "../../types/file_item";
import { upload_item } from "../../types/upload_item";
import { ServiceReturn } from "../@types/service-return";
import { getDatabaseConfig } from "../_/main-config";
import { DatabaseService } from "./database-service";

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
                                    t1.s3_state,
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
                                    AND t1.s3_state = $2
                                GROUP BY
                                    t1.shipment_time,
                                    t1.s3_state,
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
    async ins_upload(params: {user_id: string, state: string, is_folder_same_name: boolean, file_items: file_item[]}): Promise<ServiceReturn<string>> {
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
                    (upload_ymd, upload_hm, s3_state, upload_count, created_by, is_moved_at_s3)
                    VALUES(TO_CHAR(NOW() , 'YYYYMMDD'), TO_CHAR(NOW() , 'HH24mm'), $1, $2, $3, $4) RETURNING id;
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
    async get_uploaded_items(params: {user_id: string, state: string, upload_id: string}): Promise<ServiceReturn<upload_item[]>> {
        if (!this.db) return { success: false, message: ""};
        try {

            const client = await this.db.getClient();
            const result = await client.query(`
                    SELECT
                        t2.bug_no
                    FROM 
                        upload_hdr t1
                    INNER JOIN upload_dtl t2
                        ON t1.id = t2.upload_id 
                    WHERE 1 = 1
                        AND t1.id = $1
                        AND t1.s3_state = $2
                        AND t1.created_by = $3
                `, [params.upload_id, params.state, params.user_id]);

            const upload_items: upload_item [] = [];

            const state_cd = params.state === "03_対応確認中（エネコム確認）" ? "02" : "05";
            for (const row of result?.rows || []) {
                upload_items.push({
                    bug_no: row.bug_no,
                    state_cd: state_cd
                });
            }
            return { success: true, data: upload_items };
        } catch (err) {
            return {success: false, message: "Không thể lấy dữ liệu tập tin đã tải lên."}
        }
    }

    async display_upload_button(params: { user_id: string, state: string, upload_id: string, select_items: string[] }) : Promise<ServiceReturn<boolean>> {
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
                        AND t1.s3_state = $2
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
}

export const uploadService = new UploadService(new DatabaseService(getDatabaseConfig()));