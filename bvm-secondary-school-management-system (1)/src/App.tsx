import React, { useState, useEffect } from 'react';
import { User, UserRole, PaymentReceipt } from './types';
import { StorageService } from './services/storageService';
import { SupabaseService } from './services/supabaseService';
import { DEMO_USERS } from './data/mockData';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { LoginPage } from './components/auth/LoginPage';
import { Dashboard } from './components/dashboard/Dashboard';
import { StudentManagement } from './components/students/StudentManagement';
import { ClassManagement } from './components/classes/ClassManagement';
import { StaffManagement } from './components/staff/StaffManagement';
import { StudentAttendance } from './components/attendance/StudentAttendance';
import { StaffAttendance } from './components/attendance/StaffAttendance';
import { FeeManagement } from './components/fees/FeeManagement';
import { PayrollManagement } from './components/payroll/PayrollManagement';
import { ReportsManagement } from './components/reports/ReportsManagement';
import { SchoolSettings } from './components/settings/SchoolSettings';
import { FeeReceiptModal } from './components/fees/FeeReceiptModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    return StorageService.getCurrentUser();
  });

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState<PaymentReceipt | null>(null);

  useEffect(() => {
    // Auto encrypt and hash any legacy plain text passwords in Supabase users table
    SupabaseService.autoMigratePlaintextPasswords().catch(console.warn);
    // Sync with database so records stay up to date across sessions
    StorageService.syncWithDatabase().catch(console.warn);
  }, []);

  const schoolInfo = StorageService.getSchoolInfo();

  const handleLogin = (user: User) => {
    StorageService.setCurrentUser(user);
    setCurrentUser(user);
    setActiveTab(user.role === 'teacher' ? 'student-attendance' : 'dashboard');
  };

  const handleLogout = async () => {
    await SupabaseService.logout();
    StorageService.setCurrentUser(null);
    setCurrentUser(null);
  };

  const handleViewReceiptById = (receiptId: string) => {
    const r = StorageService.getPayments().find(p => p.id === receiptId);
    if (r) {
      setViewingReceipt(r);
    }
  };

  // If not authenticated, render login page
  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLogin} />;
  }

  const isOperator = currentUser.role === 'operator' || currentUser.role === 'admin';
  const isDirector = currentUser.role === 'director';
  const isTeacher = currentUser.role === 'teacher';

  // Titles for tabs
  const tabTitles: Record<string, string> = {
    dashboard: isDirector ? 'Overview' : isTeacher ? 'Class Overview' : 'Operations Dashboard',
    students: isTeacher ? 'My Class Students' : 'Student Directory',
    classes: 'Classes & Sections',
    staff: 'Teachers & Staff Management',
    'student-attendance': isTeacher ? 'Class Attendance Register' : 'Student Attendance',
    'staff-attendance': 'Staff Attendance',
    fees: 'Fee Records',
    payroll: 'Staff Payroll',
    reports: 'Reports & Audits',
    settings: 'School Configuration'
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col md:pl-72 min-w-0">
        <Header
          onOpenSidebar={() => setIsSidebarOpen(true)}
          currentUser={currentUser}
          schoolInfo={schoolInfo}
          activeTabTitle={tabTitles[activeTab] || 'BVM Portal'}
        />

        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <Dashboard
              currentUser={currentUser}
              schoolInfo={schoolInfo}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'students' && (isOperator || isDirector || isTeacher || currentUser.role === 'accountant') && (
            <StudentManagement
              currentUser={currentUser}
              onViewReceipt={handleViewReceiptById}
            />
          )}

          {activeTab === 'classes' && (isOperator || isDirector) && (
            <ClassManagement />
          )}

          {activeTab === 'staff' && (isOperator || isDirector) && (
            <StaffManagement currentUser={currentUser} />
          )}

          {activeTab === 'student-attendance' && (
            <StudentAttendance currentUser={currentUser} />
          )}

          {activeTab === 'staff-attendance' && (isOperator || isDirector) && (
            <StaffAttendance currentUser={currentUser} />
          )}

          {activeTab === 'fees' && (isOperator || isDirector || currentUser.role === 'accountant') && (
            <FeeManagement
              currentUser={currentUser}
              onClearReceiptId={() => setViewingReceipt(null)}
            />
          )}

          {activeTab === 'payroll' && isDirector && (
            <PayrollManagement currentUser={currentUser} />
          )}

          {activeTab === 'reports' && (isDirector || isOperator || currentUser.role === 'accountant') && (
            <ReportsManagement />
          )}

          {activeTab === 'settings' && isOperator && (
            <SchoolSettings />
          )}
        </main>
      </div>

      {/* Modal for viewing fee receipt from any location */}
      {viewingReceipt && (
        <FeeReceiptModal
          receipt={viewingReceipt}
          onClose={() => setViewingReceipt(null)}
        />
      )}
    </div>
  );
}
