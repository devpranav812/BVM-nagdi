import React, { useState, useEffect } from 'react';
import {
  Users,
  GraduationCap,
  CalendarCheck,
  UserCheck,
  CreditCard,
  Banknote,
  AlertTriangle,
  ArrowUpRight,
  PlusCircle,
  Receipt,
  FileSpreadsheet,
  CheckCircle2,
  School
} from 'lucide-react';
import { User, SchoolInfo } from '../../types';
import { StorageService } from '../../services/storageService';
import { formatINR } from '../../utils/csvExport';

interface DashboardProps {
  currentUser: User;
  schoolInfo: SchoolInfo;
  onNavigate: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  currentUser,
  schoolInfo,
  onNavigate
}) => {
  const [metrics, setMetrics] = useState(() => StorageService.getDashboardMetrics());
  const [classes, setClasses] = useState(() => StorageService.getClasses());
  const [students, setStudents] = useState(() => StorageService.getStudents());
  const [staff, setStaff] = useState(() => StorageService.getStaff());
  const [studentSheets, setStudentSheets] = useState(() => StorageService.getStudentAttendanceSheets());
  const [staffSheets, setStaffSheets] = useState(() => StorageService.getStaffAttendanceSheets());
  const [payments, setPayments] = useState(() => StorageService.getPayments());
  const [selectedTeacherClass, setSelectedTeacherClass] = useState<string>('');

  useEffect(() => {
    const handleDataUpdate = () => {
      setMetrics(StorageService.getDashboardMetrics());
      setClasses(StorageService.getClasses());
      setStudents(StorageService.getStudents());
      setStaff(StorageService.getStaff());
      setStudentSheets(StorageService.getStudentAttendanceSheets());
      setStaffSheets(StorageService.getStaffAttendanceSheets());
      setPayments(StorageService.getPayments());
    };

    window.addEventListener('bvm_data_changed', handleDataUpdate);
    window.addEventListener('storage', handleDataUpdate);
    return () => {
      window.removeEventListener('bvm_data_changed', handleDataUpdate);
      window.removeEventListener('storage', handleDataUpdate);
    };
  }, []);

  const isDirector = currentUser.role === 'director';
  const isOperator = currentUser.role === 'operator' || currentUser.role === 'admin';
  const isTeacher = currentUser.role === 'teacher';

  // Compute both local YYYY-MM-DD and UTC YYYY-MM-DD to guarantee 100% attendance sheet synchronization
  const localTodayStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();
  const todayStr = new Date().toISOString().split('T')[0];
  const isDateToday = (d: string) => d === todayStr || d === localTodayStr;

  // Dynamically compute real live attendance breakdown per class based on registered students & attendance sheets
  const dynamicClassAttendance = classes.map(cls => {
    const classStudents = students.filter(
      s => s.class.trim().toLowerCase() === cls.name.trim().toLowerCase() && s.status === 'active'
    );
    const totalEnrolled = classStudents.length;

    const todaySheets = studentSheets.filter(
      s => s.class.trim().toLowerCase() === cls.name.trim().toLowerCase() && isDateToday(s.date)
    );
    const recentSheets = todaySheets.length > 0 
      ? todaySheets 
      : studentSheets.filter(s => s.class.trim().toLowerCase() === cls.name.trim().toLowerCase());

    let markedStudents = 0;
    let presentStudents = 0;
    let isMarkedToday = todaySheets.length > 0;

    recentSheets.forEach(sh => {
      if (sh.entries) {
        Object.values(sh.entries).forEach(st => {
          markedStudents++;
          if (st === 'present') presentStudents++;
        });
      }
    });

    let pct = 0;
    let countLabel = '';

    if (markedStudents > 0) {
      pct = Math.round((presentStudents / markedStudents) * 100);
      countLabel = `${presentStudents} / ${markedStudents} (${pct}%)`;
    } else if (totalEnrolled > 0) {
      pct = 0;
      countLabel = `0 / ${totalEnrolled} marked (Pending)`;
    } else {
      pct = 0;
      countLabel = '0 students enrolled';
    }

    return {
      id: cls.id,
      name: cls.name,
      teacher: cls.classTeacher || 'Teacher In-Charge',
      countLabel,
      pct,
      isMarkedToday,
      totalEnrolled
    };
  });

  // Dedicated Teacher Dashboard: Strictly class data, zero fees or whole-school financial metrics
  if (isTeacher) {
    const teacherClasses = classes.filter(
      c => (c.classTeacher && c.classTeacher.trim().toLowerCase() === currentUser.name.trim().toLowerCase()) ||
           (currentUser.assignedClasses && currentUser.assignedClasses.some(ac => ac.toLowerCase().includes(c.name.toLowerCase()))) ||
           (currentUser.assignedClass && c.name.toLowerCase() === currentUser.assignedClass.toLowerCase())
    );

    const defaultTeacherClass = teacherClasses[0] || classes[0];
    const teacherClassName = selectedTeacherClass || (defaultTeacherClass ? defaultTeacherClass.name : 'Class 8');

    // Active students in teacher's assigned / selected class
    const classStudents = students.filter(
      s => s.class.trim().toLowerCase() === teacherClassName.trim().toLowerCase() && s.status === 'active'
    );

    // Today's attendance sheets for this class (supports single or multiple sections e.g. A, B)
    const todayClassSheets = studentSheets.filter(
      s => s.class.trim().toLowerCase() === teacherClassName.trim().toLowerCase() && isDateToday(s.date)
    );

    let teacherPresentCount = 0;
    let teacherAbsentCount = 0;
    let teacherMarkedCount = 0;

    // Accurately calculate based on enrolled students
    classStudents.forEach(student => {
      let st: 'present' | 'absent' | undefined = undefined;
      for (const sheet of todayClassSheets) {
        if (sheet.entries && sheet.entries[student.id]) {
          st = sheet.entries[student.id];
          break;
        }
      }
      if (st) {
        teacherMarkedCount++;
        if (st === 'present') teacherPresentCount++;
        else if (st === 'absent') teacherAbsentCount++;
      }
    });

    const isTodayClassMarked = teacherMarkedCount > 0;
    const teacherAttendancePct = teacherMarkedCount > 0
      ? Math.round((teacherPresentCount / teacherMarkedCount) * 100)
      : 0;

    return (
      <div className="space-y-6">
        {/* Top Banner / Welcome for Teacher */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-slate-900">
                  Class Teacher Portal — {currentUser.name}
                </h2>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500 font-medium">Viewing Class:</span>
                  <select
                    value={teacherClassName}
                    onChange={e => setSelectedTeacherClass(e.target.value)}
                    className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-900 focus:border-indigo-600 focus:outline-none"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.name}>
                        {c.name} {teacherClasses.some(tc => tc.id === c.id) ? '★ (Assigned)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {schoolInfo.name} &bull; Classroom Attendance & Student Records &bull; Session {schoolInfo.academicYear}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                id="dash-quick-attendance-teacher"
                type="button"
                onClick={() => onNavigate('student-attendance')}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition-colors cursor-pointer"
              >
                <CalendarCheck className="h-4 w-4" />
                <span>Mark Class Attendance</span>
              </button>
              <button
                id="dash-quick-roster-teacher"
                type="button"
                onClick={() => onNavigate('students')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Users className="h-4 w-4 text-slate-500" />
                <span>My Class Students ({classStudents.length})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Teacher Class-Specific KPI Metric Cards (No Fees, No School Payroll) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* My Class Students */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">My Class Students</span>
              <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                <GraduationCap className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold tracking-tight text-slate-900">{classStudents.length}</span>
              <span className="ml-2 text-xs text-emerald-600 font-medium">Enrolled</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Active students in {teacherClassName}</p>
          </div>

          {/* Today's Attendance Rate */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today's Attendance</span>
              <div className={`rounded-lg p-2 ${isTodayClassMarked ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                <CalendarCheck className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className={`text-2xl font-bold tracking-tight ${isTodayClassMarked ? 'text-emerald-600' : 'text-amber-600'}`}>
                {isTodayClassMarked ? `${teacherAttendancePct}%` : 'Pending'}
              </span>
              <span className="ml-2 text-xs text-slate-500 font-medium">
                {isTodayClassMarked ? 'Marked Today' : 'Awaiting Muster'}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {isTodayClassMarked ? `${teacherPresentCount} of ${classStudents.length} present` : 'Take today\'s attendance'}
            </p>
          </div>

          {/* Present Today */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Present Today</span>
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                <UserCheck className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold tracking-tight text-slate-900">
                {isTodayClassMarked ? teacherPresentCount : 0}
              </span>
              <span className="ml-2 text-xs text-emerald-600 font-medium">Attendees</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {isTodayClassMarked ? 'Recorded in register' : 'Mark attendance to record'}
            </p>
          </div>

          {/* Absent Today */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Absent Today</span>
              <div className="rounded-lg bg-rose-50 p-2 text-rose-600">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold tracking-tight text-rose-600">
                {isTodayClassMarked ? teacherAbsentCount : 0}
              </span>
              <span className="ml-2 text-xs text-slate-500 font-medium">Absentees</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {isTodayClassMarked ? `${teacherAbsentCount} student(s) absent` : 'Awaiting today\'s muster'}
            </p>
          </div>
        </div>

        {/* Teacher Main Content: Class Attendance & Roster */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Class Attendance Register Table */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs lg:col-span-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {teacherClassName} &bull; Today's Attendance Register
                </h3>
                <p className="text-xs text-slate-500">Date: {todayStr}</p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('student-attendance')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
              >
                <span>Take Attendance</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {classStudents.length === 0 ? (
              <div className="py-10 text-center">
                <GraduationCap className="mx-auto h-10 w-10 text-slate-300" />
                <h4 className="mt-2 text-sm font-semibold text-slate-800">No students enrolled yet</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Students can be enrolled in {teacherClassName} by the Director or Computer In-Charge.
                </p>
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold">
                    <tr>
                      <th className="px-3 py-2 text-left">Roll #</th>
                      <th className="px-3 py-2 text-left">Student Name</th>
                      <th className="px-3 py-2 text-left">Parent Contact</th>
                      <th className="px-3 py-2 text-center">Today's Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {classStudents.map(student => {
                      let status: 'present' | 'absent' | undefined = undefined;
                      for (const sheet of todayClassSheets) {
                        if (sheet.entries && sheet.entries[student.id]) {
                          status = sheet.entries[student.id];
                          break;
                        }
                      }
                      return (
                        <tr key={student.id} className="hover:bg-slate-50/60">
                          <td className="px-3 py-2 font-mono font-medium text-slate-600">
                            #{student.rollNo}
                          </td>
                          <td className="px-3 py-2">
                            <span className="font-semibold text-slate-900 block">{student.fullName}</span>
                            <span className="text-[11px] text-slate-400 font-mono">{student.admissionNo}</span>
                          </td>
                          <td className="px-3 py-2 text-slate-600 font-mono">
                            {student.parentPhone}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {status === 'present' ? (
                              <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                                Present
                              </span>
                            ) : status === 'absent' ? (
                              <span className="inline-flex rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700 border border-rose-200">
                                Absent
                              </span>
                            ) : (
                              <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 border border-amber-200">
                                Pending
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Teacher Responsibility & Classroom Notes */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Classroom Guidelines</span>
              </h3>
              <p className="text-xs text-slate-500">Teacher Privileges & Duties</p>
            </div>

            <div className="space-y-3">
              <div className="rounded-lg bg-emerald-50 p-3 border border-emerald-200/80 text-xs">
                <span className="font-semibold text-emerald-900 block">Class Attendance Authority</span>
                <p className="text-emerald-800 mt-0.5">
                  You are the designated class teacher for {teacherClassName}. Daily attendance recording is exclusively assigned to you.
                </p>
              </div>

              <div className="rounded-lg bg-blue-50 p-3 border border-blue-200/80 text-xs">
                <span className="font-semibold text-blue-900 block">Student Roster Access</span>
                <p className="text-blue-800 mt-0.5">
                  You have access to your class student roster, parent contact details, and attendance logs.
                </p>
              </div>

              <div className="rounded-lg bg-slate-50 p-3 border border-slate-200/80 text-xs">
                <span className="font-semibold text-slate-700 block">Financial & School Records</span>
                <p className="text-slate-600 mt-0.5">
                  Fees, accounts, and whole-school administration are restricted to the Director and Office Staff.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                {isDirector
                  ? 'School Performance Overview'
                  : isTeacher
                  ? `Class Teacher Portal — ${currentUser.name}`
                  : `Operations Console — ${currentUser.name}`}
              </h2>
              <span className={`rounded-md px-2.5 py-0.5 text-xs font-semibold capitalize border ${
                isDirector
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : isTeacher
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-200'
              }`}>
                {isDirector ? 'Director: Ashish Joshi' : isTeacher ? 'Assigned: Class 8' : 'Computer Person'}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {schoolInfo.name} &bull; Nagdi, Arnod, Pratapgarh, Rajasthan &bull; Session {schoolInfo.academicYear} &bull; Office: {schoolInfo.contactNumber}
            </p>
          </div>

          {/* Quick Action Shortcuts depending on Role */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Teacher: strictly class attendance and student roster */}
            {isTeacher && (
              <>
                <button
                  id="dash-quick-attendance-teacher"
                  type="button"
                  onClick={() => onNavigate('student-attendance')}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition-colors"
                >
                  <CalendarCheck className="h-4 w-4" />
                  <span>Mark Class Attendance</span>
                </button>
                <button
                  id="dash-quick-roster-teacher"
                  type="button"
                  onClick={() => onNavigate('students')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Users className="h-4 w-4 text-slate-500" />
                  <span>My Class Roster</span>
                </button>
              </>
            )}

            {/* Director: High-level overview, student admissions, fee collection, staff payroll control, and audit */}
            {isDirector && (
              <>
                <button
                  id="dash-director-add-student"
                  type="button"
                  onClick={() => onNavigate('students')}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors"
                  title="Director: New Student Admission"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Add Student</span>
                </button>
                <button
                  id="dash-director-add-staff"
                  type="button"
                  onClick={() => onNavigate('staff')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  title="Director: Manage Faculty & Staff"
                >
                  <Users className="h-4 w-4 text-slate-500" />
                  <span>Add Faculty</span>
                </button>
                <button
                  id="dash-director-collect-fee"
                  type="button"
                  onClick={() => onNavigate('fees')}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition-colors"
                  title="Director Fee Collection"
                >
                  <Receipt className="h-4 w-4" />
                  <span>Collect Fee</span>
                </button>
                <button
                  id="dash-director-payroll"
                  type="button"
                  onClick={() => onNavigate('payroll')}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-teal-800 transition-colors"
                  title="Director Payroll Control"
                >
                  <Banknote className="h-4 w-4" />
                  <span>Staff Payroll</span>
                </button>
                <button
                  id="dash-director-reports"
                  type="button"
                  onClick={() => onNavigate('reports')}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-purple-700 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-purple-800 transition-colors"
                >
                  <ArrowUpRight className="h-4 w-4" />
                  <span>Performance Audit</span>
                </button>
              </>
            )}

            {/* Computer Person: All operational tools */}
            {isOperator && (
              <>
                <button
                  id="dash-quick-add-student"
                  type="button"
                  onClick={() => onNavigate('students')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <PlusCircle className="h-4 w-4 text-slate-500" />
                  <span>Add Student</span>
                </button>

                <button
                  id="dash-quick-assign-teacher"
                  type="button"
                  onClick={() => onNavigate('classes')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 transition-colors"
                >
                  <Users className="h-4 w-4 text-indigo-600" />
                  <span>Assign Teachers</span>
                </button>

                <button
                  id="dash-quick-payment"
                  type="button"
                  onClick={() => onNavigate('fees')}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition-colors"
                >
                  <Receipt className="h-4 w-4" />
                  <span>Collect Fee</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Primary KPI Metric Cards (Connected Live to Storage) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Students */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs transition-hover hover:border-slate-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Students</span>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <GraduationCap className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold tracking-tight text-slate-900">{metrics.activeStudentsCount}</span>
            <span className="ml-2 text-xs text-emerald-600 font-medium">Active Enrolled</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Across Classes 1 to 10</p>
        </div>

        {/* Teachers & Staff */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs transition-hover hover:border-slate-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Teachers & Staff</span>
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold tracking-tight text-slate-900">{metrics.activeStaffCount}</span>
            <span className="ml-2 text-xs text-slate-500 font-medium">Full-time staff</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Managed faculty & staff</p>
        </div>

        {/* Student Attendance */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs transition-hover hover:border-slate-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Student Attendance</span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <CalendarCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold tracking-tight text-emerald-600">{metrics.studentRateFormatted}</span>
            <span className="ml-2 text-xs text-emerald-700 font-medium">Register Ratio</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">{metrics.studentSummaryText}</p>
        </div>

        {/* Staff Attendance */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs transition-hover hover:border-slate-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Staff Attendance</span>
            <div className="rounded-lg bg-violet-50 p-2 text-violet-600">
              <UserCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold tracking-tight text-slate-900">{metrics.staffRateFormatted}</span>
            <span className="ml-2 text-xs text-slate-500 font-medium">Muster Status</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">{metrics.staffSummaryText}</p>
        </div>

        {/* Fees Collected */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs transition-hover hover:border-slate-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Fees Collected</span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <CreditCard className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold tracking-tight text-slate-900">{formatINR(metrics.totalCollectedFees)}</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Total receipts realized</p>
        </div>

        {/* Pending Fees */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs transition-hover hover:border-slate-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Fees</span>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold tracking-tight text-amber-600">{formatINR(metrics.totalPendingFees)}</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Outstanding student dues</p>
        </div>

        {/* Current Month Payroll */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs transition-hover hover:border-slate-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Month Payroll</span>
            <div className="rounded-lg bg-teal-50 p-2 text-teal-600">
              <Banknote className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold tracking-tight text-slate-900">{formatINR(metrics.currentMonthPayroll)}</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Director Authorized &bull; September 2026</p>
        </div>

        {/* Active Classes */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs transition-hover hover:border-slate-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Academic Classes</span>
            <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold tracking-tight text-slate-900">{classes.length} Classes</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {classes.reduce((acc, c) => acc + (c.sections?.length || 1), 0)} Active Sections (Across standard batches)
          </p>
        </div>
      </div>

      {/* Middle Grid: Attendance & Fee Progress + Alerts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Class Attendance Snapshot */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Class Attendance Summary (Today)</h3>
              <p className="text-xs text-slate-500">Live breakdown across secondary batches</p>
            </div>
            <button
              onClick={() => onNavigate(isDirector ? 'reports' : 'student-attendance')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <span>{isDirector ? 'Performance Reports' : 'View Attendance'}</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {dynamicClassAttendance.map((item) => (
              <div key={item.id} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-800">{item.name}</span>
                    {item.isMarkedToday && (
                      <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[10px] font-bold text-emerald-800">
                        Marked Today
                      </span>
                    )}
                  </div>
                  <span className="text-slate-600 font-medium">{item.countLabel}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all ${
                      item.pct >= 90 ? 'bg-emerald-500' : item.pct >= 75 ? 'bg-indigo-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Class Teacher: {item.teacher}</span>
                  <span>{item.totalEnrolled} Active Students Enrolled</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Important Alerts & School Info */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span>Administrative Alerts</span>
            </h3>
            <p className="text-xs text-slate-500">Live operational notifications</p>
          </div>

          <div className="space-y-3">
            <div className="rounded-lg bg-amber-50 p-3 border border-amber-200/80 text-xs">
              <span className="font-semibold text-amber-900 block">Fee Collection Summary</span>
              <p className="text-amber-800 mt-0.5">
                {metrics.totalPendingFees > 0
                  ? `${formatINR(metrics.totalPendingFees)} outstanding dues across enrolled students. Cash counter and online receipts active.`
                  : 'All student accounts up to date. No outstanding fee dues recorded.'}
              </p>
            </div>

            <div className="rounded-lg bg-blue-50 p-3 border border-blue-200/80 text-xs">
              <span className="font-semibold text-blue-900 block">Faculty & Staff Count</span>
              <p className="text-blue-800 mt-0.5">
                {staff.length > 0
                  ? `Tracking ${staff.length} registered faculty and support staff members in active service.`
                  : '0 faculty members registered yet. Add teachers via Staff Management to assign classes.'}
              </p>
            </div>

            <div className="rounded-lg bg-emerald-50 p-3 border border-emerald-200/80 text-xs">
              <span className="font-semibold text-emerald-900 block">Student Enrollment</span>
              <p className="text-emerald-800 mt-0.5">
                {students.length > 0
                  ? `${students.length} students enrolled in the school directory across classes 1 to 10.`
                  : '0 students enrolled. Director can register new admissions with unique IDs.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: School Records Summary & Recent Payments */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* School Records & Registry Overview */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <School className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">School Records &amp; Academic Overview</h3>
            </div>
            <span className="inline-flex items-center gap-1 rounded bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-700 border border-slate-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              Records Up to Date
            </span>
          </div>

          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-2.5">
                <span className="block text-lg font-bold text-slate-900">{students.length}</span>
                <span className="text-[11px] text-slate-500">Enrolled Students</span>
              </div>
              <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-2.5">
                <span className="block text-lg font-bold text-emerald-600">{payments.length}</span>
                <span className="text-[11px] text-slate-500">Fee Receipts</span>
              </div>
              <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-2.5">
                <span className="block text-lg font-bold text-indigo-600">{studentSheets.length}</span>
                <span className="text-[11px] text-slate-500">Attendance Musters</span>
              </div>
            </div>

            <div className="rounded-lg bg-slate-50 p-3 border border-slate-200/80 text-xs text-slate-600 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Academic Session</span>
                <span className="font-semibold text-slate-800">2026-2027</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Faculty Strength</span>
                <span className="font-semibold text-slate-800">{staff.length} Active Staff</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                All student and fee records synchronized
              </span>
              <button
                onClick={() => onNavigate('students')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
              >
                View Students &rarr;
              </button>
            </div>
          </div>
        </div>

        {/* Recent Fee Receipts */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">Recent Fee Receipts</h3>
            </div>
            <button
              onClick={() => onNavigate('fees')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Fee Register
            </button>
          </div>

          <div className="mt-3 divide-y divide-slate-100">
            {payments.slice(0, 4).map(receipt => (
              <div key={receipt.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-800 block">{receipt.studentName}</span>
                  <span className="text-[11px] text-slate-500">
                    {receipt.receiptNo} &bull; {receipt.class} ({receipt.section}) &bull; {receipt.paymentMethod}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-900 block">{formatINR(receipt.amount)}</span>
                  <span className="text-[11px] text-slate-400">{receipt.paymentDate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
