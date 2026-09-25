import React, { useState } from 'react';
import { Plus, Users, Edit3, Trash2, GraduationCap, X, Check } from 'lucide-react';
import { ClassSection, Student } from '../../types';
import { StorageService } from '../../services/storageService';

export const ClassManagement: React.FC = () => {
  const [classes, setClasses] = useState<ClassSection[]>(() => StorageService.getClasses());
  const students = StorageService.getStudents();
  const staff = StorageService.getStaff().filter(s => s.role === 'Teacher');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassSection | null>(null);

  // Form State
  const [className, setClassName] = useState('');
  const [selectedSections, setSelectedSections] = useState<string[]>(['A', 'B']);
  const [customSectionInput, setCustomSectionInput] = useState('');
  const [classTeacher, setClassTeacher] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [capacity, setCapacity] = useState('45');

  const STANDARD_SECTIONS = ['A', 'B', 'C', 'D', 'E', 'F'];

  // Selected Class Roster Modal
  const [rosterClass, setRosterClass] = useState<ClassSection | null>(null);
  const [rosterSection, setRosterSection] = useState<string>('A');

  const handleOpenAdd = () => {
    setEditingClass(null);
    setClassName('');
    setSelectedSections(['A', 'B']);
    setCustomSectionInput('');
    setClassTeacher(staff[0]?.name || '');
    setRoomNumber('Room 205');
    setCapacity('45');
    setIsModalOpen(true);
  };

  const handleQuickAssignTeacher = (classId: string, teacherName: string) => {
    const updated = StorageService.assignTeacherToClass(classId, teacherName);
    setClasses(updated);
  };

  const handleOpenEdit = (cls: ClassSection) => {
    setEditingClass(cls);
    setClassName(cls.name);
    setSelectedSections(cls.sections && cls.sections.length > 0 ? [...cls.sections] : ['A']);
    setCustomSectionInput('');
    setClassTeacher(cls.classTeacher || '');
    setRoomNumber(cls.roomNumber || '');
    setCapacity(String(cls.capacity || 45));
    setIsModalOpen(true);
  };

  const toggleSection = (sec: string) => {
    setSelectedSections(prev => {
      if (prev.includes(sec)) {
        if (prev.length === 1) return prev; // Keep at least one section
        return prev.filter(s => s !== sec);
      } else {
        return [...prev, sec].sort();
      }
    });
  };

  const handleAddCustomSection = () => {
    const trimmed = customSectionInput.trim().toUpperCase();
    if (!trimmed) return;
    if (!selectedSections.includes(trimmed)) {
      setSelectedSections(prev => [...prev, trimmed]);
    }
    setCustomSectionInput('');
  };

  const removeSection = (sec: string) => {
    if (selectedSections.length === 1) return;
    setSelectedSections(prev => prev.filter(s => s !== sec));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim()) return;

    const sections = selectedSections.length > 0 ? selectedSections : ['A'];

    const newClass: ClassSection = {
      id: editingClass ? editingClass.id : `cls-${Date.now()}`,
      schoolId: 'bvm-nagdi-01',
      name: className.trim(),
      sections,
      classTeacher,
      roomNumber,
      capacity: Number(capacity) || 45
    };

    const updated = StorageService.saveClass(newClass);
    setClasses(updated);
    setIsModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Delete ${name}? Enrolled students will remain in the database.`)) {
      const updated = StorageService.deleteClass(id);
      setClasses(updated);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Classes & Sections</h2>
          <p className="text-xs text-slate-500">
            Academic grades, sections, student capacities, and assigned faculty class teachers
          </p>
        </div>

        <button
          id="btn-add-class"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Class</span>
        </button>
      </div>

      {/* Grid of Classes */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {classes.map(cls => {
          const enrolledStudents = students.filter(s => s.class === cls.name && s.status === 'active');

          return (
            <div
              key={cls.id}
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-2xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{cls.name}</h3>
                    <p className="text-xs text-slate-400">{cls.roomNumber || 'Room N/A'}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(cls)}
                      className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      title="Edit Class"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(cls.id, cls.name)}
                      className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                      title="Delete Class"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-3.5 space-y-2.5 text-xs">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-slate-500 font-medium">Class Teacher:</span>
                      {cls.classTeacher ? (
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium border border-emerald-200">
                          Assigned
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-medium border border-amber-200">
                          Unassigned
                        </span>
                      )}
                    </div>
                    <select
                      id={`class-teacher-select-${cls.id}`}
                      value={cls.classTeacher || ''}
                      onChange={e => handleQuickAssignTeacher(cls.id, e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:border-slate-900 focus:bg-white focus:outline-none"
                    >
                      <option value="">-- No Teacher Assigned --</option>
                      {staff.map(s => (
                        <option key={s.id} value={s.name}>
                          {s.name} ({s.department})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <span className="text-slate-400 block mb-1">Sections:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {cls.sections.map(sec => {
                        const secCount = enrolledStudents.filter(s => s.section === sec).length;
                        return (
                          <span
                            key={sec}
                            className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 border border-slate-200"
                          >
                            Sec {sec}: {secCount} students
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 text-slate-400">
                    <span>Enrolled: <strong className="text-slate-800">{enrolledStudents.length}</strong></span>
                    <span>Max: <strong className="text-slate-800">{(cls.capacity || 45) * cls.sections.length}</strong></span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <button
                  onClick={() => {
                    setRosterClass(cls);
                    setRosterSection(cls.sections[0] || 'A');
                  }}
                  className="w-full rounded-lg border border-slate-200 bg-white py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Users className="h-3.5 w-3.5" />
                  <span>View Student Roster</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Class Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
              <h3 className="text-sm font-bold text-slate-900">
                {editingClass ? 'Edit Class Details' : 'Create New Class'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Class Name *
                </label>
                <input
                  type="text"
                  required
                  value={className}
                  onChange={e => setClassName(e.target.value)}
                  placeholder="e.g. Class 8 or Class 11 Science"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-600 focus:outline-none"
                />
              </div>

              {/* Complete Section Options */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">
                    Section Options *
                  </label>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {selectedSections.length} section{selectedSections.length !== 1 ? 's' : ''} configured
                  </span>
                </div>

                {/* Standard Sections Selection Grid */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {STANDARD_SECTIONS.map(sec => {
                    const isSelected = selectedSections.includes(sec);
                    return (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => toggleSection(sec)}
                        className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <span className="font-bold text-xs">Sec {sec}</span>
                        <span className="text-[10px] mt-0.5 opacity-80">
                          {isSelected ? '✓ Active' : '+ Enable'}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Add Custom / Additional Section */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={customSectionInput}
                    onChange={e => setCustomSectionInput(e.target.value)}
                    placeholder="Custom section (e.g. G, Hindi)"
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSection}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Add Section
                  </button>
                </div>

                {/* Active Section Badges */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-slate-400 mr-1">Active:</span>
                  {selectedSections.map(sec => (
                    <span
                      key={sec}
                      className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-800 border border-slate-200"
                    >
                      <span>Section {sec}</span>
                      {selectedSections.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSection(sec)}
                          className="text-slate-400 hover:text-slate-700 ml-0.5 text-xs leading-none"
                          title={`Remove Section ${sec}`}
                        >
                          &times;
                        </button>
                      )}
                    </span>
                  ))}
                </div>

                <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  Total Capacity: <strong className="text-slate-800 font-semibold">{selectedSections.length * (Number(capacity) || 45)} students</strong> ({capacity || 45} per section)
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assigned Class Teacher
                </label>
                <select
                  value={classTeacher}
                  onChange={e => setClassTeacher(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-600 focus:outline-none"
                >
                  <option value="">Select Teacher</option>
                  {staff.map(s => (
                    <option key={s.id} value={s.name}>{s.name} ({s.department})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Room Number
                  </label>
                  <input
                    type="text"
                    value={roomNumber}
                    onChange={e => setRoomNumber(e.target.value)}
                    placeholder="e.g. Room 201"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Section Capacity
                  </label>
                  <input
                    type="number"
                    value={capacity}
                    onChange={e => setCapacity(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800"
                >
                  Save Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Roster Viewer Modal */}
      {rosterClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {rosterClass.name} - Section {rosterSection} Roster
                </h3>
                <p className="text-xs text-slate-500">
                  Class Teacher: {rosterClass.classTeacher || 'Unassigned'} &bull; {rosterClass.roomNumber}
                </p>
              </div>
              <button
                onClick={() => setRosterClass(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Section Tabs */}
              <div className="flex gap-2 border-b border-slate-100 pb-2">
                {rosterClass.sections.map(sec => (
                  <button
                    key={sec}
                    onClick={() => setRosterSection(sec)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      rosterSection === sec
                        ? 'bg-slate-900 text-white'
                        : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Section {sec}
                  </button>
                ))}
              </div>

              {/* Students in this Section */}
              {(() => {
                const sectionStudents = students.filter(
                  s => s.class === rosterClass.name && s.section === rosterSection && s.status === 'active'
                );

                if (sectionStudents.length === 0) {
                  return (
                    <div className="py-8 text-center text-xs text-slate-500">
                      No students actively enrolled in {rosterClass.name} - Section {rosterSection}.
                    </div>
                  );
                }

                return (
                  <>
                    {/* Mobile Card List: No Horizontal Scroll */}
                    <div className="md:hidden space-y-2">
                      {sectionStudents.map(s => (
                        <div key={s.id} className="rounded-lg border border-slate-200 bg-white p-3 text-xs space-y-1.5 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                                #{s.rollNo}
                              </span>
                              <span className="font-semibold text-slate-900">{s.fullName}</span>
                            </div>
                            <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 text-[11px]">
                              {s.attendancePercentage || 94}% att.
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center justify-between text-slate-500 text-[11px] pt-0.5">
                            <span>Adm: <span className="font-mono text-slate-700">{s.admissionNo}</span></span>
                            <span>Guardian: <span className="text-slate-700">{s.parentName}</span></span>
                          </div>
                          <div className="pt-0.5">
                            <a
                              href={`tel:${s.parentPhone}`}
                              className="text-[11px] text-slate-600 hover:text-slate-900 font-medium inline-flex items-center gap-1"
                            >
                              📞 {s.parentPhone}
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-200 text-xs">
                        <thead className="bg-slate-50 text-slate-600 font-semibold">
                          <tr>
                            <th className="px-3 py-2 text-left">Roll</th>
                            <th className="px-3 py-2 text-left">Adm No</th>
                            <th className="px-3 py-2 text-left">Student Name</th>
                            <th className="px-3 py-2 text-left">Parent Contact</th>
                            <th className="px-3 py-2 text-right">Attendance %</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                          {sectionStudents.map(s => (
                            <tr key={s.id}>
                              <td className="px-3 py-2 font-mono font-bold text-slate-700">#{s.rollNo}</td>
                              <td className="px-3 py-2 font-mono text-slate-600">{s.admissionNo}</td>
                              <td className="px-3 py-2 font-semibold text-slate-800">{s.fullName}</td>
                              <td className="px-3 py-2 text-slate-600">{s.parentName} ({s.parentPhone})</td>
                              <td className="px-3 py-2 text-right font-semibold text-emerald-600">
                                {s.attendancePercentage || 94}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-6 py-3">
              <button
                onClick={() => setRosterClass(null)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Close Roster
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
