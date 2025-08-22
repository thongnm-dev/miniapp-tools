import React, { useEffect, useState } from "react"
import Fieldset from "../components/ui/Fieldset";
import DataTable from "../components/ui/DataTable";
import { download_item } from "../types/download_item";
import { useLoading } from "../stores/LoadingContext";
import { aws_storage } from "../types/aws_storage";
import { appController } from "../controller/app_controller";

const DownloadHistoriesPage: React.FC = () => {

    const { showLoading, hideLoading } = useLoading();
    const [selete_options, setSeleteOptions] = useState<aws_storage[]>([]);
    const [download_items, setDownloadIems] = useState<download_item[]>([]);

    useEffect(() => {
        setSeleteOptions([]);

        const loadItems = async () => {
            const result = await appController.get_upload_items();

            if (result.success && result.data) {
                setSeleteOptions(result.data);
            }

        }
        loadItems();

    }, []);

    const search = async () => {
        try {
            showLoading();

        } finally {
            hideLoading();
        }
    }
    return (
        <>
            <div className="space-y-2 grid grid-cols-1 gap-2">
                <Fieldset title="Tìm kiếm">
                    <div className="flex flex-col items-start gap-2">
                        <div className="flex flex-row items-center justify-items-center text-center gap-2">
                            <label className="form-label bg-sky-500 text-white px-3 py-2 rounded h-10 items-center w-[120px]">
                                Trạng thái:
                            </label>
                            <select className="bg-transparent p-2 text-slate-700 text-sm border border-slate-200 rounded transition duration-300 ease focus:outline-none focus:border-slate-400 hover:border-slate-400 shadow-sm focus:shadow-md appearance-none cursor-pointer">
                                <option value="">Tất cả</option>
                                {selete_options.map((item) => {
                                    return <option value={item.aws_cd} key={item.aws_cd}>{item.aws_name}</option>
                                })}
                            </select>
                        </div>

                        <div className="flex flex-row items-center justify-items-center text-center gap-2">
                            <label className="form-label bg-sky-500 text-white px-3 py-2 rounded h-10 items-center w-[180px]">
                                Ngày upload
                            </label>
                            <div className="flex flex-row items-start justify-items-center gap-3">
                                <input type="date" className="form-input" />
                                <input type="date" className="form-input" />
                            </div>
                        </div>

                        <div className="flex flex-row items-center justify-items-center text-center gap-2">
                            <label className="form-label bg-sky-500 text-white px-3 py-2 rounded h-10 items-center w-[180px]">
                                Bug No
                            </label>
                            <input
                                type="text"
                                required
                                className="form-input"
                                placeholder="e.g., Bachelor's Degree"
                            />
                        </div>

                        <div className="flex flex-row items-center justify-items-center text-center gap-2">
                            <input type="checkbox" className="form-input" />
                            <label className="whitespace-nowrap">
                                Đã di chuyển sau khi thực hiện upload
                            </label>
                        </div>
                    </div>
                </Fieldset>

                <Fieldset title="Danh sách">
                    <DataTable
                        data={download_items}
                        columns={[

                        ]}
                        showFilter={false}
                        showCheckboxes={true}
                        scrollHeight={400}
                    />
                </Fieldset>
            </div>
        </>
    )
}

export default DownloadHistoriesPage;