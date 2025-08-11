import { ServiceReturn } from "../@types/service-return";
import { getDatabaseConfig } from "../_/main-config";
import { DatabaseService } from "./database-service";

export interface UploadItem {

}

export class UploadService {
    private db: DatabaseService;

    constructor(db: DatabaseService) {
        this.db = db;
    }

    // 
    async get_uploads(): Promise<ServiceReturn<UploadItem[]>> {

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

    // 
    async ins_upload(): Promise<ServiceReturn<void>> {
        if (!this.db) return { success: false, message: ""};
        try {

            const client = await this.db.getClient();
            const result = await client.query(``);

            return {
                success: true
            }
        } catch (err) {
            return {success: false, message: (err as Error).message}
        }
    }
}

export const uploadService = new UploadService(new DatabaseService(getDatabaseConfig()));