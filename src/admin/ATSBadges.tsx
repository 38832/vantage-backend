import React from 'react';
import { Download, ShieldCheck } from 'lucide-react';

export function StatusBadge({ status }: { status?: string }) {
  const s = (status || 'new').toLowerCase();
  switch (s) {
    case 'new':
    case 'applied':
      return (
        <span className="inline-flex items-center space-x-1 bg-sky-500/15 text-sky-400 border border-sky-500/30 px-2.5 py-1 rounded-md text-[11px] font-bold">
          New Review
        </span>
      );
    case 'contacted':
      return (
        <span className="inline-flex items-center space-x-1 bg-purple-500/15 text-purple-400 border border-purple-500/30 px-2.5 py-1 rounded-md text-[11px] font-bold">
          Contacted
        </span>
      );
    case 'shortlisted':
      return (
        <span className="inline-flex items-center space-x-1 bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-md text-[11px] font-bold">
          Shortlisted
        </span>
      );
    case 'interview_scheduled':
      return (
        <span className="inline-flex items-center space-x-1 bg-blue-500/15 text-blue-400 border border-blue-500/30 px-2.5 py-1 rounded-md text-[11px] font-bold">
          Interview Set
        </span>
      );
    case 'interviewed':
      return (
        <span className="inline-flex items-center space-x-1 bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 px-2.5 py-1 rounded-md text-[11px] font-bold">
          Interview Passed
        </span>
      );
    case 'visa_pending':
    case 'document_pending':
      return (
        <span className="inline-flex items-center space-x-1 bg-orange-500/15 text-orange-400 border border-orange-500/30 px-2.5 py-1 rounded-md text-[11px] font-bold">
          Visa Pending
        </span>
      );
    case 'visa_approved':
      return (
        <span className="inline-flex items-center space-x-1 bg-teal-500/15 text-teal-400 border border-teal-500/30 px-2.5 py-1 rounded-md text-[11px] font-bold">
          Visa Approved
        </span>
      );
    case 'hired':
      return (
        <span className="inline-flex items-center space-x-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-md text-[11px] font-bold">
          Hired & Deployed
        </span>
      );
    case 'rejected':
      return (
        <span className="inline-flex items-center space-x-1 bg-rose-500/15 text-rose-400 border border-rose-500/30 px-2.5 py-1 rounded-md text-[11px] font-bold">
          Rejected
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center space-x-1 bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded text-[11px] font-semibold">
          {status}
        </span>
      );
  }
}

export function PassportBadge({ status, medical }: { status?: string; medical?: string }) {
  const isReady = (status || '').toLowerCase().includes('ready') || (status || '').toLowerCase().includes('valid');
  return (
    <div className="space-y-1">
      <span
        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${
          isReady
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
        }`}
      >
        <ShieldCheck className="w-3 h-3 flex-shrink-0" />
        <span>Passport: {status || 'Ready'}</span>
      </span>
      {medical && (
        <div className="text-[10px] text-slate-400 font-mono">
          Medical: <span className="text-cyan-400 font-semibold">{medical.replace('_', ' ')}</span>
        </div>
      )}
    </div>
  );
}

export function ExportButtons({
  disabled = false,
  onExport,
  variant = 'header',
}: {
  disabled?: boolean;
  onExport: (format: 'csv' | 'excel') => void;
  variant?: 'header' | 'bulk';
}) {
  const showIcons = variant === 'header';
  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onExport('csv')}
        className={
          variant === 'header'
            ? 'inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition disabled:opacity-40'
            : 'px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition'
        }
      >
        {showIcons && <Download className="w-3.5 h-3.5 text-cyan-400" />}
        <span>Export CSV</span>
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onExport('excel')}
        className={
          variant === 'header'
            ? 'inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition disabled:opacity-40'
            : 'px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition'
        }
      >
        {showIcons && <Download className="w-3.5 h-3.5" />}
        <span>Export Excel</span>
      </button>
    </>
  );
}
