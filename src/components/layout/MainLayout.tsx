import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './Sidebar';
import { APP_CONFIG } from '../../config/config';
import { useAuth } from '../../stores/AuthContext';
import { ArrowRightStartOnRectangleIcon, ChevronDownIcon, Cog6ToothIcon, HashtagIcon, UserIcon } from '@heroicons/react/24/outline';
import { useAppGobal } from '../../stores/AppContext';

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

    const handleMenuItemClick = (action: string) => {

    }

    const handleUserMenuClick = () => {
        setUserDropdownOpen(!userDropdownOpen);
    };

    return (
        <div className="flex h-screen bg-secondary-100 dark:bg-gray-900">
            {/* Sidebar */}
            <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

            {/* Main Content */}
            <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
                {/* Header - Fixed */}
                <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-secondary-200 dark:border-gray-800 px-4 py-1.5 flex-shrink-0">
                    <div className="flex items-center justify-end">
                        <div className="flex items-center flex-1">
                            <HashtagIcon className='w-7 h-7' />
                            <h1 className='text-3xl font-bold'>{pageTitle}</h1>
                        </div>
                        <div className="flex items-center space-x-6 justify-end">
                            {/* User Dropdown Menu */}
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={handleUserMenuClick}
                                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
                                >
                                    <div className="flex items-center space-x-2">
                                        {user?.avatar ? (
                                            <img src={user.avatar} alt={user.username} className="w-8 h-8 rounded-full" />
                                        ) : (
                                            <div className="w-8 h-8 bg-primary-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                                <span className="text-sm font-medium text-primary-700 dark:text-primary-200">
                                                    {user?.username?.charAt(0) || 'U'}
                                                </span>
                                            </div>
                                        )}
                                        <div className="hidden md:block text-left">
                                            <p className="text-sm font-medium text-secondary-800 dark:text-secondary-100">{user?.username}</p>
                                            <p className="text-xs text-secondary-500 dark:text-secondary-300">{user?.username}</p>
                                        </div>
                                    </div>
                                    {/* Dropdown Arrow */}
                                    <ChevronDownIcon className={`w-4 h-4 text-secondary-400 dark:text-secondary-200 transition-transform duration-200 ${userDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {/* Dropdown Menu */}
                                {userDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-secondary-200 dark:border-gray-700 py-1 z-50">
                                        {/* Profile */}
                                        <button
                                            onClick={() => handleMenuItemClick('profile')}
                                            className="w-full flex items-center px-4 py-2 text-sm text-secondary-700 dark:text-secondary-100 hover:bg-secondary-50 dark:hover:bg-gray-800 transition-colors"
                                        >
                                            <UserIcon className="w-4 h-4 mr-3 text-secondary-400 dark:text-secondary-200" />
                                            Your Profile
                                        </button>
                                        {/* Settings */}
                                        <button
                                            onClick={() => handleMenuItemClick('settings')}
                                            className="w-full flex items-center px-4 py-2 text-sm text-secondary-700 dark:text-secondary-100 hover:bg-secondary-50 dark:hover:bg-gray-800 transition-colors"
                                        >
                                            <Cog6ToothIcon className="w-4 h-4 mr-3 text-secondary-400 dark:text-secondary-200" />
                                            Settings
                                        </button>
                                        {/* Divider */}
                                        <div className="border-t border-secondary-200 dark:border-gray-700 my-1"></div>
                                        {/* Sign Out */}
                                        <button
                                            onClick={() => logout()}
                                            className="w-full flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-gray-800 transition-colors"
                                        >
                                            <ArrowRightStartOnRectangleIcon className="w-4 h-4 mr-3 text-red-600 dark:text-red-400" />
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
                <footer className="border-t border-secondary-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-3 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        {/* System Information */}
                        <div className="flex items-center space-x-6 text-sm text-secondary-600 dark:text-secondary-300">
                            {/* Timer */}
                            <div className="flex items-center space-x-2">
                                <svg className="w-4 h-4 text-primary-600 dark:text-primary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="font-mono font-medium">{systemInfo.currentTime}</span>
                            </div>

                            {/* IP Address */}
                            <div className="flex items-center space-x-2">
                                <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                                </svg>
                                <span className="font-mono text-xs">{systemInfo.ipAddress}</span>
                            </div>

                            {/* Platform Info */}
                            <div className="flex items-center space-x-2">
                                <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <span className="text-xs">{formatUserAgent(systemInfo.userAgent)}</span>
                            </div>
                        </div>

                        {/* App Version */}
                        <div className="flex items-center space-x-2 text-sm text-secondary-600 dark:text-secondary-300">
                            <svg className="w-4 h-4 text-secondary-400 dark:text-secondary-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>v{APP_CONFIG.version}</span>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default MainLayout; 