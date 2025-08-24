import React, { useEffect, useState } from "react"
import Fieldset from "../components/ui/Fieldset";
import DataTable from "../components/ui/DataTable";
import { download_item } from "../types/download_item";
import { useLoading } from "../stores/LoadingContext";
import { aws_storage } from "../types/aws_storage";
import { appController } from "../controller/app_controller";
import Button from "../components/ui/Button";
import { search_download_params } from "../types/param_interface";
import { DateUtils } from "../core/utils/date-utils";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FcAddImage, FcFullTrash } from "react-icons/fc";
import { CiSearch } from "react-icons/ci";


const init_params = {
    aws_cd: "",
    bug_no: "",
    from_date: undefined,
    to_date: undefined,
    is_moved_at_s3: false,
} as search_download_params;

const DownloadHistoriesPage: React.FC = () => {

    const { showLoading, hideLoading } = useLoading();
    const [selete_options, setSeleteOptions] = useState<aws_storage[]>([]);
    const [download_items, setDownloadIems] = useState<download_item[]>([]);
    const [upload_props, setUploadProps] = useState<search_download_params>(init_params);
    const [fromDate, setFromDateIn] = useState<Date | null>(null);
    const [toDate, setToDateIn] = useState<Date | null>(null);


    const getAwsCd = () => {
        return upload_props.aws_cd;
    }

    const getBugNo = () => {
        return upload_props.bug_no;
    }

    const getMove = () => {
        return upload_props.is_moved_at_s3;
    }

    const setFromDate = (from?: Date | null) => {
        setFromDateIn(from || null);
        setUploadProps({ ...upload_props, from_date: DateUtils.formatDate(from, "yyyyMMdd") });
    }

    const setToDate = (to?: Date | null) => {
        setFromDateIn(to || null);
        setUploadProps({ ...upload_props, to_date: DateUtils.formatDate(to, "yyyyMMdd") });
    }

    const setAwsCd = (aws_cd: string) => {
        setUploadProps({ ...upload_props, aws_cd: aws_cd });
    }
    const setBugNo = (bugNo: string) => {
        setUploadProps({ ...upload_props, bug_no: bugNo });
    }
    const setMoveAtS3 = (isMove: boolean) => {
        setUploadProps({ ...upload_props, is_moved_at_s3: isMove });
    }

    useEffect(() => {
        setSeleteOptions([]);

        const loadItems = async () => {
            const result = await appController.get_download_items();

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

    const clearSearch = () => {
        setUploadProps(init_params);
        setFromDateIn(null);
        setToDateIn(null);
    }
    return (
        <>
            <div className="space-y-2 grid grid-cols-1 gap-2">
                <Fieldset title="Tìm kiếm">
                    <div className="flex flex-col items-start gap-2">
                        <div className="flex flex-row items-center justify-items-center gap-2">
                            <span className="bg-sky-500 text-white px-3 py-2 rounded h-full w-[120px]">
                                Nguồn tải về
                            </span>
                            <select className="bg-transparent px-3 py-2 text-slate-700 text-sm border border-slate-200 rounded transition duration-300 ease focus:outline-none focus:border-slate-400 hover:border-slate-400 shadow-sm focus:shadow-md appearance-none cursor-pointer"
                                value={getAwsCd()} onChange={(event) => setAwsCd(event.target.value)}>
                                <option value="">Tất cả</option>
                                {selete_options.map((item) => {
                                    return <option value={item.aws_cd} key={item.aws_cd}>{item.aws_name}</option>
                                })}
                            </select>
                        </div>

                        <div className="flex flex-row items-center justify-items-center gap-2">
                            <span className="bg-sky-500 text-white px-3 py-2 rounded h-10 items-center w-[120px]">
                                Ngày tải về
                            </span>
                            <div className="flex flex-row items-start justify-items-center gap-3">
                                <DatePicker className="px-3 py-2 border border-slate-200 rounded w-[120px]"
                                    dateFormat={"yyyy/MM/dd"}
                                    selected={fromDate} onChange={(date) => setFromDate(date)} />
                                <DatePicker className="px-3 py-2 border border-slate-200 rounded w-[120px]"
                                    selected={toDate} onChange={(date) => setToDate(date)} />
                            </div>
                        </div>

                        <div className="flex flex-row items-center justify-items-center gap-2">
                            <span className="bg-sky-500 text-white px-3 py-2 rounded h-10 items-center w-[120px]">
                                Bug No
                            </span>
                            <input value={getBugNo()}
                                type="text" onChange={(event) => setBugNo(event.target.value)}
                                className="px-3 py-2 border border-slate-200 rounded w-[338px]"
                                placeholder="Nhập mã phiếu bug..."
                            />
                        </div>

                        <div className="flex flex-row items-center justify-items-center gap-2">
                            <input type="checkbox" className="form-input" checked={getMove()} onChange={(event) => setMoveAtS3(event.target.checked)} />
                            <label className="whitespace-nowrap">
                                Đã di chuyển sau khi tải về
                            </label>
                        </div>
                    </div>
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
                </Fieldset>

                <Fieldset title="Danh sách">
                    {getAwsCd() === "02" && download_items.length > 0 &&
                        <div className='flex justify-end py-2 border-b'>
                            <Button className="flex items-center space-x-2 text-red-500 border-red-500">
                                <FcAddImage className="h-4 w-4 font-bold" />
                                <span>Đăng ký phiếu bug</span>
                            </Button>
                        </div>
                    }
                    <DataTable
                        data={download_items}
                        columns={[
                            {key: "download_ymd", label: "Ngày thực hiện"},
                            {key: "aws_name", label: "Nguồn đã tải"},
                            {key: "bug_no", label: "Thông tin đã tải"},
                            {key: "download_count", label: "Tổng số tập tin"},
                            {key: "is_moved_at_s3", label: "Di chuyển sau tải"},
                            {key: "is_moved_at_local", label: "Di chuyển nội bộ"},
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