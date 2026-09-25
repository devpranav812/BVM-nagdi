import React, { useState } from 'react';
import {
  Search,
  Plus,
  Upload,
  Download,
  Filter,
  Eye,
  Edit2,
  UserX,
  UserCheck,
  GraduationCap,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  X
} from 'lucide-react';
import { Student, User } from '../../types';
import { StorageService } from '../../services/storageService';
import { StudentProfileModal } from './StudentProfileModal';
import { StudentFormModal } from './StudentFormModal';
import { StudentImportModal } from './StudentImportModal';
import { downloadCSV } from '../../utils/csvExport';

interface StudentManagementProps {
  currentUser: User;
  onViewReceipt?: (receiptId: string) => void;
}

export const StudentManagement: React.FC<StudentManagementProps> = ({
  currentUser,
  onViewReceipt
}) => {
  const [students, setStudents] = useState<Student[]>(() => StorageService.getStudents());
  const classes = StorageService.getClasses();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('active');

  const [activeProfileStudent, setActiveProfileStudent] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deleteConfirmStudent, setDeleteConfirmStudent] = useState<Student | null>(null);
  const [feedbackNotice, setFeedbackNotice] = useState<{ message: string; type: 'success' | 'warning' } | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  // Computer Person (operator/admin) and Director have full student management & admission capabilities
  const canEdit = currentUser.role === 'operator' || currentUser.role === 'admin' || currentUser.role === 'director';
  const isTeacher = currentUser.role === 'teacher';

  // Find assigned classes for teacher
  const teacherClasses = classes.filter(
    c => (c.classTeacher && c.classTeacher.trim().toLowerCase() === currentUser.name.trim().toLowerCase()) ||
         (currentUser.assignedClasses && currentUser.assignedClasses.some(ac => ac.toLowerCase().includes(c.name.toLowerCase()))) ||
         (currentUser.assignedClass && c.name.toLowerCase() === currentUser.assignedClass.toLowerCase())
  );
  const teacherClassNames = isTeacher
    ? (teacherClasses.length > 0 ? teacherClasses.map(c => c.name) : (classes.length > 0 ? [classes[0].name] : ['Class 1']))
    : [];

  // Filter students
  const filteredStudents = students.filter(st => {
    // "only the assigned teacher have access to his class"
    if (isTeacher && !teacherClassNames.includes(st.class)) return false;

    if (selectedStatus !== 'all' && st.status !== selectedStatus) return false;
    if (selectedClass !== 'all' && st.class !== selectedClass) return false;
    if (selectedSection !== 'all' && st.section !== selectedSection) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = st.fullName.toLowerCase().includes(q);
      const matchAdm = st.admissionNo.toLowerCase().includes(q);
      const matchPhone = st.parentPhone.includes(q);
      const matchParent = st.parentName.toLowerCase().includes(q);
      const matchRoll = st.rollNo.includes(q);
      return matchName || matchAdm || matchPhone || matchParent || matchRoll;
    }
    return true;
  });

  const handleToggleStatus = (student: Student) => {
    const updated = StorageService.toggleStudentStatus(student.id);
    setStudents(updated);
    const newStatus = student.status === 'active' ? 'Inactive' : 'Active';
    setFeedbackNotice({
      message: `${student.fullName} has been marked ${newStatus}. ${
        student.status === 'active' && selectedStatus === 'active'
          ? '(Change status filter to "All Statuses" or "Inactive" to view)'
          : ''
      }`,
      type: student.status === 'active' ? 'warning' : 'success'
    });
    setTimeout(() => setFeedbackNotice(null), 5000);
  };

  const handleExecuteDelete = () => {
    if (!deleteConfirmStudent) return;
    const updated = StorageService.deleteStudent(deleteConfirmStudent.id);
    setStudents(updated);
    setFeedbackNotice({
      message: `Student ${deleteConfirmStudent.fullName} (Adm: ${deleteConfirmStudent.admissionNo}) was permanently removed.`,
      type: 'warning'
    });
    setDeleteConfirmStudent(null);
    setTimeout(() => setFeedbackNotice(null), 5000);
  };

  const handleSaveStudent = (saved: Student) => {
    const updated = StorageService.saveStudent(saved);
    setStudents(updated);
    setIsFormOpen(false);
    setEditingStudent(null);
    setFeedbackNotice({
      message: `Student ${saved.fullName} saved successfully.`,
      type: 'success'
    });
    setTimeout(() => setFeedbackNotice(null), 4000);
  };

  const handleExportCSV = () => {
    const headers = [
      'Admission No',
      'Full Name',
      'Class',
      'Section',
      'Roll No',
      'Date of Birth',
      'Gender',
      'Parent Name',
      'Parent Phone',
      'Address',
      'Admission Date',
      'Status',
      'Attendance %',
      'Previous Year Pending Fee'
    ];

    const rows = filteredStudents.map(s => [
      s.admissionNo,
      s.fullName,
      s.class,
      s.section,
      s.rollNo,
      s.dob,
      s.gender,
      s.parentName,
      s.parentPhone,
      s.address,
      s.admissionDate,
      s.status,
      s.attendancePercentage !== undefined ? `${s.attendancePercentage}%` : 'Not Marked',
      s.previousYearPendingFee || 0
    ]);

    downloadCSV('BVM_Nagdi_Students_Roster', headers, rows);
  };

  const handleImportSuccess = (count: number) => {
    setIsImportOpen(false);
    setStudents(StorageService.getStudents());
    setFeedbackNotice({
      message: `Successfully imported ${count} student records into BVM Secondary School!`,
      type: 'success'
    });
    setTimeout(() => setFeedbackNotice(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            {isTeacher ? `Class Roster — ${currentUser.name}` : 'Student Directory'}
          </h2>
          <p className="text-xs text-slate-500">
            {isTeacher
              ? `Students enrolled in your assigned class (${teacherClassNames.join(', ')})`
              : 'Manage student enrollments, rosters, profiles, and records'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-export-students"
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
          >
            <Download className="h-4 w-4 text-slate-500" />
            <span>Export CSV</span>
          </button>

          {canEdit && (
            <>
              <button
                id="btn-import-students"
                type="button"
                onClick={() => setIsImportOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
              >
                <Upload className="h-4 w-4 text-indigo-600" />
                <span>Import CSV</span>
              </button>

              <button
                id="btn-add-student"
                type="button"
                onClick={() => {
                  setEditingStudent(null);
                  setIsFormOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Add Student</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Feedback Notice Banner */}
      {feedbackNotice && (
        <div
          className={`flex items-center justify-between rounded-lg p-3 text-xs border ${
            feedbackNotice.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackNotice.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            )}
            <span>{feedbackNotice.message}</span>
          </div>
          <button
            onClick={() => setFeedbackNotice(null)}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {/* Search Box */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                id="search-students-input"
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by name, adm no, roll, phone..."
                className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-xs placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Class Filter */}
          <div>
            <select
              id="filter-student-class"
              value={isTeacher ? (teacherClassNames[0] || 'Class 8') : selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              disabled={isTeacher && teacherClassNames.length <= 1}
              className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs text-slate-700 focus:border-indigo-600 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
            >
              {!isTeacher && <option value="all">All Classes</option>}
              {(isTeacher ? classes.filter(c => teacherClassNames.includes(c.name)) : classes).map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Section Filter */}
          <div>
            <select
              id="filter-student-section"
              value={selectedSection}
              onChange={e => setSelectedSection(e.target.value)}
              className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs text-slate-700 focus:border-indigo-600 focus:outline-none"
            >
              <option value="all">All Sections</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              id="filter-student-status"
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs text-slate-700 focus:border-indigo-600 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>

        {/* Results Count indicator */}
        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
          <span>Showing <strong>{filteredStudents.length}</strong> students</span>
          {(searchQuery || selectedClass !== 'all' || selectedSection !== 'all' || selectedStatus !== 'active') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedClass('all');
                setSelectedSection('all');
                setSelectedStatus('active');
              }}
              className="text-indigo-600 hover:underline font-medium"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Student List Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs">
        {filteredStudents.length === 0 ? (
          <div className="p-8 text-center">
            <GraduationCap className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-2 text-sm font-semibold text-slate-900">No students found</h3>
            <p className="mt-1 text-xs text-slate-500">
              Try adjusting your search terms or filter selection.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold">
                <tr>
                  <th className="px-4 py-3 text-left">Adm No</th>
                  <th className="px-4 py-3 text-left">Student Name</th>
                  <th className="px-4 py-3 text-left">Class & Sec</th>
                  <th className="px-4 py-3 text-left">Roll No</th>
                  <th className="px-4 py-3 text-left">Parent Contact</th>
                  <th className="px-4 py-3 text-center">Attendance</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredStudents.map(student => (
                  <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-slate-700">
                      {student.admissionNo}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{student.fullName}</div>
                      <div className="text-[11px] text-slate-400">DOB: {student.dob} &bull; {student.gender}</div>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700">
                      {student.class} - {student.section}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">
                      #{student.rollNo}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-slate-800 font-medium">{student.parentName}</div>
                      <div className="font-mono text-indigo-600">{student.parentPhone}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {student.attendancePercentage !== undefined ? (
                        <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700 border border-emerald-200">
                          {student.attendancePercentage}%
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-500 border border-slate-200 text-[10px]">
                          Not Marked
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex rounded-full px-2 py-0.5 font-semibold uppercase text-[10px] ${
                        student.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {student.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View Profile */}
                        <button
                          id={`btn-view-student-${student.id}`}
                          onClick={() => setActiveProfileStudent(student)}
                          className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 cursor-pointer"
                          title="View Profile"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {/* Edit Student */}
                        {canEdit && (
                          <button
                            id={`btn-edit-student-${student.id}`}
                            onClick={() => {
                              setEditingStudent(student);
                              setIsFormOpen(true);
                            }}
                            className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 cursor-pointer"
                            title="Edit Student"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        )}

                        {/* Deactivate/Activate */}
                        {canEdit && (
                          <button
                            id={`btn-toggle-student-${student.id}`}
                            onClick={() => handleToggleStatus(student)}
                            className={`rounded p-1.5 cursor-pointer ${
                              student.status === 'active'
                                ? 'text-slate-400 hover:bg-amber-50 hover:text-amber-600'
                                : 'text-emerald-500 hover:bg-emerald-50 hover:text-emerald-700'
                            }`}
                            title={student.status === 'active' ? 'Mark Student Inactive' : 'Mark Student Active'}
                          >
                            {student.status === 'active' ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                          </button>
                        )}

                        {/* Delete Student */}
                        {canEdit && (
                          <button
                            id={`btn-delete-student-${student.id}`}
                            onClick={() => setDeleteConfirmStudent(student)}
                            className="rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer transition-colors"
                            title="Permanently Delete Student Record"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-rose-100 bg-rose-50 px-6 py-4">
              <div className="flex items-center gap-2 text-rose-700">
                <AlertTriangle className="h-5 w-5" />
                <h3 className="text-base font-bold">Permanently Delete Student</h3>
              </div>
              <button
                onClick={() => setDeleteConfirmStudent(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-xs text-slate-600">
                Are you sure you want to permanently delete student record for{' '}
                <strong className="text-slate-900">{deleteConfirmStudent.fullName}</strong>?
              </p>
              <div className="rounded-lg bg-slate-50 p-3 text-xs space-y-1 font-mono text-slate-700 border border-slate-200">
                <div>Admission No: <strong>{deleteConfirmStudent.admissionNo}</strong></div>
                <div>Class & Sec: {deleteConfirmStudent.class} - {deleteConfirmStudent.section}</div>
                <div>Parent Phone: {deleteConfirmStudent.parentPhone}</div>
              </div>
              <p className="text-[11px] text-rose-600 font-medium">
                Warning: This action cannot be undone. All linked student profile records will be permanently removed.
              </p>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmStudent(null)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-rose-700 cursor-pointer"
              >
                Yes, Delete Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {activeProfileStudent && (
        <StudentProfileModal
          student={activeProfileStudent}
          onClose={() => setActiveProfileStudent(null)}
          onViewReceipt={onViewReceipt}
          showFees={!isTeacher}
        />
      )}

      {/* Form Modal (Add / Edit) */}
      {isFormOpen && (
        <StudentFormModal
          initialData={editingStudent}
          onClose={() => {
            setIsFormOpen(false);
            setEditingStudent(null);
          }}
          onSaved={handleSaveStudent}
        />
      )}

      {/* CSV Import Modal */}
      {isImportOpen && (
        <StudentImportModal
          onClose={() => setIsImportOpen(false)}
          onImportSuccess={handleImportSuccess}
          existingAdmissionNos={students.map(s => s.admissionNo)}
        />
      )}
    </div>
  );
};
