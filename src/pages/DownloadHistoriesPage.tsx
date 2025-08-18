import React, { useState } from "react"
import Fieldset from "../components/ui/Fieldset";
import DataTable from "../components/ui/DataTable";
import { download_item } from "../types/download_item";

const DownloadHistoriesPage : React.FC = () => {

    const [download_items, setDownloadIems] = useState<download_item[]>([]);
    return (
        <>
            <div className="space-y-2 grid grid-cols-1 gap-2">
                <Fieldset title="Tìm kiếm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="form-label">
                                School/University Name *
                            </label>
                            <input
                                type="text"
                                required
                                className="form-input"
                                placeholder="Enter school/university name"
                            />
                        </div>

                        <div>
                            <label className="form-label">
                                Degree/Certificate *
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
                                Field of Study *
                            </label>
                            <input
                                type="text"
                                required
                                className="form-input"
                                placeholder="e.g., Computer Science"
                            />
                        </div>

                        <div>
                            <label className="form-label">
                                Graduation Date *
                            </label>
                            <input
                                type="date"
                                required
                                className="form-input"
                            />
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