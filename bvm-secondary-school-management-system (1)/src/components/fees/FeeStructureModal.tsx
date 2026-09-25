import React, { useState } from 'react';
import { X, Save, Settings2 } from 'lucide-react';
import { FeeStructure } from '../../types';
import { StorageService } from '../../services/storageService';
import { formatINR } from '../../utils/csvExport';

interface FeeStructureModalProps {
  structure: FeeStructure;
  onClose: () => void;
  onSaved: (updated: FeeStructure) => void;
}

export const FeeStructureModal: React.FC<FeeStructureModalProps> = ({
  structure,
  onClose,
  onSaved
}) => {
  const [tuitionFee, setTuitionFee] = useState(String(structure.tuitionFee));
  const [activityFee, setActivityFee] = useState(String(structure.activityFee));
  const [transportFee, setTransportFee] = useState(String(structure.transportFee));
  const [examFee, setExamFee] = useState(String(structure.examFee));

  const numTuition = Number(tuitionFee) || 0;
  const numActivity = Number(activityFee) || 0;
  const numTransport = Number(transportFee) || 0;
  const numExam = Number(examFee) || 0;
  const totalAnnual = numTuition + numActivity + numTransport + numExam;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: FeeStructure = {
      ...structure,
      tuitionFee: numTuition,
      activityFee: numActivity,
      transportFee: numTransport,
      examFee: numExam,
      term: 'Annual'
    };

    StorageService.saveFeeStructure(updated);
    onSaved(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">
              Configure Annual Fee: {structure.class}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Annual Tuition Fee (INR) *
            </label>
            <input
              type="number"
              required
              min="0"
              value={tuitionFee}
              onChange={e => setTuitionFee(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-900 focus:border-indigo-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Annual Activity, Lab & Sports Fee (INR)
            </label>
            <input
              type="number"
              min="0"
              value={activityFee}
              onChange={e => setActivityFee(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-900 focus:border-indigo-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Annual Transport / Bus Fee (INR)
            </label>
            <input
              type="number"
              min="0"
              value={transportFee}
              onChange={e => setTransportFee(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-900 focus:border-indigo-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Annual Examination & Board Fee (INR)
            </label>
            <input
              type="number"
              min="0"
              value={examFee}
              onChange={e => setExamFee(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-900 focus:border-indigo-600 focus:outline-none"
            />
          </div>

          <div className="rounded-lg bg-emerald-50 p-3 border border-emerald-200 flex items-center justify-between text-xs">
            <span className="font-semibold text-emerald-900">Total Annual Fee:</span>
            <span className="font-mono font-black text-sm text-emerald-900">
              {formatINR(totalAnnual)} / Year
            </span>
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
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>Save Annual Fee</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
