import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Save,
  Download
} from 'lucide-react';
import { Staff, StaffAttendanceStatus, User } from '../../types';
import { StorageService } from '../../services/storageService';
import { downloadCSV } from '../../utils/csvExport';

interface StaffAttendanceProps {
  currentUser: User;
}

export const StaffAttendance: React.FC<StaffAttendanceProps> = ({ currentUser }) => {
  const staffMembers = StorageService.getStaff().filter(s => s.status === 'active');
  const todayStr = new Date().toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, { status: StaffAttendanceStatus; notes?: string }>>({});
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  useEffect(() => {
    const existing = StorageService.getStaffAttendance(selectedDate);
    const newRecords: Record<string, { status: StaffAttendanceStatus; notes?: string }> = {};

    staffMembers.forEach(s => {
      if (existing?.records && existing.records[s.id]) {
        newRecords[s.id] = existing.records[s.id];
      } else {
        newRecords[s.id] = { status: 'present' };
      }
    });

    setAttendanceRecords(newRecords);
    setIsSavedNotice(false);
  }, [selectedDate]);

  const updateStatus = (staffId: string, status: StaffAttendanceStatus) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [staffId]: {
        ...prev[staffId],
        status
      }
    }));
    setIsSavedNotice(false);
  };

  const updateNotes = (staffId: string, notes: string) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [staffId]: {
        ...prev[staffId],
        notes
      }
    }));
    setIsSavedNotice(false);
  };

  const handleMarkAllPresent = () => {
    const newRecords: Record<string, { status: StaffAttendanceStatus; notes?: string }> = {};
    staffMembers.forEach(s => {
      newRecords[s.id] = { status: 'present' };
    });
    setAttendanceRecords(newRecords);
    setIsSavedNotice(false);
  };

  const handleSave = () => {
    StorageService.recordStaffAttendance(selectedDate, attendanceRecords, currentUser.name);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 3500);
  };

  const handleExportCSV = () => {
    const headers = ['Employee ID', 'Name', 'Role', 'Department', 'Date', 'Status', 'Notes'];
    const rows = staffMembers.map(s => {
      const rec = attendanceRecords[s.id] || { status: 'present' };
      return [
        s.employeeId,
        s.name,
        s.role,
        s.department,
        selectedDate,
        rec.status.toUpperCase(),
        rec.notes || ''
      ];
    });

    downloadCSV(`Staff_Attendance_${selectedDate}`, headers, rows);
  };

  // Status breakdown
  const presentCount = Object.values(attendanceRecords).filter(r => r.status === 'present').length;
  const leaveCount = Object.values(attendanceRecords).filter(r => r.status === 'leave').length;
  const lateCount = Object.values(attendanceRecords).filter(r => r.status === 'late').length;
  const absentCount = Object.values(attendanceRecords).filter(r => r.status === 'absent').length;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Staff Muster & Attendance</h2>
          <p className="text-xs text-slate-500">
            Daily faculty and staff attendance record register
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Save Register</span>
          </button>
        </div>
      </div>

      {/* Date & Minimalist Metrics Bar */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-800 focus:border-slate-900 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllPresent}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Mark All Present
            </button>
          </div>
        </div>

        {/* Minimalist Summary Counts */}
        <div className="mt-4 flex flex-wrap items-center gap-6 border-t border-slate-100 pt-3 text-xs">
          <div>
            <span className="text-slate-400">Total Staff:</span>{' '}
            <strong className="text-slate-900 font-semibold">{staffMembers.length}</strong>
          </div>
          <div>
            <span className="text-slate-400">Present:</span>{' '}
            <strong className="text-emerald-700 font-semibold">{presentCount}</strong>
          </div>
          <div>
            <span className="text-slate-400">On Leave:</span>{' '}
            <strong className="text-slate-700 font-semibold">{leaveCount}</strong>
          </div>
          <div>
            <span className="text-slate-400">Late Mark:</span>{' '}
            <strong className="text-amber-700 font-semibold">{lateCount}</strong>
          </div>
          <div>
            <span className="text-slate-400">Absent:</span>{' '}
            <strong className="text-rose-700 font-semibold">{absentCount}</strong>
          </div>
        </div>

        {isSavedNotice && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Staff attendance register updated successfully!</span>
          </div>
        )}
      </div>

      {/* Staff Attendance Register */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xs">
        {/* Mobile View: Vertical Cards (Zero horizontal scroll) */}
        <div className="md:hidden divide-y divide-slate-100 p-3 space-y-3">
          {staffMembers.map(stf => {
            const rec = attendanceRecords[stf.id] || { status: 'present' };

            return (
              <div key={stf.id} className="pt-3 first:pt-0 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">{stf.name}</div>
                    <div className="text-[11px] text-slate-500">{stf.role} &bull; {stf.department}</div>
                  </div>
                  <span className="font-mono text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {stf.employeeId}
                  </span>
                </div>

                {/* 4-way Segmented Button Row */}
                <div className="grid grid-cols-4 gap-1 pt-1">
                  <button
                    type="button"
                    onClick={() => updateStatus(stf.id, 'present')}
                    className={`rounded py-2 text-xs font-semibold transition-all ${
                      rec.status === 'present'
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Present
                  </button>
                  <button
                    type="button"
                    onClick={() => updateStatus(stf.id, 'late')}
                    className={`rounded py-2 text-xs font-semibold transition-all ${
                      rec.status === 'late'
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Late
                  </button>
                  <button
                    type="button"
                    onClick={() => updateStatus(stf.id, 'leave')}
                    className={`rounded py-2 text-xs font-semibold transition-all ${
                      rec.status === 'leave'
                        ? 'bg-slate-700 text-white shadow-2xs'
                        : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Leave
                  </button>
                  <button
                    type="button"
                    onClick={() => updateStatus(stf.id, 'absent')}
                    className={`rounded py-2 text-xs font-semibold transition-all ${
                      rec.status === 'absent'
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Absent
                  </button>
                </div>

                <input
                  type="text"
                  value={rec.notes || ''}
                  onChange={e => updateNotes(stf.id, e.target.value)}
                  placeholder="Optional remarks (e.g. medical, official duty)"
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
                />
              </div>
            );
          })}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50/80 text-slate-600 font-semibold">
              <tr>
                <th className="px-4 py-3 text-left">Emp ID</th>
                <th className="px-4 py-3 text-left">Faculty / Staff</th>
                <th className="px-4 py-3 text-left">Department</th>
                <th className="px-4 py-3 text-center">Attendance Status</th>
                <th className="px-4 py-3 text-left">Remarks / Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {staffMembers.map(stf => {
                const rec = attendanceRecords[stf.id] || { status: 'present' };

                return (
                  <tr key={stf.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 font-mono text-slate-600">{stf.employeeId}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{stf.name}</div>
                      <div className="text-[11px] text-slate-400">{stf.role}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{stf.department}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                        <button
                          type="button"
                          onClick={() => updateStatus(stf.id, 'present')}
                          className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                            rec.status === 'present'
                              ? 'bg-slate-900 text-white shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Present
                        </button>
                        <button
                          type="button"
                          onClick={() => updateStatus(stf.id, 'late')}
                          className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                            rec.status === 'late'
                              ? 'bg-amber-600 text-white shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Late
                        </button>
                        <button
                          type="button"
                          onClick={() => updateStatus(stf.id, 'leave')}
                          className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                            rec.status === 'leave'
                              ? 'bg-slate-700 text-white shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Leave
                        </button>
                        <button
                          type="button"
                          onClick={() => updateStatus(stf.id, 'absent')}
                          className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                            rec.status === 'absent'
                              ? 'bg-rose-600 text-white shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Absent
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={rec.notes || ''}
                        onChange={e => updateNotes(stf.id, e.target.value)}
                        placeholder="Optional remarks"
                        className="w-full rounded border border-slate-200 px-2 py-1 text-xs text-slate-800 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
