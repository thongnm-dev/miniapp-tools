import * as fs from 'fs';
import * as path from 'path';
import { BrowserWindow } from 'electron';

export interface FileChangeEvent {
  type: 'copy' | 'move' | 'create' | 'delete' | 'modify' | 'unknown';
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

export class FileMonitorService {
  private watchers: Map<string, fs.FSWatcher> = new Map();
  private fileStates: Map<string, { size: number; mtime: Date }> = new Map();
  private isMonitoring: boolean = false;

  /**
   * Start monitoring a directory for file changes
   */
  startMonitoring(directoryPath: string): { success: boolean; message?: string } {
    try {
      if (this.watchers.has(directoryPath)) {
        return { success: false, message: 'Directory is already being monitored' };
      }

      // Check if directory exists and is accessible
      if (!fs.existsSync(directoryPath)) {
        return { success: false, message: 'Directory does not exist' };
      }

      // Create watcher for the directory
      const watcher = fs.watch(directoryPath, { 
        persistent: true,
        recursive: true 
      }, (eventType, filename) => {
        try {
          console.log('File watcher event:', { eventType, filename, directoryPath });
          
          if (filename) {
            this.handleFileChange(directoryPath, eventType, filename);
          } else {
            console.log('Received file event without filename, eventType:', eventType);
            // On some systems, we might need to scan the directory for changes
            this.handleDirectoryChange(directoryPath, eventType);
          }
        } catch (error) {
          console.error('Error in file watcher callback:', error);
        }
      });

      // Handle watcher errors
      watcher.on('error', (error) => {
        console.error('File watcher error:', error);
        this.watchers.delete(directoryPath);
        this.isMonitoring = this.watchers.size > 0;
      });

      this.watchers.set(directoryPath, watcher);
      this.isMonitoring = true;

      console.log(`Started monitoring directory: ${directoryPath}`);
      return { success: true, message: 'File monitoring started successfully' };
    } catch (error) {
      console.error('Error starting file monitoring:', error);
      return { success: false, message: (error as Error).message };
    }
  }

  /**
   * Stop monitoring a specific directory
   */
  stopMonitoring(directoryPath: string): { success: boolean; message?: string } {
    try {
      const watcher = this.watchers.get(directoryPath);
      if (watcher) {
        watcher.close();
        this.watchers.delete(directoryPath);
        console.log(`Stopped monitoring directory: ${directoryPath}`);
        return { success: true, message: 'File monitoring stopped successfully' };
      } else {
        return { success: false, message: 'Directory is not being monitored' };
      }
    } catch (error) {
      console.error('Error stopping file monitoring:', error);
      return { success: false, message: (error as Error).message };
    }
  }

  /**
   * Stop all file monitoring
   */
  stopAllMonitoring(): { success: boolean; message?: string } {
    try {
      for (const [directoryPath, watcher] of this.watchers) {
        watcher.close();
        console.log(`Stopped monitoring directory: ${directoryPath}`);
      }
      this.watchers.clear();
      this.fileStates.clear();
      this.isMonitoring = false;
      return { success: true, message: 'All file monitoring stopped successfully' };
    } catch (error) {
      console.error('Error stopping all file monitoring:', error);
      return { success: false, message: (error as Error).message };
    }
  }

  /**
   * Get list of monitored directories
   */
  getMonitoredDirectories(): string[] {
    return Array.from(this.watchers.keys());
  }

  /**
   * Check if monitoring is active
   */
  isMonitoringActive(): boolean {
    return this.isMonitoring;
  }

  /**
   * Handle directory change events (when filename is not provided)
   */
  private async handleDirectoryChange(directoryPath: string, eventType: string): Promise<void> {
    try {
      console.log('Handling directory change for:', directoryPath, 'eventType:', eventType);
      
      // Scan the directory for recent changes
      const files = fs.readdirSync(directoryPath);
      const now = new Date();
      
      for (const file of files) {
        try {
          const fullPath = path.join(directoryPath, file);
          const stats = fs.statSync(fullPath);
          
          // Check if file was modified in the last 5 seconds
          const timeDiff = now.getTime() - stats.mtime.getTime();
          if (timeDiff < 5000) { // 5 seconds
            console.log('Found recently modified file:', file);
            await this.handleFileChange(directoryPath, eventType, file);
          }
        } catch (error) {
          console.log('Error checking file:', file, error);
        }
      }
    } catch (error) {
      console.error('Error handling directory change:', error);
    }
  }

  /**
   * Handle file change events
   */
  private async handleFileChange(directoryPath: string, eventType: string, filename: string): Promise<void> {
    try {
      // Skip if filename is null or undefined
      if (!filename) {
        console.log('Skipping file change event - no filename provided');
        return;
      }

      // Clean up the filename (remove any path separators)
      const cleanFilename = path.basename(filename);
      console.log('Processing file change:', { eventType, filename: cleanFilename, directoryPath });

      const fullPath = path.join(directoryPath, cleanFilename);
      const eventTypeResult = this.determineEventType(eventType, fullPath);
      
      // Ensure we have a valid event type
      if (!eventTypeResult) {
        console.warn('Could not determine event type for:', cleanFilename);
        return;
      }

      const event: FileChangeEvent = {
        type: eventTypeResult,
        filename: cleanFilename,
        fullPath,
        timestamp: new Date(),
        details: {
          operation: this.getOperationDescription(eventType, fullPath)
        }
      };

      // Get additional details based on event type
      if (event.type === 'copy' || event.type === 'create') {
        try {
          // Add a small delay to ensure file is accessible
          await new Promise(resolve => setTimeout(resolve, 100));
          const stats = fs.statSync(fullPath);
          event.details.size = stats.size;
        } catch (error) {
          // File might have been deleted already or not accessible yet
          console.log('Could not get file stats:', error);
        }
      }

      // Send notification to renderer process
      this.sendNotificationToRenderer(event);

      // Update file state tracking
      this.updateFileState(fullPath, event);

    } catch (error) {
      console.error('Error handling file change:', error);
    }
  }

  /**
   * Determine the type of file event
   */
  private determineEventType(eventType: string, fullPath: string): FileChangeEvent['type'] {
    try {
      // Add a small delay to ensure file system is stable
      const exists = fs.existsSync(fullPath);
      
      if (eventType === 'rename') {
        // Check if it's a move/copy operation
        if (exists) {
          try {
            // File was created/moved/copied here
            const stats = fs.statSync(fullPath);
            const previousState = this.fileStates.get(fullPath);
            
            if (previousState) {
              // File was modified or moved
              if (stats.size !== previousState.size || stats.mtime.getTime() !== previousState.mtime.getTime()) {
                return 'copy'; // Likely a copy operation
              } else {
                return 'move';
              }
            } else {
              return 'copy'; // New file appeared
            }
          } catch (error) {
            console.log('Error getting file stats in determineEventType:', error);
            return 'create'; // Default to create if we can't get stats
          }
        } else {
          return 'delete';
        }
      } else if (eventType === 'change') {
        return 'modify';
      } else {
        return exists ? 'create' : 'delete';
      }
    } catch (error) {
      console.log('Error in determineEventType:', error);
      return 'create'; // Default to create if we can't determine
    }
  }

  /**
   * Get human-readable operation description
   */
  private getOperationDescription(eventType: string, fullPath: string): string {
    const exists = fs.existsSync(fullPath);
    
    if (eventType === 'rename') {
      if (exists) {
        return 'File copied or moved to this location';
      } else {
        return 'File deleted or moved from this location';
      }
    } else if (eventType === 'change') {
      return 'File modified';
    } else {
      return exists ? 'File created' : 'File deleted';
    }
  }

  /**
   * Update file state tracking
   */
  private updateFileState(fullPath: string, event: FileChangeEvent): void {
    try {
      if (event.type === 'delete') {
        this.fileStates.delete(fullPath);
      } else {
        try {
          const stats = fs.statSync(fullPath);
          this.fileStates.set(fullPath, {
            size: stats.size,
            mtime: stats.mtime
          });
        } catch (error) {
          console.log('Error updating file state:', error);
          // Remove the file state if we can't access it
          this.fileStates.delete(fullPath);
        }
      }
    } catch (error) {
      console.log('Error in updateFileState:', error);
      // File might not exist anymore
    }
  }

  /**
   * Send notification to renderer process
   */
  private sendNotificationToRenderer(event: FileChangeEvent): void {
    try {
      // Validate event before sending
      if (!event || !event.type || !event.filename) {
        console.warn('Invalid event data, skipping notification:', event);
        return;
      }

      const windows = BrowserWindow.getAllWindows();
      if (windows.length > 0) {
        const mainWindow = windows[0];
        
        // Convert Date to string to avoid serialization issues
        const serializedEvent = {
          ...event,
          timestamp: event.timestamp.toISOString()
        };
        
        mainWindow.webContents.send('file-change-detected', serializedEvent);
        
        // Also send a more detailed notification for copy operations
        if (event.type === 'copy') {
          mainWindow.webContents.send('file-copied', {
            ...serializedEvent,
            notification: {
              title: 'File Copied',
              message: `File "${event.filename}" was copied to the monitored folder`,
              type: 'success'
            }
          });
        }
      }
    } catch (error) {
      console.error('Error sending notification to renderer:', error);
    }
  }
}

// Export singleton instance
export const fileMonitorService = new FileMonitorService(); 