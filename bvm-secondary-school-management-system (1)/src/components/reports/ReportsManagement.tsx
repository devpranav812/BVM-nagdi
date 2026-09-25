import React, { useState } from 'react';
import {
  FileText,
  Download,
  Users,
  Calendar,
  IndianRupee,
  CheckCircle2,
  AlertTriangle,
  Printer,
  ChevronRight
} from 'lucide-react';
import { StorageService } from '../../services/storageService';
import { PayrollRecord } from '../../types';
import { formatINR, downloadCSV } from '../../utils/csvExport';

export const ReportsManagement: React.FC = () => {
  const students = StorageService.getStudents();
  const classes = StorageService.getClasses();
  const staff = StorageService.getStaff();
  const payments = StorageService.getPayments();
  const payroll = StorageService.getPayrollRecords();
  const schoolInfo = StorageService.getSchoolInfo();

  const [activeReportTab, setActiveReportTab] = useState<
    'strength' | 'defaulters' | 'fee-collection' | 'attendance' | 'payroll'
  >('strength');

  // Fee Defaulters list calculation
  const defaultersList = students
    .map(s => {
      const calc = StorageService.getStudentFeeCalculation(s.id);
      return {
        student: s,
        ...calc
      };
    })
    .filter(item => item.pendingAmount > 0);

  // Strength breakdown by class & section
  const strengthBreakdown = classes.map(cls => {
    const classStudents = students.filter(s => s.class === cls.name && s.status === 'active');
    const boys = classStudents.filter(s => s.gender === 'Male').length;
    const girls = classStudents.filter(s => s.gender === 'Female').length;
    return {
      class: cls.name,
      sections: cls.sections.join(', '),
      boys,
      girls,
      total: classStudents.length
    };
  });

  // Export handlers
  const handleExportStrength = () => {
    const headers = ['Class', 'Sections', 'Boys', 'Girls', 'Total Enrolled'];
    const rows = strengthBreakdown.map(r => [r.class, r.sections, r.boys, r.girls, r.total]);
    downloadCSV('BVM_Student_Strength_Report', headers, rows);
  };

  const handleExportDefaulters = () => {
    const headers = ['Admission No', 'Student Name', 'Class', 'Section', 'Parent Name', 'Parent Phone', 'Total Dues', 'Paid', 'Pending Balance'];
    const rows = defaultersList.map(d => [
      d.student.admissionNo,
      d.student.fullName,
      d.student.class,
      d.student.section,
      d.student.parentName,
      d.student.parentPhone,
      d.totalFee,
      d.paidAmount,
      d.pendingAmount
    ]);
    downloadCSV('BVM_Fee_Defaulters_List', headers, rows);
  };

  const handleExportFeeCollection = () => {
    const headers = ['Receipt No', 'Date', 'Student Name', 'Class', 'Section', 'Category', 'Mode', 'Amount'];
    const rows = payments.map(p => [
      p.receiptNo,
      p.paymentDate,
      p.studentName,
      p.class,
      p.section,
      p.feeType,
      p.paymentMethod,
      p.amount
    ]);
    downloadCSV('BVM_Fee_Collection_Audit_Report', headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Official Reports & Audit Registers</h2>
          <p className="text-xs text-slate-500">
            Administrative intelligence, student rolls, fee recovery summaries, and compliance logs
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
        >
          <Printer className="h-4 w-4" />
          <span>Print Audit View</span>
        </button>
      </div>

      {/* Report Switcher Tabs */}
      <div className="flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-white p-1.5">
        {[
          { id: 'strength', label: 'Student Strength & Enrollment' },
          { id: 'defaulters', label: `Fee Defaulters (${defaultersList.length})` },
          { id: 'fee-collection', label: 'Fee Collection Audit' },
          { id: 'payroll', label: 'Salary Disbursement Register' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveReportTab(t.id as any)}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeReportTab === t.id
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 1. Student Strength Report */}
      {activeReportTab === 'strength' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Class-wise Enrollment & Gender Ratio</h3>
              <p className="text-xs text-slate-500">Total active student strength across grades 6 through 10</p>
            </div>
            <button
              onClick={handleExportStrength}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </button>
          </div>

          {/* Mobile Strength View (No Horizontal Scroll) */}
          <div className="md:hidden divide-y divide-slate-100 rounded-xl border border-slate-200/80 bg-white p-3 shadow-xs space-y-2.5">
            {strengthBreakdown.map(sb => (
              <div key={sb.class} className="pt-2 first:pt-0 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">{sb.class}</span>
                  <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-xs">
                    {sb.total} Students
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-500 text-[11px]">
                  <span>Sections: {sb.sections}</span>
                  <span>Boys: <strong className="text-slate-700">{sb.boys}</strong> &bull; Girls: <strong className="text-slate-700">{sb.girls}</strong></span>
                </div>
              </div>
            ))}
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-slate-900">
              <span>Total School Strength:</span>
              <span className="font-mono text-sm text-indigo-900">
                {strengthBreakdown.reduce((sum, s) => sum + s.total, 0)} Students
              </span>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <tbody className="divide-y divide-slate-200 bg-white">
                {strengthBreakdown.map(sb => (
                  <tr key={sb.class} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-900">{sb.class}</td>
                    <td className="px-4 py-3 text-slate-600">{sb.sections}</td>
                    <td className="px-4 py-3 text-center text-slate-700">{sb.boys}</td>
                    <td className="px-4 py-3 text-center text-slate-700">{sb.girls}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-indigo-700">{sb.total}</td>
                  </tr>
                ))}
                <tr className="bg-slate-50 font-bold">
                  <td className="px-4 py-3 uppercase text-slate-800">Total School Roster:</td>
                  <td className="px-4 py-3 text-slate-500">-</td>
                  <td className="px-4 py-3 text-center text-slate-900">
                    {strengthBreakdown.reduce((sum, s) => sum + s.boys, 0)}
                  </td>
                  <td className="px-4 py-3 text-center text-slate-900">
                    {strengthBreakdown.reduce((sum, s) => sum + s.girls, 0)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-base text-indigo-900">
                    {strengthBreakdown.reduce((sum, s) => sum + s.total, 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Fee Defaulters List */}
      {activeReportTab === 'defaulters' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Fee Defaulters & Outstanding Balances</h3>
              <p className="text-xs text-slate-500">Contact list of guardians with pending school fees</p>
            </div>
            <button
              onClick={handleExportDefaulters}
              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 border border-rose-200"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export Defaulter List</span>
            </button>
          </div>

          {/* Mobile Fee Defaulters View (No Horizontal Scroll) */}
          <div className="md:hidden divide-y divide-slate-100 rounded-xl border border-slate-200/80 bg-white p-3 shadow-xs space-y-3">
            {defaultersList.map(d => (
              <div key={d.student.id} className="pt-2.5 first:pt-0 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 text-sm block">{d.student.fullName}</span>
                    <span className="text-[11px] text-slate-500">{d.student.class} - {d.student.section} &bull; Adm: {d.student.admissionNo}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-rose-700 text-sm block">{formatINR(d.pendingAmount)}</span>
                    <span className="text-[10px] text-slate-400">Total: {formatINR(d.totalFee)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  <span className="text-[11px] text-slate-600">Guardian: {d.student.parentName}</span>
                  <a
                    href={`tel:${d.student.parentPhone}`}
                    className="inline-flex items-center gap-1 rounded bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 border border-rose-200"
                  >
                    📞 Call Parent
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold">
                <tr>
                  <th className="px-4 py-3 text-left">Adm No</th>
                  <th className="px-4 py-3 text-left">Student Name</th>
                  <th className="px-4 py-3 text-left">Class & Sec</th>
                  <th className="px-4 py-3 text-left">Parent Name</th>
                  <th className="px-4 py-3 text-left">Phone Number</th>
                  <th className="px-4 py-3 text-right">Total Accrued</th>
                  <th className="px-4 py-3 text-right">Pending Dues</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {defaultersList.map(d => (
                  <tr key={d.student.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-medium text-slate-700">{d.student.admissionNo}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{d.student.fullName}</td>
                    <td className="px-4 py-3 text-slate-700">{d.student.class} - {d.student.section}</td>
                    <td className="px-4 py-3 text-slate-800">{d.student.parentName}</td>
                    <td className="px-4 py-3 font-mono text-indigo-600">{d.student.parentPhone}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{formatINR(d.totalFee)}</td>
                    <td className="px-4 py-3 text-right font-bold text-rose-600 font-mono">
                      {formatINR(d.pendingAmount)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <a
                        href={`tel:${d.student.parentPhone}`}
                        className="rounded bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                      >
                        Call Parent
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Fee Collection Audit */}
      {activeReportTab === 'fee-collection' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Fee Collection Journal</h3>
              <p className="text-xs text-slate-500">Every receipt issued by cashiers with payment instrument</p>
            </div>
            <button
              onClick={handleExportFeeCollection}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export Audit Register</span>
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold">
                <tr>
                  <th className="px-4 py-3 text-left">Receipt No</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Student Name</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">Mode</th>
                  <th className="px-4 py-3 text-left">Cashier</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {payments.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-bold text-indigo-700">{p.receiptNo}</td>
                    <td className="px-4 py-3 text-slate-600">{p.paymentDate}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{p.studentName}</td>
                    <td className="px-4 py-3 text-slate-600">{p.feeType}</td>
                    <td className="px-4 py-3 font-medium text-slate-700">{p.paymentMethod}</td>
                    <td className="px-4 py-3 text-slate-500">{p.collectedBy}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                      {formatINR(p.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Payroll Summary */}
      {activeReportTab === 'payroll' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900">Staff Remuneration Audit</h3>
            <p className="text-xs text-slate-500">Summary of salary disbursements and pending allowances</p>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold">
                <tr>
                  <th className="px-4 py-3 text-left">Staff Name</th>
                  <th className="px-4 py-3 text-left">Department</th>
                  <th className="px-4 py-3 text-left">Month</th>
                  <th className="px-4 py-3 text-left">Mode</th>
                  <th className="px-4 py-3 text-right">Base Salary</th>
                  <th className="px-4 py-3 text-right">Net Disbursed</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {payroll.map((p: PayrollRecord) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-900">{p.staffName}</td>
                    <td className="px-4 py-3 text-slate-600">{p.department || p.designation || 'Staff'}</td>
                    <td className="px-4 py-3 text-slate-600">{p.month}</td>
                    <td className="px-4 py-3 text-slate-600">{p.paymentMethod || 'Bank Transfer'}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{formatINR(p.baseSalary || p.monthlySalary || 0)}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">{formatINR(p.netSalary || p.finalPayable || 0)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex rounded-full px-2 py-0.5 font-semibold text-[10px] uppercase ${
                        (p.paymentStatus === 'Paid' || p.status === 'Paid') ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {p.paymentStatus || p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
