import React, { useState } from 'react';
import {
  AlertCircle,
  Award,
  Building2,
  ExternalLink,
  FileText,
  Mail,
  MessageCircle,
  MessageSquare,
  Phone,
  Send,
  Users,
} from 'lucide-react';
import { StatusBadge } from './ATSBadges';
import { getAppAttentionInfo } from './atsUtils';
import type { ATSApplication, ATSNoteEntry } from './types';

interface CandidateDetailPanelProps {
  selectedApp: ATSApplication | null;
  atsNotes: ATSNoteEntry[];
  isLoadingNotes: boolean;
  onStatusChange: (appId: string, newStatus: string) => void;
  onQuickContactLog: (appId: string, channel: 'whatsapp' | 'phone' | 'email' | 'manual', outcome?: string) => void;
  onAddNote: (rawNoteText: string, noteTopic: string) => Promise<boolean>;
}

export function CandidateDetailPanel({
  selectedApp,
  atsNotes,
  isLoadingNotes,
  onStatusChange,
  onQuickContactLog,
  onAddNote,
}: CandidateDetailPanelProps) {
  const [newNoteText, setNewNoteText] = useState('');
  const [noteTopic, setNoteTopic] = useState('General');

  const handleSubmitNote = async (e: React.FormEvent) => {
    e.preventDefault();
    const submitted = await onAddNote(newNoteText, noteTopic);
    if (submitted) {
      setNewNoteText('');
    }
  };

  if (!selectedApp) {
    return (
      <div className="lg:col-span-4 space-y-4">
        <div className="bg-slate-900 border border-dashed border-slate-800 rounded-xl p-8 text-center text-slate-500 text-xs flex flex-col items-center justify-center space-y-2">
          <Users className="w-8 h-8 text-slate-700" />
          <span>Select an application row from the table to view candidate details, inspect resume links, and manage recruiter audit status.</span>
        </div>
      </div>
    );
  }

  const attn = getAppAttentionInfo(selectedApp);

  return (
    <div className="lg:col-span-4 space-y-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5 shadow-xl">
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <h4 className="font-bold text-base text-white">
              {selectedApp.candidate_name || selectedApp.name || selectedApp.full_name || 'Candidate'}
            </h4>
            <p className="text-xs text-amber-400 font-medium">
              {selectedApp.target_trade || selectedApp.trade || selectedApp.candidate_job_title || selectedApp.candidate_role || selectedApp.job_title}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Destination:{' '}
              <span className="text-cyan-300 font-semibold">
                {selectedApp.destination || selectedApp.destination_country || selectedApp.location_country || 'GCC'}
              </span>
            </p>
          </div>
          <StatusBadge status={selectedApp.application_status || selectedApp.status} />
        </div>

        {attn.needsAttention && (
          <div
            className={`p-3 rounded-lg border text-xs font-semibold flex items-center space-x-2 ${
              attn.isUrgent
                ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
            }`}
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              {attn.isUrgent ? 'Overdue Follow-Up' : 'Follow-Up Due'}: {attn.reason}
            </span>
          </div>
        )}

        {/* Direct Quick Contact Buttons */}
        <div className="grid grid-cols-2 gap-2">
          {selectedApp.candidate_phone && (
            <a
              href={`https://wa.me/${(selectedApp.candidate_whatsapp || selectedApp.candidate_phone).replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noreferrer"
              onClick={() => onQuickContactLog(selectedApp.id, 'whatsapp')}
              className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>
          )}
          {selectedApp.candidate_phone && (
            <a
              href={`tel:${selectedApp.candidate_phone}`}
              onClick={() => onQuickContactLog(selectedApp.id, 'phone')}
              className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call Candidate</span>
            </a>
          )}
        </div>

        {/* Last Contacted & One-Click Outcome Log */}
        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-slate-300">Quick Contact Log</span>
            <span className={`text-[10px] font-mono ${selectedApp.last_contacted_at ? 'text-emerald-400' : 'text-slate-500'}`}>
              {selectedApp.last_contacted_at
                ? `${new Date(selectedApp.last_contacted_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })} (${selectedApp.last_contact_channel || 'call'})`
                : 'Not contacted yet'}
            </span>
          </div>
          {selectedApp.last_contact_outcome && (
            <div className="text-[11px] text-amber-300 font-medium">
              Last outcome: {selectedApp.last_contact_outcome}
            </div>
          )}
          <div className="flex flex-wrap gap-1.5">
            {['Interested', 'Did not pick up', 'Callback requested', 'Not reachable'].map((outcome) => (
              <button
                key={outcome}
                type="button"
                onClick={() => onQuickContactLog(selectedApp.id, 'phone', outcome)}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[10px] font-semibold transition"
              >
                {outcome}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2 text-xs bg-slate-950 p-3.5 rounded-lg border border-slate-800">
          <div className="flex items-center space-x-2 text-slate-300">
            <Phone className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-mono">{selectedApp.candidate_phone || selectedApp.phone || 'No phone recorded'}</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-300">
            <Mail className="w-3.5 h-3.5 text-slate-500" />
            <span className="truncate">{selectedApp.candidate_email || selectedApp.email || 'No email recorded'}</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-300">
            <Building2 className="w-3.5 h-3.5 text-slate-500" />
            <span>{selectedApp.company_name || "Nouman's Consultancy Pool"}</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-300">
            <Award className="w-3.5 h-3.5 text-slate-500" />
            <span>Experience: {selectedApp.experience || `${selectedApp.experience_years || 0} years`}</span>
          </div>
        </div>

        {/* Passport & Deployment Readiness Checklist */}
        <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-2 text-xs">
          <div className="flex items-center justify-between font-semibold text-slate-300">
            <span>Overseas Deployment Readiness</span>
            <span className="text-[10px] text-amber-400 font-mono">GCC Deployment</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <span className="block text-slate-500">Passport</span>
              <span className="font-bold text-emerald-400">{selectedApp.passport_status || 'Ready'}</span>
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <span className="block text-slate-500">GAMCA / Med</span>
              <span className="font-bold text-cyan-400">
                {selectedApp.medical_status ? selectedApp.medical_status.replace('_', ' ') : 'Pending'}
              </span>
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <span className="block text-slate-500">Visa Stage</span>
              <span className="font-bold text-purple-400">
                {selectedApp.visa_status ? selectedApp.visa_status.replace('_', ' ') : 'Review'}
              </span>
            </div>
          </div>
        </div>

        {/* Resume access button */}
        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-300 font-semibold flex items-center space-x-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>Candidate Resume / CV</span>
            </span>
            <span className="text-[10px] text-cyan-400 uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30">
              {selectedApp.resume_source || (selectedApp.resume_url?.includes('supabase') ? 'Supabase Storage' : 'Drive Link')}
            </span>
          </div>
          {selectedApp.resume_url ? (
            <a
              href={selectedApp.resume_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center space-x-2 w-full justify-center bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 font-bold py-2 px-3 rounded-lg text-xs transition"
            >
              <span>View / Download Resume PDF</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : (
            <p className="text-[11px] text-slate-500 italic">No resume URL uploaded yet</p>
          )}
        </div>

        {/* Advance Pipeline Stage */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span>Advance Pipeline Stage</span>
            <span className="text-[10px] font-mono text-cyan-400">PATCH /ats/applications</span>
          </label>
          <select
            value={selectedApp.application_status || selectedApp.status || 'new'}
            onChange={(e) => onStatusChange(selectedApp.id, e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
          >
            <option value="new">1. New Review</option>
            <option value="contacted">2. Phone Screened / Contacted</option>
            <option value="shortlisted">3. Shortlisted for Client</option>
            <option value="interview_scheduled">4. Client Interview Scheduled</option>
            <option value="interviewed">5. Client Interview Passed</option>
            <option value="visa_pending">6. Embassy Visa Stamping Pending</option>
            <option value="visa_approved">7. Visa Approved & Issued</option>
            <option value="hired">8. Hired & Overseas Deployed</option>
            <option value="rejected">9. Rejected / Unfit</option>
          </select>
        </div>

        {/* Recruiter Remarks & Internal Audit Timeline */}
        <form onSubmit={handleSubmitNote} className="space-y-2.5 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span className="flex items-center space-x-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
              <span>Audit Timeline ({atsNotes.length || selectedApp.notes_count || 0})</span>
            </span>
            <span className="text-[10px] font-mono text-cyan-400">GET / POST /notes</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <select
              aria-label="Remark topic"
              value={noteTopic}
              onChange={(e) => setNoteTopic(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-[11px] text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="General">General</option>
              <option value="Salary">Salary</option>
              <option value="Interview">Interview</option>
              <option value="Medical">Medical</option>
              <option value="Documents">Documents</option>
            </select>
            <input
              type="text"
              placeholder="Add recruiter remark..."
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center space-x-1"
            >
              <Send className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {isLoadingNotes ? (
              <p className="text-[11px] text-slate-500 italic">Loading audit timeline...</p>
            ) : atsNotes.length === 0 ? (
              <p className="text-[11px] text-slate-500 italic">No remarks recorded yet.</p>
            ) : (
              atsNotes.map((n) => (
                <div key={n.id} className="p-2.5 bg-slate-950 rounded-lg text-xs border border-slate-800">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span className="font-bold text-amber-400">{n.author_name}</span>
                    <span>
                      {n.created_at
                        ? new Date(n.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
                        : 'Recent'}
                    </span>
                  </div>
                  <p className="text-slate-200 leading-relaxed">{n.note}</p>
                </div>
              ))
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
