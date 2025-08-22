import React, { useEffect, useState } from "react"
import Fieldset from "../components/ui/Fieldset";
import DataTable from "../components/ui/DataTable";
import { upload_item } from "../types/upload_item";
import { useLoading } from "../stores/LoadingContext";
import { aws_storage } from "../types/aws_storage";
import { appController } from "../controller/app_controller";
import Button from "../components/ui/Button";
import { CiSearch } from "react-icons/ci";

export interface upload_props {
    aws_cd?: string,
    from_date?: Date,
    to_date?: Date,
    bug_no?: string,
    moved_at_s3?: boolean,
}
const UploadHistoriesPage: React.FC = () => {

    const { showLoading, hideLoading } = useLoading();
    const [selete_options, setSeleteOptions] = useState<aws_storage[]>([]);
    const [upload_items, setUploadIems] = useState<upload_item[]>([]);
    const [upload_props, setUploadProps] = useState<upload_props>({} as upload_props);

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
                        <div className="flex flex-row items-center justify-items-center gap-2">
                            <span className="bg-sky-500 text-white px-3 py-2 rounded h-full w-[120px]">
                                Trạng thái
                            </span>
                            <select className="bg-transparent px-3 py-2 text-slate-700 text-sm border border-slate-200 rounded transition duration-300 ease focus:outline-none focus:border-slate-400 hover:border-slate-400 shadow-sm focus:shadow-md appearance-none cursor-pointer"
                                    >
                                <option value="">Tất cả</option>
                                {selete_options.map((item) => {
                                    return <option value={item.aws_cd} key={item.aws_cd}>{item.aws_name}</option>
                                })}
                            </select>
                        </div>

                        <div className="flex flex-row items-center justify-items-center gap-2">
                            <span className="bg-sky-500 text-white px-3 py-2 rounded h-10 items-center w-[120px]">
                                Ngày cần tìm
                            </span>
                            <div className="flex flex-row items-start justify-items-center gap-3">
                                <input type="date" className="px-3 py-2 border border-slate-200 rounded" />
                                <input type="date" className="px-3 py-2 border border-slate-200 rounded" />
                            </div>
                        </div>

                        <div className="flex flex-row items-center justify-items-center gap-2">
                            <span className="bg-sky-500 text-white px-3 py-2 rounded h-10 items-center w-[120px]">
                                Bug No
                            </span>
                            <input
                                type="text"
                                className="px-3 py-2 border border-slate-200 rounded w-[338px]"
                                placeholder="Nhập mã phiếu bug..."
                            />
                        </div>

                        <div className="flex flex-row items-center justify-items-center gap-2">
                            <input type="checkbox" className="form-input" />
                            <label className="whitespace-nowrap">
                                Đã di chuyển sau khi thực hiện tải lên
                            </label>
                        </div>
                    </div>
                    <div className="pt-4">
                        <Button
                            onClick={search}
                            className="flex items-center gap-2">
                            <CiSearch className="w-4 h-4 stroke-2" />
                            Tìm kiếm
                        </Button>
                    </div>
                </Fieldset>

                <Fieldset title="Danh sách">
                    <DataTable
                        data={upload_items}
                        columns={[
                            {key: "upload_ymd", label: "Ngày thực hiện"},
                            {key: "aws_name", label: "Đích đã tải lên"},
                            {key: "bug_no", label: "Thông tin đã tải lên"},
                            {key: "upload_count", label: "Tổng số tập tin"},
                            {key: "is_moved_at_s3", label: "Trạng thái di chuyển"},
                        ]}
                        showFilter={false}
                        showCheckboxes={true}
                        scrollHeight={400}
                        showPagination={true}
                    />
                </Fieldset>
            </div>
        </>
    )
}

export default UploadHistoriesPage;