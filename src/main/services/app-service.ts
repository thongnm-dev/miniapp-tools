import { s3_state } from "../../types/s3_state";
import { ServiceReturn } from "../@types/service-return";
import { getDatabaseConfig } from "../_/main-config";
import { DatabaseService } from "./database-service";

export class AppService {
    private db: DatabaseService;

    constructor(db: DatabaseService) {
        this.db = db;
    }

    async getSateList(params?: {}): Promise<ServiceReturn<s3_state[]>> {
        try {

            const client = await this.db.getClient();
            const result = await client.query(``);

            return {success: true}
        } catch (err) {
            return { success: false, message: (err as Error).message }
        }
    }
}

export const appService = new AppService(new DatabaseService(getDatabaseConfig()));