import { FaFolderMinus, FaFolderPlus } from 'react-icons/fa';
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Button from "./ui/Button";
import DataTable from "./ui/DataTable";
import { downloadController } from "../controller/download-controller";
import { TfiBrushAlt } from "react-icons/tfi";
import { FcOk, FcProcess, FcRightDown2 } from "react-icons/fc";
import { aws_storage } from '../types/aws_storage';
import { s3Controller } from '../controller/s3-controller';
import { useLoading } from '../stores/LoadingContext';
import { showNotification } from './notification';
import { fsController } from '../controller/fs-controller';
import { StringUtils } from '../core/utils/string-utils';
import { useAuth } from '../stores/AuthContext';
import Modal from './ui/Modal';
import { GiExitDoor } from 'react-icons/gi';

export interface S3UploadProps {
    aws_storage?: aws_storage
}

const S3Download: React.FC<S3UploadProps> = ({ aws_storage = {} as aws_storage }) => {
    const { showLoading, hideLoading } = useLoading();
    const { user } = useAuth();
    const [modalOpen, setModalOpen] = useState<boolean>(true);
    const [displayModal, setDisplayModal] = useState(false);
    const [moving, setMoving] = useState<boolean>(false);
    const [downloadableMap, setDownloadableMap] = useState<Record<string, boolean>>({});
    const [moveableMap, setMoveableMap] = useState<Record<string, boolean>>({});
    const [errorCheck, setErrorCheck] = useState<string>("");
    const [modalTitle, setModalTitle] = useState<string>("");
    const [selectDestinationPath, setSelectDestinationPath] = useState<string>("");
    const [items, setItems] = useState<string[]>([]);
    const [selectedBugs, setSelectedBugs] = useState<Set<string>>(new Set());

    useEffect(() => {
        const init = async () => {
            try {
                showLoading("Đang tải dữ liệu. Vui lòng chờ...");
                const result = await s3Controller.handleGetDownloadList(aws_storage.aws_cd);

                if (result.success && result.data) {
                    setItems(result.data || []);
                }
            } finally {
                hideLoading();
            }
        }

        init();

        let isMounted = true;
        // immediately fetch every 15 minutes
        const interval = setInterval(init, 5 * 60 * 1000); // 5 minutes
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

    // Save state when it changes
    useEffect(() => {
        const stateToSave = {
            "localPathSync": selectDestinationPath
        };
        localStorage.setItem('localPathSync', JSON.stringify(stateToSave));
    }, [selectDestinationPath]);

    useEffect(() => {
        const checkAll = async () => {
            const downloadMap: Record<string, boolean> = {};
            const moveMap: Record<string, boolean> = {};
            const result = await displayDownload();
            downloadMap[aws_storage.aws_cd] = !!result;
            const resultMove = await displayMoveObject();

            moveMap[aws_storage.aws_cd] = !!resultMove;
            setDownloadableMap(downloadMap);
            setMoveableMap(moveMap);
        };

        if (items.length > 0) {
            checkAll();
        }
    }, [items]);

    const displayDownload = useCallback(async () => {

        if (items.length == 0) {
            return false;
        }
        const result = await downloadController.allow_download(items);
        if (result.success) {
            return result.data;
        }
        return false;
    }, [items]);

    const displayMoveObject = useCallback(async () => {
        if (items.length == 0) {
            return false;
        }

        const result = await downloadController.allow_remove(items);
        if (result.success) {
            return result.data;
        }
        return false;
    }, [items]);

    const toggle = () => {
        setModalOpen(!modalOpen);
    }

    const hanldeDownload = async () => {
        const savedState = localStorage.getItem('localPathSync');
        if (savedState) {
            const state = JSON.parse(savedState);
            if (state.localPathSync) setSelectDestinationPath(state.localPathSync);
        }
        if (StringUtils.isBlank(selectDestinationPath)) {
            const result = await s3Controller.handleGetLocalPathSync();
            if (result.success) {
                setSelectDestinationPath(result.data || "");
            }
        }
        setModalTitle("Chọn đường dẫn nơi lưu");
        setMoving(false);
        setDisplayModal(true);
    }

    const hanldeMove = async () => {
        setSelectedBugs(new Set(Array.from(items)));
        setModalTitle("Di chuyển file S3");
        setMoving(true);
        setDisplayModal(true);
    }

    const handleRefresh = async () => {
        try {
            showLoading("Đang tải dữ liệu. Vui lòng chờ...");
            const result = await s3Controller.handleGetDownloadList(aws_storage.aws_cd);

            if (!result.success) {
                showNotification(result.message || 'Không thể tải lại dữ liệu từ aws..', 'error');
            }
            setItems(result.data || []);
            const event = new CustomEvent("refreshDownload");
            window.dispatchEvent(event);
        } catch (error) {
            showNotification('Không thể tải lại dữ liệu từ aws..', 'error');
        } finally {
            hideLoading();
        }
    }

    const selectedFilesToMove = useMemo(() => {
        return (
            <div className="separator p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Danh sách đã chọn:</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {Array.from(selectedBugs).slice(0, 6).map((bugNo: string, index: number) => (
                        <div key={index} className="text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded truncate">
                            {bugNo}
                        </div>
                    ))}
                    {Array.from(selectedBugs).length > 6 && (
                        <div className="text-sm text-gray-500 bg-gray-100 px-3 py-2 rounded">
                            ... và {Array.from(selectedBugs).length - 6} files.
                        </div>
                    )}
                </div>
            </div>
        )
    }, [selectedBugs]);

    // Select destination folder
    const chooseDestinationFolder = async () => {
        const result = await fsController.selectDirectory();
        if (result.success && result.data) {
            setSelectDestinationPath(result.data);
            setErrorCheck("");
        }
    };

    // cancel choose folder
    const handleCancelModal = async () => {
        setDisplayModal(false);
        setMoving(false);
    };

    const reaload = async () => {
        try {
            showLoading("Đang tải dữ liệu. Vui lòng chờ...");

            const result = await s3Controller.handleGetDownloadList(aws_storage.aws_cd);

            if (result.success) {
                setItems(result.data || []);
            }
            setModalOpen(items.length === 0);
        } finally {
            hideLoading();
        }
    }
    // accept
    const handleConfirm = async () => {
        try {
            let resultFlg = false;
            setDisplayModal(false);
            if (!moving) {
                showLoading('Đang thực hiện tải tập tin. Vui lòng không tắt màn hình...');
                if (!await fsController.isExitDirectory(selectDestinationPath)) {
                    setErrorCheck("Đường dẫn không tồn tại.!");

                } else {
                    const params = {
                        user_id: user?.username || "",
                        aws_cd: aws_storage.aws_cd,
                        bug_list: items,
                        localPath: selectDestinationPath,
                    }
                    const result = await s3Controller.handleDownloadFile(params);
                    if (result.success) {
                        showNotification(result.message || 'Tải về thất bại.', 'error');
                    }
                    resultFlg = result.success;
                    result.success && showNotification('Tải về thành công.', 'success');
                    reaload();
                    const event = new CustomEvent("refreshDownload");
                    window.dispatchEvent(event);
                }
            } else {
                showLoading('Đang thực hiện di chuyển tập tin. Vui lòng không tắt màn hình...');
                const params = {
                    aws_cd: aws_storage.aws_cd,
                    file_items: Array.from(selectedBugs)
                }
                const result = await s3Controller.handleMoveObjectS3(params);
                if (result.success) {
                    showNotification(result.message || 'Di chuyển file S3 thất bại!', 'error');
                }
                result.success && showNotification('Đã di chuyển file S3 thành công.', 'success');
                resultFlg = result.success;
                reaload();
                const event = new CustomEvent("refreshDownload");
                window.dispatchEvent(event);

                const check_exist_to_download = new CustomEvent("check_exist_to_download");
                window.dispatchEvent(check_exist_to_download);
            }

            setDisplayModal(!resultFlg);
        } catch (error) {
            !moving && showNotification('Tải tập tin thất bại', 'error');
            moving && showNotification('Di chuyển file S3 thất bại!', 'error');
        } finally {
            hideLoading();
        }
    }

    return (
        <React.Fragment >
            <div className="shadow rounded grid grid-cols-1 bg-white">
                <div className="border-b px-4 border-gray-200">
                    <div className="flex items-center justify-between gap-3">
                        <button className='flex flex-row gap-4 bg-transparent flex-1' onClick={toggle}>
                            <span>
                                {modalOpen ? <FaFolderMinus className='h-6 w-6 text-orange-500' /> : <FaFolderPlus className='h-6 w-6 text-orange-500' />}
                            </span>
                            <span className="text-lg font-bold">{aws_storage.aws_name}
                                <span className="text-red-600">({items.length})</span>
                            </span>
                        </button>
                        <div className="flex items-end space-x-2 py-2">
                            <Button className="flex items-center space-x-2"
                                onClick={handleRefresh}>
                                <FcProcess className="w-4 h-4" />
                                <span>Tải lại</span>
                            </Button>

                            {items.length > 0 && moveableMap[aws_storage.aws_cd] && <Button className="flex items-center space-x-2 text-red-500 border-red-500"
                                onClick={hanldeMove}>
                                <TfiBrushAlt className="h-4 w-4 font-bold" />
                                <span>Di chuyển trên S3</span>
                            </Button>}

                            {items.length > 0 && downloadableMap[aws_storage.aws_cd] && <Button className="flex items-center space-x-2 focus:ring-orange-400 hover:border-orange-400"
                                onClick={hanldeDownload}
                            >
                                <FcRightDown2 className="h-4 w-4 font-bold" />
                                <span>Tải về</span>
                            </Button>}
                        </div>
                    </div>
                </div>

                <div className={`${modalOpen ? 'overflow-y-auto py-4' : 'h-0 hidden'}`}>
                    <div className="bg-white rounded-lg grid grid-cols-1 gap-2">
                        <DataTable className='px-2'
                            columns={[
                                { key: 'bug_no', label: 'Mã phiếu bug' }
                            ]}
                            data={items
                                .map(item => ({
                                    bug_no: item,
                                }))}
                            showPagination={false}
                            showFilter={false}
                            showCheckboxes={false}
                            scrollHeight={280}
                            rowKey="bug_no"
                        />
                    </div>
                </div>
            </div>
            <Modal open={displayModal} onClose={handleCancelModal} title={modalTitle} size="lg">
                <div className="bg-white shadow-lg rounded-lg flex flex-col">

                    {moving && selectedFilesToMove}

                    {moving && <div className="border-b border-gray-200 p-4">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Đường dẫn lưu ở S3
                        </h2>
                        <div className="flex items-center gap-1 flex-1">
                            <span className="flex-1 rounded-lg px-3 py-3 text-sm font-mono break-all flex items-center border border-red-300">
                                {aws_storage.aws_name}
                            </span>
                        </div>
                    </div>}

                    {/* Target path copy */}
                    {!moving && <div className="border-b border-gray-200 p-4">
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
                            disabled={moving ? false : !selectDestinationPath || errorCheck.length !== 0}
                            className="flex items-center space-x-2">
                            <FcOk className="h-5 w-5" />
                            <span>Bắt đầu...</span>
                        </Button>
                    </div>
                </div>
            </Modal>
        </React.Fragment>
    );
};

export default S3Download;