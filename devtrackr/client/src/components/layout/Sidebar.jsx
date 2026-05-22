import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

const Sidebar = () => {
  const { user, logout } = useAuth();

  const navigation = [
    { name: 'Dashboard', to: '/dashboard', icon: 'dashboard' },
    { name: 'Repositories', to: '/repositories', icon: 'folder_open' },
    { name: 'Contributors', to: '/contributors', icon: 'groups' },
    { name: 'Sprint Analysis', to: '/sprint', icon: 'analytics' },
    { name: 'AI Insights', to: '/insights', icon: 'psychology' },
    { name: 'Settings', to: '/settings', icon: 'settings' }
  ];

  return (
    <aside className="hidden md:flex flex-col w-[240px] bg-surface-container-lowest border-r border-white/5 shrink-0 text-on-surface select-none font-outfit">
      {/* Brand space */}
      <div className="h-16 flex items-center px-6 border-b border-white/5 select-none">
        <Link to="/dashboard" className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[26px] glow-primary">rocket_launch</span>
          <span className="font-headline-sm text-headline-sm text-on-surface font-extrabold tracking-wide">DevTrackr</span>
        </Link>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto no-scrollbar">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg font-outfit text-body-md font-medium transition-all group ${
                isActive
                  ? 'bg-primary-container text-on-primary-container font-semibold shadow-md shadow-primary/5'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/30'
              }`
            }
          >
            <span className="material-symbols-outlined text-[20px] shrink-0">{item.icon}</span>
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* User profile space */}
      {user && (
        <div className="p-4 border-t border-white/5 space-y-3 bg-surface-container-low/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary-container/20 text-primary flex items-center justify-center font-bold border border-primary/10">
              {user.username.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-outfit text-[13px] font-semibold text-on-surface truncate">{user.username}</p>
              <p className="font-mono text-[10px] text-on-surface-variant truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full bg-surface-container-highest/60 hover:bg-surface-container-highest text-on-surface hover:text-error border border-white/5 py-2 rounded-lg font-outfit text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">logout</span>
            <span>Log Out</span>
          </button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
