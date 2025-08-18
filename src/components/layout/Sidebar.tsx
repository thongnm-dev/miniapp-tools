import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMenuItems } from '../hooks/useMenuItems';
import { useAuth } from '../../stores/AuthContext';
import { ArrowRightStartOnRectangleIcon } from '@heroicons/react/24/outline';
import { useAppGobal } from '../../stores/AppContext';
import { SiAwsfargate } from 'react-icons/si';
import { FcExport } from 'react-icons/fc';
import { HiChevronDoubleLeft, HiChevronDoubleRight } from 'react-icons/hi';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();  
  const {setPageTitle} = useAppGobal();
  const {getMenuHierarchy, getIconComponent } = useMenuItems();

  const handleMenuClick = (row: any) => {
    navigate(row.path);
    setPageTitle(row.label);
  };

  return (
    <div className={`fixed left-0 top-0 h-full bg-white shadow-lg transition-all duration-300 z-30 ${
      isOpen ? 'w-64' : 'w-16'
    }`}>
      {/* Logo/Brand */}
      <div className="flex items-center justify-center h-16 border-b border-secondary-200">
        {isOpen ? (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <SiAwsfargate className="text-white font-bold text-sm" />
            </div>
            <span className="text-lg font-semibold text-secondary-800">Working space</span>
          </div>
        ) : (
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <SiAwsfargate className="text-white font-bold text-sm" />
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="mt-6">
        <ul className="space-y-2 px-3">
          {getMenuHierarchy().map((item) => {
            return (
              <React.Fragment key={item.id}>
                <li>
                  <button
                    onClick={() => handleMenuClick(item)}
                    className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                      location.pathname === item.path
                        ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-600'
                        : 'text-secondary-600 hover:bg-secondary-100 hover:text-secondary-800'
                    }`}
                  >
                    <span className="flex-shrink-0">{getIconComponent(item.icon)}</span>
                    {isOpen && (
                      <span className="text-sm font-medium">{item.label}</span>
                    )}
                  </button>
                </li>
              </React.Fragment>
            );
          })}
        </ul>
      </nav>

      {/* Collapse/Expand Button */}
      <div className="absolute bottom-4 left-0 right-0 px-3">
        <div className="flex flex-col space-y-2">
            <button 
              className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg border border-red-300 hover:bg-red-100 transition-colors"
              onClick={() => logout()}
              >
              <FcExport className="w-4 h-4" />
            </button>
        
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg bg-secondary-100 text-secondary-600 hover:bg-secondary-200 transition-colors"
              >
                {!isOpen ? <HiChevronDoubleRight className="w-4 h-4" /> : <HiChevronDoubleLeft />}
            </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 