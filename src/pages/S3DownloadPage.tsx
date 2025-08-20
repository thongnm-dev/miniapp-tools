import React, { useEffect, useMemo, useRef, useState } from "react";
import emptyList from "../assets/empty.gif";
import DataTable from "../components/ui/DataTable";
import { Link } from "react-router-dom";
import { downloadController } from "../controller/download-controller";
import S3Download from "../components/S3Download";
import Fieldset from "../components/ui/Fieldset";
import { useAuth } from "../stores/AuthContext";
import { download_item } from "../types/download_item";
import { aws_storage } from "../types/aws_storage";
import { appController } from "../controller/app_controller";

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
    const download_ref = useRef<HTMLDivElement>(null);
    const { user } = useAuth();
    const [not_child, setNot_child] = useState<boolean>(false);
    const [download_items, setDownloadItems] = useState<download_item[]>([]);
    const [list_download_items, setList_download_items] = useState<aws_storage[]>([]);

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
        const init = async () => {
            const result2 = await downloadController.get_downloads(user?.username || "");
            if (result2.success && result2.data) {
                setDownloadItems(result2.data as []);
            }
        }

        init();
        let isMounted = true;
        // immediately fetch every 15 minutes
        const interval = setInterval(init, 5 * 60 * 1000); // 5 minutes
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

    useEffect(() => {
        setNot_child(false);
        let isMounted = true;
        const running = () => {
            if (!download_ref.current || download_ref.current?.children.length == 0) {
                setNot_child(true);
            }
        }
        const interval = setInterval(running, 1000);
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

    const trackingTranLog = useMemo(() => {
        return download_items.length > 0;
    }, [download_items])

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

    return (
        <React.Fragment>
            <div className="flex flex-col gap-4 h-full">
                <div className={`rounded-lg shadow flex flex-col space-y-2`}>
                    {list_download_items.map((item, index) => {
                        return (
                            <div ref={download_ref} key={index}>
                                <S3Download aws_storage={item} />
                            </div>
                        )
                    })}
                    {not_child && <div className="bg-white rounded text-center text-gray-500 h-full flex flex-col items-center justify-center text-lg">
                        <img src={emptyList} />
                        <span className="text-sm text-red-500 animate-bounce py-4">
                            Không có tập tin nào để tải về...
                        </span>
                    </div>}
                    
                </div>
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