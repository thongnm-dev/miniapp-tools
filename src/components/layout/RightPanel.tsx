import React from 'react';

interface RightPanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const RightPanel: React.FC<RightPanelProps> = ({ open, onClose, title, children }) => {
  return (
    <div
      className={`fixed inset-0 z-50 flex justify-end transition-all duration-300 ${open ? '' : 'pointer-events-none'}`}
      style={{ visibility: open ? 'visible' : 'hidden' }}
    >
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-30 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      {/* Panel */}
      <aside
        className={`relative w-full max-w-md h-full bg-white shadow-xl transform transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-secondary-200">
          <h2 className="text-lg font-semibold text-secondary-800">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-secondary-100 text-secondary-500 hover:text-secondary-700 focus:outline-none"
            aria-label="Close panel"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="h-[calc(100vh-64px)] overflow-y-auto p-6">{children}</div>
      </aside>
    </div>
  );
};

export default RightPanel; 