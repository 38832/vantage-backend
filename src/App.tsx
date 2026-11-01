/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Server, 
  Terminal, 
  Database, 
  Layers, 
  Copy, 
  Check, 
  Play, 
  Code2, 
  FileCode, 
  Globe, 
  ShieldCheck, 
  HardDrive, 
  CheckCircle2, 
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Search,
  BookOpen,
  Cpu,
  LayoutDashboard
} from 'lucide-react';
import { DatabaseSchemaView } from './DatabaseSchemaView';
import { AdminDashboardView } from './AdminDashboardView';

interface Endpoint {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  category: 'Jobs' | 'Applications' | 'Inquiries' | 'Admin ATS' | 'Health';
  summary: string;
  description: string;
  queryParams?: string[];
  requestBody?: object;
  responseBody: object;
}

const ENDPOINTS: Endpoint[] = [
  {
    method: 'GET',
    path: '/api/health',
    category: 'Health',
    summary: 'Backend Health Check',
    description: 'Verify server runtime, database connectivity status, and active environment.',
    responseBody: {
      status: 'ok',
      service: 'ugetjob-backend',
      environment: 'production',
      database: 'postgresql-asyncpg',
      storage: 'supabase'
    }
  },
  {
    method: 'GET',
    path: '/api/categories',
    category: 'Jobs',
    summary: 'List Job Categories',
    description: 'Fetch all active recruitment sectors (Construction, MEP, Electrical, HVAC, Oil & Gas, Healthcare, Logistics, etc.).',
    responseBody: {
      success: true,
      data: [
        { id: 'uuid', slug: 'electrical', name: 'Electrical & Substation', description: 'Substation and industrial roles', is_active: true },
        { id: 'uuid', slug: 'hvac', name: 'HVAC & Refrigeration', description: 'Chillers and central AC', is_active: true }
      ]
    }
  },
  {
    method: 'GET',
    path: '/api/jobs',
    category: 'Jobs',
    summary: 'Search & Filter Overseas Jobs',
    description: 'Search public published job listings across Saudi Arabia, UAE, Qatar, Kuwait, Oman, Bahrain.',
    queryParams: ['keyword', 'category', 'country', 'city', 'employment_type', 'visa_required', 'experience_min', 'urgent_only', 'featured_only', 'page', 'limit'],
    responseBody: {
      success: true,
      data: [
        {
          id: '22222222-2222-2222-2222-222222222201',
          title: 'Substation Electrical Foreman',
          company_name: 'KSA Red Sea Project',
          location_country: 'Saudi Arabia',
          location_city: 'Jeddah / Red Sea',
          employment_type: 'project_based',
          visa_required: true,
          experience_min: 5,
          salary_min: 3800,
          salary_max: 5500,
          salary_currency: 'SAR',
          urgent: true,
          featured: true,
          status: 'published'
        }
      ],
      meta: { page: 1, limit: 20, total: 48 }
    }
  },
  {
    method: 'GET',
    path: '/api/jobs/{job_id}',
    category: 'Jobs',
    summary: 'Get Job Details',
    description: 'Retrieve complete job specs, perks (free accommodation, airfare, food), duties, and requirements.',
    responseBody: {
      success: true,
      data: {
        id: 'uuid',
        title: 'Substation Electrical Foreman',
        company_name: 'KSA Red Sea Project',
        job_description: 'Lead high-voltage electrical substation installation...',
        requirements: 'Degree/Diploma in EE with 5+ yrs GCC experience.',
        benefits: 'Accommodation + Food + Medical + Annual Flight Ticket.',
        salary_min: 3800,
        salary_max: 5500,
        salary_currency: 'SAR',
        openings_count: 14,
        skills: ['high_voltage', 'substation', 'cable_jointing']
      }
    }
  },
  {
    method: 'POST',
    path: '/api/jobs',
    category: 'Jobs',
    summary: 'Post New Requirement / Job Vacancy',
    description: 'Publish a new overseas manpower requirement or job vacancy. Sets status to published so it immediately appears in the Job Vacancies portal.',
    requestBody: {
      title: 'Heavy Crane Operator',
      company_name: 'Saudi Binladin Group',
      category: 'construction',
      location_country: 'Saudi Arabia',
      location_city: 'Riyadh',
      openings_count: 8,
      experience_min: 5,
      salary_min: 3500,
      salary_max: 4800,
      salary_currency: 'SAR',
      urgent: true,
      job_description: 'Operate 100T mobile telescopic cranes on mega project sites.',
      requirements: 'Valid GCC Heavy Equipment Operator License with clean record.',
      benefits: 'Accommodation, transport, and comprehensive health insurance provided.'
    },
    responseBody: {
      success: true,
      data: {
        id: '33333333-3333-3333-3333-333333333301',
        title: 'Heavy Crane Operator',
        company_name: 'Saudi Binladin Group',
        location_country: 'Saudi Arabia',
        location_city: 'Riyadh',
        openings_count: 8,
        status: 'published',
        urgent: true
      }
    }
  },
  {
    method: 'POST',
    path: '/api/applications/quick-apply',
    category: 'Applications',
    summary: 'Candidate Quick Apply (JSON)',
    description: 'Submit candidate credentials from your frontend quick apply form. Supports both Google Drive / cloud CV links (drive_link) and candidate profile creation.',
    requestBody: {
      job_id: '22222222-2222-2222-2222-222222222201',
      full_name: 'Mohd Basheer',
      email: 'candidate@example.com',
      phone: '+971500000000',
      whatsapp: '+971500000000',
      nationality: 'Indian',
      current_country: 'India',
      current_city: 'Kochi',
      passport_status: 'ready',
      passport_number: 'P1234567',
      years_experience: 7,
      current_job_title: 'HVAC Chiller Specialist',
      current_role: 'HVAC Chiller Specialist',
      drive_link: 'https://drive.google.com/file/d/1A2B3C4D5E/view',
      resume_source: 'drive_link',
      preferred_country: 'Saudi Arabia',
      visa_status: 'required',
      willing_to_relocate: true,
      cover_letter: 'Interested in Gulf placement.',
      consent_to_contact: true
    },
    responseBody: {
      success: true,
      data: {
        application_id: '8a91c2e4-f3b1-419b-a812-984e1b302a91',
        candidate_id: '1f44c9d2-7c8a-44e2-9b23-64a8d052b311',
        status: 'new',
        resume_url: 'https://drive.google.com/file/d/1A2B3C4D5E/view',
        resume_source: 'drive_link',
        message: 'Application submitted successfully. Our recruitment team will review your profile.'
      }
    }
  },
  {
    method: 'POST',
    path: '/api/applications/quick-apply-multipart',
    category: 'Applications',
    summary: 'Candidate Quick Apply with Resume File Upload (Multipart)',
    description: 'Direct multipart form upload accepting PDF/DOCX resume file (or drive_link) along with candidate data. Automatically persists resume in candidate_resumes table.',
    requestBody: {
      full_name: 'Mohd Basheer',
      phone: '+971500000000',
      email: 'candidate@example.com',
      current_job_title: 'HVAC Chiller Specialist',
      preferred_country: 'Saudi Arabia',
      resume: '(binary PDF / DOCX file upload)'
    },
    responseBody: {
      success: true,
      data: {
        application_id: '8a91c2e4-f3b1-419b-a812-984e1b302a91',
        candidate_id: '1f44c9d2-7c8a-44e2-9b23-64a8d052b311',
        resume_url: 'https://xxxx.supabase.co/storage/v1/object/candidate-resumes/...',
        resume_source: 'uploaded_file',
        message: 'Candidate applied successfully with resume registered.'
      }
    }
  },
  {
    method: 'GET',
    path: '/api/applications/candidates/{candidate_id}/resumes',
    category: 'Applications',
    summary: 'Get Candidate Resumes (candidate_resumes Table)',
    description: 'Retrieve all resumes recorded for a candidate, including Drive links and uploaded files, ordered by primary CV status.',
    responseBody: {
      success: true,
      data: [
        {
          id: 'uuid',
          candidate_id: '1f44c9d2-7c8a-44e2-9b23-64a8d052b311',
          original_filename: 'Basheer_HVAC_CV.pdf',
          storage_bucket: 'candidate-resumes',
          storage_path: 'app_id/resume.pdf',
          mime_type: 'application/pdf',
          file_size_bytes: 245000,
          source: 'uploaded_file',
          drive_link: null,
          is_primary: true,
          uploaded_at: '2026-10-31T05:00:00Z'
        }
      ]
    }
  },
  {
    method: 'POST',
    path: '/api/applications/{application_id}/documents',
    category: 'Applications',
    summary: 'Upload Supporting Application Document',
    description: 'Multipart form upload for candidate passport copy, medical clearance, or trade testing certificates to candidate-resumes or company-documents.',
    requestBody: {
      document_type: 'passport',
      file: '(binary PDF / JPEG file)'
    },
    responseBody: {
      success: true,
      data: {
        id: 'uuid',
        application_id: 'uuid',
        document_type: 'passport',
        storage_path: 'candidate-resumes/uuid/passport.pdf',
        url: 'https://xxxx.supabase.co/storage/v1/object/candidate-resumes/...'
      }
    }
  },
  {
    method: 'POST',
    path: '/api/inquiries/employer',
    category: 'Inquiries',
    summary: 'Employer Manpower Request',
    description: 'Capture inbound employer workforce requirements, trade specifications, headcounts, and urgency.',
    requestBody: {
      company_name: 'Riyadh Metro Works',
      contact_name: 'Ali Khan',
      email: 'ali@company.com',
      phone: '+966500000000',
      requirement_type: 'manpower',
      industry: 'construction',
      job_title: 'Electrical Foreman',
      number_of_positions: 12,
      country: 'Saudi Arabia',
      city: 'Riyadh',
      urgency: 'urgent',
      notes: 'Need qualified professionals for project site'
    },
    responseBody: {
      success: true,
      data: {
        id: 'uuid',
        status: 'received',
        message: 'Inquiry received. Corporate mobilization lead will get in touch.'
      }
    }
  },
  {
    method: 'POST',
    path: '/api/inquiries/service',
    category: 'Inquiries',
    summary: 'Specialized Service Request',
    description: 'Direct bookings for Embassy Visa Stamping, GAMCA Medical Clearance, Trade Testing, or Bulk Mobilization.',
    requestBody: {
      service_type: 'visa',
      company_name: 'ABC Logistics',
      contact_name: 'Nadia',
      email: 'nadia@example.com',
      phone: '+971500123456',
      city: 'Dubai',
      notes: 'Need visa endorsement assistance for 5 workers.'
    },
    responseBody: {
      success: true,
      data: {
        id: 'uuid',
        service_type: 'visa',
        status: 'received'
      }
    }
  },
  {
    method: 'GET',
    path: '/api/admin/dashboard',
    category: 'Admin ATS',
    summary: 'ATS Pipeline Summary KPIs',
    description: 'Fetch counts of applicants by recruitment pipeline stage for admin ATS dashboards.',
    responseBody: {
      success: true,
      data: {
        total_applications: 54,
        new_applications: 18,
        contacted: 8,
        shortlisted: 12,
        interview_scheduled: 6,
        visa_pending: 4,
        visa_approved: 3,
        hired: 3
      }
    }
  },
  {
    method: 'GET',
    path: '/api/admin/ats/applications',
    category: 'Admin ATS',
    summary: 'List ATS Candidate Applications',
    description: 'Paginated admin view of candidate profiles with status filter, assigned recruiter, and keyword search.',
    queryParams: ['status', 'recruiter_assigned', 'search', 'page', 'limit'],
    responseBody: {
      success: true,
      data: [
        {
          id: '322dd461-767a-4d8b-b3af-2d12771aa7d3',
          candidate_id: 'c201-767a-4d8b-b3af-2d12771aa7d3',
          candidate_name: 'Abutalha Shaikh',
          name: 'Abutalha Shaikh',
          full_name: 'Abutalha Shaikh',
          candidate_phone: '+919766065167',
          phone: '+919766065167',
          candidate_whatsapp: '+919766065167',
          candidate_email: 'abutalha11503@gmail.com',
          candidate_role: 'HVAC Chiller Specialist',
          candidate_job_title: 'HVAC Chiller Specialist',
          target_trade: 'HVAC Chiller Specialist',
          trade: 'HVAC Chiller Specialist',
          job_title: 'HVAC Chiller Specialist',
          company_name: 'Gulf Facilities Management LLC',
          destination: 'United Arab Emirates',
          destination_country: 'United Arab Emirates',
          location_country: 'United Arab Emirates',
          experience_years: 5,
          years_experience: 5,
          experience: '5 yrs',
          passport: 'ready',
          passport_status: 'ready',
          medical_status: 'cleared',
          visa_status: 'ready_for_submission',
          application_status: 'new',
          status: 'new',
          recruiter_assigned: 'Nouman Qureshi',
          resume_url: 'https://ysaggxhpmmxbsjygucny.supabase.co/storage/v1/object/sign/candidate-resumes/322dd461-767a-4d8b-b3af-2d12771aa7d3/Abutalha_Shaikh_HVAC_Resume.pdf',
          resume_source: 'uploaded_file',
          created_at: '2026-10-31T08:17:50.765281Z'
        }
      ],
      meta: { page: 1, limit: 20, total: 2 }
    }
  },
  {
    method: 'PATCH',
    path: '/api/admin/ats/applications/{application_id}',
    category: 'Admin ATS',
    summary: 'Update Candidate ATS Stage',
    description: 'Advance application status, set client interview date/time, assign recruiter, or update notes.',
    requestBody: {
      application_status: 'interview_scheduled',
      recruiter_assigned: 'Nouman Qureshi',
      interview_date: '2026-11-05T10:00:00Z',
      interview_notes: 'Candidate cleared technical phone screening.'
    },
    responseBody: {
      success: true,
      data: {
        id: 'uuid',
        application_status: 'interview_scheduled'
      }
    }
  },
  {
    method: 'POST',
    path: '/api/admin/ats/applications/{application_id}/notes',
    category: 'Admin ATS',
    summary: 'Add Recruiter Internal Note',
    description: 'Append an internal recruiter comment to the candidate application audit log.',
    requestBody: {
      author_name: 'Nouman Qureshi',
      note: 'Passport validity confirmed till 2029. Ready for client interview on Zoom.'
    },
    responseBody: {
      success: true,
      data: {
        id: 'uuid',
        application_id: 'uuid',
        author_name: 'Nouman Qureshi',
        note: 'Passport validity confirmed till 2029...',
        created_at: '2026-10-30T10:00:00Z'
      }
    }
  },
  {
    method: 'GET',
    path: '/api/admin/logging',
    category: 'Admin ATS',
    summary: 'Get Detailed Logging Status',
    description: 'Check whether verbose dynamic terminal logging is currently active (includes full payloads, query sorting, returned counts, and update diffs).',
    responseBody: {
      success: true,
      detailed_logging_enabled: true,
      config_setting_enabled: true,
      status: 'enabled'
    }
  },
  {
    method: 'POST',
    path: '/api/admin/logging/toggle',
    category: 'Admin ATS',
    summary: 'Toggle Detailed Logging Dynamically',
    description: 'Dynamically switch terminal logging on or off at runtime without restarting the server.',
    requestBody: {
      enabled: true
    },
    responseBody: {
      success: true,
      detailed_logging_enabled: true,
      message: 'Detailed terminal logging enabled'
    }
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'endpoints' | 'quickstart' | 'database' | 'admin'>('endpoints');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeEndpoint, setActiveEndpoint] = useState<Endpoint>(ENDPOINTS[2]); // GET /api/jobs
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  // Sync tab with URL hash for direct links (e.g., #admin)
  React.useEffect(() => {
    const parseHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'admin' || hash === 'endpoints' || hash === 'quickstart' || hash === 'database') {
        setActiveTab(hash as any);
      }
    };
    parseHash();
    window.addEventListener('hashchange', parseHash);
    return () => window.removeEventListener('hashchange', parseHash);
  }, []);

  const switchTab = (tab: 'endpoints' | 'quickstart' | 'database' | 'admin') => {
    setActiveTab(tab);
    window.location.hash = tab;
  };

  const categories = ['all', 'Jobs', 'Applications', 'Inquiries', 'Admin ATS', 'Health'];

  const filteredEndpoints = ENDPOINTS.filter(ep => {
    if (selectedCategory !== 'all' && ep.category !== selectedCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return ep.path.toLowerCase().includes(q) || ep.summary.toLowerCase().includes(q) || ep.method.toLowerCase().includes(q);
    }
    return true;
  });

  const getCurlSnippet = (ep: Endpoint) => {
    let curl = `curl -X ${ep.method} "http://localhost:8000${ep.path}" \\\n  -H "Accept: application/json"`;
    if (ep.requestBody) {
      curl += ` \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(ep.requestBody, null, 2)}'`;
    }
    return curl;
  };

  const getFetchSnippet = (ep: Endpoint) => {
    const options: any = { method: ep.method, headers: { 'Content-Type': 'application/json' } };
    if (ep.requestBody) options.body = ep.requestBody;
    return `// Call from your frontend application\nconst response = await fetch("http://localhost:8000${ep.path}", {\n  method: "${ep.method}",\n  headers: { "Content-Type": "application/json" },\n${ep.requestBody ? `  body: JSON.stringify(${JSON.stringify(ep.requestBody, null, 4)})\n` : ''}});\nconst result = await response.json();\nconsole.log(result);`;
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center font-black text-slate-950 shadow-lg shadow-amber-500/20">
              <Server className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-2xl text-white tracking-tight">
                  UGET<span className="text-amber-400">JOB</span>
                </span>
                <span className="text-[11px] font-mono bg-blue-500/15 text-cyan-400 px-2 py-0.5 rounded-full border border-blue-500/30">
                  FastAPI Backend v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Nouman's Manpower Consultancy • REST API & Supabase Integration Hub
              </p>
            </div>
          </div>

          {/* Navigation Bar */}
          <nav className="flex items-center space-x-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 text-xs font-semibold">
            <button
              onClick={() => switchTab('endpoints')}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg transition ${
                activeTab === 'endpoints' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span>API Endpoints</span>
            </button>
            <button
              onClick={() => switchTab('quickstart')}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg transition ${
                activeTab === 'quickstart' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>Quickstart & Setup</span>
            </button>
            <button
              onClick={() => switchTab('database')}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg transition ${
                activeTab === 'database' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>SQL & Storage</span>
            </button>
            <button
              onClick={() => switchTab('admin')}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg transition ${
                activeTab === 'admin' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Applications & ATS</span>
            </button>
          </nav>

          <div className="hidden lg:flex items-center space-x-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-medium">Backend Ready</span>
            <span className="text-slate-500 font-mono">(:8000)</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        {/* Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Backend Ready — Connect Any Frontend via CORS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              FastAPI + SQLAlchemy + Supabase Backend Specification
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              All backend endpoints, asynchronous SQLAlchemy models, Pydantic schemas, and Supabase PostgreSQL & Storage migrations are implemented in <code className="text-cyan-400 font-mono bg-slate-800 px-1.5 py-0.5 rounded">backend/</code> and <code className="text-cyan-400 font-mono bg-slate-800 px-1.5 py-0.5 rounded">database/schema.sql</code>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 text-center font-mono text-xs">
              <span className="text-slate-400 block text-[10px]">CORS Allowed Origins</span>
              <span className="text-amber-400 font-bold">localhost:3000, 5173, *</span>
            </div>
            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 text-center font-mono text-xs">
              <span className="text-slate-400 block text-[10px]">Docs UI</span>
              <span className="text-cyan-400 font-bold">http://localhost:8000/docs</span>
            </div>
          </div>
        </div>

        {/* Tab 1: API Endpoints Directory & Interactive Playground */}
        {activeTab === 'endpoints' && (
          <div className="space-y-6">
            {/* Filter toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800">
              <div className="flex flex-wrap gap-1.5 text-xs font-semibold">
                {categories.map(c => (
                  <button
                    key={c}
                    onClick={() => setSelectedCategory(c)}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      selectedCategory === c ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {c === 'all' ? 'All Routes (12)' : c}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter routes (e.g. /jobs)..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Split View: Route List & Detailed Contract */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Route Cards */}
              <div className="lg:col-span-5 space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
                {filteredEndpoints.map((ep, idx) => {
                  const isSelected = activeEndpoint.path === ep.path && activeEndpoint.method === ep.method;
                  return (
                    <div
                      key={idx}
                      onClick={() => setActiveEndpoint(ep)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-slate-850 border-amber-500 shadow-md ring-1 ring-amber-500/30'
                          : 'bg-slate-900 hover:bg-slate-850 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center space-x-2 font-mono text-xs">
                          <span className={`px-2 py-0.5 rounded font-black text-[10px] ${
                            ep.method === 'GET' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                            ep.method === 'POST' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                            ep.method === 'PATCH' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                            'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}>
                            {ep.method}
                          </span>
                          <span className="font-semibold text-white truncate max-w-[200px]">{ep.path}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                          {ep.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-2 line-clamp-1 font-medium">{ep.summary}</p>
                    </div>
                  );
                })}
              </div>

              {/* Right Column: Detailed Endpoint Contract & Code Snippets */}
              <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center space-x-2 font-mono">
                      <span className={`px-2.5 py-1 rounded text-xs font-black ${
                        activeEndpoint.method === 'GET' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                        activeEndpoint.method === 'POST' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        activeEndpoint.method === 'PATCH' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}>
                        {activeEndpoint.method}
                      </span>
                      <span className="text-base font-bold text-white">{activeEndpoint.path}</span>
                    </div>

                    <button
                      onClick={() => handleCopy(getCurlSnippet(activeEndpoint))}
                      className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition"
                    >
                      {copiedSnippet ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy cURL</span>
                        </>
                      )}
                    </button>
                  </div>

                  <h3 className="text-sm font-bold text-white mt-3">{activeEndpoint.summary}</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{activeEndpoint.description}</p>
                </div>

                {/* Query Parameters (if any) */}
                {activeEndpoint.queryParams && (
                  <div>
                    <span className="text-xs font-bold text-slate-300 block mb-1.5">Supported Query Parameters:</span>
                    <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
                      {activeEndpoint.queryParams.map(qp => (
                        <span key={qp} className="bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-cyan-300">
                          {qp}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Request Payload */}
                {activeEndpoint.requestBody && (
                  <div>
                    <span className="text-xs font-bold text-slate-300 block mb-1.5">Request Body (JSON):</span>
                    <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-cyan-300 overflow-x-auto max-h-48">
                      <code>{JSON.stringify(activeEndpoint.requestBody, null, 2)}</code>
                    </pre>
                  </div>
                )}

                {/* Expected Response Envelope */}
                <div>
                  <span className="text-xs font-bold text-slate-300 block mb-1.5">Standard Response Envelope (HTTP 200 OK):</span>
                  <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-emerald-300 overflow-x-auto max-h-48">
                    <code>{JSON.stringify(activeEndpoint.responseBody, null, 2)}</code>
                  </pre>
                </div>

                {/* Frontend Fetch Snippet */}
                <div className="pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-300">JavaScript / React Fetch Integration:</span>
                    <button
                      onClick={() => handleCopy(getFetchSnippet(activeEndpoint))}
                      className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
                    >
                      Copy JS Code
                    </button>
                  </div>
                  <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[11px] font-mono text-slate-300 overflow-x-auto">
                    <code>{getFetchSnippet(activeEndpoint)}</code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Quickstart & Deployment Instructions */}
        {activeTab === 'quickstart' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
              <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <Terminal className="w-4 h-4" />
                <span>Option 1: Run Locally (Python 3.10+)</span>
              </div>
              <h3 className="text-lg font-bold text-white">Local Virtual Environment</h3>

              <div className="space-y-2 text-xs font-mono bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-300 overflow-x-auto">
                <p className="text-slate-500"># 1. Navigate to backend directory</p>
                <p className="text-cyan-300">cd backend</p>
                <p className="text-slate-500 mt-2"># 2. Create and activate virtual environment</p>
                <p className="text-cyan-300">python -m venv venv</p>
                <p className="text-cyan-300">source venv/bin/activate  # On Windows: venv\Scripts\activate</p>
                <p className="text-slate-500 mt-2"># 3. Install dependencies</p>
                <p className="text-cyan-300">pip install -r requirements.txt</p>
                <p className="text-slate-500 mt-2"># 4. Copy .env and configure Supabase connection</p>
                <p className="text-cyan-300">cp .env.example .env</p>
                <p className="text-slate-500 mt-2"># 5. Start FastAPI with Hot-Reload</p>
                <p className="text-emerald-400 font-bold">uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload</p>
              </div>

              <p className="text-xs text-slate-400">
                Swagger documentation will automatically be served at <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer" className="text-amber-400 underline">http://localhost:8000/docs</a>.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
              <div className="flex items-center space-x-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
                <Cpu className="w-4 h-4" />
                <span>Option 2: Docker & Docker Compose</span>
              </div>
              <h3 className="text-lg font-bold text-white">Containerized Deployment</h3>

              <div className="space-y-2 text-xs font-mono bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-300 overflow-x-auto">
                <p className="text-slate-500"># 1. Build & start FastAPI and local Postgres</p>
                <p className="text-cyan-300">cd backend</p>
                <p className="text-emerald-400 font-bold">docker compose up --build -d</p>
                <p className="text-slate-500 mt-2"># 2. Check running container logs</p>
                <p className="text-cyan-300">docker compose logs -f api</p>
                <p className="text-slate-500 mt-2"># 3. Stop containers</p>
                <p className="text-cyan-300">docker compose down</p>
              </div>

              <div className="p-3.5 bg-slate-850 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
                <span className="font-bold text-white block">Connecting Your Existing Frontend:</span>
                <p className="text-slate-400 text-[11px]">
                  Configure your frontend environment variable <code className="text-amber-300">VITE_API_URL=http://localhost:8000/api</code> (or <code className="text-amber-300">NEXT_PUBLIC_API_URL</code>) to start making live requests to all endpoints.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Database & Storage Schema */}
        {activeTab === 'database' && (
          <DatabaseSchemaView onCopy={handleCopy} copiedSnippet={copiedSnippet} />
        )}

        {/* Tab 4: Candidate Applications & ATS */}
        {activeTab === 'admin' && (
          <AdminDashboardView onCopy={handleCopy} copiedSnippet={copiedSnippet} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} UGETJOB — Nouman's Manpower Consultancy. FastAPI + SQLAlchemy + Supabase Backend API.
      </footer>
    </div>
  );
}
