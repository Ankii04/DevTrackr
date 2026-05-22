import React from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useDashboard } from '../../context/DashboardContext';

const Layout = ({ title, children }) => {
  const { error, setError } = useDashboard();

  return (
    <div className="flex h-screen overflow-hidden bg-background text-on-background">
      {/* Sidebar - Desktop navigation drawer */}
      <Sidebar />

      {/* Main viewport */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative">
        
        {/* Topbar - Header Actions */}
        <Topbar title={title} />

        {/* Global Floating Error Indicator Toast */}
        {error && (
          <div className="absolute top-20 right-6 z-40 bg-error-container border border-error text-on-error-container px-4 py-3 rounded-lg shadow-2xl flex items-center justify-between gap-3 animate-in slide-in-from-top-6 duration-200">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-error">error</span>
              <span className="font-outfit text-body-md font-semibold">{error}</span>
            </div>
            <button 
              onClick={() => setError(null)}
              className="text-on-error-container/60 hover:text-on-error-container p-0.5 rounded transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        )}

        {/* Page content panel */}
        <main className="flex-1 overflow-y-auto p-margin_mobile md:p-margin_desktop bg-surface-container-low/20 no-scrollbar">
          <div className="max-w-7xl mx-auto space-y-gutter animate-in fade-in duration-300">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
