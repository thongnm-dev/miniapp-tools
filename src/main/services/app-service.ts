import { aws_storage } from "../../types/aws_storage";
import { ServiceReturn } from "../@types/service-return";
import { getDatabaseConfig } from "../_/main-config";
import { DatabaseService } from "./database-service";

export class AppService {
    private db: DatabaseService;

    constructor(db: DatabaseService) {
        this.db = db;
    }

    async get_all_items(): Promise<ServiceReturn<aws_storage[]>> {
        try {

            const client = await this.db.getClient();
            const result = await client.query(`
                    SELECT
                         code AS aws_cd
                        ,"name" AS aws_name
                        ,subscribe
                        ,is_upload
                        ,is_download
                    FROM
                        aws_storage
                    WHERE 1 = 1
                        AND is_upload = true 
                        OR is_download = true
                    GROUP BY
                          subscribe
                         ,code AS aws_cd
                         ,"name"
                        ,is_upload
                        ,is_download
                    ORDER BY 
                        subscribe
                        ,code;
                `);

            const aws_storages: aws_storage[] = [];

            for (const row of result?.rows || []) {
                aws_storages.push({
                    aws_cd: row.aws_cd,
                    aws_name: row.aws_name,
                    subscribe: row.subscribe,
                    is_upload: row.is_upload,
                    is_download: row.is_download,
                });
            }
            return { success: true, data: aws_storages }
        } catch (err) {
            return { success: false, message: (err as Error).message }
        }
    }

    async get_download_items(): Promise<ServiceReturn<aws_storage[]>> {
        try {

            const client = await this.db.getClient();
            const result = await client.query(`
                    SELECT
                         code AS aws_cd
                        ,"name" AS aws_name
                        ,subscribe
                    FROM
                        aws_storage
                    WHERE 1 =1
                        AND is_download = true
                    ORDER BY
                        code;
                `);

            const aws_storages: aws_storage[] = [];

            for (const row of result?.rows || []) {
                aws_storages.push({
                    aws_cd: row.aws_cd,
                    aws_name: row.aws_name,
                    subscribe: row.subscribe
                });
            }
            return { success: true, data: aws_storages };
        } catch (err) {
            return { success: false, message: (err as Error).message }
        }
    }

    async get_upload_items(): Promise<ServiceReturn<aws_storage[]>> {
        try {

            const client = await this.db.getClient();
            const result = await client.query(`
                    SELECT
                         code AS aws_cd
                        ,"name" AS aws_name
                        ,subscribe
                    FROM
                        aws_storage
                    WHERE 1 =1
                        AND is_upload = true
                    ORDER BY
                        code;
                `);

            const aws_storages: aws_storage[] = [];

            for (const row of result?.rows || []) {
                aws_storages.push({
                    aws_cd: row.aws_cd,
                    aws_name: row.aws_name,
                    subscribe: row.subscribe
                });
            }
            return { success: true, data: aws_storages };
        } catch (err) {
            return { success: false, message: (err as Error).message }
        }
    }

    async get_delete_items(aws_cd: string): Promise<ServiceReturn<aws_storage[]>> {
        try {

            const client = await this.db.getClient();
            const result = await client.query(`
                    SELECT
                         code AS aws_cd
                        ,"name" AS aws_name
                        ,subscribe
                    FROM
                        aws_storage
                    WHERE 1 =1
                        AND link_available @> ARRAY[$1]
                    ORDER BY
                        code;
                `, [aws_cd]);

            const aws_storages: aws_storage[] = [];

            for (const row of result?.rows || []) {
                aws_storages.push({
                    aws_cd: row.aws_cd,
                    aws_name: row.aws_name,
                    subscribe: row.subscribe
                });
            }
            return { success: true, data: aws_storages };
        } catch (err) {
            return { success: false, message: (err as Error).message }
        }
    }

    async get_aws_item(aws_cd: string): Promise<ServiceReturn<aws_storage>> {
        try {

            const client = await this.db.getClient();
            const result = await client.query(`
                    SELECT
                         code AS aws_cd
                        ,"name" AS aws_name
                        ,subscribe
                    FROM
                        aws_storage
                    WHERE 1 =1
                        AND code = $1
                `, [aws_cd]);

            const aws_storages: aws_storage = {
                aws_cd: result?.rows[0].aws_cd,
                aws_name: result?.rows[0].aws_name,
                subscribe: result?.rows[0].subscribe
            };
            return { success: true, data: aws_storages };
        } catch (err) {
            return { success: false, message: (err as Error).message }
        }
    }
}

export const appService = new AppService(new DatabaseService(getDatabaseConfig()));