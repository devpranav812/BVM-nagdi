import React, { useState } from 'react';
import { X, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, RefreshCw, Download } from 'lucide-react';
import { Student } from '../../types';
import { StorageService } from '../../services/storageService';
import { downloadCSV } from '../../utils/csvExport';

interface StudentImportModalProps {
  onClose: () => void;
  onImportSuccess: (importedCount: number) => void;
  existingAdmissionNos: string[];
}

interface ParsedRow {
  rowNum: number;
  data: Partial<Student>;
  errors: string[];
  isValid: boolean;
}

const SAMPLE_CSV = `Admission Number,Name,Date of Birth,Gender,Class,Section,Roll Number,Parent Name,Parent Phone,Address,Previous Year Due
BVM-2026-0301,Manish Soren,2012-03-15,Male,Class 8,A,06,Jetha Soren,9835100201,"Village Kudlum, Nagdi",0
BVM-2026-0302,Rani Kumari,2012-07-20,Female,Class 8,A,07,Rameshwar Gope,9835100202,"Near High School, Nagdi",1200
BVM-2026-0303,Karan Birsa,2011-12-10,Male,Class 9,A,03,Somra Birsa,9835100203,"NH 75 By-pass, Nagdi",0
BVM-2026-0304,Aarav Sharma,2019-05-14,Male,Nursery,A,01,Sunil Sharma,9829012345,"Nagdi Bazar, Pratapgarh",0`;

/**
 * Robust CSV line parser handling quotes, escaped quotes, and commas
 */
function parseCSVLine(text: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        cur += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += char;
    }
  }
  result.push(cur.trim());
  return result;
}

export const StudentImportModal: React.FC<StudentImportModalProps> = ({
  onClose,
  onImportSuccess,
  existingAdmissionNos
}) => {
  const [csvText, setCsvText] = useState(SAMPLE_CSV);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [hasPreviewed, setHasPreviewed] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const existingSet = new Set(existingAdmissionNos.map(s => s.toLowerCase().trim()));

  const handleDownloadSample = () => {
    const headers = [
      'Admission Number',
      'Name',
      'Date of Birth',
      'Gender',
      'Class',
      'Section',
      'Roll Number',
      'Parent Name',
      'Parent Phone',
      'Address',
      'Previous Year Due'
    ];
    const sampleRows = [
      ['BVM-2026-0301', 'Manish Soren', '2012-03-15', 'Male', 'Class 8', 'A', '06', 'Jetha Soren', '9835100201', 'Village Kudlum, Nagdi', '0'],
      ['BVM-2026-0302', 'Rani Kumari', '2012-07-20', 'Female', 'Class 8', 'A', '07', 'Rameshwar Gope', '9835100202', 'Near High School, Nagdi', '1200'],
      ['BVM-2026-0303', 'Karan Birsa', '2011-12-10', 'Male', 'Class 9', 'A', '03', 'Somra Birsa', '9835100203', 'NH 75 By-pass, Nagdi', '0'],
      ['BVM-2026-0304', 'Aarav Sharma', '2019-05-14', 'Male', 'Nursery', 'A', '01', 'Sunil Sharma', '9829012345', 'Nagdi Bazar, Pratapgarh', '0']
    ];
    downloadCSV('BVM_Student_Import_Template', headers, sampleRows);
  };

  const parseAndValidate = () => {
    const lines = csvText.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) {
      alert('CSV must contain a header row and at least one student record row.');
      return;
    }

    // Inspect header row to determine column indices dynamically
    const headerCols = parseCSVLine(lines[0]).map(c => c.toLowerCase().trim());
    const findIndex = (keywords: string[]): number => {
      return headerCols.findIndex(h => keywords.some(k => h.includes(k)));
    };

    const admIdx = findIndex(['admission', 'adm', 'id']);
    const nameIdx = findIndex(['name', 'student']);
    const dobIdx = findIndex(['dob', 'birth', 'date of birth']);
    const genderIdx = findIndex(['gender', 'sex']);
    const classIdx = findIndex(['class', 'grade']);
    const secIdx = findIndex(['section', 'sec']);
    const rollIdx = findIndex(['roll']);
    const parentIdx = findIndex(['parent', 'father', 'guardian']);
    const phoneIdx = findIndex(['phone', 'mobile', 'contact']);
    const addrIdx = findIndex(['address', 'village', 'city', 'location']);
    const dueIdx = findIndex(['due', 'pending', 'arrears', 'previous']);

    const rows: ParsedRow[] = [];
    const localAdmissionSet = new Set<string>();

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;
      const cols = parseCSVLine(line);

      const admissionNo = (admIdx >= 0 ? cols[admIdx] : cols[0]) || '';
      const fullName = (nameIdx >= 0 ? cols[nameIdx] : cols[1]) || '';
      const dob = (dobIdx >= 0 ? cols[dobIdx] : cols[2]) || '2012-01-01';
      const genderRaw = (genderIdx >= 0 ? cols[genderIdx] : 'Male') || 'Male';
      const gender = genderRaw.toLowerCase().startsWith('f') ? 'Female' : 'Male';
      const className = (classIdx >= 0 ? cols[classIdx] : cols[3]) || 'Class 1';
      const section = (secIdx >= 0 ? cols[secIdx] : cols[4]) || 'A';
      const rollNo = (rollIdx >= 0 ? cols[rollIdx] : cols[5]) || '01';
      const parentName = (parentIdx >= 0 ? cols[parentIdx] : cols[6]) || '';
      const parentPhone = ((phoneIdx >= 0 ? cols[phoneIdx] : cols[7]) || '').replace(/[^0-9]/g, '');
      const address = (addrIdx >= 0 ? cols[addrIdx] : cols[8]) || 'Nagdi, Rajasthan';
      const prevDueRaw = dueIdx >= 0 ? cols[dueIdx] : '0';
      const previousYearPendingFee = Math.max(0, Number(prevDueRaw.replace(/[^0-9.]/g, '')) || 0);

      const errors: string[] = [];

      if (!admissionNo) {
        errors.push('Missing Admission No');
      } else if (existingSet.has(admissionNo.toLowerCase())) {
        errors.push(`Duplicate Admission No (${admissionNo}) already in system`);
      } else if (localAdmissionSet.has(admissionNo.toLowerCase())) {
        errors.push(`Duplicate Admission No (${admissionNo}) in this CSV`);
      } else {
        localAdmissionSet.add(admissionNo.toLowerCase());
      }

      if (!fullName) errors.push('Missing Student Name');
      if (!parentName) errors.push('Missing Parent Name');
      if (!parentPhone || parentPhone.length < 10) errors.push('Phone must be 10 digits');
      if (!className) errors.push('Missing Class');

      rows.push({
        rowNum: i,
        data: {
          id: `std-imp-${Date.now()}-${i}-${Math.floor(100 + Math.random() * 900)}`,
          schoolId: 'bvm-nagdi-01',
          admissionNo: admissionNo.trim(),
          fullName: fullName.trim(),
          dob: dob.trim(),
          gender: gender as 'Male' | 'Female',
          class: className.trim(),
          section: section.trim().toUpperCase() || 'A',
          rollNo: rollNo.trim(),
          parentName: parentName.trim(),
          parentPhone: parentPhone.slice(-10),
          address: address.trim(),
          admissionDate: new Date().toISOString().split('T')[0],
          status: 'active',
          bloodGroup: 'B+',
          previousYearPendingFee
        },
        errors,
        isValid: errors.length === 0
      });
    }

    setParsedRows(rows);
    setHasPreviewed(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const text = event.target?.result as string;
      if (text) {
        setCsvText(text);
        setHasPreviewed(false);
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = () => {
    const validStudents = parsedRows.filter(r => r.isValid).map(r => r.data as Student);
    if (validStudents.length === 0) {
      alert('No valid student rows to import. Please resolve the validation errors.');
      return;
    }

    setIsImporting(true);
    try {
      // Actually save the students into StorageService and Supabase
      StorageService.saveStudents(validStudents);
      onImportSuccess(validStudents.length);
    } catch (err: any) {
      alert(`Error saving students: ${err?.message || 'Unknown error'}`);
      setIsImporting(false);
    }
  };

  const validCount = parsedRows.filter(r => r.isValid).length;
  const invalidCount = parsedRows.length - validCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-4xl rounded-xl bg-white shadow-xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-indigo-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Bulk Import Students (CSV / Excel)
              </h3>
              <p className="text-xs text-slate-500">
                Upload or paste student records with row-by-row validation & instant sync
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadSample}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 shadow-2xs transition-colors"
              title="Download sample CSV template"
            >
              <Download className="h-3.5 w-3.5 text-indigo-600" />
              <span>Download Sample CSV</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* File Upload or Paste Box */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                CSV Data Input / File Select
              </label>
              <div className="flex items-center gap-2">
                <label className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer shadow-2xs">
                  <Upload className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Choose CSV File</span>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <textarea
              rows={5}
              value={csvText}
              onChange={e => {
                setCsvText(e.target.value);
                setHasPreviewed(false);
              }}
              className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs font-mono text-slate-800 focus:border-indigo-600 focus:outline-none"
              placeholder="Paste comma-separated student rows here..."
            />

            <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[11px] text-slate-500">
              <span>Columns: Admission No, Name, DOB, Gender, Class, Section, Roll, Parent Name, Phone, Address, Previous Year Due</span>
              <button
                type="button"
                onClick={parseAndValidate}
                className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer shrink-0"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Validate & Preview Records
              </button>
            </div>
          </div>

          {/* Validation & Preview Table */}
          {hasPreviewed && (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-slate-100 px-4 py-2.5 text-xs">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-semibold text-slate-800">
                    Total Rows Analyzed: <strong>{parsedRows.length}</strong>
                  </span>
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <CheckCircle2 className="h-3.5 w-3.5" /> {validCount} Ready to Import
                  </span>
                  {invalidCount > 0 && (
                    <span className="inline-flex items-center gap-1 text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      <AlertCircle className="h-3.5 w-3.5" /> {invalidCount} Needs Correction
                    </span>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold">
                    <tr>
                      <th className="px-3 py-2 text-left">Status</th>
                      <th className="px-3 py-2 text-left">Adm No</th>
                      <th className="px-3 py-2 text-left">Student Name</th>
                      <th className="px-3 py-2 text-left">Class & Sec</th>
                      <th className="px-3 py-2 text-left">Parent Name</th>
                      <th className="px-3 py-2 text-left">Parent Phone</th>
                      <th className="px-3 py-2 text-right">Prev Year Due</th>
                      <th className="px-3 py-2 text-left">Validation Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {parsedRows.map(row => (
                      <tr key={row.rowNum} className={row.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/50'}>
                        <td className="px-3 py-2">
                          {row.isValid ? (
                            <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                              <CheckCircle2 className="h-3 w-3" /> Valid
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-800">
                              <AlertCircle className="h-3 w-3" /> Error
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 font-mono font-medium text-slate-800">
                          {row.data.admissionNo || '-'}
                        </td>
                        <td className="px-3 py-2 font-medium text-slate-800">
                          {row.data.fullName || '-'}
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          {row.data.class} - {row.data.section} (Roll: {row.data.rollNo})
                        </td>
                        <td className="px-3 py-2 text-slate-600">{row.data.parentName || '-'}</td>
                        <td className="px-3 py-2 font-mono text-slate-600">{row.data.parentPhone || '-'}</td>
                        <td className="px-3 py-2 text-right font-mono text-slate-700">
                          ₹{row.data.previousYearPendingFee || 0}
                        </td>
                        <td className="px-3 py-2">
                          {row.isValid ? (
                            <span className="text-emerald-700 font-medium">Ready</span>
                          ) : (
                            <span className="text-rose-700 font-semibold">{row.errors.join(', ')}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            {!hasPreviewed ? (
              <button
                type="button"
                onClick={parseAndValidate}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
              >
                Validate Records
              </button>
            ) : (
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={validCount === 0 || isImporting}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>{isImporting ? 'Importing...' : `Import ${validCount} Valid Students`}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
