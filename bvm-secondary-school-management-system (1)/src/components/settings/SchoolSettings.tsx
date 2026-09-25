import React, { useState } from 'react';
import { School, Save, RotateCcw, CheckCircle2, Phone, Mail, MapPin, Lock, RefreshCw, Trash2, X } from 'lucide-react';
import { SchoolInfo } from '../../types';
import { StorageService } from '../../services/storageService';

export const SchoolSettings: React.FC = () => {
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo>(() => StorageService.getSchoolInfo());
  const [isSaved, setIsSaved] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearSuccess, setClearSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const permanentName = 'Bhagwati Vidya Mandir Secondary School, Nagdi';
    StorageService.saveSchoolInfo({ ...schoolInfo, name: permanentName });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshSuccess, setRefreshSuccess] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [clearError, setClearError] = useState<string | null>(null);

  const handleRefreshData = async () => {
    setIsRefreshing(true);
    try {
      await StorageService.refreshData();
      setRefreshSuccess(true);
      setTimeout(() => setRefreshSuccess(false), 3000);
    } catch (e) {
      console.warn('Refresh error:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  const executeClearAll = async () => {
    setIsClearing(true);
    setClearError(null);
    try {
      await StorageService.clearAllData();
      setShowClearModal(false);
      setClearSuccess(true);
      setTimeout(() => setClearSuccess(false), 5000);
    } catch (err: any) {
      setClearError(err?.message || 'Failed to reset database');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">School Profile & Institutional Settings</h2>
        <p className="text-xs text-slate-500">
          Manage institution details displayed across fee receipts, circulars, and official reports
        </p>
      </div>

      <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  School Name (Locked)
                </label>
                <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                  <Lock className="h-3 w-3" />
                  Permanent
                </span>
              </div>
              <input
                type="text"
                readOnly
                disabled
                value={schoolInfo.name}
                className="w-full rounded-lg border border-slate-200 bg-slate-100/80 px-3 py-2 text-xs font-bold text-slate-700 cursor-not-allowed select-none"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                This portal is custom-licensed specifically for BVM Secondary School Nagdi and cannot be altered.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Official Contact Phone *
              </label>
              <input
                type="text"
                required
                value={schoolInfo.contactNumber}
                onChange={e => setSchoolInfo({ ...schoolInfo, contactNumber: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:border-indigo-600 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400">Primary office line: 9929882820</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Institutional Email
              </label>
              <input
                type="email"
                value={schoolInfo.email || ''}
                onChange={e => setSchoolInfo({ ...schoolInfo, email: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Board Affiliation Code
              </label>
              <input
                type="text"
                value={schoolInfo.affiliationNumber || ''}
                onChange={e => setSchoolInfo({ ...schoolInfo, affiliationNumber: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Principal In-Charge
              </label>
              <input
                type="text"
                value={schoolInfo.principalName || ''}
                onChange={e => setSchoolInfo({ ...schoolInfo, principalName: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Active Academic Session
              </label>
              <input
                type="text"
                value={schoolInfo.academicYear}
                onChange={e => setSchoolInfo({ ...schoolInfo, academicYear: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Postal Address
              </label>
              <input
                type="text"
                value={schoolInfo.address}
                onChange={e => setSchoolInfo({ ...schoolInfo, address: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-600 focus:outline-none"
              />
            </div>
          </div>

          {isSaved && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-2.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Institutional configuration updated successfully!</span>
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>Save Configuration</span>
            </button>
          </div>
        </form>
      </div>

      {/* System Synchronization & Refresh Card */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">System Synchronization & State Refresh</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Reload real-time school records, sync cloud tables, or purge test records.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <div>
            <span className="text-xs font-semibold text-slate-800 block">Refresh Real-Time Data</span>
            <span className="text-[11px] text-slate-500">
              Reloads active registers, metrics, and cloud state without losing entered data
            </span>
          </div>

          <div className="flex items-center gap-2">
            {refreshSuccess && (
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                Refreshed
              </span>
            )}
            <button
              type="button"
              onClick={handleRefreshData}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-indigo-700 shadow-xs transition-colors cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh Data'}</span>
            </button>
          </div>
        </div>

        {clearSuccess && (
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 flex items-center justify-between">
            <span className="font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              Database tables & local records wiped to 0 students, 0 staff. Director & Developer accounts retained.
            </span>
          </div>
        )}

        {clearError && (
          <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 flex items-center justify-between">
            <span className="font-semibold flex items-center gap-1.5">
              <X className="h-4 w-4 text-rose-600 shrink-0" />
              {clearError}
            </span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs">
          <div>
            <span className="text-slate-700 font-medium block">Clean Slate Maintenance</span>
            <span className="text-[11px] text-slate-400">
              Clear all student and staff records in Supabase database & local registers (0 students, 0 staff)
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowClearModal(true)}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 border border-rose-200 rounded-lg px-2.5 py-1.5 hover:bg-rose-50 cursor-pointer"
          >
            Purge All Data to 0
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Resetting to Clean State */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="h-5 w-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Reset System & Database to 0?</h3>
                <p className="text-xs text-slate-500">Director / Developer Action</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 my-4 leading-relaxed">
              This action will purge the Supabase PostgreSQL database and local registers to <strong>0 students</strong> and <strong>0 staff members</strong>. All fee receipts, payroll records, and attendance sheets will be cleared. The School Director and System Developer accounts will remain completely intact.
            </p>

            {clearError && (
              <div className="mb-4 rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700">
                {clearError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isClearing}
                onClick={() => setShowClearModal(false)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isClearing}
                onClick={executeClearAll}
                className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-rose-700 transition-colors flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
              >
                {isClearing ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Purging Database...</span>
                  </>
                ) : (
                  <span>Confirm Clean Slate (0 Data)</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
