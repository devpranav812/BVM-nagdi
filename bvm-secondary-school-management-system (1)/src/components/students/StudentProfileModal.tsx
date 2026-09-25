import React from 'react';
import { X, GraduationCap, Phone, MapPin, Calendar, CreditCard, CheckCircle2, AlertCircle, Printer } from 'lucide-react';
import { Student } from '../../types';
import { StorageService } from '../../services/storageService';
import { formatINR } from '../../utils/csvExport';

interface StudentProfileModalProps {
  student: Student;
  onClose: () => void;
  onViewReceipt?: (receiptId: string) => void;
  showFees?: boolean;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  student,
  onClose,
  onViewReceipt,
  showFees = true
}) => {
  const feeDetails = showFees ? StorageService.getStudentFeeCalculation(student.id) : null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Paid':
        return <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">Paid in Full</span>;
      case 'Partially Paid':
        return <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-200">Partially Paid</span>;
      case 'Pending':
        return <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200">Payment Due</span>;
      default:
        return <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 border border-rose-200">Overdue</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-lg shadow-xs">
              {student.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">{student.fullName}</h3>
                <span className={`rounded px-2 py-0.5 text-xs font-semibold uppercase ${
                  student.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {student.status}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Admission No: <strong className="font-mono text-slate-700">{student.admissionNo}</strong> &bull; Roll #{student.rollNo}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-slate-50 p-3 border border-slate-200/80 text-center">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Class & Section</span>
              <p className="text-sm font-bold text-slate-800 mt-0.5">{student.class} - {student.section}</p>
            </div>
            <div className="rounded-lg bg-emerald-50 p-3 border border-emerald-200/80 text-center">
              <span className="text-[11px] font-semibold text-emerald-700 uppercase">Attendance</span>
              <p className="text-sm font-bold text-emerald-800 mt-0.5">{student.attendancePercentage || 94}%</p>
            </div>
            {showFees && feeDetails ? (
              <div className="rounded-lg bg-indigo-50 p-3 border border-indigo-200/80 text-center">
                <span className="text-[11px] font-semibold text-indigo-700 uppercase">Fee Status</span>
                <div className="mt-1">{getStatusBadge(feeDetails.status)}</div>
              </div>
            ) : (
              <div className="rounded-lg bg-indigo-50 p-3 border border-indigo-200/80 text-center">
                <span className="text-[11px] font-semibold text-indigo-700 uppercase">Class Roll</span>
                <p className="text-sm font-bold text-indigo-800 mt-0.5">Roll #{student.rollNo}</p>
              </div>
            )}
          </div>

          {/* Student Profile Information */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1">
              Personal & Academic Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block">Date of Birth:</span>
                <span className="font-medium text-slate-800">{student.dob}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Gender:</span>
                <span className="font-medium text-slate-800">{student.gender}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Parent / Guardian:</span>
                <span className="font-medium text-slate-800">{student.parentName}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Contact Phone:</span>
                <a href={`tel:${student.parentPhone}`} className="font-mono font-medium text-indigo-600 hover:underline">
                  {student.parentPhone}
                </a>
              </div>
              <div>
                <span className="text-slate-400 block">Admission Date:</span>
                <span className="font-medium text-slate-800">{student.admissionDate}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Blood Group:</span>
                <span className="font-medium text-slate-800">{student.bloodGroup || 'Not Recorded'}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-400 block">Residential Address:</span>
                <span className="font-medium text-slate-800">{student.address}</span>
              </div>
            </div>
          </div>

          {/* Fee Status & Payment History (Hidden for Teachers) */}
          {showFees && feeDetails && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Fee & Payment History
                </h4>
                <div className="text-xs space-x-2">
                  <span className="text-slate-500">Total: <strong>{formatINR(feeDetails.totalFee)}</strong></span>
                  <span className="text-emerald-600">Paid: <strong>{formatINR(feeDetails.paidAmount)}</strong></span>
                  <span className="text-amber-600">Due: <strong>{formatINR(feeDetails.pendingAmount)}</strong></span>
                </div>
              </div>

              {feeDetails.payments.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-2">No payment transactions recorded yet.</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200 text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold">
                      <tr>
                        <th className="px-3 py-2 text-left">Receipt No</th>
                        <th className="px-3 py-2 text-left">Date</th>
                        <th className="px-3 py-2 text-left">Fee Type</th>
                        <th className="px-3 py-2 text-left">Method</th>
                        <th className="px-3 py-2 text-right">Amount</th>
                        {onViewReceipt && <th className="px-3 py-2 text-center">Receipt</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {feeDetails.payments.map(p => (
                        <tr key={p.id}>
                          <td className="px-3 py-2 font-mono font-medium text-slate-800">{p.receiptNo}</td>
                          <td className="px-3 py-2 text-slate-600">{p.paymentDate}</td>
                          <td className="px-3 py-2 text-slate-600">{p.feeType}</td>
                          <td className="px-3 py-2 text-slate-600">{p.paymentMethod}</td>
                          <td className="px-3 py-2 text-right font-bold text-slate-900">{formatINR(p.amount)}</td>
                          {onViewReceipt && (
                            <td className="px-3 py-2 text-center">
                              <button
                                onClick={() => onViewReceipt(p.id)}
                                className="text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1"
                              >
                                <Printer className="h-3 w-3" /> View
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-6 py-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
};
