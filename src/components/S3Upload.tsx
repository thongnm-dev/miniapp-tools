import React, { useEffect, useMemo, useState } from 'react';
import Button from './ui/Button';
import { ArrowUpTrayIcon, FolderMinusIcon, FolderPlusIcon, NewspaperIcon, TruckIcon } from '@heroicons/react/24/outline';
import { showNotification } from "../components/notification";
import { fsController } from '../controller/fs-controller';
import { FileItem } from '../types/FileItem';
import TreeView, { flattenTree, INode, ITreeViewOnNodeSelectProps, NodeId } from 'react-accessible-treeview';
import { FaCheckSquare, FaMinusSquare, FaRegSquare } from 'react-icons/fa';
import { IFlatMetadata } from 'react-accessible-treeview/dist/TreeView/utils';

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
    const [bugList, setBugList] = useState<string[]>([]);

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
            treeview.children.push({
                id: "#999999999",
                name: "Danh sách thư mục đã chọn", 
                children: []} as never)
            const grouped = items.reduce((acc: { [key: string]: FileItem[] }, item) => {
                if (!acc[item.parent_name]) {
                    acc[item.parent_name] = [];
                }
                // Push the current item into its category array
                acc[item.parent_name].push(item);

                return acc;
            }, {});

            let _count = 1;
            let bugs: string[] = [];

            for (const [folder, children] of Object.entries(grouped)) {
                const child = {
                    name: folder, children: children.map((item) => {
                        return { ...item, name: item.name }
                    })
                }
                setCount(_count++);
                bugs.push(folder);
                (treeview.children[0] as any).children.push(child as never)
            }
            setBugList(bugs);
        }

        const nodes = flattenTree(treeview);
        if (items.length > 0) {
            setSelectedIds(nodes.map((item) => item.id));
            setSelectedItems(new Set(items));
        }
        return nodes;
    }, [items]);

    const findItem = (item: INode<IFlatMetadata>, datas: INode<IFlatMetadata>[]): FileItem[] => {
        let files: FileItem[] = [];
        
        for (const id of item.children) {
            const findedNode = datas.find(f => f.id === id);
            if (findedNode?.children && findedNode?.children.length > 0) {
                files.push(...findItem(findedNode, datas))
            } else {
                const file = items.find(f => f.name === findedNode?.name);
                if (file) {
                    files.push(file);
                }
            }
        }
        return files;
    }

    const handleNodeOnCheckbox = (node : ITreeViewOnNodeSelectProps) => {

        if (node.element.id == "#999999999" && node.isSelected === false) {
            setSelectedItems(new Set());
        } else if (node.element.id == "#999999999") {
            setSelectedItems(new Set(findItem(node.element, dataTree)));
        } else {
            setSelectedItems(prev => {
                const newSet = new Set(prev);
                console.log("start:  " + node.isSelected)
                if (node.isBranch == true && node.isSelected == false) {
                    console.log(findItem(node.element, dataTree));
                    for (const file of findItem(node.element, dataTree)) {
                        newSet.delete(file);
                    }
                } else if (node.isBranch == true) {
                    for (const file of findItem(node.element, dataTree)) {
                        newSet.add(file);
                    }
                } else {
                    const file = items.find(f => f.name === node.element?.name);
                    if (file) {
                        if (node.isSelected) {
                            newSet.add(file);
                        } else {
                            newSet.delete(file);
                        }
                    }
                }
                return newSet;
            });
        }
    }

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
                            {(items.length > 0 && selectedItems.size > 0) && <Button className="flex items-center space-x-2"
                                disabled={selectedItems.size === 0}
                                onClick={handleUpload}>
                                <ArrowUpTrayIcon className="h-5 w-5 font-bold" />
                                <span>Tải lên</span>
                            </Button>}
                        </div>
                    </div>
                </div>
                <div className={`${modalOpen ? 'max-h-[280px] overflow-y-auto py-2' : 'hidden'}`}>
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