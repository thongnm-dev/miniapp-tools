import React, { useEffect, useMemo, useState } from "react"
import DataTable from "../components/ui/DataTable";
import { qa_item } from "../types/qa_item";
import Fieldset from "../components/ui/Fieldset";
import Button from "../components/ui/Button";
import { FcOk, FcProcess } from "react-icons/fc";
import { FaCheckSquare, FaDownload, FaFile, FaFolderMinus, FaFolderPlus, FaMinusSquare, FaRegSquare, FaUpload } from "react-icons/fa";
import { qaController } from "../controller/qa-controller";
import { useLoading } from "../stores/LoadingContext";
import { TfiBrushAlt } from "react-icons/tfi";
import { GiExitDoor } from "react-icons/gi";
import Modal from "../components/ui/Modal";
import { fsController } from "../controller/fs-controller";
import { qa_download_params } from "../types/param_interface";
import { showNotification } from "../components/notification";
import { file_item } from "../types/file_item";
import { IoIosAttach } from "react-icons/io";
import TreeView, { flattenTree, INode, ITreeViewOnNodeSelectProps, NodeId } from "react-accessible-treeview";
import { IFlatMetadata } from "react-accessible-treeview/dist/TreeView/utils";

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
const QAPage: React.FC = () => {

    const { showLoading, hideLoading } = useLoading();
    const [qaToItems, setQaToItems] = useState<qa_item[]>([]);
    const [qaFromItems, setQaFromItems] = useState<qa_item[]>([]);
    const [qaToSelectedItems, setQaToSelectedItems] = useState<Set<qa_item>>(new Set());
    const [qaFromSelectedItems, setQaFromSelectedItems] = useState<Set<qa_item>>(new Set());
    const [displayModalUpload, setDisplayModalUpload] = useState(false);
    const [displayModalDownload, setDisplayModalDownload] = useState(false);
    const [selectDestinationPath, setSelectDestinationPath] = useState<string>("");
    const [errorCheck, setErrorCheck] = useState<string>("");
    const [uploadFileItems, setUploadFileItems] = useState<file_item[]>([]);
    const [selectedIds, setSelectedIds] = useState<NodeId[]>([]);
    const [expandedIds, setExpandedIds] = useState<NodeId[]>([]);
    const [count, setCount] = useState<number>(0);
    const [selectedItems, setSelectedItems] = useState<Set<file_item>>(new Set());

    useEffect(() => {
        setQaToItems([]);
        setQaFromItems([]);

        const load = async () => {
            // Allexceed to Enercom
            const resultTo = await qaController.load(true);

            if (resultTo.success && resultTo.data) {
                setQaToItems(resultTo.data);
            }

            // Enercom to Allexceed
            const resultFrom = await qaController.load(false);

            if (resultFrom.success && resultFrom.data) {
                setQaFromItems(resultFrom.data);
            }
        }

        load();
    }, []);

    // Save state when it changes
    useEffect(() => {
        const qa_correct = localStorage.getItem('qa_correct');
        let qa_store: Record<string, string> = {};
        if (qa_correct) {
            qa_store = JSON.parse(qa_correct)
        }

        qa_store.localPathSync = selectDestinationPath
        localStorage.setItem('qa_correct', JSON.stringify(qa_store));
    }, [selectDestinationPath]);

    const disable_download = useMemo(() => {
        return qaFromSelectedItems.size == 0;
    }, [qaFromSelectedItems]);

    const disable_upload = useMemo(() => {
        return qaToSelectedItems.size == 0;
    }, [qaToSelectedItems]);

    const disable_start = useMemo(() => {
        return !selectDestinationPath;
    }, [selectDestinationPath]);

    const dataTree = useMemo(() => {
        let treeview = {
            name: "root",
            children: []
        }

        setCount(0);
        setSelectedIds([]);
        setSelectedItems(new Set());
        if (uploadFileItems && uploadFileItems.length > 0) {
            treeview.children.push({
                id: "#999999999",
                name: "Danh sách thư mục đã chọn",
                children: []
            } as never)
            const grouped = uploadFileItems.reduce((acc: { [key: string]: file_item[] }, item) => {
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

        if (uploadFileItems.length > 0) {
            setSelectedIds(nodes.map((item) => item.id));
            setSelectedItems(new Set(uploadFileItems));
        }
        return nodes;
    }, [uploadFileItems]);

    useEffect(() => {
        setExpandedIds([]);
        if (uploadFileItems.length > 0) {
            setExpandedIds(dataTree.map((item) => item.id));
        }
    }, [uploadFileItems]);

    const download = () => {
        const qa_correct = localStorage.getItem('qa_correct');
        if (qa_correct) {
            const state = JSON.parse(qa_correct);
            setSelectDestinationPath(state.localPathSync || "");
        }
        setDisplayModalDownload(true);
    }

    const chooseDestinationFolder = async () => {
        const result = await fsController.selectDirectory();
        if (result.success && result.data) {
            setSelectDestinationPath(result.data);
            setErrorCheck("");
        }
    }

    const handleRefresh = async (isTo: boolean) => {
        try {
            showLoading("Đang tải lại. Vui lòng chờ");
            const result = await qaController.load(isTo);

            if (result.success && result.data) {
                isTo ? setQaToItems(result.data) : setQaFromItems(result.data);
                isTo ? setQaToSelectedItems(new Set()) : setQaFromSelectedItems(new Set());
            }
        } finally {
            hideLoading();
        }
    }

    const handleSelect = async (name: string, checked: boolean, isTo: boolean) => {
        if (isTo) {
            setQaToSelectedItems(prev => {
                const newSet = new Set(prev);
                const file = qaToItems.find(f => f.name === name);
                if (file) {
                    if (checked) {
                        newSet.add(file);
                    } else {
                        newSet.delete(file);
                    }
                }
                return newSet;
            });
        } else {
            setQaFromSelectedItems(prev => {
                const newSet = new Set(prev);
                const file = qaFromItems.find(f => f.name === name);
                if (file) {
                    if (checked) {
                        newSet.add(file);
                    } else {
                        newSet.delete(file);
                    }
                }
                return newSet;
            });
        }
    }

    const handleDetete = async () => {

    }

    const handleCancelModal = () => {
        setDisplayModalDownload(false);
    }

    const handleConfirmDownload = async () => {
        try {
            let resultFlg = false;
            if (!await fsController.isExitDirectory(selectDestinationPath)) {
                setErrorCheck("Đường dẫn không tồn tại.!");

            } else {
                showLoading('Đang thực hiện tải tập tin. Vui lòng không tắt màn hình...');
                const params = {
                    qa_target: "FROM",
                    qa_items: Array.from(qaFromSelectedItems).map(item => item.name),
                    localPath: selectDestinationPath,
                } as qa_download_params

                const result = await qaController.download(params);

                if (!result.success) {
                    showNotification(result.message || 'Tải về thất bại.', 'error');
                }
                resultFlg = result.success;
                resultFlg && showNotification('Tải về thành công.', 'success');
            }

            setDisplayModalDownload(!resultFlg);
        } finally {
            hideLoading();
        }
    }

    const upload = () => {
        setDisplayModalUpload(true);
        // setTargetDate(DateTime.now());
    }

    const handleCancelModalUpload = () => {
        setDisplayModalUpload(false);
    }
    const handleConfirmUpload = async () => {
        try {
            showLoading('Đang thực hiện đăng ký QA. Vui lòng không tắt màn hình...');
        } finally {
            hideLoading();
        }
    }

    const addAttachment = async () => {
        try {
            const result = await fsController.selectMultiDir();

            if (result.success && result.data) {
                const results = await fsController.readMultiDir(result.data);

                if (results.success && results.data) {
                    setUploadFileItems(results.data as []);
                }
            }
        } catch (err) {
            showNotification('Không thể chọn thư mục để tải lên.', 'error');
        }
    }

        // clear list
    const clearItems = () => {
        setUploadFileItems([]);
        setSelectedItems(new Set())
    }

    const findItem = (item: INode<IFlatMetadata>, datas: INode<IFlatMetadata>[]): file_item[] => {
        let files: file_item[] = [];

        for (const id of item.children) {
            const findedNode = datas.find(f => f.id === id);
            if (findedNode?.children && findedNode?.children.length > 0) {
                files.push(...findItem(findedNode, datas))
            } else {
                const file = uploadFileItems.find(f => f.name === findedNode?.name);
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
                    const file = uploadFileItems.find(f => f.name === node.element?.name);
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
    return (
        <>
            <div className="space-y-2 grid grid-cols-1 gap-2">
                <Fieldset title="Allexceed to Enercom">
                    <div>
                        <div className="border-b px-4 py-2 border-gray-200 flex flex-col items-end">
                            <div className="flex flex-row gap-2" >
                                <Button className="flex items-center space-x-2 text-red-500 border-red-500"
                                    disabled={disable_upload}
                                    onClick={() => handleDetete}>
                                    <TfiBrushAlt className="h-4 w-4 font-bold" />
                                    <span>Xóa QA</span>
                                </Button>

                                <Button className="flex items-center space-x-2"
                                    onClick={() => handleRefresh(true)}>
                                    <FcProcess className="w-4 h-4" />
                                    <span>Làm mới</span>
                                </Button>

                                <Button onClick={() => upload()} className="flex items-center space-x-2">
                                    <FaUpload className="h-5 w-5 font-bold" />
                                    <span>Tải lên</span>
                                </Button>
                            </div>
                        </div>

                        <DataTable className='col-span-2 p-3'
                            columns={[
                                { key: 'name', label: 'QA' },
                                { key: 'state', label: 'Trạng thái tải về' }
                            ]}
                            data={qaToItems}
                            showPagination={false}
                            showFilter={false}
                            showCheckboxes={true}
                            scrollHeight={300}
                            selectedRows={new Set(Array.from(qaToSelectedItems).map(f => f.name || ""))}
                            onRowSelectionChange={(rowKey: string, selected: boolean) => handleSelect(rowKey, selected, true)}
                            rowKey="name"
                        />
                    </div>
                </Fieldset>

                <Fieldset title="Enercom to Allexceed">
                    <div>
                        <div className="border-b px-4 py-2 border-gray-200 flex flex-col items-end">
                            <div className="flex flex-row gap-2" >
                                <Button className="flex items-center space-x-2"
                                    onClick={() => handleRefresh(false)}>
                                    <FcProcess className="w-4 h-4" />
                                    <span>Làm mới</span>
                                </Button>
                                <Button onClick={() => download()} className="flex items-center space-x-2"
                                    disabled={disable_download}>
                                    <FaDownload className="h-5 w-5 font-bold" />
                                    <span>Tải về</span>
                                </Button>
                            </div>
                        </div>
                        <DataTable className='col-span-2 p-3'
                            columns={[
                                { key: 'name', label: 'QA' },
                                { key: 'state', label: 'Trạng thái tải về' }
                            ]}
                            data={qaFromItems}
                            showPagination={false}
                            showFilter={false}
                            showCheckboxes={true}
                            selectedRows={new Set(Array.from(qaFromSelectedItems).map(f => f.name || ""))}
                            onRowSelectionChange={(rowKey: string, selected: boolean) => handleSelect(rowKey, selected, false)}
                            scrollHeight={300}
                            rowKey="name"
                        />
                    </div>
                </Fieldset>
            </div>

            <Modal open={displayModalDownload} onClose={handleCancelModal} title="Tải QA" size="lg">
                <div className="bg-white shadow-lg rounded-lg flex flex-col">
                    <div className="border-b border-gray-200 p-4">
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
                    </div>

                    <div className='grid grid-cols-1 gap-1'>
                        <DataTable
                            className='h-full'
                            columns={[
                                { key: 'name', label: 'QA' }
                            ]}
                            data={Array.from(qaFromSelectedItems).map(bugNo => ({
                                name: bugNo.name
                            }))}
                            showFilter={false}
                            rowKey="name"
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
                            onClick={handleConfirmDownload}
                            disabled={disable_start}
                            className="flex items-center space-x-2">
                            <FcOk className="h-5 w-5" />
                            <span>Bắt đầu...</span>
                        </Button>
                    </div>
                </div>
            </Modal>

            <Modal open={displayModalUpload} onClose={handleCancelModalUpload} title="Đăng ký QA" size="lg">
                <div className="bg-white shadow-lg rounded-lg flex flex-col">
                    <div className="flex flex-col border-b border-gray-200 p-4 gap-3">
                        <div className="flex flex-col items-end">
                            <div className="flex flex-row gap-2" >
                                <Button className="flex items-center space-x-2 text-red-500 border-red-500"
                                    onClick={clearItems}>
                                    <TfiBrushAlt className="h-5 w-5 font-bold" />
                                    <span>Xóa danh sách</span>
                                </Button>
                                <Button onClick={() => addAttachment()} className="flex items-center space-x-2">
                                    <IoIosAttach className="h-5 w-5 font-bold" />
                                    <span>Chọn tập tin</span>
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className='grid grid-cols-1 gap-1'>
                        <TreeView
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
                                        <FaFile className="w-5 h-5 text-green-700" />
                                    )}
                                    <span className={`${isBranch ? '' : 'text-green-700'}`}>{element.name}</span>
                                </div>
                            )}
                        />
                    </div>
                    <div className="flex justify-end items-center p-4 gap-3">
                        <Button
                            onClick={handleCancelModalUpload}
                            className="flex items-center space-x-2">
                            <GiExitDoor className="h-5 w-5" />
                            <span>Đóng</span>
                        </Button>

                        <Button
                            onClick={handleConfirmUpload}
                            className="flex items-center space-x-2">
                            <FcOk className="h-5 w-5" />
                            <span>Bắt đầu tải...</span>
                        </Button>
                    </div>
                </div>
            </Modal >
        </>
    )
}

export default QAPage;