import { FaFolderMinus, FaFolderPlus } from 'react-icons/fa';
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Button from "./ui/Button";
import DataTable from "./ui/DataTable";
import { downloadController } from "../controller/download-controller";
import { TfiBrushAlt } from "react-icons/tfi";
import { FcProcess, FcRightDown2 } from "react-icons/fc";
import { aws_storage } from '../types/aws_storage';
import { s3Controller } from '../controller/s3-controller';
import { useLoading } from '../stores/LoadingContext';
import { showNotification } from './notification';

export interface S3UploadProps {
    aws_storage?: aws_storage,
    reload: boolean,
    downloadAction: (aws_storage: aws_storage, selected_items: string[]) => void,
    moveAction: (aws_storage: aws_storage, selected_items: string[]) => void,
}

const S3Download: React.FC<S3UploadProps> = ({ aws_storage = {} as aws_storage, downloadAction, moveAction, reload = false}) => {

    const [modalOpen, setModalOpen] = useState<boolean>(true);
    const [downloadableMap, setDownloadableMap] = useState<Record<string, boolean>>({});
    const [moveableMap, setMoveableMap] = useState<Record<string, boolean>>({});
    const [items, setItems] = useState<string[]>([]);
    const { showLoading, hideLoading } = useLoading();

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

        if (items.length > 0 || reload === true) {
            checkAll();
        }
    }, [items, reload]);

    const checkDisplay = useMemo(() => {
        return items.length > 0;
    }, [items])

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
        await downloadAction(aws_storage, items);
    }

    const hanldeMove = async () => {
        await moveAction(aws_storage, items);
    }

    const handleRefresh = async () => {
        try {
            showLoading("Đang tải dữ liệu. Vui lòng chờ...");
            const result = await s3Controller.handleGetDownloadList(aws_storage.aws_cd);

            if (result.success && result.data) {
                setItems(result.data || []);
            } else {
                showNotification(result.message || 'Không thể tải lại dữ liệu từ aws..', 'error');
            }
        } catch (error) {
            showNotification('Không thể tải lại dữ liệu từ aws..', 'error');
        } finally {
            hideLoading();
        }
    }

    return (
        <React.Fragment >
            {checkDisplay && <div className="shadow rounded grid grid-cols-1 bg-white">
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
                        <div className="flex gap-2">
                            <Button className="flex items-center space-x-2"
                                onClick={handleRefresh}>
                                <FcProcess className="w-4 h-4" />
                                <span>Tải lại</span>
                            </Button>
                        </div>
                        <div className="flex items-end space-x-2 py-2">
                            {moveableMap[aws_storage.aws_cd] && <Button className="flex items-center space-x-2 text-red-500 border-red-500"
                                onClick={hanldeMove}>
                                <TfiBrushAlt className="h-4 w-4 font-bold" />
                                <span>Di chuyển trên S3</span>
                            </Button>}

                            {downloadableMap[aws_storage.aws_cd] && <Button className="flex items-center space-x-2 focus:ring-orange-400 hover:border-orange-400"
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
            }
        </React.Fragment>
    );
};

export default S3Download;