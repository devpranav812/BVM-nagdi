import React from 'react';
import { X, Printer, Download, School, CheckCircle2, Phone, MapPin } from 'lucide-react';
import { PaymentReceipt, SchoolInfo } from '../../types';
import { StorageService } from '../../services/storageService';
import { formatINR } from '../../utils/csvExport';
import { downloadFeeReceiptPDF } from '../../utils/pdfGenerator';

interface FeeReceiptModalProps {
  receipt: PaymentReceipt;
  onClose: () => void;
}

export const FeeReceiptModal: React.FC<FeeReceiptModalProps> = ({
  receipt,
  onClose
}) => {
  const schoolInfo = StorageService.getSchoolInfo();
  const feeCalc = StorageService.getStudentFeeCalculation(receipt.studentId);
  const pendingAmount = receipt.pendingAmount !== undefined ? receipt.pendingAmount : feeCalc.pendingAmount;
  const totalAccruedFee = receipt.totalFee !== undefined ? receipt.totalFee : feeCalc.totalFee;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    try {
      downloadFeeReceiptPDF(receipt, schoolInfo, pendingAmount);
    } catch (e) {
      console.error('PDF generation error:', e);
      // Fallback to print
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-8 no-print:my-8">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200 bg-slate-50 px-6 py-3 no-print">
          <div>
            <span className="text-xs font-bold text-slate-800 block">Official Fee Collection Receipt</span>
            <span className="text-[11px] text-slate-500">Destination: Choose "Save as PDF" or select physical printer</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 shadow-2xs hover:bg-indigo-100 transition-colors cursor-pointer"
              title="Download official PDF receipt file"
            >
              <Download className="h-3.5 w-3.5 text-indigo-600" />
              <span>Download PDF Receipt</span>
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition-colors cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Receipt</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper */}
        <div id="printable-fee-receipt" className="p-8 space-y-6 bg-white printable-area">
          {/* Header - School Name at the Very Top */}
          <div className="border-b-2 border-slate-900 pb-4 text-center">
            <div className="flex flex-col items-center justify-center gap-1 mb-2">
              <div className="flex items-center justify-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white font-bold shrink-0">
                  <School className="h-5 w-5" />
                </div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase">
                  {schoolInfo.name}
                </h1>
              </div>
              <p className="text-xs font-semibold text-slate-700">
                Nagdi, Arnod, Dist. Pratapgarh, Rajasthan
              </p>
            </div>
            <p className="text-xs text-slate-600">
              School Helpdesk: <strong>{schoolInfo.contactNumber}</strong> &bull; Affiliation No: <strong>{schoolInfo.affiliationNumber}</strong> &bull; Email: {schoolInfo.email}
            </p>
            <div className="mt-2.5 inline-block rounded border-2 border-slate-900 bg-slate-50 px-4 py-1 text-xs font-black uppercase tracking-wider text-slate-900">
              FEE COLLECTION RECEIPT &bull; ACADEMIC SESSION {schoolInfo.academicYear}
            </div>
          </div>

          {/* Receipt Meta & Student Details */}
          <div className="grid grid-cols-2 gap-4 text-xs border-b border-slate-200 pb-4">
            <div className="space-y-1">
              <div>
                <span className="text-slate-500">Student Name: </span>
                <strong className="text-slate-900 text-sm">{receipt.studentName}</strong>
              </div>
              <div>
                <span className="text-slate-500">Admission No: </span>
                <strong className="font-mono text-slate-900">{receipt.admissionNo}</strong>
              </div>
              <div>
                <span className="text-slate-500">Class & Section: </span>
                <strong className="text-slate-900">{receipt.class} - {receipt.section}</strong>
              </div>
            </div>

            <div className="space-y-1 text-right">
              <div>
                <span className="text-slate-500">Receipt No: </span>
                <strong className="font-mono text-slate-900 text-sm">{receipt.receiptNo}</strong>
              </div>
              <div>
                <span className="text-slate-500">Payment Date: </span>
                <strong className="text-slate-900">{receipt.paymentDate}</strong>
              </div>
              <div>
                <span className="text-slate-500">Payment Mode: </span>
                <strong className="text-slate-900">{receipt.paymentMethod}</strong>
              </div>
              <div>
                <span className="text-slate-500">Remaining Dues: </span>
                <strong className={`font-mono ${pendingAmount > 0 ? 'text-amber-800 font-bold' : 'text-emerald-700'}`}>
                  {formatINR(pendingAmount)}
                </strong>
              </div>
            </div>
          </div>

          {/* Breakdown Table */}
          <div>
            <table className="w-full text-xs border border-slate-200">
              <thead className="bg-slate-100 font-bold text-slate-800">
                <tr>
                  <th className="border border-slate-200 p-2 text-left">Fee Head / Description</th>
                  <th className="border border-slate-200 p-2 text-right">Amount (INR)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-200 p-3">
                    <p className="font-semibold text-slate-900">{receipt.feeType}</p>
                    {receipt.notes && (
                      <p className="text-[11px] text-slate-500 mt-0.5 italic">{receipt.notes}</p>
                    )}
                  </td>
                  <td className="border border-slate-200 p-3 text-right font-mono font-bold text-sm text-slate-900">
                    {formatINR(receipt.amount)}
                  </td>
                </tr>
                <tr className="bg-slate-50 font-bold">
                  <td className="border border-slate-200 p-2.5 text-right uppercase tracking-wider text-slate-700">
                    Amount Paid (This Receipt):
                  </td>
                  <td className="border border-slate-200 p-2.5 text-right font-mono text-base text-emerald-800 font-bold">
                    {formatINR(receipt.amount)}
                  </td>
                </tr>
                {/* Prominent Pending Amount in Receipt */}
                <tr className="bg-amber-50/70 border-t-2 border-slate-300">
                  <td className="border border-slate-200 p-2.5 text-right font-bold uppercase tracking-wider text-amber-900">
                    Remaining Pending Fee Balance:
                  </td>
                  <td className="border border-slate-200 p-2.5 text-right font-mono text-base font-black text-amber-900">
                    {formatINR(pendingAmount)}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Fee Dues Summary Bar */}
            <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs">
              <div className="text-slate-600">
                <span>Total Session Fee: </span>
                <strong className="font-mono text-slate-900">{formatINR(totalAccruedFee)}</strong>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Balance Status:</span>
                {pendingAmount === 0 ? (
                  <span className="font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                    ✓ No Dues Pending
                  </span>
                ) : (
                  <span className="font-bold text-amber-900 bg-amber-100/90 px-2 py-0.5 rounded border border-amber-200 text-[11px]">
                    Pending Dues: {formatINR(pendingAmount)}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-2 text-[11px] text-slate-600">
              Payment Status: <span className="font-bold text-emerald-700">SUCCESSFULLY SETTLED</span> &bull; Collected by Accounts Counter
            </div>
          </div>

          {/* Signature Block */}
          <div className="pt-8 grid grid-cols-2 gap-8 text-xs">
            <div className="text-left pt-6 border-t border-slate-300">
              <p className="font-semibold text-slate-800">{receipt.collectedBy || 'Accounts Officer'}</p>
              <p className="text-[11px] text-slate-500">Cashier / Accountant</p>
            </div>
            <div className="text-right pt-6 border-t border-slate-300">
              <p className="font-semibold text-slate-800">{schoolInfo.principalName || schoolInfo.directorName || 'Ashish Joshi (Director)'}</p>
              <p className="text-[11px] text-slate-500">Authorized Principal / Director Seal</p>
            </div>
          </div>

          <div className="text-center text-[10px] text-slate-400 border-t border-slate-100 pt-3">
            This is an official computer-generated fee acknowledgement of BVM Secondary School, Nagdi.
          </div>
        </div>

        {/* Footer (Screen only) */}
        <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-3 no-print">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            Close
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-700 shadow-2xs hover:bg-indigo-100 cursor-pointer"
          >
            <Download className="h-4 w-4 text-indigo-600" />
            <span>Download PDF Receipt</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>
    </div>
  );
};
