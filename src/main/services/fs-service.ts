import { ServiceReturn } from "../@types/service-return";
import * as path from 'path';
import * as fs from 'fs';
import { DateUtils } from "../../core/utils/date-utils";
import { FileItem } from "../../types/FileItem";

export class FSService {

    // read directory
    async readDirectory(dirPath: string, options?: { onlyExcel?: boolean, fileExtension?: string }): Promise<ServiceReturn<FileItem[]>> {
        try {
            let files: FileItem[] = [];

            if (!fs.existsSync(dirPath)) {
                return { success: false, message: 'Đường dẫn không tồn tại.' };
            }

            // Helper function to recursively collect Excel files
            function getAllFilesRecursively(directory: string, options?: { onlyExcel?: boolean, fileExtension?: string }): string[] {
                let results: string[] = [];
                const list = fs.readdirSync(directory, { withFileTypes: true });
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

            let counter = 1;
            for (const filePath of excelFiles) {
                files.push({
                    file_id: counter++,
                    parent_name: path.basename(dirPath),
                    name: path.basename(filePath),
                    file_path: path.dirname(filePath),
                    full_path: filePath,
                    file_size: await fs.statSync(filePath).size
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

    // read multi path
    async readMultiDir(dirPaths: string[], options?: { onlyExcel?: boolean, fileExtension?: string }): Promise<ServiceReturn<FileItem[]>> {
        try {

            let resultPromise = [];
            for (const dirPath of dirPaths) {
                resultPromise.push(this.readDirectory(dirPath, options));
            }

            const results_promise = await Promise.all(resultPromise);

            let results: FileItem[] = [];

            for (const item of results_promise.flat()) {
                results.push(...item?.data as []);
            }

            return { success: true, data: results };
        } catch (error) {
            return { success: false, message: (error as Error).message };
        }
    }

    // perform copy
    async copy(filePath: string, fileSubPath: string, destinationPath: string, destinationHis: string): Promise<ServiceReturn<Array<{ path: string; destination: string }>>> {
        try {

            if (!fs.existsSync(destinationPath)) {
                return { success: false, message: 'Đường dẫn không tồn tại.' };
            }

            if (!fs.existsSync(destinationPath)) {
                destinationHis = "";
            }

            const results: Array<{ path: string; destination: string }> = [];

            if (fs.statSync(filePath).isDirectory()) {
                const result = await this.copyFolder(filePath, destinationPath);

                for (const path of result.data || []) {
                    results.push(...results, { path: path.path, destination: path.destination });
                }

                if (destinationHis) {
                    // store history
                    await this.copyFolder(filePath, destinationHis);
                }

            } else {
                const result = await this.copyFile(filePath, path.join(destinationPath, fileSubPath));
                results.push({
                    path: result.data?.path || "",
                    destination: result.data?.destination || ""
                });

                if (destinationHis) {
                    // store history
                    await this.copyFile(filePath, path.join(destinationHis, fileSubPath));
                }
            }

            return { success: true, data: results };
        } catch (error) {
            return { success: false, message: (error as Error).message };
        }
    }

    // make folder
    async makeFolder(destinationPath: string): Promise<ServiceReturn<string>> {

        try {

            if (!fs.existsSync(destinationPath)) {
                return { success: false, message: 'Đường dẫn không tồn tại.' };
            }

            let yyyyMM = DateUtils.getNow('yyyyMM');
            let yyyyMMdd = DateUtils.getNow('yyyyMMdd');
            const path_his = path.join(destinationPath, yyyyMM, yyyyMMdd);

            let path_his_cnt = path_his;
            if (!fs.existsSync(path_his)) {
                fs.mkdirSync(path_his, { recursive: true });
            } else {
                let count = 1;
                while (true) {
                    count++;
                    path_his_cnt = path.join(path_his + "_" + "0" + count);
                    if (!fs.existsSync(path_his_cnt)) {
                        fs.mkdirSync(path_his_cnt);
                        break;
                    }
                }
            }
            return { success: true, data: path_his_cnt };
        } catch (error) {
            return { success: false, message: (error as Error).message };
        }
    }

    // copied folder
    private async copyFolder(filePath: string, destinationPath: string): Promise<ServiceReturn<{ path: string; destination: string }[]>> {
        try {
            const items = fs.readdirSync(filePath);

            let result: { path: string; destination: string }[] = [];

            for (const item of items) {
                const fullPath = path.join(filePath, item);
                const destinationFullPath = path.join(destinationPath, item);

                if (fs.statSync(fullPath).isDirectory()) {
                    if (!fs.existsSync(destinationFullPath)) {
                        fs.mkdirSync(destinationFullPath, { recursive: true });
                    }
                    const resCopied = await this.copyFolder(fullPath, destinationFullPath);

                    for (const path of resCopied.data || []) {
                        result.push(...result, { path: path.path, destination: path.destination });
                    }

                } else {
                    const resCopied = await this.copyFile(fullPath, destinationFullPath);

                    const pathCopied = resCopied.data || {} as { path: string; destination: string };
                    result.push(...result, { path: pathCopied.path, destination: pathCopied.destination });
                }
            }
            return { success: true, data: result };
        } catch (error) {
            return { success: false, message: (error as Error).message };
        }
    }

    // copied file
    async copyFile(filePath: string, destinationPath: string): Promise<ServiceReturn<{ path: string; destination: string }>> {
        try {
            const dir = path.dirname(destinationPath);
            await fs.mkdirSync(dir, { recursive: true });

            fs.copyFileSync(filePath, destinationPath);
            return {
                success: true,
                data: { path: filePath, destination: destinationPath }
            };
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