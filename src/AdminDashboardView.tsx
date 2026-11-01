/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileCheck2,
  CheckCircle2,
  Clock,
  Search,
  ExternalLink,
  Copy,
  Check,
  Filter,
  FileText,
  MessageSquare,
  ShieldAlert,
  ChevronRight,
  TrendingUp,
  UserCheck,
  Send,
  Building2,
  Phone,
  Mail,
  Briefcase
} from 'lucide-react';

interface ATSApplication {
  id: string;
  candidate_id: string;
  candidate_name: string;
  candidate_phone: string;
  candidate_email: string;
  candidate_role: string;
  candidate_nationality: string;
  job_title: string;
  company_name: string;
  application_status: 'new' | 'contacted' | 'shortlisted' | 'interview_scheduled' | 'interviewed' | 'visa_pending' | 'visa_approved' | 'hired' | 'rejected';
  recruiter_assigned: string;
  interview_date?: string;
  interview_notes?: string;
  resume_url: string;
  resume_source?: string;
  created_at: string;
  notes_count: number;
}

const INITIAL_APPLICATIONS: ATSApplication[] = [
  {
    id: 'a101-9876-4321-1111',
    candidate_id: 'c101-1111-2222',
    candidate_name: 'Mohd Basheer Khan',
    candidate_phone: '+971 50 123 4567',
    candidate_email: 'basheer.mep@example.com',
    candidate_role: 'Substation Electrical Foreman',
    candidate_nationality: 'Indian',
    job_title: 'Substation Electrical Foreman',
    company_name: 'KSA Red Sea Project',
    application_status: 'shortlisted',
    recruiter_assigned: 'Nouman Qureshi',
    interview_date: '2026-11-04 10:00 AM UTC',
    interview_notes: 'Technical credentials vetted; 6 yrs GCC high-voltage experience.',
    resume_url: 'https://drive.google.com/file/d/1A2B3C_basheer_cv/view',
    resume_source: 'drive_link',
    created_at: '2026-10-30 09:15',
    notes_count: 3
  },
  {
    id: 'a102-9876-4321-2222',
    candidate_id: 'c102-1111-2222',
    candidate_name: 'Rashid Al-Farooq',
    candidate_phone: '+92 300 9876543',
    candidate_email: 'rashid.welder@example.com',
    candidate_role: '6G TIG & ARC Welder',
    candidate_nationality: 'Pakistani',
    job_title: '6G Pipeline Welder (Aramco Standard)',
    company_name: 'Al-Khobar Oil & Gas EPC',
    application_status: 'interview_scheduled',
    recruiter_assigned: 'Nouman Qureshi',
    interview_date: '2026-11-03 02:30 PM UTC',
    interview_notes: 'WQT test scheduled at Karachi Trade Testing Center.',
    resume_url: 'https://drive.google.com/file/d/1X9Y8Z_rashid_welder/view',
    resume_source: 'drive_link',
    created_at: '2026-10-29 14:20',
    notes_count: 2
  },
  {
    id: 'a103-9876-4321-3333',
    candidate_id: 'c103-1111-2222',
    candidate_name: 'Deepak Sharma',
    candidate_phone: '+91 98200 11223',
    candidate_email: 'deepak.chiller@example.com',
    candidate_role: 'Central Chiller HVAC Technician',
    candidate_nationality: 'Indian',
    job_title: 'HVAC Chiller Plant Technician',
    company_name: 'Qatar Metro FM Services',
    application_status: 'visa_pending',
    recruiter_assigned: 'Sarah Jenkins',
    interview_notes: 'Client interview passed. GAMCA medical cleared fit. Visa submission ongoing.',
    resume_url: 'https://supabase.co/storage/v1/object/public/resumes/deepak_hvac_2026.pdf',
    resume_source: 'uploaded_file',
    created_at: '2026-10-25 11:00',
    notes_count: 5
  },
  {
    id: 'a104-9876-4321-4444',
    candidate_id: 'c104-1111-2222',
    candidate_name: 'Arjun Das',
    candidate_phone: '+977 980 1234567',
    candidate_email: 'arjun.rigging@example.com',
    candidate_role: 'Heavy Rigging Supervisor',
    candidate_nationality: 'Nepali',
    job_title: 'Heavy Rigging Supervisor',
    company_name: 'UAE Offshore Marine Yards',
    application_status: 'new',
    recruiter_assigned: 'Unassigned',
    resume_url: 'https://drive.google.com/file/d/1Rig_Arjun_Cert/view',
    resume_source: 'drive_link',
    created_at: '2026-10-31 04:30',
    notes_count: 0
  },
  {
    id: 'a105-9876-4321-5555',
    candidate_id: 'c105-1111-2222',
    candidate_name: 'Farhan Tariq',
    candidate_phone: '+92 321 4455667',
    candidate_email: 'farhan.scaff@example.com',
    candidate_role: 'CISRS Certified Scaffolder',
    candidate_nationality: 'Pakistani',
    job_title: 'Scaffolding Inspector',
    company_name: 'Kuwait Petrochemical Plant',
    application_status: 'hired',
    recruiter_assigned: 'Nouman Qureshi',
    interview_notes: 'Deployed to Kuwait site on Oct 28.',
    resume_url: 'https://supabase.co/storage/v1/object/public/resumes/farhan_scaffolding.pdf',
    resume_source: 'uploaded_file',
    created_at: '2026-10-18 08:00',
    notes_count: 6
  }
];

export function AdminDashboardView({ onCopy, copiedSnippet }: { onCopy: (text: string) => void; copiedSnippet: boolean }) {
  const [applications, setApplications] = useState<ATSApplication[]>(INITIAL_APPLICATIONS);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState<ATSApplication | null>(null);
  const [newNoteText, setNewNoteText] = useState('');
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Applet host URL calculation
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://ais-dev-o7v4f6helpikfsy6ctdfjk-256772228774.asia-east1.run.app';
  const adminUiLink = `${origin}/#admin`;
  const backendApiDashboardLink = `http://localhost:8000/api/admin/dashboard`;
  const backendApiAtsLink = `http://localhost:8000/api/admin/ats/applications`;
  const swaggerDocsLink = `http://localhost:8000/docs`;

  const handleCopyLink = (link: string, id: string) => {
    onCopy(link);
    setCopiedLink(id);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const handleStatusChange = (appId: string, newStatus: ATSApplication['application_status']) => {
    setApplications(prev =>
      prev.map(item => (item.id === appId ? { ...item, application_status: newStatus } : item))
    );
    if (selectedApp && selectedApp.id === appId) {
      setSelectedApp(prev => (prev ? { ...prev, application_status: newStatus } : null));
    }
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim() || !selectedApp) return;
    setApplications(prev =>
      prev.map(item => (item.id === selectedApp.id ? { ...item, notes_count: item.notes_count + 1 } : item))
    );
    setNewNoteText('');
  };

  const filteredApps = applications.filter(app => {
    if (statusFilter !== 'all' && app.application_status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        app.candidate_name.toLowerCase().includes(q) ||
        app.candidate_role.toLowerCase().includes(q) ||
        app.job_title.toLowerCase().includes(q) ||
        app.candidate_phone.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getStatusBadge = (status: ATSApplication['application_status']) => {
    switch (status) {
      case 'new':
        return <span className="bg-sky-500/15 text-sky-400 border border-sky-500/30 px-2 py-0.5 rounded text-[11px] font-semibold">New Review</span>;
      case 'contacted':
        return <span className="bg-purple-500/15 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded text-[11px] font-semibold">Contacted</span>;
      case 'shortlisted':
        return <span className="bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded text-[11px] font-semibold">Shortlisted</span>;
      case 'interview_scheduled':
        return <span className="bg-blue-500/15 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded text-[11px] font-semibold">Interview Set</span>;
      case 'visa_pending':
        return <span className="bg-orange-500/15 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded text-[11px] font-semibold">Visa Pending</span>;
      case 'visa_approved':
        return <span className="bg-teal-500/15 text-teal-400 border border-teal-500/30 px-2 py-0.5 rounded text-[11px] font-semibold">Visa Approved</span>;
      case 'hired':
        return <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[11px] font-semibold">Hired & Deployed</span>;
      case 'rejected':
        return <span className="bg-rose-500/15 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded text-[11px] font-semibold">Rejected</span>;
      default:
        return <span className="bg-slate-700 text-slate-300 px-2 py-0.5 rounded text-[11px] font-semibold">{status}</span>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Direct Links Master Card */}
      <div className="bg-gradient-to-r from-amber-500/10 via-slate-900 to-cyan-500/10 border border-amber-500/30 rounded-2xl p-6 sm:p-7 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2 border border-amber-500/40">
              <LayoutDashboard className="w-3.5 h-3.5 text-amber-400" />
              <span>Recruiter Command Center</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              UGETJOB Admin ATS Dashboard Links
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Direct access links for the ATS Recruiter Command Center, live REST API metrics, and Swagger documentation.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href="#admin"
              className="inline-flex items-center space-x-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs transition shadow-lg shadow-amber-500/20"
            >
              <span>Current View (#admin)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-500/30 font-bold px-4 py-2 rounded-xl text-xs transition"
            >
              <span>FastAPI Swagger UI</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Link Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-5">
          {/* Card 1: Cloud Web Dashboard */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                <span>Web Admin URL</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30">Frontend UI</span>
              </div>
              <p className="text-xs font-mono text-amber-400 mt-1 break-all line-clamp-2">
                {adminUiLink}
              </p>
            </div>
            <div className="flex items-center space-x-2 pt-2 border-t border-slate-900">
              <button
                onClick={() => handleCopyLink(adminUiLink, 'ui')}
                className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-[11px] font-semibold text-slate-200 flex items-center justify-center space-x-1.5 transition"
              >
                {copiedLink === 'ui' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedLink === 'ui' ? 'Copied' : 'Copy UI Link'}</span>
              </button>
            </div>
          </div>

          {/* Card 2: ATS Dashboard API */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                <span>ATS KPI API</span>
                <span className="text-[10px] bg-blue-500/10 text-cyan-400 px-1.5 py-0.5 rounded border border-blue-500/30">GET /api/admin</span>
              </div>
              <p className="text-xs font-mono text-cyan-400 mt-1 break-all">
                {backendApiDashboardLink}
              </p>
            </div>
            <div className="flex items-center space-x-2 pt-2 border-t border-slate-900">
              <button
                onClick={() => handleCopyLink(backendApiDashboardLink, 'api_dash')}
                className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-[11px] font-semibold text-slate-200 flex items-center justify-center space-x-1.5 transition"
              >
                {copiedLink === 'api_dash' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedLink === 'api_dash' ? 'Copied' : 'Copy Endpoint'}</span>
              </button>
            </div>
          </div>

          {/* Card 3: ATS Applications API */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                <span>Applications API</span>
                <span className="text-[10px] bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded border border-purple-500/30">Paginated Filter</span>
              </div>
              <p className="text-xs font-mono text-purple-300 mt-1 break-all">
                {backendApiAtsLink}
              </p>
            </div>
            <div className="flex items-center space-x-2 pt-2 border-t border-slate-900">
              <button
                onClick={() => handleCopyLink(backendApiAtsLink, 'api_ats')}
                className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-[11px] font-semibold text-slate-200 flex items-center justify-center space-x-1.5 transition"
              >
                {copiedLink === 'api_ats' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedLink === 'api_ats' ? 'Copied' : 'Copy Endpoint'}</span>
              </button>
            </div>
          </div>

          {/* Card 4: Swagger Docs UI */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                <span>Interactive Docs</span>
                <span className="text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/30">OpenAPI Spec</span>
              </div>
              <p className="text-xs font-mono text-amber-300 mt-1 break-all">
                {swaggerDocsLink}
              </p>
            </div>
            <div className="flex items-center space-x-2 pt-2 border-t border-slate-900">
              <button
                onClick={() => handleCopyLink(swaggerDocsLink, 'docs')}
                className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-[11px] font-semibold text-slate-200 flex items-center justify-center space-x-1.5 transition"
              >
                {copiedLink === 'docs' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedLink === 'docs' ? 'Copied' : 'Copy URL'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid from /api/admin/dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Total Pool</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">54</div>
          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center space-x-1">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            <span>+12 this week</span>
          </div>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-sky-500/30 bg-sky-500/5">
          <div className="flex items-center justify-between text-sky-400 text-xs font-medium">
            <span>New Review</span>
            <Clock className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black text-sky-400 mt-2">18</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Needs screening</div>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-amber-500/30 bg-amber-500/5">
          <div className="flex items-center justify-between text-amber-400 text-xs font-medium">
            <span>Shortlisted</span>
            <UserCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 mt-2">12</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Ready for client</div>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-blue-500/30 bg-blue-500/5">
          <div className="flex items-center justify-between text-blue-400 text-xs font-medium">
            <span>Interviews</span>
            <Calendar className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400 mt-2">6</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Zoom & In-Person</div>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-orange-500/30 bg-orange-500/5">
          <div className="flex items-center justify-between text-orange-400 text-xs font-medium">
            <span>Visa Pipeline</span>
            <FileCheck2 className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-black text-orange-400 mt-2">7</div>
          <div className="text-[11px] text-slate-400 mt-0.5">4 pending, 3 issued</div>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-medium">
            <span>Hired & Deployed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-2">3</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Overseas joined</div>
        </div>
      </div>

      {/* Pipeline Filter Bar */}
      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
          {[
            { id: 'all', label: 'All (5)' },
            { id: 'new', label: 'New (1)' },
            { id: 'shortlisted', label: 'Shortlisted (1)' },
            { id: 'interview_scheduled', label: 'Interviews (1)' },
            { id: 'visa_pending', label: 'Visa Pending (1)' },
            { id: 'hired', label: 'Hired (1)' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === tab.id ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search candidate, role, phone..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Main Candidate Applications Table & Details Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Table list */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Briefcase className="w-4 h-4 text-amber-400" />
              <span>Live ATS Applications ({filteredApps.length})</span>
            </h3>
            <span className="text-xs text-slate-400">Endpoint: <code className="text-cyan-400 font-mono text-[11px]">/api/admin/ats/applications</code></span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 uppercase font-mono text-[10px]">
                <tr>
                  <th className="py-3 px-4">Candidate & Role</th>
                  <th className="py-3 px-4">Job Posting</th>
                  <th className="py-3 px-4">ATS Stage</th>
                  <th className="py-3 px-4">Recruiter</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredApps.map(app => (
                  <tr
                    key={app.id}
                    onClick={() => setSelectedApp(app)}
                    className={`hover:bg-slate-850 cursor-pointer transition ${
                      selectedApp?.id === app.id ? 'bg-slate-800/80 ring-1 ring-inset ring-amber-500/40' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">{app.candidate_name}</div>
                      <div className="text-[11px] text-amber-400">{app.candidate_role}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{app.candidate_phone} • {app.candidate_nationality}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-200">{app.job_title}</div>
                      <div className="text-[10px] text-slate-400">{app.company_name}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(app.application_status)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-300 font-medium">{app.recruiter_assigned}</div>
                      <div className="text-[10px] text-slate-500">{app.created_at}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setSelectedApp(app);
                          }}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded text-[11px] font-semibold border border-slate-700"
                        >
                          Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Candidate Inspector & Stage Changer */}
        <div className="lg:col-span-4 space-y-4">
          {selectedApp ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5 shadow-xl">
              <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                <div>
                  <h4 className="font-bold text-base text-white">{selectedApp.candidate_name}</h4>
                  <p className="text-xs text-amber-400 font-medium">{selectedApp.candidate_role}</p>
                </div>
                {getStatusBadge(selectedApp.application_status)}
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center space-x-2 text-slate-300">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <span>{selectedApp.candidate_phone}</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-300">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <span>{selectedApp.candidate_email}</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-300">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>{selectedApp.company_name}</span>
                </div>
              </div>

              {/* Resume access button */}
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-400 flex items-center space-x-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    <span>Candidate Resume</span>
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase font-mono">{selectedApp.resume_source || 'link'}</span>
                </div>
                <a
                  href={selectedApp.resume_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-cyan-400 hover:underline flex items-center space-x-1 break-all"
                >
                  <span className="truncate">{selectedApp.resume_url}</span>
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                </a>
              </div>

              {/* Change Stage Select (Simulates PATCH /api/admin/ats/applications/{id}) */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Advance Pipeline Stage</span>
                  <span className="text-[10px] font-mono text-cyan-400">PATCH /ats/applications</span>
                </label>
                <select
                  value={selectedApp.application_status}
                  onChange={e => handleStatusChange(selectedApp.id, e.target.value as any)}
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

              {/* Add Note Form (POST /api/admin/ats/applications/{id}/notes) */}
              <form onSubmit={handleAddNote} className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span className="flex items-center space-x-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                    <span>Recruiter Audit Notes ({selectedApp.notes_count})</span>
                  </span>
                  <span className="text-[10px] font-mono text-cyan-400">POST /notes</span>
                </div>
                {selectedApp.interview_notes && (
                  <div className="p-2.5 bg-slate-950 rounded-lg text-xs text-slate-300 italic border border-slate-800">
                    "{selectedApp.interview_notes}"
                  </div>
                )}
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Add internal recruiter comment..."
                    value={newNoteText}
                    onChange={e => setNewNoteText(e.target.value)}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="submit"
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center space-x-1"
                  >
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-slate-900 border border-dashed border-slate-800 rounded-xl p-8 text-center text-slate-500 text-xs flex flex-col items-center justify-center space-y-2">
              <Users className="w-8 h-8 text-slate-700" />
              <span>Select an application row from the table to view candidate details, inspect resume links, and manage recruiter audit status.</span>
            </div>
          )}

          {/* Quick curl test for admin */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs space-y-2">
            <span className="font-bold text-white block">CLI Test Command:</span>
            <div className="bg-slate-950 p-2.5 rounded-lg font-mono text-[11px] text-cyan-300 overflow-x-auto border border-slate-850">
              curl -s "http://localhost:8000/api/admin/dashboard" | jq
            </div>
            <button
              onClick={() => onCopy('curl -s "http://localhost:8000/api/admin/dashboard" | jq')}
              className="w-full py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded font-semibold text-[11px] flex items-center justify-center space-x-1.5"
            >
              <Copy className="w-3 h-3" />
              <span>Copy curl command</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
