# S3 Service Setup Guide

This guide explains how to set up and use the S3 background service in your Electron application.

## Overview

The S3 service provides the following features:
- Automatic file fetching from S3 bucket every 2 hours
- Manual file listing and management
- Background service control (start/stop)
- File upload, download, and deletion capabilities
- Configuration management

## Prerequisites

1. **AWS Account**: You need an AWS account with S3 access
2. **S3 Bucket**: Create an S3 bucket to store your files
3. **AWS Credentials**: Generate access keys for programmatic access

## AWS Setup

### 1. Create an S3 Bucket

1. Log into your AWS Console
2. Navigate to S3 service
3. Click "Create bucket"
4. Choose a unique bucket name
5. Select your preferred region
6. Configure bucket settings as needed
7. Create the bucket

### 2. Generate Access Keys

1. Go to IAM service in AWS Console
2. Create a new user or use an existing one
3. Attach the `AmazonS3FullAccess` policy (or create a custom policy with minimal permissions)
4. Go to "Security credentials" tab
5. Create access keys
6. Save the Access Key ID and Secret Access Key

## Configuration

### Method 1: Environment Variables (Recommended)

#### For Development (Vite):
Create a `.env` file in your project root:

```bash
# AWS S3 Configuration
VITE_AWS_REGION=us-east-1
VITE_AWS_ACCESS_KEY_ID=your-access-key-id
VITE_AWS_SECRET_ACCESS_KEY=your-secret-access-key
VITE_AWS_S3_BUCKET=your-bucket-name
```

#### For Production (Electron Main Process):
Set the following environment variables:

```bash
export AWS_REGION=us-east-1
export AWS_ACCESS_KEY_ID=your-access-key-id
export AWS_SECRET_ACCESS_KEY=your-secret-access-key
export AWS_S3_BUCKET=your-bucket-name
```

### Method 2: Update Configuration Directly

Edit `src/services/S3Service.ts` and update the `defaultS3Config`:

```typescript
const defaultS3Config: S3Config = {
  region: 'us-east-1', // Your AWS region
  accessKeyId: 'your-access-key-id', // Your AWS access key
  secretAccessKey: 'your-secret-access-key', // Your AWS secret key
  bucketName: 'your-bucket-name', // Your S3 bucket name
};
```

### Method 3: Runtime Configuration

You can update the configuration at runtime using the S3 Manager interface.

## Usage

### Starting the Application

1. **Development Mode**: Run `npm run start` to start both Vite dev server and Electron
2. **Production Mode**: Run `npm run build` then `npm run dist` to build and package the app
3. The S3 background service starts automatically when the application launches
4. Navigate to "S3 Manager" in the sidebar menu
5. The service will begin fetching files from your S3 bucket

### Vite Development Notes

- The renderer process runs on `http://localhost:3000` during development
- Environment variables must be prefixed with `VITE_` to be accessible in the renderer
- The main process can access regular environment variables
- Hot reload is available for the renderer process during development

### S3 Manager Interface

The S3 Manager provides:

- **File List**: View all files in your S3 bucket
- **Background Service Status**: See if the service is running
- **Manual Refresh**: Fetch files immediately
- **Service Controls**: Start/stop the background service
- **File Statistics**: Total files, size, and last fetch time

### Background Service

- **Automatic**: Fetches files every 2 hours
- **Manual Control**: Start/stop the service as needed
- **Logging**: Check console logs for service activity

## API Methods

### Available IPC Handlers

```typescript
// List all files in the bucket
s3ListFiles(): Promise<{ success: boolean; data?: S3File[]; message?: string }>

// Get a specific file
s3GetFile(key: string): Promise<{ success: boolean; data?: any; message?: string }>

// Upload a file
s3UploadFile(key: string, body: Buffer | string): Promise<{ success: boolean; message?: string }>

// Delete a file
s3DeleteFile(key: string): Promise<{ success: boolean; message?: string }>

// Manual fetch
s3ManualFetch(): Promise<{ success: boolean; data?: string[]; message?: string }>

// Background service control
s3StartBackgroundService(): Promise<{ success: boolean; message?: string }>
s3StopBackgroundService(): Promise<{ success: boolean; message?: string }>
s3IsBackgroundServiceRunning(): Promise<boolean>

// Configuration management
s3UpdateConfig(config: S3Config): Promise<{ success: boolean; message?: string }>
s3GetConfig(): Promise<S3Config>
```

## Security Considerations

### IAM Permissions

Create a custom IAM policy with minimal required permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::your-bucket-name",
        "arn:aws:s3:::your-bucket-name/*"
      ]
    }
  ]
}
```

### Credential Management

- Never commit AWS credentials to version control
- Use environment variables or AWS IAM roles when possible
- Rotate access keys regularly
- Consider using AWS STS for temporary credentials

## Troubleshooting

### Common Issues

1. **Access Denied**: Check IAM permissions and bucket policies
2. **Invalid Region**: Ensure the region matches your bucket location
3. **Bucket Not Found**: Verify the bucket name is correct
4. **Network Issues**: Check internet connectivity and firewall settings

### Debug Mode

Enable debug logging by checking the browser console for detailed error messages.

### Service Status

- Check the background service status indicator in the S3 Manager
- Review console logs for service activity
- Use manual fetch to test connectivity

## Integration with Database

The S3 service can be integrated with the PostgreSQL database to:

- Store file metadata
- Track file status changes
- Maintain file history
- Enable file synchronization

Example integration in `fetchAndProcessFiles()`:

```typescript
// Save files to database
for (const file of result.data) {
  await databaseService.saveFileStatus([{
    name: file.key.split('/').pop() || file.key,
    path: `s3://${this.config.bucketName}/${file.key}`,
    status: 'active'
  }]);
}
```

## Performance Considerations

- The service fetches up to 1000 files per request (configurable)
- Large buckets may require pagination
- Consider implementing file filtering for better performance
- Monitor memory usage with large file lists

## Future Enhancements

- File upload/download UI
- File preview capabilities
- Batch operations
- File versioning support
- CloudFront integration
- Cost monitoring and alerts 