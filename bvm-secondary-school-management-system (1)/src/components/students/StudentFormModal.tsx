import React, { useState } from 'react';
import { X, Save, UserPlus, RefreshCw, ShieldCheck } from 'lucide-react';
import { Student } from '../../types';
import { StorageService } from '../../services/storageService';

interface StudentFormModalProps {
  initialData?: Student | null;
  onClose: () => void;
  onSaved: (student: Student) => void;
}

export const StudentFormModal: React.FC<StudentFormModalProps> = ({
  initialData,
  onClose,
  onSaved
}) => {
  const isEditing = Boolean(initialData);
  const classes = StorageService.getClasses();

  const [formData, setFormData] = useState<Partial<Student>>({
    id: initialData?.id || `std-${Date.now()}`,
    schoolId: 'bvm-nagdi-01',
    admissionNo: initialData?.admissionNo || StorageService.getNextAdmissionNumber(),
    fullName: initialData?.fullName || '',
    dob: initialData?.dob || '2012-01-01',
    gender: initialData?.gender || 'Male',
    class: initialData?.class || (classes[0]?.name || 'Class 1'),
    section: initialData?.section || 'A',
    rollNo: initialData?.rollNo || '01',
    parentName: initialData?.parentName || '',
    parentPhone: initialData?.parentPhone || '',
    address: initialData?.address || 'Nagdi, Arnod, Pratapgarh, Rajasthan - 312615',
    admissionDate: initialData?.admissionDate || new Date().toISOString().split('T')[0],
    status: initialData?.status || 'active',
    bloodGroup: initialData?.bloodGroup || 'O+',
    attendancePercentage: initialData?.attendancePercentage,
    previousYearPendingFee: initialData?.previousYearPendingFee || 0
  });

  const [error, setError] = useState('');

  const handleGenerateNewUniqueId = () => {
    const nextId = StorageService.getNextAdmissionNumber();
    setFormData(prev => ({ ...prev, admissionNo: nextId }));
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName?.trim()) {
      setError('Please provide the student full name');
      return;
    }
    if (!formData.admissionNo?.trim()) {
      setError('Admission number is required');
      return;
    }

    // Enforce unique Student Admission ID
    if (StorageService.isAdmissionNoTaken(formData.admissionNo.trim(), initialData?.id)) {
      setError(`Admission Number "${formData.admissionNo.trim()}" is already assigned to an existing student. Every student must have a unique ID.`);
      return;
    }

    if (!formData.parentPhone?.trim()) {
      setError('Parent contact phone number is required');
      return;
    }

    onSaved(formData as Student);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-xl rounded-xl bg-white shadow-xl border border-slate-200 overflow-hidden my-8">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">
              {isEditing ? 'Edit Student Record' : 'Register New Student'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-600 focus:outline-none"
                placeholder="e.g. Rahul Kumar Sahu"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Unique Student Admission ID *
                </label>
                {!isEditing && (
                  <button
                    type="button"
                    onClick={handleGenerateNewUniqueId}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium"
                    title="Generate next sequential unique student ID"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>Auto-Generate</span>
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={formData.admissionNo}
                  onChange={e => setFormData({ ...formData, admissionNo: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:border-indigo-600 focus:outline-none bg-slate-50/50"
                  placeholder="BVM-2026-001"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-emerald-600" />
                Guaranteed unique ID for student records and fees
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Class *
              </label>
              <select
                value={formData.class}
                onChange={e => setFormData({ ...formData, class: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-600 focus:outline-none"
              >
                {classes.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Section *
                </label>
                <select
                  value={formData.section}
                  onChange={e => setFormData({ ...formData, section: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-600 focus:outline-none"
                >
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Roll No *
                </label>
                <input
                  type="text"
                  required
                  value={formData.rollNo}
                  onChange={e => setFormData({ ...formData, rollNo: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-600 focus:outline-none"
                  placeholder="01"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date of Birth *
              </label>
              <input
                type="date"
                required
                value={formData.dob}
                onChange={e => setFormData({ ...formData, dob: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Gender *
              </label>
              <select
                value={formData.gender}
                onChange={e => setFormData({ ...formData, gender: e.target.value as any })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-600 focus:outline-none"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Parent / Guardian Name *
              </label>
              <input
                type="text"
                required
                value={formData.parentName}
                onChange={e => setFormData({ ...formData, parentName: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-600 focus:outline-none"
                placeholder="Father or Mother Name"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Parent Phone Number *
              </label>
              <input
                type="tel"
                required
                value={formData.parentPhone}
                onChange={e => setFormData({ ...formData, parentPhone: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono focus:border-indigo-600 focus:outline-none"
                placeholder="9835xxxxxx"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Admission Date
              </label>
              <input
                type="date"
                value={formData.admissionDate}
                onChange={e => setFormData({ ...formData, admissionDate: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Blood Group / Medical
              </label>
              <select
                value={formData.bloodGroup}
                onChange={e => setFormData({ ...formData, bloodGroup: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-600 focus:outline-none"
              >
                <option value="O+">O+</option>
                <option value="A+">A+</option>
                <option value="B+">B+</option>
                <option value="AB+">AB+</option>
                <option value="O-">O-</option>
                <option value="A-">A-</option>
                <option value="B-">B-</option>
                <option value="AB-">AB-</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Permanent Address *
              </label>
              <textarea
                rows={2}
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-600 focus:outline-none"
                placeholder="Village / Mohalla, Post, PS, Dist"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Student Enrollment Status
              </label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-600 focus:outline-none"
              >
                <option value="active">Active (Currently Enrolled)</option>
                <option value="inactive">Inactive / Deactivated</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Previous Year Pending Fees / Arrears (INR)
              </label>
              <input
                type="number"
                min="0"
                value={formData.previousYearPendingFee ?? 0}
                onChange={e => setFormData({ ...formData, previousYearPendingFee: Math.max(0, Number(e.target.value) || 0) })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:border-indigo-600 focus:outline-none"
                placeholder="0"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Backlog dues carried forward from earlier academic session
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
            >
              <Save className="h-4 w-4" />
              <span>{isEditing ? 'Update Student' : 'Save Student Record'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
