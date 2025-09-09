import React, { useEffect, useMemo, useState } from "react"
import Fieldset from "../components/ui/Fieldset";
import Button from "../components/ui/Button";
import { FcOk, FcProcess, FcRightDown2 } from "react-icons/fc";
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
import { useAuth } from "../stores/AuthContext";

const init_aws_storage = {
    aws_cd: "02",
    aws_name: "02_アレクシード対応中",
    subscribe: ""
} as aws_storage

const aws_storages: aws_storage[] = [init_aws_storage];

const BIToolManagePage: React.FC = () => {
    const { user } = useAuth();
    const { showLoading, hideLoading } = useLoading();
    const [displayModal, setDisplayModal] = useState(false);
    const [items, setItems] = useState<BIObjectInfo[]>([]);
    const [download_items, setDownload_items] = useState<BIObjectInfo[]>([]);
    const [selected_items, setSelectedItems] = useState<Set<BIObjectInfo>>(new Set());
    const [selectDestinationPath, setSelectDestinationPath] = useState<string>("");
    const [errorCheck, setErrorCheck] = useState<string>("");

    // Poll S3 fetch state every 30 minutes
    useEffect(() => {
        setItems([]);
        if (aws_storages.length > 0) {
            let isMounted = true;
            const initialize = async () => {
                try {
                    showLoading();
                    const result = await s3Controller.get_all_biobjects(aws_storages);
                    if (result.success && result.data && isMounted) {
                        setItems(result.data[init_aws_storage.aws_cd].bugs);
                    }
                } finally {
                    hideLoading();
                }
            };

            initialize(); // Fetch immediately on mount
            const interval = setInterval(initialize, 20 * 60 * 1000); // 5 minutes
            return () => {
                isMounted = false;
                clearInterval(interval);
            };
        }
    }, []);

    // Save state when it changes
    useEffect(() => {
        const download_state = localStorage.getItem('download_bi_state');
        let download_store: { [key: string]: {} } = {};
        if (download_state) {
            download_store = JSON.parse(download_state)
        }

        download_store[init_aws_storage.aws_cd] = {
            "localPathSync": selectDestinationPath
        };
        localStorage.setItem('download_bi_state', JSON.stringify(download_store));
    }, [selectDestinationPath]);


    const enable_download = useMemo(() => {
        return Array.from(selected_items).length > 0;
    }, [selected_items])

    const chooseDestinationFolder = async () => {
        const result = await fsController.selectDirectory();
        if (result.success && result.data) {
            setSelectDestinationPath(result.data);
            setErrorCheck("");
        }
    };

    const handleFileCheckboxChange = async (fileName: string, checked: boolean) => {
        setSelectedItems(prev => {
            const newSet = new Set(prev);
            const bugNo = items.find(f => f.bug_no === fileName);
            if (bugNo) {
                if (checked) {
                    newSet.add(bugNo);
                } else {
                    newSet.delete(bugNo);
                }
            }
            return newSet;
        });
    }

    const handleRefresh = async () => {
        try {
            showLoading();
            setItems([]);
            const result = await s3Controller.get_all_biobjects(aws_storages);
            if (result.success && result.data) {
                setItems(result.data[init_aws_storage.aws_cd].bugs);
            }
        } catch (error) {
            showNotification("Không thể lấy dữ liệu từ S3 AWS.")
        } finally {
            hideLoading();
        }
    };

    const hanldeDownload = async () => {
        const download_state = localStorage.getItem('download_bi_state');
        if (download_state) {
            const state = JSON.parse(download_state);
            if (state[init_aws_storage.aws_cd]) {
                setSelectDestinationPath(state[init_aws_storage.aws_cd].localPathSync);
            }
        }
        if (StringUtils.isBlank(selectDestinationPath)) {
            const result = await s3Controller.handleGetLocalPathSync();
            if (result.success) {
                setSelectDestinationPath(result.data || "");
            }
        }
        setDownload_items(Array.from(selected_items));
        setDisplayModal(true);
    }

    const handleConfirm = async () => {
        try {
            if (!await fsController.isExitDirectory(selectDestinationPath)) {
                setErrorCheck("Đường dẫn không tồn tại.!");

            } else {
                showLoading('Đang thực hiện tải tập tin. Vui lòng không tắt màn hình...');
                const params = {
                    user_id: user?.username || "",
                    aws_cd: init_aws_storage.aws_cd,
                    bug_list: download_items.map(item => item.bug_no),
                    localPath: selectDestinationPath,
                }
                const result = await s3Controller.handleDownloadBIFile(params);
                
                !result.success && showNotification(result.message || 'Tải về thất bại.', 'error');
                result.success && showNotification('Tải về thành công.', 'success');

                setDisplayModal(!result.success);
                setDownload_items([]);
                setSelectedItems(new Set());
            }
        } catch (error) {
            showNotification('Tải tập tin thất bại', 'error');
        } finally {
            hideLoading();
        }
    }

    const handleCancelModal = async () => {
        setDisplayModal(false);
    }

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
                        <Button className="flex items-center space-x-2 focus:ring-orange-400 hover:border-orange-400"
                            disabled={!enable_download}
                            onClick={hanldeDownload}
                        >
                            <FcRightDown2 className="h-4 w-4 font-bold" />
                            <span>Tải về</span>
                        </Button>
                    </div>

                </div>
            </div>
            <Fieldset title="Danh sách bugs">
                <>
                    <DataTable
                        className='h-full'
                        columns={[
                            { key: 'bug_no', label: 'Bugs' }
                        ]}
                        data={items.map(bugNo => ({
                            bug_no: bugNo.bug_no
                        }))}
                        showFilter={false}
                        showCheckboxes={true}
                        rowKey="bug_no"
                        scrollHeight={650}
                        selectedRows={new Set(Array.from(selected_items).map(item => item.bug_no))}
                        onRowSelectionChange={handleFileCheckboxChange}
                    />
                </>
            </Fieldset>

            <Modal open={displayModal} onClose={handleCancelModal} title={`Thực hiện tải tập tin đã chọn ( Tổng: ${download_items.length} thư mục.)`} size="xl">
                <div className="bg-white shadow-lg rounded-lg flex flex-col">
                    <div className='grid grid-cols-1 gap-1'>
                        <DataTable
                            className='h-full'
                            columns={[
                                { key: 'bug_no', label: 'Đối tượng tải về' }
                            ]}
                            data={download_items.map(bugNo => ({
                                bug_no: bugNo.bug_no
                            }))}
                            showFilter={false}
                            rowKey="bug_no"
                        />
                    </div>

                    <div className="border-b border-gray-200 p-4">
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
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end items-center p-4 gap-3">
                        <Button
                            onClick={handleCancelModal}
                            className="flex items-center space-x-2">
                            <GiExitDoor className="h-5 w-5" />
                            <span>Đóng</span>
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            disabled={!selectDestinationPath || errorCheck.length !== 0}
                            className="flex items-center space-x-2">
                            <FcOk className="h-5 w-5" />
                            <span>Bắt đầu...</span>
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    )
}

export default BIToolManagePage;