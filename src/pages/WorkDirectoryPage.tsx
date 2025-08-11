import React, { useState, useEffect } from 'react';
import { fsController } from '../controller/fs-controller';
import Button from '../components/ui/Button';
import { FolderIcon, EyeIcon, DocumentDuplicateIcon, ArrowPathIcon, FolderOpenIcon } from '@heroicons/react/24/outline';
import DataTable from '../components/ui/DataTable';
import { showNotification } from '../components/notification';
import { FileItem } from '../types/FileItem';
import { useLoading } from '../stores/LoadingContext';

const WorkDirectoryPage: React.FC = () => {
    const [workdir, setWorkdir] = useState<string>('');
    const [files, setFiles] = useState<FileItem[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<Set<FileItem>>(new Set());
    const { showLoading, hideLoading } = useLoading();

    // Load saved state on component mount
    useEffect(() => {
        const savedState = localStorage.getItem('workdir');
        if (savedState) {
            const state = JSON.parse(savedState);
            if (state.workdir) {
                setWorkdir(state.workdir)
            };
        }
    }, []);

    useEffect(() => {

        localStorage.removeItem('workdir');
        if (workdir) {
            const reload = async (path: string) => {
                const resultFile = await fsController.readDirectory(path);
                if (resultFile.success) {
                    setFiles(resultFile.files || []);
                }
            };

            reload(workdir);

            const stateToSave = {
                workdir
            };
            localStorage.setItem('workdir', JSON.stringify(stateToSave));
        }
    }, [workdir])

    const selectDirectory = async () => {
        try {
            const result = await fsController.selectDirectory();

            if (result.success && result.path) {
                setWorkdir(result.path);
            }
        } catch (err) {
            showNotification('Failed to select directory', 'error');
        } finally {
            hideLoading();
        }
    };

    // handle file click
    const handleFileClick = async (file: FileItem) => {
        try {
            const result = await fsController.openFile(file.fullPath);

            if (!result.success) {
                showNotification(result.message || 'Failed to open file', 'error');
            }
        } catch (err) {
            showNotification('Failed to open file', 'error');
        }
    };

    // show in explorer
    const showInExplorer = async (path: string) => {
        const result = await fsController.openFile(path);
        if (!result.success) {
            showNotification(result.message || 'Failed to open file', 'error');
        }
    };

    // handle file checkbox change
    const handleFileCheckboxChange = (fileName: string, checked: boolean) => {
        setSelectedFiles(prev => {
            const newSet = new Set(prev);
            const file = files.find(f => f.name === fileName);
            if (file) {
                if (checked) {
                    newSet.add(file);
                } else {
                    newSet.delete(file);
                }
            }
            return newSet;
        });
    };

    // handle copy files
    const handleCopyFiles = () => {
        if (selectedFiles.size === 0) {
            showNotification('Please select at least one file to copy', 'error');
            return;
        }
    };

    // handle refresh files
    const handleRefreshFiles = async () => {
        try {
            showLoading();
            const resultFile = await fsController.readDirectory(workdir);
            if (resultFile.success) {
                setFiles(resultFile.files || []);
            }
        } catch (err) {
            showNotification('Failed to open file', 'error');
        } finally {
            hideLoading();
        }

    };

    // handle show in explorer
    const handleShowInExplorer = async () => {
        await showInExplorer(workdir);
    };

    return (
        <div className="space-y-2">
            {/* Directory Selection */}
            <div className="bg-white rounded-lg shadow p-3 space-y-2">
                <div className="flex items-center justify-between gap-1">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 right-0 pl-3 flex items-center">
                            <button className='p-3' onClick={selectDirectory}>
                                <FolderIcon className='h-5 w-5' />
                            </button>
                        </div>
                        <span className="block w-full pl-5 pr-3 py-2 border bg-gray-50 rounded-lg focus:outline-none">
                            {workdir || 'No directory selected'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Files */}
            <div className="bg-white rounded-lg shadow">
                <div className="p-2 border-b border-gray-200 flex items-center justify-end gap-2">
                    <Button
                        disabled={!workdir}
                        onClick={handleRefreshFiles}
                        className="flex items-center space-x-2"
                    >
                        <ArrowPathIcon className="w-4 h-4" />
                        <span>Tải lại</span>
                    </Button>
                    <Button
                        disabled={!workdir}
                        onClick={handleShowInExplorer}
                        className="flex items-center space-x-2"
                    >
                        <FolderOpenIcon className="w-4 h-4" />
                        <span>Show in Explorer</span>
                    </Button>
                    <Button
                        onClick={handleCopyFiles}
                        disabled={selectedFiles.size === 0}
                        className="flex items-center space-x-2"
                    >
                        <DocumentDuplicateIcon className="w-4 h-4" />
                        <span>Sao chép ({selectedFiles.size})</span>
                    </Button>
                </div>
            </div>

            {files.length == 0 ? (
                <div className="bg-white rounded-lg shadow">
                    <div className="bg-white rounded-lg shadow">
                        <div className="p-4 text-center text-gray-500">
                            Không có tập tin nào ở đường dẫn đang chọn..
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow grid grid-cols-1">
                    <DataTable className='col-span-2 p-3'
                        columns={[
                            { key: 'action', label: '' },
                            { key: 'name', label: 'File name' },
                            { key: 'local', label: '' },
                        ]}
                        data={files
                            .map(file => ({
                                name: file.name,
                                action: file.fullPath,
                                local: file.path,
                            }))}
                        showPagination={false}
                        showFilter={true}
                        showCheckboxes={true}
                        selectedRows={new Set(Array.from(selectedFiles).map(f => f.name))}
                        onRowSelectionChange={handleFileCheckboxChange}
                        rowKey="name"
                        scrollHeight={450}
                        customCellRender={{
                            action: (row) => (
                                <Button
                                    onClick={(e: React.MouseEvent) => {
                                        e.stopPropagation();
                                        const file = files.find(f => f.name === row.name);
                                        if (file) handleFileClick(file);
                                    }}
                                >
                                    <EyeIcon className="w-5 h-5" />
                                </Button>
                            ),
                            local: (row) => (
                                <Button
                                    onClick={(e: React.MouseEvent) => {
                                        e.stopPropagation();
                                        showInExplorer(row.local);
                                    }}
                                >
                                    <FolderIcon className="w-5 h-5" />
                                </Button>
                            ),
                        }}
                    />
                </div>
            )}
            {/* Instructions */}
            {!workdir && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FolderIcon className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-medium text-blue-900 mb-2">Select a Directory</h3>
                    <p className="text-blue-700 mb-4">
                        Choose a directory to start browsing folders and files. Click on any folder to view its contents.
                    </p>
                    <Button onClick={selectDirectory}>Select Directory</Button>
                </div>
            )}
        </div>
    );
};

export default WorkDirectoryPage; 