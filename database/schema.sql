-- =====================================================================
-- UGETJOB - Updated PostgreSQL + Supabase Schema
-- Supports BOTH:
-- 1) Legacy Google Drive / external CV links
-- 2) Uploaded resume files (PDF, DOC, DOCX, etc.)
-- 3) Admin-driven job posting and ATS data model
-- =====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------
-- 1. ENUMS
-- ---------------------------------------------------------------------

DO $$ BEGIN
    CREATE TYPE job_status AS ENUM ('draft', 'published', 'paused', 'closed', 'filled');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE application_status AS ENUM (
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
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE resume_source AS ENUM ('drive_link', 'uploaded_file', 'manual_text');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------
-- 2. TABLES
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS job_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    parent_category_id UUID NULL REFERENCES job_categories(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES job_categories(id) ON DELETE RESTRICT,
    title TEXT NOT NULL,
    company_name TEXT NOT NULL,
    employer_contact_name TEXT,
    employer_email TEXT,
    employer_phone TEXT,
    location_country TEXT NOT NULL,
    location_city TEXT,
    work_location_type TEXT NOT NULL DEFAULT 'overseas',
    visa_required BOOLEAN NOT NULL DEFAULT false,
    visa_type TEXT,
    employment_type TEXT NOT NULL DEFAULT 'full_time',
    experience_min INTEGER NOT NULL DEFAULT 0,
    experience_max INTEGER,
    age_min INTEGER,
    age_max INTEGER,
    gender_preference TEXT,
    nationality_preference TEXT,
    salary_min NUMERIC(12,2),
    salary_max NUMERIC(12,2),
    salary_currency TEXT DEFAULT 'INR',
    job_description TEXT NOT NULL,
    requirements TEXT,
    benefits TEXT,
    urgent BOOLEAN NOT NULL DEFAULT false,
    featured BOOLEAN NOT NULL DEFAULT false,
    skills TEXT[] DEFAULT '{}',
    openings_count INTEGER NOT NULL DEFAULT 1,
    deadline TIMESTAMPTZ,
    posted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    status job_status NOT NULL DEFAULT 'published',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    whatsapp TEXT,
    nationality TEXT,
    current_country TEXT,
    current_city TEXT,
    passport_status TEXT DEFAULT 'ready',
    passport_number TEXT,
    passport_expiry DATE,
    years_experience INTEGER DEFAULT 0,
    current_job_title TEXT,
    current_salary NUMERIC(12,2),
    preferred_country TEXT,
    preferred_city TEXT,
    preferred_job_category TEXT,
    visa_status TEXT DEFAULT 'required',
    notice_period TEXT,
    willing_to_relocate BOOLEAN DEFAULT true,
    has_resume BOOLEAN NOT NULL DEFAULT false,

    -- legacy external resume link
    resume_url TEXT,

    -- source of resume
    resume_source resume_source NOT NULL DEFAULT 'drive_link',

    -- uploaded file metadata
    resume_file_name TEXT,
    resume_storage_bucket TEXT,
    resume_storage_path TEXT,
    resume_mime_type TEXT,
    resume_file_size_bytes BIGINT,
    resume_uploaded_at TIMESTAMPTZ,

    cover_letter TEXT,
    source TEXT DEFAULT 'website',
    consent_to_contact BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS candidate_resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    original_filename TEXT NOT NULL,
    storage_bucket TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL DEFAULT 0,
    source resume_source NOT NULL DEFAULT 'uploaded_file',
    drive_link TEXT,
    is_primary BOOLEAN NOT NULL DEFAULT true,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
    source_channel TEXT DEFAULT 'job_portal',
    application_status application_status NOT NULL DEFAULT 'new',
    recruiter_assigned TEXT,
    shortlisted_by TEXT,
    interview_date TIMESTAMPTZ,
    interview_notes TEXT,
    document_status TEXT DEFAULT 'pending',
    medical_status TEXT DEFAULT 'pending',
    visa_status TEXT DEFAULT 'not_started',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    company_type TEXT,
    industry TEXT,
    country TEXT,
    city TEXT,
    website TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employer_inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employer_id UUID REFERENCES employers(id) ON DELETE SET NULL,
    company_name TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    requirement_type TEXT NOT NULL,
    industry TEXT,
    job_title TEXT,
    number_of_positions INTEGER,
    country TEXT,
    city TEXT,
    work_location TEXT,
    budget_range TEXT,
    urgency TEXT DEFAULT 'normal',
    timeline TEXT,
    notes TEXT,
    source TEXT DEFAULT 'website',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS service_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_type TEXT NOT NULL,
    company_name TEXT,
    contact_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    city TEXT,
    notes TEXT,
    source TEXT DEFAULT 'website',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS application_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    storage_bucket TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    mime_type TEXT,
    file_size_bytes BIGINT,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ats_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    note TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS job_search_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    search_term TEXT,
    category TEXT,
    country TEXT,
    city TEXT,
    visa_status TEXT,
    experience_min INTEGER,
    experience_max INTEGER,
    result_count INTEGER,
    user_ip TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 3. INDEXES
-- ---------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_jobs_status_country ON jobs(status, location_country);
CREATE INDEX IF NOT EXISTS idx_jobs_category ON jobs(category_id);
CREATE INDEX IF NOT EXISTS idx_jobs_urgent_featured ON jobs(urgent, featured);

CREATE INDEX IF NOT EXISTS idx_applications_candidate ON applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_applications_job ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(application_status);

CREATE INDEX IF NOT EXISTS idx_candidates_phone ON candidates(phone);
CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates(email);

CREATE INDEX IF NOT EXISTS idx_documents_app ON application_documents(application_id);
CREATE INDEX IF NOT EXISTS idx_candidate_resumes_candidate ON candidate_resumes(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_resumes_primary ON candidate_resumes(candidate_id, is_primary);

-- ---------------------------------------------------------------------
-- 4. STORAGE BUCKETS
-- ---------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
    (
        'candidate-resumes',
        'candidate-resumes',
        false,
        10485760,
        ARRAY[
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.oasis.opendocument.text',
            'application/rtf',
            'image/jpeg',
            'image/png'
        ]
    ),
    (
        'company-documents',
        'company-documents',
        false,
        10485760,
        ARRAY[
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg',
            'image/png'
        ]
    ),
    (
        'job-attachments',
        'job-attachments',
        true,
        10485760,
        ARRAY[
            'application/pdf',
            'image/jpeg',
            'image/png'
        ]
    )
ON CONFLICT (id) DO UPDATE SET
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "Allow public resume upload"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'candidate-resumes');

CREATE POLICY "Allow recruiters to read candidate resumes"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'candidate-resumes');

CREATE POLICY "Public read for job attachments"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'job-attachments');

-- ---------------------------------------------------------------------
-- 5. UPDATE TRIGGERS
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_job_categories_updated_at ON job_categories;
CREATE TRIGGER trg_job_categories_updated_at
BEFORE UPDATE ON job_categories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_jobs_updated_at ON jobs;
CREATE TRIGGER trg_jobs_updated_at
BEFORE UPDATE ON jobs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_candidates_updated_at ON candidates;
CREATE TRIGGER trg_candidates_updated_at
BEFORE UPDATE ON candidates
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_applications_updated_at ON applications;
CREATE TRIGGER trg_applications_updated_at
BEFORE UPDATE ON applications
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_employers_updated_at ON employers;
CREATE TRIGGER trg_employers_updated_at
BEFORE UPDATE ON employers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_employer_inquiries_updated_at ON employer_inquiries;
CREATE TRIGGER trg_employer_inquiries_updated_at
BEFORE UPDATE ON employer_inquiries
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_candidate_resumes_updated_at ON candidate_resumes;
CREATE TRIGGER trg_candidate_resumes_updated_at
BEFORE UPDATE ON candidate_resumes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------
-- 6. SEED DATA
-- ---------------------------------------------------------------------

INSERT INTO job_categories (id, slug, name, description) VALUES
    ('11111111-1111-1111-1111-111111111101', 'construction', 'Construction & Civil', 'Civil engineering, masonry, scaffolding, and site foreman roles'),
    ('11111111-1111-1111-1111-111111111102', 'engineering', 'Engineering & MEP', 'Mechanical, Electrical, Instrumentation and MEP engineering positions'),
    ('11111111-1111-1111-1111-111111111103', 'electrical', 'Electrical & Substation', 'Industrial electricians, panel board wiremen, and substation technicians'),
    ('11111111-1111-1111-1111-111111111104', 'hvac', 'HVAC & Refrigeration', 'Chiller specialists, central AC mechanics, and duct fabricators'),
    ('11111111-1111-1111-1111-111111111105', 'oil-and-gas', 'Oil & Gas / Offshore', 'Refinery technicians, 6G pipe welders, pipe fitters, and safety officers'),
    ('11111111-1111-1111-1111-111111111106', 'healthcare', 'Healthcare & Nursing', 'Registered nurses, hospital technicians, and patient care staff'),
    ('11111111-1111-1111-1111-111111111107', 'hospitality', 'Hospitality & Catering', 'Chefs, line cooks, stewards, hotel housekeeping, and waiters'),
    ('11111111-1111-1111-1111-111111111108', 'logistics', 'Logistics & Heavy Drivers', 'Heavy trailer drivers, forklift operators, and warehouse storekeepers')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO jobs (
    id, category_id, title, company_name, employer_contact_name, employer_email, employer_phone,
    location_country, location_city, work_location_type, visa_required, visa_type, employment_type,
    experience_min, experience_max, salary_min, salary_max, salary_currency, job_description,
    requirements, benefits, urgent, featured, skills, openings_count, status
) VALUES 
(
    '22222222-2222-2222-2222-222222222201',
    '11111111-1111-1111-1111-111111111103',
    'Substation Electrical Foreman',
    'KSA Red Sea Project (Al-Bawani)',
    'Nouman Qureshi',
    'recruitment@ugetjob.com',
    '+966500123456',
    'Saudi Arabia',
    'Jeddah / Red Sea',
    'overseas',
    true,
    'Employment Visa Provided',
    'project_based',
    5,
    12,
    3800.00,
    5500.00,
    'SAR',
    'Lead high-voltage electrical substation installation, cable pulling, transformer termination, and testing according to SEC specifications for luxury coastal development.',
    'Degree/Diploma in Electrical Engineering with minimum 5 years GCC substation experience. Valid passport required.',
    'Free Bachelor Accommodation + Food Allowance + Medical Insurance + Annual Paid Leave with Air Ticket.',
    true,
    true,
    ARRAY['high_voltage', 'substation', 'cable_jointing', 'safety', 'team_leadership'],
    14,
    'published'
),
(
    '22222222-2222-2222-2222-222222222202',
    '11111111-1111-1111-1111-111111111104',
    'HVAC Chiller Specialist',
    'Gulf Facilities Management LLC',
    'Rashid Al-Maktoum',
    'careers@gulf-fm.ae',
    '+97148899000',
    'United Arab Emirates',
    'Dubai',
    'overseas',
    true,
    'Work Permit',
    'full_time',
    4,
    10,
    3200.00,
    4600.00,
    'AED',
    'Routine maintenance, troubleshooting, overhaul, and BMS integration for centrifugal and screw chillers (York, Trane, Carrier) across Grade-A commercial towers in Dubai.',
    'ITI/Diploma in Refrigeration and Air Conditioning. Minimum 3 years GCC experience on heavy chillers.',
    'Company Accommodation + Transportation + Overtime Pay + Health Insurance.',
    true,
    true,
    ARRAY['chillers', 'carrier', 'trane', 'troubleshooting', 'bms'],
    8,
    'published'
),
(
    '22222222-2222-2222-2222-222222222203',
    '11111111-1111-1111-1111-111111111105',
    '6G TIG & ARC Pipe Welder',
    'Qatar Energy Industrial Support',
    'Fahad Al-Sulaiti',
    'hr@qatarenergy-subcon.qa',
    '+97444112233',
    'Qatar',
    'Ras Laffan',
    'overseas',
    true,
    'Work Visa',
    'contract',
    3,
    8,
    3000.00,
    4200.00,
    'QAR',
    'Precision 6G TIG and Shielded Metal Arc Welding (SMAW) on carbon steel and alloy piping for gas liquefaction plant expansion.',
    'Valid 6G welder certificate (ASME Sec IX), xray test passing capability on client site.',
    'Camp accommodation + 3 meals daily + PPE + Medical card + return airfare.',
    false,
    true,
    ARRAY['6g_welding', 'tig_welding', 'piping', 'asme', 'xray_cleared'],
    25,
    'published'
),
(
    '22222222-2222-2222-2222-222222222204',
    '11111111-1111-1111-1111-111111111106',
    'ICU / Emergency Registered Nurse',
    'Al-Salam International Hospital',
    'Dr. Mariam Al-Hajri',
    'medical@alsalam-kw.com',
    '+96522003344',
    'Kuwait',
    'Kuwait City',
    'overseas',
    true,
    'MOH Visa',
    'full_time',
    3,
    9,
    450.00,
    650.00,
    'KWD',
    'Deliver specialized intensive care, monitor arterial lines, manage ventilators, and coordinate with emergency physicians in JCI-accredited tertiary medical center.',
    'B.Sc Nursing with Prometric exam clearance or Kuwait MOH license eligibility.',
    'Furnished Studio Apartment + 30 days annual vacation + Business class airfare allowance.',
    false,
    false,
    ARRAY['icu', 'critical_care', 'bls', 'acls', 'prometric'],
    12,
    'published'
),
(
    '22222222-2222-2222-2222-222222222205',
    '11111111-1111-1111-1111-111111111108',
    'Heavy Trailer / Dump Truck Driver',
    'Oman Minerals & Logistics SAOG',
    'Salim Al-Balushi',
    'fleet@oman-minerals.om',
    '+96824556677',
    'Oman',
    'Sohar',
    'overseas',
    true,
    'Employment Visa',
    'full_time',
    3,
    7,
    220.00,
    300.00,
    'OMR',
    'Safe driving and haulage of mining aggregates using 40-ton articulated dump trucks and semi-trailers along designated coastal transport corridors.',
    'Valid GCC or Oman Heavy Vehicle Driving License. Clean driving record.',
    'Company quarters + trip bonuses + medical cover.',
    true,
    false,
    ARRAY['heavy_driver', 'gcc_license', 'defensive_driving', 'aggregate_haulage'],
    18,
    'published'
)
ON CONFLICT (id) DO NOTHING;
