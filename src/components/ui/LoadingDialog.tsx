import React from "react";

interface LoadingDialogProps {
  open: boolean;
  message?: string;
  imgFlash?: any
}

const LoadingDialog: React.FC<LoadingDialogProps> = ({ open, message, imgFlash }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="flex flex-col items-center p-8 bg-white rounded-2xl shadow-lg min-w-60 min-h-40">
        <img src={imgFlash} className="max-w-64 max-h-40"/>
        <span className="text-sm font-medium text-gray-700">{message || "Loading..."}</span>
      </div>
    </div>
  );
};

export default LoadingDialog; 