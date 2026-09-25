import React, { useState } from 'react';
import {
  DollarSign,
  Plus,
  Search,
  Filter,
  Printer,
  CheckCircle2,
  Clock,
  Download,
  IndianRupee,
  FileText,
  X,
  Banknote
} from 'lucide-react';
import { PayrollRecord, Staff, User } from '../../types';
import { StorageService } from '../../services/storageService';
import { formatINR, downloadCSV } from '../../utils/csvExport';
import { downloadPayslipPDF } from '../../utils/pdfGenerator';

interface PayrollManagementProps {
  currentUser: User;
}

export const PayrollManagement: React.FC<PayrollManagementProps> = ({ currentUser }) => {
  const isDirector = currentUser.role === 'director';

  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>(() => StorageService.getPayrollRecords());
  const staffMembers = StorageService.getStaff().filter(s => s.status === 'active');
  const schoolInfo = StorageService.getSchoolInfo();

  const [selectedMonth, setSelectedMonth] = useState('2026-09');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<PayrollRecord | null>(null);

  // If not director, render security access restriction
  if (!isDirector) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-8 text-center max-w-xl mx-auto my-12">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700 mb-4">
          <Banknote className="h-7 w-7" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Restricted Access: Staff Payroll</h3>
        <p className="mt-2 text-sm text-slate-600">
          Staff payroll and salary disbursements are strictly in control of School Director <strong>Ashish Joshi</strong>. Computer and operational staff do not have authorization to view or edit payroll.
        </p>
      </div>
    );
  }

  // Form State for creating a payroll entry
  const [staffId, setStaffId] = useState(staffMembers[0]?.id || '');
  const [month, setMonth] = useState('2026-09');
  const [baseSalary, setBaseSalary] = useState('32000');
  const [allowances, setAllowances] = useState('1500');
  const [deductions, setDeductions] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState<'Bank Transfer' | 'Cash' | 'Cheque'>('Bank Transfer');
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Pending'>('Paid');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [remarks, setRemarks] = useState('');

  const handleStaffChange = (id: string) => {
    setStaffId(id);
    const stf = staffMembers.find(s => s.id === id);
    if (stf) {
      setBaseSalary(String(stf.monthlySalary));
    }
  };

  const handleCreatePayroll = (e: React.FormEvent) => {
    e.preventDefault();
    const stf = staffMembers.find(s => s.id === staffId);
    if (!stf) return;

    const base = Number(baseSalary) || 0;
    const allow = Number(allowances) || 0;
    const ded = Number(deductions) || 0;
    const net = base + allow - ded;

    const record: PayrollRecord = {
      id: `pr-${Date.now()}`,
      schoolId: 'bvm-nagdi-01',
      staffId: stf.id,
      staffName: stf.name,
      employeeId: stf.employeeId,
      department: stf.department,
      month,
      baseSalary: base,
      allowances: allow,
      deductions: ded,
      netSalary: net,
      paymentMethod,
      paymentStatus,
      paymentDate,
      remarks
    };

    const updated = StorageService.savePayrollRecord(record);
    setPayrollRecords(updated);
    setIsModalOpen(false);
  };

  const handleExportCSV = () => {
    const headers = [
      'Employee ID',
      'Staff Name',
      'Department',
      'Month',
      'Base Salary',
      'Allowances',
      'Deductions',
      'Net Salary',
      'Payment Status',
      'Payment Method',
      'Payment Date'
    ];

    const rows = payrollRecords.map(p => [
      p.employeeId,
      p.staffName,
      p.department || p.designation || 'Staff',
      p.month,
      p.baseSalary || p.monthlySalary || 0,
      p.allowances || 0,
      p.deductions || 0,
      p.netSalary || p.finalPayable || 0,
      p.paymentStatus || p.status || 'Paid',
      p.paymentMethod || 'Bank Transfer',
      p.paymentDate || ''
    ]);

    downloadCSV(`Payroll_Register_${selectedMonth}`, headers, rows);
  };

  const totalPayrollDisbursed = payrollRecords
    .filter(p => (p.paymentStatus === 'Paid' || p.status === 'Paid'))
    .reduce((sum, p) => sum + (p.netSalary || p.finalPayable || 0), 0);

  const pendingPayroll = payrollRecords
    .filter(p => (p.paymentStatus === 'Pending' || p.status === 'Generated'))
    .reduce((sum, p) => sum + (p.netSalary || p.finalPayable || 0), 0);

  const handleDownloadPayslip = (slip: PayrollRecord) => {
    try {
      downloadPayslipPDF(slip, schoolInfo);
    } catch (e) {
      console.error('Payslip PDF generation error:', e);
      window.print();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Staff Payroll & Salary Disbursal</h2>
          <p className="text-xs text-slate-500">
            Monthly salary register, allowances, deductions, and downloadable employee payslips
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export Register</span>
          </button>
          <button
            id="btn-process-salary"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Process Salary Record</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Total Disbursed (Paid)</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900">{formatINR(totalPayrollDisbursed)}</span>
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">Bank transfer & direct counter vouchers</span>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Pending Approvals</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-bold text-amber-700">{formatINR(pendingPayroll)}</span>
          </div>
          <span className="text-[11px] text-slate-400">Scheduled for month-end release</span>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Total Staff on Roll</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900">{staffMembers.length} Faculty & Staff</span>
          </div>
          <span className="text-[11px] text-indigo-600 font-medium">Active payroll contracts</span>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold">
              <tr>
                <th className="px-4 py-3 text-left">Emp ID</th>
                <th className="px-4 py-3 text-left">Staff Member</th>
                <th className="px-4 py-3 text-left">Department</th>
                <th className="px-4 py-3 text-left">Period</th>
                <th className="px-4 py-3 text-right">Base Salary</th>
                <th className="px-4 py-3 text-right">Allowances</th>
                <th className="px-4 py-3 text-right">Deductions</th>
                <th className="px-4 py-3 text-right font-bold">Net Salary</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Payslip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {payrollRecords.map(record => (
                <tr key={record.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono font-medium text-slate-700">{record.employeeId}</td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900">{record.staffName}</div>
                    <div className="text-[11px] text-slate-400">{record.paymentMethod}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{record.department}</td>
                  <td className="px-4 py-3 font-medium text-slate-700">{record.month}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{formatINR(record.baseSalary || record.monthlySalary || 0)}</td>
                  <td className="px-4 py-3 text-right text-emerald-600">+{formatINR(record.allowances || 0)}</td>
                  <td className="px-4 py-3 text-right text-rose-600">-{formatINR(record.deductions || 0)}</td>
                  <td className="px-4 py-3 text-right font-bold font-mono text-slate-900 text-sm">
                    {formatINR(record.netSalary || record.finalPayable || 0)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex rounded-full px-2 py-0.5 font-semibold text-[10px] uppercase ${
                      record.paymentStatus === 'Paid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {record.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleDownloadPayslip(record)}
                        className="inline-flex items-center gap-1 rounded border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors shadow-2xs"
                        title="Download Payslip as PDF"
                      >
                        <Download className="h-3 w-3 text-indigo-600" />
                        <span>PDF</span>
                      </button>
                      <button
                        onClick={() => setSelectedPayslip(record)}
                        className="inline-flex items-center gap-1 rounded bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
                        title="View / Print Payslip"
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

      {/* Process Salary Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
              <h3 className="text-base font-bold text-slate-900">Process Salary Disbursal</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePayroll} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Staff Member *
                </label>
                <select
                  value={staffId}
                  onChange={e => handleStaffChange(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-600 focus:outline-none"
                >
                  {staffMembers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.role} - {s.department}, Emp: {s.employeeId})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Salary Month *
                  </label>
                  <input
                    type="month"
                    value={month}
                    onChange={e => setMonth(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Base Salary (INR) *
                  </label>
                  <input
                    type="number"
                    required
                    value={baseSalary}
                    onChange={e => setBaseSalary(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-900 focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Special Allowances / Bonus
                  </label>
                  <input
                    type="number"
                    value={allowances}
                    onChange={e => setAllowances(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Deductions (Unpaid leaves)
                  </label>
                  <input
                    type="number"
                    value={deductions}
                    onChange={e => setDeductions(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-600 focus:outline-none"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash Voucher</option>
                    <option value="Cheque">Bank Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Status
                  </label>
                  <select
                    value={paymentStatus}
                    onChange={e => setPaymentStatus(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-600 focus:outline-none"
                  >
                    <option value="Paid">Disbursed (Paid)</option>
                    <option value="Pending">Approval Pending</option>
                  </select>
                </div>
              </div>

              {/* Net preview */}
              <div className="rounded-lg bg-indigo-50 p-3 border border-indigo-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-indigo-900">Net Calculated Salary:</span>
                <span className="text-base font-black text-indigo-900 font-mono">
                  {formatINR((Number(baseSalary) || 0) + (Number(allowances) || 0) - (Number(deductions) || 0))}
                </span>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
                >
                  Save Salary Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Payslip Modal */}
      {selectedPayslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-xl bg-white shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-3 no-print">
              <span className="text-xs font-bold text-slate-800">Staff Payslip Voucher</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadPayslip(selectedPayslip)}
                  className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  title="Download payslip document as PDF"
                >
                  <Download className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Download PDF Payslip</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print Slip</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPayslip(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-6 printable-area bg-white text-xs">
              <div className="text-center border-b pb-4">
                <h2 className="text-lg font-black uppercase text-slate-900">{schoolInfo.name}</h2>
                <p className="text-slate-600">{schoolInfo.address} &bull; Ph: {schoolInfo.contactNumber}</p>
                <span className="mt-2 inline-block rounded bg-slate-100 px-3 py-0.5 text-xs font-bold text-slate-800">
                  STAFF SALARY SLIP &bull; {selectedPayslip.month}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b pb-4">
                <div>
                  <p><span className="text-slate-500">Employee Name: </span><strong>{selectedPayslip.staffName}</strong></p>
                  <p><span className="text-slate-500">Employee ID: </span><strong className="font-mono">{selectedPayslip.employeeId}</strong></p>
                </div>
                <div className="text-right">
                  <p><span className="text-slate-500">Department: </span><strong>{selectedPayslip.department}</strong></p>
                  <p><span className="text-slate-500">Payment Mode: </span><strong>{selectedPayslip.paymentMethod}</strong></p>
                </div>
              </div>

              <table className="w-full border text-xs">
                <thead className="bg-slate-50 font-bold">
                  <tr>
                    <th className="border p-2 text-left">Earnings / Deductions</th>
                    <th className="border p-2 text-right">Amount (INR)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border p-2">Base Salary</td>
                    <td className="border p-2 text-right font-mono">{formatINR(selectedPayslip.baseSalary || selectedPayslip.monthlySalary || 0)}</td>
                  </tr>
                  <tr>
                    <td className="border p-2">Allowances / Incentives</td>
                    <td className="border p-2 text-right font-mono text-emerald-600">+{formatINR(selectedPayslip.allowances || 0)}</td>
                  </tr>
                  <tr>
                    <td className="border p-2">Attendance Deductions</td>
                    <td className="border p-2 text-right font-mono text-rose-600">-{formatINR(selectedPayslip.deductions || 0)}</td>
                  </tr>
                  <tr className="bg-slate-50 font-bold text-sm">
                    <td className="border p-2 uppercase">Net Remuneration Disbursed</td>
                    <td className="border p-2 text-right font-mono text-indigo-900">{formatINR(selectedPayslip.netSalary || selectedPayslip.finalPayable || 0)}</td>
                  </tr>
                </tbody>
              </table>

              <div className="grid grid-cols-2 gap-8 pt-8">
                <div className="border-t pt-4 text-center">
                  <p className="font-semibold text-slate-800">Accounts Department</p>
                  <p className="text-[11px] text-slate-400">Prepared & Verified</p>
                </div>
                <div className="border-t pt-4 text-center">
                  <p className="font-semibold text-slate-800">{selectedPayslip.staffName}</p>
                  <p className="text-[11px] text-slate-400">Employee Signature</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
