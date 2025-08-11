import { ServiceReturn } from "../@types/service-return";
import * as path from 'path';
import * as fs from 'fs';
import { DateUtils } from "../../core/utils/date-utils";
import { TreeNode } from "../../types/TreeNode";

export class FSService {

    // read directory
    async readDirectory(dirPath: string, options?: {onlyExcel?: boolean, fileExtension?: string }):
        Promise<ServiceReturn<Array<{ name: string; path: string; fullPath: string; type: 'file' }>>> {
        try {
            let files: Array<{ name: string; path: string; fullPath: string; type: 'file' }> = [];

            if (!fs.existsSync(dirPath)) {
                return { success: false, message: 'Đường dẫn không tồn tại.' };
            }

            // Helper function to recursively collect Excel files
            function getAllExcelFilesRecursively(directory: string, options?: {onlyExcel?: boolean, fileExtension?: string }): string[] {
                let results: string[] = [];
                const list = fs.readdirSync(directory, { withFileTypes: true});
                for (const item of list) {
                    const fullPath = path.join(directory, item.name);
                    if (item.isDirectory()) {
                        const excludes = ["202507", "202508", "エビデンス"];
                        if (!excludes.includes(item.name)) {
                            results = results.concat(getAllExcelFilesRecursively(fullPath, options));
                        }
                    } else if (item.isFile() &&
                        (fullPath.endsWith(options?.fileExtension || '.xls') || fullPath.endsWith(options?.fileExtension || '.xlsx')) &&
                        !item.name.startsWith('~$')
                    ) {
                        results.push(fullPath);
                    }
                }
                return results;
            }

            const excelFiles = getAllExcelFilesRecursively(dirPath, options);
            for (const filePath of excelFiles) {
                files.push({
                    name: path.basename(filePath),
                    path: path.dirname(filePath),
                    fullPath: filePath,
                    type: 'file',
                });
            }

            return {
                success: true,
                data: files.sort((a, b) => a.name.localeCompare(b.name))
            };
        } catch (error) {
            return { success: false, message: (error as Error).message };
        }
    }

    async readDirRecursively(dirPath: string,
        options: { onlyFolders?: boolean, isHistory?: boolean, onlyExcel?: boolean, fileExtension?: string }) : Promise<ServiceReturn<TreeNode>> {

            try {

                if (!fs.existsSync(dirPath)) {
                    return { success: false, message: 'Đường dẫn không tồn tại.' };
                }
                return {
                success: true,
            };
            } catch (error) {
            return { success: false, message: (error as Error).message };
        }
    }

    // perform copy
    async copy(filePaths: string[], destinationPath: string):
        Promise<ServiceReturn<Array<{ path: string; destination: string }>>> {
        try {

            if (!fs.existsSync(destinationPath)) {
                return { success: false, message: 'Đường dẫn không tồn tại.' };
            }

            let yyyyMMdd = DateUtils.getNow('yyyyMMdd');

            const path_his = path.join(destinationPath, yyyyMMdd);

            let path_his_cnt = path_his;
            if (!fs.existsSync(path_his)) {
                fs.mkdirSync(path_his);
            } else {
                let count = 0;
                while (true) {
                    count++;
                    path_his_cnt = path.join(path_his + "_" + "0" + count);
                    if (!fs.existsSync(path_his_cnt)) {
                        fs.mkdirSync(path_his_cnt);
                        break;
                    }
                }
            }

            function copyFolder(filePath: string, destinationPath: string): 
                { success: boolean; path: string; destination: string; message?: string } {
                try {
                    const items = fs.readdirSync(filePath);

                    for (const item of items) {
                        const fullPath = path.join(filePath, item);
                        const destinationFullPath = path.join(destinationPath, item);

                        if (fs.statSync(fullPath).isDirectory()) {
                            if (!fs.existsSync(destinationFullPath)) {
                                fs.mkdirSync(destinationFullPath, { recursive: true });
                            }
                            copyFolder(fullPath, destinationFullPath);
                        } else {
                            copyFile(fullPath, destinationFullPath);
                        }
                    }
                    return { success: true, path: filePath, destination: destinationPath };
                } catch (error) {
                    return { success: false, path: filePath, destination: destinationPath, message: (error as Error).message };
                }
            }

            async function copyFile(filePath: string, destinationPath: string): 
                Promise<{ success: boolean; path: string; destination: string; message?: string }> {
                try {
                    const dir = path.dirname(destinationPath);
                    await fs.mkdirSync(dir, { recursive: true });
                    fs.copyFileSync(filePath, destinationPath);
                    return { success: true, path: filePath, destination: destinationPath };
                } catch (error) {
                    return { success: false, path: filePath, destination: destinationPath, message: (error as Error).message };
                }
            }

            const results: Array<{ path: string; destination: string }> = [];
            for (const filePath of filePaths) {
                let fullPath = filePath;

                let sub_file_path = "";

                if (fullPath.includes("##")) {
                    const concat_path = fullPath.split("##");
                    if (concat_path.length == 2) {
                        sub_file_path =  concat_path[1];
                        fullPath = path.join(concat_path[0], concat_path[1]);
                    }
                }
                
                if (fs.statSync(fullPath).isDirectory()) {
                    const result = copyFolder(fullPath, destinationPath);

                    // store history
                    copyFolder(fullPath, path_his_cnt);
                    results.push({
                        path: result.path,
                        destination: result.destination
                    });
                } else {
                    const result = await copyFile(fullPath, path.join(destinationPath, sub_file_path));
                    // store history
                    await copyFile(fullPath, path.join(path_his_cnt, sub_file_path));
                    results.push({
                        path: result.path,
                        destination: result.destination
                    });
                }
            }

            return { success: true, data: results };
        } catch (error) {
            return { success: false, message: (error as Error).message };
        }
    }

    // check exist path
    async isExitDirectory(path: string) {
        return await fs.existsSync(path);
    }
}

export const fsService = new FSService();