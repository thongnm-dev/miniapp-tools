import React, { useMemo, useState } from 'react';
import Button from './ui/Button';
import { ArchiveBoxXMarkIcon, ArrowUpTrayIcon, FolderMinusIcon, FolderPlusIcon, NewspaperIcon, TruckIcon } from '@heroicons/react/24/outline';
import { showNotification } from "../components/notification";
import { fsController } from '../controller/fs-controller';
import { FileItem } from '../types/FileItem';
import TreeView, { flattenTree, ITreeViewOnNodeSelectProps, ITreeViewOnSelectProps, NodeId } from 'react-accessible-treeview';
import { FaCheckSquare, FaMinusSquare, FaSquare } from 'react-icons/fa';

export interface S3UploadProps {
    key_code?: string,
    title?: string,
    items?: FileItem[],
    actions?: React.ReactNode,
    uploadAction: (keyCode: string, rows: FileItem[]) => void
}

const CheckBoxIcon: React.FC<{variant: string}> = ({variant, ...rest}) => {
    switch (variant) {
        case "all":
            return <FaCheckSquare {...rest} className='text-primary-600'/>;
        case "none":
            return <FaSquare {...rest} className='text-primary-600'/>;
        case "some":
            return <FaMinusSquare {...rest} className='text-primary-600'/>;
        default:
            return null;
    }
};

const S3Upload: React.FC<S3UploadProps> = ({ key_code = "", title = "", items = [], uploadAction, actions }) => {
    const [modalOpen, setModalOpen] = useState<boolean>(true);
    const [selectedItems, setSelectedItems] = useState<Set<FileItem>>(new Set());
    const [uploadableMap, setUploadableMap] = useState<Record<string, boolean>>({});
    const [moveableMap, setMoveableMap] = useState<Record<string, boolean>>({});
    const [selectedIds, setSelectedIds] = useState<NodeId[]>([]);
    const [count, setCount] = useState<number>(0);

    const toggle = () => {
        setModalOpen(!modalOpen);
    }

    const dataTree = useMemo(() => {

        let treeview = {
            name: "root",
            children: []
        }

        if (items && items.length > 0) {
            const grouped = items.reduce((acc: { [key: string]: FileItem[] }, item) => {
                // If the category doesn't exist yet, create an array for it
                if (!acc[item.parent_folder]) {
                    acc[item.parent_folder] = [];
                }
                // Push the current item into its category array
                acc[item.parent_folder].push(item);

                return acc;
            }, {});

            let _count = 1;
            for (const [folder, children] of Object.entries(grouped)) {
                const child = {
                    name: folder, children: children.map((item) => {
                        return { ...item, name: item.file_name }
                    })
                }
                setCount(_count++);
                treeview.children.push(child as never)
            }
        }

        return flattenTree(treeview);
    }, [items])

    // Handle file checkbox change
    const handleFileCheckboxChange = (ids: ITreeViewOnNodeSelectProps) => {
        console.log(ids)
    };

    // Open file
    const handleOpenFile = async (filePath: string) => {
        try {
            const result = await fsController.openFile(filePath);
            if (!result.success) {
                showNotification('Không thể mở file', 'error');
            }
        } catch (err) {
            showNotification('Lỗi mở file', 'error');
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
                                <span className="text-red-600">({count})</span>
                            </span>
                        </div>
                        <div className="flex items-end space-x-2">
                            {actions}
                            {<Button className="flex items-center space-x-2 text-red-500 border-red-500"
                                onClick={hanldeMove}>
                                <TruckIcon className="h-4 w-4 font-bold" />
                                <span>Di chuyển trên S3</span>
                            </Button>}
                            {<Button className="flex items-center space-x-2"
                                // disabled={selectedItems.size === 0}
                                onClick={handleUpload}>
                                <ArrowUpTrayIcon className="h-5 w-5 font-bold" />
                                <span>Tải lên</span>
                            </Button>}
                        </div>
                    </div>
                </div>
                <div className={`${modalOpen ? 'max-h-[300px] overflow-y-auto py-2' : 'h-0 hidden'}`}>
                    <TreeView
                        className='px-4'
                        data={dataTree}
                        aria-label="directory tree"
                        multiSelect
                        selectedIds={selectedIds}
                        propagateSelect
                        propagateSelectUpwards
                        togglableSelect
                        onNodeSelect={handleFileCheckboxChange}
                        nodeRenderer={({
                            element,
                            isBranch,
                            isExpanded,
                            isSelected,
                            isHalfSelected,
                            getNodeProps,
                            level,
                            handleExpand,
                            handleSelect
                        }) => (
                            <div {...getNodeProps({ onClick: handleExpand })} style={{ paddingLeft: 20 * (level - 1) }} className="flex flex-row hover:cursor-pointer gap-2">
                                <div onClick={(e) => {
                                        handleSelect(e);
                                        e.stopPropagation();
                                    }}>
                                    <CheckBoxIcon variant={isHalfSelected ? "some" : isSelected ? "all" : "none"}/>
                                </div>
                                {isBranch ? (
                                    isExpanded ? <FolderMinusIcon className='w-5 h-5 text-orange-400' /> : <FolderPlusIcon className='w-5 h-5 text-orange-400' />
                                ) : (
                                    <NewspaperIcon className="w-5 h-5 text-green-700" />
                                )}
                                <span className={`${isBranch? '' : 'text-green-700'}`}>{element.name}</span>
                            </div>
                        )}
                    />
                </div>
            </div>
        </React.Fragment>
    )
};

export default S3Upload; 