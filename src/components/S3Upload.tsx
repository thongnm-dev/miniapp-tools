import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Button from './ui/Button';
import { file_item } from '../types/file_item';
import TreeView, { flattenTree, INode, ITreeViewOnNodeSelectProps, NodeId } from 'react-accessible-treeview';
import { FaCheckSquare, FaFolderMinus, FaFolderPlus, FaMinusSquare, FaRegSquare } from 'react-icons/fa';
import { IFlatMetadata } from 'react-accessible-treeview/dist/TreeView/utils';
import { aws_storage } from '../types/aws_storage';
import { TfiBrushAlt } from 'react-icons/tfi';
import { showNotification } from './notification';
import { fsController } from '../controller/fs-controller';
import { FcBiohazard, FcDataSheet, FcReuse } from 'react-icons/fc';
import { uploadController } from '../controller/upload-controller';
import { useAuth } from '../stores/AuthContext';

export interface S3UploadProps {
    aws_storage?: aws_storage,
    actions?: React.ReactNode,
    uploaded_id?: string,
    clearAction?: () => void,
    uploadAction: (params: { aws_storage: aws_storage, is_folder_same_name: boolean, selected_items: file_item[] }) => void
}

const CheckBoxIcon: React.FC<{ variant: string }> = ({ variant, ...rest }) => {
    switch (variant) {
        case "all":
            return <FaCheckSquare {...rest} className='text-primary-600' />;
        case "none":
            return <FaRegSquare {...rest} className='text-primary-600' />;
        case "some":
            return <FaMinusSquare {...rest} className='text-primary-600' />;
        default:
            return null;
    }
};

const S3Upload: React.FC<S3UploadProps> = ({ aws_storage = {} as aws_storage, uploaded_id = "", uploadAction, actions, clearAction }) => {
    const { user } = useAuth();
    const [modalOpen, setModalOpen] = useState<boolean>(true);
    const [selectedItems, setSelectedItems] = useState<Set<file_item>>(new Set());
    const [selectedIds, setSelectedIds] = useState<NodeId[]>([]);
    const [expandedIds, setExpandedIds] = useState<NodeId[]>([]);
    const [items, setItems] = useState<file_item[]>([]);
    const [count, setCount] = useState<number>(0);
    const [uploadableMap, setUploadableMap] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const checkAll = async () => {
            const uploadMap: Record<string, boolean> = {};

            const result = await displayUpload();
            uploadMap[aws_storage?.aws_cd || ""] = !!result;
            setUploadableMap(uploadMap);
        };

        if (aws_storage?.aws_cd && items.length > 0) {
            checkAll();
        }
    }, [items, uploaded_id]);

    useEffect(() => {
        setExpandedIds([]);
        if (items.length > 0) {
            setExpandedIds(dataTree.map((item) => item.id));
        }
    }, [items])

    const dataTree = useMemo(() => {

        let treeview = {
            name: "root",
            children: []
        }

        setCount(0);
        setSelectedIds([]);
        setSelectedItems(new Set());
        if (items && items.length > 0) {
            treeview.children.push({
                id: "#999999999",
                name: "Danh sách thư mục đã chọn",
                children: []
            } as never)
            const grouped = items.reduce((acc: { [key: string]: file_item[] }, item) => {
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
        }

        const nodes = flattenTree(treeview);
        if (items.length > 0) {
            setSelectedIds(nodes.map((item) => item.id));
            setSelectedItems(new Set(items));
        }
        return nodes;
    }, [items]);

    const displayUpload = useCallback(async () => {

        if (items.length == 0) {
            return true;
        }

        if (!uploaded_id || uploaded_id.length === 0) {
            return true;
        }
        const params = {
            user_id: user?.username || "",
            state: aws_storage?.aws_cd || "",
            upload_id: uploaded_id,
            select_items: Array.from(selectedItems).map((item) => item.parent_name)
        }
        const result = await uploadController.display_upload_button(params);

        if (result.success) {
            return result.data;
        }
        return false;
    }, [items, uploaded_id]);

    const toggle = () => {
        setModalOpen(!modalOpen);
    }

    const findItem = (item: INode<IFlatMetadata>, datas: INode<IFlatMetadata>[]): file_item[] => {
        let files: file_item[] = [];

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

    const handleNodeOnCheckbox = (node: ITreeViewOnNodeSelectProps) => {

        if (node.element.id == "#999999999" && node.isSelected === false) {
            setSelectedItems(new Set());
        } else if (node.element.id == "#999999999") {
            setSelectedItems(new Set(findItem(node.element, dataTree)));
        } else {
            setSelectedItems(prev => {
                const newSet = new Set(prev);
                if (node.isBranch == true && node.isSelected == false) {
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

    // 
    const handleUpload = async () => {
        if (Array.from(selectedItems).length === 0) {
            showNotification("Chưa chọn tập tin để tải lên.", "error");
            return;
        }

        const params = {
            aws_storage: aws_storage,
            is_folder_same_name: aws_storage?.aws_cd === "01",
            selected_items: Array.from(selectedItems)
        }
        await uploadAction(params);
    }

    // clear list
    const clearItems = () => {
        setItems([]);
        setSelectedItems(new Set())
        if (clearAction) {
            clearAction();
        }
    }

    // choose file
    const addAttachment = async () => {

        try {
            const result = await fsController.selectMultiDir();

            if (result.success && result.data) {
                const results = await fsController.readMultiDir(result.data);

                if (results.success && results.data) {
                    setItems(results.data as []);
                    if (clearAction) {
                        clearAction();
                    }
                }
            }
        } catch (err) {
            showNotification('Không thể chọn thư mục để tải lên.', 'error');
        }
    };

    return (
        <React.Fragment>
            <div className="shadow rounded grid grid-cols-1 bg-white" >
                <div className="border-b px-4 py-2 border-gray-200 flex flex-col">
                    <div className="flex items-center justify-between hover:cursor-pointer" >
                        <div className='flex flex-row gap-2 flex-1' onClick={toggle}>
                            <button onClick={toggle}>
                                {modalOpen ? <FaFolderMinus className='h-5 w-5 text-orange-500' /> : <FaFolderPlus className='h-5 w-5 text-orange-500' />}
                            </button>
                            <span className="text-lg font-bold">{aws_storage?.aws_name_alias}
                                <span className="text-red-600">({count})</span>
                            </span>
                        </div>
                        <div className="flex items-end space-x-2">
                            {actions}
                            {items.length > 0 && <Button onClick={() => clearItems()} className="flex items-center space-x-2 text-red-500 border-red-500">
                                <TfiBrushAlt className="h-5 w-5 font-bold" />
                                <span>Dọn sạch</span>
                            </Button>}
                            <Button onClick={() => addAttachment()} className="flex items-center space-x-2">
                                <FcBiohazard className="h-5 w-5 font-bold" />
                                <span>Chọn tập tin</span>
                            </Button>
                            {(items.length > 0 && selectedItems.size > 0) && <Button className="flex items-center space-x-2"
                                disabled={selectedItems.size === 0 || !uploadableMap[aws_storage?.aws_cd || ""]}
                                onClick={handleUpload}>
                                <FcReuse className="h-5 w-5 font-bold" />
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
                                    <CheckBoxIcon variant={isHalfSelected ? "some" : isSelected ? "all" : "none"} />
                                </div>
                                {isBranch ? (
                                    isExpanded ? <FaFolderMinus className='w-5 h-5 text-orange-400' /> : <FaFolderPlus className='w-5 h-5 text-orange-400' />
                                ) : (
                                    <FcDataSheet className="w-5 h-5 text-green-700" />
                                )}
                                <span className={`${isBranch ? '' : 'text-green-700'}`}>{element.name}</span>
                            </div>
                        )}
                    />}
                </div>
            </div>
        </React.Fragment>
    )
};

export default S3Upload; 