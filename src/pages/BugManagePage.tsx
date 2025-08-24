import Button from "../components/ui/Button";
import DataTable from "../components/ui/DataTable";
import { useEffect, useState } from "react";
import Fieldset from "../components/ui/Fieldset";
import { FcAddImage, FcDataSheet, FcFullTrash, FcPlus, FcShipped } from "react-icons/fc";
import { FaPenToSquare } from "react-icons/fa6";
import { CiSearch } from "react-icons/ci";
import { useLoading } from "../stores/LoadingContext";
import { showNotification } from "../components/notification";
import { aws_storage } from "../types/aws_storage";
import { appController } from "../controller/app_controller";
import DatePicker from "react-datepicker";
import { MdAutoFixHigh } from "react-icons/md";

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
        label: 'PG',
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
        key: 'confirm_usr',
        label: 'Người xác nhận',
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
    const [selete_options, setSeleteOptions] = useState<aws_storage[]>([]);
    const [bug_list, setBugItems] = useState<[]>([]);

    useEffect(() => {
        setSeleteOptions([]);
        const loadItems = async () => {
            const result = await appController.get_all_items();
            if (result.success && result.data) {
                setSeleteOptions(result.data.sort((a, b) => a.aws_cd.localeCompare(b.aws_cd)));
            }
        }

        loadItems();
    }, []);

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
                        <MdAutoFixHigh className="w-4 h-4" />
                        <span>Đồng bộ trạng thái</span>
                    </Button>
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
                    <Button
                        className="flex items-center space-x-2"
                    >
                        <FcDataSheet className="w-4 h-4" />
                        <span>Xuất excel</span>
                    </Button>
                </div>

                <Fieldset title="Tìm kiếm">
                    <div className="grid grid-cols-3 items-start gap-2">
                        <div className="flex flex-row items-center justify-items-center gap-2">
                            <span className="bg-sky-500 text-white px-3 py-2 rounded h-full w-[140px]">
                                Trạng thái
                            </span>
                            <select className="bg-transparent px-3 py-2 text-slate-700 text-sm border border-slate-200 rounded transition duration-300 ease focus:outline-none focus:border-slate-400 hover:border-slate-400 shadow-sm focus:shadow-md appearance-none cursor-pointer">
                                <option value="">Tất cả</option>
                                {selete_options.map((item) => {
                                    return <option value={item.aws_cd} key={item.aws_cd}>{item.aws_name}</option>
                                })}
                            </select>
                        </div>
                        <div className="col-span-2 flex flex-row items-center justify-items-center gap-2">
                            <span className="bg-sky-500 text-white px-3 py-2 rounded h-full w-[140px]">
                                Phân loại
                            </span>
                            <select className="bg-transparent px-3 py-2 text-slate-700 text-sm border border-slate-200 rounded transition duration-300 ease focus:outline-none focus:border-slate-400 hover:border-slate-400 shadow-sm focus:shadow-md appearance-none cursor-pointer">
                                <option value="">Tất cả</option>
                                <option value="">Lỗi</option>
                                <option value="">Thay đổi quy cách</option>
                                
                            </select>
                        </div>
                        <div className="flex flex-row items-center justify-items-center gap-2">
                            <span className="bg-sky-500 text-white px-3 py-2 rounded h-10 items-center w-[140px]">
                                Ngày kỳ hạn
                            </span>
                            <div className="flex flex-row items-start justify-items-center gap-3">
                                <DatePicker className="px-3 py-2 border border-slate-200 rounded w-[120px]"
                                    dateFormat={"yyyy/MM/dd"}/>
                            </div>
                        </div>
                        
                        <div className="flex flex-row items-center justify-items-center gap-2">
                            <span className="bg-sky-500 text-white px-3 py-2 rounded h-10 items-center w-[140px]">
                                Ngày xác nhận
                            </span>
                            <div className="flex flex-row items-start justify-items-center gap-3">
                                <DatePicker className="px-3 py-2 border border-slate-200 rounded w-[120px]"
                                    dateFormat={"yyyy/MM/dd"}/>
                            </div>
                        </div>

                        <div className="flex flex-row items-center justify-items-center gap-2">
                            <span className="bg-sky-500 text-white px-3 py-2 rounded h-10 items-center w-[170px]">
                                Người xác nhận
                            </span>
                            <div className="flex flex-row items-start justify-items-center gap-3">
                                <input className="px-3 py-2 border border-slate-200 rounded w-[120px]"/>
                            </div>
                        </div>

                        <div className="flex flex-row items-center justify-items-center gap-2">
                            <span className="bg-sky-500 text-white px-3 py-2 rounded h-10 items-center w-[140px]">
                                Ngày dự định
                            </span>
                            <div className="flex flex-row items-start justify-items-center gap-3">
                                <DatePicker className="px-3 py-2 border border-slate-200 rounded w-[120px]"
                                    dateFormat={"yyyy/MM/dd"}/>
                            </div>
                        </div>

                        <div className="flex flex-row items-center justify-items-center gap-2">
                            <span className="bg-sky-500 text-white px-3 py-2 rounded h-10 items-center w-[140px]">
                                Ngày thực tế
                            </span>
                            <div className="flex flex-row items-start justify-items-center gap-3">
                                <DatePicker className="px-3 py-2 border border-slate-200 rounded w-[120px]"
                                    dateFormat={"yyyy/MM/dd"}/>
                            </div>
                        </div>

                        <div className="flex flex-row items-center justify-items-center gap-2">
                            <span className="bg-sky-500 text-white px-3 py-2 rounded h-10 items-center w-[170px]">
                                Người phụ trách
                            </span>
                            <div className="flex flex-row items-start justify-items-center gap-3">
                                <input className="px-3 py-2 border border-slate-200 rounded w-[120px]"/>
                            </div>
                        </div>

                        <div className="col-span-3 flex flex-row items-center justify-items-center gap-2">
                            <span className="bg-sky-500 text-white px-3 py-2 rounded h-10 items-center w-[140px]">
                                Từ khoá
                            </span>
                            <div className="flex flex-row items-start justify-items-center gap-3">
                                <input className="px-3 py-2 border border-slate-200 rounded w-[580px]"/>
                            </div>
                        </div>
                    </div>
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