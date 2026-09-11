import React, { useState } from 'react';
import { Navbar } from './Navbar';
import { Sidebar, ActiveTab } from './Sidebar';

interface AppLayoutProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenNewSession: () => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  activeTab,
  onSelectTab,
  onOpenNewSession,
  children,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans">
      <Navbar
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onOpenNewSession={onOpenNewSession}
      />

      <div className="flex-1 flex">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={onSelectTab}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <main className="flex-1 lg:pl-64 min-w-0 flex flex-col p-2 sm:p-4 lg:p-6">
          <div className="max-w-7xl w-full mx-auto flex-1 flex flex-col">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
