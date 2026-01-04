import { S3Client } from "@aws-sdk/client-s3";
import { S3Config } from "./s3-service";
import { getS3Config } from "../_/main-config";

export class QAService {
    private s3: S3Client;
    private config: S3Config;

    constructor(config: S3Config) {
        this.config = config;

        this.s3 = new S3Client({
            region: config.region,
            credentials: {
                accessKeyId: config.accessKeyId,
                secretAccessKey: config.secretAccessKey,
            },
        });
    }
}

export const qAService = new QAService(getS3Config());