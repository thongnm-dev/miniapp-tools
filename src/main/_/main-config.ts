import { S3Config } from '../services/s3-service';
import { DatabaseConfig } from '../services/database-service';

const getEnvVar = (key: string, defaultValue?: string): string => {
    const value = process.env[key] || defaultValue;
    if (!value) {
      throw new Error(`Environment variable ${key} is required but not set`);
    }
    return value;
};

const getEnvVarNumber = (key: string, defaultValue?: number): number => {
    const value = getEnvVar(key, defaultValue?.toString());
    const num = parseInt(value, 10);
    if (isNaN(num)) {
        throw new Error(`Environment variable ${key} must be a valid number`);
    }
    return num;
};

  // S3 Configuration
  export const getS3Config = (): S3Config => {
    return {
      region: getEnvVar('AWS_REGION'),
      accessKeyId: getEnvVar('AWS_ACCESS_KEY_ID'),
      secretAccessKey: getEnvVar('AWS_SECRET_ACCESS_KEY'),
      bucketName: getEnvVar('AWS_S3_BUCKET'),
      folderName: getEnvVar('AWS_S3_FOLDER'),
    };
  };

  // Database Configuration
  export const getDatabaseConfig = (): DatabaseConfig => {
    return {
      // host: "192.168.10.132", // getEnvVar('DB_HOST'),
      // port: 5432, // getEnvVarNumber('DB_PORT'),
      // database: "miniapp_staging", // getEnvVar('DB_NAME'),
      // user: "postgres", // getEnvVar('DB_USER'),
      // password: "123456", // getEnvVar('DB_PASSWORD'),
      host: getEnvVar('DB_HOST'),
      port: getEnvVarNumber('DB_PORT'),
      database: getEnvVar('DB_NAME'),
      user:  getEnvVar('DB_USER'),
      password:  getEnvVar('DB_PASSWORD'),
    };
  };

  // Workdir
  export const getWorkdir = () => {
    return {
      S3_LOCAL_SYNC_WORKDIR: process.env['S3_LOCAL_SYNC_WORKDIR'] || ""
    };
  };