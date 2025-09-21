import React, { useEffect, useMemo, useState } from "react"
import Fieldset from "../components/ui/Fieldset";
import Button from "../components/ui/Button";
import { FcOk, FcProcess, FcReuse, FcRightDown2 } from "react-icons/fc";
import { BIObjectInfo } from "../types/bitools_item";
import Modal from "../components/ui/Modal";
import { StringUtils } from "../core/utils/string-utils";
import { s3Controller } from "../controller/s3-controller";
import { fsController } from "../controller/fs-controller";
import { GiExitDoor } from "react-icons/gi";
import DataTable from "../components/ui/DataTable";
import { useLoading } from "../stores/LoadingContext";
import { aws_storage } from "../types/aws_storage";
import { showNotification } from "../components/notification";
import { appController } from "../controller/app_controller";
import TabView from "../components/ui/TabView";
import { useAuth } from "../stores/AuthContext";
import { TfiBrushAlt } from "react-icons/tfi";
import { file_item } from "../types/file_item";
import S3Upload from "../components/S3Upload";
import { FaFileExcel } from "react-icons/fa";

const BIToolManagePage: React.FC = () => {
    const { user } = useAuth();
    const { showLoading, hideLoading } = useLoading();
    const [displayModal, setDisplayModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUploadable, setUploadable] = useState(false);
    const [isProcessUpload, setProcessUpload] = useState(false);
    const [isProcessDelete, setProcessDelete] = useState(false);
    const [modalTitle, setModalTitle] = useState<string>("");
    const [aws_storages, setAwsStorages] = useState<aws_storage[]>([]);
    const [destination, setDestination] = useState<aws_storage>({} as aws_storage);
    const [aws_s3objects, setAwsS3Objects] = useState<Record<string, { bugs: BIObjectInfo[] }>>({});
    const [items, setItems] = useState<string[]>([]);
    const [uploadFileItems, setUploadFileItems] = useState<file_item[]>([]);
    const [delete_items, setDeleteItems] = useState<string[]>([]);
    const [selected_items, setSelectedItems] = useState<Set<string>>(new Set());
    const [selectDestinationPath, setSelectDestinationPath] = useState<string>("");
    const [errorCheck, setErrorCheck] = useState<string>("");

    useEffect(() => {
        setAwsStorages([]);
        const loadItems = async () => {
            const result = await appController.get_all_items('CORRECT_BUG_TRANFER');
            if (result.success && result.data) {
                setAwsStorages(result.data);
            }
        }

        loadItems();
        cleanupData();
    }, []);

    // Poll S3 fetch state every 30 minutes
    useEffect(() => {
        setAwsS3Objects({});
        if (aws_storages.length > 0) {
            let isMounted = true;
            const initialize = async () => {
                try {
                    showLoading();
                    const result = await s3Controller.get_all_biobjects(aws_storages);
                    if (result.success && result.data && isMounted) {
                        setAwsS3Objects(result.data);
                    }
                } finally {
                    hideLoading();
                }
            };

            initialize();
        }
    }, [aws_storages]);

    const columns = [
        { key: 'name', label: 'Tên tập tin' },
        { key: 'size', label: 'Kích thước' }
    ];

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

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

    const hanldeDownload = async (bugs: BIObjectInfo[]) => {
        const download_state = localStorage.getItem('download_bi_state');
        if (download_state) {
            const state = JSON.parse(download_state);
            setSelectDestinationPath(state.localPathSync);
        }
        if (StringUtils.isBlank(selectDestinationPath)) {
            const result = await s3Controller.handleGetLocalPathSync();
            if (result.success) {
                setSelectDestinationPath(result.data || "");
            }
        }
        setItems(bugs.map(bug => bug.bug_no));
        setIsDeleting(false);
        setUploadable(false);
        setModalTitle(`Thực hiện tải tập tin đã chọn ( Tổng: ${bugs.length} thư mục.)`);
        setDisplayModal(true);
    }

    const handleDelete = async (aws_storage: aws_storage, bugs: BIObjectInfo[]) => {
        setDestination(aws_storage);
        setIsDeleting(true);
        setUploadable(false);
        setProcessUpload(false);
        setProcessDelete(true);
        setDeleteItems(bugs.map(bug => bug.bug_no)|| []);
        setModalTitle("Bạn có chắc muốn xoá các thông tin bên dưới không?");
        setDisplayModal(true);
    }

    const handleUpload = async (aws_storage: aws_storage) => {
        setDestination(aws_storage);
        setIsDeleting(false);
        setUploadable(true);
        setProcessUpload(false);
        setProcessDelete(false);
        setModalTitle("Thực hiện tải tập tin lên S3 store.");
        setDisplayModal(true);
    }

    const tabs = useMemo(() => {
        return aws_storages
            .filter(aws_store => aws_store.is_upload || aws_s3objects[aws_store.aws_cd]?.bugs.length > 0)
            .map((aws_store) => {
                return {
                    label: (<div>{aws_store.aws_name_alias} <span className="text-red-600">({aws_s3objects[aws_store.aws_cd]?.bugs.length})</span></div>),
                    content: (
                        <div className="text-left text-sm max-h-[calc(100vh-250px)] overflow-y-auto">

                            {(aws_s3objects[aws_store.aws_cd]?.bugs.length > 0 || aws_store.is_upload) && (
                                <>
                                    <div className="shadow rounded grid grid-cols-1 bg-white mb-4">
                                        <div className="border-b border-gray-200">
                                            <div className="flex items-end justify-end space-x-2 py-2 gap-3">
                                                {aws_store.is_download && <Button className="flex items-center space-x-2 focus:ring-orange-400 hover:border-orange-400"
                                                    onClick={() => hanldeDownload(aws_s3objects[aws_store.aws_cd]?.bugs)}
                                                >
                                                    <FcRightDown2 className="h-4 w-4 font-bold" />
                                                    <span>Tải về</span>
                                                </Button>}

                                                {aws_store.is_upload && <Button className="flex items-center space-x-2"
                                                    onClick={() => handleUpload(aws_store)}>
                                                    <FcReuse className="h-5 w-5 font-bold" />
                                                    <span>Tải lên</span>
                                                </Button>}

                                                {aws_s3objects[aws_store.aws_cd]?.bugs.length > 0 && <Button className="flex items-center space-x-2 text-red-500 border-red-500"
                                                    onClick={() => handleDelete(aws_store, aws_s3objects[aws_store.aws_cd].bugs || [])}>
                                                    <TfiBrushAlt className="h-4 w-4 font-bold" />
                                                    <span>Xóa thư mục</span>
                                                </Button>}
                                            </div>

                                        </div>
                                    </div>
                                    <div className='py-3'>
                                        <DataTable key={aws_store.aws_cd}
                                            className='h-full'
                                            columns={[
                                                { key: 'bug_no', label: 'Bugs' }
                                            ]}
                                            data={(aws_s3objects[aws_store.aws_cd]?.bugs || []).map(bugNo => ({
                                                bug_no: bugNo.bug_no
                                            }))}
                                            showFilter={false}
                                            rowKey="bug_no"
                                            scrollHeight={380}
                                        />
                                    </div>
                                </>
                            )}
                        </div>)
                }
            });
    }, [aws_s3objects]);

    // Save state when it changes
    useEffect(() => {
        const download_state = localStorage.getItem('download_bi_state');
        let download_store: Record<string, string> = {};
        if (download_state) {
            download_store = JSON.parse(download_state)
        }

        download_store = {
            "localPathSync": selectDestinationPath
        };
        localStorage.setItem('download_bi_state', JSON.stringify(download_store));
    }, [selectDestinationPath]);

    const chooseDestinationFolder = async () => {
        const result = await fsController.selectDirectory();
        if (result.success && result.data) {
            setSelectDestinationPath(result.data);
            setErrorCheck("");
        }
    };

    const handleRefresh = async () => {
        try {
            showLoading();
            const result = await s3Controller.get_all_biobjects(aws_storages);
            if (result.success && result.data) {
                setAwsS3Objects(result.data);
            }

            cleanupData();
        } catch (error) {
            showNotification("Không thể lấy dữ liệu từ S3 AWS.")
        } finally {
            setItems([]);
            setDestination({} as aws_storage);
            setIsDeleting(false);
            hideLoading();
        }
    };

    const handleConfirm = async () => {
        try {
            if (!await fsController.isExitDirectory(selectDestinationPath)) {
                setErrorCheck("Đường dẫn không tồn tại.!");

            } else {
                showLoading('Đang thực hiện tải tập tin. Vui lòng không tắt màn hình...');
                const params = {
                    user_id: user?.username || "",
                    aws_cd: '',
                    bug_list: items,
                    localPath: selectDestinationPath,
                }
                const result = await s3Controller.handleDownloadBIFile(params);

                !result.success && showNotification(result.message || 'Tải về thất bại.', 'error');
                result.success && showNotification('Tải về thành công.', 'success');

                // clean up data
                cleanupData();
                setDisplayModal(!result.success);
                
            }
        } catch (error) {
            showNotification('Tải tập tin thất bại', 'error');
        } finally {
            hideLoading();
        }
    }

    const handleConfirmUpload = async () => {
        try {
            if (isProcessUpload) {
                showLoading('Đang thực hiện tải tập tin lên S3. Vui lòng không tắt màn hình...');

                const filesToUpload = Array.from(uploadFileItems);
                const totalFiles = filesToUpload.length;
                const params = {
                    destination: destination.aws_cd,
                    file_items: filesToUpload,
                }

                const result = await s3Controller.handleUploadBIFile(params);

                if (!result.success) {
                    showNotification('Tập tin tải thất bại', 'error');
                } else {
                    const uploadedCount = result.data?.uploaded_items.length || 0;
                    if (uploadedCount === totalFiles) {
                        showNotification(`Đã thực hiện tải thành công ${uploadedCount} tập tin lên S3`, 'success');
                    } else {
                        showNotification(`Đã tải ${uploadedCount}/${totalFiles} tập tin.`, 'info');
                    }

                    // clean up data
                    cleanupData();
                    setDisplayModal(!result.success);
                }
            } else {
                showLoading('Đang thực hiện xoá tập tin lên S3. Vui lòng không tắt màn hình...');
                const params = {
                    aws_cd: destination.aws_cd,
                    delete_items: Array.from(delete_items)
                }

                const result = await s3Controller.handleDeleteBIObjects(params);

                if (!result.success) {
                    showNotification('Xoá tập tin S3 thất bại', 'error')
                    return;
                }

                const deletedCnt = result.data?.length;
                const totalFiles = Array.from(delete_items).length;

                if (deletedCnt === totalFiles) {
                    showNotification(`Đã thực hiện xoá thành công ${deletedCnt} tập tin.`, 'success');
                } else {
                    showNotification(`Đã xoá ${deletedCnt}/${totalFiles} tập tin.`, 'info');
                }

                // clean up data
                cleanupData();
                setDisplayModal(!result.success);
            }
        } catch (error) {
            isUploadable === true && showNotification('Tải tập tin lên S3 thất bại', 'error');
            isUploadable === false && showNotification('Xoá tập tin S3 thất bại', 'error');
        } finally {
            hideLoading();
        }
    };

    const handleCancelModal = async () => {
        cleanupData();
    }

    const uploadAction = async (params: { aws_storage: aws_storage, is_folder_same_name: boolean, selected_items: file_item[] }) => {
        setDestination(params.aws_storage);
        setModalTitle("Tải lên S3 AWS")
        setUploadFileItems(params.selected_items);
        setUploadable(false);
        setDisplayModal(true);
        setProcessUpload(true);
    }

    const cleanupData = () => {
        setIsDeleting(false);
        setUploadable(false);
        setProcessUpload(false);
        setProcessDelete(false);
        setDisplayModal(false);
        setModalTitle("");
        setUploadFileItems([]);
        setItems([]);
    }

    const handleFileCheckboxChange = (fileName: string, checked: boolean) => {
        setSelectedItems(prev => {
            const newSet = new Set(prev);
            const bugNo = delete_items.find(f => f === fileName);
            if (bugNo) {
                if (checked) {
                    newSet.add(bugNo);
                } else {
                    newSet.delete(bugNo);
                }
            }
            return newSet;
        });
    };
    return (
        <>
            <div className="shadow rounded grid grid-cols-1 bg-white mb-4">
                <div className="border-b px-4 border-gray-200">
                    <div className="flex items-end justify-end space-x-2 py-2 gap-3">
                        <Button className="flex items-center space-x-2"
                            onClick={handleRefresh}>
                            <FcProcess className="w-4 h-4" />
                            <span>Tải lại</span>
                        </Button>
                    </div>
                </div>
            </div>

            <Fieldset title="Danh sách bugs">
                <div className="grid grid-cols-1">
                    {tabs.length > 0 && <TabView tabs={tabs} className='h-[calc(100vh-300px)]' />}
                </div>
            </Fieldset>

            <Modal open={displayModal} onClose={handleCancelModal} title={modalTitle} size="full">
                <div className="bg-white shadow-lg rounded-lg flex flex-col">
                    {!isUploadable && !isProcessUpload  && !isProcessDelete && <div className='grid grid-cols-1 gap-1'>
                        <DataTable
                            className='h-full'
                            columns={[
                                { key: 'bug_no', label: 'Bug đối tượng' }
                            ]}
                            data={items.map(bug_no => ({
                                bug_no: bug_no
                            }))}
                            showFilter={false}
                            rowKey="bug_no"
                        />
                    </div>}

                    {isProcessUpload && <div className='grid grid-cols-1 gap-1'>
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
                    </div>}

                    {isProcessDelete && <div className='grid grid-cols-1 gap-1'>
                        <div className="rounded-lg shadow">
                            <DataTable
                                className='h-full'
                                columns={[
                                    { key: 'bug_no', label: 'Bug đối tượng' }
                                ]}
                                data={Array.from(delete_items).map(bugno => ({
                                    bug_no: bugno
                                }))}
                                showFilter={false}
                                showCheckboxes={true}
                                selectedRows={new Set(Array.from(selected_items))}
                                onRowSelectionChange={handleFileCheckboxChange}
                                customCellRender={customCellRender}
                                rowKey="bug_no"
                            />
                        </div>
                    </div>}

                    {!isDeleting && !isUploadable && !isProcessUpload && !isProcessDelete && <div className="border-b border-gray-200 p-4">
                        <div className="flex flex-col gap-1 flex-1">
                            <div className="grid grid-cols-10 space-x-1">
                                <span className="col-span-9 flex-1 rounded-lg px-4 py-3 text-sm font-mono break-all flex items-center border border-red-300">
                                    {selectDestinationPath || 'No directory selected'}
                                </span>
                                <Button onClick={chooseDestinationFolder}>
                                    ...
                                </Button>
                            </div>
                            {errorCheck && <span className="text-red-500">{errorCheck}</span>}
                        </div>
                    </div>}

                    {isUploadable && (
                        !isProcessUpload && !isProcessDelete && <S3Upload aws_storage={destination} uploadAction={uploadAction} />
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end items-center p-4 gap-3">
                        <Button
                            onClick={handleCancelModal}
                            className="flex items-center space-x-2">
                            <GiExitDoor className="h-5 w-5" />
                            <span>Đóng</span>
                        </Button>
                        {!isDeleting && !isUploadable && !isProcessUpload && (<Button
                            onClick={handleConfirm}
                            disabled={!selectDestinationPath || errorCheck.length !== 0}
                            className="flex items-center space-x-2">
                            <FcOk className="h-5 w-5" />
                            <span>Bắt đầu...</span>
                        </Button>)}

                        {isProcessUpload && <Button
                            onClick={handleConfirmUpload}
                            className="flex items-center space-x-2">
                            <FcOk className="h-5 w-5" />
                            <span>Bắt đầu tải...</span>
                        </Button>
                        }
                        {isProcessDelete && <Button
                            onClick={handleConfirmUpload}
                            disabled={Array.from(selected_items).length ===0 }
                            className="flex items-center space-x-2">
                            <FcOk className="h-5 w-5" />
                            <span>Bắt đầu xoá...</span>
                        </Button>
                        }
                    </div>
                </div>
            </Modal>
        </>
    )
}

export default BIToolManagePage;