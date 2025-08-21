import React, { useState, useEffect, useMemo } from 'react';
import { s3Controller } from '../controller/s3-controller';
import Button from '../components/ui/Button';
import { useLoading } from '../stores/LoadingContext';
import TabView from '../components/ui/TabView';
import { FcOk, FcProcess } from 'react-icons/fc';
import { aws_storage } from '../types/aws_storage';
import { appController } from '../controller/app_controller';
import { showNotification } from '../components/notification';
import { S3ObjectInfo } from '../types/s3_object_info';
import { TfiBrushAlt } from 'react-icons/tfi';
import Modal from '../components/ui/Modal';
import { GiExitDoor } from 'react-icons/gi';
import DataTable from '../components/ui/DataTable';
import { useAuth } from '../stores/AuthContext';

const S3ManagerPage: React.FC = () => {
    const { showLoading, hideLoading } = useLoading();
    const { user } = useAuth();
    const [aws_s3objects, setAwsS3Objects] = useState<{ [aws_cd: string]: { bugs: S3ObjectInfo[] } }>({});
    const [destination, setDestination] = useState<aws_storage>({} as aws_storage);
    const [displayModal, setDisplayModal] = useState(false);
    const [aws_storages, setAwsStorages] = useState<aws_storage[]>([]);
    const [aws_delete_items, setAwsDeleteItems] = useState<S3ObjectInfo[]>([]);
    const [selected_items, setSelectedItems] = useState<Set<string>>(new Set());

    useEffect(() => {
        setAwsStorages([]);
        const loadItems = async () => {
            const result = await appController.get_all_items();
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
                    const result = await s3Controller.get_all_s3objects(aws_storages);
                    if (result.success && result.data && isMounted) {
                        setAwsS3Objects(result.data);
                    }
                } finally {
                    hideLoading();
                }
            };

            initialize(); // Fetch immediately on mount
            const interval = setInterval(initialize, 5 * 60 * 1000); // 5 minutes
            return () => {
                isMounted = false;
                clearInterval(interval);
            };
        }
    }, [aws_storages]);

    const tabs = useMemo(() => {
        return aws_storages
            .filter(aws_store => aws_s3objects[aws_store.aws_cd]?.bugs.length > 0)
            .map((aws_store) => {
                return {
                    label: (<div>{aws_store.aws_name} <span className="text-red-600">({aws_s3objects[aws_store.aws_cd]?.bugs.length})</span></div>),
                    content: (
                        <div className="text-left text-sm max-h-[calc(100vh-250px)] overflow-y-auto">

                            {aws_s3objects[aws_store.aws_cd]?.bugs.length > 0 ? (
                                <>
                                    {(aws_store.link_available && aws_store.link_available.length > 0) &&
                                        <div className='flex justify-end py-2 border-b'>
                                            <Button className="flex items-center space-x-2 text-red-500 border-red-500"
                                                onClick={() => handleOpenMoveModal(aws_store, aws_s3objects[aws_store.aws_cd].bugs || [])}>
                                                <TfiBrushAlt className="h-4 w-4 font-bold" />
                                                <span>Di chuyển trên S3</span>
                                            </Button>
                                        </div>
                                    }
                                    <div className='px-3'>
                                        {aws_s3objects[aws_store.aws_cd].bugs.map((bug, idx) => (
                                            <div key={idx} className={`flex flex-row justify-items-center gap-6 p-1.5 ${idx % 2 === 0 ? 'bg-white' : 'bg-primary-50'}`}>
                                                <span className='w-48 p-1.5 whitespace-nowrap'>{bug.bug_no}</span>
                                                {bug.message && <span className='text-red-500 animate-pulse bg-red-100 border border-red-100 rounded-xl p-1.5'>{bug.message}</span>}
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

    const handleRefreshFetchState = async () => {
        try {
            showLoading();
            await s3Controller.get_all_s3objects(aws_storages);
        } catch (error) {
            showNotification("Không thể lấy dữ liệu từ S3 AWS.")
        } finally {
            hideLoading();
        }
    };

    const handleOpenMoveModal = async (aws_storage: aws_storage, selected_items: S3ObjectInfo[]) => {
        setDestination(aws_storage);
        setAwsDeleteItems(selected_items);
        setDisplayModal(true);
    }


    // Handle file checkbox change
    const handleFileCheckboxChange = (fileName: string, checked: boolean) => {
        setSelectedItems(prev => {
            const newSet = new Set(prev);
            const bugNo = aws_delete_items.find(f => f.bug_no === fileName);
            if (bugNo) {
                if (checked) {
                    newSet.add(bugNo.bug_no);
                } else {
                    newSet.delete(bugNo.bug_no);
                }
            }
            return newSet;
        });
    };
    // accept
    const handleConfirm = async () => {
        try {
            showLoading();
            const result = await s3Controller.handleOnlyDeleteObjects(Array.from(selected_items));

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
            setDisplayModal(false);
            setDestination({} as aws_storage);
        } catch (error) {
            showNotification('Thực hiện xoá tập tin thất bại', 'error');
        } finally {
            hideLoading();
        }
    }
    const handleCancelModal = () => {
        setDisplayModal(false);
        setDestination({} as aws_storage);
    }

    return (
        <>
            <div className="space-y-4">
                <fieldset className="border border-gray-300 rounded-lg p-2 bg-white shadow-lg min-h-[calc(100vh-195px)]">
                    <legend className="rounded-lg">
                        <Button
                            onClick={handleRefreshFetchState}
                            className="flex items-center gap-2">
                            <FcProcess className="w-4 h-4 stroke-2" />
                            Tải lại
                        </Button>
                    </legend>
                    <div className="grid grid-cols-1">
                        {tabs.length > 0 && <TabView tabs={tabs} className='h-[calc(100vh-195px)]' />}
                    </div>
                </fieldset>
            </div>

            <Modal open={displayModal} onClose={handleCancelModal} title="Bạn có chắc muốn xoá các thông tin bên dưới không?" size="xl">
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
                            showCheckboxes={true}
                            rowKey="bug_no"
                            selectedRows={new Set(Array.from(selected_items))}
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
                        <Button
                            onClick={handleConfirm}
                            className="flex items-center space-x-2">
                            <FcOk className="h-5 w-5" />
                            <span>Bắt đầu...</span>
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default S3ManagerPage; 