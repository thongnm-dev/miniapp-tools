# File Monitoring System

The File Monitoring System allows you to monitor directories for file changes and receive notifications when files are copied, created, modified, or deleted.

## Features

- **Real-time Monitoring**: Monitor directories for file system changes
- **Copy Detection**: Specifically detect when files are copied to monitored folders
- **Desktop Notifications**: Receive instant notifications when files are copied
- **Event History**: View recent file events with timestamps and details
- **Multiple Directory Support**: Monitor multiple directories simultaneously
- **Easy Integration**: Built into both Folder Manager and standalone File Monitor

## How to Use

### Method 1: Using the File Monitor Page

1. Navigate to "File Monitor" in the sidebar menu
2. Click "Select Directory" to choose a folder to monitor
3. Click "Start Monitoring" to begin watching for file changes
4. Copy files to the monitored directory to see notifications
5. View recent events in the "Recent File Events" section

### Method 2: Using Folder Manager

1. Navigate to "Folder Manager" in the sidebar menu
2. Select a directory and click on a folder
3. Click the "Monitor" button in the files section header
4. Copy files to the monitored folder to receive notifications
5. Click "Stop Monitor" to stop monitoring

## File Event Types

The system detects and categorizes different types of file events:

- **Copy**: Files copied to the monitored directory
- **Create**: New files created in the monitored directory
- **Delete**: Files deleted from the monitored directory
- **Modify**: Existing files modified in the monitored directory
- **Move**: Files moved within or to the monitored directory

## Notifications

When files are copied to monitored folders, you'll receive:

1. **Desktop Notifications**: Pop-up notifications with file details
2. **Event Logging**: All events are logged with timestamps
3. **File Details**: File size, operation type, and full path information

## Technical Details

### File Monitoring Service

The system uses Node.js `fs.watch()` with the following features:

- **Recursive Monitoring**: Monitors subdirectories automatically
- **Event Filtering**: Distinguishes between copy, move, create, and delete operations
- **State Tracking**: Maintains file state to detect copy operations
- **Error Handling**: Graceful handling of file system errors

### IPC Communication

The system communicates between main and renderer processes using:

- `start-file-monitoring`: Start monitoring a directory
- `stop-file-monitoring`: Stop monitoring a specific directory
- `stop-all-file-monitoring`: Stop all monitoring
- `file-change-detected`: Event sent when any file change is detected
- `file-copied`: Special event sent when files are copied

### Event Structure

```typescript
interface FileChangeEvent {
  type: 'copy' | 'move' | 'create' | 'delete' | 'modify';
  filename: string;
  fullPath: string;
  timestamp: Date;
  details: {
    size?: number;
    sourcePath?: string;
    destinationPath?: string;
    operation: string;
  };
}
```

## Configuration

The file monitoring system requires no additional configuration. It works with any accessible directory on your system.

## Troubleshooting

### Common Issues

1. **Permission Denied**: Ensure the application has read permissions for the monitored directory
2. **No Notifications**: Check that the directory is actually being monitored (green status indicator)
3. **Events Not Detected**: Some file operations may not trigger events depending on the operating system

### Debug Information

- Check the browser console for error messages
- Monitor the application logs for file system events
- Verify directory paths are correct and accessible

## Integration with Existing Features

The file monitoring system integrates seamlessly with:

- **Folder Manager**: Monitor selected folders directly
- **Database Service**: Can be extended to save file events to database
- **S3 Service**: Can be extended to monitor S3 bucket changes
- **Notification System**: Uses the existing notification infrastructure

## Future Enhancements

Potential improvements for the file monitoring system:

1. **File Type Filtering**: Monitor only specific file types
2. **Size Thresholds**: Only notify for files above certain sizes
3. **Scheduled Monitoring**: Monitor directories at specific times
4. **Cloud Integration**: Monitor cloud storage folders
5. **Event Export**: Export file event history
6. **Advanced Analytics**: File change patterns and statistics 