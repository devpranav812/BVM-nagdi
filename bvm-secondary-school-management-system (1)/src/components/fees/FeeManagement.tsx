import React, { useState } from 'react';
import {
  CreditCard,
  Plus,
  Receipt,
  Search,
  Filter,
  Download,
  Settings,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Edit2,
  DollarSign,
  X
} from 'lucide-react';
import { Student, PaymentReceipt, FeeStructure, User, FeeStatus } from '../../types';
import { StorageService } from '../../services/storageService';
import { PaymentModal } from './PaymentModal';
import { FeeReceiptModal } from './FeeReceiptModal';
import { FeeStructureModal } from './FeeStructureModal';
import { formatINR, downloadCSV } from '../../utils/csvExport';
import { downloadFeeReceiptPDF } from '../../utils/pdfGenerator';

interface FeeManagementProps {
  currentUser: User;
  initialReceiptId?: string | null;
  onClearReceiptId?: () => void;
}

export const FeeManagement: React.FC<FeeManagementProps> = ({
  currentUser,
  initialReceiptId,
  onClearReceiptId
}) => {
  const [students, setStudents] = useState<Student[]>(() => StorageService.getStudents());
  const classes = StorageService.getClasses();
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>(() => StorageService.getFeeStructures());
  const [payments, setPayments] = useState<PaymentReceipt[]>(() => StorageService.getPayments());

  const [activeTab, setActiveTab] = useState<'ledger' | 'structures' | 'receipts'>('ledger');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modals
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentStudentId, setPaymentStudentId] = useState<string | undefined>(undefined);
  const [selectedStudentForArrears, setSelectedStudentForArrears] = useState<Student | null>(null);
  const [arrearsInput, setArrearsInput] = useState('');
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  const canManageFees =
    currentUser.role === 'director' || currentUser.role === 'operator' || currentUser.role === 'admin';

  const [activeReceipt, setActiveReceipt] = useState<PaymentReceipt | null>(() => {
    if (initialReceiptId) {
      return StorageService.getPayments().find(p => p.id === initialReceiptId) || null;
    }
    return null;
  });
  const [editingStructure, setEditingStructure] = useState<FeeStructure | null>(null);

  // Filter students for ledger
  const studentFeeLedger = students.map(s => {
    const calc = StorageService.getStudentFeeCalculation(s.id);
    return {
      student: s,
      ...calc
    };
  }).filter(item => {
    if (selectedClass !== 'all' && item.student.class !== selectedClass) return false;
    if (selectedStatus !== 'all' && item.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.student.fullName.toLowerCase().includes(q) ||
        item.student.admissionNo.toLowerCase().includes(q) ||
        item.student.parentPhone.includes(q)
      );
    }
    return true;
  });

  const handleOpenPayment = (studentId?: string) => {
    setPaymentStudentId(studentId);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = (receipt: PaymentReceipt) => {
    setIsPaymentModalOpen(false);
    setPayments(StorageService.getPayments());
    setActiveReceipt(receipt);
  };

  const handleSaveArrears = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForArrears) return;
    const amount = Math.max(0, Number(arrearsInput) || 0);
    const updated = StorageService.updateStudentPreviousYearPendingFee(selectedStudentForArrears.id, amount);
    setStudents(updated);
    setFeedbackNotice(`Previous year pending fee for ${selectedStudentForArrears.fullName} updated to ₹${amount.toLocaleString('en-IN')}`);
    setSelectedStudentForArrears(null);
    setTimeout(() => setFeedbackNotice(null), 4000);
  };

  const getStatusBadge = (status: FeeStatus) => {
    switch (status) {
      case 'Paid':
        return <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">Paid</span>;
      case 'Partially Paid':
        return <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">Partially Paid</span>;
      case 'Pending':
        return <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">Pending</span>;
      case 'Overdue':
        return <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700 border border-rose-200">Overdue</span>;
    }
  };

  const handleExportLedgerCSV = () => {
    const headers = [
      'Admission No',
      'Student Name',
      'Class',
      'Section',
      'Annual Fee',
      'Previous Year Due',
      'Total Accrued',
      'Paid Amount',
      'Pending Amount',
      'Status'
    ];
    const rows = studentFeeLedger.map(item => [
      item.student.admissionNo,
      item.student.fullName,
      item.student.class,
      item.student.section,
      item.annualFee,
      item.previousYearPendingFee,
      item.totalFee,
      item.paidAmount,
      item.pendingAmount,
      item.status
    ]);

    downloadCSV('BVM_Nagdi_Fee_Ledger', headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Fee Management & Billing</h2>
          <p className="text-xs text-slate-500">
            Collect school fees, configure class tariffs, and generate official BVM receipts
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenPayment()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-colors cursor-pointer"
          >
            <Receipt className="h-4 w-4" />
            <span>Record New Payment</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-lg border border-slate-200 bg-white p-1">
        <button
          onClick={() => setActiveTab('ledger')}
          className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
            activeTab === 'ledger' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Student Dues & Ledger
        </button>
        <button
          onClick={() => setActiveTab('structures')}
          className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
            activeTab === 'structures' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Class Fee Structures
        </button>
        <button
          onClick={() => setActiveTab('receipts')}
          className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
            activeTab === 'receipts' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Issued Receipts ({payments.length})
        </button>
      </div>

      {/* Tab 1: Ledger */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search by student name, adm no, phone..."
                    className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-xs placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <select
                  value={selectedClass}
                  onChange={e => setSelectedClass(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs text-slate-700 focus:border-indigo-600 focus:outline-none"
                >
                  <option value="all">All Classes</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={selectedStatus}
                  onChange={e => setSelectedStatus(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs text-slate-700 focus:border-indigo-600 focus:outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="Pending">Payment Due</option>
                  <option value="Partially Paid">Partially Paid</option>
                  <option value="Paid">Paid in Full</option>
                </select>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
              <span className="text-slate-500">
                Showing <strong>{studentFeeLedger.length}</strong> student accounts
              </span>
              <button
                onClick={handleExportLedgerCSV}
                className="font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <Download className="h-3.5 w-3.5" /> Export Fee Ledger
              </button>
            </div>
          </div>

          {/* Feedback Notice Banner */}
          {feedbackNotice && (
            <div className="flex items-center justify-between rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{feedbackNotice}</span>
              </div>
              <button onClick={() => setFeedbackNotice(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Ledger Table: Mobile Responsive Cards & Desktop Table */}
          <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs">
            {/* Mobile View (Zero Horizontal Scroll) */}
            <div className="md:hidden divide-y divide-slate-100 p-3 space-y-3">
              {studentFeeLedger.map(item => (
                <div key={item.student.id} className="pt-3 first:pt-0 text-xs space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{item.student.fullName}</div>
                      <div className="text-[11px] text-slate-500">
                        {item.student.class} - {item.student.section} &bull; Adm: <span className="font-mono text-slate-700">{item.student.admissionNo}</span>
                      </div>
                    </div>
                    <div>
                      {getStatusBadge(item.status)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100 text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Annual Fee</span>
                      <strong className="font-mono text-slate-800">{formatINR(item.annualFee)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Prev Year Due</span>
                      <strong className={`font-mono ${item.previousYearPendingFee > 0 ? 'text-rose-700' : 'text-slate-600'}`}>
                        {formatINR(item.previousYearPendingFee)}
                      </strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Total Accrued</span>
                      <strong className="font-mono text-slate-800 text-xs">{formatINR(item.totalFee)}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Paid</span>
                      <strong className="font-mono text-emerald-700 text-xs">{formatINR(item.paidAmount)}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Pending Due</span>
                      <strong className={`font-mono text-xs ${item.pendingAmount > 0 ? 'text-amber-800 font-bold' : 'text-slate-600'}`}>
                        {formatINR(item.pendingAmount)}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 gap-2">
                    <span className="text-[11px] text-slate-500 truncate">Ph: {item.student.parentPhone}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {canManageFees && (
                        <button
                          onClick={() => {
                            setSelectedStudentForArrears(item.student);
                            setArrearsInput(String(item.previousYearPendingFee || 0));
                          }}
                          className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Arrears
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenPayment(item.student.id)}
                        className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow-2xs hover:bg-emerald-700"
                      >
                        Collect Fee
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {studentFeeLedger.length === 0 && (
                <div className="p-6 text-center text-slate-400 text-xs">
                  No students found matching current filters.
                </div>
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold">
                  <tr>
                    <th className="px-4 py-3 text-left">Adm No</th>
                    <th className="px-4 py-3 text-left">Student Name</th>
                    <th className="px-4 py-3 text-left">Class & Sec</th>
                    <th className="px-4 py-3 text-right">Annual Fee</th>
                    <th className="px-4 py-3 text-right">Prev Year Due</th>
                    <th className="px-4 py-3 text-right">Total Accrued</th>
                    <th className="px-4 py-3 text-right">Paid Amount</th>
                    <th className="px-4 py-3 text-right">Pending Due</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {studentFeeLedger.map(item => (
                    <tr key={item.student.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono font-medium text-slate-700">
                        {item.student.admissionNo}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{item.student.fullName}</div>
                        <div className="text-[11px] text-slate-400">Parent: {item.student.parentPhone}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {item.student.class} - {item.student.section}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-700 font-mono">
                        {formatINR(item.annualFee)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        <div className="flex items-center justify-end gap-1">
                          <span className={item.previousYearPendingFee > 0 ? 'text-rose-700 font-bold' : 'text-slate-500'}>
                            {formatINR(item.previousYearPendingFee)}
                          </span>
                          {canManageFees && (
                            <button
                              onClick={() => {
                                setSelectedStudentForArrears(item.student);
                                setArrearsInput(String(item.previousYearPendingFee || 0));
                              }}
                              className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-800"
                              title="Edit Previous Year Arrears"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-800 font-mono">
                        {formatINR(item.totalFee)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-700 font-mono">
                        {formatINR(item.paidAmount)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-amber-700 font-mono">
                        {formatINR(item.pendingAmount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {getStatusBadge(item.status)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {canManageFees && (
                            <button
                              onClick={() => {
                                setSelectedStudentForArrears(item.student);
                                setArrearsInput(String(item.previousYearPendingFee || 0));
                              }}
                              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                              title="Update Previous Year Pending Fees"
                            >
                              Set Arrears
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenPayment(item.student.id)}
                            className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white shadow-2xs hover:bg-emerald-700"
                          >
                            Collect Fee
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Fee Structures */}
      {activeTab === 'structures' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900">Configured Annual Class Fee Structures</h3>
            <p className="text-xs text-slate-500">
              Annual tuition, activity, examination, and transport tariffs from Nursery to Class 10
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {feeStructures.map(fs => {
              const totalAnnual = fs.tuitionFee + (fs.activityFee || 0) + (fs.transportFee || 0) + (fs.examFee || 0);

              return (
                <div key={fs.id} className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h4 className="text-base font-bold text-slate-900">{fs.class}</h4>
                    <button
                      onClick={() => setEditingStructure(fs)}
                      className="rounded p-1 text-indigo-600 hover:bg-indigo-50 text-xs font-semibold cursor-pointer"
                    >
                      Edit Tariff
                    </button>
                  </div>

                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Annual Tuition Fee:</span>
                      <strong className="text-slate-800">{formatINR(fs.tuitionFee)}/yr</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Activity & Lab Fee:</span>
                      <strong className="text-slate-800">{formatINR(fs.activityFee || 0)}/yr</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Transport Fee:</span>
                      <strong className="text-slate-800">{formatINR(fs.transportFee || 0)}/yr</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Annual Exam Fee:</span>
                      <strong className="text-slate-800">{formatINR(fs.examFee || 0)}/yr</strong>
                    </div>
                    <div className="flex justify-between border-t border-slate-100 pt-2 font-bold">
                      <span className="text-slate-900">Total Annual Fee:</span>
                      <span className="text-emerald-700 text-sm">{formatINR(totalAnnual)}/yr</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Issued Receipts */}
      {activeTab === 'receipts' && (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold">
                  <tr>
                    <th className="px-4 py-3 text-left">Receipt No</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Student Name</th>
                    <th className="px-4 py-3 text-left">Class & Sec</th>
                    <th className="px-4 py-3 text-left">Fee Category</th>
                    <th className="px-4 py-3 text-left">Payment Mode</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {payments.map(receipt => (
                    <tr key={receipt.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono font-bold text-indigo-700">
                        {receipt.receiptNo}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{receipt.paymentDate}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {receipt.studentName}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {receipt.class} - {receipt.section}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{receipt.feeType}</td>
                      <td className="px-4 py-3">
                        <span className="rounded bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                          {receipt.paymentMethod}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                        {formatINR(receipt.amount)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              const sInfo = StorageService.getSchoolInfo();
                              const feeCalc = StorageService.getStudentFeeCalculation(receipt.studentId);
                              downloadFeeReceiptPDF(receipt, sInfo, receipt.pendingAmount ?? feeCalc.pendingAmount);
                            }}
                            className="inline-flex items-center gap-1 rounded border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors shadow-2xs"
                            title="Download official PDF Receipt"
                          >
                            <Download className="h-3 w-3 text-indigo-600" />
                            <span>PDF</span>
                          </button>
                          <button
                            onClick={() => setActiveReceipt(receipt)}
                            className="inline-flex items-center gap-1 rounded bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
                            title="View / Print Receipt"
                          >
                            <Printer className="h-3 w-3" />
                            <span>View</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Payment Recording Modal */}
      {isPaymentModalOpen && (
        <PaymentModal
          students={students.filter(s => s.status === 'active')}
          preSelectedStudentId={paymentStudentId}
          currentUser={currentUser}
          onClose={() => setIsPaymentModalOpen(false)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* Official Fee Receipt Modal */}
      {activeReceipt && (
        <FeeReceiptModal
          receipt={activeReceipt}
          onClose={() => {
            setActiveReceipt(null);
            if (onClearReceiptId) onClearReceiptId();
          }}
        />
      )}

      {/* Fee Structure Modal */}
      {editingStructure && (
        <FeeStructureModal
          structure={editingStructure}
          onClose={() => setEditingStructure(null)}
          onSaved={updated => {
            setFeeStructures(StorageService.getFeeStructures());
            setEditingStructure(null);
          }}
        />
      )}

      {/* Previous Year Pending Fee / Arrears Modal */}
      {selectedStudentForArrears && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Set Previous Year Pending Fees
                </h3>
              </div>
              <button
                onClick={() => setSelectedStudentForArrears(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveArrears} className="p-6 space-y-4">
              <div className="rounded-lg bg-slate-50 p-3 text-xs border border-slate-200 space-y-1">
                <div>Student: <strong className="text-slate-900">{selectedStudentForArrears.fullName}</strong></div>
                <div>Admission No: <strong className="font-mono text-slate-800">{selectedStudentForArrears.admissionNo}</strong></div>
                <div>Class & Section: <strong>{selectedStudentForArrears.class} - {selectedStudentForArrears.section}</strong></div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Previous Year Arrears Amount (INR) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={arrearsInput}
                  onChange={e => setArrearsInput(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:border-indigo-600 focus:outline-none"
                  placeholder="0"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  This backlog amount will be added to the student's total pending fee ledger balance.
                </p>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedStudentForArrears(null)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 cursor-pointer"
                >
                  Save Arrears
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
