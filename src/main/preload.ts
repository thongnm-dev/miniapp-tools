import { contextBridge, ipcRenderer, MenuItem } from 'electron';
import { RegisterCredentials } from '../types/user';
import { LoginCredentials, User } from '../types/auth';
import { ServiceReturn } from './@types/service-return';
import { TreeNode } from '../types/TreeNode';

// IPC Channel Constants - Inlined to avoid module resolution issues
// These match the constants in src/config/ipcChannels.ts
const IPC_CHANNELS = {
    // Login Operations
    LOGIN: 'login',
    REGISTER: 'register',

    // File System Operations
    SELECT_DIRECTORY: 'SELECT_DIRECTORY',
    READ_DIRECTORY: 'READ_DIRECTORY',
    READ_DIRECTORY_RECUR: 'READ_DIRECTORY_RECUR',
    READ_FILE: 'READ_FILE',
    OPEN_FILE: 'OPEN_FILE',
    COPY_FILES: 'COPY_FILES',
    MOVE_FILES: 'MOVE_FILES',
    DELETE_FILE: 'DELETE_FILE',
    IS_EXIST_DIR: 'IS_EXIST_DIR',

    // S3 Operations
    S3_PULL_ALL_OBJECTS: 'S3_PULL_ALL_OBJECTS',
    S3_PULL_OBJECT_TO_DOWNLOAD: 'S3_PULL_OBJECT_TO_DOWNLOAD',
    S3_FETCH_OBJECT_STATE: 'S3_FETCH_OBJECT_STATE',
    GET_S3_LOCAL_SYNC_WORKDIR: 'GET_S3_LOCAL_SYNC_WORKDIR',
    S3_DOWNLOAD_FILES: 'S3_DOWNLOAD_FILES',
    S3_MOVE_OBJECT: 'S3_MOVE_OBJECT',

    // File Monitoring Operations
    START_FILE_MONITORING: 'start-file-monitoring',
    STOP_FILE_MONITORING: 'stop-file-monitoring',
    STOP_ALL_FILE_MONITORING: 'stop-all-file-monitoring',
    GET_MONITORED_DIRECTORIES: 'get-monitored-directories',
    IS_FILE_MONITORING_ACTIVE: 'is-file-monitoring-active',

    // Legacy Folder Watching (for backward compatibility)
    WATCH_FOLDER: 'WATCH_FOLDER',
    UNWATCH_FOLDER: 'UNWATCH_FOLDER',

    // Events sent from main to renderer
    FOLDER_CHANGED: 'FOLDER_CHANGED',
    FILE_CHANGE_DETECTED: 'FILE_CHANGE_DETECTED',
    FILE_COPIED: 'FILE_COPIED',

    // Fetch Tran Operations
    GET_DONWLOADS: 'GET_DONWLOADS',
    GET_DOWNLOAD_DLTS: 'GET_DOWNLOAD_DLTS',
    ALLOW_DOWNLOAD_OBJECT_S3: 'ALLOW_DOWNLOAD_OBJECT_S3',
    ALLOW_MOVE_OBJECT_S3: 'ALLOW_MOVE_OBJECT_S3',

} as const;

// Expose protected methods that allow the renderer process to use
contextBridge.exposeInMainWorld('loginAPI', {
    // Login methods
    login: (credentials: LoginCredentials) => ipcRenderer.invoke(IPC_CHANNELS.LOGIN, credentials),
    register: (credentials: RegisterCredentials) => ipcRenderer.invoke(IPC_CHANNELS.REGISTER, credentials),
});

// System API
contextBridge.exposeInMainWorld('systemAPI', {
    // OPEN BROWSER FOLDER
    selectDirectory: () => ipcRenderer.invoke(IPC_CHANNELS.SELECT_DIRECTORY),

    // READ DIRECTORY FOLDER
    readDirectory: (path: string, options?: {onlyExcel?: boolean, fileExtension?: string }) =>
        ipcRenderer.invoke(IPC_CHANNELS.READ_DIRECTORY, path, options),

    // READ TREE NODE
    readDirRecursively: (path: string, options: { onlyFolders?: boolean, isHistory?: boolean, onlyExcel?: boolean, fileExtension?: string }) => 
        ipcRenderer.invoke(IPC_CHANNELS.READ_DIRECTORY_RECUR, path, options),

    // OPEN FILE
    openFile: (path: string) => ipcRenderer.invoke(IPC_CHANNELS.OPEN_FILE, path),

    // COPY FILE
    copyFiles: (filePaths: string[], destinationPath: string) => ipcRenderer.invoke(IPC_CHANNELS.COPY_FILES, filePaths, destinationPath),

    // MOVE FILE
    moveFiles: (filePaths: string[], destinationPath: string) => ipcRenderer.invoke(IPC_CHANNELS.MOVE_FILES, filePaths, destinationPath),

    // DELETE FILE
    deleteFile: (path: string) => ipcRenderer.invoke(IPC_CHANNELS.DELETE_FILE, path),

    // CHECK EXIST DIR
    isExitDirectory: (path: string) => ipcRenderer.invoke(IPC_CHANNELS.IS_EXIST_DIR, path),

    // Immediate folder watching methods when any file is changed in the folder
    watchFolder: (folderPath: string) => ipcRenderer.send(IPC_CHANNELS.WATCH_FOLDER, folderPath),
    unwatchFolder: () => ipcRenderer.send(IPC_CHANNELS.UNWATCH_FOLDER),
    onFolderChanged: (callback: () => void) => {
        ipcRenderer.removeAllListeners(IPC_CHANNELS.FOLDER_CHANGED);
        ipcRenderer.on(IPC_CHANNELS.FOLDER_CHANGED, callback);
    },

    // File monitoring methods
    startFileMonitoring: (directoryPath: string) => ipcRenderer.invoke(IPC_CHANNELS.START_FILE_MONITORING, directoryPath),
    stopFileMonitoring: (directoryPath: string) => ipcRenderer.invoke(IPC_CHANNELS.STOP_FILE_MONITORING, directoryPath),
    stopAllFileMonitoring: () => ipcRenderer.invoke(IPC_CHANNELS.STOP_ALL_FILE_MONITORING),
    getMonitoredDirectories: () => ipcRenderer.invoke(IPC_CHANNELS.GET_MONITORED_DIRECTORIES),
    isFileMonitoringActive: () => ipcRenderer.invoke(IPC_CHANNELS.IS_FILE_MONITORING_ACTIVE),

    onFileChangeDetected: (callback: (event: any) => void) => {
        ipcRenderer.removeAllListeners(IPC_CHANNELS.FILE_CHANGE_DETECTED);
        ipcRenderer.on(IPC_CHANNELS.FILE_CHANGE_DETECTED, callback);
    },
    onFileCopied: (callback: (event: any) => void) => {
        ipcRenderer.removeAllListeners(IPC_CHANNELS.FILE_COPIED);
        ipcRenderer.on(IPC_CHANNELS.FILE_COPIED, callback);
    },
});

// S3 API 
contextBridge.exposeInMainWorld('s3API', {
    pullAllObjects: () => ipcRenderer.invoke(IPC_CHANNELS.S3_PULL_ALL_OBJECTS),
    pullObjectToDownload: () => ipcRenderer.invoke(IPC_CHANNELS.S3_PULL_OBJECT_TO_DOWNLOAD),
    fetchObjectState: () => ipcRenderer.invoke(IPC_CHANNELS.S3_FETCH_OBJECT_STATE),
    getLocalPathSyncDir: () => ipcRenderer.invoke(IPC_CHANNELS.GET_S3_LOCAL_SYNC_WORKDIR),
    downloadFile: (keys: string[], localPath: string) => ipcRenderer.invoke(IPC_CHANNELS.S3_DOWNLOAD_FILES, keys, localPath),
    moveObjectS3: (formData: { source: string, destination: string, objectData: string[] }) => ipcRenderer.invoke(IPC_CHANNELS.S3_MOVE_OBJECT, formData),
});

// Fetch Tran API
contextBridge.exposeInMainWorld('downloadAPI', {
    get_downloads: (user_id: string) => ipcRenderer.invoke(IPC_CHANNELS.GET_DONWLOADS),
    get_download_dtls: (fetchId: string) => ipcRenderer.invoke(IPC_CHANNELS.GET_DOWNLOAD_DLTS, fetchId),
    allow_download: (bugs: string[]) => ipcRenderer.invoke(IPC_CHANNELS.ALLOW_DOWNLOAD_OBJECT_S3, bugs),
    allow_remove: (bugs: string[]) => ipcRenderer.invoke(IPC_CHANNELS.ALLOW_MOVE_OBJECT_S3, bugs),
});

// Type declaration for the exposed API
declare global {
    interface Window {
        loginAPI: {
            login: (credentials: LoginCredentials) =>
                Promise<{ success: boolean; message?: string; user?: User, menuItems?: MenuItem[] }>;
            register: (credentials: RegisterCredentials) =>
                Promise<{ success: boolean; message?: string; user?: User }>;
        };
        s3API: {
            pullAllObjects: () => Promise<ServiceReturn<{ [key: string]: { bugs: string[] } }>>;
            fetchObjectState: () => Promise<ServiceReturn<{ [key: string]: { bugs: { bug_no: string; message: string }[] } }>>;
            pullObjectToDownload: () => Promise<ServiceReturn<{ [key: string]: { bugs: string[] } }>>;
            getLocalPathSyncDir: () => Promise<ServiceReturn<string>>;
            downloadFile: (keys: string[], localPath: string) => Promise<ServiceReturn<boolean>>;
            moveObjectS3: (formData: { source: string, destination: string, objectData: string[] }) => Promise<ServiceReturn<boolean>>;
        };

        systemAPI: {
            selectDirectory: () => Promise<{ success: boolean; path?: string; message?: string }>;
            readDirectory: (path: string, options?: {onlyExcel?: boolean, fileExtension?: string }) =>
                Promise<{
                    success: boolean;
                    files?: Array<{ name: string; path: string; fullPath: string; type: 'file' }>;
                    message?: string
                }>;

            readDirRecursively: (path: string, options: {onlyFolders?: boolean, isHistory?: boolean, onlyExcel?: boolean, fileExtension?: string }) => Promise<ServiceReturn<TreeNode>>;

            readFile: (path: string) => Promise<{ success: boolean; data?: string; message?: string }>;
            openFile: (path: string) => Promise<{ success: boolean; message?: string }>;
            copyFiles: (filePaths: string[], destinationPath: string) =>
                Promise<{ success: boolean; results?: Array<{ success: boolean; path: string; destination?: string; message?: string }>; message?: string }>;
            moveFiles: (filePaths: string[], destinationPath: string) =>
                Promise<{ success: boolean; results?: Array<{ success: boolean; path: string; destination?: string; message?: string }>; message?: string }>;
            deleteFile: (path: string) => Promise<{ success: boolean; message?: string }>;
            watchFolder: (folderPath: string) => void;
            unwatchFolder: () => void;
            onFolderChanged: (callback: () => void) => void;

            // File monitoring methods
            startFileMonitoring: (directoryPath: string) => Promise<{ success: boolean; message?: string }>;
            stopFileMonitoring: (directoryPath: string) => Promise<{ success: boolean; message?: string }>;
            stopAllFileMonitoring: () => Promise<{ success: boolean; message?: string }>;
            getMonitoredDirectories: () => Promise<{ success: boolean; directories?: string[]; message?: string }>;
            isFileMonitoringActive: () => Promise<{ success: boolean; isActive?: boolean; message?: string }>;
            onFileChangeDetected: (callback: (event: any) => void) => void;
            onFileCopied: (callback: (event: any) => void) => void;

            isExitDirectory: (path: string) => boolean;
        };
        downloadAPI: {
            get_downloads: (user_id: string) => Promise<ServiceReturn<{ id: number, download_ymd: string, download_hm: string, sync_path: string, download_count: number, s3_state: string }[]>>;
            get_download_dtls: (fetchId: string) => Promise<ServiceReturn<{}[]>>;
            allow_download: (bugs: string[]) => Promise<ServiceReturn<boolean>>;
            allow_remove: (bugs: string[]) => Promise<ServiceReturn<boolean>>;
        };
    }
} 