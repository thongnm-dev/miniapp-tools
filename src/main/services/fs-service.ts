import { ServiceReturn } from "../@types/service-return";
import * as path from 'path';
import * as fs from 'fs';
import { DateUtils } from "../../core/utils/date-utils";
import { FileItem } from "../../types/FileItem";

export class FSService {

    // read directory
    async readDirectory(dirPath: string, options?: {onlyExcel?: boolean, fileExtension?: string }): Promise<ServiceReturn<FileItem[]>> {
        try {
            let files: FileItem[] = [];

            if (!fs.existsSync(dirPath)) {
                return { success: false, message: 'Đường dẫn không tồn tại.' };
            }

            // Helper function to recursively collect Excel files
            function getAllFilesRecursively(directory: string, options?: {onlyExcel?: boolean, fileExtension?: string }): string[] {
                let results: string[] = [];
                const list = fs.readdirSync(directory, { withFileTypes: true});
                for (const item of list) {
                    const fullPath = path.join(directory, item.name);
                    if (item.isDirectory()) {
                        const excludes = ["202507", "202508", "エビデンス"];
                        if (!excludes.includes(item.name)) {
                            results = results.concat(getAllFilesRecursively(fullPath, options));
                        }
                    } else if (item.isFile() && !item.name.startsWith('~$')) {
                        if (options?.onlyExcel) {
                            if (fullPath.endsWith(options?.fileExtension || '.xls') || fullPath.endsWith(options?.fileExtension || '.xlsx')) {
                                results.push(fullPath);
                            }
                        } else {
                            results.push(fullPath);
                        }
                    }
                }
                return results;
            }

            const excelFiles = getAllFilesRecursively(dirPath, options);

            for (const filePath of excelFiles) {
                files.push({
                    parent_folder: path.basename(dirPath),
                    file_name: path.basename(filePath),
                    file_path: path.dirname(filePath),
                    full_path: filePath
                });
            }

            return {
                success: true,
                data: files.sort((a, b) => a.file_name.localeCompare(b.file_name))
            };
        } catch (error) {
            return { success: false, message: (error as Error).message };
        }
    }

    // read multi path
    async readMultiDir(dirPaths: string[], options?: {onlyExcel?: boolean, fileExtension?: string }): Promise<ServiceReturn<FileItem[]>> {
        try {

            let resultPromise = [];
            for (const dirPath of dirPaths) {
                resultPromise.push(this.readDirectory(dirPath, options));
            }

            const results_promise = await Promise.all(resultPromise);

            let results: FileItem [] = [];

            for (const item of results_promise.flat()) {
                results.push(...item?.data as []);
            }

            return { success: true, data: results};
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

    async deleteFile(paths: string[]) {
        let results = [];
        for (const path of paths) {
            results.push(fs.unlinkSync(path));
        }

        await Promise.all(results);
    }
}

export const fsService = new FSService();