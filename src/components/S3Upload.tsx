import React, { useState } from 'react';
import Button from './ui/Button';
import { ArchiveBoxXMarkIcon, ArrowUpTrayIcon, EyeIcon, FolderIcon, FolderMinusIcon, FolderPlusIcon } from '@heroicons/react/24/outline';
import DataTable from './ui/DataTable';
import { showNotification } from "../components/notification";
import { fsController } from '../controller/fs-controller';

export interface S3UploadItem {
    file_name: string,
    file_path: string,
    full_path: string,
    bug_no: string,
    file_size: number,
    current_state: string
}

export interface S3UploadProps {
    key_code?: string,
    title?: string,
    items?: S3UploadItem[],
    actions?: React.ReactNode,
    uploadAction: (keyCode: string, rows: S3UploadItem[]) => void
}

const S3Upload: React.FC<S3UploadProps> = ({ key_code = "", title = "", items = [], uploadAction, actions }) => {
    const [modalOpen, setModalOpen] = useState<boolean>(true);
    const [selectedItems, setSelectedItems] = useState<Set<S3UploadItem>>(new Set());
    const [uploadableMap, setUploadableMap] = useState<Record<string, boolean>>({});
    const [moveableMap, setMoveableMap] = useState<Record<string, boolean>>({});

    const toggle = () => {
        setModalOpen(!modalOpen);
    }

    // Handle file checkbox change
    const handleFileCheckboxChange = (fileName: string, checked: boolean) => {
        setSelectedItems(prev => {
            const newSet = new Set(prev);
            const file = items.find(f => f.file_name === fileName);
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

    // Open file
    const handleOpenFile = async (filePath: string) => {
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

    const handleUpload = async () => {
        await uploadAction(key_code || "", Array.from(selectedItems));
    }

    const hanldeMove = async () => {
        
    }
    return (
        <React.Fragment key={key_code}>
            <div className="shadow rounded grid grid-cols-1 bg-white" >
                <div className="border-b px-4 py-1 border-gray-200 flex flex-col">
                    <div className="flex items-center justify-between hover:cursor-pointer" >
                        <div className='flex flex-row gap-2 flex-1' onClick={toggle}>
                            <button onClick={toggle}>
                                {modalOpen ? <FolderMinusIcon className='h-5 w-5' /> : <FolderPlusIcon className='h-5 w-5' />}
                            </button>
                            <span className="text-lg font-bold">{title}
                                <span className="text-red-600">({items.length})</span>
                            </span>
                        </div>
                        <div className="flex items-end space-x-2">
                            {actions}
                            {moveableMap[key_code] && <Button className="flex items-center space-x-2 text-red-500 border-red-500"
                                onClick={hanldeMove}>
                                <ArchiveBoxXMarkIcon className="h-4 w-4 font-bold" />
                                <span>Di chuyển trên S3</span>
                            </Button>}
                            {uploadableMap[key_code] &&  <Button className="flex items-center space-x-2"
                                // disabled={selectedItems.size === 0}
                                onClick={handleUpload}>
                                <ArrowUpTrayIcon className="h-5 w-5 font-bold" />
                                <span>Tải lên</span>
                            </Button>}
                        </div>
                    </div>
                </div>
                <div className={`${modalOpen ? 'max-h-[300px] overflow-y-auto py-4' : 'h-0 hidden'}`}>
                    <div className="bg-white rounded-lg grid grid-cols-1 gap-2">
                        <DataTable className='px-2'
                            columns={[
                                { key: 'action', label: '' },
                                { key: 'name', label: 'Tên tập tin' },
                                { key: 'file_size', label: 'Kích thước' },
                                { key: 'local', label: '' },
                            ]}
                            data={items
                                .map(item => ({
                                    name: item.file_name,
                                    action: item.full_path,
                                    local: item.file_path,
                                }))}
                            showPagination={false}
                            showFilter={false}
                            showCheckboxes={true}
                            scrollHeight={500}
                            selectedRows={new Set(Array.from(selectedItems).map(f => f.file_name))}
                            onRowSelectionChange={handleFileCheckboxChange}
                            rowKey="name"
                            customCellRender={{
                                action: (row) => (
                                    <Button
                                        onClick={(e: React.MouseEvent) => {
                                            e.stopPropagation();
                                            handleOpenFile(row.sync_path);
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
                </div>
            </div>
        </React.Fragment>
    )
};

export default S3Upload; 