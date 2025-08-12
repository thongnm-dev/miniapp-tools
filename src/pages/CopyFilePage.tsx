import { ArrowsRightLeftIcon, FolderIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { fsController } from "../controller/fs-controller";
import { showNotification } from "../components/notification";

const CopyFilePage: React.FC = () => {
    const [source, setSource] = useState<string>("D:\\Projects\\ESS\\ESS_IAT\\ess_shin_moela");
    const [destination, setDestination] = useState<string>("D:\\Projects\\ESS\\ess_shin_moela");
    const [filePath, setFilePath] = useState<string>("");
    const selectDirectory = async () => {
        try {
            const result = await fsController.selectDirectory();

            console.log(result.data)
            if (result.success && result.data) {
                setSource(result.data);
            }
        } catch (err) {
            showNotification('Không thể chọn thư đường dẫn.', 'error');
        }
    };
    return (
        <>
            <div className="space-y-2 grid grid-cols-1 gap-2">
                <div className="bg-white rounded-lg shadow p-2 border-b border-gray-200 flex flex-row gap-4 align-middle justify-between">
                    <div className="flex flex-col gap-1 w-3/6">
                        <div className="relative flex-1">
                            <span className="absolute inset-y-0 left-0 flex items-center px-3 text-red-500 font-bold">Nguồn:</span>
                            <div className="absolute inset-y-0 right-0 pl-3 flex items-center">
                                <button className='p-3' onClick={selectDirectory}>
                                    <FolderIcon className='h-5 w-5' />
                                </button>
                            </div>
                            <span className="block w-full pl-20 pr-3 py-2 border bg-gray-50 rounded-lg focus:outline-none">
                                {source || 'No directory selected'}
                            </span>
                        </div>
                    </div>
                    <div className="text-center justify-items-center">
                        <button className="p-3 w-[80px]">
                            <ArrowsRightLeftIcon className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="flex flex-col gap-1 w-3/6">
                        <div className="relative flex-1">
                            <span className="absolute inset-y-0 left-0 flex items-center px-3 text-red-500 font-bold">Đích:</span>
                            <div className="absolute inset-y-0 right-0 pl-3 flex items-center">
                                <button className='p-3' onClick={selectDirectory}>
                                    <FolderIcon className='h-5 w-5' />
                                </button>
                            </div>
                            <span className="block w-full pl-20 pr-3 py-2 border bg-gray-50 rounded-lg focus:outline-none">
                                {destination || 'No directory selected'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="w-full bg-white">
                    <textarea value={filePath} onChange={(event) => setFilePath(event.target.value)} rows={20} className="w-full"/>
                </div>
            </div>
        </>
    )
}

export default CopyFilePage;