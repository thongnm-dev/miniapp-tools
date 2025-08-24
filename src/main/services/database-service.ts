import { Client } from 'pg';
import { getDatabaseConfig } from '../_/main-config';

export interface FileData {
  name: string;
  nas_path: string;
  s3_path: string;
  workspace_path: string;
  status: string;
  process_state?: string;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

export class DatabaseService {
  private client: Client | null = null;
  private config: DatabaseConfig;

  constructor(config: DatabaseConfig) {
    this.config = config;
  }

  // create a function to check if the database is connected
  async isConnected(): Promise<boolean> {
    return this.client !== null;
  }

  // create function to initialize database
  async initializeDatabase(): Promise<{ success: boolean; message?: string }> {
    try {
      // check if the database is connected
      if (!await this.isConnected()) {
        await this.connect();
      }

      const client = await this.getClient();
      
      await client.query(`
        CREATE TABLE IF NOT EXISTS projects (
          id SERIAL PRIMARY KEY,
          project_name VARCHAR(100) NOT NULL,
          prj_backlog_id NUMERIC(10) NOT NULL,
          prj_backlog_key VARCHAR(100) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS bugs (
          id SERIAL PRIMARY KEY,
          project_id INT NOT NULL,
          bug_no VARCHAR(100) NOT NULL,
          aws_cd VARCHAR(3) NOT NULL,
          bug_phase VARCHAR(10) NOT NULL,
          bug_status VARCHAR(10) DEFAULT '',
          bug_priority VARCHAR(10) DEFAULT '',
          bug_type VARCHAR(10) DEFAULT '',
          bug_severity VARCHAR(10) DEFAULT '',
          program_related VARCHAR(100) NOT NULL,
          dual_date DATE,
          actual_date DATE,
          issue_backlog NUMERIC(10) NOT NULL,
          issue_key_backlog VARCHAR(100) NOT NULL,
          issue_backlog_status VARCHAR(10) DEFAULT '',
          issue_backlog_priority VARCHAR(10) DEFAULT '',
          issue_backlog_type VARCHAR(10) DEFAULT '',
          assignee VARCHAR(100) DEFAULT '',
          estimated_hours NUMERIC(10, 2),
          actual_hours NUMERIC(10, 2),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS bug_attachs (
          id SERIAL PRIMARY KEY,
          bug_id INT NOT NULL,
          attachment_name VARCHAR(100) NOT NULL,
          attachment_type VARCHAR(100) NOT NULL,
          attachment_path VARCHAR(255) NOT NULL,
          attachment_pathvn VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS aws_storage (
          id SERIAL PRIMARY KEY,
          code VARCHAR(3) NOT NULL,
          name VARCHAR(100) NOT NULL,
          subscribe VARCHAR(100) NOT NULL,
          is_upload BOOLEAN DEFAULT FALSE,
          is_download BOOLEAN DEFAULT FALSE,
          link_available TEXT[],
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS download_hdr (
          id SERIAL PRIMARY KEY,
          download_ymd VARCHAR(8) NOT NULL,
          download_hms VARCHAR(6) NOT NULL,
          aws_cd VARCHAR(3) NOT NULL DEFAULT '',
          sync_path VARCHAR(255) NOT NULL DEFAULT '',
          download_count INT NOT NULL DEFAULT 0,
          is_moved_at_local BOOLEAN DEFAULT FALSE,
          created_by VARCHAR(100) DEFAULT '',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS download_dtl (
          id SERIAL PRIMARY KEY,
          download_id INT NOT NULL,
          bug_no VARCHAR(100) NOT NULL,
          last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          sync_path VARCHAR(255) NOT NULL DEFAULT '',
          path_copied VARCHAR(255) NOT NULL DEFAULT '',
          is_moved_at_s3 BOOLEAN DEFAULT FALSE,
          is_bug_created BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS upload_hdr (
          id SERIAL PRIMARY KEY,
          upload_ymd VARCHAR(8) NOT NULL,
          upload_hms VARCHAR(6) NOT NULL,
          aws_cd VARCHAR(3) NOT NULL DEFAULT '',
          is_moved_at_s3 BOOLEAN DEFAULT FALSE,
          upload_count INT NOT NULL DEFAULT 0,
          created_by VARCHAR(100) DEFAULT '',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_upload_one ON upload_hdr (upload_ymd, upload_hms, aws_cd);
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS upload_dtl (
          id SERIAL PRIMARY KEY,
          upload_id INT NOT NULL,
          bug_no VARCHAR(100) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS upload_attach (
          id SERIAL PRIMARY KEY,
          upload_id INT NOT NULL,
          upload_dtl_id INT NOT NULL,
          file_name VARCHAR(255) NOT NULL,
          file_path VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS shipment_hdr (
          id SERIAL PRIMARY KEY,
          shipment_date DATE NOT NULL,
          shipment_time VARCHAR(14) NOT NULL,
          aws_cd VARCHAR(3) NOT NULL DEFAULT '',
          is_completed BOOLEAN DEFAULT FALSE,
          is_for_dev BOOLEAN DEFAULT TRUE,
          created_by VARCHAR(100) DEFAULT '',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS shipment_dtl (
          id SERIAL PRIMARY KEY,
          shipment_id INT NOT NULL,
          bug_no VARCHAR(100) NOT NULL,
          attachment_count INT NOT NULL DEFAULT 0,
          comment TEXT DEFAULT '',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS shipment_attach (
          id SERIAL PRIMARY KEY,
          shipment_id INT NOT NULL,
          shipment_dtl_id INT NOT NULL,
          att_type VARCHAR(1) NOT NULL,
          file_name VARCHAR(255) NOT NULL DEFAULT '',
          file_path VARCHAR(255) NOT NULL DEFAULT '',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) DEFAULT '',
            username VARCHAR(100) NOT NULL UNIQUE,
            email VARCHAR(100) DEFAULT '',
            password VARCHAR(255) NOT NULL,
            role VARCHAR(50) NOT NULL DEFAULT 'user',
            avatar VARCHAR(255) DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS menus (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            path VARCHAR(200),
            icon VARCHAR(100),
            parent_id INTEGER REFERENCES menus(id),
            order_index INTEGER DEFAULT 0,
            is_active BOOLEAN DEFAULT true,
            is_visible BOOLEAN DEFAULT true,
            use_app BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS menu_user (
            id SERIAL PRIMARY KEY,
            menu_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            is_active BOOLEAN DEFAULT true,
            is_visible BOOLEAN DEFAULT true,
            use_app BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // await client.query(`
      //     TRUNCATE TABLE aws_storage;
      //     INSERT INTO aws_storage (code,"name",subscribe,link_available) VALUES
      //       ('02','02_原因確認中（アレクシード確認）','to_アレクシード','{03}'),
      //       ('04','04_対応中（アレクシード確認）','to_アレクシード','{03,05}'),
      //       ('03','03_対応確認中（エネコム確認）','to_エネコム','{03}'),
      //       ('05','05_対応済（アレクシード確認）','to_エネコム','{}'),
      //       ('01','01_起票済（エネコム確認）','to_エネコム','{}');
      //   `)
      await this.disconnect();
      return { success: true };
    } catch (error) {
      return { success: false, message: (error as Error).message };
    }
  }

  // Connect to database
  async connect(): Promise<{ success: boolean; message?: string }> {
    try {
      this.client = this.client || new Client(this.config);
      await this.client.connect();
      return { success: true };
    } catch (error) {
      return { success: false, message: (error as Error).message };
    }
  }

  // Disconnect from database
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.end();
      this.client = null;
    }
  }
  
  public async getClient(): Promise<Client> {
    if (!this.client) {
      await this.connect();
    }
    return this.client as Client;
  }
}

// Export a singleton instance with environment-based configuration
export const databaseService = new DatabaseService(getDatabaseConfig()); 