import { FolderIcon, FolderMinusIcon, FolderPlusIcon, HomeIcon, MagnifyingGlassIcon, NewspaperIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { fsController } from "../controller/fs-controller";
import TreeView, { flattenTree } from "react-accessible-treeview";

export interface ExploreProps {
    className?: string;
    extDir?: string;
}

const folder = {
  name: "root",
  children: [
    {
      name: "src",
      children: [{ name: "index.js" }, { name: "styles.css" }],
    },
    {
      name: "node_modules",
      children: [
        {
          name: "react-accessible-treeview",
          children: [{ name: "index.js" }],
        },
        { name: "react", children: [{ name: "index.js" }] },
      ],
    },
    {
      name: ".npmignore",
    },
    {
      name: "package.json",
    },
    {
      name: "webpack.config.js",
    },
  ],
};

const data = flattenTree(folder);

const Explore: React.FC<ExploreProps> = ({ className = "", extDir = "" }) => {

    const [directory, setDirectory] = useState<string>("");
    const [searchText, setSearchText] = useState<string>("");

    useEffect(() => {
        if (extDir) {

        }
    }, [extDir]);

    const selectDirectory = async () => {
        const result = await fsController.selectDirectory();
        if (result.success && result.path) {
            setDirectory(result.path);
        }
    };

    return (
        <>
            <div className="bg-white shadow px-2 py-2 grid grid-cols-1">
                <div className="flex items-center justify-between gap-1">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <HomeIcon className='h-5 w-5' />
                        </div>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-1">
                            <button className="p-2.5" onClick={selectDirectory}>
                                <FolderIcon className='h-5 w-5' />
                            </button>
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2 border focus: rounded-lg focus:outline-none"
                        />
                    </div>
                    <div className="relative">
                        <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center">
                            <button>
                                <MagnifyingGlassIcon className='h-5 w-5' />
                            </button>
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-2 pr-3 py-2 border border-secondary-300 rounded-lg focus:outline-none"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 px-2 py-4 border-b">
                    <div className="flex items-center gap-2">
                        <input type="checkbox" className="text-xs text-red-500"/>
                        <span className="text-xs text-red-500">Loại bỏ thư mục lịch sử</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <input type="radio" className="text-xs text-red-500"/>
                        <span className="text-xs text-red-500">Hiển thị dạng lưới</span>
                        <input type="radio" className="text-xs text-red-500"/>
                        <span className="text-xs text-red-500">Hiển thị dạng cây</span>
                    </div>
                </div>

                <div className="overflow-y-auto p-4 h-[480px]">
                    <TreeView
                        data={data}
                        aria-label="directory tree"
                        togglableSelect
                        clickAction="EXCLUSIVE_SELECT"
                        multiSelect
                        nodeAction="check"
                        nodeRenderer={({
                            element,
                            isBranch,
                            isExpanded,
                            getNodeProps,
                            level
                        }) => (
                            <div {...getNodeProps()} style={{ paddingLeft: 20 * (level - 1) }} className="flex flex-row hover:cursor-pointer"    >
                                {isBranch ? (
                                    // <FolderIcon className="w-5 h-5 text-orange-400"/>
                                    isExpanded ? <FolderMinusIcon className='w-5 h-5 text-orange-400' /> : <FolderPlusIcon className='w-5 h-5 text-orange-400' />
                                ) : (
                                    <NewspaperIcon className="w-5 h-5"/>
                                )}
                                {element.name}
                            </div>
                        )}
                        />
                </div>
            </div>
        </>
    )
}

export default Explore;