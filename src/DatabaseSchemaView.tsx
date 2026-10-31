import React, { useState } from 'react';
import { 
  Database, 
  HardDrive, 
  Key, 
  Link2, 
  ShieldCheck, 
  Search, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Layers, 
  FileCode, 
  CheckCircle2,
  FolderLock,
  FolderCheck,
  Tag
} from 'lucide-react';

interface ColumnDef {
  name: string;
  type: string;
  nullable: boolean;
  isPk?: boolean;
  isFk?: boolean;
  fkTarget?: string;
  defaultVal?: string;
  isIndexed?: boolean;
  description?: string;
}

interface TableDef {
  name: string;
  category: 'Core Recruitment' | 'Candidate & ATS' | 'Corporate Inquiries' | 'Internal & Auth';
  description: string;
  pk: string;
  foreignKeys: { column: string; references: string; onDelete?: string }[];
  columns: ColumnDef[];
}

const ALL_TABLES: TableDef[] = [
  {
    name: 'job_categories',
    category: 'Core Recruitment',
    description: 'Controlled industries, trade sectors, and job groupings for search and filtering',
    pk: 'id',
    foreignKeys: [
      { column: 'parent_category_id', references: 'job_categories.id', onDelete: 'SET NULL' }
    ],
    columns: [
      { name: 'id', type: 'UUID', nullable: false, isPk: true, defaultVal: 'gen_random_uuid()' },
      { name: 'slug', type: 'TEXT', nullable: false, isIndexed: true, description: 'Unique slug for URL routing & filtering (e.g. electrical, hvac)' },
      { name: 'name', type: 'TEXT', nullable: false, description: 'Display name (e.g. Electrical & Substation)' },
      { name: 'description', type: 'TEXT', nullable: true },
      { name: 'parent_category_id', type: 'UUID', nullable: true, isFk: true, fkTarget: 'job_categories(id)' },
      { name: 'is_active', type: 'BOOLEAN', nullable: false, defaultVal: 'true' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, defaultVal: 'NOW()' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', nullable: false, defaultVal: 'NOW()' },
    ]
  },
  {
    name: 'jobs',
    category: 'Core Recruitment',
    description: 'Overseas published job vacancies, salary brackets, visa requirements, and recruitment quotas',
    pk: 'id',
    foreignKeys: [
      { column: 'category_id', references: 'job_categories.id', onDelete: 'RESTRICT' }
    ],
    columns: [
      { name: 'id', type: 'UUID', nullable: false, isPk: true, defaultVal: 'gen_random_uuid()' },
      { name: 'category_id', type: 'UUID', nullable: false, isFk: true, fkTarget: 'job_categories(id)', isIndexed: true },
      { name: 'title', type: 'TEXT', nullable: false, isIndexed: true, description: 'Job position title' },
      { name: 'company_name', type: 'TEXT', nullable: false, description: 'Hiring company or project consortium' },
      { name: 'employer_contact_name', type: 'TEXT', nullable: true },
      { name: 'employer_email', type: 'TEXT', nullable: true },
      { name: 'employer_phone', type: 'TEXT', nullable: true },
      { name: 'location_country', type: 'TEXT', nullable: false, isIndexed: true, description: 'Destination (Saudi Arabia, UAE, Qatar, etc.)' },
      { name: 'location_city', type: 'TEXT', nullable: true },
      { name: 'work_location_type', type: 'TEXT', nullable: false, defaultVal: "'overseas'" },
      { name: 'visa_required', type: 'BOOLEAN', nullable: false, defaultVal: 'false', description: 'True if visa sponsorship provided' },
      { name: 'visa_type', type: 'TEXT', nullable: true, description: 'e.g. Employment Visa, Work Permit' },
      { name: 'employment_type', type: 'TEXT', nullable: false, defaultVal: "'full_time'" },
      { name: 'experience_min', type: 'INTEGER', nullable: false, defaultVal: '0' },
      { name: 'experience_max', type: 'INTEGER', nullable: true },
      { name: 'age_min', type: 'INTEGER', nullable: true },
      { name: 'age_max', type: 'INTEGER', nullable: true },
      { name: 'gender_preference', type: 'TEXT', nullable: true },
      { name: 'nationality_preference', type: 'TEXT', nullable: true },
      { name: 'salary_min', type: 'NUMERIC(12,2)', nullable: true },
      { name: 'salary_max', type: 'NUMERIC(12,2)', nullable: true },
      { name: 'salary_currency', type: 'TEXT', nullable: true, defaultVal: "'INR'" },
      { name: 'job_description', type: 'TEXT', nullable: false },
      { name: 'requirements', type: 'TEXT', nullable: true },
      { name: 'benefits', type: 'TEXT', nullable: true, description: 'Free accommodation, food, tickets' },
      { name: 'urgent', type: 'BOOLEAN', nullable: false, defaultVal: 'false', isIndexed: true },
      { name: 'featured', type: 'BOOLEAN', nullable: false, defaultVal: 'false', isIndexed: true },
      { name: 'skills', type: 'TEXT[] / JSON', nullable: true, defaultVal: "'{}'" },
      { name: 'openings_count', type: 'INTEGER', nullable: false, defaultVal: '1' },
      { name: 'deadline', type: 'TIMESTAMPTZ', nullable: true },
      { name: 'posted_at', type: 'TIMESTAMPTZ', nullable: false, defaultVal: 'NOW()' },
      { name: 'expires_at', type: 'TIMESTAMPTZ', nullable: true },
      { name: 'status', type: 'job_status (ENUM)', nullable: false, defaultVal: "'published'", isIndexed: true },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, defaultVal: 'NOW()' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', nullable: false, defaultVal: 'NOW()' },
    ]
  },
  {
    name: 'candidates',
    category: 'Candidate & ATS',
    description: 'Normalized candidate profiles, passport readiness, GCC experience, and resume links',
    pk: 'id',
    foreignKeys: [],
    columns: [
      { name: 'id', type: 'UUID', nullable: false, isPk: true, defaultVal: 'gen_random_uuid()' },
      { name: 'full_name', type: 'TEXT', nullable: false, isIndexed: true },
      { name: 'email', type: 'TEXT', nullable: true, isIndexed: true },
      { name: 'phone', type: 'TEXT', nullable: false, isIndexed: true },
      { name: 'whatsapp', type: 'TEXT', nullable: true },
      { name: 'nationality', type: 'TEXT', nullable: true },
      { name: 'current_country', type: 'TEXT', nullable: true },
      { name: 'current_city', type: 'TEXT', nullable: true },
      { name: 'passport_status', type: 'TEXT', nullable: true, defaultVal: "'ready'", description: 'ready, in_process, expired, not_applied' },
      { name: 'passport_number', type: 'TEXT', nullable: true },
      { name: 'passport_expiry', type: 'DATE', nullable: true },
      { name: 'years_experience', type: 'INTEGER', nullable: true, defaultVal: '0' },
      { name: 'current_job_title', type: 'TEXT', nullable: true, description: 'Candidate target / current designation (backward-compatible with current_role)' },
      { name: 'current_salary', type: 'NUMERIC(12,2)', nullable: true },
      { name: 'preferred_country', type: 'TEXT', nullable: true },
      { name: 'preferred_city', type: 'TEXT', nullable: true },
      { name: 'preferred_job_category', type: 'TEXT', nullable: true },
      { name: 'visa_status', type: 'TEXT', nullable: true, defaultVal: "'required'" },
      { name: 'notice_period', type: 'TEXT', nullable: true },
      { name: 'willing_to_relocate', type: 'BOOLEAN', nullable: true, defaultVal: 'true' },
      { name: 'has_resume', type: 'BOOLEAN', nullable: false, defaultVal: 'false' },
      { name: 'resume_url', type: 'TEXT', nullable: true, description: 'Direct Supabase Storage signed URL or external Drive link' },
      { name: 'resume_source', type: 'resume_source (ENUM)', nullable: false, defaultVal: "'drive_link'", description: 'drive_link, uploaded_file, manual_text' },
      { name: 'resume_file_name', type: 'TEXT', nullable: true, description: 'Original uploaded filename' },
      { name: 'resume_storage_bucket', type: 'TEXT', nullable: true, description: 'Storage bucket (candidate-resumes or external)' },
      { name: 'resume_storage_path', type: 'TEXT', nullable: true, description: 'Object storage path' },
      { name: 'resume_mime_type', type: 'TEXT', nullable: true, description: 'application/pdf, docx, etc.' },
      { name: 'resume_file_size_bytes', type: 'BIGINT', nullable: true, description: 'File size in bytes' },
      { name: 'resume_uploaded_at', type: 'TIMESTAMPTZ', nullable: true },
      { name: 'cover_letter', type: 'TEXT', nullable: true },
      { name: 'source', type: 'TEXT', nullable: true, defaultVal: "'website'" },
      { name: 'consent_to_contact', type: 'BOOLEAN', nullable: false, defaultVal: 'false' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, defaultVal: 'NOW()' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', nullable: false, defaultVal: 'NOW()' },
    ]
  },
  {
    name: 'candidate_resumes',
    category: 'Candidate & ATS',
    description: 'Multi-resume repository supporting both external Google Drive links and uploaded PDF/Word/TXT files with primary CV selection',
    pk: 'id',
    foreignKeys: [
      { column: 'candidate_id', references: 'candidates.id', onDelete: 'CASCADE' }
    ],
    columns: [
      { name: 'id', type: 'UUID', nullable: false, isPk: true, defaultVal: 'gen_random_uuid()' },
      { name: 'candidate_id', type: 'UUID', nullable: false, isFk: true, fkTarget: 'candidates(id)', isIndexed: true },
      { name: 'original_filename', type: 'TEXT', nullable: false, description: 'Original uploaded file name or Drive CV title' },
      { name: 'storage_bucket', type: 'TEXT', nullable: false, description: 'candidate-resumes or external' },
      { name: 'storage_path', type: 'TEXT', nullable: false, description: 'Supabase object key or link reference' },
      { name: 'mime_type', type: 'TEXT', nullable: false, description: 'application/pdf, text/uri-list, docx, etc.' },
      { name: 'file_size_bytes', type: 'BIGINT', nullable: false, defaultVal: '0' },
      { name: 'source', type: 'resume_source (ENUM)', nullable: false, defaultVal: "'uploaded_file'" },
      { name: 'drive_link', type: 'TEXT', nullable: true, description: 'Direct external link (Google Drive, OneDrive)' },
      { name: 'is_primary', type: 'BOOLEAN', nullable: false, defaultVal: 'true', isIndexed: true, description: 'Designated primary CV for quick screening' },
      { name: 'uploaded_at', type: 'TIMESTAMPTZ', nullable: false, defaultVal: 'NOW()' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, defaultVal: 'NOW()' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', nullable: false, defaultVal: 'NOW()' },
    ]
  },
  {
    name: 'applications',
    category: 'Candidate & ATS',
    description: 'Recruitment applications and ATS workflow stages (Screening, Interview, GAMCA, Visa Stamping, Hired)',
    pk: 'id',
    foreignKeys: [
      { column: 'candidate_id', references: 'candidates.id', onDelete: 'CASCADE' },
      { column: 'job_id', references: 'jobs.id', onDelete: 'SET NULL' }
    ],
    columns: [
      { name: 'id', type: 'UUID', nullable: false, isPk: true, defaultVal: 'gen_random_uuid()' },
      { name: 'candidate_id', type: 'UUID', nullable: false, isFk: true, fkTarget: 'candidates(id)', isIndexed: true },
      { name: 'job_id', type: 'UUID', nullable: true, isFk: true, fkTarget: 'jobs(id)', isIndexed: true },
      { name: 'source_channel', type: 'TEXT', nullable: true, defaultVal: "'job_portal'" },
      { name: 'application_status', type: 'application_status (ENUM)', nullable: false, defaultVal: "'new'", isIndexed: true },
      { name: 'recruiter_assigned', type: 'TEXT', nullable: true, description: 'Assigned recruiter (e.g. Nouman Qureshi)' },
      { name: 'shortlisted_by', type: 'TEXT', nullable: true },
      { name: 'interview_date', type: 'TIMESTAMPTZ', nullable: true },
      { name: 'interview_notes', type: 'TEXT', nullable: true },
      { name: 'document_status', type: 'TEXT', nullable: true, defaultVal: "'pending'" },
      { name: 'medical_status', type: 'TEXT', nullable: true, defaultVal: "'pending'" },
      { name: 'visa_status', type: 'TEXT', nullable: true, defaultVal: "'not_started'" },
      { name: 'notes', type: 'TEXT', nullable: true },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, defaultVal: 'NOW()' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', nullable: false, defaultVal: 'NOW()' },
    ]
  },
  {
    name: 'employers',
    category: 'Corporate Inquiries',
    description: 'Corporate client companies, EPC contractors, and international manpower sponsors',
    pk: 'id',
    foreignKeys: [],
    columns: [
      { name: 'id', type: 'UUID', nullable: false, isPk: true, defaultVal: 'gen_random_uuid()' },
      { name: 'company_name', type: 'TEXT', nullable: false, isIndexed: true },
      { name: 'contact_name', type: 'TEXT', nullable: false },
      { name: 'email', type: 'TEXT', nullable: false, isIndexed: true },
      { name: 'phone', type: 'TEXT', nullable: false },
      { name: 'company_type', type: 'TEXT', nullable: true },
      { name: 'industry', type: 'TEXT', nullable: true },
      { name: 'country', type: 'TEXT', nullable: true },
      { name: 'city', type: 'TEXT', nullable: true },
      { name: 'website', type: 'TEXT', nullable: true },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, defaultVal: 'NOW()' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', nullable: false, defaultVal: 'NOW()' },
    ]
  },
  {
    name: 'employer_inquiries',
    category: 'Corporate Inquiries',
    description: 'Inbound bulk workforce requirements, job titles, positions, timeline, and site budget',
    pk: 'id',
    foreignKeys: [
      { column: 'employer_id', references: 'employers.id', onDelete: 'SET NULL' }
    ],
    columns: [
      { name: 'id', type: 'UUID', nullable: false, isPk: true, defaultVal: 'gen_random_uuid()' },
      { name: 'employer_id', type: 'UUID', nullable: true, isFk: true, fkTarget: 'employers(id)' },
      { name: 'company_name', type: 'TEXT', nullable: false },
      { name: 'contact_name', type: 'TEXT', nullable: false },
      { name: 'email', type: 'TEXT', nullable: false },
      { name: 'phone', type: 'TEXT', nullable: false },
      { name: 'requirement_type', type: 'TEXT', nullable: false, description: 'manpower, project_hire, specialist, custom' },
      { name: 'industry', type: 'TEXT', nullable: true },
      { name: 'job_title', type: 'TEXT', nullable: true },
      { name: 'number_of_positions', type: 'INTEGER', nullable: true, defaultVal: '1' },
      { name: 'country', type: 'TEXT', nullable: true },
      { name: 'city', type: 'TEXT', nullable: true },
      { name: 'work_location', type: 'TEXT', nullable: true, defaultVal: "'overseas'" },
      { name: 'budget_range', type: 'TEXT', nullable: true },
      { name: 'urgency', type: 'TEXT', nullable: true, defaultVal: "'normal'" },
      { name: 'timeline', type: 'TEXT', nullable: true },
      { name: 'notes', type: 'TEXT', nullable: true },
      { name: 'source', type: 'TEXT', nullable: true, defaultVal: "'website'" },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, defaultVal: 'NOW()' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', nullable: false, defaultVal: 'NOW()' },
    ]
  },
  {
    name: 'service_requests',
    category: 'Corporate Inquiries',
    description: 'Specialized manpower requests (Visa stamping, GAMCA medical clearance, Trade testing, Flight mobilization)',
    pk: 'id',
    foreignKeys: [],
    columns: [
      { name: 'id', type: 'UUID', nullable: false, isPk: true, defaultVal: 'gen_random_uuid()' },
      { name: 'service_type', type: 'TEXT', nullable: false, description: 'recruitment, documentation, visa, mobilization' },
      { name: 'company_name', type: 'TEXT', nullable: true },
      { name: 'contact_name', type: 'TEXT', nullable: false },
      { name: 'email', type: 'TEXT', nullable: false },
      { name: 'phone', type: 'TEXT', nullable: false },
      { name: 'city', type: 'TEXT', nullable: true },
      { name: 'notes', type: 'TEXT', nullable: true },
      { name: 'source', type: 'TEXT', nullable: true, defaultVal: "'website'" },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, defaultVal: 'NOW()' },
    ]
  },
  {
    name: 'application_documents',
    category: 'Candidate & ATS',
    description: 'Supporting documents uploaded for applications (resumes, passport copies, trade certificates, photos)',
    pk: 'id',
    foreignKeys: [
      { column: 'application_id', references: 'applications.id', onDelete: 'CASCADE' },
      { column: 'candidate_id', references: 'candidates.id', onDelete: 'CASCADE' }
    ],
    columns: [
      { name: 'id', type: 'UUID', nullable: false, isPk: true, defaultVal: 'gen_random_uuid()' },
      { name: 'application_id', type: 'UUID', nullable: true, isFk: true, fkTarget: 'applications(id)', isIndexed: true },
      { name: 'candidate_id', type: 'UUID', nullable: true, isFk: true, fkTarget: 'candidates(id)', isIndexed: true },
      { name: 'document_type', type: 'TEXT', nullable: false, description: 'resume, passport, certificate, photo, other' },
      { name: 'original_filename', type: 'TEXT', nullable: false },
      { name: 'storage_bucket', type: 'TEXT', nullable: false, description: 'candidate-resumes, company-documents, job-attachments' },
      { name: 'storage_path', type: 'TEXT', nullable: false },
      { name: 'mime_type', type: 'TEXT', nullable: true, description: 'PDF, DOC, DOCX, ODT, RTF, JPEG, PNG' },
      { name: 'file_size_bytes', type: 'BIGINT', nullable: true },
      { name: 'uploaded_at', type: 'TIMESTAMPTZ', nullable: false, defaultVal: 'NOW()' },
    ]
  },
  {
    name: 'ats_notes',
    category: 'Candidate & ATS',
    description: 'Internal recruiter remarks, screening evaluation notes, and client feedback per application',
    pk: 'id',
    foreignKeys: [
      { column: 'application_id', references: 'applications.id', onDelete: 'CASCADE' }
    ],
    columns: [
      { name: 'id', type: 'UUID', nullable: false, isPk: true, defaultVal: 'gen_random_uuid()' },
      { name: 'application_id', type: 'UUID', nullable: false, isFk: true, fkTarget: 'applications(id)', isIndexed: true },
      { name: 'author_name', type: 'TEXT', nullable: false, description: 'Recruiter name (e.g. Nouman Qureshi)' },
      { name: 'note', type: 'TEXT', nullable: false },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, defaultVal: 'NOW()' },
    ]
  },
  {
    name: 'job_search_activity',
    category: 'Internal & Auth',
    description: 'Candidate search audit logs, keywords, country filters, and query result metrics',
    pk: 'id',
    foreignKeys: [],
    columns: [
      { name: 'id', type: 'UUID', nullable: false, isPk: true, defaultVal: 'gen_random_uuid()' },
      { name: 'search_term', type: 'TEXT', nullable: true },
      { name: 'category', type: 'TEXT', nullable: true },
      { name: 'country', type: 'TEXT', nullable: true },
      { name: 'city', type: 'TEXT', nullable: true },
      { name: 'visa_status', type: 'TEXT', nullable: true },
      { name: 'experience_min', type: 'INTEGER', nullable: true },
      { name: 'experience_max', type: 'INTEGER', nullable: true },
      { name: 'result_count', type: 'INTEGER', nullable: true },
      { name: 'user_ip', type: 'TEXT', nullable: true },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, defaultVal: 'NOW()' },
    ]
  },
  {
    name: 'admin_users',
    category: 'Internal & Auth',
    description: 'Internal recruiters and administrators with role-based access control (admin, recruiter, manager)',
    pk: 'id',
    foreignKeys: [],
    columns: [
      { name: 'id', type: 'UUID', nullable: false, isPk: true, defaultVal: 'gen_random_uuid()' },
      { name: 'email', type: 'TEXT', nullable: false, isIndexed: true },
      { name: 'full_name', type: 'TEXT', nullable: false },
      { name: 'password_hash', type: 'TEXT', nullable: false },
      { name: 'role', type: 'TEXT', nullable: false, defaultVal: "'admin'" },
      { name: 'is_active', type: 'BOOLEAN', nullable: false, defaultVal: 'true' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, defaultVal: 'NOW()' },
    ]
  }
];

const STORAGE_BUCKETS = [
  {
    id: 'candidate-resumes',
    name: 'candidate-resumes',
    access: 'Private (Signed URLs)',
    sizeLimit: '10 MB',
    allowedMimeTypes: [
      'application/pdf (.pdf)',
      'application/msword (.doc)',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document (.docx)',
      'application/vnd.oasis.opendocument.text (.odt)',
      'application/rtf (.rtf)',
      'image/jpeg, image/png (.jpg, .jpeg, .png)'
    ],
    purpose: 'Candidate quick-apply resumes in PDF, Word, ODT, RTF, or scan images. Public can upload (INSERT), authenticated recruiters access via signed download URLs.',
    rlsPolicy: 'Allow public resume upload (INSERT) & Allow recruiters to read candidate resumes (SELECT)'
  },
  {
    id: 'company-documents',
    name: 'company-documents',
    access: 'Private (Signed URLs)',
    sizeLimit: '10 MB',
    allowedMimeTypes: [
      'application/pdf (.pdf)',
      'application/msword (.doc)',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document (.docx)',
      'image/jpeg, image/png'
    ],
    purpose: 'Employer demand letters, Power of Attorney, agency agreements, and commercial registration papers.',
    rlsPolicy: 'Restricted to authenticated administrative & corporate recruiter roles'
  },
  {
    id: 'job-attachments',
    name: 'job-attachments',
    access: 'Public (Direct CDN)',
    sizeLimit: '10 MB',
    allowedMimeTypes: [
      'application/pdf (.pdf)',
      'image/jpeg, image/png'
    ],
    purpose: 'Publicly downloadable job circular posters, project site blueprints, trade test standards, and brochures.',
    rlsPolicy: 'Public read (SELECT) for all visitors; authenticated recruiters can upload/delete'
  }
];

const ENUMS_INFO = [
  {
    name: 'job_status',
    values: ['draft', 'published', 'paused', 'closed', 'filled'],
    description: 'Lifecycle state of overseas job postings'
  },
  {
    name: 'application_status',
    values: [
      'new',
      'contacted',
      'shortlisted',
      'interview_scheduled',
      'interviewed',
      'document_pending',
      'medical_pending',
      'visa_pending',
      'visa_approved',
      'rejected',
      'hired',
      'archived'
    ],
    description: 'Recruitment pipeline workflow status for candidates'
  },
  {
    name: 'resume_source',
    values: ['drive_link', 'uploaded_file', 'manual_text'],
    description: 'Format source of candidate CV: external Google Drive link, direct Supabase Storage uploaded file, or manual ATS text input'
  }
];

const INDEXES_INFO = [
  { name: 'idx_jobs_status_country', target: 'jobs(status, location_country)', purpose: 'Accelerates country + status job searches' },
  { name: 'idx_jobs_category', target: 'jobs(category_id)', purpose: 'Foreign key lookup to categories' },
  { name: 'idx_jobs_urgent_featured', target: 'jobs(urgent, featured)', purpose: 'Fast filtering of highlighted vacancies' },
  { name: 'idx_applications_candidate', target: 'applications(candidate_id)', purpose: 'Candidate application history lookups' },
  { name: 'idx_applications_job', target: 'applications(job_id)', purpose: 'List all candidates who applied for a specific job' },
  { name: 'idx_applications_status', target: 'applications(application_status)', purpose: 'ATS Kanban pipeline grouping queries' },
  { name: 'idx_candidates_phone', target: 'candidates(phone)', purpose: 'Fast deduplication on candidate quick-apply' },
  { name: 'idx_candidates_email', target: 'candidates(email)', purpose: 'Candidate authentication and communication search' },
  { name: 'idx_documents_app', target: 'application_documents(application_id)', purpose: 'Load supporting docs per application' },
  { name: 'idx_candidate_resumes_candidate', target: 'candidate_resumes(candidate_id)', purpose: 'Fast lookup of candidate resumes' },
  { name: 'idx_candidate_resumes_primary', target: 'candidate_resumes(candidate_id, is_primary)', purpose: 'Quickly resolve candidate primary active CV' },
];

interface DatabaseSchemaViewProps {
  onCopy: (text: string) => void;
  copiedSnippet: boolean;
}

export const DatabaseSchemaView: React.FC<DatabaseSchemaViewProps> = ({ onCopy, copiedSnippet }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [tableSearch, setTableSearch] = useState('');
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({
    'jobs': true,
    'candidates': true,
    'candidate_resumes': true,
    'applications': true
  });

  const categories = ['all', 'Core Recruitment', 'Candidate & ATS', 'Corporate Inquiries', 'Internal & Auth'];

  const filteredTables = ALL_TABLES.filter(t => {
    if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;
    if (tableSearch) {
      const q = tableSearch.toLowerCase();
      const matchesName = t.name.toLowerCase().includes(q);
      const matchesDesc = t.description.toLowerCase().includes(q);
      const matchesCol = t.columns.some(c => c.name.toLowerCase().includes(q));
      return matchesName || matchesDesc || matchesCol;
    }
    return true;
  });

  const toggleTable = (name: string) => {
    setExpandedTables(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const expandAll = () => {
    const allExp: Record<string, boolean> = {};
    ALL_TABLES.forEach(t => { allExp[t.name] = true; });
    setExpandedTables(allExp);
  };

  const collapseAll = () => {
    setExpandedTables({});
  };

  return (
    <div className="space-y-8">
      {/* Top Architecture Overview Card */}
      <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold mb-2">
              <Database className="w-3.5 h-3.5" />
              <span>Full Supabase & PostgreSQL Architecture</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Complete Database Schema & Storage Configuration
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Cross-checked against <code className="text-cyan-400 font-mono">database/schema.sql</code> and all backend SQLAlchemy models in <code className="text-cyan-400 font-mono">backend/app/models/</code>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onCopy('-- See database/schema.sql in repository root for full migration script')}
              className="flex items-center space-x-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition"
            >
              <FileCode className="w-4 h-4 text-amber-400" />
              <span>database/schema.sql</span>
            </button>
          </div>
        </div>

        {/* Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6">
          <div className="p-3.5 rounded-xl bg-slate-850 border border-slate-800 text-center">
            <span className="text-2xl font-black text-amber-400 font-mono">12</span>
            <span className="text-[11px] font-bold text-slate-300 block mt-0.5">Database Tables</span>
            <span className="text-[10px] text-slate-500 block">All 12 Tables Active</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-850 border border-slate-800 text-center">
            <span className="text-2xl font-black text-cyan-400 font-mono">3</span>
            <span className="text-[11px] font-bold text-slate-300 block mt-0.5">Storage Buckets</span>
            <span className="text-[10px] text-slate-500 block">Resumes, Docs, Posters</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-850 border border-slate-800 text-center">
            <span className="text-2xl font-black text-purple-400 font-mono">3</span>
            <span className="text-[11px] font-bold text-slate-300 block mt-0.5">Custom Enums</span>
            <span className="text-[10px] text-slate-500 block">Job, App, & Resume Source</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-850 border border-slate-800 text-center">
            <span className="text-2xl font-black text-emerald-400 font-mono">11</span>
            <span className="text-[11px] font-bold text-slate-300 block mt-0.5">DB Indexes</span>
            <span className="text-[10px] text-slate-500 block">Optimized Queries</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-850 border border-slate-800 text-center col-span-2 sm:col-span-1">
            <span className="text-2xl font-black text-blue-400 font-mono">7</span>
            <span className="text-[11px] font-bold text-slate-300 block mt-0.5">Auto Triggers</span>
            <span className="text-[10px] text-slate-500 block">Auto updated_at Timestamps</span>
          </div>
        </div>
      </div>

      {/* Section 1: All 12 Relational Tables */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <Layers className="w-5 h-5 text-amber-400" />
              <span>All 12 PostgreSQL Tables ({filteredTables.length} shown)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Normalized schema supporting public jobs, candidates, multi-version resumes (PDF/DOCX/Drive), ATS pipeline, and employer inquiries.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <button
              onClick={expandAll}
              className="px-2.5 py-1 text-slate-400 hover:text-white bg-slate-850 hover:bg-slate-800 rounded-lg border border-slate-700 font-medium"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="px-2.5 py-1 text-slate-400 hover:text-white bg-slate-850 hover:bg-slate-800 rounded-lg border border-slate-700 font-medium"
            >
              Collapse All
            </button>
          </div>
        </div>

        {/* Table Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 p-3.5 rounded-xl border border-slate-800">
          <div className="flex flex-wrap gap-1.5 text-xs">
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setSelectedCategory(c)}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  selectedCategory === c ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {c === 'all' ? 'All (12)' : c}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter table or column name..."
              value={tableSearch}
              onChange={e => setTableSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Table Cards List */}
        <div className="space-y-4">
          {filteredTables.map((table) => {
            const isExpanded = !!expandedTables[table.name];
            return (
              <div
                key={table.name}
                className="bg-slate-900 border border-slate-850 rounded-xl overflow-hidden transition shadow-md"
              >
                {/* Table Header Bar */}
                <div
                  onClick={() => toggleTable(table.name)}
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-850/80 transition"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-mono text-amber-400 text-xs font-bold">
                      T
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-sm font-bold text-white">
                          {table.name}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                          {table.category}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {table.columns.length} columns
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {table.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {table.foreignKeys.length > 0 && (
                      <div className="hidden md:flex items-center space-x-1 text-[11px] text-cyan-400 font-mono bg-cyan-950/30 px-2 py-0.5 rounded border border-cyan-900/40">
                        <Link2 className="w-3 h-3" />
                        <span>{table.foreignKeys.length} FK</span>
                      </div>
                    )}
                    <button className="text-slate-400 hover:text-white p-1">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Column Schema Table */}
                {isExpanded && (
                  <div className="border-t border-slate-800/80 bg-slate-950/60 p-4">
                    {/* Foreign key relationships banner */}
                    {table.foreignKeys.length > 0 && (
                      <div className="mb-3 p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 flex flex-wrap gap-y-1 gap-x-4">
                        <span className="text-slate-500 font-semibold flex items-center space-x-1">
                          <Link2 className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Relations:</span>
                        </span>
                        {table.foreignKeys.map((fk, i) => (
                          <span key={i} className="font-mono text-[11px] text-cyan-300">
                            <span className="text-slate-400">{fk.column}</span> → <strong className="text-amber-300">{fk.references}</strong> {fk.onDelete && <span className="text-slate-500 font-sans text-[10px]">({fk.onDelete})</span>}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800">
                          <tr>
                            <th className="py-2 px-3 font-mono">Column</th>
                            <th className="py-2 px-3 font-mono">Type</th>
                            <th className="py-2 px-3">Nullable</th>
                            <th className="py-2 px-3">Default</th>
                            <th className="py-2 px-3">Attributes</th>
                            <th className="py-2 px-3">Description</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850 font-mono text-[11px]">
                          {table.columns.map((col) => (
                            <tr key={col.name} className="hover:bg-slate-900/40">
                              <td className="py-2 px-3 font-bold text-white flex items-center space-x-1.5">
                                {col.isPk && <Key className="w-3 h-3 text-amber-400 shrink-0" />}
                                {col.isFk && <Link2 className="w-3 h-3 text-cyan-400 shrink-0" />}
                                <span>{col.name}</span>
                              </td>
                              <td className="py-2 px-3 text-cyan-300">{col.type}</td>
                              <td className="py-2 px-3 font-sans">
                                {col.nullable ? (
                                  <span className="text-slate-500">NULL</span>
                                ) : (
                                  <span className="text-rose-400 font-semibold">NOT NULL</span>
                                )}
                              </td>
                              <td className="py-2 px-3 text-slate-400">{col.defaultVal || '—'}</td>
                              <td className="py-2 px-3 font-sans space-x-1">
                                {col.isPk && (
                                  <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                                    PK
                                  </span>
                                )}
                                {col.isFk && (
                                  <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-500/30">
                                    FK
                                  </span>
                                )}
                                {col.isIndexed && (
                                  <span className="px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 text-[10px] font-bold border border-blue-500/30">
                                    INDEX
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-3 font-sans text-slate-400 max-w-xs truncate">
                                {col.description || (col.fkTarget ? `Foreign key to ${col.fkTarget}` : '—')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: All 3 Supabase Storage Buckets */}
      <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl shadow-xl space-y-5">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1">
            <HardDrive className="w-4 h-4" />
            <span>Supabase Object Storage</span>
          </div>
          <h3 className="text-xl font-black text-white">
            All 3 Configured Supabase Storage Buckets
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            File upload infrastructure with MIME validation, maximum size limits, and signed access tokens.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {STORAGE_BUCKETS.map((b) => (
            <div key={b.id} className="p-5 rounded-xl bg-slate-850 border border-slate-800 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-amber-400">
                    {b.name}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    b.access.includes('Public') ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                  }`}>
                    {b.access}
                  </span>
                </div>

                <div className="mt-2 text-xs text-slate-300 leading-relaxed font-sans">
                  {b.purpose}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] space-y-1.5 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">File Size Limit:</span>
                    <span className="text-white font-semibold">{b.sizeLimit}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Allowed MIME Types:</span>
                    <ul className="text-slate-400 mt-1 space-y-0.5 text-[10px]">
                      {b.allowedMimeTypes.map((m, i) => (
                        <li key={i}>• {m}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 text-[11px] text-slate-400">
                <span className="text-slate-500 block font-semibold text-[10px]">RLS Policy:</span>
                <span className="text-cyan-300 leading-snug">{b.rlsPolicy}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Resume File Storage Architecture Explanation Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-750 p-6 sm:p-8 rounded-2xl shadow-xl space-y-4">
        <div className="flex items-center space-x-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
          <FileCode className="w-4 h-4" />
          <span>Resume & File Storage Capabilities</span>
        </div>
        <h3 className="text-xl font-black text-white">
          Can the Database Store Actual Resumes (PDF, Word, TXT, RTF, Scans)?
        </h3>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          <strong className="text-emerald-400">Yes, absolutely.</strong> Your updated database schema handles both file uploads and cloud links seamlessly via the <code className="text-amber-300 font-mono">candidate_resumes</code> and <code className="text-amber-300 font-mono">candidates</code> models:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Method A: Supabase Object Storage */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-700/80 space-y-2.5">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="font-bold text-sm text-emerald-400">Method A: Uploaded File Storage (PDF, DOCX, ODT, RTF, Scans)</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Candidates upload binary CV files directly via the multipart API. The binary payload is stored in the <code className="text-amber-300 font-mono">candidate-resumes</code> Supabase bucket, while the database records complete file metadata:
            </p>
            <ul className="text-[11px] text-slate-400 space-y-1 font-mono">
              <li>• <span className="text-cyan-300">original_filename</span>: e.g. <code className="text-slate-200">Basheer_HVAC_CV.pdf</code></li>
              <li>• <span className="text-cyan-300">storage_bucket</span> & <span className="text-cyan-300">storage_path</span>: Location in bucket</li>
              <li>• <span className="text-cyan-300">resume_source</span>: set to <code className="text-emerald-300">'uploaded_file'</code></li>
              <li>• <span className="text-cyan-300">is_primary</span>: <code className="text-amber-300">true</code> for default screening CV</li>
            </ul>
            <div className="p-2 rounded bg-slate-850 text-[10px] text-slate-400 border border-slate-800">
              ⚡ <strong>Advantage:</strong> Fast, non-bloating, highly scalable with CDN download links and automated recruiter authorization.
            </div>
          </div>

          {/* Method B: Cloud Drive Links */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-700/80 space-y-2.5">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span className="font-bold text-sm text-cyan-400">Method B: External Google Drive / OneDrive Links</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Candidates providing Google Drive or OneDrive links are tracked with full backward and forward compatibility:
            </p>
            <ul className="text-[11px] text-slate-400 space-y-1 font-mono">
              <li>• <span className="text-cyan-300">resume_source</span>: set to <code className="text-purple-300">'drive_link'</code></li>
              <li>• <span className="text-cyan-300">drive_link</span> & <span className="text-cyan-300">resume_url</span>: Direct cloud sharing link</li>
              <li>• Multi-version entries stored in <code className="text-amber-300 font-mono">candidate_resumes</code></li>
              <li>• Fast verification without needing file re-uploads</li>
            </ul>
            <div className="p-2 rounded bg-slate-850 text-[10px] text-slate-400 border border-slate-800">
              🔗 <strong>Advantage:</strong> Eliminates file size bottlenecks for large multimedia portfolios or certificates stored on Google Drive.
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: PostgreSQL Custom Enums & Performance Indexes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Enums Card */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <div className="flex items-center space-x-2 text-xs font-bold text-purple-400 uppercase tracking-wider">
            <Tag className="w-4 h-4" />
            <span>PostgreSQL Custom Enums</span>
          </div>
          <h4 className="text-base font-bold text-white">3 Status Types Defined in Schema</h4>

          <div className="space-y-4">
            {ENUMS_INFO.map(en => (
              <div key={en.name} className="p-4 rounded-xl bg-slate-850 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-purple-300">TYPE {en.name}</span>
                  <span className="text-[11px] text-slate-500">{en.values.length} allowed values</span>
                </div>
                <p className="text-xs text-slate-400">{en.description}</p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {en.values.map(val => (
                    <span key={val} className="px-2 py-0.5 rounded bg-slate-900 text-slate-200 font-mono text-[11px] border border-slate-750">
                      '{val}'
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Database Performance Indexes */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Performance Query Indexes</span>
          </div>
          <h4 className="text-base font-bold text-white">11 Composite & Relational Indexes</h4>

          <div className="space-y-2 text-xs font-mono max-h-[380px] overflow-y-auto pr-1">
            {INDEXES_INFO.map(idx => (
              <div key={idx.name} className="p-2.5 rounded-lg bg-slate-850 border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-amber-400 font-bold">{idx.name}</span>
                  <span className="text-cyan-300 text-[10px]">{idx.target}</span>
                </div>
                <span className="text-slate-400 text-[11px] font-sans mt-0.5">{idx.purpose}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
