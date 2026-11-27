export interface ATSNoteEntry {
  id: string;
  application_id?: string;
  author_name: string;
  note: string;
  created_at: string;
}

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
  last_contacted_at?: string;
  last_contact_channel?: string;
  last_contact_outcome?: string;
  rejection_reason?: string;
  needs_attention?: boolean;
  days_inactive?: number;
  attention_reason?: string;
  created_at?: string;
  notes_count?: number;
}

export type SortOption =
  | 'date_desc'
  | 'date_asc'
  | 'experience_desc'
  | 'experience_asc'
  | 'name_asc'
  | 'name_desc';

export interface AttentionInfo {
  needsAttention: boolean;
  daysInactive: number;
  isUrgent: boolean;
  reason: string;
}

export interface ATSFilterCriteria {
  statusFilter: string;
  searchQuery: string;
  tradeFilter: string;
  minExperienceFilter: string;
  destinationFilter: string;
  passportFilter: string;
  attentionOnlyFilter: boolean;
  sortBy: SortOption;
}
