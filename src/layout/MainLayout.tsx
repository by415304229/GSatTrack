import React, { type ReactNode } from 'react';

interface MainLayoutProps {
    children: ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen bg-[#020617] text-slate-100">
            {children}
        </div>
    );
};