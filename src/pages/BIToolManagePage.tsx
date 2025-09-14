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

const BIToolManagePage: React.FC = () => {
    const { user } = useAuth();
    const { showLoading, hideLoading } = useLoading();
    const [displayModal, setDisplayModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUpdatting, setIsUpdating] = useState(false);
    const [modalTitle, setModalTitle] = useState<string>("");
    const [aws_storages, setAwsStorages] = useState<aws_storage[]>([]);
    const [destination, setDestination] = useState<aws_storage>({} as aws_storage);
    const [aws_s3objects, setAwsS3Objects] = useState<Record<string, { bugs: BIObjectInfo[] }>>({});
    const [items, setItems] = useState<string[]>([]);
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
        setIsUpdating(false);
        setModalTitle(`Thực hiện tải tập tin đã chọn ( Tổng: ${bugs.length} thư mục.)`);
        setDisplayModal(true);
    }

    const handleDelete = async (aws_storage: aws_storage, bugs: BIObjectInfo[]) => {
        setDestination(aws_storage);
        setIsDeleting(true);
        setIsUpdating(false);
        setItems(bugs.map(bug => bug.bug_no));
        setModalTitle("Bạn có chắc muốn xoá các thông tin bên dưới không?");
        setDisplayModal(true);
    }

    const handleUpload = async (aws_storage: aws_storage) => {
        setDestination(aws_storage);
        setIsDeleting(false);
        setIsUpdating(true);
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

                                                <Button className="flex items-center space-x-2 text-red-500 border-red-500"
                                                    onClick={() => handleDelete(aws_store, aws_s3objects[aws_store.aws_cd].bugs || [])}>
                                                    <TfiBrushAlt className="h-4 w-4 font-bold" />
                                                    <span>Xóa thư mục</span>
                                                </Button>
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
                                            scrollHeight={650}
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

                setDisplayModal(!result.success);
                setItems([]);
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

    const uploadAction = async (params: { aws_storage: aws_storage, is_folder_same_name: boolean, selected_items: file_item[] }) => {

    }

    const handleClear = async () => {

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
                    </div>
                </div>
            </div>

            <Fieldset title="Danh sách bugs">
                <div className="grid grid-cols-1">
                    {tabs.length > 0 && <TabView tabs={tabs} className='h-[calc(100vh-195px)]' />}
                </div>
            </Fieldset>

            <Modal open={displayModal} onClose={handleCancelModal} title={modalTitle} size="full">
                <div className="bg-white shadow-lg rounded-lg flex flex-col">
                    {!isUpdatting && <div className='grid grid-cols-1 gap-1'>
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

                    {!isDeleting && !isUpdatting && <div className="border-b border-gray-200 p-4">
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
                    {isUpdatting && (
                        <S3Upload aws_storage={destination} uploadAction={uploadAction} clearAction={() => handleClear} />
                    )}
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