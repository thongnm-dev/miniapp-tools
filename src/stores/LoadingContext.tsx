import React, { createContext, useContext, useState, ReactNode } from "react";
import LoadingDialog from "../components/ui/LoadingDialog";
import loading from "../assets/loading.gif";

interface LoadingContextType {
  showLoading: (message?: string) => void;
  hideLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const useLoading = () => {
  const ctx = useContext(LoadingContext);
  if (!ctx) throw new Error("useLoading must be used within LoadingProvider");
  return ctx;
};

export const LoadingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | undefined>();

  const showLoading = (msg?: string) => {
    setMessage(msg);
    setOpen(true);
  };
  const hideLoading = () => setOpen(false);

  return (
    <LoadingContext.Provider value={{ showLoading, hideLoading }}>
      {children}
      <LoadingDialog open={open} message={message || "Vui lòng chờ trong giây lát..."} imgFlash={loading}/>
    </LoadingContext.Provider>
  );
}; 