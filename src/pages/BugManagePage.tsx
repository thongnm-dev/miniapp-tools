import Button from "../components/ui/Button";
import DataTable from "../components/ui/DataTable";
import { useState } from "react";
import Fieldset from "../components/ui/Fieldset";
import { FcAddImage, FcFullTrash, FcPlus, FcShipped } from "react-icons/fc";
import { FaPenToSquare } from "react-icons/fa6";
import { CiSearch } from "react-icons/ci";
import { useLoading } from "../stores/LoadingContext";
import { showNotification } from "../components/notification";

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

    const { showLoading, hideLoading } = useLoading();
    const [bug_list, setBugItems] = useState<[]>([]);


    const register = async () => {

    }
    const customCellRender = {

    }

    const clearSearch = () => {

    }

    const search = async () => {
        try {
            showLoading();
            // const result = await downloadController.search_download_histories(download_props);
            // if (!result.success) {
            //     showNotification('Không thể tìm kiếm thông tin phiếu bug.', 'error');
            // } else {
            //     setBugItems(result.data || []);
            // }

        } catch (error) {
            showNotification('Không thể tìm kiếm thông tin phiếu bug.', 'error');
        } finally {
            hideLoading();
        }
    }
    return (
        <>
            <div className="space-y-2 grid grid-cols-1 gap-2">
                <div className="bg-white rounded-lg shadow p-2 border-b border-gray-200 flex gap-2 justify-end">
                    <Button
                        className="flex items-center space-x-2"
                    >
                        <FcPlus className="w-4 h-4" />
                        <span>Đăng ký</span>
                    </Button>
                    <Button
                        className="flex items-center space-x-2"
                    >
                        <FaPenToSquare className="w-4 h-4 text-orange-500" />
                        <span>Cập nhật danh sách</span>
                    </Button>
                    <Button
                        className="flex items-center space-x-2"
                    >
                        <FcShipped className="w-4 h-4" />
                        <span>Giao hàng</span>
                    </Button>
                    <Button
                        className="flex items-center space-x-2"
                    >
                        <FcAddImage className="w-4 h-4" />
                        <span>Đăng ký backlog</span>
                    </Button>
                </div>

                <Fieldset title="Tìm kiếm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-row gap-4 pt-4">
                            <Button
                                onClick={clearSearch}
                                className="flex items-center gap-2">
                                <FcFullTrash className="w-4 h-4 stroke-2 text-red-500" />
                                Xoá thông tin nhập
                            </Button>
                            <Button
                                onClick={search}
                                className="flex items-center gap-2">
                                <CiSearch className="w-4 h-4 stroke-2" />
                                Tìm kiếm
                            </Button>
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