import React, { useEffect, useMemo, useState } from 'react';
import Button from './ui/Button';
import { ArrowUpTrayIcon, FolderMinusIcon, FolderPlusIcon, NewspaperIcon, TruckIcon } from '@heroicons/react/24/outline';
import { showNotification } from "../components/notification";
import { fsController } from '../controller/fs-controller';
import { FileItem } from '../types/FileItem';
import TreeView, { flattenTree, ITreeViewOnNodeSelectProps, ITreeViewOnSelectProps, NodeId } from 'react-accessible-treeview';
import { FaCheckSquare, FaMinusSquare, FaRegSquare } from 'react-icons/fa';

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
            return <FaRegSquare {...rest} className='text-primary-600'/>;
        case "some":
            return <FaMinusSquare {...rest} className='text-primary-600'/>;
        default:
            return null;
    }
};

const S3Upload: React.FC<S3UploadProps> = ({ key_code = "", title = "", items = [], uploadAction, actions }) => {
    const [modalOpen, setModalOpen] = useState<boolean>(true);
    const [selectedItems, setSelectedItems] = useState<Set<FileItem>>(new Set());
    const [moveableMap, setMoveableMap] = useState<Record<string, boolean>>({});
    const [selectedIds, setSelectedIds] = useState<NodeId[]>([]);
    const [expandedIds, setExpandedIds] = useState<NodeId[]>([]);
    const [count, setCount] = useState<number>(0);

    const toggle = () => {
        setModalOpen(!modalOpen);
    }

    useEffect(() => {
        if (items.length > 0 && key_code.length > 0) {
            const checkAll = async () => {
                const moveMap: Record<string, boolean> = {};

                // const resultMove = await displayMoveObject();    
                // moveMap[key_code] = !!resultMove;
                setMoveableMap(moveMap);
            };
    
            checkAll();
        }
        }, [items]);

    useEffect(() => {
        if (items.length > 0) {
            setExpandedIds(dataTree.map((item) => item.id));
        }
    }, [items])

    const dataTree = useMemo(() => {

        let treeview = {
            name: "root",
            children: []
        }

        if (items && items.length > 0) {
            treeview.children.push({name: "Danh sách thư mục đã chọn", children: []} as never)
            const grouped = items.reduce((acc: { [key: string]: FileItem[] }, item) => {
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
                (treeview.children[0] as any).children.push(child as never)
            }
        }

        const nodes = flattenTree(treeview);
        if (items.length > 0) {
            setSelectedIds(nodes.map((item) => item.id));
            setSelectedItems(new Set(items));
        }
        return nodes;
    }, [items]);


    const handleNodeOnCheckbox = (node : ITreeViewOnNodeSelectProps) => {
        const fileName = node.element.name;
        const checked = node.isSelected;
        console.log(node)
        setSelectedItems(prev => {
            const newSet = new Set(prev);
            const file = items.find(f => f.file_name === fileName);
            if (file) {
                if (checked) {
                    console.log(checked)
                    newSet.add(file);
                } else {
                    newSet.delete(file);
                }
            }
            return newSet;
        });

        console.log(selectedItems);

    }

    // Handle file checkbox change
    const handleOnCheckbox = (ids: ITreeViewOnSelectProps) => {
        
        // const fileName = ids.element.name;
        // const checked = ids.isSelected;
        // console.log(ids)
        // setSelectedItems(prev => {
        //     const newSet = new Set(prev);
        //     const file = items.find(f => f.file_name === fileName);
        //     if (file) {
        //         if (checked) {
        //             console.log(checked)
        //             newSet.add(file);
        //         } else {
        //             newSet.delete(file);
        //         }
        //     }
        //     return newSet;
        // });

        // console.log(selectedItems);
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
                <div className="border-b px-4 py-2 border-gray-200 flex flex-col">
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
                            {moveableMap[key_code] && <Button className="flex items-center space-x-2 text-red-500 border-red-500"
                                onClick={hanldeMove}>
                                <TruckIcon className="h-4 w-4 font-bold" />
                                <span>Di chuyển trên S3</span>
                            </Button>}
                            {items.length > 0 && <Button className="flex items-center space-x-2"
                                disabled={selectedItems.size === 0}
                                onClick={handleUpload}>
                                <ArrowUpTrayIcon className="h-5 w-5 font-bold" />
                                <span>Tải lên</span>
                            </Button>}
                        </div>
                    </div>
                </div>
                <div className={`${modalOpen ? 'overflow-y-auto py-2' : 'hidden'}`}>
                    {items.length > 0 && <TreeView
                        className='px-4'
                        data={dataTree}
                        aria-label="directory tree"
                        multiSelect
                        expandedIds={expandedIds}
                        selectedIds={selectedIds}
                        propagateSelect
                        propagateSelectUpwards
                        togglableSelect
                        onNodeSelect={handleNodeOnCheckbox}
                        onSelect={handleOnCheckbox}
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
                    />}
                </div>
            </div>
        </React.Fragment>
    )
};

export default S3Upload; 