import { PaperAirplaneIcon, PencilSquareIcon, PlusIcon, TruckIcon } from "@heroicons/react/24/outline";
import Button from "../components/ui/Button";
import DataTable from "../components/ui/DataTable";
import { useState } from "react";
import Fieldset from "../components/ui/Fieldset";

const columns = [
    {
        key: 'bug_no',
        label: 'ID',
    },
    {
        key: 'bug_status',
        label: 'Trạng thái',
    },
    {
        key: 'program_related',
        label: 'Đối tưọng',
    },
    {
        key: 'dual_date',
        label: 'Ngày dự định',
    },
    {
        key: 'actual_date',
        label: 'Ngày thực tế',
    },
    {
        key: 'bug_priority',
        label: 'Độ ưu tiên',
    },
    {
        key: 'assignee',
        label: 'Người phụ trách',
    },
    {
        key: 'bug_type',
        label: 'Phân loại',
    }
];
const BugManagePage: React.FC = () => {

    const [bug_list, setBug_list] = useState<[]>([]);


    const register = async () => {
        
    }
    const customCellRender = {

    }
    return (
        <>
            <div className="space-y-2 grid grid-cols-1 gap-2">
                <div className="bg-white rounded-lg shadow p-2 border-b border-gray-200 flex gap-2 justify-end">
                    <Button
                        className="flex items-center space-x-2"
                    >
                        <PlusIcon className="w-4 h-4" />
                        <span>Đăng ký</span>
                    </Button>
                    <Button
                        className="flex items-center space-x-2"
                    >
                        <PencilSquareIcon className="w-4 h-4" />
                        <span>Cập nhật danh sách</span>
                    </Button>
                    <Button
                        className="flex items-center space-x-2"
                    >
                        <TruckIcon className="w-4 h-4" />
                        <span>Giao hàng</span>
                    </Button>
                    <Button
                        className="flex items-center space-x-2"
                    >
                        <PaperAirplaneIcon className="w-4 h-4" />
                        <span>Đăng ký backlog</span>
                    </Button>
                </div>

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
                        data={bug_list}
                        columns={columns}
                        showFilter={false}
                        showCheckboxes={true}
                        scrollHeight={400}
                        customCellRender={customCellRender}
                    />
                </Fieldset>
            </div>
        </>
    )
}

export default BugManagePage;