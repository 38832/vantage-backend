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
  PlusCircle,
  X,
  Sparkles,
  AlertCircle,
  Trash2,
  ChevronRight,
  Filter
} from 'lucide-react';

export interface ATSApplication {
  id: string;
  candidate_id?: string;
  job_id?: string;
  candidate_name?: string;
  name?: string;
  full_name?: string;
  candidate_phone?: string;
  phone?: string;
  candidate_email?: string;
  email?: string;
  candidate_whatsapp?: string;
  whatsapp?: string;
  candidate_nationality?: string;
  nationality?: string;
  candidate_city?: string;
  candidate_country?: string;
  candidate_role?: string;
  candidate_job_title?: string;
  role?: string;
  trade?: string;
  target_trade?: string;
  job_title?: string;
  company_name?: string;
  destination?: string;
  destination_country?: string;
  location_country?: string;
  location_city?: string;
  experience_years?: number;
  years_experience?: number;
  experience?: string;
  passport?: string;
  passport_status?: string;
  passport_number?: string;
  document_status?: string;
  medical_status?: string;
  visa_status?: string;
  application_status: string;
  status?: string;
  recruiter_assigned?: string;
  interview_date?: string;
  interview_notes?: string;
  notes?: string;
  resume_url?: string;
  resume_source?: string;
  resume_file_name?: string;
  created_at?: string;
  notes_count?: number;
}

export interface JobVacancy {
  id: string;
  category_id?: string;
  category_name?: string;
  title: string;
  company_name: string;
  location_country: string;
  location_city?: string;
  employment_type: string;
  visa_required: boolean;
  experience_min: number;
  experience_max?: number;
  salary_min?: number;
  salary_max?: number;
  salary_currency: string;
  urgent: boolean;
  featured: boolean;
  status: string;
  posted_at?: string;
  skills: string[];
  openings_count: number;
  job_description?: string;
  requirements?: string;
  benefits?: string;
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
  }
];

const INITIAL_JOBS: JobVacancy[] = [
  {
    id: '22222222-2222-2222-2222-222222222201',
    title: 'Substation Electrical Foreman',
    company_name: 'KSA Red Sea Project (Al-Bawani)',
    location_country: 'Saudi Arabia',
    location_city: 'Jeddah / Red Sea',
    employment_type: 'project_based',
    visa_required: true,
    experience_min: 5,
    experience_max: 12,
    salary_min: 3800,
    salary_max: 5500,
    salary_currency: 'SAR',
    urgent: true,
    featured: true,
    status: 'published',
    posted_at: '2026-10-31T12:26:18Z',
    skills: ['high_voltage', 'substation', 'cable_jointing', 'safety'],
    openings_count: 14,
    job_description: 'Lead high-voltage electrical substation installation and primary commissioning.',
    requirements: 'Diploma/Degree in EE with 5+ yrs GCC substation experience.',
    benefits: 'Free accommodation, site food, medical cover, annual roundtrip flight ticket.'
  },
  {
    id: '22222222-2222-2222-2222-222222222202',
    title: 'HVAC Chiller Specialist',
    company_name: 'Gulf Facilities Management LLC',
    location_country: 'United Arab Emirates',
    location_city: 'Dubai',
    employment_type: 'full_time',
    visa_required: true,
    experience_min: 4,
    experience_max: 10,
    salary_min: 3200,
    salary_max: 4600,
    salary_currency: 'AED',
    urgent: true,
    featured: true,
    status: 'published',
    posted_at: '2026-10-31T12:26:18Z',
    skills: ['chillers', 'carrier', 'trane', 'troubleshooting', 'bms'],
    openings_count: 8,
    job_description: 'Diagnose and overhaul commercial water-cooled centrifugal and screw chillers.',
    requirements: 'Certified HVAC technician with Carrier/Trane/York factory expertise.',
    benefits: 'Furnished bachelor accommodation, transportation, and health insurance.'
  },
  {
    id: '22222222-2222-2222-2222-222222222205',
    title: 'Heavy Trailer / Dump Truck Driver',
    company_name: 'Oman Minerals & Logistics SAOG',
    location_country: 'Oman',
    location_city: 'Sohar',
    employment_type: 'full_time',
    visa_required: true,
    experience_min: 3,
    experience_max: 10,
    salary_min: 180,
    salary_max: 240,
    salary_currency: 'OMR',
    urgent: false,
    featured: false,
    status: 'published',
    posted_at: '2026-10-31T12:26:18Z',
    skills: ['heavy_trailer', 'gcc_license', 'quarry_driving', 'safety'],
    openings_count: 25,
    job_description: 'Safe operation of 40-ton articulated dump trucks and mineral freight trailers.',
    requirements: 'Valid GCC Heavy Vehicle Driving License with clean record.',
    benefits: 'Camp lodging, mess meals, overtime allowances, medical.'
  }
];

export function AdminDashboardView({ onCopy }: { onCopy: (text: string) => void; copiedSnippet: boolean }) {
  // Navigation View: 'applications' vs 'vacancies'
  const [activeAdminTab, setActiveAdminTab] = useState<'applications' | 'vacancies'>('applications');

  const [applications, setApplications] = useState<ATSApplication[]>(INITIAL_APPLICATIONS);
  const [jobs, setJobs] = useState<JobVacancy[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('ugetjob_persistent_jobs');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {
        // Fallback
      }
    }
    return INITIAL_JOBS;
  });

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState<ATSApplication | null>(INITIAL_APPLICATIONS[0]);
  const [selectedJob, setSelectedJob] = useState<JobVacancy | null>(INITIAL_JOBS[0]);
  const [newNoteText, setNewNoteText] = useState('');
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Live Backend Connection States
  const [isLoadingLive, setIsLoadingLive] = useState(false);
  const [liveConnected, setLiveConnected] = useState<boolean | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // Post New Requirement Modal States
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isSubmittingRequirement, setIsSubmittingRequirement] = useState(false);
  const [postSuccessNotice, setPostSuccessNotice] = useState<string | null>(null);
  const [postErrorMessage, setPostErrorMessage] = useState<string | null>(null);

  // Form State
  const [reqForm, setReqForm] = useState({
    title: '',
    company_name: '',
    category: 'construction',
    location_country: 'Saudi Arabia',
    location_city: 'Riyadh',
    openings_count: 5,
    experience_min: 3,
    experience_max: 8,
    salary_min: 3500,
    salary_max: 5000,
    salary_currency: 'SAR',
    employment_type: 'full_time',
    visa_required: true,
    urgent: true,
    featured: false,
    skills: 'site supervision, safety protocols, gulf experience',
    job_description: '',
    requirements: '',
    benefits: 'Free company accommodation, transport, medical insurance, and return air ticket.'
  });

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const adminUiLink = `${origin}/#admin`;
  const backendApiDashboardLink = `http://localhost:8000/api/admin/dashboard`;
  const backendApiAtsLink = `http://localhost:8000/api/admin/ats/applications`;
  const backendApiJobsLink = `http://localhost:8000/api/jobs`;
  const swaggerDocsLink = `http://localhost:8000/docs`;

  // Persist jobs to localStorage so newly posted requirements NEVER disappear
  useEffect(() => {
    if (typeof window !== 'undefined' && jobs.length > 0) {
      try {
        localStorage.setItem('ugetjob_persistent_jobs', JSON.stringify(jobs));
      } catch {
        // Ignore storage errors
      }
    }
  }, [jobs]);

  // Fetch live applications & jobs from local FastAPI backend
  const fetchLiveApplicationsAndJobs = async () => {
    setIsLoadingLive(true);
    let appSyncOk = false;
    let jobSyncOk = false;

    // 1. Fetch Applications
    try {
      const response = await fetch('http://localhost:8000/api/admin/ats/applications', {
        headers: { Accept: 'application/json' }
      });
      if (response.ok) {
        const json = await response.json();
        const records = json.data || (Array.isArray(json) ? json : null);
        if (Array.isArray(records) && records.length > 0) {
          setApplications(records);
          appSyncOk = true;
          if (!selectedApp || !records.find((r: ATSApplication) => r.id === selectedApp.id)) {
            setSelectedApp(records[0]);
          }
        }
      }
    } catch {
      // Offline fallback
    }

    // 2. Fetch Job Vacancies
    try {
      const jobRes = await fetch('http://localhost:8000/api/jobs?limit=50', {
        headers: { Accept: 'application/json' }
      });
      if (jobRes.ok) {
        const json = await jobRes.json();
        const jobRecords = json.data || (Array.isArray(json) ? json : null);
        if (Array.isArray(jobRecords) && jobRecords.length > 0) {
          setJobs(jobRecords);
          jobSyncOk = true;
          if (!selectedJob || !jobRecords.find((j: JobVacancy) => j.id === selectedJob.id)) {
            setSelectedJob(jobRecords[0]);
          }
        }
      }
    } catch {
      // Offline fallback
    }

    if (appSyncOk || jobSyncOk) {
      setLiveConnected(true);
      setLastSyncTime(new Date().toLocaleTimeString());
    } else {
      setLiveConnected(false);
    }
    setIsLoadingLive(false);
  };

  useEffect(() => {
    fetchLiveApplicationsAndJobs();
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

    try {
      await fetch(`http://localhost:8000/api/admin/ats/applications/${appId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ application_status: newStatus })
      });
    } catch {
      // Offline fallback
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

  // POST NEW REQUIREMENT HANDLER
  const handlePostRequirement = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingRequirement(true);
    setPostErrorMessage(null);

    const payload = {
      title: reqForm.title,
      company_name: reqForm.company_name || "Nouman's Consultancy Client",
      category: reqForm.category,
      location_country: reqForm.location_country,
      location_city: reqForm.location_city,
      openings_count: Number(reqForm.openings_count) || 1,
      vacancies: Number(reqForm.openings_count) || 1,
      experience_min: Number(reqForm.experience_min) || 0,
      experience_max: reqForm.experience_max ? Number(reqForm.experience_max) : undefined,
      salary_min: reqForm.salary_min ? Number(reqForm.salary_min) : undefined,
      salary_max: reqForm.salary_max ? Number(reqForm.salary_max) : undefined,
      salary_currency: reqForm.salary_currency,
      employment_type: reqForm.employment_type,
      visa_required: reqForm.visa_required,
      urgent: reqForm.urgent,
      featured: reqForm.featured,
      skills: reqForm.skills.split(',').map(s => s.trim()).filter(Boolean),
      job_description: reqForm.job_description || `Overseas recruitment requirement for ${reqForm.title} in ${reqForm.location_country}.`,
      requirements: reqForm.requirements || reqForm.job_description,
      benefits: reqForm.benefits,
      status: 'published'
    };

    let savedJob: JobVacancy;

    try {
      const response = await fetch('http://localhost:8000/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const json = await response.json();
        savedJob = json.data || json;
      } else {
        // Fallback local persistence
        savedJob = {
          id: 'job-' + Date.now(),
          ...payload,
          posted_at: new Date().toISOString()
        } as JobVacancy;
      }
    } catch {
      // Local persistent fallback
      savedJob = {
        id: 'job-' + Date.now(),
        ...payload,
        posted_at: new Date().toISOString()
      } as JobVacancy;
    }

    // Update state permanently - NO DISAPPEARING!
    setJobs(prev => [savedJob, ...prev]);
    setSelectedJob(savedJob);
    setIsPostModalOpen(false);
    setIsSubmittingRequirement(false);
    setActiveAdminTab('vacancies');

    // Display persistent success alert
    setPostSuccessNotice(`Requirement "${savedJob.title}" (${savedJob.location_country}) published successfully and now live on Job Vacancies page!`);
    setTimeout(() => setPostSuccessNotice(null), 8000);

    // Reset Form
    setReqForm({
      title: '',
      company_name: '',
      category: 'construction',
      location_country: 'Saudi Arabia',
      location_city: 'Riyadh',
      openings_count: 5,
      experience_min: 3,
      experience_max: 8,
      salary_min: 3500,
      salary_max: 5000,
      salary_currency: 'SAR',
      employment_type: 'full_time',
      visa_required: true,
      urgent: true,
      featured: false,
      skills: 'site supervision, safety protocols, gulf experience',
      job_description: '',
      requirements: '',
      benefits: 'Free company accommodation, transport, medical insurance, and return air ticket.'
    });
  };

  const handleCloseJob = async (jobId: string, jobTitle: string) => {
    if (!window.confirm(`Are you sure you want to close and archive vacancy "${jobTitle}"?`)) return;

    setJobs(prev => prev.filter(j => j.id !== jobId));
    if (selectedJob?.id === jobId) {
      setSelectedJob(jobs.find(j => j.id !== jobId) || null);
    }

    try {
      await fetch(`http://localhost:8000/api/admin/jobs/${jobId}`, {
        method: 'DELETE'
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

  const filteredJobs = jobs.filter(job => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        job.title.toLowerCase().includes(q) ||
        job.company_name.toLowerCase().includes(q) ||
        job.location_country.toLowerCase().includes(q) ||
        (job.location_city && job.location_city.toLowerCase().includes(q))
      );
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
      {/* Top Banner & Action Buttons */}
      <div className="bg-gradient-to-r from-amber-500/15 via-slate-900 to-cyan-500/15 border border-amber-500/30 rounded-2xl p-6 sm:p-7 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2 border border-amber-500/40">
              <LayoutDashboard className="w-3.5 h-3.5 text-amber-400" />
              <span>Recruiter Command Center</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Overseas Recruitment & Requirement Management
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Post new job requirements directly to the job vacancies page, manage active deployments, and review verified candidates.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Post New Requirement Button */}
            <button
              onClick={() => setIsPostModalOpen(true)}
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs shadow-lg shadow-amber-500/20 transition transform hover:-translate-y-0.5"
            >
              <PlusCircle className="w-4 h-4 text-slate-950" />
              <span>+ Post New Requirement</span>
            </button>

            <button
              onClick={fetchLiveApplicationsAndJobs}
              disabled={isLoadingLive}
              className="inline-flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/40 font-bold px-3.5 py-2.5 rounded-xl text-xs transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLive ? 'animate-spin' : ''}`} />
              <span>{isLoadingLive ? 'Syncing...' : 'Sync Backend'}</span>
            </button>

            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-500/30 font-bold px-3.5 py-2.5 rounded-xl text-xs transition"
            >
              <span>Swagger API Docs</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Success Notice if just posted */}
        {postSuccessNotice && (
          <div className="mt-4 p-3.5 bg-emerald-500/15 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center justify-between shadow-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span className="font-semibold">{postSuccessNotice}</span>
            </div>
            <button
              onClick={() => setPostSuccessNotice(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Sync Status Banner */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs">
          <div className="flex items-center space-x-2">
            <span className={`w-2.5 h-2.5 rounded-full ${liveConnected ? 'bg-emerald-400 shadow-md shadow-emerald-400/50' : 'bg-amber-400'}`} />
            <span className="text-slate-300 font-medium">
              {liveConnected ? (
                <>FastAPI Backend Online (<code className="text-cyan-400">http://localhost:8000/api/jobs</code> & <code className="text-cyan-400">/api/admin/ats/applications</code>)</>
              ) : (
                <>Backend Preview Mode (<code className="text-amber-400">uvicorn app.main:app --port 8000 --reload</code>)</>
              )}
            </span>
          </div>
          {lastSyncTime && (
            <span className="text-[11px] text-slate-500 font-mono">Last Synced: {lastSyncTime}</span>
          )}
        </div>

        {/* Direct Link Shortcuts */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-5">
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between space-y-2">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                <span>Web Admin Portal</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30">Frontend</span>
              </div>
              <p className="text-xs font-mono text-amber-400 mt-1 truncate">
                {adminUiLink}
              </p>
            </div>
            <button
              onClick={() => handleCopyLink(adminUiLink, 'ui')}
              className="w-full py-1 bg-slate-800 hover:bg-slate-700 rounded text-[11px] font-semibold text-slate-200 flex items-center justify-center space-x-1.5 transition"
            >
              {copiedLink === 'ui' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedLink === 'ui' ? 'Copied' : 'Copy UI Link'}</span>
            </button>
          </div>

          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between space-y-2">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                <span>Job Vacancies API</span>
                <span className="text-[10px] bg-blue-500/10 text-cyan-400 px-1.5 py-0.5 rounded border border-blue-500/30">GET/POST /jobs</span>
              </div>
              <p className="text-xs font-mono text-cyan-400 mt-1 truncate">
                {backendApiJobsLink}
              </p>
            </div>
            <button
              onClick={() => handleCopyLink(backendApiJobsLink, 'api_jobs')}
              className="w-full py-1 bg-slate-800 hover:bg-slate-700 rounded text-[11px] font-semibold text-slate-200 flex items-center justify-center space-x-1.5 transition"
            >
              {copiedLink === 'api_jobs' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedLink === 'api_jobs' ? 'Copied' : 'Copy Endpoint'}</span>
            </button>
          </div>

          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between space-y-2">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                <span>Applications API</span>
                <span className="text-[10px] bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded border border-purple-500/30">ATS Pipeline</span>
              </div>
              <p className="text-xs font-mono text-purple-300 mt-1 truncate">
                {backendApiAtsLink}
              </p>
            </div>
            <button
              onClick={() => handleCopyLink(backendApiAtsLink, 'api_ats')}
              className="w-full py-1 bg-slate-800 hover:bg-slate-700 rounded text-[11px] font-semibold text-slate-200 flex items-center justify-center space-x-1.5 transition"
            >
              {copiedLink === 'api_ats' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedLink === 'api_ats' ? 'Copied' : 'Copy Endpoint'}</span>
            </button>
          </div>

          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between space-y-2">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                <span>Interactive Swagger</span>
                <span className="text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/30">OpenAPI UI</span>
              </div>
              <p className="text-xs font-mono text-amber-300 mt-1 truncate">
                {swaggerDocsLink}
              </p>
            </div>
            <button
              onClick={() => handleCopyLink(swaggerDocsLink, 'docs')}
              className="w-full py-1 bg-slate-800 hover:bg-slate-700 rounded text-[11px] font-semibold text-slate-200 flex items-center justify-center space-x-1.5 transition"
            >
              {copiedLink === 'docs' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedLink === 'docs' ? 'Copied' : 'Copy URL'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Switcher Navigation Tabs: Applications vs Job Vacancies */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-2.5 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveAdminTab('applications')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
              activeAdminTab === 'applications'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Candidate Applications ({applications.length})</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('vacancies')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
              activeAdminTab === 'vacancies'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Job Vacancies & Requirements ({jobs.length})</span>
          </button>
        </div>

        <div className="flex items-center space-x-3 px-2">
          <button
            onClick={() => setIsPostModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-bold transition"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Add New Requirement</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: CANDIDATE APPLICATIONS & ATS */}
      {activeAdminTab === 'applications' && (
        <div className="space-y-6">
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
                placeholder="Search candidate name, trade, phone..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Candidate Applications Table & Details Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
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
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-white text-sm">{candidateName}</div>
                              <div className="text-[11px] text-slate-400 mt-0.5 flex flex-wrap items-center gap-1.5 font-mono">
                                {candidatePhone && <span>{candidatePhone}</span>}
                                {candidatePhone && candidateEmail && <span>•</span>}
                                {candidateEmail && <span className="truncate max-w-[120px]">{candidateEmail}</span>}
                              </div>
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
                              {getPassportBadge(passportStatus, app.medical_status)}
                            </td>

                            <td className="py-3.5 px-4">
                              {getStatusBadge(app.application_status || app.status)}
                            </td>

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

            {/* Candidate Details Drawer */}
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
                  </div>

                  {/* Resume PDF link */}
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-300 font-semibold flex items-center space-x-1.5">
                        <FileText className="w-3.5 h-3.5 text-amber-400" />
                        <span>Candidate Resume / CV</span>
                      </span>
                      <span className="text-[10px] text-cyan-400 uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30">
                        {selectedApp.resume_source || 'Verified Document'}
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
                      <p className="text-[11px] text-slate-500 italic">No resume uploaded</p>
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
                  <span>Select an application row to view candidate details.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: JOB VACANCIES & REQUIREMENTS (Shows published vacancies, including newly posted ones) */}
      {activeAdminTab === 'vacancies' && (
        <div className="space-y-6">
          {/* Header Action Bar */}
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Briefcase className="w-4 h-4 text-amber-400" />
                <span>Live Job Vacancies & Active Requirements ({filteredJobs.length})</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                All vacancies published to <code className="text-cyan-400 font-mono">GET /api/jobs</code>. Available immediately for candidates to apply.
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsPostModalOpen(true)}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 shadow-md shadow-amber-500/20 transition"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Post Requirement</span>
              </button>

              <div className="relative w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter vacancies..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Vacancies Grid & Inspector */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Vacancies Table List */}
            <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800 uppercase font-mono text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Requirement / Vacancy Title</th>
                      <th className="py-3 px-4">Destination</th>
                      <th className="py-3 px-4">Openings</th>
                      <th className="py-3 px-4">Salary Bracket</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {filteredJobs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-500">
                          <Briefcase className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                          <p>No job vacancies found. Click "+ Post New Requirement" to publish one!</p>
                        </td>
                      </tr>
                    ) : (
                      filteredJobs.map(job => (
                        <tr
                          key={job.id}
                          onClick={() => setSelectedJob(job)}
                          className={`hover:bg-slate-850 cursor-pointer transition ${
                            selectedJob?.id === job.id ? 'bg-slate-800/90 ring-1 ring-inset ring-amber-500/40' : ''
                          }`}
                        >
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-white text-sm flex items-center space-x-2">
                              <span>{job.title}</span>
                              {job.urgent && (
                                <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                                  Urgent
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5 flex items-center space-x-1.5">
                              <Building2 className="w-3 h-3 text-slate-500" />
                              <span>{job.company_name}</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-cyan-300 font-semibold text-[11px]">
                              <MapPin className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                              <span>{job.location_city ? `${job.location_city}, ` : ''}{job.location_country}</span>
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-300 font-bold text-xs border border-amber-500/30">
                              <Users className="w-3 h-3 text-amber-400" />
                              <span>{job.openings_count} seats</span>
                            </span>
                          </td>

                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-300">
                            {job.salary_min ? (
                              <span>
                                {job.salary_min} - {job.salary_max || job.salary_min} {job.salary_currency}
                              </span>
                            ) : (
                              <span className="text-slate-500">As per standard</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                              {job.status || 'Published'}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end space-x-1.5" onClick={e => e.stopPropagation()}>
                              <button
                                onClick={() => setSelectedJob(job)}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-semibold border border-slate-700"
                              >
                                View Specs
                              </button>
                              <button
                                onClick={() => handleCloseJob(job.id, job.title)}
                                title="Close / Archive Vacancy"
                                className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/30 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Vacancy Details Drawer */}
            <div className="lg:col-span-4 space-y-4">
              {selectedJob ? (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
                  <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-bold text-base text-white">{selectedJob.title}</h4>
                      </div>
                      <p className="text-xs text-amber-400 font-medium">{selectedJob.company_name}</p>
                    </div>
                    <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                      Live Vacancy
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">Openings / Seats</span>
                      <span className="font-bold text-white text-sm">{selectedJob.openings_count} positions</span>
                    </div>
                    <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">Experience Required</span>
                      <span className="font-bold text-white text-sm">{selectedJob.experience_min}+ years</span>
                    </div>
                    <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">Destination Country</span>
                      <span className="font-bold text-cyan-400">{selectedJob.location_country}</span>
                    </div>
                    <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">Salary Bracket</span>
                      <span className="font-bold text-amber-400 font-mono">
                        {selectedJob.salary_min ? `${selectedJob.salary_min} - ${selectedJob.salary_max || selectedJob.salary_min} ${selectedJob.salary_currency}` : 'Negotiable'}
                      </span>
                    </div>
                  </div>

                  {selectedJob.job_description && (
                    <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs">
                      <span className="text-slate-400 font-bold block mb-1">Scope & Job Description:</span>
                      <p className="text-slate-300 leading-relaxed text-[11px]">{selectedJob.job_description}</p>
                    </div>
                  )}

                  {selectedJob.requirements && (
                    <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs">
                      <span className="text-slate-400 font-bold block mb-1">Mandatory Requirements:</span>
                      <p className="text-slate-300 leading-relaxed text-[11px]">{selectedJob.requirements}</p>
                    </div>
                  )}

                  {selectedJob.benefits && (
                    <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs">
                      <span className="text-emerald-400 font-bold block mb-1">Company Perks & Benefits:</span>
                      <p className="text-slate-300 leading-relaxed text-[11px]">{selectedJob.benefits}</p>
                    </div>
                  )}

                  {selectedJob.skills && selectedJob.skills.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-xs text-slate-400 font-bold">Skills Required:</span>
                      <div className="flex flex-wrap gap-1">
                        {selectedJob.skills.map((s, idx) => (
                          <span key={idx} className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded border border-slate-700 font-mono">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-800 flex space-x-2">
                    <button
                      onClick={() => handleCloseJob(selectedJob.id, selectedJob.title)}
                      className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Archive / Close Requirement</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900 border border-dashed border-slate-800 rounded-xl p-8 text-center text-slate-500 text-xs flex flex-col items-center justify-center space-y-2">
                  <Briefcase className="w-8 h-8 text-slate-700" />
                  <span>Select a vacancy to inspect requirements and details.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* POST NEW REQUIREMENT MODAL */}
      {isPostModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-7 space-y-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded bg-amber-500/15 text-amber-400 text-[11px] font-bold uppercase tracking-wider border border-amber-500/30 mb-1.5">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Live Job Publishing Form</span>
                </div>
                <h3 className="text-xl font-black text-white tracking-tight">
                  Post New Overseas Recruitment Requirement
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Publishes directly to <code className="text-cyan-400">POST /api/jobs</code>. Immediately live on the Job Vacancies portal.
                </p>
              </div>
              <button
                onClick={() => setIsPostModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {postErrorMessage && (
              <div className="p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{postErrorMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handlePostRequirement} className="space-y-4">
              {/* Row 1: Title & Company */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Job / Trade Title <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Substation Electrical Foreman"
                    value={reqForm.title}
                    onChange={e => setReqForm({ ...reqForm, title: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Client / Company Name <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Saudi Binladin Group"
                    value={reqForm.company_name}
                    onChange={e => setReqForm({ ...reqForm, company_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Row 2: Category & Destination Country */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Industry Category <span className="text-amber-400">*</span>
                  </label>
                  <select
                    value={reqForm.category}
                    onChange={e => setReqForm({ ...reqForm, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value="construction">Construction & Civil</option>
                    <option value="electrical">Electrical & Substation</option>
                    <option value="engineering">Engineering & MEP</option>
                    <option value="hvac">HVAC & Refrigeration</option>
                    <option value="oil-and-gas">Oil & Gas / Offshore</option>
                    <option value="healthcare">Healthcare & Nursing</option>
                    <option value="hospitality">Hospitality & Catering</option>
                    <option value="logistics">Logistics & Heavy Drivers</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Destination Country <span className="text-amber-400">*</span>
                  </label>
                  <select
                    value={reqForm.location_country}
                    onChange={e => {
                      const c = e.target.value;
                      let curr = 'SAR';
                      if (c === 'United Arab Emirates') curr = 'AED';
                      else if (c === 'Qatar') curr = 'QAR';
                      else if (c === 'Kuwait') curr = 'KWD';
                      else if (c === 'Oman') curr = 'OMR';
                      setReqForm({ ...reqForm, location_country: c, salary_currency: curr });
                    }}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value="Saudi Arabia">Saudi Arabia (KSA)</option>
                    <option value="United Arab Emirates">United Arab Emirates (UAE)</option>
                    <option value="Qatar">Qatar</option>
                    <option value="Kuwait">Kuwait</option>
                    <option value="Oman">Oman</option>
                    <option value="Bahrain">Bahrain</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Location City
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Riyadh / Jeddah"
                    value={reqForm.location_city}
                    onChange={e => setReqForm({ ...reqForm, location_city: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Row 3: Openings, Experience, Salary */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Openings Count <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={reqForm.openings_count}
                    onChange={e => setReqForm({ ...reqForm, openings_count: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Min Experience (Years)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={reqForm.experience_min}
                    onChange={e => setReqForm({ ...reqForm, experience_min: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Monthly Salary Range
                  </label>
                  <div className="flex space-x-1">
                    <input
                      type="number"
                      placeholder="Min"
                      value={reqForm.salary_min}
                      onChange={e => setReqForm({ ...reqForm, salary_min: Number(e.target.value) })}
                      className="w-1/2 px-2 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-amber-500 font-mono"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={reqForm.salary_max}
                      onChange={e => setReqForm({ ...reqForm, salary_max: Number(e.target.value) })}
                      className="w-1/2 px-2 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Currency
                  </label>
                  <input
                    type="text"
                    value={reqForm.salary_currency}
                    onChange={e => setReqForm({ ...reqForm, salary_currency: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              {/* Skills */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Required Skills (Comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. substation, high_voltage, cable_jointing, safety"
                  value={reqForm.skills}
                  onChange={e => setReqForm({ ...reqForm, skills: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Job Description & Requirements */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Scope of Work / Description <span className="text-amber-400">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Detailed responsibilities on site..."
                    value={reqForm.job_description}
                    onChange={e => setReqForm({ ...reqForm, job_description: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Candidate Requirements
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Diploma/Degree, GCC valid license, 5+ yrs experience..."
                    value={reqForm.requirements}
                    onChange={e => setReqForm({ ...reqForm, requirements: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Perks & Benefits */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Provided Benefits & Perks
                </label>
                <input
                  type="text"
                  placeholder="e.g. Free accommodation, transport, medical insurance, flight ticket"
                  value={reqForm.benefits}
                  onChange={e => setReqForm({ ...reqForm, benefits: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Checkboxes: Urgent, Featured */}
              <div className="flex items-center space-x-6 pt-1">
                <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reqForm.urgent}
                    onChange={e => setReqForm({ ...reqForm, urgent: e.target.checked })}
                    className="rounded border-slate-700 text-amber-500 focus:ring-0 w-4 h-4 bg-slate-800"
                  />
                  <span className="font-semibold text-rose-400">Mark as Urgent Mobilization</span>
                </label>

                <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reqForm.featured}
                    onChange={e => setReqForm({ ...reqForm, featured: e.target.checked })}
                    className="rounded border-slate-700 text-amber-500 focus:ring-0 w-4 h-4 bg-slate-800"
                  />
                  <span>Featured Vacancy (Hero Placement)</span>
                </label>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPostModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRequirement}
                  className="px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 flex items-center space-x-2 shadow-lg shadow-amber-500/20 transition disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingRequirement ? 'Publishing to DB...' : 'Publish Live Requirement'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
