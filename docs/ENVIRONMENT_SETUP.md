# Environment Setup

This document explains how to configure environment variables for the menu API system.

## Required Environment Variables

Create a `.env` file in the root directory of your project with the following variables:

```bash
# Menu API Configuration
# Set this to your production API server URL
# For development, leave empty to use the mock API
VITE_API_BASE_URL=

# Debug Mode (optional)
# Set to 'true' to enable debug logging for menu API
VITE_DEBUG_MENU=false

# API Timeout (optional, defaults to 10000ms)
VITE_API_TIMEOUT=10000

# API Retry Attempts (optional, defaults to 3)
VITE_API_RETRY_ATTEMPTS=3
```

## Environment Variable Descriptions

### `VITE_API_BASE_URL`
- **Type**: String
- **Required**: No (uses mock API if empty)
- **Description**: The base URL of your API server
- **Examples**:
  - `https://api.yourcompany.com`
  - `http://localhost:3001`
  - `https://your-api-gateway.com`

### `VITE_DEBUG_MENU`
- **Type**: Boolean
- **Required**: No
- **Default**: `false`
- **Description**: Enables debug logging for menu API operations
- **Values**: `true` or `false`

### `VITE_API_TIMEOUT`
- **Type**: Number
- **Required**: No
- **Default**: `10000` (10 seconds)
- **Description**: Timeout for API requests in milliseconds

### `VITE_API_RETRY_ATTEMPTS`
- **Type**: Number
- **Required**: No
- **Default**: `3`
- **Description**: Number of retry attempts for failed API requests

## Development Setup

For development, you can use the minimal configuration:

```bash
# .env (Development)
VITE_API_BASE_URL=
VITE_DEBUG_MENU=true
```

This will:
- Use the mock API at `/mock-api/menu-items.json`
- Enable debug logging to help with development

## Production Setup

For production, configure your actual API server:

```bash
# .env (Production)
VITE_API_BASE_URL=https://api.yourcompany.com
VITE_DEBUG_MENU=false
VITE_API_TIMEOUT=15000
VITE_API_RETRY_ATTEMPTS=3
```

## Environment-Specific Configurations

### Local Development
```bash
VITE_API_BASE_URL=http://localhost:3001
VITE_DEBUG_MENU=true
```

### Staging Environment
```bash
VITE_API_BASE_URL=https://staging-api.yourcompany.com
VITE_DEBUG_MENU=false
```

### Production Environment
```bash
VITE_API_BASE_URL=https://api.yourcompany.com
VITE_DEBUG_MENU=false
VITE_API_TIMEOUT=20000
VITE_API_RETRY_ATTEMPTS=5
```

## Security Considerations

1. **Never commit `.env` files** to version control
2. **Use HTTPS** for production API URLs
3. **Validate environment variables** in your application
4. **Use different configurations** for different environments

## Troubleshooting

### Environment Variables Not Loading
1. Ensure the `.env` file is in the root directory
2. Restart your development server after creating/modifying `.env`
3. Check that variable names start with `REACT_APP_`

### API Not Working
1. Verify `VITE_API_BASE_URL` is correct
2. Check network connectivity
3. Ensure CORS is properly configured on your API server
4. Check browser console for errors

### Debug Mode
When `VITE_DEBUG_MENU=true`, you'll see detailed logs in the browser console:
- API request details
- Response data
- Error information
- Menu processing steps

## Example .env Files

### Minimal Development Setup
```bash
# .env
REACT_APP_DEBUG_MENU=true
```

### Full Development Setup
```bash
# .env
VITE_API_BASE_URL=http://localhost:3001
VITE_DEBUG_MENU=true
VITE_API_TIMEOUT=5000
VITE_API_RETRY_ATTEMPTS=2
```

### Production Setup
```bash
# .env
VITE_API_BASE_URL=https://api.yourcompany.com
VITE_DEBUG_MENU=false
VITE_API_TIMEOUT=15000
VITE_API_RETRY_ATTEMPTS=3
``` 