import React, { useEffect, useMemo, useState } from "react";
import Button from "../components/ui/Button";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { FETCH_STATES_LIST } from "../config/constants";
import { s3Controller } from "../controller/s3-controller";
import { useLoading } from "../stores/LoadingContext";
import { showNotification } from '../components/notification';
import Modal from "../components/ui/Modal";
import { fsController } from "../controller/fs-controller";
import emptyList from "../assets/empty.gif";
import DataTable from "../components/ui/DataTable";
import { Link } from "react-router-dom";
import { downloadController } from "../controller/download-controller";
import { StringUtils } from "../core/utils/string-utils";
import S3Download from "../components/S3Download";
import Fieldset from "../components/ui/Fieldset";
import { useAuth } from "../stores/AuthContext";
import { download_item } from "../types/download_item";
import { GiExitDoor } from "react-icons/gi";
import { FcOk } from "react-icons/fc";

const columns = [
    {
        key: 'id',
        label: 'ID',
    },
    {
        key: 'download_time',
        label: 'Thời gian',
    },
    {
        key: 's3_state',
        label: 'Trạng thái S3',
    },
    {
        key: 'download_count',
        label: 'Số lượng tập tin đã tải',
    }
];

const S3_FOLDER_DOWNLOAD = FETCH_STATES_LIST.filter((item) => item.is_to_alx === true);

const S3_FOLDER_DOWNLOAD_02 = S3_FOLDER_DOWNLOAD.find((item) => item.code === "02");
const S3_FOLDER_DOWNLOAD_04 = S3_FOLDER_DOWNLOAD.find((item) => item.code === "04");

export const S3DownloadPage: React.FC = () => {
    const { showLoading, hideLoading } = useLoading();
    const { user } = useAuth();
    const [displayModal, setDisplayModal] = useState(false);
    const [moving, setMoving] = useState<boolean>(false);
    const [selectDestinationPath, setSelectDestinationPath] = useState<string>("");
    const [errorCheck, setErrorCheck] = useState<string>("");
    const [modalTitle, setModalTitle] = useState<string>("");
    const [destination, setDestination] = useState<string>("");
    const [download_items, setDownloadItems] = useState<download_item[]>([]);
    const [selectedBugs, setSelectedBugs] = useState<Set<string>>(new Set());
    const [S3_FOLDER_BUGS_02, setS3_FOLDER_BUGS_02] = useState<string[]>([]);
    const [S3_FOLDER_BUGS_04, setS3_FOLDER_BUGS_04] = useState<string[]>([]);

    const checkingData = useMemo(() => {
        return S3_FOLDER_BUGS_02.length > 0 || S3_FOLDER_BUGS_04.length > 0;
    }, [S3_FOLDER_BUGS_02, S3_FOLDER_BUGS_04]);

    useEffect(() => {
        const init = async () => {
            const result = await s3Controller.handleGetDownloadList();

            if (result.success && result.data) {
                setS3_FOLDER_BUGS_02(result.data[S3_FOLDER_DOWNLOAD_02?.code || ""]?.bugs || []);
                setS3_FOLDER_BUGS_04(result.data[S3_FOLDER_DOWNLOAD_04?.code || ""]?.bugs || []);
            }

            const result2 = await downloadController.get_downloads(user?.username || "");
            if (result2.success && result2.data) {
                setDownloadItems(result2.data as []);
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
    }, [])

    // Load saved state on component mount
    useEffect(() => {
        const savedState = localStorage.getItem('localPathSync');
        if (savedState) {
            const state = JSON.parse(savedState);
            if (state.localPathSync) setSelectDestinationPath(state.localPathSync);
        }
    }, []);

    // Save state when it changes
    useEffect(() => {
        const stateToSave = {
            "localPathSync": selectDestinationPath
        };
        localStorage.setItem('localPathSync', JSON.stringify(stateToSave));
    }, [selectDestinationPath]);

    const trackingTranLog = useMemo(() => {
        return download_items.length > 0;
    }, [download_items])

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

    const handleRefresh = async () => {
        try {
            showLoading();
            const result = await s3Controller.handleGetDownloadList();

            if (result.success && result.data) {
                setS3_FOLDER_BUGS_02(result.data[S3_FOLDER_DOWNLOAD_02?.code || ""]?.bugs || []);
                setS3_FOLDER_BUGS_04(result.data[S3_FOLDER_DOWNLOAD_04?.code || ""]?.bugs || []);
            }

            const result2 = await downloadController.get_downloads(user?.username || "");
            if (result2.success && result2.data) {
                setDownloadItems(result2.data as []);
            }

        } catch (error) {
            showNotification('Tải lại thất bại..!', 'error');
        } finally {
            hideLoading();
        }
    }

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

    // accept
    const handleConfirm = async () => {
        try {
            let resultFlg = false;
            if (!moving) {
                showLoading('Đang thực hiện tải tập tin. Vui lòng không tắt màn hình...');
                if (!await fsController.isExitDirectory(selectDestinationPath)) {
                    setErrorCheck("Đường dẫn không tồn tại.!");

                } else {
                    const result = await s3Controller.handleDownloadFile(user?.username || "", [destination], selectDestinationPath);
                    if (result.success) {
                        showNotification('Tải về thành công.', 'success');
                    } else {
                        showNotification(result.message || 'Tải về thất bại.', 'error');
                    }

                    await handleRefresh();
                    resultFlg = true;
                }
            } else {
                const params = {
                    source: destination,
                    file_items: Array.from(selectedBugs)
                }
                const result = await s3Controller.handleMoveObjectS3(params);
                if (result.success) {
                    showNotification('Đã di chuyển file S3 thành công.', 'success');
                    resultFlg = true;
                } else {
                    showNotification(result.message || 'Di chuyển file S3 thất bại!', 'error');
                }

                const resultReload = await s3Controller.handleGetDownloadList();

                if (resultReload.success && resultReload.data) {
                    setS3_FOLDER_BUGS_02(resultReload.data[S3_FOLDER_DOWNLOAD_02?.code || ""]?.bugs || []);
                    setS3_FOLDER_BUGS_04(resultReload.data[S3_FOLDER_DOWNLOAD_04?.code || ""]?.bugs || []);
                }
            }

            resultFlg && setDisplayModal(false);
        } catch (error) {
            !moving && showNotification('Tải tập tin thất bại', 'error');
            moving && showNotification('Di chuyển file S3 thất bại!', 'error');
        } finally {
            hideLoading();
        }
    }

    // handle download each group at s3 store.
    const hanldeDownload = async (code: string) => {
        if (StringUtils.isBlank(selectDestinationPath)) {
            const result = await s3Controller.handleGetLocalPathSync();
            if (result.success) {
                setSelectDestinationPath(result.data || "");
            }
        }
        setDestination(code);
        setModalTitle("Chọn đường dẫn nơi lưu");
        setMoving(false);
        setDisplayModal(true);
    }

    // handle move objects
    const hanldeMoveObject = async (code: string, selected_items: string[]) => {
        setSelectedBugs(new Set(Array.from(selected_items)));
        setDestination(code);
        setModalTitle("Di chuyển file S3");
        setMoving(true);
        setDisplayModal(true);
    }

    const customCellRender = {
        id: (row: Record<string, any>) => {
            return <Link to={`/s3download/${row.id}`}
                state={{ sync_path: row.sync_path }}
                className="text-blue-500 hover:text-blue-700">#{row.id}</Link>;
        },
        download_time: (row: Record<string, any>) => {
            return <div>{row.download_ymd + row.download_hm}</div>;
        },
    };

    return (
        <React.Fragment>
            <div className="space-y-4 grid grid-cols-1">
                <div className="bg-white rounded-lg shadow">
                    <div className="p-3 border-b border-gray-200">
                        <div className="flex gap-2">
                            <Button className="flex items-center space-x-2"
                                onClick={handleRefresh}>
                                <ArrowPathIcon className="w-4 h-4" />
                                <span>Tải lại</span>
                            </Button>
                        </div>
                    </div>
                </div>
                <div className={`bg-white rounded-lg shadow grid grid-cols-1 space-y-2 ${!(checkingData || trackingTranLog) ? 'min-h-[calc(100vh-230px)] flex items-center justify-between' : ''}`}>
                    {checkingData ? (
                        <React.Fragment>
                            <S3Download key_code={S3_FOLDER_DOWNLOAD_02?.code || ""} key="S3_FOLDER_DOWNLOAD_02"
                                title={S3_FOLDER_DOWNLOAD_02?.path || ""}
                                items={S3_FOLDER_BUGS_02}
                                downloadAction={hanldeDownload}
                                moveAction={hanldeMoveObject} />
                            {/*  */}
                            <S3Download key_code={S3_FOLDER_DOWNLOAD_04?.code || ""} key="S3_FOLDER_DOWNLOAD_04"
                                title={S3_FOLDER_DOWNLOAD_04?.path || ""}
                                items={S3_FOLDER_BUGS_04}
                                downloadAction={hanldeDownload}
                                moveAction={hanldeMoveObject} />
                        </React.Fragment>
                    ) :
                        <div className="bg-white rounded text-center text-gray-500 h-full flex flex-col items-center justify-center text-lg">
                            <img src={emptyList} />
                            <span className="text-sm text-red-500 animate-bounce py-4">
                                Không có tập tin nào để tải về...
                            </span>
                        </div>
                    }
                </div>
                {trackingTranLog &&
                    <Fieldset title="Thông tin lịch sử đã tải về">
                        <DataTable
                            data={download_items}
                            columns={columns}
                            showFilter={false}
                            showCheckboxes={false}
                            scrollHeight={400}
                            customCellRender={customCellRender}
                        />
                    </Fieldset>
                }
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
                                {S3_FOLDER_DOWNLOAD_02?.code === destination
                                    ? S3_FOLDER_DOWNLOAD_02?.path : S3_FOLDER_DOWNLOAD_04?.path}
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
}

export default S3DownloadPage;