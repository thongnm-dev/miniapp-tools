import React, { useState } from "react"
import Fieldset from "../components/ui/Fieldset";
import DataTable from "../components/ui/DataTable";
import { download_item } from "../types/download_item";
import { FETCH_STATES_LIST } from "../config/constants";

const DownloadHistoriesPage : React.FC = () => {

    const [download_items, setDownloadIems] = useState<download_item[]>([]);
    return (
        <>
            <div className="space-y-2 grid grid-cols-1 gap-2">
                <Fieldset title="Tìm kiếm">
                    <div className="grid grid-cols-1 gap-2">
                        <div>
                            <label className="form-label">
                                Trạng thái:
                            </label>
                            <select className="w-full bg-transparent placeholder:text-slate-400 text-slate-700 text-sm border border-slate-200 rounded pl-3 pr-8 py-2 transition duration-300 ease focus:outline-none focus:border-slate-400 hover:border-slate-400 shadow-sm focus:shadow-md appearance-none cursor-pointer">
                                <option value="">Tất cả</option>
                                {FETCH_STATES_LIST.map((item, index) => {
                                    return <option value={item.code} key={index}>{item.path}</option>
                                })}
                            </select>
                        </div>

                        <div>
                            <label className="form-label">
                                Bug No
                            </label>
                            <input
                                type="text"
                                required
                                className="form-input"
                                placeholder="e.g., Bachelor's Degree"
                            />
                        </div>

                        <div>
                            <label className="form-label">
                                Ngày thực hiện upload
                            </label>
                            <div className="flex flex-row items-start justify-items-center gap-3">
                                <input type="date" className="form-input w-1/12"/>
                                <input type="date" className="form-input w-1/12"/>
                            </div>
                        </div>

                        <div className="flex flex-row">
                            <div className="flex flex-row items-start justify-items-center">
                                <input type="checkbox" className="form-input"/>
                                <label className="whitespace-nowrap">
                                    Trạng thái di chuyển sau khi thực hiện upload tập tin
                                </label>
                            </div>
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