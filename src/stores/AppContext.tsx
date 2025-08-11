import React, { createContext, useContext, useState, ReactNode } from "react";

interface AppContextProps {
    setPageTitle: (title: string) => void;
    pageTitle: string;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const useAppGobal = () => {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error("useAppGobal must be used within LoadingProvider");
    return ctx;
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [title, setTitle] = useState<string>();

    const setPageTitle = (screenName: string) => {
        setTitle(screenName);
    };

    return (
        <AppContext.Provider value={{ setPageTitle, pageTitle: title || "" }}>
            {children}
        </AppContext.Provider>
    );
}