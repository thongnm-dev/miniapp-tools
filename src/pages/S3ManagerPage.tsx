import React, { useState, useEffect } from 'react';
import { s3Controller } from '../controller/s3-controller';
import Button from '../components/ui/Button';
import { useLoading } from '../stores/LoadingContext';
import { FETCH_STATES_LIST } from '../config/constants';
import { ArrowPathIcon} from '@heroicons/react/24/outline';
import TabView, { Tab } from '../components/ui/TabView';

const S3ManagerPage: React.FC = () => {
  const [s3FetchState, setS3FetchState] = useState<{[key: string]: {bugs: {bug_no: string; message: string}[]}}>({});
  const { showLoading, hideLoading } = useLoading();
  const [tabs, setTabs] = useState<Tab[]>([]);

  // Poll S3 fetch state every 30 minutes
  useEffect(() => {
    let isMounted = true;
    const fetchState = async () => {
      try {
        showLoading();
        const result = await s3Controller.handleGetAllState();
        if (result.success && result.data && isMounted) {
          setS3FetchState(result.data);
        }
      } catch (error) {
        // Optionally handle error
      } finally {
        hideLoading();
      }
    };
    fetchState(); // Fetch immediately on mount
    const interval = setInterval(fetchState, 5 * 60 * 1000); // 5 minutes
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const _tabs = FETCH_STATES_LIST
      .filter(status => s3FetchState && s3FetchState[status.code]?.bugs.length > 0)
      .map((status) => {
        return {
          label: (<div>{status.path} <span className="text-red-600">({s3FetchState[status.code]?.bugs.length})</span></div>),
          content: (<div>
                <div className="px-4 py-2 space-y-2 text-left text-sm max-h-[calc(100vh-250px)] overflow-y-auto">
                  {s3FetchState && s3FetchState[status.code]?.bugs.length > 0 ? (
                    s3FetchState[status.code].bugs.map((bug, idx) => (
                      <div key={idx} className={`flex flex-row justify-items-center gap-6 p-1.5 ${idx % 2 === 0 ? 'bg-white' : 'bg-primary-50'}`}>
                        <span className='w-48 p-1.5'>{bug.bug_no}</span>
                        {bug.message && <span className='text-red-500 animate-pulse bg-red-100 border border-red-100 rounded-xl p-1.5'>{bug.message}</span>}
                      </div>
                    ))
                  ) : (
                    <div>Không tồn có bugs</div>
                  )}
                </div>
          </div>)
        }
      });
    setTabs(_tabs as Tab[]);
  }, [s3FetchState]);

  const handleRefreshFetchState = async () => {
    showLoading();
    await s3Controller.handleGetAllState();
    hideLoading();
  };

  return (
      <div className="space-y-4">
          {/* Status Groups Fieldset */}
          <fieldset className="border border-gray-300 rounded-lg p-2 bg-white shadow-lg min-h-[calc(100vh-195px)]">
            <legend className="rounded-lg">
                <Button
                    onClick={handleRefreshFetchState}
                    className="flex items-center gap-2">
                    <ArrowPathIcon className="w-4 h-4 stroke-2" />
                    Tải lại
                  </Button>
            </legend>
            <div className="grid grid-cols-1">
              {tabs.length > 0 && <TabView tabs={tabs} className='h-[calc(100vh-195px)]'/>}
            </div>
          </fieldset>
      </div>
  );
};

export default S3ManagerPage; 