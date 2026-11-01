/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
  FileText,
  MessageSquare,
  TrendingUp,
  UserCheck,
  Send,
  Building2,
  Phone,
  Mail,
  Briefcase,
  RefreshCw,
  MessageCircle,
  MapPin,
  Award,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export interface ATSApplication {
  id: string;
  candidate_id?: string;
  job_id?: string;

  // Candidate Names
  candidate_name?: string;
  name?: string;
  full_name?: string;

  // Contact
  candidate_phone?: string;
  phone?: string;
  candidate_email?: string;
  email?: string;
  candidate_whatsapp?: string;
  whatsapp?: string;

  // Demographics
  candidate_nationality?: string;
  nationality?: string;
  candidate_city?: string;
  candidate_country?: string;

  // Trade / Roles
  candidate_role?: string;
  candidate_job_title?: string;
  role?: string;
  trade?: string;
  target_trade?: string;
  job_title?: string;
  company_name?: string;

  // Destination
  destination?: string;
  destination_country?: string;
  location_country?: string;
  location_city?: string;

  // Experience
  experience_years?: number;
  years_experience?: number;
  experience?: string;

  // Passport & Verification
  passport?: string;
  passport_status?: string;
  passport_number?: string;
  document_status?: string;
  medical_status?: string;
  visa_status?: string;

  // ATS Stage
  application_status: string;
  status?: string;
  recruiter_assigned?: string;
  interview_date?: string;
  interview_notes?: string;
  notes?: string;

  // Documents
  resume_url?: string;
  resume_source?: string;
  resume_file_name?: string;
  created_at?: string;
  notes_count?: number;
}

const INITIAL_APPLICATIONS: ATSApplication[] = [
  {
    id: '322dd461-767a-4d8b-b3af-2d12771aa7d3',
    candidate_id: 'c201-767a-4d8b-b3af-2d12771aa7d3',
    candidate_name: 'Abutalha Shaikh',
    name: 'Abutalha Shaikh',
    full_name: 'Abutalha Shaikh',
    candidate_phone: '+919766065167',
    phone: '+919766065167',
    candidate_whatsapp: '+919766065167',
    whatsapp: '+919766065167',
    candidate_email: 'abutalha11503@gmail.com',
    email: 'abutalha11503@gmail.com',
    candidate_role: 'HVAC Chiller Specialist',
    candidate_job_title: 'HVAC Chiller Specialist',
    target_trade: 'HVAC Chiller Specialist',
    trade: 'HVAC Chiller Specialist',
    candidate_nationality: 'Indian',
    nationality: 'Indian',
    job_title: 'HVAC Chiller Specialist',
    company_name: 'Gulf Facilities Management LLC',
    destination: 'United Arab Emirates',
    destination_country: 'United Arab Emirates',
    location_country: 'United Arab Emirates',
    experience_years: 5,
    years_experience: 5,
    experience: '5 yrs GCC',
    passport: 'ready',
    passport_status: 'ready',
    document_status: 'ready',
    medical_status: 'cleared',
    visa_status: 'ready_for_submission',
    application_status: 'new',
    status: 'new',
    recruiter_assigned: 'Nouman Qureshi',
    interview_notes: 'Uploaded verified credentials to Supabase Storage. Ready for client panel.',
    resume_url: 'https://ysaggxhpmmxbsjygucny.supabase.co/storage/v1/object/sign/candidate-resumes/322dd461-767a-4d8b-b3af-2d12771aa7d3/Abutalha_Shaikh_HVAC_Resume.pdf',
    resume_source: 'uploaded_file',
    resume_file_name: 'Abutalha_Shaikh_HVAC_Resume.pdf',
    created_at: '2026-10-31 08:17',
    notes_count: 2
  },
  {
    id: '455ff123-888b-4c22-b444-123456789abc',
    candidate_id: 'c202-888b-4c22-b444-123456789abc',
    candidate_name: 'Tariq Mehmood',
    name: 'Tariq Mehmood',
    full_name: 'Tariq Mehmood',
    candidate_phone: '+923018899123',
    phone: '+923018899123',
    candidate_whatsapp: '+923018899123',
    whatsapp: '+923018899123',
    candidate_email: 'tariq.civil@example.com',
    email: 'tariq.civil@example.com',
    candidate_role: 'Civil QA Inspector',
    candidate_job_title: 'Civil QA Inspector',
    target_trade: 'Civil QA Inspector',
    trade: 'Civil QA Inspector',
    candidate_nationality: 'Pakistani',
    nationality: 'Pakistani',
    job_title: 'General Deployment Application',
    company_name: "Nouman's Consultancy Pool",
    destination: 'Saudi Arabia',
    destination_country: 'Saudi Arabia',
    location_country: 'Saudi Arabia',
    experience_years: 6,
    years_experience: 6,
    experience: '6 yrs',
    passport: 'ready',
    passport_status: 'ready',
    document_status: 'ready',
    medical_status: 'pending',
    visa_status: 'not_started',
    application_status: 'shortlisted',
    status: 'shortlisted',
    recruiter_assigned: 'Nouman Qureshi',
    interview_notes: 'Aramco highway inspection project experience.',
    resume_url: 'https://drive.google.com/file/d/1Tariq_Civil_QA_CV/view',
    resume_source: 'drive_link',
    created_at: '2026-10-31 06:45',
    notes_count: 3
  },
  {
    id: 'a101-9876-4321-1111',
    candidate_id: 'c101-1111-2222',
    candidate_name: 'Mohd Basheer Khan',
    name: 'Mohd Basheer Khan',
    full_name: 'Mohd Basheer Khan',
    candidate_phone: '+971501234567',
    phone: '+971501234567',
    candidate_whatsapp: '+971501234567',
    candidate_email: 'basheer.mep@example.com',
    candidate_role: 'Substation Electrical Foreman',
    target_trade: 'Substation Electrical Foreman',
    candidate_nationality: 'Indian',
    job_title: 'Substation Electrical Foreman',
    company_name: 'KSA Red Sea Project (Al-Bawani)',
    destination: 'Saudi Arabia',
    destination_country: 'Saudi Arabia',
    location_country: 'Saudi Arabia',
    experience_years: 7,
    experience: '7 yrs GCC',
    passport_status: 'ready',
    medical_status: 'gamca_fit',
    visa_status: 'visa_stamped',
    application_status: 'shortlisted',
    recruiter_assigned: 'Nouman Qureshi',
    interview_date: '2026-11-04 10:00 AM UTC',
    interview_notes: 'Technical credentials vetted; 7 yrs GCC high-voltage substation experience.',
    resume_url: 'https://drive.google.com/file/d/1A2B3C_basheer_cv/view',
    resume_source: 'drive_link',
    created_at: '2026-10-30 09:15',
    notes_count: 3
  },
  {
    id: 'a102-9876-4321-2222',
    candidate_id: 'c102-1111-2222',
    candidate_name: 'Rashid Al-Farooq',
    name: 'Rashid Al-Farooq',
    candidate_phone: '+923009876543',
    phone: '+923009876543',
    candidate_whatsapp: '+923009876543',
    candidate_email: 'rashid.welder@example.com',
    candidate_role: '6G TIG & ARC Welder',
    target_trade: '6G Pipeline Welder (Aramco Standard)',
    candidate_nationality: 'Pakistani',
    job_title: '6G Pipeline Welder (Aramco Standard)',
    company_name: 'Al-Khobar Oil & Gas EPC',
    destination: 'Saudi Arabia',
    destination_country: 'Saudi Arabia',
    location_country: 'Saudi Arabia',
    experience_years: 8,
    experience: '8 yrs',
    passport_status: 'ready',
    medical_status: 'fit',
    visa_status: 'in_process',
    application_status: 'interview_scheduled',
    recruiter_assigned: 'Nouman Qureshi',
    interview_date: '2026-11-03 02:30 PM UTC',
    interview_notes: 'WQT testing scheduled at Trade Testing Center.',
    resume_url: 'https://drive.google.com/file/d/1X9Y8Z_rashid_welder/view',
    resume_source: 'drive_link',
    created_at: '2026-10-29 14:20',
    notes_count: 2
  },
  {
    id: 'a103-9876-4321-3333',
    candidate_id: 'c103-1111-2222',
    candidate_name: 'Deepak Sharma',
    name: 'Deepak Sharma',
    candidate_phone: '+919820011223',
    phone: '+919820011223',
    candidate_whatsapp: '+919820011223',
    candidate_email: 'deepak.chiller@example.com',
    candidate_role: 'Central Chiller HVAC Technician',
    target_trade: 'HVAC Chiller Plant Technician',
    candidate_nationality: 'Indian',
    job_title: 'HVAC Chiller Plant Technician',
    company_name: 'Qatar Metro FM Services',
    destination: 'Qatar',
    destination_country: 'Qatar',
    location_country: 'Qatar',
    experience_years: 6,
    experience: '6 yrs',
    passport_status: 'ready',
    medical_status: 'gamca_cleared',
    visa_status: 'visa_pending',
    application_status: 'visa_pending',
    recruiter_assigned: 'Sarah Jenkins',
    interview_notes: 'Client interview passed. GAMCA medical cleared fit. Visa submission ongoing.',
    resume_url: 'https://ysaggxhpmmxbsjygucny.supabase.co/storage/v1/object/sign/candidate-resumes/deepak_hvac_2026.pdf',
    resume_source: 'uploaded_file',
    created_at: '2026-10-25 11:00',
    notes_count: 5
  },
  {
    id: 'a105-9876-4321-5555',
    candidate_id: 'c105-1111-2222',
    candidate_name: 'Farhan Tariq',
    name: 'Farhan Tariq',
    candidate_phone: '+923214455667',
    phone: '+923214455667',
    candidate_whatsapp: '+923214455667',
    candidate_email: 'farhan.scaff@example.com',
    candidate_role: 'CISRS Certified Scaffolder',
    target_trade: 'Scaffolding Inspector',
    candidate_nationality: 'Pakistani',
    job_title: 'Scaffolding Inspector',
    company_name: 'Kuwait Petrochemical Plant',
    destination: 'Kuwait',
    destination_country: 'Kuwait',
    location_country: 'Kuwait',
    experience_years: 4,
    experience: '4 yrs',
    passport_status: 'ready',
    medical_status: 'fit',
    visa_status: 'issued',
    application_status: 'hired',
    recruiter_assigned: 'Nouman Qureshi',
    interview_notes: 'Deployed to Kuwait site on Oct 28.',
    resume_url: 'https://ysaggxhpmmxbsjygucny.supabase.co/storage/v1/object/sign/candidate-resumes/farhan_scaffolding.pdf',
    resume_source: 'uploaded_file',
    created_at: '2026-10-18 08:00',
    notes_count: 6
  }
];

export function AdminDashboardView({ onCopy }: { onCopy: (text: string) => void; copiedSnippet: boolean }) {
  const [applications, setApplications] = useState<ATSApplication[]>(INITIAL_APPLICATIONS);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState<ATSApplication | null>(INITIAL_APPLICATIONS[0]);
  const [newNoteText, setNewNoteText] = useState('');
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Live Backend Connection States
  const [isLoadingLive, setIsLoadingLive] = useState(false);
  const [liveConnected, setLiveConnected] = useState<boolean | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const adminUiLink = `${origin}/#admin`;
  const backendApiDashboardLink = `http://localhost:8000/api/admin/dashboard`;
  const backendApiAtsLink = `http://localhost:8000/api/admin/ats/applications`;
  const swaggerDocsLink = `http://localhost:8000/docs`;

  // Fetch live applications from local FastAPI backend
  const fetchLiveApplications = async () => {
    setIsLoadingLive(true);
    try {
      const response = await fetch('http://localhost:8000/api/admin/ats/applications', {
        headers: { Accept: 'application/json' }
      });
      if (response.ok) {
        const json = await response.json();
        const records = json.data || (Array.isArray(json) ? json : null);
        if (Array.isArray(records) && records.length > 0) {
          setApplications(records);
          setLiveConnected(true);
          setLastSyncTime(new Date().toLocaleTimeString());
          if (!selectedApp || !records.find((r: ATSApplication) => r.id === selectedApp.id)) {
            setSelectedApp(records[0]);
          }
        } else {
          setLiveConnected(true);
        }
      } else {
        setLiveConnected(false);
      }
    } catch {
      // Backend not running on localhost:8000
      setLiveConnected(false);
    } finally {
      setIsLoadingLive(false);
    }
  };

  useEffect(() => {
    fetchLiveApplications();
  }, []);

  const handleCopyLink = (link: string, id: string) => {
    onCopy(link);
    setCopiedLink(id);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const handleStatusChange = async (appId: string, newStatus: string) => {
    setApplications(prev =>
      prev.map(item => (item.id === appId ? { ...item, application_status: newStatus, status: newStatus } : item))
    );
    if (selectedApp && selectedApp.id === appId) {
      setSelectedApp(prev => (prev ? { ...prev, application_status: newStatus, status: newStatus } : null));
    }

    // Attempt PATCH to backend if available
    try {
      await fetch(`http://localhost:8000/api/admin/ats/applications/${appId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ application_status: newStatus })
      });
    } catch {
      // Ignore network errors if backend is in offline mode
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim() || !selectedApp) return;

    const note = newNoteText;
    setApplications(prev =>
      prev.map(item =>
        item.id === selectedApp.id
          ? {
              ...item,
              interview_notes: note,
              notes_count: (item.notes_count || 0) + 1
            }
          : item
      )
    );
    setSelectedApp(prev => (prev ? { ...prev, interview_notes: note, notes_count: (prev.notes_count || 0) + 1 } : null));
    setNewNoteText('');

    // Attempt POST to backend
    try {
      await fetch(`http://localhost:8000/api/admin/ats/applications/${selectedApp.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author_name: 'Recruiter Admin',
          note: note
        })
      });
    } catch {
      // Offline fallback
    }
  };

  const filteredApps = applications.filter(app => {
    const appStatus = app.application_status || app.status || 'new';
    if (statusFilter !== 'all' && appStatus !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const name = (app.candidate_name || app.name || app.full_name || '').toLowerCase();
      const role = (app.target_trade || app.candidate_job_title || app.candidate_role || app.trade || app.job_title || '').toLowerCase();
      const phone = (app.candidate_phone || app.phone || '').toLowerCase();
      const dest = (app.destination || app.destination_country || app.location_country || '').toLowerCase();
      return name.includes(q) || role.includes(q) || phone.includes(q) || dest.includes(q);
    }
    return true;
  });

  const getStatusBadge = (status?: string) => {
    const s = (status || 'new').toLowerCase();
    switch (s) {
      case 'new':
      case 'applied':
        return <span className="inline-flex items-center space-x-1 bg-sky-500/15 text-sky-400 border border-sky-500/30 px-2.5 py-1 rounded-md text-[11px] font-bold">New Review</span>;
      case 'contacted':
        return <span className="inline-flex items-center space-x-1 bg-purple-500/15 text-purple-400 border border-purple-500/30 px-2.5 py-1 rounded-md text-[11px] font-bold">Contacted</span>;
      case 'shortlisted':
        return <span className="inline-flex items-center space-x-1 bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-md text-[11px] font-bold">Shortlisted</span>;
      case 'interview_scheduled':
        return <span className="inline-flex items-center space-x-1 bg-blue-500/15 text-blue-400 border border-blue-500/30 px-2.5 py-1 rounded-md text-[11px] font-bold">Interview Set</span>;
      case 'interviewed':
        return <span className="inline-flex items-center space-x-1 bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 px-2.5 py-1 rounded-md text-[11px] font-bold">Interview Passed</span>;
      case 'visa_pending':
      case 'document_pending':
        return <span className="inline-flex items-center space-x-1 bg-orange-500/15 text-orange-400 border border-orange-500/30 px-2.5 py-1 rounded-md text-[11px] font-bold">Visa Pending</span>;
      case 'visa_approved':
        return <span className="inline-flex items-center space-x-1 bg-teal-500/15 text-teal-400 border border-teal-500/30 px-2.5 py-1 rounded-md text-[11px] font-bold">Visa Approved</span>;
      case 'hired':
        return <span className="inline-flex items-center space-x-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-md text-[11px] font-bold">Hired & Deployed</span>;
      case 'rejected':
        return <span className="inline-flex items-center space-x-1 bg-rose-500/15 text-rose-400 border border-rose-500/30 px-2.5 py-1 rounded-md text-[11px] font-bold">Rejected</span>;
      default:
        return <span className="inline-flex items-center space-x-1 bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded text-[11px] font-semibold">{status}</span>;
    }
  };

  const getPassportBadge = (status?: string, medical?: string) => {
    const isReady = (status || '').toLowerCase().includes('ready') || (status || '').toLowerCase().includes('valid');
    return (
      <div className="space-y-1">
        <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${
          isReady ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
        }`}>
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
  };

  return (
    <div className="space-y-8">
      {/* Direct Links Master Card */}
      <div className="bg-gradient-to-r from-amber-500/10 via-slate-900 to-cyan-500/10 border border-amber-500/30 rounded-2xl p-6 sm:p-7 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2 border border-amber-500/40">
              <LayoutDashboard className="w-3.5 h-3.5 text-amber-400" />
              <span>Candidate Applications & Deployment Status</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Recruiter ATS Command Center
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Live overseas recruitment pipeline, real candidate verification, Supabase Storage CV downloads, and WhatsApp outreach.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={fetchLiveApplications}
              disabled={isLoadingLive}
              className="inline-flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/40 font-bold px-3.5 py-2 rounded-xl text-xs transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLive ? 'animate-spin' : ''}`} />
              <span>{isLoadingLive ? 'Syncing...' : 'Sync Live Backend'}</span>
            </button>
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-500/30 font-bold px-3.5 py-2 rounded-xl text-xs transition"
            >
              <span>Swagger API Docs</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Sync Status Banner */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs">
          <div className="flex items-center space-x-2">
            <span className={`w-2.5 h-2.5 rounded-full ${liveConnected ? 'bg-emerald-400 shadow-md shadow-emerald-400/50' : 'bg-amber-400'}`} />
            <span className="text-slate-300 font-medium">
              {liveConnected ? (
                <>Connected to FastAPI (<code className="text-cyan-400">http://localhost:8000/api/admin/ats/applications</code>)</>
              ) : (
                <>Backend Preview Mode (Run <code className="text-amber-400">uvicorn app.main:app --port 8000 --reload</code> for live data)</>
              )}
            </span>
          </div>
          {lastSyncTime && (
            <span className="text-[11px] text-slate-500 font-mono">Last Synced: {lastSyncTime}</span>
          )}
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
                <span className="text-[10px] bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded border border-purple-500/30">Candidate Data</span>
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
            {applications.filter(a => (a.application_status || a.status) === 'new').length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Needs screening</div>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-amber-500/30 bg-amber-500/5">
          <div className="flex items-center justify-between text-amber-400 text-xs font-medium">
            <span>Shortlisted</span>
            <UserCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 mt-2">
            {applications.filter(a => (a.application_status || a.status) === 'shortlisted').length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Ready for client</div>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-blue-500/30 bg-blue-500/5">
          <div className="flex items-center justify-between text-blue-400 text-xs font-medium">
            <span>Interviews</span>
            <Calendar className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400 mt-2">
            {applications.filter(a => (a.application_status || a.status) === 'interview_scheduled').length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Zoom & Trade Test</div>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-orange-500/30 bg-orange-500/5">
          <div className="flex items-center justify-between text-orange-400 text-xs font-medium">
            <span>Visa Pipeline</span>
            <FileCheck2 className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-black text-orange-400 mt-2">
            {applications.filter(a => (a.application_status || a.status) === 'visa_pending').length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Embassy Stamping</div>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-medium">
            <span>Hired & Deployed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-2">
            {applications.filter(a => (a.application_status || a.status) === 'hired').length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Overseas joined</div>
        </div>
      </div>

      {/* Pipeline Filter Bar */}
      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
          {[
            { id: 'all', label: `All (${applications.length})` },
            { id: 'new', label: 'New Review' },
            { id: 'shortlisted', label: 'Shortlisted' },
            { id: 'interview_scheduled', label: 'Interviews' },
            { id: 'visa_pending', label: 'Visa Pending' },
            { id: 'hired', label: 'Hired' }
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

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search candidate name, trade, destination, phone..."
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
          <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Briefcase className="w-4 h-4 text-amber-400" />
              <span>Candidate Applications & Deployment Status ({filteredApps.length})</span>
            </h3>
            <span className="text-xs text-slate-400 flex items-center space-x-1.5">
              <span>Endpoint:</span>
              <code className="text-cyan-400 font-mono text-[11px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                /api/admin/ats/applications
              </code>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800 uppercase font-mono text-[10px]">
                <tr>
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
                {filteredApps.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No candidate applications found matching the selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredApps.map(app => {
                    const candidateName = app.candidate_name || app.name || app.full_name || 'Applicant';
                    const candidatePhone = app.candidate_phone || app.phone || '';
                    const candidateEmail = app.candidate_email || app.email || '';
                    const targetTrade = app.target_trade || app.trade || app.candidate_job_title || app.candidate_role || app.job_title || 'General Deployment';
                    const destination = app.destination || app.destination_country || app.location_country || 'GCC / Overseas';
                    const experience = app.experience || (app.experience_years ? `${app.experience_years} yrs` : (app.years_experience ? `${app.years_experience} yrs` : '5 yrs'));
                    const passportStatus = app.passport_status || app.passport || 'ready';
                    const rawDigits = (app.candidate_whatsapp || candidatePhone).replace(/[^0-9]/g, '');
                    const whatsappUrl = rawDigits.length >= 7 ? `https://wa.me/${rawDigits}?text=${encodeURIComponent(`Hello ${candidateName}, regarding your overseas deployment application for ${targetTrade} through Nouman's Manpower Consultancy...`)}` : null;

                    return (
                      <tr
                        key={app.id}
                        onClick={() => setSelectedApp(app)}
                        className={`hover:bg-slate-850 cursor-pointer transition ${
                          selectedApp?.id === app.id ? 'bg-slate-800/90 ring-1 ring-inset ring-amber-500/40' : ''
                        }`}
                      >
                        {/* Candidate Column */}
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
                        </td>

                        {/* Target Trade Column */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-amber-300">{targetTrade}</div>
                          <div className="text-[11px] text-slate-400 flex items-center space-x-1 mt-0.5">
                            <Building2 className="w-3 h-3 text-slate-500 flex-shrink-0" />
                            <span className="truncate max-w-[130px]">{app.company_name || "Nouman's Consultancy Pool"}</span>
                          </div>
                        </td>

                        {/* Destination Column */}
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-cyan-300 font-semibold text-[11px]">
                            <MapPin className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                            <span>{destination}</span>
                          </span>
                        </td>

                        {/* Experience Column */}
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-mono">
                            <Award className="w-3 h-3 text-amber-400 flex-shrink-0" />
                            <span>{experience}</span>
                          </span>
                        </td>

                        {/* Passport & Medical Column */}
                        <td className="py-3.5 px-4">
                          {getPassportBadge(passportStatus, app.medical_status)}
                        </td>

                        {/* Status Column */}
                        <td className="py-3.5 px-4">
                          {getStatusBadge(app.application_status || app.status)}
                        </td>

                        {/* Actions Column */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5" onClick={e => e.stopPropagation()}>
                            {whatsappUrl && (
                              <a
                                href={whatsappUrl}
                                target="_blank"
                                rel="noreferrer"
                                title="Chat on WhatsApp"
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
                              onClick={() => setSelectedApp(app)}
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

        {/* Selected Candidate Inspector & Stage Changer */}
        <div className="lg:col-span-4 space-y-4">
          {selectedApp ? (
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
                    Destination: <span className="text-cyan-300 font-semibold">{selectedApp.destination || selectedApp.destination_country || selectedApp.location_country || 'GCC'}</span>
                  </p>
                </div>
                {getStatusBadge(selectedApp.application_status || selectedApp.status)}
              </div>

              {/* Direct Quick Contact Buttons */}
              <div className="grid grid-cols-2 gap-2">
                {selectedApp.candidate_phone && (
                  <a
                    href={`https://wa.me/${(selectedApp.candidate_whatsapp || selectedApp.candidate_phone).replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                )}
                {selectedApp.candidate_phone && (
                  <a
                    href={`tel:${selectedApp.candidate_phone}`}
                    className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Candidate</span>
                  </a>
                )}
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
                    <span className="font-bold text-cyan-400">{selectedApp.medical_status ? selectedApp.medical_status.replace('_', ' ') : 'Pending'}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="block text-slate-500">Visa Stage</span>
                    <span className="font-bold text-purple-400">{selectedApp.visa_status ? selectedApp.visa_status.replace('_', ' ') : 'Review'}</span>
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
                  onChange={e => handleStatusChange(selectedApp.id, e.target.value)}
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

              {/* Recruiter Audit Notes */}
              <form onSubmit={handleAddNote} className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span className="flex items-center space-x-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                    <span>Recruiter Audit Notes ({selectedApp.notes_count || 1})</span>
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
                    placeholder="Add recruiter comment..."
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
        </div>
      </div>
    </div>
  );
}
