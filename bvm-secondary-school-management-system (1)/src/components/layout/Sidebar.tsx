import React from 'react';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Briefcase,
  CalendarCheck,
  UserCheck,
  CreditCard,
  Banknote,
  BarChart3,
  Settings,
  LogOut,
  X,
  School,
  Phone
} from 'lucide-react';
import { User, UserRole } from '../../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onLogout,
  isOpen,
  onClose
}) => {
  const role = currentUser.role;

  // Filter navigation items by role
  // Director: Can view each student and staff attendance, view and add/remove teachers, view classes, reports & notices
  // Computer Person (operator): Operational administration (classes, teachers, students, fees, payroll, muster, settings)
  // Teacher: Assigned class attendance, my class students, notices
  const navItems = [
    {
      id: 'dashboard',
      label: role === 'director' ? 'Overview' : role === 'teacher' ? 'Class Overview' : 'Dashboard',
      icon: LayoutDashboard,
      roles: ['director', 'operator', 'admin', 'teacher', 'accountant']
    },
    {
      id: 'student-attendance',
      label: role === 'teacher' ? 'Mark Class Attendance' : 'Student Attendance',
      icon: CalendarCheck,
      roles: ['director', 'teacher', 'operator', 'admin']
    },
    {
      id: 'staff-attendance',
      label: 'Staff Attendance',
      icon: UserCheck,
      roles: ['director', 'operator', 'admin']
    },
    {
      id: 'staff',
      label: 'Teachers & Staff',
      icon: Briefcase,
      roles: ['director', 'operator', 'admin']
    },
    {
      id: 'classes',
      label: 'Classes & Sections',
      icon: Users,
      roles: ['director', 'operator', 'admin']
    },
    {
      id: 'students',
      label: role === 'teacher' ? 'My Class Students' : 'Student Directory',
      icon: GraduationCap,
      roles: ['director', 'operator', 'admin', 'teacher', 'accountant']
    },
    {
      id: 'fees',
      label: 'Fee Records & Collection',
      icon: CreditCard,
      roles: ['director', 'operator', 'admin', 'accountant']
    },
    {
      id: 'payroll',
      label: 'Staff Payroll',
      icon: Banknote,
      roles: ['director']
    },
    {
      id: 'reports',
      label: 'Reports & Audits',
      icon: BarChart3,
      roles: ['director', 'operator', 'admin', 'accountant']
    },
    {
      id: 'settings',
      label: 'School Settings',
      icon: Settings,
      roles: ['operator', 'admin']
    }
  ].filter(item => item.roles.includes(role));

  const roleDisplayName = {
    director: 'Director',
    operator: 'Computer Operator',
    admin: 'Computer Operator',
    teacher: 'Class Teacher',
    accountant: 'Accountant'
  }[role] || role;

  const roleBadgeColor = {
    director: 'bg-slate-900 text-white border-slate-900',
    operator: 'bg-slate-800 text-white border-slate-800',
    admin: 'bg-slate-800 text-white border-slate-800',
    teacher: 'bg-slate-800 text-white border-slate-800',
    accountant: 'bg-slate-800 text-white border-slate-800'
  }[role] || 'bg-slate-800 text-white border-slate-800';

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          id="sidebar-backdrop"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="app-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* School Branding Header */}
        <div className="flex flex-col border-b border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white shadow-xs">
                <School className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-tight text-slate-900 leading-tight">
                  BVM Secondary School
                </span>
                <span className="text-xs font-medium text-slate-500">Nagdi, Arnod, Rajasthan</span>
              </div>
            </div>
            <button
              id="sidebar-close-btn"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 md:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-1.5 text-xs text-slate-600 border border-slate-200/60">
            <span className="flex items-center gap-1 font-mono">
              <Phone className="h-3 w-3 text-slate-400" /> 9929882820
            </span>
            <span className="text-[11px] font-semibold text-slate-500">AY 2026-27</span>
          </div>
        </div>

        {/* Current Authenticated User */}
        <div className="border-b border-slate-200 bg-slate-50/50 p-4">
          <div className="flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <p className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</p>
              <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
            </div>
            <span className={`shrink-0 inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold uppercase tracking-wider ${roleBadgeColor}`}>
              {roleDisplayName}
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Menu
          </div>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-link-${item.id}`}
                onClick={() => {
                  setActiveTab(item.id);
                  onClose();
                }}
                className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 transition-colors ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout Footer */}
        <div className="border-t border-slate-200 p-3">
          <button
            id="sidebar-logout-btn"
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
