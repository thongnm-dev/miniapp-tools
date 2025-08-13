import React, { useState, useMemo, useCallback } from 'react';
import Button from '../components/ui/Button';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import { showNotification } from '../components/notification';
import { useLoading } from '../stores/LoadingContext';
import closeBtn from "../assets/close.png";
import okIcon from "../assets/okIcon.png";
import { FETCH_STATES_LIST } from '../config/constants';
import S3Upload from '../components/S3Upload';
import { DocumentIcon, LinkIcon, TrashIcon } from '@heroicons/react/24/outline';
import { fsController } from '../controller/fs-controller';
import { FileItem } from '../types/FileItem';

const S3UploadPage: React.FC = () => {
    const [modalTitle, setModalTitle] = useState<string>("");
    const [openModal, setOpenModal] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
    const { showLoading, hideLoading } = useLoading();
    const [uploadFileItems, setUploadFileItems] = useState<FileItem[]>([]);
    const [selectedFilesUpload, setSelectedFilesUpload] = useState<Set<FileItem>>(new Set());

    const [S303UploadItems, setS303UploadItems] = useState<FileItem[]>([]);
    const [S305UploadItems, setS305UploadItems] = useState<FileItem[]>([]);

    const S3_FOLDER_UPLOAD = useMemo(() => {
        return FETCH_STATES_LIST.
            filter((item) => item.is_to_alx === false);
    }, []);

    const S3_FOLDER_UPLOAD_03 = S3_FOLDER_UPLOAD.find((item) => item.code === "03");
    const S3_FOLDER_UPLOAD_05 = S3_FOLDER_UPLOAD.find((item) => item.code === "05");

    const actions03 = useCallback((code: string) => {
        return (
            <>
                {S303UploadItems.length > 0 && <Button onClick={() => trashList(code)} className="flex items-center space-x-2 text-red-500 border-red-500">
                    <TrashIcon className="h-5 w-5 font-bold" />
                    <span>Dọn sạch</span>
                </Button>}
                <Button onClick={() => addAttachment(code)} className="flex items-center space-x-2">
                    <LinkIcon className="h-5 w-5 font-bold" />
                    <span>Chọn tập tin</span>
                </Button>
            </>
        )
    }, [S303UploadItems]);

    const trashList = async (code: string) => {
        if (S3_FOLDER_UPLOAD_03?.code === code) {
            setS303UploadItems([]);
        } else if (S3_FOLDER_UPLOAD_05?.code === code) {
            setS305UploadItems([]);
        }
    }

    const actions05 = useCallback((code: string) => {
        return (
            <React.Fragment>
                {S305UploadItems.length > 0 && <Button onClick={() => trashList(code)} className="flex items-center space-x-2 text-red-500 border-red-500">
                    <TrashIcon className="h-5 w-5 font-bold" />
                    <span>Dọn sạch</span>
                </Button>}
                <Button onClick={() => addAttachment(code)} className="flex items-center space-x-2">
                    <LinkIcon className="h-5 w-5 font-bold" />
                    <span>Chọn tập tin</span>
                </Button>
            </React.Fragment>
        )
    }, [S305UploadItems]);

    const addAttachment = async (code: string) => {

        try {
            const result = await fsController.selectMultiDir();

            if (result.success && result.data) {
                const results = await fsController.readMultiDir(result.data);

                if (results.success && results.data) {
                    if (S3_FOLDER_UPLOAD_03?.code === code) {
                        setS303UploadItems(results.data as []);
                    } else if (S3_FOLDER_UPLOAD_05?.code === code) {
                        setS305UploadItems(results.data as []);
                    }
                }
            }
        } catch (err) {
            showNotification('Không thể chọn thư mục để tải lên.', 'error');
        } finally {
            hideLoading();
        }
    };


    const refreshData = async () => {

    }


    // handle file selection
    const handleFileSelection = (filePath: string, checked: boolean) => {
        setSelectedFilesUpload(prev => {
            const newSet = new Set(prev);
            const file = uploadFileItems.find(f => f.full_path === filePath);
            if (file) {
                if (checked) {
                    newSet.add(file);
                } else {
                    newSet.delete(file);
                }
            }
            return newSet;
        });
    };

    const uploadAction03 = async (keyCode: string, rows: FileItem[]) => {

        // if (rows.length === 0) {
        //     showNotification("Chưa chọn tập tin để tải lên.", "error");

        //     return;
        // }
        setModalTitle("Thực hiện tải tập tin lên S3 AWS")
        setUploadFileItems(rows);
        setOpenModal(true);
    }

    const uploadAction05 = async (keyCode: string, rows: FileItem[]) => {

        // if (rows.length === 0) {
        //     showNotification("Chưa chọn tập tin để tải lên.", "error");
        //     return;
        // }

        setUploadFileItems(rows);
        setOpenModal(true);
    }

    const handleConfirmUpload = async () => {
        try {
            // setShowConfirmModal(false);
            // showLoading('Uploading files to S3...');

            // const filesToUpload = Array.from(selectedFiles);
            // const totalFiles = filesToUpload.length;
            // let uploadedCount = 0;

            // for (const file of filesToUpload) {
            //     try {
            //         // Update progress for this file
            //         setUploadProgress(prev => ({ ...prev, [file.path]: 0 }));

            //         // Simulate upload progress (replace with actual upload logic)
            //         for (let i = 0; i <= 100; i += 10) {
            //             setUploadProgress(prev => ({ ...prev, [file.path]: i }));
            //             await new Promise(resolve => setTimeout(resolve, 100));
            //         }

            //         // TODO: Implement actual S3 upload here
            //         // const result = await electronAPI.s3UploadFile(file.name, file.path);

            //         uploadedCount++;
            //         showNotification(`Uploaded: ${file.name}`, 'success');
            //     } catch (error) {
            //         showNotification(`Failed to upload: ${file.name}`, 'error');
            //     }
            // }

            // if (uploadedCount === totalFiles) {
            //     showNotification(`Successfully uploaded ${uploadedCount} files to S3`, 'success');
            //     setSelectedFiles(new Set());
            //     setUploadProgress({});
            // } else {
            //     showNotification(`Uploaded ${uploadedCount}/${totalFiles} files`, 'info');
            // }
        } catch (error) {
            showNotification('Failed to upload files to S3', 'error');
        } finally {
            hideLoading();
        }
    };

    const hanldeCloseModal = () => {

        setOpenModal(false);
    }

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const columns = [
        { key: 'name', label: 'File Name' },
        { key: 'size', label: 'Size' },
        { key: 'progress', label: 'Upload Progress' },
        { key: 'actions', label: 'Actions' },
    ];

    const customCellRender = {
        name: (row: Record<string, any>) => (
            <div className="flex items-center space-x-2">
                <DocumentIcon className="w-5 h-5 text-gray-500" />
                <span className="font-medium text-gray-900">{row.name}</span>
            </div>
        ),
        size: (row: Record<string, any>) => (
            <span className="text-gray-600">{formatFileSize(row.size)}</span>
        ),
        progress: (row: Record<string, any>) => {
            const progress = uploadProgress[row.path] || 0;
            return (
                <div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    <span className="text-xs text-gray-500">{progress}%</span>
                </div>
            );
        },
        actions: (row: Record<string, any>) => {
            return (
                <div></div>
            )
        }
    };

    return (
        <React.Fragment>
            <div className="space-y-4">
                <div className="grid grid-cols-1 space-y-3">
                    <S3Upload key_code={S3_FOLDER_UPLOAD_03?.code} title={S3_FOLDER_UPLOAD_03?.path}
                        uploadAction={uploadAction03} actions={actions03(S3_FOLDER_UPLOAD_03?.code || "03")}
                        items={S303UploadItems} />
                    <S3Upload key_code={S3_FOLDER_UPLOAD_05?.code} title={S3_FOLDER_UPLOAD_05?.path}
                        uploadAction={uploadAction05} actions={actions05(S3_FOLDER_UPLOAD_05?.code || "05")}
                        items={S305UploadItems} />
                </div>
            </div>

            {/* Modal */}
            <Modal open={openModal} onClose={() => setOpenModal(false)} title={modalTitle} size="xl">
                <div className='grid grid-cols-1 gap-1'>
                    <div className="rounded-lg shadow">
                        <DataTable
                            className='h-full'
                            columns={columns}
                            data={uploadFileItems.map(file => ({
                                name: file.file_name,
                                size: 0,
                                progress: 0,
                                file: file, // Include the original file object for reference
                                actions: file.full_path
                            }))}
                            showFilter={false}
                            showCheckboxes={false}
                            customCellRender={customCellRender}
                            onRowSelectionChange={handleFileSelection}
                            rowKey="path"
                        />
                    </div>

                    <div className="bg-white flex justify-end bottom-0 gap-2 p-2">
                        <Button onClick={hanldeCloseModal}
                            className="flex items-center space-x-2">
                            <img src={closeBtn} className="h-5 w-5 animate-bounce" />
                            <span>Đóng</span>
                        </Button>
                        <Button className="flex items-center space-x-2" onClick={handleConfirmUpload}>
                            <img src={okIcon} className="h-5 w-5 animate-bounce" />
                            <span>Chọn</span>
                        </Button>
                    </div>
                </div>
            </Modal>
        </React.Fragment>
    );
};

export default S3UploadPage; 