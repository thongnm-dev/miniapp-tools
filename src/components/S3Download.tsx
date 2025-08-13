import { ArchiveBoxXMarkIcon, ArrowDownTrayIcon, FolderMinusIcon, FolderPlusIcon } from "@heroicons/react/24/outline";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Button from "./ui/Button";
import DataTable from "./ui/DataTable";
import { downloadController } from "../controller/download-controller";

export interface S3UploadProps {
    key_code: string,
    title?: string,
    items?: string[],
    downloadAction: (keyCode: string) => void,
    moveAction: (keyCode: string) => void,
}

const S3Download: React.FC<S3UploadProps> = ({ key_code = "", title = "", items = [], downloadAction, moveAction }) => {

    const [modalOpen, setModalOpen] = useState<boolean>(true);
    const [downloadableMap, setDownloadableMap] = useState<Record<string, boolean>>({});
    const [moveableMap, setMoveableMap] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const checkAll = async () => {
            const downloadMap: Record<string, boolean> = {};
            const moveMap: Record<string, boolean> = {};

            const result = await displayDownload();
            downloadMap[key_code] = !!result;
            const resultMove = await displayMoveObject();

            moveMap[key_code] = !!resultMove;
            setDownloadableMap(downloadMap);
            setMoveableMap(moveMap);
        };

        if (key_code) {
            checkAll();
        }
    }, [items]);

    const checkDisplay = useMemo(() => {
        return items.length > 0 ;
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
        await downloadAction(key_code);
    }

    const hanldeMove = async () => {
        await moveAction(key_code);
    }

    return (
        <React.Fragment >
            {checkDisplay && <div className="shadow rounded grid grid-cols-1 bg-white">
                <div className="border-b px-4 border-gray-200">
                    <div className="flex items-center justify-between">
                        <button className='flex flex-row gap-4 bg-transparent flex-1' onClick={toggle}>
                            <span>
                                {modalOpen ? <FolderMinusIcon className='h-6 w-6' /> : <FolderPlusIcon className='h-6 w-6' />}
                            </span>
                            <span className="text-lg font-bold">{title}
                                <span className="text-red-600">({items.length})</span>
                            </span>
                        </button>
                        <div className="flex items-end space-x-2 py-2">
                            {moveableMap[key_code] && <Button className="flex items-center space-x-2 text-red-500 border-red-500"
                                onClick={hanldeMove}>
                                <ArchiveBoxXMarkIcon className="h-4 w-4 font-bold" />
                                <span>Di chuyển trên S3</span>
                            </Button>}

                            {downloadableMap[key_code] && <Button className="flex items-center space-x-2 focus:ring-orange-400 hover:border-orange-400"
                                onClick={hanldeDownload}
                            >
                                <ArrowDownTrayIcon className="h-4 w-4 font-bold" />
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
                            scrollHeight={500}
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