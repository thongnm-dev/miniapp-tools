import { ipcMain } from 'electron';
import { fileMonitorService } from '../services/file-monitor-service';
import { IPC_CHANNEL_HANDLERS } from '../_/ipc-channel-handlers';

export const setupFSMonitorHandlers = () => {
  // Enhanced file monitoring IPC handlers
  ipcMain.handle(IPC_CHANNEL_HANDLERS.START_FILE_MONITORING, async (_event, directoryPath: string) => {
    try {
      return fileMonitorService.startMonitoring(directoryPath);
    } catch (error) {
      console.error('Error in start-file-monitoring handler:', error);
      return { success: false, message: 'Failed to start file monitoring' };
    }
  });

  ipcMain.handle(IPC_CHANNEL_HANDLERS.STOP_FILE_MONITORING, async (_event, directoryPath: string) => {
    try {
      return fileMonitorService.stopMonitoring(directoryPath);
    } catch (error) {
      console.error('Error in stop-file-monitoring handler:', error);
      return { success: false, message: 'Failed to stop file monitoring' };
    }
  });

  ipcMain.handle(IPC_CHANNEL_HANDLERS.STOP_ALL_FILE_MONITORING, async (_event) => {
    try {
      return fileMonitorService.stopAllMonitoring();
    } catch (error) {
      console.error('Error in stop-all-file-monitoring handler:', error);
      return { success: false, message: 'Failed to stop all file monitoring' };
    }
  });

  ipcMain.handle(IPC_CHANNEL_HANDLERS.GET_MONITORED_DIRECTORIES, async (_event) => {
    try {
      return {
        success: true,
        directories: fileMonitorService.getMonitoredDirectories()
      };
    } catch (error) {
      console.error('Error in get-monitored-directories handler:', error);
      return { success: false, directories: [], message: 'Failed to get monitored directories' };
    }
  });

  ipcMain.handle(IPC_CHANNEL_HANDLERS.IS_FILE_MONITORING_ACTIVE, async (_event) => {
    try {
      return {
        success: true,
        isActive: fileMonitorService.isMonitoringActive()
      };
    } catch (error) {
      console.error('Error in is-file-monitoring-active handler:', error);
      return { success: false, isActive: false, message: 'Failed to check monitoring status' };
    }
  });
}; 