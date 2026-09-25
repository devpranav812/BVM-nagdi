import { jsPDF } from 'jspdf';
import { PaymentReceipt, PayrollRecord, SchoolInfo } from '../types';
import { StorageService } from '../services/storageService';

/**
 * Generates and downloads a clean, professional PDF Fee Receipt.
 */
export function downloadFeeReceiptPDF(
  receipt: PaymentReceipt,
  schoolInfo: SchoolInfo,
  pendingAmount?: number
): void {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;
    let y = 14;

    // Resolve remaining pending dues accurately
    let remainingPending = pendingAmount;
    if (remainingPending === undefined) {
      if (receipt.pendingAmount !== undefined && receipt.pendingAmount !== null) {
        remainingPending = Number(receipt.pendingAmount);
      } else if (receipt.studentId) {
        try {
          const calc = StorageService.getStudentFeeCalculation(receipt.studentId);
          remainingPending = calc.pendingAmount;
        } catch {
          remainingPending = 0;
        }
      } else {
        remainingPending = 0;
      }
    }

    // Outer Decorative Border
    doc.setDrawColor(30, 41, 59); // slate-800
    doc.setLineWidth(0.8);
    doc.rect(margin, margin, contentWidth, 269);
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.setLineWidth(0.3);
    doc.rect(margin + 1.5, margin + 1.5, contentWidth - 3, 266);

    y += 10;

    // School Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(schoolInfo.name.toUpperCase(), pageWidth / 2, y, { align: 'center' });

    y += 5.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105); // slate-600
    const addressLine = `${schoolInfo.address || 'Nagdi, Arnod, Dist. Pratapgarh (Raj.) 312615'}`;
    doc.text(addressLine, pageWidth / 2, y, { align: 'center' });

    y += 4.5;
    const metaLine = `Helpdesk: ${schoolInfo.contactNumber || '9929882820'}  |  Email: ${schoolInfo.email || 'bvmnagdi@gmail.com'}  |  Affiliation: ${schoolInfo.affiliationNumber || 'RBSE-RJ/48201/SEC'}`;
    doc.text(metaLine, pageWidth / 2, y, { align: 'center' });

    y += 7;
    // Badge / Title Banner
    doc.setFillColor(241, 245, 249); // slate-100
    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(0.5);
    doc.roundedRect(pageWidth / 2 - 55, y, 110, 8.5, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`OFFICIAL FEE COLLECTION RECEIPT  •  ${schoolInfo.academicYear || '2024-2025'}`, pageWidth / 2, y + 5.8, { align: 'center' });

    y += 15;

    // Receipt Meta Details Box (2-column key/value grid)
    const boxX = margin + 5;
    const boxWidth = contentWidth - 10;
    const col2X = boxX + boxWidth / 2 + 5;

    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.3);
    doc.roundedRect(boxX, y, boxWidth, 42, 2, 2, 'FD');

    const detailY = y + 7;
    doc.setFontSize(9.5);

    // Left Column
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Student Name:', boxX + 4, detailY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(receipt.studentName || '-', boxX + 32, detailY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Admission No:', boxX + 4, detailY + 8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(receipt.admissionNo || '-', boxX + 32, detailY + 8);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Class & Section:', boxX + 4, detailY + 16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${receipt.class || '-'} - Section ${receipt.section || 'A'}`, boxX + 32, detailY + 16);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Fee Category:', boxX + 4, detailY + 24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(receipt.feeType || 'Tuition Fee', boxX + 32, detailY + 24);

    // Right Column
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Receipt No:', col2X, detailY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(67, 56, 202); // indigo-700
    doc.text(receipt.receiptNo || '-', col2X + 28, detailY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Payment Date:', col2X, detailY + 8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(receipt.paymentDate || new Date().toISOString().split('T')[0], col2X + 28, detailY + 8);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Payment Mode:', col2X, detailY + 16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(receipt.paymentMethod || 'Cash', col2X + 28, detailY + 16);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Collected By:', col2X, detailY + 24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(receipt.collectedBy || 'Accounts Counter', col2X + 28, detailY + 24);

    y += 50;

    // Particulars / Fee Table
    const tableX = margin + 5;
    const tableWidth = contentWidth - 10;
    const tableHeaderY = y;
    const rowHeight = 10;

    // Header Row
    doc.setFillColor(30, 41, 59); // slate-800
    doc.rect(tableX, tableHeaderY, tableWidth, 9, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(255, 255, 255);
    doc.text('S.No.', tableX + 4, tableHeaderY + 6);
    doc.text('Fee Head / Description', tableX + 22, tableHeaderY + 6);
    doc.text('Amount (INR)', tableX + tableWidth - 6, tableHeaderY + 6, { align: 'right' });

    // Row 1: Fee Head
    let curY = tableHeaderY + 9;
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.line(tableX, curY, tableX + tableWidth, curY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('1.', tableX + 4, curY + 6.5);
    doc.setFont('helvetica', 'bold');
    doc.text(receipt.feeType || 'School Academic Fee', tableX + 22, curY + 6.5);
    if (receipt.notes) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`Remark: ${receipt.notes}`, tableX + 22, curY + 11);
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`Rs. ${Number(receipt.amount || 0).toLocaleString('en-IN')}`, tableX + tableWidth - 6, curY + 6.5, { align: 'right' });

    curY += receipt.notes ? 15 : 11;
    doc.line(tableX, curY, tableX + tableWidth, curY);

    // Row 2: Total Paid Amount (This Receipt)
    doc.setFillColor(241, 245, 249);
    doc.rect(tableX, curY, tableWidth, rowHeight, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('AMOUNT PAID (THIS RECEIPT):', tableX + 4, curY + 6.8);
    doc.setTextColor(4, 120, 87); // emerald-700
    doc.setFontSize(10);
    doc.text(`Rs. ${Number(receipt.amount || 0).toLocaleString('en-IN')}`, tableX + tableWidth - 6, curY + 6.8, { align: 'right' });

    curY += rowHeight;
    doc.line(tableX, curY, tableX + tableWidth, curY);

    // Row 3: Remaining Amount to be Paid
    doc.setFillColor(254, 243, 199); // amber-100
    doc.rect(tableX, curY, tableWidth, 11, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(146, 64, 14); // amber-800
    doc.text('REMAINING AMOUNT TO BE PAID:', tableX + 4, curY + 7.2);
    doc.setFontSize(10.5);
    if (remainingPending <= 0) {
      doc.setTextColor(4, 120, 87);
      doc.text('Rs. 0 (NIL / FULLY PAID)', tableX + tableWidth - 6, curY + 7.2, { align: 'right' });
    } else {
      doc.setTextColor(185, 28, 28); // rose-700
      doc.text(`Rs. ${Number(remainingPending).toLocaleString('en-IN')}`, tableX + tableWidth - 6, curY + 7.2, { align: 'right' });
    }

    curY += 11;
    doc.line(tableX, curY, tableX + tableWidth, curY);

    // Table border
    doc.setDrawColor(203, 213, 225);
    doc.rect(tableX, tableHeaderY, tableWidth, curY - tableHeaderY);

    y = curY + 7;

    // Dedicated Outstanding Dues & Fee Status Summary Callout Box
    const calloutHeight = 17;
    doc.setFillColor(remainingPending <= 0 ? 240 : 255, remainingPending <= 0 ? 253 : 251, remainingPending <= 0 ? 244 : 235);
    doc.setDrawColor(remainingPending <= 0 ? 34 : 245, remainingPending <= 0 ? 197 : 158, remainingPending <= 0 ? 94 : 11);
    doc.setLineWidth(0.6);
    doc.roundedRect(tableX, y, tableWidth, calloutHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(remainingPending <= 0 ? 22 : 146, remainingPending <= 0 ? 101 : 64, remainingPending <= 0 ? 52 : 14);
    doc.text('REMAINING BALANCE & FEE STATUS SUMMARY', tableX + 5, y + 5.8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    const totalFeeAssessed = receipt.totalFee !== undefined && receipt.totalFee > 0 ? receipt.totalFee : (Number(receipt.amount || 0) + Number(remainingPending));
    doc.text(`Total Annual Accrued Fee: Rs. ${Number(totalFeeAssessed).toLocaleString('en-IN')}  |  Paid in this transaction: Rs. ${Number(receipt.amount || 0).toLocaleString('en-IN')}`, tableX + 5, y + 12);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    if (remainingPending <= 0) {
      doc.setTextColor(4, 120, 87);
      doc.text('ALL DUES FULLY CLEARED', tableX + tableWidth - 6, y + 10.5, { align: 'right' });
    } else {
      doc.setTextColor(185, 28, 28);
      doc.text(`REMAINING TO PAY: Rs. ${Number(remainingPending).toLocaleString('en-IN')}`, tableX + tableWidth - 6, y + 10.5, { align: 'right' });
    }

    y += calloutHeight + 10;

    // Amount In Words (or Note)
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text('Note: This is an authentic fee acknowledgement. Please retain this receipt for year-end clearance.', boxX, y);

    y += 24;

    // Signatures Section
    const sigY = y;
    doc.setDrawColor(148, 163, 184); // slate-400
    doc.setLineWidth(0.4);

    // Cashier
    doc.line(boxX, sigY, boxX + 55, sigY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(receipt.collectedBy || 'Accounts Officer', boxX, sigY + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Accounts Counter Seal', boxX, sigY + 9);

    // Principal / Director
    const rightSigX = boxX + boxWidth - 55;
    doc.line(rightSigX, sigY, boxX + boxWidth, sigY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(schoolInfo.principalName || schoolInfo.directorName || 'Ashish Joshi (Director)', rightSigX, sigY + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Authorized Principal / Director Seal', rightSigX, sigY + 9);

    // Bottom Computer Generated Footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'Computer-generated official receipt of Bharat Vidya Mandir Secondary School, Nagdi. Valid without physical signature.',
      pageWidth / 2,
      274,
      { align: 'center' }
    );

    // Save PDF directly to user machine
    const cleanReceiptNo = (receipt.receiptNo || 'Receipt').replace(/[^a-zA-Z0-9_-]/g, '_');
    doc.save(`BVM_Fee_Receipt_${cleanReceiptNo}.pdf`);
  } catch (err) {
    console.error('Failed to generate Fee Receipt PDF:', err);
    throw err;
  }
}

/**
 * Generates and downloads a clean, professional PDF Salary Slip.
 */
export function downloadPayslipPDF(
  slip: PayrollRecord,
  schoolInfo: SchoolInfo
): void {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;
    let y = 14;

    const baseSalary = slip.baseSalary || slip.monthlySalary || 0;
    const allowances = slip.allowances || 0;
    const deductions = slip.deductions || 0;
    const netSalary = slip.netSalary || slip.finalPayable || 0;

    // Outer Decorative Border
    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(0.8);
    doc.rect(margin, margin, contentWidth, 269);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.rect(margin + 1.5, margin + 1.5, contentWidth - 3, 266);

    y += 10;

    // School Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text(schoolInfo.name.toUpperCase(), pageWidth / 2, y, { align: 'center' });

    y += 5.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105);
    const addressLine = `${schoolInfo.address || 'Nagdi, Arnod, Dist. Pratapgarh (Raj.) 312615'}`;
    doc.text(addressLine, pageWidth / 2, y, { align: 'center' });

    y += 4.5;
    const metaLine = `Helpdesk: ${schoolInfo.contactNumber || '9929882820'}  |  Email: ${schoolInfo.email || 'bvmnagdi@gmail.com'}`;
    doc.text(metaLine, pageWidth / 2, y, { align: 'center' });

    y += 7;
    // Badge / Title Banner
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(0.5);
    doc.roundedRect(pageWidth / 2 - 55, y, 110, 8.5, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`OFFICIAL STAFF SALARY SLIP  •  ${slip.month.toUpperCase()}`, pageWidth / 2, y + 5.8, { align: 'center' });

    y += 15;

    // Employee Meta Box
    const boxX = margin + 5;
    const boxWidth = contentWidth - 10;
    const col2X = boxX + boxWidth / 2 + 5;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(boxX, y, boxWidth, 42, 2, 2, 'FD');

    const detailY = y + 7;
    doc.setFontSize(9.5);

    // Left Column
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Employee Name:', boxX + 4, detailY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(slip.staffName || '-', boxX + 35, detailY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Employee ID:', boxX + 4, detailY + 8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(slip.employeeId || '-', boxX + 35, detailY + 8);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Department:', boxX + 4, detailY + 16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(slip.department || 'Academics', boxX + 35, detailY + 16);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Pay Period:', boxX + 4, detailY + 24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(slip.month || '-', boxX + 35, detailY + 24);

    // Right Column
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Payment Status:', col2X, detailY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(4, 120, 87); // emerald-700
    doc.text(slip.status || slip.paymentStatus || 'Paid', col2X + 32, detailY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Payment Mode:', col2X, detailY + 8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(slip.paymentMethod || 'Bank Transfer', col2X + 32, detailY + 8);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Disbursement Date:', col2X, detailY + 16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(slip.paymentDate || new Date().toISOString().split('T')[0], col2X + 32, detailY + 16);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Working Days:', col2X, detailY + 24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${slip.presentDays || 24} / ${slip.workingDays || 24} Days`, col2X + 32, detailY + 24);

    y += 50;

    // Remuneration Breakdown Table
    const tableX = margin + 5;
    const tableWidth = contentWidth - 10;
    const tableHeaderY = y;
    const rowHeight = 9.5;

    // Header Row
    doc.setFillColor(30, 41, 59);
    doc.rect(tableX, tableHeaderY, tableWidth, 9, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(255, 255, 255);
    doc.text('S.No.', tableX + 4, tableHeaderY + 6);
    doc.text('Earnings & Deductions Component', tableX + 22, tableHeaderY + 6);
    doc.text('Amount (INR)', tableX + tableWidth - 6, tableHeaderY + 6, { align: 'right' });

    let curY = tableHeaderY + 9;
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);

    // Row 1: Base Salary
    doc.line(tableX, curY, tableX + tableWidth, curY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('1.', tableX + 4, curY + 6.5);
    doc.text('Monthly Base Salary', tableX + 22, curY + 6.5);
    doc.setFont('helvetica', 'bold');
    doc.text(`Rs. ${Number(baseSalary).toLocaleString('en-IN')}`, tableX + tableWidth - 6, curY + 6.5, { align: 'right' });

    // Row 2: Allowances
    curY += rowHeight;
    doc.line(tableX, curY, tableX + tableWidth, curY);
    doc.setFont('helvetica', 'normal');
    doc.text('2.', tableX + 4, curY + 6.5);
    doc.text('Allowances & Academic Incentives', tableX + 22, curY + 6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(4, 120, 87);
    doc.text(`+ Rs. ${Number(allowances).toLocaleString('en-IN')}`, tableX + tableWidth - 6, curY + 6.5, { align: 'right' });

    // Row 3: Deductions
    curY += rowHeight;
    doc.line(tableX, curY, tableX + tableWidth, curY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text('3.', tableX + 4, curY + 6.5);
    doc.text('Leave / Attendance Deductions', tableX + 22, curY + 6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(185, 28, 28); // rose-700
    doc.text(`- Rs. ${Number(deductions).toLocaleString('en-IN')}`, tableX + tableWidth - 6, curY + 6.5, { align: 'right' });

    // Row 4: Net Remuneration Disbursed
    curY += rowHeight;
    doc.line(tableX, curY, tableX + tableWidth, curY);
    doc.setFillColor(238, 242, 255); // indigo-50
    doc.rect(tableX, curY, tableWidth, 11, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(49, 46, 129); // indigo-900
    doc.text('NET SALARY DISBURSED:', tableX + 22, curY + 7.5);
    doc.text(`Rs. ${Number(netSalary).toLocaleString('en-IN')}`, tableX + tableWidth - 6, curY + 7.5, { align: 'right' });

    curY += 11;
    doc.line(tableX, curY, tableX + tableWidth, curY);

    // Table outer border
    doc.rect(tableX, tableHeaderY, tableWidth, curY - tableHeaderY);

    y = curY + 20;

    // Signatures Section
    const sigY = y + 15;
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.4);

    // Accounts Section
    doc.line(boxX, sigY, boxX + 55, sigY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('Accounts Department', boxX, sigY + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Prepared & Verified', boxX, sigY + 9);

    // Employee Signature
    const rightSigX = boxX + boxWidth - 55;
    doc.line(rightSigX, sigY, boxX + boxWidth, sigY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(slip.staffName || 'Employee', rightSigX, sigY + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Employee Signature & Receipt', rightSigX, sigY + 9);

    // Bottom Computer Generated Footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'Computer-generated official remuneration voucher of Bharat Vidya Mandir Secondary School, Nagdi.',
      pageWidth / 2,
      274,
      { align: 'center' }
    );

    const cleanStaffName = (slip.staffName || 'Staff').replace(/[^a-zA-Z0-9_-]/g, '_');
    const cleanMonth = (slip.month || 'Month').replace(/[^a-zA-Z0-9_-]/g, '_');
    doc.save(`Payslip_${cleanStaffName}_${cleanMonth}.pdf`);
  } catch (err) {
    console.error('Failed to generate Payslip PDF:', err);
    throw err;
  }
}
