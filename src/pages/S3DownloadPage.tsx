import React, { useCallback, useEffect, useMemo, useState } from "react";
import DataTable from "../components/ui/DataTable";
import { Link } from "react-router-dom";
import { downloadController } from "../controller/download-controller";
import S3Download from "../components/S3Download";
import Fieldset from "../components/ui/Fieldset";
import { useAuth } from "../stores/AuthContext";
import { download_item } from "../types/download_item";
import { aws_storage } from "../types/aws_storage";
import { appController } from "../controller/app_controller";
import { s3Controller } from "../controller/s3-controller";
import emptyList from "../assets/empty.gif";
import Button from "../components/ui/Button";
import { FcProcess } from "react-icons/fc";
import { useLoading } from "../stores/LoadingContext";

const columns = [
    {
        key: 'id',
        label: 'ID',
    },
    {
        key: 'download_time',
        label: 'Thời gian',
    },
    {
        key: 'aws_name',
        label: 'Trạng thái S3',
    },
    {
        key: 'download_count',
        label: 'Số lượng tập tin đã tải',
    }
];

export const S3DownloadPage: React.FC = () => {
    const { user } = useAuth();
    const { showLoading, hideLoading } = useLoading();
    const [download_items, setDownloadItems] = useState<download_item[]>([]);
    const [list_download_items, setList_download_items] = useState<aws_storage[]>([]);
    const [downloadable, setDownloadable] = useState<Record<string, { download_available: boolean }>>({});
    const [is_reload, setIsReload] = useState<boolean>(false);

    useEffect(() => {
        setList_download_items([]);
        const loadItems = async () => {
            const result = await appController.get_download_items();

            if (result.success && result.data) {
                setList_download_items(result.data);
            }
        }

        loadItems();

        const handler = () => {
            refreshDownload();
        };

        window.addEventListener("refreshDownload", handler);
        return () => window.removeEventListener("refreshDownload", handler);


    }, []);

    useEffect(() => {

        const check_exist_to_download = () => {
            setIsReload(true);
        }

        check_exist_to_download();
        
        window.addEventListener("check_exist_to_download", check_exist_to_download);
        return () => window.removeEventListener("check_exist_to_download", check_exist_to_download);
    }, []);

    useEffect(() => {
        const init = async () => {
            const result2 = await downloadController.get_downloads(user?.username || "");
            if (result2.success && result2.data) {
                setDownloadItems(result2.data as []);
            }
        }

        init();
        let isMounted = true;
        // immediately fetch every 15 minutes
        const interval = setInterval(init, 1500000); // 5 minutes
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

    useEffect(() => {
        setDownloadable({});
        if (list_download_items.length > 0 || is_reload) {
            const init = async () => {
                const result = await s3Controller.check_exist_to_download(list_download_items);
                if (result.success) {
                    console.log(result.data);
                    setDownloadable(result.data || {});
                }
                setIsReload(false);
            }

            init();
            let isMounted = true;

            const interval = setInterval(init, 1500000);
            return () => {
                isMounted = false;
                clearInterval(interval);
            };
        }
    }, [list_download_items, is_reload]);

    const trackingTranLog = useMemo(() => {
        return download_items.length > 0;
    }, [download_items]);

    const notempty_download = useMemo(() => {
        if (Object.keys(downloadable).length > 0) {
            let checking = 0;
            for (const aws_storage of list_download_items) {
                console.log(downloadable[aws_storage.aws_cd]?.download_available)
                if (downloadable[aws_storage.aws_cd]?.download_available) {
                    checking++;
                }
            }
            return checking !== 0;
        }
    }, [downloadable]);

    const candownload = useCallback((aws_cd: string) => {
        if (Object.entries(downloadable).length > 0) {
            return downloadable[aws_cd].download_available;
        }
        return false;
    }, [downloadable]);

    const customCellRender = {
        id: (row: Record<string, any>) => {
            return <Link to={`/s3download/${row.id}`}
                state={{ sync_path: row.sync_path }}
                className="text-blue-500 hover:text-blue-700">#{row.id}</Link>;
        },
        download_time: (row: Record<string, any>) => {
            return <div>{row.download_ymd + row.download_hms}</div>;
        },
    };

    const refreshDownload = async () => {
        const result2 = await downloadController.get_downloads(user?.username || "");
        if (result2.success && result2.data) {
            setDownloadItems(result2.data as []);
        }
    }

    const handleRefresh = async () => {
        try {
            showLoading("Đang tải lại. Vui lòng chờ");
            setDownloadable({});
            const result = await s3Controller.check_exist_to_download(list_download_items);
            if (result.success && result.data) {
                setDownloadable(result.data || {});
            }
            await refreshDownload();
        } finally {
            hideLoading();
        }
    }

    return (
        <React.Fragment>
            <div className="flex flex-col gap-4 h-full">
                {notempty_download ? (<div className={`rounded-lg shadow flex flex-col space-y-2`}>
                    {list_download_items
                        .filter((item) => candownload(item.aws_cd))
                        .map((item) => {
                            return (
                                <S3Download aws_storage={item} key={item.aws_cd} />
                            )
                        })}
                </div>) : (
                    <div className="bg-white rounded text-center text-gray-500 h-full flex flex-col items-center justify-center text-lg">
                        <img src={emptyList} />
                        <span className="text-sm text-red-500 animate-bounce py-4">
                            Không có tập tin nào để tải về...
                        </span>
                        <Button className="flex items-center space-x-2"
                            onClick={handleRefresh}>
                            <FcProcess className="w-4 h-4" />
                            <span>Làm mới trạng thái</span>
                        </Button>
                    </div>
                )}
                {trackingTranLog &&
                    <Fieldset title="Thông tin lịch sử đã tải về">
                        <DataTable
                            data={download_items}
                            columns={columns}
                            showFilter={false}
                            showCheckboxes={false}
                            scrollHeight={400}
                            customCellRender={customCellRender}
                        />
                    </Fieldset>
                }
            </div>
        </React.Fragment>
    );
}

export default S3DownloadPage;