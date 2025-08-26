import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './Sidebar';
import { APP_CONFIG } from '../../config/config';
import { useAuth } from '../../stores/AuthContext';
import { ArrowRightStartOnRectangleIcon, ChevronDownIcon, Cog6ToothIcon, UserIcon } from '@heroicons/react/24/outline';
import { useAppGobal } from '../../stores/AppContext';
import { GrUserWorker } from 'react-icons/gr';
import { RxDividerVertical } from 'react-icons/rx';
import { BiPurchaseTagAlt } from 'react-icons/bi';
import { FcAlarmClock, FcElectronics, FcEnteringHeavenAlive, FcInfo } from 'react-icons/fc';
import { FaComputer } from 'react-icons/fa6';

interface MainLayoutProps {
    children: React.ReactNode;
}

interface SystemInfo {
    currentTime: string;
    ipAddress: string;
    userAgent: string;
    platform: string;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    const { user, logout } = useAuth();
    const {pageTitle} = useAppGobal();

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const [systemInfo, setSystemInfo] = useState<SystemInfo>({
        currentTime: '',
        ipAddress: 'Loading...',
        userAgent: navigator.userAgent,
        platform: navigator.platform
    });

    // Update time every second
    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            setSystemInfo(prev => ({
                ...prev,
                currentTime: now.toLocaleTimeString('en-US', {
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                })
            }));
        };

        updateTime(); // Initial call
        const interval = setInterval(updateTime, 1000);

        return () => clearInterval(interval);
    }, []);

    // Fetch IP address
    useEffect(() => {
        const fetchIPAddress = async () => {
            try {
                const response = await fetch('https://api.ipify.org?format=json');
                const data = await response.json();
                setSystemInfo(prev => ({
                    ...prev,
                    ipAddress: data.ip
                }));
            } catch (error) {
                console.error('Failed to fetch IP address:', error);
                setSystemInfo(prev => ({
                    ...prev,
                    ipAddress: 'Unknown'
                }));
            }
        };

        fetchIPAddress();
    }, []);

    const formatUserAgent = (userAgent: string) => {
        // Extract browser and OS information
        const browserMatch = userAgent.match(/(chrome|safari|firefox|edge|opera)\/?\s*(\d+)/i);
        const osMatch = userAgent.match(/\((.*?)\)/);

        const browser = browserMatch ? `${browserMatch[1]} ${browserMatch[2]}` : 'Unknown Browser';
        const os = osMatch ? osMatch[1].split(';')[0] : 'Unknown OS';

        return `${browser} | ${os}`;
    };

    const handleUserMenuClick = () => {
        setUserDropdownOpen(!userDropdownOpen);
    };

    return (
        <div className="flex h-screen bg-secondary-100">
            {/* Sidebar */}
            <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

            {/* Main Content */}
            <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
                {/* Header - Fixed */}
                <header className="bg-white shadow-sm border-b border-secondary-200 px-4 py-1.5 flex-shrink-0">
                    <div className="flex items-center justify-end">
                        <div className="flex items-center flex-1 gap-2">
                            <BiPurchaseTagAlt className='w-7 h-7' />
                            <h1 className='text-3xl font-bold'>{pageTitle}</h1>
                            <RxDividerVertical className='w-7 h-7' />
                        </div>
                        <div className="flex items-center space-x-6 justify-end">
                            {/* User Dropdown Menu */}
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={handleUserMenuClick}
                                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-secondary-100 
                                    transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
                                >
                                    <div className="flex items-center space-x-2">
                                        <div className="w-8 h-8 bg-primary-200 rounded-full flex items-center justify-center">
                                            <span className="text-sm font-medium">
                                                <GrUserWorker className="w-5 h-5 rounded-full" />
                                            </span>
                                        </div>
                                        <div className="hidden md:block text-left">
                                            <p className="text-sm font-medium text-secondary-800">{user?.username}</p>
                                        </div>
                                    </div>
                                    {/* Dropdown Arrow */}
                                    <ChevronDownIcon className={`w-4 h-4 text-secondary-400 transition-transform duration-200 ${userDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {/* Dropdown Menu */}
                                {userDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-secondary-200 py-1 z-50">
                                        {/* Profile */}
                                        <button
                                            className="w-full flex items-center px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 
                                            transition-colors"
                                        >
                                            <UserIcon className="w-4 h-4 mr-3 text-secondary-400" />
                                            Your Profile
                                        </button>
                                        {/* Settings */}
                                        <button
                                            className="w-full flex items-center px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 
                                            transition-colors"
                                        >
                                            <Cog6ToothIcon className="w-4 h-4 mr-3 text-secondary-400" />
                                            Settings
                                        </button>
                                        {/* Divider */}
                                        <div className="border-t border-secondary-200 my-1"></div>
                                        {/* Sign Out */}
                                        <button
                                            onClick={() => logout()}
                                            className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 
                                            transition-colors"
                                        >
                                            <ArrowRightStartOnRectangleIcon className="w-4 h-4 mr-3 text-red-600" />
                                            Sign Out
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </header>
                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-auto bg-secondary-50 dark:bg-gray-800">
                    <div className="p-3 h-full">
                        {children}
                    </div>
                </div>

                {/* System Information Footer - Fixed */}
                <footer className="border-t border-secondary-200 bg-white px-6 py-3 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        {/* System Information */}
                        <div className="flex items-center space-x-6 text-sm text-secondary-600">
                            {/* Timer */}
                            <div className="flex items-center space-x-2">
                                <FcAlarmClock className="w-4 h-4 text-primary-600" />
                                <span className="font-mono font-medium">{systemInfo.currentTime}</span>
                            </div>

                            {/* IP Address */}
                            <div className="flex items-center space-x-2">
                                <FcEnteringHeavenAlive className="w-4 h-4 text-green-600" />
                                <span className="font-mono text-xs">{systemInfo.ipAddress}</span>
                            </div>

                            {/* Platform Info */}
                            <div className="flex items-center space-x-2">
                                <FaComputer className="w-4 h-4 text-blue-600 "/>
                                <span className="text-xs">{formatUserAgent(systemInfo.userAgent)}</span>
                            </div>
                        </div>

                        {/* App Version */}
                        <div className="flex flex-row items-center text-sm text-secondary-600 gap-2">
                            <button className='flex flex-row items-center gap-2'>
                                <FcElectronics className="w-4 h-4 text-orange-500" />
                                <span>Kiểm tra bản cập nhật</span>
                            </button>
                            <div className="flex flex-row items-center gap-2">
                                <FcInfo className="w-4 h-4 text-green-600"/>
                                <span>{APP_CONFIG.version}</span>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default MainLayout; 