import { contextBridge, ipcRenderer, MenuItem } from 'electron';
import { RegisterCredentials } from '../types/user';
import { LoginCredentials, User } from '../types/auth';
import { ServiceReturn } from './@types/service-return';
import { file_item } from '../types/file_item';
import { download_item } from '../types/download_item';
import { upload_item } from '../types/upload_item';
import { aws_storage } from '../types/aws_storage';
import { S3ObjectInfo } from '../types/s3_object_info';
import { copy_and_update_download_params, delete_direct_s3object_params, delete_s3object_bi_params, delete_s3object_params, download_params, move_s3object_params, search_download_params, search_upload_params, upload_biparams, upload_display_params, upload_params } from '../types/param_interface';
import { BIObjectInfo } from '../types/bitools_item';

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
    S3_DELETE_OBJECTS_DIRECTLY: 'S3_DELETE_OBJECTS_DIRECTLY',
    CHECK_EXIST_TO_DOWNLOAD: 'CHECK_EXIST_TO_DOWNLOAD',

    // FOR BI TOOL
    S3_GET_ALL_BI_STATES: 'S3_GET_ALL_BI_STATES',
    S3_DOWNLOAD_BI_FILES: 'S3_DOWNLOAD_BI_FILES',
    S3_UPLOAD_BI_OBJECTS: 'S3_UPLOAD_BI_OBJECTS',
    S3_DELETE_BI_OBJECTS: 'S3_DELETE_BI_OBJECTS',

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
    COPY_AND_UPDATE_PATH_DOWNLOAD: 'COPY_AND_UPDATE_PATH_DOWNLOAD',
    SEARCH_DOWNLOAD_HISTORY: 'SEARCH_DOWNLOAD_HISTORY',

    // upload
    ALLOW_UPLOAD_OBJECT_S3: 'ALLOW_UPLOAD_OBJECT_S3',
    SEARCH_UPLOAD_HISTORY: 'SEARCH_UPLOAD_HISTORY',

    APP_VERSION: 'APP_VERSION',
    APP_API_GET_ALL_AWS_STORE: 'APP_API_GET_ALL_AWS_STORE',
    APP_API_GET_DOWNLOAD_ITEMS: 'APP_API_GET_DOWNLOAD_ITEMS',
    APP_API_GET_UPLOAD_ITEMS: 'APP_API_GET_UPLOAD_ITEMS',
    APP_API_GET_DELETE_ITEMS: 'APP_API_GET_DELETE_ITEMS',

} as const;

// Expose protected methods that allow the renderer process to use
contextBridge.exposeInMainWorld('loginAPI', {
    // Login methods
    login: (credentials: LoginCredentials) => {
        return ipcRenderer.invoke(IPC_CHANNELS.LOGIN, credentials)
    },
    register: (credentials: RegisterCredentials) => {
        return ipcRenderer.invoke(IPC_CHANNELS.REGISTER, credentials)
    },
});

// for app data
contextBridge.exposeInMainWorld('appAPI', {
    getAppVersion: () => {
        return ipcRenderer.invoke(IPC_CHANNELS.APP_VERSION) as Promise<string>;
    },
    get_all_items: (folder_key: string) => {
        return ipcRenderer.invoke(IPC_CHANNELS.APP_API_GET_ALL_AWS_STORE, folder_key) as Promise<ServiceReturn<aws_storage[]>>
    },
    get_download_items: () => {
        return ipcRenderer.invoke(IPC_CHANNELS.APP_API_GET_DOWNLOAD_ITEMS) as Promise<ServiceReturn<aws_storage[]>>
    },
    get_upload_items: () => {
        return ipcRenderer.invoke(IPC_CHANNELS.APP_API_GET_UPLOAD_ITEMS) as Promise<ServiceReturn<aws_storage[]>>
    },
    get_delete_items: (aws_cd: string) => {
        return ipcRenderer.invoke(IPC_CHANNELS.APP_API_GET_DELETE_ITEMS, aws_cd) as Promise<ServiceReturn<aws_storage[]>>
    }
});

// System API
contextBridge.exposeInMainWorld('systemAPI', {
    // OPEN BROWSER FOLDER
    selectDirectory: () => ipcRenderer.invoke(IPC_CHANNELS.SELECT_DIRECTORY),

    selectMultiDir: () => ipcRenderer.invoke(IPC_CHANNELS.SELECT_MULTI_DIR),

    // READ DIRECTORY FOLDER
    readDirectory: (path: string, options?: { onlyExcel?: boolean, fileExtension?: string }) => {
        return ipcRenderer.invoke(IPC_CHANNELS.READ_DIRECTORY, path, options)
    },

    // READ TREE NODE
    readMultiDir: (path: string, options?: { isHistory?: boolean, onlyExcel?: boolean, fileExtension?: string }) => {
        return ipcRenderer.invoke(IPC_CHANNELS.READ_MULTI_DIR, path, options)
    },

    // OPEN FILE
    openFile: (path: string) => {
        return ipcRenderer.invoke(IPC_CHANNELS.OPEN_FILE, path)
    },

    // COPY FILE
    copyFiles: (filePaths: string[], destinationPath: string) => {
        return ipcRenderer.invoke(IPC_CHANNELS.COPY_FILES, filePaths, destinationPath)
    },

    // MOVE FILE
    moveFiles: (filePaths: string[], destinationPath: string) => {
        return ipcRenderer.invoke(IPC_CHANNELS.MOVE_FILES, filePaths, destinationPath)
    },

    // DELETE FILE
    deleteFile: (path: string) => {
        return ipcRenderer.invoke(IPC_CHANNELS.DELETE_FILE, path)
    },

    // CHECK EXIST DIR
    isExitDirectory: (path: string) => {
        return ipcRenderer.invoke(IPC_CHANNELS.IS_EXIST_DIR, path)
    },

    // Immediate folder watching methods when any file is changed in the folder
    watchFolder: (folderPath: string) => {
        return ipcRenderer.send(IPC_CHANNELS.WATCH_FOLDER, folderPath)
    },
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
    get_all_s3objects: (aws_storages: aws_storage[]) => {
        return ipcRenderer.invoke(IPC_CHANNELS.S3_GET_ALL_STATES, aws_storages) as
            Promise<ServiceReturn<{ [aws_cd: string]: { bugs: S3ObjectInfo[] } }>>
    },
    get_aws_storage_list: (aws_cd: string) => {
        return ipcRenderer.invoke(IPC_CHANNELS.S3_GET_DOWNLOAD_LIST, aws_cd) as Promise<ServiceReturn<string[]>>
    },
    getLocalPathSyncDir: () => {
        return ipcRenderer.invoke(IPC_CHANNELS.GET_S3_LOCAL_SYNC_WORKDIR)
    },

    check_exist_to_download: (aws_storages: aws_storage[]) => {
        return ipcRenderer.invoke(IPC_CHANNELS.CHECK_EXIST_TO_DOWNLOAD, aws_storages)
    },

    downloadFile: (params: download_params) => {
        return ipcRenderer.invoke(IPC_CHANNELS.S3_DOWNLOAD_FILES, params)
    },

    // move object to another object
    moveObjectS3: (params: move_s3object_params) => {
        return ipcRenderer.invoke(IPC_CHANNELS.S3_MOVE_OBJECT, params)
    },

    // upload to S3
    uploadFile: (params: upload_params) => {
        return ipcRenderer.invoke(IPC_CHANNELS.S3_UPLOAD_OBJECTS, params) as
            Promise<ServiceReturn<{ upload_id: string, uploaded_items: upload_item[] }>>
    },

    deleteObjectS3: (params: delete_s3object_params) => {
        return ipcRenderer.invoke(IPC_CHANNELS.S3_DELETE_OBJECTS, params) as Promise<ServiceReturn<string[]>>
    },

    delete_objects_direct: (params: delete_direct_s3object_params) => {
        return ipcRenderer.invoke(IPC_CHANNELS.S3_DELETE_OBJECTS_DIRECTLY, params) as Promise<ServiceReturn<string[]>>
    },

    // FOR BI TOOLS
    get_all_biobjects: (aws_storages: aws_storage[]) => {
        return ipcRenderer.invoke(IPC_CHANNELS.S3_GET_ALL_BI_STATES, aws_storages) as
            Promise<ServiceReturn<Record<string, { bugs: BIObjectInfo[] }>>>
    },

    downloadBIFile: (params: download_params) => {
        return ipcRenderer.invoke(IPC_CHANNELS.S3_DOWNLOAD_BI_FILES, params) as Promise<ServiceReturn<boolean>>
    },
    // upload to S3
    uploadBIFile: (params: upload_biparams) => {
        return ipcRenderer.invoke(IPC_CHANNELS.S3_UPLOAD_BI_OBJECTS, params) as
            Promise<ServiceReturn<{ uploaded_items: upload_item[] }>>
    },
    deleteBIObjectS3: (params: delete_s3object_bi_params) => {
        return ipcRenderer.invoke(IPC_CHANNELS.S3_DELETE_BI_OBJECTS, params) as Promise<ServiceReturn<string[]>>
    },
});

// for download
contextBridge.exposeInMainWorld('downloadAPI', {
    get_downloads: (user_id: string) => {
        return ipcRenderer.invoke(IPC_CHANNELS.GET_DONWLOADS, user_id)
    },
    get_download_dtls: (download_id: string) => {
        return ipcRenderer.invoke(IPC_CHANNELS.GET_DOWNLOAD_DLTS, download_id)
    },
    allow_download: (bugs: string[]) => {
        return ipcRenderer.invoke(IPC_CHANNELS.ALLOW_DOWNLOAD_OBJECT_S3, bugs)
    },
    allow_remove: (bugs: string[]) => {
        return ipcRenderer.invoke(IPC_CHANNELS.ALLOW_MOVE_OBJECT_S3, bugs)
    },
    copy_and_update_path_download: (params: copy_and_update_download_params) => {
        return ipcRenderer.invoke(IPC_CHANNELS.COPY_AND_UPDATE_PATH_DOWNLOAD, params)
    },
    search_download_histories: (params: search_download_params) => {
        return ipcRenderer.invoke(IPC_CHANNELS.SEARCH_DOWNLOAD_HISTORY, params)
    }
});

// for upload
contextBridge.exposeInMainWorld('uploadAPI', {
    display_upload_button: (params: upload_display_params) => {
        return ipcRenderer.invoke(IPC_CHANNELS.ALLOW_UPLOAD_OBJECT_S3, params)
    },

    search_upload_histories: (params: search_upload_params) => {
        return ipcRenderer.invoke(IPC_CHANNELS.SEARCH_UPLOAD_HISTORY, params)
    }
});

// Type declaration for the exposed API
declare global {
    interface Window {
        // for credential
        loginAPI: {
            login: (credentials: LoginCredentials) =>
                Promise<{ success: boolean; message?: string; user?: User, menuItems?: MenuItem[] }>;
            register: (credentials: RegisterCredentials) =>
                Promise<{ success: boolean; message?: string; user?: User }>;
        };

        // for app data
        appAPI: {
            getAppVersion: () => Promise<string>;
            get_all_items: (folder_key: string) => Promise<ServiceReturn<aws_storage[]>>
            get_download_items: () => Promise<ServiceReturn<aws_storage[]>>
            get_upload_items: () => Promise<ServiceReturn<aws_storage[]>>
            get_delete_items: (aws_cd: string) => Promise<ServiceReturn<aws_storage[]>>
        },

        // for s3 storage
        s3API: {
            // get all object at s3
            get_all_s3objects: (aws_storages: aws_storage[]) => Promise<ServiceReturn<Record<string, { bugs: S3ObjectInfo[] }>>>;

            // get object s3 by key
            get_aws_storage_list: (aws_cd: string) => Promise<ServiceReturn<string[]>>;

            // get local path to store after download
            getLocalPathSyncDir: () => Promise<ServiceReturn<string>>;

            check_exist_to_download: (aws_storages: aws_storage[]) => Promise<ServiceReturn<Record<string, { download_available: boolean }>>>;

            // download object at S3 storage
            downloadFile: (params: download_params) => Promise<ServiceReturn<boolean>>;

            // move object to another at S3 storage
            moveObjectS3: (params: move_s3object_params) => Promise<ServiceReturn<boolean>>;

            // delete object at S3 storage
            deleteObjectS3: (params: delete_s3object_params) => Promise<ServiceReturn<string[]>>;

            // upload file to S3 storage
            uploadFile: (params: upload_params) => Promise<ServiceReturn<{ upload_id: string, uploaded_items: upload_item[] }>>;

            delete_objects_direct: (params: delete_direct_s3object_params) => Promise<ServiceReturn<string[]>>;

            // FOR BI TOOLS
            get_all_biobjects: (aws_storages: aws_storage[]) => Promise<ServiceReturn<Record<string, { bugs: BIObjectInfo[] }>>>;
            downloadBIFile: (params: download_params) => Promise<ServiceReturn<boolean>>;
            // upload file to S3 storage
            uploadBIFile: (params: upload_biparams) => Promise<ServiceReturn<{ uploaded_items: upload_item[] }>>;

            deleteBIObjectS3: (params: delete_s3object_bi_params) => Promise<ServiceReturn<string[]>>;
        };

        // for file system
        systemAPI: {
            selectDirectory: () => Promise<ServiceReturn<string>>;
            selectMultiDir: () => Promise<ServiceReturn<string[]>>;
            readDirectory: (path: string, options?: { onlyExcel?: boolean, fileExtension?: string }) => Promise<ServiceReturn<file_item[]>>;
            readMultiDir: (paths: string[], options?: { isHistory?: boolean, onlyExcel?: boolean, fileExtension?: string }) => Promise<ServiceReturn<file_item[]>>;
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

        // for download
        downloadAPI: {
            get_downloads: (user_id: string) => Promise<ServiceReturn<download_item[]>>;
            get_download_dtls: (fetchId: string) => Promise<ServiceReturn<download_item[]>>;
            allow_download: (bugs: string[]) => Promise<ServiceReturn<boolean>>;
            allow_remove: (bugs: string[]) => Promise<ServiceReturn<boolean>>;
            copy_and_update_path_download: (params: copy_and_update_download_params) => Promise<ServiceReturn<boolean>>,
            search_download_histories: (params: search_download_params) => Promise<ServiceReturn<download_item[]>>,
        };

        // for upload
        uploadAPI: {
            display_upload_button: (params: upload_display_params) => Promise<ServiceReturn<boolean>>;
            search_upload_histories: (params: search_upload_params) => Promise<ServiceReturn<upload_item[]>>;
        }
    }
} 