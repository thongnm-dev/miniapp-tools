import { setupFSHandlers } from "./fs-handler";
import { setupFSWatchHandlers } from "./fs-watch-handler";
import { setupLoginHandlers } from "./login-handler";
import { setupS3Handlers } from "./s3-handler";
import { setupDownloadHandlers } from "./download-handler";
import { setupUploadHandlers } from "./upload-handler";

export const initHandlers = () => {
    // setup handlers for database, s3, file monitor, folder watch, file system
    setupS3Handlers();

    setupFSWatchHandlers();

    setupFSHandlers();
    
    // setup login handlers
    setupLoginHandlers();

    // setup download handlers
    setupDownloadHandlers();

    // setup upload handlers
    setupUploadHandlers();

}