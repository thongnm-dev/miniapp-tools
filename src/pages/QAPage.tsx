import React, { useState } from "react"
import DataTable from "../components/ui/DataTable";
import { qa_item } from "../types/qa_item";

const QAPage: React.FC = () => {

    const [qa_items, setQAItems] = useState<qa_item[]>([]);
    return (
        <>
            <div className="space-y-2 grid grid-cols-1 gap-2">
                <div className="bg-white shadow border-gray-300 rounded-lg border-b p-4 border-gray-200">
                    <div className="flex flex-row gap-10 items-start gap-2">
                        <div className="flex flex-row items-center justify-items-center gap-2">
                            <label className="whitespace-nowrap">Chọn đối tượng hiển thị:</label>
                        </div>
                        <div className="flex flex-row items-center justify-items-center gap-2">
                            <input type="radio" className="form-input" />
                            <label className="whitespace-nowrap">ec ＝＞ alx</label>
                        </div>
                        <div className="flex flex-row items-center justify-items-center gap-2">
                            <input type="radio" className="form-input" />
                            <label className="whitespace-nowrap">alx ＝＞ ec</label>
                        </div>
                    </div>
                </div>

                <div className="bg-white shadow border-gray-300 rounded-lg border-b p-4 border-gray-200">
                    <DataTable className='col-span-2 p-3'
                                columns={[
                                    { key: 'QA', label: 'QA'},
                                    { key: 'count', label: 'Số lượng thư mục con'},
                                    { key: 'state', label: 'Trạng thái tải về'}
                                ]}
                                data={qa_items}
                                showPagination={false}
                                showFilter={false}
                                showCheckboxes={true}
                                scrollHeight={500}
                                rowKey="name"
                            />
                </div>
            </div>
        </>
    )
}

export default QAPage;