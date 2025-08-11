# Configuration Guide

## Using config.ts with Vite

The application now uses a unified configuration approach with `src/config/config.ts` that works with Vite's `import.meta.env` for both main and renderer processes.

### Unified Configuration (`src/config/config.ts`)

This file uses Vite's `import.meta.env` to access environment variables and works in both main and renderer processes:

```typescript
import { getS3Config, getDatabaseConfig } from '../config/config';

// Get S3 configuration
const s3Config = getS3Config();

// Get database configuration  
const dbConfig = getDatabaseConfig();
```

### Key Features

- **Unified Approach**: Single configuration file for both main and renderer processes
- **Vite Integration**: Uses `import.meta.env` for environment variable access
- **TypeScript Support**: Includes Vite client types for proper TypeScript support
- **Validation**: Includes comprehensive validation functions for both S3 and database configs

### Environment Variables

All environment variables should be prefixed with `VITE_` to be accessible:

```bash
VITE_AWS_REGION=us-east-1
VITE_AWS_ACCESS_KEY_ID=your-access-key
VITE_AWS_SECRET_ACCESS_KEY=your-secret-key
VITE_AWS_S3_BUCKET=your-bucket-name
VITE_DB_HOST=localhost
VITE_DB_PORT=5432
VITE_DB_NAME=miniapp
VITE_DB_USER=user
VITE_DB_PASSWORD=userpassword
```

### Migration from config-loader.ts

The old `config-loader.ts` has been removed. If you were using it, simply:

1. Replace imports from `./config-loader` with `../config/config`
2. Replace function calls:
   - `getS3ConfigForMain()` → `getS3Config()`
   - `getDatabaseConfigForMain()` → `getDatabaseConfig()`

### Example Usage in main.ts

```typescript
import { getS3Config, getDatabaseConfig } from '../config/config';

app.whenReady().then(async () => {
  try {
    // Load configurations using config.ts
    const s3Config = getS3Config();
    const dbConfig = getDatabaseConfig();
    
    // Set configurations in services
    setS3Config(s3Config);
    setDatabaseConfig(dbConfig);
    
    // Initialize services...
  } catch (error) {
    console.error('Configuration error:', error);
  }
});
```

### TypeScript Configuration

The main process TypeScript configuration has been updated to support ES modules and `import.meta`:

```json
{
  "compilerOptions": {
    "module": "esnext",
    "moduleResolution": "node"
  }
}
```

## Overview

The application uses environment variables for configuration to ensure security and flexibility across different environments. All configuration is loaded from environment variables with sensible defaults where appropriate.

## Environment Variables

### AWS S3 Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_AWS_REGION` | Yes | `us-east-1` | AWS region for S3 operations |
| `VITE_AWS_ACCESS_KEY_ID` | Yes | - | AWS access key ID |
| `VITE_AWS_SECRET_ACCESS_KEY` | Yes | - | AWS secret access key |
| `VITE_AWS_S3_BUCKET` | Yes | - | S3 bucket name |

### Database Configuration (PostgreSQL)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_DB_HOST` | No | `localhost` | Database host |
| `VITE_DB_PORT` | No | `5432` | Database port |
| `VITE_DB_NAME` | No | `miniapp` | Database name |
| `VITE_DB_USER` | No | `user` | Database user |
| `VITE_DB_PASSWORD` | No | `userpassword` | Database password |

### Development Settings

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_DEV_MODE` | No | `true` | Enable development mode |

## Setup Instructions

### 1. Copy Environment Template

```bash
cp env.example .env
```

### 2. Configure Your Environment

Edit the `.env` file with your actual values:

```bash
# AWS S3 Configuration
VITE_AWS_REGION=us-east-1
VITE_AWS_ACCESS_KEY_ID=your-actual-access-key
VITE_AWS_SECRET_ACCESS_KEY=your-actual-secret-key
VITE_AWS_S3_BUCKET=your-actual-bucket-name

# Database Configuration
VITE_DB_HOST=localhost
VITE_DB_PORT=5432
VITE_DB_NAME=your-database-name
VITE_DB_USER=your-database-user
VITE_DB_PASSWORD=your-database-password

# Development Settings
VITE_DEV_MODE=true
```

### 3. Verify Configuration

The application will validate your configuration on startup. If there are any issues, check the console for error messages.

## Environment-Specific Configurations

### Development

```bash
# .env.development
VITE_AWS_REGION=us-east-1
VITE_AWS_ACCESS_KEY_ID=dev-access-key
VITE_AWS_SECRET_ACCESS_KEY=dev-secret-key
VITE_AWS_S3_BUCKET=dev-bucket
VITE_DB_HOST=localhost
VITE_DB_PORT=5432
VITE_DB_NAME=dev_db
VITE_DB_USER=dev_user
VITE_DB_PASSWORD=dev_password
VITE_DEV_MODE=true
```

### Staging

```bash
# .env.staging
VITE_AWS_REGION=us-east-1
VITE_AWS_ACCESS_KEY_ID=staging-access-key
VITE_AWS_SECRET_ACCESS_KEY=staging-secret-key
VITE_AWS_S3_BUCKET=staging-bucket
VITE_DB_HOST=staging-db-host
VITE_DB_PORT=5432
VITE_DB_NAME=staging_db
VITE_DB_USER=staging_user
VITE_DB_PASSWORD=staging_password
VITE_DEV_MODE=false
```

### Production

```bash
# .env.production
VITE_AWS_REGION=us-east-1
VITE_AWS_ACCESS_KEY_ID=prod-access-key
VITE_AWS_SECRET_ACCESS_KEY=prod-secret-key
VITE_AWS_S3_BUCKET=prod-bucket
VITE_DB_HOST=prod-db-host
VITE_DB_PORT=5432
VITE_DB_NAME=prod_db
VITE_DB_USER=prod_user
VITE_DB_PASSWORD=prod_password
VITE_DEV_MODE=false
```

## Security Considerations

### 1. Never Commit Secrets

- Add `.env` to your `.gitignore` file
- Never commit actual credentials to version control
- Use different credentials for different environments

### 2. AWS Credentials

- Use IAM roles when possible instead of access keys
- Rotate access keys regularly
- Use the principle of least privilege for IAM permissions

### 3. Database Credentials

- Use strong passwords
- Consider using connection pooling for production
- Use SSL connections for production databases

## Troubleshooting

### Common Issues

1. **Configuration Errors**
   - Check that all required environment variables are set
   - Verify the format of your `.env` file
   - Ensure no extra spaces or quotes around values

2. **Database Connection Issues**
   - Verify database is running and accessible
   - Check firewall settings
   - Ensure database user has proper permissions

3. **S3 Connection Issues**
   - Verify AWS credentials are correct
   - Check bucket permissions
   - Ensure region matches bucket location

### Debug Mode

Enable debug mode to see detailed configuration information:

```bash
VITE_DEV_MODE=true
```

This will log configuration details to the console on startup.

## Configuration Validation

The application validates configuration on startup:

- **S3 Configuration**: Validates AWS credentials and bucket access
- **Database Configuration**: Validates connection parameters
- **Environment Variables**: Checks for required variables

If validation fails, the application will log errors and may not start properly.

## Migration from Hardcoded Values

If you're migrating from hardcoded configuration values:

1. **S3Service**: Configuration is now loaded from environment variables
2. **DatabaseService**: Configuration is now loaded from environment variables
3. **Main Process**: Handles configuration errors gracefully

The old hardcoded values have been replaced with environment-based configuration. 