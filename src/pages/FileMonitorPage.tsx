import React, { useState, useEffect } from 'react';
import { fsController } from '../controller/fs-controller';
import Button from '../components/ui/Button';
import { showNotification } from '../components/notification';
import {
  PlayIcon, 
  StopIcon, 
  FolderIcon,
  DocumentDuplicateIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface FileChangeEvent {
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

interface FileCopyEvent extends FileChangeEvent {
  notification: {
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
  };
}

const FileMonitorPage: React.FC = () => {
  const [monitoredDirectories, setMonitoredDirectories] = useState<string[]>([]);
  const [isMonitoringActive, setIsMonitoringActive] = useState(false);
  const [selectedDirectory, setSelectedDirectory] = useState<string>('');
  const [fileEvents, setFileEvents] = useState<FileChangeEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadMonitoringStatus();
    setupEventListeners();
    
    return () => {
      // Cleanup event listeners
      fsController.onFileChangeDetected(() => {});
      fsController.onFileCopied(() => {});
    };
  }, []);

  const loadMonitoringStatus = async () => {
    try {
      setIsLoading(true);
      
      // Get monitored directories
      const dirsResult = await fsController.getMonitoredDirectories();
      if (dirsResult.success) {
        setMonitoredDirectories(dirsResult.directories || []);
      }

      // Check if monitoring is active
      const activeResult = await fsController.isFileMonitoringActive();
      if (activeResult.success) {
        setIsMonitoringActive(activeResult.isActive || false);
      }
    } catch (error) {
      console.error('Error loading monitoring status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setupEventListeners = () => {
    // Listen for all file changes
    fsController.onFileChangeDetected((event: FileChangeEvent) => {
      try {
        // Validate event data
        if (!event || typeof event !== 'object') {
          console.warn('Invalid file change event received:', event);
          return;
        }

        // Ensure required fields exist
        const validEvent = {
          type: event.type || 'unknown',
          filename: event.filename || 'Unknown file',
          fullPath: event.fullPath || '',
          timestamp: event.timestamp || new Date(),
          details: event.details || { operation: 'Unknown operation' }
        };

        setFileEvents(prev => [validEvent, ...prev.slice(0, 49)]); // Keep last 50 events
        
        // Show notification for copy events
        if (validEvent.type === 'copy') {
          showNotification(
            `File "${validEvent.filename}" was copied to monitored folder`,
            'success'
          );
        }
      } catch (error) {
        console.error('Error handling file change event:', error);
      }
    });

    // Listen specifically for file copy events
    fsController.onFileCopied((event: FileCopyEvent) => {
      try {
        if (!event || !event.notification) {
          console.warn('Invalid file copy event received:', event);
          return;
        }

        showNotification(
          event.notification.message || 'File copied',
          event.notification.type || 'info'
        );
      } catch (error) {
        console.error('Error handling file copy event:', error);
      }
    });
  };

  const handleSelectDirectory = async () => {
    try {
      const result = await fsController.selectDirectory();
      if (result.success && result.path) {
        setSelectedDirectory(result.path);
      } else if (result.message) {
        showNotification(result.message, 'error');
      }
    } catch (error) {
      showNotification('Failed to select directory', 'error');
    }
  };

  const handleStartMonitoring = async () => {
    if (!selectedDirectory) {
      showNotification('Please select a directory to monitor', 'error');
      return;
    }

    try {
      setIsLoading(true);
      const result = await fsController.startFileMonitoring(selectedDirectory);
      
      if (result.success) {
        showNotification('File monitoring started successfully', 'success');
        setMonitoredDirectories(prev => [...prev, selectedDirectory]);
        setIsMonitoringActive(true);
        setSelectedDirectory('');
      } else {
        showNotification(result.message || 'Failed to start monitoring', 'error');
      }
    } catch (error) {
      showNotification('Failed to start file monitoring', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopMonitoring = async (directoryPath: string) => {
    try {
      setIsLoading(true);
      const result = await fsController.stopFileMonitoring(directoryPath);
      
      if (result.success) {
        showNotification('File monitoring stopped successfully', 'success');
        setMonitoredDirectories(prev => prev.filter(dir => dir !== directoryPath));
        
        if (monitoredDirectories.length <= 1) {
          setIsMonitoringActive(false);
        }
      } else {
        showNotification(result.message || 'Failed to stop monitoring', 'error');
      }
    } catch (error) {
      showNotification('Failed to stop file monitoring', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopAllMonitoring = async () => {
    try {
      setIsLoading(true);
      const result = await fsController.stopAllFileMonitoring();
      
      if (result.success) {
        showNotification('All file monitoring stopped successfully', 'success');
        setMonitoredDirectories([]);
        setIsMonitoringActive(false);
      } else {
        showNotification(result.message || 'Failed to stop all monitoring', 'error');
      }
    } catch (error) {
      showNotification('Failed to stop all file monitoring', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatTimestamp = (timestamp: Date | string): string => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    return date.toLocaleString();
  };

  const getEventIcon = (type: string | undefined) => {
    switch (type) {
      case 'copy':
        return <DocumentDuplicateIcon className="w-5 h-5 text-green-500" />;
      case 'create':
        return <DocumentDuplicateIcon className="w-5 h-5 text-blue-500" />;
      case 'delete':
        return <DocumentDuplicateIcon className="w-5 h-5 text-red-500" />;
      case 'modify':
        return <DocumentDuplicateIcon className="w-5 h-5 text-yellow-500" />;
      default:
        return <DocumentDuplicateIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          File Monitor
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Monitor directories for file changes and get notified when files are copied.
        </p>

        {/* Status */}
        <div className="flex items-center space-x-4 mb-6">
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
            isMonitoringActive 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
              : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isMonitoringActive ? 'bg-green-500' : 'bg-gray-500'
            }`}></div>
            <span>{isMonitoringActive ? 'Active' : 'Inactive'}</span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <FolderIcon className="w-4 h-4" />
            <span>{monitoredDirectories.length} monitored directory{monitoredDirectories.length !== 1 ? 'ies' : 'y'}</span>
          </div>
        </div>

        {/* Directory Selection */}
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <input
              type="text"
              value={selectedDirectory}
              onChange={(e) => setSelectedDirectory(e.target.value)}
              placeholder="Select a directory to monitor..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              readOnly
            />
          </div>
          <Button
            onClick={handleSelectDirectory}
            disabled={isLoading}
            className="flex items-center space-x-2"
          >
            <FolderIcon className="w-4 h-4" />
            <span>Browse</span>
          </Button>
          <Button
            onClick={handleStartMonitoring}
            disabled={!selectedDirectory || isLoading}
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
          >
            <PlayIcon className="w-4 h-4" />
            <span>Start Monitoring</span>
          </Button>
        </div>
      </div>

      {/* Monitored Directories */}
      {monitoredDirectories.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Monitored Directories
            </h3>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {monitoredDirectories.map((directory, index) => (
              <div key={index} className="p-6 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FolderIcon className="w-5 h-5 text-blue-500" />
                  <span className="text-gray-900 dark:text-white font-medium">
                    {directory}
                  </span>
                </div>
                <Button
                  onClick={() => handleStopMonitoring(directory)}
                  disabled={isLoading}
                  className="flex items-center space-x-2 bg-red-600 hover:bg-red-700"
                >
                  <StopIcon className="w-4 h-4" />
                  <span>Stop</span>
                </Button>
              </div>
            ))}
          </div>
          <div className="p-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              onClick={handleStopAllMonitoring}
              disabled={isLoading}
              className="flex items-center space-x-2 bg-red-600 hover:bg-red-700"
            >
              <StopIcon className="w-4 h-4" />
              <span>Stop All Monitoring</span>
            </Button>
          </div>
        </div>
      )}

      {/* File Events */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            File Events ({fileEvents.length})
          </h3>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {fileEvents.length === 0 ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              <ClockIcon className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p>No file events detected yet.</p>
              <p className="text-sm">File changes will appear here when monitoring is active.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {fileEvents.map((event, index) => (
                <div key={index} className="p-6">
                  <div className="flex items-start space-x-3">
                    {getEventIcon(event.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {event.filename}
                        </h4>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTimestamp(event.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {event.fullPath}
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="capitalize">{event.type}</span>
                        {event.details.size && (
                          <span>{formatFileSize(event.details.size)}</span>
                        )}
                        {event.details.operation && (
                          <span>{event.details.operation}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileMonitorPage; 