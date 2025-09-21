import React, { useState, useEffect, useMemo } from 'react';
import { s3Controller } from '../controller/s3-controller';
import Button from '../components/ui/Button';
import { useLoading } from '../stores/LoadingContext';
import TabView from '../components/ui/TabView';
import { FcFeedIn, FcOk, FcProcess } from 'react-icons/fc';
import { aws_storage } from '../types/aws_storage';
import { appController } from '../controller/app_controller';
import { showNotification } from '../components/notification';
import { S3ObjectInfo } from '../types/s3_object_info';
import { TfiBrushAlt } from 'react-icons/tfi';
import Modal from '../components/ui/Modal';
import { GiExitDoor } from 'react-icons/gi';
import DataTable from '../components/ui/DataTable';
import { useAuth } from '../stores/AuthContext';
import { FaCloudUploadAlt } from 'react-icons/fa';
import S3UploadPage from './S3UploadPage';
import S3DownloadPage from './S3DownloadPage';

const S3ManagerPage: React.FC = () => {
    const { user } = useAuth();
    const { showLoading, hideLoading } = useLoading();
    const [aws_s3objects, setAwsS3Objects] = useState<{ [aws_cd: string]: { bugs: S3ObjectInfo[] } }>({});
    const [aws_storages, setAwsStorages] = useState<aws_storage[]>([]);
    const [destination, setDestination] = useState<aws_storage>({} as aws_storage);
    const [displayModal, setDisplayModal] = useState<boolean>(false);
    const [deleted, setDeleted] = useState<boolean>(false);
    const [performPush, setPerformPush] = useState<boolean>(false);
    const [performPull, setPerformPull] = useState<boolean>(false);
    const [aws_delete_items, setAwsDeleteItems] = useState<S3ObjectInfo[]>([]);
    const [selected_items, setSelectedItems] = useState<Set<S3ObjectInfo>>(new Set());
    const [modalTitle, setModalTitle] = useState<string>("");


    useEffect(() => {
        setAwsStorages([]);
        const loadItems = async () => {
            const result = await appController.get_all_items('CORRECT_BUG_TEST');
            if (result.success && result.data) {
                setAwsStorages(result.data);
            }
        }

        loadItems();
    }, []);

    const isPermission = useMemo(() => {
        return user?.username === "nhudtq" || user?.username === "thongnm";
    }, [user])

    // Poll S3 fetch state every 30 minutes
    useEffect(() => {
        setAwsS3Objects({});
        if (aws_storages.length > 0) {
            let isMounted = true;
            const initialize = async () => {
                try {
                    showLoading();
                    const result = await s3Controller.get_all_s3objects(aws_storages);
                    if (result.success && result.data && isMounted) {
                        setAwsS3Objects(result.data);
                    }
                } finally {
                    hideLoading();
                }
            };

            initialize(); // Fetch immediately on mount

            if (isPermission) {
                const interval = setInterval(initialize, 5 * 60 * 1000); // 5 minutes
                return () => {
                    isMounted = false;
                    clearInterval(interval);
                };
            }
        }
    }, [aws_storages]);

    const tabs = useMemo(() => {
        return aws_storages
            .filter(aws_store => aws_s3objects[aws_store.aws_cd]?.bugs.length > 0)
            .map((aws_store) => {
                return {
                    label: (<div>{aws_store.aws_name_alias} <span className="text-red-600">({aws_s3objects[aws_store.aws_cd]?.bugs.length})</span></div>),
                    content: (
                        <div className="text-left text-sm h-[555px] overflow-y-auto">

                            {aws_s3objects[aws_store.aws_cd]?.bugs.length > 0 ? (
                                <>
                                    {isPermission &&
                                        <div className='flex justify-end py-2 border-b'>
                                            {(aws_store.link_available && aws_store.link_available.length > 0) && 
                                                <Button className="flex items-center space-x-2 text-red-500 border-red-500"
                                                    onClick={() => handleOpenMoveModal(aws_store, aws_s3objects[aws_store.aws_cd].bugs || [])}>
                                                    <TfiBrushAlt className="h-4 w-4 font-bold" />
                                                    <span>Xóa thư mục</span>
                                                </Button>}
                                            { aws_store.file_only &&
                                                <Button className="flex items-center space-x-2 text-red-500 border-red-500"
                                                    onClick={() => handleOpenMoveModal(aws_store, aws_s3objects[aws_store.aws_cd].bugs || [])}>
                                                    <TfiBrushAlt className="h-4 w-4 font-bold" />
                                                    <span>Xóa tập tin</span>
                                                </Button>
                                            }
                                        </div>
                                    }
                                    <div className='px-3'>
                                        {aws_s3objects[aws_store.aws_cd].bugs.map((bug, idx) => (
                                            <div key={idx} className={`flex flex-col justify-items-start p-1.5 ${idx % 2 === 0 ? 'bg-white' : 'bg-primary-50'}`}>
                                                <span className='p-1.5 whitespace-nowrap'>{bug.bug_no}</span>
                                                {bug.message && (
                                                    <div>
                                                        <span className='text-red-500 text-xs'>{bug.message}</span>
                                                    </div>
                                                )}
                                            </div>)
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div>Không tồn có bugs</div>
                            )}
                        </div>)
                }
            });
    }, [aws_s3objects]);

    const handleRefresh = async () => {
        try {
            showLoading();
            setAwsS3Objects({});
            const result = await s3Controller.get_all_s3objects(aws_storages);
            if (result.success && result.data) {
                    setAwsS3Objects(result.data);
                }
        } catch (error) {
            showNotification("Không thể lấy dữ liệu từ S3 AWS.")
        } finally {
            hideLoading();
        }
    };

    const handleOpenMoveModal = async (aws_storage: aws_storage, selected_items: S3ObjectInfo[]) => {
        setDestination(aws_storage);
        setAwsDeleteItems(selected_items);
        setModalTitle("Bạn có chắc muốn xoá các thông tin bên dưới không?");
        setDisplayModal(true);
    }

    // Handle file checkbox change
    const handleFileCheckboxChange = (fileName: string, checked: boolean) => {
        setSelectedItems(prev => {
            const newSet = new Set(prev);
            const bugNo = aws_delete_items.find(f => f.bug_no === fileName);
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

    // accept
    const handleConfirm = async () => {
        try {
            showLoading();

            const params = {
                aws_cd: destination.aws_cd,
                delete_items: Array.from(selected_items)
            }
            const result = await s3Controller.handleOnlyDeleteObjects(params);

            if (!result.success) {
                showNotification('Xoá tập tin S3 thất bại', 'error')
                return;
            }

            const deletedCnt = result.data?.length;
            const totalFiles = Array.from(selected_items).length;

            if (deletedCnt === totalFiles) {
                showNotification(`Đã thực hiện xoá thành công ${deletedCnt} tập tin.`, 'success');
            } else {
                showNotification(`Đã xoá ${deletedCnt}/${totalFiles} tập tin.`, 'info');
            }
            setModalTitle("Bạn đã xoá thành công các tập tin");
            setDeleted(result.success);
            setSelectedItems(new Set());

            const deletedItems = (result.data || []).map((item) => {
                return { bug_no: item, message: "" } as S3ObjectInfo;
            });

            setAwsDeleteItems(deletedItems);
            await handleRefresh();
        } catch (error) {
            showNotification('Thực hiện xoá tập tin thất bại', 'error');
        } finally {
            hideLoading();
        }
    }
    const handleCancelModal = () => {
        setDisplayModal(false);
        setDeleted(false);
        setDestination({} as aws_storage);
    }

    return (
        <>
            {isPermission && <div className="shadow rounded grid grid-cols-1 bg-white mb-4">
                <div className="border-b px-4 border-gray-200">
                    <div className="flex items-end justify-end space-x-2 py-2 gap-3">
                        <Button className="flex items-center space-x-2" onClick={() => setPerformPush(true)}>
                            <FaCloudUploadAlt className="h-5 w-5 font-bold" />
                            <span>Upload</span>
                        </Button>
                        <Button className="flex items-center space-x-2" onClick={() => setPerformPull(true)}>
                            <FcFeedIn className="h-4 w-4 font-bold" />
                            <span>Download</span>
                        </Button>
                    </div>
                </div>
            </div>}
            <div className="space-y-4">
                <fieldset className="border border-gray-300 rounded-lg p-2 bg-white shadow-lg min-h-[calc(100vh-280px)]">
                    <legend className="rounded-lg">
                        <Button
                            onClick={handleRefresh}
                            className="flex items-center gap-2">
                            <FcProcess className="w-4 h-4 stroke-2" />
                            Tải lại
                        </Button>
                    </legend>
                    <div className="grid grid-cols-1">
                        {tabs.length > 0 && <TabView tabs={tabs} className='h-full' />}
                    </div>
                </fieldset>
            </div>

            <Modal open={performPush} onClose={() => {setPerformPush(false)}} title="Upload file to S3" size="full"
                contentClassName='p-6 h-[650px] overflow-y-auto'>
                    <S3UploadPage />
            </Modal>

            <Modal open={performPull} onClose={() => {setPerformPull(false)}} title="Download file from S3" size="full"
                contentClassName='p-6 h-[650px] overflow-y-auto'>
                <S3DownloadPage />
            </Modal>

            <Modal open={displayModal} onClose={handleCancelModal} title={modalTitle} size="xl">
                <div className="bg-white shadow-lg rounded-lg flex flex-col">
                    <div className="flex flex-row items-center justify-items-center text-center border-b border-gray-200 p-4">
                        <h2 className="text-lg font-semibold text-white bg-sky-500 px-3 py-2 rounded-l">
                            Đường dẫn đích xoá ở S3
                        </h2>
                        <div className="flex items-center gap-1 flex-1">
                            <span className="flex-1 px-3 py-3 text-sm font-mono break-all flex items-center border border-red-300 rounded-r">
                                {destination.aws_name}
                            </span>
                        </div>
                    </div>
                    <div className='grid grid-cols-1 gap-1'>
                        <DataTable
                            className='h-full'
                            columns={[
                                { key: 'bug_no', label: 'Đối tượng xoá' }
                            ]}
                            data={aws_delete_items.map(bugNo => ({
                                bug_no: bugNo.bug_no
                            }))}
                            showFilter={false}
                            showCheckboxes={!deleted}
                            rowKey="bug_no"
                            selectedRows={new Set(Array.from(selected_items).map((item) => item.bug_no))}
                            onRowSelectionChange={handleFileCheckboxChange}
                        />
                    </div>

                    <div className="flex justify-end items-center p-4 gap-3">
                        <Button
                            onClick={handleCancelModal}
                            className="flex items-center space-x-2">
                            <GiExitDoor className="h-5 w-5" />
                            <span>Đóng</span>
                        </Button>
                        {!deleted && <Button
                            onClick={handleConfirm}
                            className="flex items-center space-x-2">
                            <FcOk className="h-5 w-5" />
                            <span>Bắt đầu...</span>
                        </Button>
                        }
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default S3ManagerPage; 