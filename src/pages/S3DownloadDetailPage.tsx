import { Fragment, useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import DataTable from "../components/ui/DataTable";
import { fsController } from "../controller/fs-controller";
import Button from "../components/ui/Button";
import { DocumentDuplicateIcon, EyeIcon, FolderIcon, FolderOpenIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { showNotification } from "../components/notification";
import { useLoading } from "../stores/LoadingContext";
import Modal from "../components/ui/Modal";
import { downloadController } from "../controller/download-controller";
import { download_item } from "../types/download_item";

const S3DownloadDetailPage: React.FC = () => {
    const { id } = useParams() || "";
    const { sync_path } = useLocation().state as { sync_path: string };
    const { showLoading, hideLoading } = useLoading();
    const [displayModal, setDisplayModal] = useState(false);
    const [download_dtl_items, setDownloadItems] = useState<download_item[]>([]);
    const [selectDestinationPath, setSelectDestinationPath] = useState<string | null>(null);
    const [selectedItems, setSelectedItems] = useState<Set<download_item>>(new Set());

    useEffect(() => {
        if (id) {
            showLoading();
            downloadController.get_download_dtls(id)
                .then(result => {
                    if (result.success)
                        setDownloadItems(result.data as download_item[]);
                }).finally(() => hideLoading());
        }
    }, [id]);

    // Handle file checkbox change
    const handleFileCheckboxChange = (fileName: string, checked: boolean) => {
        setSelectedItems(prev => {
            const newSet = new Set(prev);
            const file = download_dtl_items.find(f => f.fileName === fileName);
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
    // Show in explorer
    const handleShowInExplorer = async () => {
        await fsController.openFile(sync_path);
    };

    // Open file
    const openFile = async (filePath: string) => {
        try {
            const result = await fsController.openFile(filePath);

            if (!result.success) {
                showNotification(result.message || 'Failed to open file', 'error');
            }
        } catch (err) {
            showNotification('Failed to open file', 'error');
        }
    };

    // Show in explorer
    const showInExplorer = async (path: string) => {
        const result = await fsController.openFile(path);
        if (!result.success) {
            showNotification(result.message || 'Failed to open file', 'error');
        }
    };

    // Copy folders
    const handleCopyFolders = () => {
        setDisplayModal(true);
    };

    // Select destination folder
    const chooseDestinationFolder = async () => {
        const result = await fsController.selectDirectory();
        if (result.success && result.data) {
            setSelectDestinationPath(result.data);
        }
    };

    // Copy files
    const handleConfirm = async () => {
        if (!selectDestinationPath) {
            showNotification('Hãy chọn đường dẫn nơi lưu.!', 'error');
            return;
        }

        try {
            showLoading('Đang thực hiện sao chép...');
            const download_dtl_ids = Array.from(selectedItems).map((item) => item.id.toString());

            const params = {
                  download_id: id
                , download_dtl_ids: download_dtl_ids
                , destination: selectDestinationPath} as {download_id: string, download_dtl_ids: string[], destination: string};
            const result = await downloadController.copy_and_update_path_download(params);

            if (result.success) {
                showNotification('Sao chép tập tin thành công.', 'success');
                setDisplayModal(false);
                const result = await downloadController.get_download_dtls(id || "");
                if (result.success)
                    setDownloadItems(result.data as download_item[]);
            } else {
                showNotification(result.message || 'Sao chép tập tin thất bại.!', 'error');
            }
        } catch (err) {
            showNotification('Sao chép tập tin thất bại.!', 'error');
        } finally {
            hideLoading();
        }
    };

    return (
        <Fragment>
            <div className="space-y-6">
                <div className="bg-white rounded-lg shadow p-6 space-y-4">
                    <div className="flex flex-col justify-between gap-4">
                        <h1 className="text-2xl font-bold text-gray-900">#{id} - Thông tin chi tiết lịch sử đã tải về.</h1>
                        <div className="flex items-center gap-4 flex-1 w-full border border-red-200 rounded-lg">
                            <span className="flex-1 bg-gray-50 rounded-lg px-3 py-3 text-sm text-gray-600 font-mono break-all flex items-center">
                                {sync_path}
                            </span>
                        </div>
                    </div>

                    {/* Files */}
                    <div className="bg-white rounded-lg shadow">
                        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                            <div className="flex gap-2">
                                <Button
                                    onClick={handleShowInExplorer}
                                    className="flex items-center space-x-2">
                                    <FolderOpenIcon className="w-4 h-4" />
                                    <span>Hiển thị folder</span>
                                </Button>
                                <Button
                                    onClick={handleCopyFolders}
                                    disabled={selectedItems.size == 0}
                                    className="flex items-center space-x-2"
                                >
                                    <DocumentDuplicateIcon className="w-4 h-4" />
                                    <span>Sao chép ({selectedItems.size})</span>
                                </Button>
                            </div>
                        </div>
                    </div>

                    {download_dtl_items.length == 0 ? (
                        <div className="bg-white rounded-lg shadow">
                            <div className="bg-white rounded-lg shadow">
                                <div className="p-4 text-center text-gray-500">
                                    Không có thông tin lịch sử tải về
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow grid grid-cols-1 gap-2">
                            <DataTable className='col-span-2 p-3'
                                columns={[
                                    { key: 'action', label: '' },
                                    { key: 'name', label: 'Tên tập tin' },
                                    { key: 'local', label: '' },
                                ]}
                                data={download_dtl_items
                                    .map(bug_info => ({
                                        name: bug_info.fileName,
                                        action: bug_info.sync_path,
                                        local: bug_info.file_path,
                                    }))}
                                showPagination={false}
                                showFilter={true}
                                showCheckboxes={true}
                                scrollHeight={500}
                                selectedRows={new Set(Array.from(selectedItems).map(f => f.fileName || ""))}
                                onRowSelectionChange={handleFileCheckboxChange}
                                rowKey="name"
                                customCellRender={{
                                    action: (row) => (
                                        <Button
                                            onClick={(e: React.MouseEvent) => {
                                                e.stopPropagation();
                                                openFile(row.sync_path);
                                            }}
                                        >
                                            <EyeIcon className="w-5 h-5" />
                                        </Button>
                                    ),
                                    local: (row) => (
                                        <Button
                                            onClick={(e: React.MouseEvent) => {
                                                e.stopPropagation();
                                                showInExplorer(row.local);
                                            }}
                                        >
                                            <FolderIcon className="w-5 h-5" />
                                        </Button>
                                    ),
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>

            <Modal open={displayModal} onClose={() => setDisplayModal(false)} title='Copy Files' size="xl">
                <div className="bg-white shadow-lg rounded-lg flex flex-col">
                    {/* Selected Files Summary */}
                    <div className="separator p-4">
                        <h2 className="text-lg font-semibold text-gray-900 mb-2">Danh sách file đã chọn:</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {Array.from(selectedItems).slice(0, 6).map((file: download_item, index: number) => (
                                <div key={index} className="text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded truncate">
                                    {file.fileName}
                                </div>
                            ))}
                            {Array.from(selectedItems).length > 6 && (
                                <div className="text-sm text-gray-500 bg-gray-100 px-3 py-2 rounded">
                                    ... và {Array.from(selectedItems).length - 6} tập tin.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Folders List */}
                    <div className="border-b border-gray-200 p-4">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Chọn đường dẫn đích nơi lưu
                        </h2>
                        <div className="flex items-center gap-1 flex-1">
                            <span className="flex-1 rounded-lg px-3 py-3 text-sm font-mono break-all flex items-center border border-red-300">
                                {selectDestinationPath || 'No directory selected'}
                            </span>
                            <Button onClick={chooseDestinationFolder}>
                                ...
                            </Button>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end items-center p-4 gap-3">
                        <Button
                            onClick={() => {
                                setDisplayModal(false);
                            }}
                            className="flex items-center space-x-2"
                        >
                            <XMarkIcon className="w-4 h-4" />
                            <span>Đóng</span>
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            disabled={!selectDestinationPath}
                            className="flex items-center space-x-2"
                        >
                            <DocumentDuplicateIcon className="w-4 h-4" />
                            <span>Bắt đầu</span>
                        </Button>
                    </div>
                </div>
            </Modal>
        </Fragment>
    );
};

export default S3DownloadDetailPage;