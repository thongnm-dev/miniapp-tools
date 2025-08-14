import { contextBridge, ipcRenderer, MenuItem } from 'electron';
import { RegisterCredentials } from '../types/user';
import { LoginCredentials, User } from '../types/auth';
import { ServiceReturn } from './@types/service-return';
import { FileItem } from '../types/FileItem';
import { download_item } from '../types/download_item';

// IPC Channel Constants - Inlined to avoid module resolution issues
// These match the constants in src/config/ipcChannels.ts
const IPC_CHANNELS = {
    // Login Operations
    LOGIN: 'login',
    REGISTER: 'register',

    // File System Operations
    SELECT_DIRECTORY: 'SELECT_DIRECTORY',
    SELECT_MULTI_DIR: 'SELECT_MULTI_DIR',
    READ_DIRECTORY: 'READ_DIRECTORY',
    READ_MULTI_DIR: 'READ_MULTI_DIR',
    READ_FILE: 'READ_FILE',
    OPEN_FILE: 'OPEN_FILE',
    COPY_FILES: 'COPY_FILES',
    MOVE_FILES: 'MOVE_FILES',
    DELETE_FILE: 'DELETE_FILE',
    IS_EXIST_DIR: 'IS_EXIST_DIR',

    // S3 Operations
    S3_GET_DOWNLOAD_LIST: 'S3_GET_DOWNLOAD_LIST',
    S3_GET_ALL_STATES: 'S3_GET_ALL_STATES',
    GET_S3_LOCAL_SYNC_WORKDIR: 'GET_S3_LOCAL_SYNC_WORKDIR',
    S3_DOWNLOAD_FILES: 'S3_DOWNLOAD_FILES',
    S3_MOVE_OBJECT: 'S3_MOVE_OBJECT',
    S3_UPLOAD_OBJECTS: 'S3_UPLOAD_OBJECTS',
    S3_DELETE_OBJECTS: 'S3_DELETE_OBJECTS',

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
    COPY_AND_UPDATE_PATH_DOWNLOAD: 'COPY_AND_UPDATE_PATH_DOWNLOAD'

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

    selectMultiDir: () => ipcRenderer.invoke(IPC_CHANNELS.SELECT_MULTI_DIR),

    // READ DIRECTORY FOLDER
    readDirectory: (path: string, options?: {onlyExcel?: boolean, fileExtension?: string }) =>
        ipcRenderer.invoke(IPC_CHANNELS.READ_DIRECTORY, path, options),

    // READ TREE NODE
    readMultiDir: (path: string, options?: { isHistory?: boolean, onlyExcel?: boolean, fileExtension?: string }) => 
        ipcRenderer.invoke(IPC_CHANNELS.READ_MULTI_DIR, path, options),

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
    onFileCopied: (callback: (event: any) => void) => {
        ipcRenderer.removeAllListeners(IPC_CHANNELS.FILE_COPIED);
        ipcRenderer.on(IPC_CHANNELS.FILE_COPIED, callback);
    },
});

// S3 API 
contextBridge.exposeInMainWorld('s3API', {
    getAllStates: () => ipcRenderer.invoke(IPC_CHANNELS.S3_GET_ALL_STATES),
    getDownloadList: () => ipcRenderer.invoke(IPC_CHANNELS.S3_GET_DOWNLOAD_LIST),
    getLocalPathSyncDir: () => ipcRenderer.invoke(IPC_CHANNELS.GET_S3_LOCAL_SYNC_WORKDIR),
    downloadFile: (user_id: string, keys: string[], localPath: string) => ipcRenderer.invoke(IPC_CHANNELS.S3_DOWNLOAD_FILES, user_id, keys, localPath),
    moveObjectS3: (params: { source: string, destination: string, objectData: string[] }) => ipcRenderer.invoke(IPC_CHANNELS.S3_MOVE_OBJECT, params),
    uploadFile: (params: { destination: string, fileUploads: {file_path: string, sub_bucket: string} }) => ipcRenderer.invoke(IPC_CHANNELS.S3_UPLOAD_OBJECTS, params),
    deleteObjectS3: (params: { destination: string, objectData: string[] }) => ipcRenderer.invoke(IPC_CHANNELS.S3_DELETE_OBJECTS, params),
});

// Fetch Tran API
contextBridge.exposeInMainWorld('downloadAPI', {
    get_downloads: (user_id: string) => ipcRenderer.invoke(IPC_CHANNELS.GET_DONWLOADS, user_id),
    get_download_dtls: (download_id: string) => ipcRenderer.invoke(IPC_CHANNELS.GET_DOWNLOAD_DLTS, download_id),
    allow_download: (bugs: string[]) => ipcRenderer.invoke(IPC_CHANNELS.ALLOW_DOWNLOAD_OBJECT_S3, bugs),
    allow_remove: (bugs: string[]) => ipcRenderer.invoke(IPC_CHANNELS.ALLOW_MOVE_OBJECT_S3, bugs),
    copy_and_update_path_download: (params: {download_id: string, download_dtl_ids: string[], destination: string}) => ipcRenderer.invoke(IPC_CHANNELS.COPY_AND_UPDATE_PATH_DOWNLOAD, params),
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
            getAllStates: () => Promise<ServiceReturn<{ [key: string]: { bugs: { bug_no: string; message: string }[] } }>>;
            getDownloadList: () => Promise<ServiceReturn<{ [key: string]: { bugs: string[] } }>>;
            getLocalPathSyncDir: () => Promise<ServiceReturn<string>>;
            downloadFile: (user_id: string, keys: string[], localPath: string) => Promise<ServiceReturn<boolean>>;
            moveObjectS3: (params: { source: string, destination: string, objectData: string[] }) => Promise<ServiceReturn<boolean>>;
            deleteObjectS3: (params: { source: string, objectData: string[] }) => Promise<ServiceReturn<boolean>>;
            uploadFile: (params: { destination: string, fileUploads: {file_path: string, sub_bucket: string}}) => Promise<ServiceReturn<boolean>>;
        };

        systemAPI: {
            selectDirectory: () => Promise<ServiceReturn<string>>;
            selectMultiDir: () => Promise<ServiceReturn<string[]>>;
            readDirectory: (path: string, options?: {onlyExcel?: boolean, fileExtension?: string }) => Promise<ServiceReturn<FileItem[]>>;
            readMultiDir: (paths: string[], options?: {isHistory?: boolean, onlyExcel?: boolean, fileExtension?: string }) => Promise<ServiceReturn<FileItem[]>>;
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
            onFileCopied: (callback: (event: any) => void) => void;
            isExitDirectory: (path: string) => boolean;
        };
        downloadAPI: {
            get_downloads: (user_id: string) => Promise<ServiceReturn<download_item[]>>;
            get_download_dtls: (fetchId: string) => Promise<ServiceReturn<download_item[]>>;
            allow_download: (bugs: string[]) => Promise<ServiceReturn<boolean>>;
            allow_remove: (bugs: string[]) => Promise<ServiceReturn<boolean>>;
            copy_and_update_path_download: (params: {download_id: string, download_dtl_ids: string[], destination: string}) => Promise<ServiceReturn<boolean>>,
        };
    }
} 