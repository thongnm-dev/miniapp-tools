import React, { useState, useEffect } from 'react';
import { MenuItem } from '../../types/menu';

import {
  HomeIcon,
  WrenchScrewdriverIcon,
  DocumentDuplicateIcon,
  QuestionMarkCircleIcon,
  FolderIcon,
  AdjustmentsHorizontalIcon,
  CloudIcon,
  CloudArrowUpIcon,
  CloudArrowDownIcon,
  BugAntIcon,
  ClipboardDocumentIcon,
  TvIcon,
} from '@heroicons/react/24/outline';

// Move iconMap outside the function so it's not redefined on every call
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  dashboard: HomeIcon,
  system: WrenchScrewdriverIcon,
  settings: AdjustmentsHorizontalIcon,
  folder: FolderIcon,
  cloud: CloudIcon,
  document: DocumentDuplicateIcon,
  s3upload: CloudArrowUpIcon,
  workdir: TvIcon,
  s3download: CloudArrowDownIcon,
  bugs: BugAntIcon,
  copy: ClipboardDocumentIcon
};

export const useMenuItems = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const loadMenuItems = async () => {
    const menuItems = JSON.parse(localStorage.getItem('menuItems') || '[]');
    setMenuItems(menuItems);
  };

  useEffect(() => {
    loadMenuItems();
  }, []);

  const refreshMenuItems = () => {
    loadMenuItems();
  };

  // Helper function to get icon component based on icon string
  const getIconComponent = (iconName: string): React.ReactElement | null => {
    const Icon = iconMap[iconName] || QuestionMarkCircleIcon;
    return React.createElement(Icon, { className: 'w-5 h-5' });
  };

  // Helper function to organize menu items into hierarchy
  const getMenuHierarchy = () => {
    const mainItems = menuItems.filter(item => !item.parentId && item.isActive).sort((a, b) => a.order - b.order);
    const subItems = menuItems.filter(item => item.parentId && item.isActive).sort((a, b) => a.order - b.order);
    
    return mainItems.map(item => ({
      ...item,
      subItems: subItems.filter(subItem => subItem.parentId === item.id)
    }));
  };

  return {
    refreshMenuItems,
    getIconComponent,
    getMenuHierarchy
  };
}; 