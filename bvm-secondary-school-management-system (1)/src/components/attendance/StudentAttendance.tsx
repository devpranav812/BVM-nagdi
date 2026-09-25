import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Save,
  CheckCheck,
  AlertTriangle,
  History,
  FileText,
  Download,
  Users
} from 'lucide-react';
import { Student, StudentAttendanceStatus, User, AttendanceAuditLog } from '../../types';
import { StorageService } from '../../services/storageService';
import { downloadCSV } from '../../utils/csvExport';

interface StudentAttendanceProps {
  currentUser: User;
}

export const StudentAttendance: React.FC<StudentAttendanceProps> = ({ currentUser }) => {
  const classes = StorageService.getClasses();
  const allStudents = StorageService.getStudents();

  const isTeacher = currentUser.role === 'teacher';
  
  // As requested: Teacher has access to all classes!
  // Their assigned class is set as their default view
  const assignedClass = currentUser.assignedClass || (currentUser.assignedClasses && currentUser.assignedClasses[0]) || '';
  const accessibleClasses = classes;
  const accessibleClassNames = classes.map(c => c.name);

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedClass, setSelectedClass] = useState(() => {
    if (assignedClass && classes.some(c => c.name.toLowerCase() === assignedClass.toLowerCase())) {
      return assignedClass;
    }
    return classes[0]?.name || 'Class 1';
  });
  const [selectedSection, setSelectedSection] = useState(currentUser.assignedSection || 'A');

  // Attendance status mapping: studentId -> 'present' | 'absent'
  const [attendanceMap, setAttendanceMap] = useState<Record<string, StudentAttendanceStatus>>({});
  const [isSavedNotice, setIsSavedNotice] = useState(false);
  const [lastSavedByInfo, setLastSavedByInfo] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'mark' | 'history' | 'audit_logs' | 'absentees'>('mark');

  // Get active students for selected class and section
  const currentBatch = allStudents.filter(
    s => s.class === selectedClass && s.section === selectedSection && s.status === 'active'
  );

  // Load existing attendance sheet when date/class/section changes
  useEffect(() => {
    const existing = StorageService.getStudentAttendance(selectedDate, selectedClass, selectedSection);
    const newMap: Record<string, StudentAttendanceStatus> = {};

    currentBatch.forEach(s => {
      if (existing?.entries && existing.entries[s.id]) {
        newMap[s.id] = existing.entries[s.id];
      } else {
        // Default to present for ultra-fast workflow
        newMap[s.id] = 'present';
      }
    });

    setAttendanceMap(newMap);
    setIsSavedNotice(false);
  }, [selectedDate, selectedClass, selectedSection]);

  const toggleStudentStatus = (studentId: string) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: prev[studentId] === 'present' ? 'absent' : 'present'
    }));
    setIsSavedNotice(false);
  };

  const handleMarkAllPresent = () => {
    const newMap: Record<string, StudentAttendanceStatus> = {};
    currentBatch.forEach(s => {
      newMap[s.id] = 'present';
    });
    setAttendanceMap(newMap);
    setIsSavedNotice(false);
  };

  const handleMarkAllAbsent = () => {
    const newMap: Record<string, StudentAttendanceStatus> = {};
    currentBatch.forEach(s => {
      newMap[s.id] = 'absent';
    });
    setAttendanceMap(newMap);
    setIsSavedNotice(false);
  };

  // Calculations for summary stats
  const totalCount = currentBatch.length;
  const presentCount = Object.values(attendanceMap).filter(st => st === 'present').length;
  const absentCount = totalCount - presentCount;
  const attendanceRate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  const handleSaveAttendance = () => {
    // 1. Record in attendance sheets
    StorageService.recordStudentAttendance(
      selectedDate,
      selectedClass,
      selectedSection,
      attendanceMap,
      `${currentUser.name} (${currentUser.role})`
    );

    // 2. Save immutable audit log tracking who saved the attendance
    const auditLog: AttendanceAuditLog = {
      id: `att-log-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      schoolId: 'bvm-nagdi-01',
      date: selectedDate,
      class: selectedClass,
      section: selectedSection,
      markedById: currentUser.id,
      markedByName: currentUser.name,
      markedByPhone: currentUser.phone || '',
      markedByRole: currentUser.role,
      presentCount,
      absentCount,
      totalStudents: totalCount,
      timestamp: new Date().toISOString()
    };
    StorageService.addAttendanceLog(auditLog);
    StorageService.notifyChange();

    setLastSavedByInfo(`Saved by ${currentUser.name} (${currentUser.role.toUpperCase()}) just now`);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 4000);
  };

  // History sheets & Audit logs
  const allSheets = StorageService.getStudentAttendanceSheets();
  const auditLogs = StorageService.getAttendanceLogs();

  // Export Daily Attendance CSV
  const handleExportDailyAttendance = () => {
    const headers = ['Roll No', 'Admission No', 'Student Name', 'Class', 'Section', 'Date', 'Attendance Status'];
    const rows = currentBatch.map(s => [
      s.rollNo,
      s.admissionNo,
      s.fullName,
      s.class,
      s.section,
      selectedDate,
      (attendanceMap[s.id] || 'present').toUpperCase()
    ]);

    downloadCSV(`Attendance_${selectedClass}_${selectedSection}_${selectedDate}`, headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Module Title */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            {isTeacher ? `Student Attendance — ${currentUser.name}` : 'Student Attendance Register'}
          </h2>
          <p className="text-xs text-slate-500">
            {isTeacher
              ? 'Teachers have access to mark and view attendance for all classes. Every saved entry is logged with author info.'
              : currentUser.role === 'director'
              ? 'Director oversight: view and audit each student attendance across all classes'
              : 'Classroom attendance register and records'}
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex flex-wrap rounded-lg border border-slate-200 bg-white p-1 text-xs">
          <button
            onClick={() => setActiveTab('mark')}
            className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
              activeTab === 'mark'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Daily Register
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
              activeTab === 'history'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Attendance Sheets
          </button>
          <button
            onClick={() => setActiveTab('audit_logs')}
            className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
              activeTab === 'audit_logs'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Audit Logs ({auditLogs.length})
          </button>
          <button
            onClick={() => setActiveTab('absentees')}
            className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
              activeTab === 'absentees'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Absentee Watchlist
          </button>
        </div>
      </div>

      {isTeacher && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg bg-slate-50 border border-slate-200 px-4 py-2.5 text-xs text-slate-700">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400">Faculty:</span>
            <span className="font-semibold text-slate-900">{currentUser.name}</span>
            <span className="text-slate-300">&bull;</span>
            <span className="text-slate-400">Class In-Charge:</span>
            <strong className="text-slate-900 font-semibold">{assignedClass || 'General Faculty'}</strong>
            <span className="text-slate-300">&bull;</span>
            <span className="text-slate-400">Login ID:</span>
            <span className="font-mono text-slate-700">{currentUser.phone || currentUser.username}</span>
          </div>
          <span className="text-[11px] bg-emerald-50 text-emerald-800 font-medium px-2 py-0.5 rounded border border-emerald-200 self-start sm:self-auto">
            Access to All Classes (Logged &amp; Audited)
          </span>
        </div>
      )}

      {lastSavedByInfo && (
        <div className="flex items-center gap-2 rounded-lg bg-indigo-50/70 border border-indigo-200 px-3.5 py-2 text-xs text-indigo-800">
          <span className="font-semibold">Info:</span>
          <span>{lastSavedByInfo} for {selectedClass} - {selectedSection} ({selectedDate})</span>
        </div>
      )}

      {activeTab === 'mark' && (
        <>
          {/* Controls: Date, Class, Section Picker */}
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Attendance Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-800 focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Class {isTeacher && '(Assigned)'}
                </label>
                <select
                  value={selectedClass}
                  onChange={e => setSelectedClass(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-800 focus:border-slate-900 focus:outline-none"
                >
                  {accessibleClasses.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Section
                </label>
                <select
                  value={selectedSection}
                  onChange={e => setSelectedSection(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-800 focus:border-slate-900 focus:outline-none"
                >
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleSaveAttendance}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-slate-900 py-2 px-3 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Attendance</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics & Actions Bar */}
            <div className="mt-4 flex flex-wrap items-center justify-between border-t border-slate-100 pt-3 text-xs">
              <div className="flex items-center gap-5">
                <div>
                  <span className="text-slate-400">Enrolled:</span>{' '}
                  <strong className="text-slate-900 font-semibold">{totalCount}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Present:</span>{' '}
                  <strong className="text-emerald-700 font-semibold">{presentCount}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Absent:</span>{' '}
                  <strong className="text-rose-700 font-semibold">{absentCount}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Attendance Rate:</span>{' '}
                  <strong className="text-slate-900 font-semibold">{attendanceRate}%</strong>
                </div>
              </div>

              <div className="mt-2 sm:mt-0 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleMarkAllPresent}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Mark All Present
                </button>
                <button
                  type="button"
                  onClick={handleMarkAllAbsent}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Mark All Absent
                </button>
                <button
                  type="button"
                  onClick={handleExportDailyAttendance}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  title="Export Register to CSV"
                >
                  <Download className="h-3.5 w-3.5 inline mr-1" /> Export CSV
                </button>
              </div>
            </div>

            {isSavedNotice && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Attendance successfully recorded into school register!</span>
              </div>
            )}
          </div>

          {/* Student Attendance List */}
          <div className="rounded-lg border border-slate-200 bg-white shadow-2xs overflow-hidden">
            {currentBatch.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No active students registered under {selectedClass} - Section {selectedSection}.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {currentBatch.map(st => {
                  const isPresent = attendanceMap[st.id] === 'present';

                  return (
                    <div
                      key={st.id}
                      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-3.5 transition-colors ${
                        isPresent ? 'hover:bg-slate-50/60' : 'bg-rose-50/30'
                      }`}
                    >
                      {/* Left: Student identification */}
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-100 font-mono text-xs font-semibold text-slate-700">
                          #{st.rollNo}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900 text-xs sm:text-sm">
                              {st.fullName}
                            </span>
                            <span className="font-mono text-[11px] text-slate-400">
                              ({st.admissionNo})
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Parent: {st.parentName} &bull; 📞 {st.parentPhone}
                          </div>
                        </div>
                      </div>

                      {/* Right: Fast Toggle Present / Absent Button */}
                      <div className="mt-2 sm:mt-0 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setAttendanceMap(prev => ({ ...prev, [st.id]: 'present' }));
                            setIsSavedNotice(false);
                          }}
                          className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all min-w-[85px] justify-center cursor-pointer ${
                            isPresent
                              ? 'bg-slate-900 text-white shadow-2xs'
                              : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Present</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setAttendanceMap(prev => ({ ...prev, [st.id]: 'absent' }));
                            setIsSavedNotice(false);
                          }}
                          className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all min-w-[85px] justify-center cursor-pointer ${
                            !isPresent
                              ? 'bg-rose-600 text-white shadow-2xs'
                              : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          <span>Absent</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recorded Attendance Sheets</h3>
              <p className="text-xs text-slate-500">Historical records of classroom attendance submissions</p>
            </div>
          </div>

          {/* Mobile Attendance History Cards (No Horizontal Scroll) */}
          <div className="md:hidden divide-y divide-slate-100 mt-2">
            {(isTeacher ? allSheets.filter(s => accessibleClassNames.includes(s.class)) : allSheets).map(sheet => {
              const values = Object.values(sheet.entries || {});
              const pres = values.filter(v => v === 'present').length;
              const abs = values.filter(v => v === 'absent').length;
              const ratio = values.length > 0 ? Math.round((pres / values.length) * 100) : 0;

              return (
                <div key={sheet.id} className="py-3 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 text-sm">{sheet.class} - Section {sheet.section}</span>
                    <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{sheet.date}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 text-[11px]">
                    <span>Marked by: <strong className="text-slate-800 font-medium">{sheet.markedBy}</strong></span>
                    <span className="font-semibold text-slate-900">Attendance: {ratio}%</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-emerald-700 font-semibold">Present: {pres}</span>
                      <span className="text-rose-700 font-semibold">Absent: {abs}</span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedDate(sheet.date);
                        setSelectedClass(sheet.class);
                        setSelectedSection(sheet.section);
                        setActiveTab('mark');
                      }}
                      className="rounded border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-900 hover:bg-slate-50"
                    >
                      View & Edit
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50/80 text-slate-600 font-semibold">
                <tr>
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">Class & Section</th>
                  <th className="px-3 py-2 text-left">Marked By</th>
                  <th className="px-3 py-2 text-center">Present</th>
                  <th className="px-3 py-2 text-center">Absent</th>
                  <th className="px-3 py-2 text-right">Attendance Rate</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {(isTeacher ? allSheets.filter(s => accessibleClassNames.includes(s.class)) : allSheets).map(sheet => {
                  const values = Object.values(sheet.entries || {});
                  const pres = values.filter(v => v === 'present').length;
                  const abs = values.filter(v => v === 'absent').length;
                  const ratio = values.length > 0 ? Math.round((pres / values.length) * 100) : 0;

                  return (
                    <tr key={sheet.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-3 py-2 font-medium text-slate-900">{sheet.date}</td>
                      <td className="px-3 py-2 text-slate-700 font-semibold">{sheet.class} - {sheet.section}</td>
                      <td className="px-3 py-2 text-slate-600">{sheet.markedBy}</td>
                      <td className="px-3 py-2 text-center font-semibold text-emerald-700">{pres}</td>
                      <td className="px-3 py-2 text-center font-semibold text-rose-700">{abs}</td>
                      <td className="px-3 py-2 text-right font-medium text-slate-900">{ratio}%</td>
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={() => {
                            setSelectedDate(sheet.date);
                            setSelectedClass(sheet.class);
                            setSelectedSection(sheet.section);
                            setActiveTab('mark');
                          }}
                          className="font-medium text-slate-900 hover:underline"
                        >
                          View & Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Attendance Audit Logs (Who saved attendance) */}
      {activeTab === 'audit_logs' && (
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Attendance Audit Logs (Action Tracker)</h3>
              <p className="text-xs text-slate-500">
                Detailed audit trail recording every attendance submission with the author's identity and timestamp.
              </p>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Total Log Entries: <strong>{auditLogs.length}</strong>
            </span>
          </div>

          {auditLogs.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No attendance submissions logged yet. When a teacher marks and saves attendance, the action will be automatically recorded here.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600">
                    <th className="px-3 py-2.5">Date &amp; Time</th>
                    <th className="px-3 py-2.5">Target Class</th>
                    <th className="px-3 py-2.5">Attendance Date</th>
                    <th className="px-3 py-2.5">Marked / Saved By</th>
                    <th className="px-3 py-2.5">Login Mobile</th>
                    <th className="px-3 py-2.5 text-center">Present / Total</th>
                    <th className="px-3 py-2.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {auditLogs.map(log => {
                    const dateObj = new Date(log.timestamp);
                    const formattedTime = isNaN(dateObj.getTime())
                      ? log.timestamp
                      : `${dateObj.toLocaleDateString()} ${dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-3 py-2.5 font-mono text-[11px] text-slate-600">
                          {formattedTime}
                        </td>
                        <td className="px-3 py-2.5 font-bold text-slate-900">
                          {log.class} - {log.section}
                        </td>
                        <td className="px-3 py-2.5 font-medium text-slate-700">
                          {log.date}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="font-semibold text-slate-900">{log.markedByName}</div>
                          <span className="inline-block mt-0.5 text-[10px] uppercase font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                            {log.markedByRole}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 font-mono text-slate-700">
                          {log.markedByPhone || 'N/A'}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span className="font-bold text-emerald-700">{log.presentCount}</span>
                          <span className="text-slate-400 mx-1">/</span>
                          <span className="font-medium text-slate-700">{log.totalStudents}</span>
                          {log.absentCount > 0 && (
                            <span className="text-[10px] text-rose-600 ml-1.5 font-medium">
                              ({log.absentCount} abs)
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                            Verified
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Absentees Watchlist */}
      {activeTab === 'absentees' && (
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Absentee List for {selectedDate}</h3>
              <p className="text-xs text-slate-500">
                Students marked absent in {selectedClass} - {selectedSection}
              </p>
            </div>
          </div>

          {currentBatch.filter(s => attendanceMap[s.id] === 'absent').length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              100% Attendance today. No absentees recorded in {selectedClass} - {selectedSection}.
            </div>
          ) : (
            <div className="mt-4 divide-y divide-slate-100">
              {currentBatch
                .filter(s => attendanceMap[s.id] === 'absent')
                .map(s => (
                  <div key={s.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-slate-900 block">{s.fullName}</span>
                      <span className="text-slate-400">
                        Roll #{s.rollNo} &bull; Parent: {s.parentName}
                      </span>
                    </div>
                    <div>
                      <a
                        href={`tel:${s.parentPhone}`}
                        className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        📞 {s.parentPhone}
                      </a>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
