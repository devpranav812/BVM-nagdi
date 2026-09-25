import React, { useState } from 'react';
import { Menu, Phone, RefreshCw } from 'lucide-react';
import { User, SchoolInfo } from '../../types';
import { StorageService } from '../../services/storageService';

interface HeaderProps {
  onOpenSidebar: () => void;
  currentUser: User;
  schoolInfo: SchoolInfo;
  activeTabTitle: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSidebar,
  currentUser,
  schoolInfo,
  activeTabTitle
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const currentDate = new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(new Date());

  const handleRefresh = () => {
    setIsRefreshing(true);
    StorageService.refreshData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-xs md:px-8 no-print">
      {/* Left: Mobile hamburger & Page Title */}
      <div className="flex items-center gap-3">
        <button
          id="header-sidebar-toggle"
          type="button"
          onClick={onOpenSidebar}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 md:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900 md:text-xl">{activeTabTitle}</h1>
          <p className="text-xs text-slate-500 hidden sm:block">
            {schoolInfo.name} &bull; {currentDate}
          </p>
        </div>
      </div>

      {/* Right: Quick actions & School Phone */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* School Phone Call link */}
        <a
          id="header-phone-contact"
          href={`tel:${schoolInfo.contactNumber}`}
          className="hidden lg:flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          title="Direct School Office Line"
        >
          <Phone className="h-3.5 w-3.5 text-indigo-600" />
          <span>{schoolInfo.contactNumber}</span>
        </a>

        {/* Refresh Data Button */}
        <button
          id="btn-refresh-data"
          type="button"
          onClick={handleRefresh}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
          title="Refresh real-time data"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="hidden md:inline">{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
        </button>

        {/* User Pill */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
            {currentUser.name.charAt(0)}
          </div>
          <div className="hidden sm:block text-left">
            <span className="block text-xs font-semibold text-slate-800 leading-tight">
              {currentUser.name}
            </span>
            <span className="block text-[10px] font-medium uppercase tracking-wider text-slate-500">
              {currentUser.role}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
