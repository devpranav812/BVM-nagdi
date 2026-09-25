import React, { useState } from 'react';
import { X, CreditCard, Receipt, ArrowRight } from 'lucide-react';
import { Student, PaymentReceipt, User } from '../../types';
import { StorageService } from '../../services/storageService';
import { formatINR } from '../../utils/csvExport';

interface PaymentModalProps {
  students: Student[];
  preSelectedStudentId?: string;
  currentUser: User;
  onClose: () => void;
  onPaymentSuccess: (receipt: PaymentReceipt) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  students,
  preSelectedStudentId,
  currentUser,
  onClose,
  onPaymentSuccess
}) => {
  const [studentId, setStudentId] = useState(preSelectedStudentId || students[0]?.id || '');
  const [feeType, setFeeType] = useState('Annual School Fee');
  const [amount, setAmount] = useState('5000');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank Transfer' | 'UPI' | 'Other'>('UPI');
  const [notes, setNotes] = useState('');

  const selectedStudent = students.find(s => s.id === studentId);
  const feeCalc = selectedStudent ? StorageService.getStudentFeeCalculation(selectedStudent.id) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    const previousPending = feeCalc ? feeCalc.pendingAmount : 0;
    const remainingPending = Math.max(0, previousPending - numAmount);
    const totalFee = feeCalc ? feeCalc.totalFee : numAmount;

    const createdReceipt = StorageService.recordPayment({
      schoolId: 'bvm-nagdi-01',
      studentId: selectedStudent.id,
      studentName: selectedStudent.fullName,
      admissionNo: selectedStudent.admissionNo,
      class: selectedStudent.class,
      section: selectedStudent.section,
      feeType,
      amount: numAmount,
      totalFee,
      pendingAmount: remainingPending,
      paymentDate,
      paymentMethod,
      notes,
      collectedBy: currentUser.name
    });

    onPaymentSuccess(createdReceipt);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl border border-slate-200 overflow-hidden my-8">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900">Record Fee Payment</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Student Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Student Account *
            </label>
            <select
              value={studentId}
              onChange={e => setStudentId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-600 focus:outline-none"
            >
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.class}-{s.section}, Adm: {s.admissionNo})
                </option>
              ))}
            </select>
          </div>

          {/* Student Dues Snapshot */}
          {feeCalc && (
            <div className="rounded-lg bg-slate-50 p-3 border border-slate-200 text-xs space-y-2">
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <span className="text-slate-400 text-[10px] block">ANNUAL FEE</span>
                  <span className="font-bold text-slate-800">{formatINR(feeCalc.annualFee)}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">PREV YEAR DUE</span>
                  <span className={`font-bold ${feeCalc.previousYearPendingFee > 0 ? 'text-rose-700' : 'text-slate-600'}`}>
                    {formatINR(feeCalc.previousYearPendingFee)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">TOTAL ACCRUED</span>
                  <span className="font-bold text-slate-800">{formatINR(feeCalc.totalFee)}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">PENDING DUE</span>
                  <span className="font-bold text-amber-700">{formatINR(feeCalc.pendingAmount)}</span>
                </div>
              </div>
              <div className="text-[11px] text-slate-500 text-center border-t border-slate-200 pt-1.5">
                Total Paid So Far: <strong className="text-emerald-700">{formatINR(feeCalc.paidAmount)}</strong>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fee Category / Type *
              </label>
              <select
                value={feeType}
                onChange={e => setFeeType(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-600 focus:outline-none"
              >
                <option value="Annual School Fee">Annual School Fee (Full / Installment)</option>
                <option value="Previous Year Pending Fee Payment">Previous Year Pending Fee Payment</option>
                <option value="Tuition Fee Installment">Tuition Fee Installment</option>
                <option value="Examination & Evaluation Fee">Examination & Evaluation Fee</option>
                <option value="Activity & Sports Fee">Activity & Sports Fee</option>
                <option value="Transport / Bus Fee">Transport / Bus Fee</option>
                <option value="Miscellaneous Dues">Miscellaneous Dues</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Amount Received (INR) *
              </label>
              <input
                type="number"
                required
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-900 focus:border-indigo-600 focus:outline-none"
                placeholder="2000"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Date *
              </label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={e => setPaymentDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Method *
              </label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as any)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-600 focus:outline-none"
              >
                <option value="UPI">UPI (Google Pay, PhonePe, Paytm)</option>
                <option value="Cash">Cash (Counter)</option>
                <option value="Bank Transfer">Bank Transfer (NEFT/RTGS/IMPS)</option>
                <option value="Other">Other / Cheque</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Transaction Notes / Reference ID
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. UPI Ref #918231023 or Receipt remarks"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-600 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 cursor-pointer"
            >
              <Receipt className="h-4 w-4" />
              <span>Generate & Print Receipt</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
