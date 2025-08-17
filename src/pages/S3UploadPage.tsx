import React, { useMemo, useState } from 'react';
import Button from '../components/ui/Button';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import { showNotification } from '../components/notification';
import { useLoading } from '../stores/LoadingContext';
import S3Upload from '../components/S3Upload';
import { file_item } from '../types/file_item';
import { FaFileExcel } from 'react-icons/fa';
import { s3Controller } from '../controller/s3-controller';
import { useAuth } from '../stores/AuthContext';
import { FcOk } from 'react-icons/fc';
import { GiExitDoor } from 'react-icons/gi';
import { FETCH_STATES_LIST } from '../config/constants';
import { s3_state } from '../types/s3_state';
import { upload_item } from '../types/upload_item';

const S3UploadPage: React.FC = () => {
    const { user } = useAuth();
    const { showLoading, hideLoading } = useLoading();
    const [modalTitle, setModalTitle] = useState<string>("");
    const [destination, setDestination] = useState<string>("");
    const [uploaded_id, setUploadedId] = useState<string>("");
    const [modalHeaderTitle, setModalHeaderTitle] = useState<string>("");
    const [openModal, setOpenModal] = useState(false);
    const [is_updating, setIsUpdating] = useState(false);
    const [creatFolderSameName, setCreatFolderSameName] = useState(false);
    const [uploadFileItems, setUploadFileItems] = useState<file_item[]>([]);
    const [deleteItems, setDeleteItems] = useState<upload_item[]>([]);

    const S3_OBJECT_TO_DELETE = useMemo(() => {
        if (destination) {
            return FETCH_STATES_LIST.find((item) => item.link_available === destination && item.is_to_alx === true) || {} as s3_state;
        }
        return {} as s3_state;
    }, [destination]);
    
    const uploadAction = async (params: {keyCode: string, title: string, is_folder_same_name: boolean, selected_items: file_item[]}) => {
        setModalHeaderTitle(params.title);
        setCreatFolderSameName(params.is_folder_same_name);
        setDestination(params.keyCode);
        setModalTitle("Tải lên S3 AWS")
        setUploadFileItems(params.selected_items);
        setOpenModal(true);
        setIsUpdating(true);
    }

    // starting upload selected file to S3 storage
    const handleConfirm = async () => {
        try {
            if (is_updating) {
                showLoading('Đang thực hiện tải tập tin lên S3. Vui lòng không tắt màn hình...');

                const filesToUpload = Array.from(uploadFileItems);
                const totalFiles = filesToUpload.length;
                const params = {
                    user_id: user?.username || "",
                    destination: destination,
                    file_items: filesToUpload,
                    is_folder_same_name: creatFolderSameName
                }

                const result = await s3Controller.handleUploadFile(params);

                if (!result.success) {
                    showNotification('Tập tin tải thất bại', 'error');
                } else {
                    const uploadedCount = result.data?.uploaded_items.length || 0;
                    if (uploadedCount === totalFiles) {
                        showNotification(`Đã thực hiện tải thành công ${uploadedCount} tập tin lên S3`, 'success');
                    } else {
                        showNotification(`Đã tải ${uploadedCount}/${totalFiles} tập tin.`, 'info');
                    }

                    if (result.data && result.data.uploaded_items.length > 0) {
                        setModalTitle("Thực hiện xoá tập tin S3");
                        setUploadedId(result.data.upload_id);
                        setDeleteItems(result.data.uploaded_items);
                        setIsUpdating(false);
                        setOpenModal(true);
                    } else {
                        setModalTitle("");
                        setOpenModal(false);
                    }
                    setUploadFileItems([]);
                }
            } else {
                showLoading('Đang thực hiện xoá tập tin lên S3. Vui lòng không tắt màn hình...');

                const delete_items = Array.from(deleteItems.map((item) => item.bug_no)) as string[];
                const params = {
                    user_id: user?.username || "",
                    upload_id: uploaded_id,
                    relative_source: destination,
                    source: S3_OBJECT_TO_DELETE.code,
                    delete_items: delete_items
                }

                const result = await s3Controller.handleDeleteObjects(params);

                if (!result.success) {
                    showNotification('Xoá tập tin S3 thất bại', 'error')
                    return;
                }

                const deletedCnt = result.data?.length;
                const totalFiles = delete_items.length;
                
                if (deletedCnt === totalFiles) {
                    showNotification(`Đã thực hiện xoá thành công ${deletedCnt} tập tin.`, 'success');
                } else {
                    showNotification(`Đã xoá ${deletedCnt}/${totalFiles} tập tin.`, 'info');
                }
                setOpenModal(false);
                setModalTitle("");
                setDeleteItems([]);
            }
        } catch (error) {
            is_updating === true && showNotification('Tải tập tin lên S3 thất bại', 'error');
            is_updating === false && showNotification('Xoá tập tin S3 thất bại', 'error');
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
        { key: 'size', label: 'Kích thước' }
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
        )
    };

    return (
        <React.Fragment>
            <div className="space-y-4">
                <div className="grid grid-cols-1 space-y-3">
                    <S3Upload key_code="01" uploadAction={uploadAction} />
                    <S3Upload key_code="03" uploadAction={uploadAction}/>
                    <S3Upload key_code="05" uploadAction={uploadAction}/>
                </div>
            </div>

            {/* Modal */}
            <Modal open={openModal} onClose={() => setOpenModal(false)} title={modalTitle} size="xl">
                {is_updating === true && <div className='flex flex-row bg-white p-4 gap-2 border border-b-2'>
                    <span className='font-bold'>Bạn đang thực hiện tải các tập tin lên đường dẫn sau:</span>
                    <span className='text-red-600 font-bold'>{modalHeaderTitle}</span>
                </div>}
                {is_updating === false && <div className='flex flex-row bg-white p-4 gap-2 border border-b-2'>
                    <span className='font-bold'>Bạn đang thực hiện xoá các tập tin lên đường dẫn sau:</span>
                    <span className='text-red-600 font-bold'>{S3_OBJECT_TO_DELETE.path}</span>
                </div>}
                {destination === "01" && <div className='flex flex-row bg-white p-2 gap-2'>
                    <div className="flex items-center text-red-600">
                        <input id="chkCreatFolderSameName" type="checkbox" disabled={true}
                            checked={creatFolderSameName} onChange={(event) => setCreatFolderSameName(event.target.checked)}
                            className="w-4 h-4 rounded-sm bg-red-400 disable:text-red-600" />
                        <label htmlFor='chkCreatFolderSameName' className="ms-2 text-sm font-bold">Tạo thư mục tương ứng với tên tập tin</label>
                    </div>
                </div>}
                <div className='grid grid-cols-1 gap-1'>
                    {is_updating === true && <div className="rounded-lg shadow">
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
                    </div>}
                    {is_updating === false && <div className="rounded-lg shadow">
                        <DataTable
                            className='h-full'
                            columns={[
                                { key: 'name', label: 'Đối tượng xoá' }
                            ]}
                            data={deleteItems.map(file => ({
                                name: file.bug_no
                            }))}
                            showFilter={false}
                            showCheckboxes={false}
                            rowKey="bug_no"
                        />
                    </div>}

                    <div className="bg-white flex justify-end bottom-0 gap-2 p-2">
                        <Button onClick={hanldeCloseModal}
                            className="flex items-center space-x-2">
                            <GiExitDoor className="h-5 w-5" />
                            <span>Đóng</span>
                        </Button>
                        <Button className="flex items-center space-x-2" onClick={handleConfirm}>
                            <FcOk className="h-5 w-5" />
                            <span>Bắt đầu...</span>
                        </Button>
                    </div>
                </div>
            </Modal>
        </React.Fragment>
    );
};

export default S3UploadPage; 