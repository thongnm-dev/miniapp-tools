

export class FSController {
    // show explore
    async selectDirectory() {
        return await window.systemAPI.selectDirectory();
    }

    async selectMultiDir() {
        return await window.systemAPI.selectMultiDir();
    }

    // read dir
    async readDirectory(path: string, options?: {onlyExcel?: boolean, fileExtension?: string }) {
        return await window.systemAPI.readDirectory(path, options);
    }

    // read dir to tree
    async readDirRecursively(path: string, options: { onlyFolders?: boolean, isHistory?: boolean, onlyExcel?: boolean, fileExtension?: string }) {
        return await window.systemAPI.readDirRecursively(path, options);
    }

    async openFile(path: string) {
        return await window.systemAPI.openFile(path);
    }

    async copyFiles(filePaths: string[], destinationPath: string) {
        return await window.systemAPI.copyFiles(filePaths, destinationPath);
    }

    async watchFolder(folderPath: string) {
        return await window.systemAPI.watchFolder(folderPath);
    }

    async unwatchFolder() {
        return await window.systemAPI.unwatchFolder();
    }

    async onFolderChanged(callback: () => void) {
        return await window.systemAPI.onFolderChanged(callback);
    }

    async onFileCopied(callback: (event: any) => void) {
        return await window.systemAPI.onFileCopied(callback);
    }

    async isExitDirectory(path: string) {
        return await window.systemAPI.isExitDirectory(path);
    }
}

export const fsController = new FSController();
