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
import { LinkIcon, TrashIcon } from '@heroicons/react/24/outline';
import { fsController } from '../controller/fs-controller';
import { FileItem } from '../types/FileItem';
import { FaFileExcel } from 'react-icons/fa';
import { s3Controller } from '../controller/s3-controller';

const S3UploadPage: React.FC = () => {
    const [modalTitle, setModalTitle] = useState<string>("");
    const [openModal, setOpenModal] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
    const { showLoading, hideLoading } = useLoading();
    const [uploadFileItems, setUploadFileItems] = useState<FileItem[]>([]);
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
                        console.log(results.data)
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

    const uploadAction03 = async (keyCode: string, rows: FileItem[]) => {

        if (rows.length === 0) {
            showNotification("Chưa chọn tập tin để tải lên.", "error");

            return;
        }
        setModalTitle("Thực hiện tải tập tin lên S3 AWS")
        setUploadFileItems(rows);
        setOpenModal(true);
    }

    const uploadAction05 = async (keyCode: string, rows: FileItem[]) => {

        if (rows.length === 0) {
            showNotification("Chưa chọn tập tin để tải lên.", "error");
            return;
        }

        setUploadFileItems(rows);
        setOpenModal(true);
    }

    const handleConfirmUpload = async () => {
        try {
            showLoading('Đang thực hiện tải tập tin lên S3. Vui lòng không tắt màn hình...');

            const filesToUpload = Array.from(uploadFileItems);
            const totalFiles = filesToUpload.length;
            let uploadedCount = 0;

            for (const file of filesToUpload) {
                try {
                    // Update progress for this file
                    setUploadProgress(prev => ({ ...prev, [file.full_path]: 0 }));

                    // Simulate upload progress (replace with actual upload logic)
                    for (let i = 0; i <= 100; i += 10) {
                        setUploadProgress(prev => ({ ...prev, [file.full_path]: i }));
                        await new Promise(resolve => setTimeout(resolve, 100));

                    }
                    console.log(file.full_path)

                    const params = {
                        
                    } as { destination: string, fileUploads: {file_path: string, sub_bucket: string}}
                    // TODO: Implement actual S3 upload here
                    // await s3Controller.handleUploadFile(params);

                    uploadedCount++;
                    showNotification(`Đã tải tập tin: ${file.name}`, 'success');
                } catch (error) {
                    showNotification(`Tập tin tải thất bại: ${file.name}`, 'error');
                }
            }

            if (uploadedCount === totalFiles) {
                showNotification(`Đã thực hiện tải thành công ${uploadedCount} tập tin lên S3`, 'success');
            } else {
                showNotification(`Đã tải ${uploadedCount}/${totalFiles} tập tin.`, 'info');
            }
        } catch (error) {
            showNotification('Tải tập tin lên S3 thất bại', 'error');
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
        { key: 'name', label: 'Tên tập tin' },
        { key: 'size', label: 'Kích thước' },
        { key: 'progress', label: 'Tiến trình (%)' }
    ];

    const customCellRender = {
        name: (row: Record<string, any>) => (
            <div className="flex items-center space-x-2">
                <FaFileExcel className="w-5 h-5 text-green-600" />
                <span className="font-medium text-gray-900">{row.name}</span>
            </div>
        ),
        size: (row: Record<string, any>) => (
            <span className="text-gray-600">{formatFileSize(row.size)}</span>
        ),
        progress: (row: Record<string, any>) => {
            const prog = uploadProgress[row.file_path] || 0;
            return (
                <div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${prog}%` }}
                        ></div>
                    </div>
                    <span className="text-xs text-gray-500">{prog}%</span>
                </div>
            );
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
                                name: file.name,
                                size: file.file_size,
                                progress: file.file_path
                            }))}
                            showFilter={false}
                            showCheckboxes={false}
                            customCellRender={customCellRender}
                            rowKey="file_path"
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
                            <span>Bắt đầu...</span>
                        </Button>
                    </div>
                </div>
            </Modal>
        </React.Fragment>
    );
};

export default S3UploadPage; 