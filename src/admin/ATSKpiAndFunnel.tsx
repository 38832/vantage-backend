import React from 'react';
import { Calendar, CheckCircle2, Clock, FileCheck2, TrendingUp, UserCheck, Users } from 'lucide-react';
import type { ATSApplication } from './types';

interface ATSKpiAndFunnelProps {
  applications: ATSApplication[];
  onSelectStatusFilter: (status: string) => void;
  onSelectTradeFilter: (trade: string) => void;
  onSelectDestinationFilter: (dest: string) => void;
}

const CATEGORY_MATCHERS = [
  { key: 'Technical', keywords: ['welder', 'hvac', 'electrician', 'plumber', 'technician', 'mechanic', 'pipe', 'fitter', 'instrument', 'chiller', 'technical'] },
  { key: 'Construction', keywords: ['civil', 'mason', 'carpenter', 'steel', 'qa/qc', 'inspector', 'foreman', 'scaffolder', 'construction', 'engineer'] },
  { key: 'Hospitality', keywords: ['chef', 'cook', 'waiter', 'barista', 'hotel', 'hospitality', 'steward', 'kitchen'] },
  { key: 'Driver', keywords: ['driver', 'trailer', 'forklift', 'crane', 'logistics', 'transport', 'operator'] },
  { key: 'Healthcare', keywords: ['nurse', 'caregiver', 'pharmacist', 'lab', 'medical', 'healthcare'] },
  { key: 'Office & Admin', keywords: ['accountant', 'hr', 'admin', 'document', 'receptionist', 'coordinator', 'office'] },
];

export function ATSKpiAndFunnel({
  applications,
  onSelectStatusFilter,
  onSelectTradeFilter,
  onSelectDestinationFilter,
}: ATSKpiAndFunnelProps) {
  const total = applications.length;
  const stages = [
    { key: 'new_applied', label: 'New Applied', filterVal: 'new', statuses: ['new', 'contacted'] },
    { key: 'shortlisted', label: 'Shortlisted', filterVal: 'shortlisted', statuses: ['shortlisted'] },
    { key: 'interview_set', label: 'Interview Set', filterVal: 'interview_scheduled', statuses: ['interview_scheduled', 'interviewed'] },
    { key: 'medical_visa', label: 'Medical & Visa', filterVal: 'medical_pending', statuses: ['document_pending', 'medical_pending', 'visa_pending', 'visa_approved'] },
    { key: 'deployed', label: 'Deployed', filterVal: 'hired', statuses: ['hired'] },
  ].map((st) => ({
    ...st,
    count: applications.filter((a) => st.statuses.includes(a.application_status || a.status || 'new')).length,
  }));
  const maxBacklog = Math.max(...stages.filter((s) => s.key !== 'deployed').map((s) => s.count), 0);
  const deployedCount = stages.find((s) => s.key === 'deployed')?.count || 0;
  const convPct = total > 0 ? Math.round((deployedCount / total) * 1000) / 10 : 0;

  const denom = applications.length || 1;
  const tradeCounts = new Map<string, number>();
  CATEGORY_MATCHERS.forEach((m) => tradeCounts.set(m.key, 0));
  const destCounts = new Map<string, number>();
  applications.forEach((a) => {
    const roleText = (a.candidate_job_title || a.candidate_role || a.job_title || '').toLowerCase();
    const matched = CATEGORY_MATCHERS.find((m) => m.keywords.some((kw) => roleText.includes(kw)));
    const tKey = matched ? matched.key : 'Other Trades';
    tradeCounts.set(tKey, (tradeCounts.get(tKey) || 0) + 1);
    const dKey = a.destination_country || a.location_country || 'GCC / Overseas';
    destCounts.set(dKey, (destCounts.get(dKey) || 0) + 1);
  });
  const trades = Array.from(tradeCounts.entries()).sort((a, b) => b[1] - a[1]);
  const dests = Array.from(destCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);

  return (
    <>
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Total Pool</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">{applications.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center space-x-1">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            <span>Active candidates</span>
          </div>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-sky-500/30 bg-sky-500/5">
          <div className="flex items-center justify-between text-sky-400 text-xs font-medium">
            <span>New Review</span>
            <Clock className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black text-sky-400 mt-2">
            {applications.filter((a) => (a.application_status || a.status) === 'new').length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Needs screening</div>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-amber-500/30 bg-amber-500/5">
          <div className="flex items-center justify-between text-amber-400 text-xs font-medium">
            <span>Shortlisted</span>
            <UserCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 mt-2">
            {applications.filter((a) => (a.application_status || a.status) === 'shortlisted').length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Ready for client</div>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-blue-500/30 bg-blue-500/5">
          <div className="flex items-center justify-between text-blue-400 text-xs font-medium">
            <span>Interviews</span>
            <Calendar className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400 mt-2">
            {applications.filter((a) => (a.application_status || a.status) === 'interview_scheduled').length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Zoom & Trade Test</div>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-orange-500/30 bg-orange-500/5">
          <div className="flex items-center justify-between text-orange-400 text-xs font-medium">
            <span>Visa Pipeline</span>
            <FileCheck2 className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-black text-orange-400 mt-2">
            {applications.filter((a) => (a.application_status || a.status) === 'visa_pending').length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Embassy Stamping</div>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-medium">
            <span>Hired & Deployed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-2">
            {applications.filter((a) => (a.application_status || a.status) === 'hired').length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Overseas joined</div>
        </div>
      </div>

      {/* Visual Recruitment Pipeline Funnel */}
      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Visual Recruitment Pipeline Funnel</h3>
            <p className="text-[11px] text-slate-400">New Applied → Shortlisted → Interview Set → Medical &amp; Visa → Deployed</p>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            {convPct}% deployed ({deployedCount}/{total})
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {stages.map((st, idx) => {
            const share = total > 0 ? Math.round((st.count / total) * 1000) / 10 : 0;
            const isBottleneck = st.key !== 'deployed' && maxBacklog > 0 && st.count === maxBacklog;
            return (
              <button
                key={st.key}
                type="button"
                onClick={() => onSelectStatusFilter(st.filterVal)}
                className={`text-left rounded-xl border p-3 transition ${
                  isBottleneck
                    ? 'border-rose-500/40 bg-rose-500/10 hover:border-rose-400'
                    : 'border-slate-800 bg-slate-950/60 hover:border-amber-500/40'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">{idx + 1}. {st.label}</span>
                  {isBottleneck && (
                    <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[9px] font-bold">Bottleneck</span>
                  )}
                </div>
                <div className="mt-1.5 flex items-baseline justify-between">
                  <span className="text-xl font-black text-white">{st.count}</span>
                  <span className="text-[11px] font-mono text-slate-400">{share}%</span>
                </div>
                <div className="mt-2 w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${st.key === 'deployed' ? 'bg-emerald-500' : isBottleneck ? 'bg-rose-500' : 'bg-amber-500'}`}
                    style={{ width: `${Math.max(share, st.count > 0 ? 8 : 0)}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Candidate Distribution Summaries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Pool Strength by Trade Category</h3>
            <span className="text-[11px] text-amber-400 font-semibold">{applications.length} total</span>
          </div>
          {trades.map(([label, count]) => {
            const pct = Math.round((count / denom) * 100);
            const lowSupply = count <= 1;
            return (
              <button
                key={label}
                type="button"
                onClick={() => onSelectTradeFilter(label === 'Other Trades' ? '' : label.slice(0, 4))}
                className="w-full text-left group"
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-200 group-hover:text-amber-400 transition flex items-center gap-2">
                    {label}
                    {lowSupply && <span className="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30 text-[10px]">Needs Ads</span>}
                  </span>
                  <span className="text-slate-400 font-mono">{count} ({pct}%)</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${lowSupply ? 'bg-rose-500' : 'bg-amber-500'}`} style={{ width: `${Math.max(pct, count > 0 ? 5 : 0)}%` }} />
                </div>
              </button>
            );
          })}
        </div>
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Preferred Destination Countries</h3>
            <span className="text-[11px] text-blue-400 font-semibold">{dests.length} markets</span>
          </div>
          {dests.map(([label, count]) => {
            const pct = Math.round((count / denom) * 100);
            return (
              <button
                key={label}
                type="button"
                onClick={() => onSelectDestinationFilter(label)}
                className="w-full text-left group"
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-200 group-hover:text-blue-400 transition">{label}</span>
                  <span className="text-slate-400 font-mono">{count} ({pct}%)</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.max(pct, count > 0 ? 5 : 0)}%` }} />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
