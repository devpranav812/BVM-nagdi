import React, { useState } from 'react';
import {
  Plus,
  Search,
  Edit2,
  UserX,
  UserCheck,
  Trash2,
  Phone,
  Mail,
  X,
  Save,
  Check,
  Key,
  Lock,
  Copy,
  ShieldCheck,
  AlertCircle,
  Share2,
  Monitor
} from 'lucide-react';
import { Staff, StaffRole, User } from '../../types';
import { StorageService } from '../../services/storageService';
import { formatINR, downloadCSV } from '../../utils/csvExport';

interface StaffManagementProps {
  currentUser: User;
}

export const StaffManagement: React.FC<StaffManagementProps> = ({ currentUser }) => {
  const isDirector = currentUser.role === 'director' || currentUser.role === 'admin';
  const isOperator = currentUser.role === 'operator';

  const [staffList, setStaffList] = useState<Staff[]>(() => StorageService.getStaff());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [staffToDelete, setStaffToDelete] = useState<Staff | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Staff credentials modal for Director to view and share login details
  const [credentialsModal, setCredentialsModal] = useState<{
    isOpen: boolean;
    isNew: boolean;
    name: string;
    username: string;
    email: string;
    password: string;
    role: string;
    department: string;
    phone?: string;
    assignedClass?: string;
  } | null>(null);

  const [copiedKey, setCopiedKey] = useState(false);

  const [formData, setFormData] = useState<Partial<Staff>>({
    id: '',
    schoolId: 'bvm-nagdi-01',
    employeeId: '',
    name: '',
    role: 'Teacher',
    department: '',
    phone: '',
    email: '',
    joiningDate: new Date().toISOString().split('T')[0],
    monthlySalary: 28000,
    status: 'active',
    qualification: '',
    assignedClass: 'Class 1',
    assignedSection: 'A'
  });

  const filteredStaff = staffList.filter(s => {
    if (selectedStatus !== 'all' && s.status !== selectedStatus) return false;
    if (selectedRole !== 'all' && s.role !== selectedRole) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.employeeId.toLowerCase().includes(q) ||
        s.department.toLowerCase().includes(q) ||
        s.phone.includes(q) ||
        s.email.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleOpenAddTeacher = () => {
    setEditingStaff(null);
    setFormData({
      id: `stf-${Date.now()}`,
      schoolId: 'bvm-nagdi-01',
      employeeId: `EMP-BVM-0${Math.floor(10 + Math.random() * 90)}`,
      name: '',
      role: 'Teacher',
      department: 'Mathematics',
      phone: '9829000000',
      email: '',
      joiningDate: new Date().toISOString().split('T')[0],
      monthlySalary: 28000,
      status: 'active',
      qualification: 'B.Sc., B.Ed.',
      assignedClass: 'Class 8',
      assignedSection: 'A'
    });
    setIsModalOpen(true);
  };

  const handleOpenAddComputerOperator = () => {
    setEditingStaff(null);
    setFormData({
      id: `stf-${Date.now()}`,
      schoolId: 'bvm-nagdi-01',
      employeeId: `EMP-BVM-OP${Math.floor(10 + Math.random() * 90)}`,
      name: '',
      role: 'Computer Operator',
      department: 'Data & Computer Administration',
      phone: '9829000000',
      email: '',
      joiningDate: new Date().toISOString().split('T')[0],
      monthlySalary: 25000,
      status: 'active',
      qualification: 'BCA / PGDCA / B.Sc. IT',
      assignedClass: 'All Classes',
      assignedSection: 'A'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (stf: Staff) => {
    setEditingStaff(stf);
    setFormData({
      ...stf,
      assignedClass: stf.assignedClass || 'Class 1',
      assignedSection: stf.assignedSection || 'A'
    });
    setIsModalOpen(true);
  };

  const handleToggleStatus = (stf: Staff) => {
    const updated = StorageService.toggleStaffStatus(stf.id);
    setStaffList(updated);
    const newStatus = stf.status === 'active' ? 'deactivated' : 'activated';
    setActionFeedback(`${stf.name} has been ${newStatus}.`);
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const handleDeleteStaff = (stf: Staff) => {
    setStaffToDelete(stf);
  };

  const handleViewStaffLogin = (stf: Staff) => {
    const creds = StorageService.getStaffCredentials(stf.id);
    const firstName = stf.name.trim().split(/\s+/)[0].replace(/[^a-zA-Z]/g, '') || 'Staff';
    const capName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();

    const username = creds?.username || (stf.phone || '').replace(/[^0-9]/g, '');
    const email = creds?.email || `${username}@bvmnagdi.internal`;
    const password = creds?.password || `${capName}@${Math.floor(1000 + Math.random() * 9000)}`;

    setCredentialsModal({
      isOpen: true,
      isNew: false,
      name: stf.name,
      username,
      email,
      password,
      role: stf.role,
      department: stf.department,
      phone: stf.phone,
      assignedClass: stf.assignedClass || 'All Classes'
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.employeeId?.trim() || !formData.phone?.trim()) {
      alert('Name, Employee ID, and 10-Digit Mobile Number are required.');
      return;
    }

    // Enforce salary security: Computer Person cannot modify staff salaries
    const finalSalary = isDirector
      ? (Number(formData.monthlySalary) || 28000)
      : (editingStaff ? editingStaff.monthlySalary : 28000);

    const isNewStaff = !editingStaff;

    const staffToSave: Staff = {
      ...(formData as Staff),
      monthlySalary: finalSalary
    };

    const updated = StorageService.saveStaff(staffToSave);
    setStaffList(updated);
    setIsModalOpen(false);

    // If new staff is assigned, show user login credentials to Director immediately to share with staff
    if (isNewStaff) {
      const creds = StorageService.getStaffCredentials(staffToSave.id);
      const firstName = staffToSave.name.trim().split(/\s+/)[0].replace(/[^a-zA-Z]/g, '') || 'Staff';
      const capName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();

      const username = creds?.username || (staffToSave.phone || '').replace(/[^0-9]/g, '');
      const generatedEmail = creds?.email || `${username}@bvmnagdi.internal`;
      const generatedPassword = creds?.password || `${capName}@${Math.floor(1000 + Math.random() * 9000)}`;

      setCredentialsModal({
        isOpen: true,
        isNew: true,
        name: staffToSave.name,
        username,
        email: generatedEmail,
        password: generatedPassword,
        role: staffToSave.role,
        department: staffToSave.department,
        phone: staffToSave.phone,
        assignedClass: staffToSave.assignedClass || 'All Classes'
      });
    }
  };

  const getCredentialsShareText = () => {
    if (!credentialsModal) return '';
    return `🏫 *Bhagwati Vidya Mandir Secondary School, Nagdi*
Staff Portal Login Credentials

Dear ${credentialsModal.name},
Your staff portal login has been authorized by School Director Ashish Joshi.

👤 *Name:* ${credentialsModal.name}
📌 *Role:* ${credentialsModal.role} (${credentialsModal.department})
🏫 *Assigned Class:* ${credentialsModal.assignedClass || 'All Classes'}
📱 *Login Mobile Number:* ${credentialsModal.phone}
🔑 *Unique Password:* ${credentialsModal.password}
🌐 *Portal:* ${window.location.origin}

*Login Instructions:*
Please open the portal, enter your 10-digit mobile number (${credentialsModal.phone}) and password to log in.`;
  };

  const handleCopyCredentials = () => {
    if (!credentialsModal) return;
    const text = getCredentialsShareText();
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  };

  const handleExportCSV = () => {
    const headers = [
      'Employee ID',
      'Full Name',
      'Role',
      'Department / Subject',
      'Phone',
      'Email',
      'Joining Date',
      'Monthly Salary (INR)',
      'Status',
      'Qualification'
    ];

    const rows = filteredStaff.map(s => [
      s.employeeId,
      s.name,
      s.role,
      s.department,
      s.phone,
      s.email,
      s.joiningDate,
      s.monthlySalary,
      s.status,
      s.qualification || ''
    ]);

    downloadCSV('BVM_Nagdi_Staff_Register', headers, rows);
  };

  const teacherCount = staffList.filter(s => s.role === 'Teacher').length;
  const activeCount = staffList.filter(s => s.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner */}
      {actionFeedback && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3.5 flex items-center justify-between text-xs text-emerald-800 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2 font-medium">
            <Check className="h-4 w-4 text-emerald-600" />
            <span>{actionFeedback}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-emerald-500 hover:text-emerald-800"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Faculty & Staff Management</h2>
          <p className="text-xs text-slate-500">
            Maintain teachers, subjects, designations, and active faculty status
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Export Register
          </button>
          <button
            id="btn-add-operator"
            type="button"
            onClick={handleOpenAddComputerOperator}
            className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-semibold text-indigo-700 shadow-2xs hover:bg-indigo-100 transition-colors cursor-pointer"
            title="Add a Computer Operator with access to data, fees, and registers"
          >
            <Monitor className="h-4 w-4 text-indigo-600" />
            <span>+ Add Computer Operator</span>
          </button>
          <button
            id="btn-add-teacher"
            onClick={handleOpenAddTeacher}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Teacher / Staff</span>
          </button>
        </div>
      </div>

      {/* Minimalist Overview Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600">
        <div className="flex items-center gap-6">
          <div>
            <span className="text-slate-400">Total Staff:</span>{' '}
            <strong className="text-slate-900 font-semibold">{staffList.length}</strong>
          </div>
          <div>
            <span className="text-slate-400">Teaching Faculty:</span>{' '}
            <strong className="text-slate-900 font-semibold">{teacherCount}</strong>
          </div>
          <div>
            <span className="text-slate-400">Active:</span>{' '}
            <strong className="text-slate-900 font-semibold">{activeCount}</strong>
          </div>
        </div>

        {/* Quick Role Filter */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSelectedRole('all')}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              selectedRole === 'all'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Roles
          </button>
          <button
            onClick={() => setSelectedRole('Teacher')}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              selectedRole === 'Teacher'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Teachers Only
          </button>
          <button
            onClick={() => setSelectedRole('Computer Operator')}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              selectedRole === 'Computer Operator'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Computer Operators
          </button>
        </div>
      </div>

      {/* Search & Status Filter */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2 relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name, emp id, department, phone..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
          />
        </div>

        <div>
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-700 focus:border-slate-900 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Staff Directory: Mobile Card View (No Horizontal Scroll) & Desktop Table */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xs">
        {/* Mobile View: Vertical Card Stack */}
        <div className="md:hidden divide-y divide-slate-100 p-3 space-y-3">
          {filteredStaff.map(stf => (
            <div key={stf.id} className="pt-3 first:pt-0 space-y-2 text-xs">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold text-slate-900 text-sm">{stf.name}</div>
                  <div className="text-[11px] text-slate-500">
                    {stf.role} &bull; {stf.department}
                  </div>
                  {stf.qualification && (
                    <div className="text-[11px] text-slate-400">Qual: {stf.qualification}</div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    stf.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${stf.status === 'active' ? 'bg-emerald-600' : 'bg-slate-400'}`} />
                    {stf.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                  <span className="font-mono text-[10px] text-slate-500">{stf.employeeId}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-slate-600 text-[11px] pt-1">
                <span>Monthly Salary: <strong className="font-mono text-slate-900">{formatINR(stf.monthlySalary)}</strong></span>
                <a
                  href={`tel:${stf.phone}`}
                  className="font-mono text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1"
                >
                  📞 {stf.phone}
                </a>
              </div>

              {/* Action Buttons Row */}
              <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleViewStaffLogin(stf)}
                  className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                  title="View Staff Portal Login"
                >
                  <Key className="h-3 w-3" />
                  <span>Login</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenEdit(stf)}
                  className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Edit2 className="h-3 w-3" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleStatus(stf)}
                  className={`inline-flex items-center gap-1 rounded border px-2.5 py-1 text-xs font-medium ${
                    stf.status === 'active'
                      ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  {stf.status === 'active' ? <UserX className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}
                  <span>{stf.status === 'active' ? 'Deactivate' : 'Activate'}</span>
                </button>
                {isDirector ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteStaff(stf)}
                    className="inline-flex items-center gap-1 rounded border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100"
                    title="Director: Remove Teacher / Staff"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Remove</span>
                  </button>
                ) : (
                  <span
                    className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-400 cursor-not-allowed"
                    title="Staff removal restricted to Director"
                  >
                    <Lock className="h-3 w-3 text-slate-400" />
                    <span>Protected</span>
                  </span>
                )}
              </div>
            </div>
          ))}

          {filteredStaff.length === 0 && (
            <div className="p-6 text-center text-slate-400 text-xs">
              No faculty or staff found matching the selected criteria.
            </div>
          )}
        </div>

        {/* Desktop View: Full Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50/80 text-slate-600 font-semibold">
              <tr>
                <th className="px-4 py-3 text-left">Emp ID</th>
                <th className="px-4 py-3 text-left">Name & Qualification</th>
                <th className="px-4 py-3 text-left">Role / Department</th>
                <th className="px-4 py-3 text-left">Phone & Email</th>
                <th className="px-4 py-3 text-right">Monthly Salary</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredStaff.map(stf => (
                <tr key={stf.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3 font-mono font-medium text-slate-600">
                    {stf.employeeId}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{stf.name}</div>
                    <div className="text-[11px] text-slate-400">{stf.qualification || 'Not Specified'}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-slate-800">{stf.role}</span>
                    <div className="text-[11px] text-slate-500">{stf.department}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-mono text-slate-700">{stf.phone}</div>
                    <div className="text-[11px] text-slate-400">{stf.email || '—'}</div>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900">
                    {formatINR(stf.monthlySalary)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      stf.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${stf.status === 'active' ? 'bg-emerald-600' : 'bg-slate-400'}`} />
                      {stf.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => handleViewStaffLogin(stf)}
                        className="rounded p-1 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-800 transition-colors"
                        title="View Staff Login Credentials (Share with Staff)"
                      >
                        <Key className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(stf)}
                        className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                        title="Edit Details"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(stf)}
                        className={`rounded p-1 ${
                          stf.status === 'active'
                            ? 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
                            : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                        title={stf.status === 'active' ? 'Deactivate' : 'Activate'}
                      >
                        {stf.status === 'active' ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                      </button>
                      {isDirector ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteStaff(stf)}
                          className="rounded p-1 text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                          title="Director Authorization: Remove Staff"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        <span
                          className="rounded p-1 text-slate-300 cursor-not-allowed inline-flex items-center"
                          title="Only Director Ashish Joshi has permission to remove faculty and staff"
                        >
                          <Lock className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredStaff.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No faculty or staff found matching the selected criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
              <h3 className="text-sm font-bold text-slate-900">
                {editingStaff ? 'Edit Faculty Details' : 'Add New Teacher / Staff'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Employee ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.employeeId}
                    onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono focus:border-slate-900 focus:outline-none"
                    placeholder="EMP-BVM-010"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-slate-900 focus:outline-none"
                    placeholder="e.g. Rameshwar Mahato"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Designation / Role *
                  </label>
                  <select
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value as StaffRole })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-slate-900 focus:outline-none"
                  >
                    <option value="Teacher">Teacher (Academic Faculty)</option>
                    <option value="Computer Operator">Computer Operator (Data, Admissions & Fee Desk)</option>
                    <option value="Accountant">Accountant</option>
                    <option value="Office Staff">Office Staff</option>
                    <option value="Support Staff">Support Staff</option>
                    <option value="Other">Administration / Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Subject / Department *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.department}
                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-slate-900 focus:outline-none"
                    placeholder="e.g. Mathematics, Science, Hindi"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Login Mobile Number (10 Digits) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono focus:border-slate-900 focus:outline-none"
                    placeholder="e.g. 9829123456"
                  />
                  <p className="mt-1 text-[11px] text-slate-500">
                    The staff member will strictly use this mobile number to log in to the portal.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assigned Class & Section *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={formData.assignedClass || 'Class 1'}
                      onChange={e => setFormData({ ...formData, assignedClass: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-slate-900 focus:outline-none"
                    >
                      <option value="Nursery">Nursery</option>
                      <option value="LKG">LKG</option>
                      <option value="UKG">UKG</option>
                      <option value="Class 1">Class 1</option>
                      <option value="Class 2">Class 2</option>
                      <option value="Class 3">Class 3</option>
                      <option value="Class 4">Class 4</option>
                      <option value="Class 5">Class 5</option>
                      <option value="Class 6">Class 6</option>
                      <option value="Class 7">Class 7</option>
                      <option value="Class 8">Class 8</option>
                      <option value="Class 9">Class 9</option>
                      <option value="Class 10">Class 10</option>
                      <option value="All Classes">All Classes (General Faculty / Operator)</option>
                    </select>
                    <select
                      value={formData.assignedSection || 'A'}
                      onChange={e => setFormData({ ...formData, assignedSection: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-slate-900 focus:outline-none"
                    >
                      <option value="A">Section A</option>
                      <option value="B">Section B</option>
                      <option value="C">Section C</option>
                    </select>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Teacher will have direct management of this class, plus access to all classes.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-slate-900 focus:outline-none"
                    placeholder="staff@bvmnagdi.edu.in"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Monthly Salary (INR) *
                    </label>
                    {isDirector ? (
                      <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
                        Director Authorized
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 flex items-center gap-0.5">
                        <Lock className="h-2.5 w-2.5" /> Read-Only
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    required
                    disabled={!isDirector}
                    readOnly={!isDirector}
                    value={formData.monthlySalary}
                    onChange={e => setFormData({ ...formData, monthlySalary: Number(e.target.value) })}
                    className={`w-full rounded-lg border px-3 py-2 text-xs focus:outline-none ${
                      !isDirector
                        ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed font-medium'
                        : 'border-slate-300 focus:border-slate-900 bg-white text-slate-900'
                    }`}
                  />
                  {!isDirector && (
                    <p className="mt-1 text-[10px] text-amber-600">
                      Staff salary is controlled exclusively by School Director Ashish Joshi.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Joining Date
                  </label>
                  <input
                    type="date"
                    value={formData.joiningDate}
                    onChange={e => setFormData({ ...formData, joiningDate: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-slate-900 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Qualifications & Degrees
                  </label>
                  <input
                    type="text"
                    value={formData.qualification}
                    onChange={e => setFormData({ ...formData, qualification: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-slate-900 focus:outline-none"
                    placeholder="e.g. M.Sc. Mathematics, B.Ed."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Record</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Staff Portal Login Credentials Modal */}
      {credentialsModal && credentialsModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-emerald-100 bg-emerald-50 px-6 py-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold">
                  <Key className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {credentialsModal.isNew ? 'New Staff Credentials Assigned' : 'Staff Portal Login Credentials'}
                  </h3>
                  <p className="text-[11px] text-emerald-700">
                    {credentialsModal.isNew ? 'Ready to share with assigned staff member' : 'Active system login credentials'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCredentialsModal(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-emerald-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="rounded-lg bg-emerald-50/70 border border-emerald-200 p-3 text-xs text-emerald-800 flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Director Credential Share:</strong> Copy or share these login details directly with the staff member. They will use them to sign in and perform their daily duties.
                </div>
              </div>

              <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/70 p-4 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Staff Member</span>
                  <strong className="text-slate-900 text-sm">{credentialsModal.name}</strong>
                  <span className="text-[11px] text-slate-500 ml-2 font-mono">({credentialsModal.department})</span>
                </div>

                <div className="border-t border-slate-200 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700 block text-[11px] font-semibold">Login Mobile Number</span>
                    <span className="text-[10px] text-indigo-700 bg-indigo-100 font-bold px-2 py-0.5 rounded">Enter at Login</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <code className="text-sm font-mono font-bold text-indigo-900 bg-white px-2.5 py-1.5 rounded border border-indigo-300 w-full text-center">
                      {credentialsModal.phone || credentialsModal.username}
                    </code>
                  </div>
                  <p className="mt-1 text-[10px] text-slate-500 text-center">
                    Staff member will log in using this 10-digit mobile number.
                  </p>
                </div>

                <div className="border-t border-slate-200 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700 block text-[11px] font-semibold">Unique Password</span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-100 font-bold px-2 py-0.5 rounded">Name + 4 digits</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <code className="text-sm font-mono font-bold text-emerald-900 bg-white px-2.5 py-1.5 rounded border border-emerald-300 w-full text-center">
                      {credentialsModal.password}
                    </code>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-2 grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Assigned Class</span>
                    <span className="inline-block mt-0.5 rounded bg-slate-200/80 px-2 py-0.5 font-bold text-slate-800 text-[11px]">
                      {credentialsModal.assignedClass || 'All Classes'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Assigned Role</span>
                    <span className="inline-block mt-0.5 rounded bg-indigo-50 border border-indigo-200 px-2 py-0.5 font-semibold text-indigo-700 text-[11px]">
                      {credentialsModal.role}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyCredentials}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                  >
                    {copiedKey ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-slate-500" />
                        <span>Copy Details</span>
                      </>
                    )}
                  </button>

                  <a
                    href={`https://wa.me/${credentialsModal.phone ? (credentialsModal.phone.replace(/[^0-9]/g, '').length === 10 ? `91${credentialsModal.phone.replace(/[^0-9]/g, '')}` : credentialsModal.phone.replace(/[^0-9]/g, '')) : ''}?text=${encodeURIComponent(getCredentialsShareText())}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition-colors"
                    title="Send credentials directly via WhatsApp"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    <span>Share on WhatsApp</span>
                  </a>
                </div>

                <button
                  type="button"
                  onClick={() => setCredentialsModal(null)}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete / Remove Staff Confirmation Modal (No window.confirm, 100% works in iframes) */}
      {staffToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="h-5 w-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Remove Faculty Member?</h3>
                <p className="text-xs text-slate-500">Director Authorization Required</p>
              </div>
            </div>

            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3.5 my-4 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Faculty Name:</span>
                <strong className="text-slate-900 font-bold">{staffToDelete.name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Role &amp; Subject:</span>
                <span className="text-slate-700">{staffToDelete.role} ({staffToDelete.department})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Login Mobile Number:</span>
                <span className="font-mono text-slate-900 font-bold bg-white px-2 py-0.5 rounded border border-slate-200">
                  {staffToDelete.phone}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Employee ID:</span>
                <span className="font-mono text-slate-700">{staffToDelete.employeeId}</span>
              </div>
            </div>

            <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 mb-5 text-xs text-rose-700 leading-relaxed font-medium">
              ⚠️ <strong>Permanent Revocation:</strong> This staff member will be removed from all faculty registers. Their mobile number login ({staffToDelete.phone}) will be deleted from the database and permanently barred from ever accessing the school portal again.
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setStaffToDelete(null)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-remove-staff"
                onClick={() => {
                  const toRemove = staffToDelete;
                  const updated = StorageService.deleteStaff(toRemove.id);
                  setStaffList(updated);
                  setStaffToDelete(null);
                  setActionFeedback(`Staff member ${toRemove.name} (${toRemove.phone}) permanently removed. Portal login revoked.`);
                  setTimeout(() => setActionFeedback(null), 5000);
                }}
                className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-rose-700 transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Permanently Remove &amp; Revoke</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
