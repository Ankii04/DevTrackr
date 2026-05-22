import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';

const Topbar = ({ title }) => {
  const { 
    repos, 
    selectedRepo, 
    selectRepo, 
    syncActiveRepo, 
    syncing 
  } = useDashboard();
  
  const { logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isSelectedRepoSyncing = selectedRepo?.syncStatus === 'syncing';

  const handleSyncClick = async () => {
    if (!selectedRepo || isSelectedRepoSyncing) return;
    try {
      await syncActiveRepo();
    } catch (err) {
      alert(`Sync failed: ${err}`);
    }
  };

  return (
    <header className="h-16 bg-surface-container border-b border-white/5 flex items-center justify-between px-margin_mobile md:px-margin_desktop font-outfit select-none shrink-0 z-20">
      {/* Mobile Menu Trigger & Page Title */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-surface-variant/40 transition-colors"
        >
          <span className="material-symbols-outlined text-[24px]">menu</span>
        </button>
        <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold tracking-tight hidden sm:block">
          {title}
        </h2>
      </div>

      {/* Center Actions: Repo Selector & Sync Button */}
      <div className="flex items-center gap-3">
        {repos.length > 0 ? (
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-on-surface-variant text-[18px] hidden md:inline">folder_git</span>
            <select
              value={selectedRepo?._id || ''}
              onChange={(e) => {
                const found = repos.find(r => r._id === e.target.value);
                if (found) selectRepo(found);
              }}
              className="bg-surface-container-highest border border-white/10 hover:border-white/20 text-on-surface font-body-md text-body-md rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-primary focus:border-none focus:outline-none transition-all cursor-pointer font-mono"
            >
              {repos.map((repo) => (
                <option key={repo._id} value={repo._id}>
                  {repo.fullName}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <span className="font-mono text-[12px] text-on-surface-variant hidden md:inline">
            No repos synced
          </span>
        )}

        {selectedRepo && (
          <Button
            variant="outline"
            onClick={handleSyncClick}
            disabled={isSelectedRepoSyncing}
            className={`!py-1.5 !px-3 font-outfit flex items-center gap-1.5 ${
              isSelectedRepoSyncing ? 'bg-primary-container/10 border-primary/20 text-primary' : ''
            }`}
          >
            <span className={`material-symbols-outlined text-[18px] ${isSelectedRepoSyncing ? 'animate-spin text-primary' : ''}`}>
              sync
            </span>
            <span className="text-[12px] font-semibold hidden sm:inline">
              {isSelectedRepoSyncing ? 'Syncing...' : 'Sync'}
            </span>
          </Button>
        )}
      </div>

      {/* User Logout for Mobile Header */}
      <div className="md:hidden">
        <button 
          onClick={logout}
          className="text-on-surface-variant hover:text-error p-1.5 rounded-lg hover:bg-surface-variant/40 transition-all"
          title="Log Out"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
        </button>
      </div>

      {/* Mobile Drawer Backdrop & Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div 
            className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity" 
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex flex-col w-[240px] bg-surface-container-lowest border-r border-white/10 shadow-2xl p-6 h-full animate-in slide-in-from-left duration-200">
            <div className="flex justify-between items-center mb-6">
              <span className="font-headline-sm text-on-surface font-extrabold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[24px]">rocket_launch</span>
                DevTrackr
              </span>
              <button onClick={() => setMobileMenuOpen(false)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <nav className="flex-1 space-y-1">
              {[
                { name: 'Dashboard', to: '/dashboard', icon: 'dashboard' },
                { name: 'Repositories', to: '/repositories', icon: 'folder_open' },
                { name: 'Contributors', to: '/contributors', icon: 'groups' },
                { name: 'Sprint Analysis', to: '/sprint', icon: 'analytics' },
                { name: 'AI Insights', to: '/insights', icon: 'psychology' },
                { name: 'Settings', to: '/settings', icon: 'settings' }
              ].map((item) => (
                <a
                  key={item.name}
                  href={item.to}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/30 font-outfit text-body-md font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  <span>{item.name}</span>
                </a>
              ))}
            </nav>

            <button
              onClick={logout}
              className="w-full bg-surface-container-highest hover:bg-surface-container-highest text-on-surface border border-white/5 py-2.5 rounded-lg font-outfit text-body-md font-semibold flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              <span>Log Out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Topbar;
