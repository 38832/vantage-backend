import React from 'react';
import { Award, Briefcase, Building2, FileText, MapPin, MessageCircle, RefreshCw } from 'lucide-react';
import { ExportButtons, PassportBadge, StatusBadge } from './ATSBadges';
import { getAppAttentionInfo, REJECTION_REASONS } from './atsUtils';
import type { ATSApplication } from './types';

interface ATSTableProps {
  applicationsCount: number;
  filteredApps: ATSApplication[];
  selectedApp: ATSApplication | null;
  selectedIds: string[];
  bulkStatusTarget: string;
  setBulkStatusTarget: (val: string) => void;
  isBulkUpdating: boolean;
  isLoadingLive: boolean;
  authToken: string | null;
  liveError: string | null;
  onRetryFetch: () => void;
  onSelectApp: (app: ATSApplication) => void;
  onToggleSelectId: (id: string) => void;
  onToggleSelectAll: (visibleIds: string[]) => void;
  onClearSelection: () => void;
  onBulkStatusChange: (status: string) => void;
  onStatusChange: (appId: string, status: string, rejectionReason?: string) => void;
  onQuickContactLog: (appId: string, channel: 'whatsapp' | 'phone' | 'email' | 'manual', outcome?: string) => void;
  onExportCandidates: (format: 'csv' | 'excel') => void;
}

export function ATSTable({
  applicationsCount,
  filteredApps,
  selectedApp,
  selectedIds,
  bulkStatusTarget,
  setBulkStatusTarget,
  isBulkUpdating,
  isLoadingLive,
  authToken,
  liveError,
  onRetryFetch,
  onSelectApp,
  onToggleSelectId,
  onToggleSelectAll,
  onClearSelection,
  onBulkStatusChange,
  onStatusChange,
  onQuickContactLog,
  onExportCandidates,
}: ATSTableProps) {
  return (
    <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
      <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <Briefcase className="w-4 h-4 text-amber-400" />
          <span>Candidate Applications & Deployment Status ({filteredApps.length})</span>
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons disabled={filteredApps.length === 0} onExport={onExportCandidates} variant="header" />
          <span className="text-xs text-slate-400 hidden xl:flex items-center space-x-1.5">
            <span>Endpoint:</span>
            <code className="text-cyan-400 font-mono text-[11px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              /api/admin/ats/applications
            </code>
          </span>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="px-4 py-3 bg-amber-500/10 border-b border-amber-500/30 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-xs font-extrabold">
              {selectedIds.length} selected
            </span>
            <span className="text-xs text-slate-300 font-medium">Batch status update:</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={isBulkUpdating}
              onClick={() => onBulkStatusChange('shortlisted')}
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition disabled:opacity-50"
            >
              Shortlist
            </button>
            <button
              type="button"
              disabled={isBulkUpdating}
              onClick={() => onBulkStatusChange('contacted')}
              className="px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-xs font-bold transition disabled:opacity-50"
            >
              Under Review
            </button>
            <button
              type="button"
              disabled={isBulkUpdating}
              onClick={() => onBulkStatusChange('archived')}
              className="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600 text-xs font-bold transition disabled:opacity-50"
            >
              Archive
            </button>
            <div className="flex items-center space-x-1.5 pl-2 border-l border-slate-700">
              <select
                aria-label="Bulk status selector"
                value={bulkStatusTarget}
                onChange={(e) => setBulkStatusTarget(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="new">New Review</option>
                <option value="contacted">Under Review</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="interview_scheduled">Interview Scheduled</option>
                <option value="visa_pending">Visa Pending</option>
                <option value="hired">Hired &amp; Deployed</option>
                <option value="rejected">Rejected</option>
                <option value="archived">Archived</option>
              </select>
              <button
                type="button"
                disabled={isBulkUpdating}
                onClick={() => onBulkStatusChange(bulkStatusTarget)}
                className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition disabled:opacity-50"
              >
                {isBulkUpdating ? 'Applying...' : 'Apply'}
              </button>
            </div>
            <div className="flex items-center space-x-1.5 pl-2 border-l border-slate-700">
              <ExportButtons onExport={onExportCandidates} variant="bulk" />
            </div>
            <button
              type="button"
              onClick={onClearSelection}
              className="px-2 py-1 text-xs text-slate-400 hover:text-white underline"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800 uppercase font-mono text-[10px]">
            <tr>
              <th className="py-3 px-4 w-10">
                <input
                  type="checkbox"
                  aria-label="Select all visible candidates"
                  checked={filteredApps.length > 0 && filteredApps.every((a) => selectedIds.includes(a.id))}
                  onChange={() => onToggleSelectAll(filteredApps.map((a) => a.id))}
                  className="rounded border-slate-600 bg-slate-800 text-amber-500 focus:ring-amber-500 cursor-pointer"
                />
              </th>
              <th className="py-3 px-4">Candidate</th>
              <th className="py-3 px-4">Target Trade</th>
              <th className="py-3 px-4">Destination</th>
              <th className="py-3 px-4">Experience</th>
              <th className="py-3 px-4">Passport & Medical</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {isLoadingLive ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-slate-400">
                  <div className="inline-flex items-center space-x-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                    <span>Loading candidate applications...</span>
                  </div>
                </td>
              </tr>
            ) : !authToken ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-slate-400">
                  Sign in with your staff account above to load live candidate applications.
                </td>
              </tr>
            ) : liveError ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-rose-400">
                  <div className="flex flex-col items-center space-y-2">
                    <span>{liveError}</span>
                    <button
                      type="button"
                      onClick={onRetryFetch}
                      className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-semibold transition"
                    >
                      Retry
                    </button>
                  </div>
                </td>
              </tr>
            ) : applicationsCount === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-slate-500">
                  No candidate applications found in the backend.
                </td>
              </tr>
            ) : filteredApps.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500">
                  No candidate applications found matching the selected filter.
                </td>
              </tr>
            ) : (
              filteredApps.map((app) => {
                const isChecked = selectedIds.includes(app.id);
                const candidateName = app.candidate_name || app.name || app.full_name || 'Applicant';
                const candidatePhone = app.candidate_phone || app.phone || '';
                const candidateEmail = app.candidate_email || app.email || '';
                const targetTrade =
                  app.target_trade ||
                  app.trade ||
                  app.candidate_job_title ||
                  app.candidate_role ||
                  app.job_title ||
                  'General Deployment';
                const destination = app.destination || app.destination_country || app.location_country || 'GCC / Overseas';
                const experience =
                  app.experience ||
                  (app.experience_years
                    ? `${app.experience_years} yrs`
                    : app.years_experience
                    ? `${app.years_experience} yrs`
                    : '5 yrs');
                const passportStatus = app.passport_status || app.passport || 'ready';
                const rawDigits = (app.candidate_whatsapp || candidatePhone).replace(/[^0-9]/g, '');
                const whatsappUrl =
                  rawDigits.length >= 7
                    ? `https://wa.me/${rawDigits}?text=${encodeURIComponent(
                        `Hello ${candidateName}, regarding your overseas deployment application for ${targetTrade} through Nouman's Manpower Consultancy...`
                      )}`
                    : null;
                const attn = getAppAttentionInfo(app);

                return (
                  <tr
                    key={app.id}
                    onClick={() => onSelectApp(app)}
                    className={`hover:bg-slate-850 cursor-pointer transition ${
                      selectedApp?.id === app.id
                        ? 'bg-slate-800/90 ring-1 ring-inset ring-amber-500/40'
                        : isChecked
                        ? 'bg-amber-500/5'
                        : ''
                    }`}
                  >
                    <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        aria-label={`Select ${candidateName}`}
                        checked={isChecked}
                        onChange={() => onToggleSelectId(app.id)}
                        className="rounded border-slate-600 bg-slate-800 text-amber-500 focus:ring-amber-500 cursor-pointer"
                      />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white text-sm">{candidateName}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex flex-wrap items-center gap-1.5 font-mono">
                        {candidatePhone && <span>{candidatePhone}</span>}
                        {candidatePhone && candidateEmail && <span>•</span>}
                        {candidateEmail && <span className="truncate max-w-[120px]">{candidateEmail}</span>}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {app.created_at ? new Date(app.created_at).toLocaleDateString() : 'Recent'}
                      </div>
                      <div className={`text-[10px] mt-0.5 font-medium ${app.last_contacted_at ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {app.last_contacted_at
                          ? `Contacted ${new Date(app.last_contacted_at).toLocaleDateString()} (${app.last_contact_channel || 'call'})${
                              app.last_contact_outcome ? ` • ${app.last_contact_outcome}` : ''
                            }`
                          : 'Not contacted yet'}
                      </div>
                      {attn.needsAttention && (
                        <div className="mt-1">
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                              attn.isUrgent
                                ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                                : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            }`}
                          >
                            {attn.isUrgent ? 'Overdue' : 'Follow-up'}: {attn.reason}
                          </span>
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-amber-300">{targetTrade}</div>
                      <div className="text-[11px] text-slate-400 flex items-center space-x-1 mt-0.5">
                        <Building2 className="w-3 h-3 text-slate-500 flex-shrink-0" />
                        <span className="truncate max-w-[130px]">{app.company_name || "Nouman's Consultancy Pool"}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-cyan-300 font-semibold text-[11px]">
                        <MapPin className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                        <span>{destination}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-mono">
                        <Award className="w-3 h-3 text-amber-400 flex-shrink-0" />
                        <span>{experience}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <PassportBadge status={passportStatus} medical={app.medical_status} />
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={app.application_status || app.status} />
                      {(app.application_status || app.status) === 'rejected' && app.rejection_reason && (
                        <div className="mt-1 text-[10px] text-rose-300 font-medium">Reason: {app.rejection_reason}</div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5" onClick={(e) => e.stopPropagation()}>
                        {(app.application_status || app.status) !== 'shortlisted' && (
                          <button
                            type="button"
                            onClick={() => onStatusChange(app.id, 'shortlisted')}
                            title="Quick Shortlist"
                            className="px-2 py-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 rounded-lg text-[11px] font-bold border border-amber-500/30 transition"
                          >
                            Shortlist
                          </button>
                        )}
                        <select
                          aria-label={`Reject ${candidateName} with reason`}
                          defaultValue=""
                          onChange={(e) => {
                            if (e.target.value) {
                              onStatusChange(app.id, 'rejected', e.target.value);
                              e.target.value = '';
                            }
                          }}
                          className="bg-rose-500/10 text-rose-300 border border-rose-500/30 rounded-lg px-1.5 py-1 text-[11px] font-semibold focus:outline-none cursor-pointer"
                        >
                          <option value="" className="bg-slate-900">Reject ▾</option>
                          {REJECTION_REASONS.map((reason) => (
                            <option key={reason} value={reason} className="bg-slate-900 text-white">
                              {reason}
                            </option>
                          ))}
                        </select>
                        {whatsappUrl && (
                          <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noreferrer"
                            title="Chat on WhatsApp"
                            onClick={() => onQuickContactLog(app.id, 'whatsapp')}
                            className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30 transition"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {app.resume_url && (
                          <a
                            href={app.resume_url}
                            target="_blank"
                            rel="noreferrer"
                            title="Open Candidate Resume"
                            className="p-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-lg border border-cyan-500/30 transition"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          onClick={() => onSelectApp(app)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-semibold border border-slate-700 transition"
                        >
                          Details
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
