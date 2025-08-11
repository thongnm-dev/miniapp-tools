import React, { useState, ReactNode } from "react";

export interface Tab {
  label: string | ReactNode;
  content: ReactNode;
}

interface TabViewProps {
  tabs: Tab[];
  initialIndex?: number;
  className?: string | ''
}

const TabView: React.FC<TabViewProps> = ({ tabs, initialIndex = 0, className}) => {
  const [active, setActive] = useState(initialIndex);
  return (
    <div className={className}>
      <div className="flex border-b mb-4">
        {tabs.map((tab, idx) => (
          <button
            key={idx}
            className={`px-4 py-2 -mb-px border-b-2 font-medium focus:outline-none transition-colors ${
              active === idx
                ? 'border-blue-600 text-white bg-primary-500'
                : 'border-transparent text-gray-500 bg-gray-200'
            }`}
            onClick={() => setActive(idx)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div>{tabs[active].content}</div>
    </div>
  );
};

export default TabView; 