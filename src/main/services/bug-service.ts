import { ServiceReturn } from "../@types/service-return";
import { getDatabaseConfig } from "../_/main-config";
import { DatabaseService } from "./database-service";

export interface Bug {

}

export class BugService {

    private db: DatabaseService;

    constructor(db: DatabaseService) {
        this.db = db;
    }

    // get bugs
    async get_bug_list(): Promise<ServiceReturn<Bug[]>> {
        if (!this.db) {
            return { success: false };
        }
        try {

            const client = await this.db.getClient();
            const result = await client.query(`
                        SELECT
                            id,
                            bug_no,
                            bug_phase,
                            bug_status,
                            bug_priority,
                            bug_type,
                            bug_severity,
                            program_related,
                            issue_backlog,
                            issue_key_backlog,
                            issue_backlog_status,
                            issue_backlog_priority,
                            issue_backlog_type,
                            assignee,
                            estimated_hours,
                            actual_hours
                        FROM
                            bugs;
                `);

            return {
                success: true
            }
        } catch (err) {
            return {success: false, message: (err as Error).message}
        }
    }

    // create bug
    async ins_bug(): Promise<ServiceReturn<number>> {
        if (!this.db) {
            return { success: false };
        }
        try {

            const client = await this.db.getClient();
            const result = await client.query(`
                `);

            return {
                success: true
            }
        } catch (err) {
            return {success: false, message: (err as Error).message}
        }
    }

    // bulk insert
    async bulk_ins_bug(): Promise<ServiceReturn<void>> {
        if (!this.db) {
            return { success: false };
        }
        try {

            const client = await this.db.getClient();
            const result = await client.query(`
                `);

            return {
                success: true
            }
        } catch (err) {
            return {success: false, message: (err as Error).message}
        }
    }
}

export const uploadService = new BugService(new DatabaseService(getDatabaseConfig()));