-- ============================================================================
-- HIT Connect — PostgreSQL Relational Schema (Supabase Compatible)
-- User-Centred Workflow Refinement: Student, Faculty & Administrator Model
-- Run this FIRST in Supabase Dashboard -> SQL Editor
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. User Profiles (Links Supabase Auth users to HIT Connect roles & account status)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('student', 'faculty', 'administrator')) DEFAULT 'student',
  full_name TEXT NOT NULL,
  register_number TEXT UNIQUE,
  employee_id TEXT UNIQUE,
  department_id TEXT,
  designation TEXT,
  linked_person_id TEXT,
  account_status TEXT NOT NULL DEFAULT 'Active'
    CHECK (account_status IN ('Active', 'Suspended', 'Deactivated')),
  must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
  permissions JSONB NOT NULL DEFAULT '{"can_publish":true,"can_edit_own":true,"can_mark_urgent":true,"can_archive_own":true}'::jsonb,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Departments
CREATE TABLE IF NOT EXISTS public.departments (
  department_id TEXT PRIMARY KEY,
  department_name TEXT NOT NULL,
  department_code TEXT NOT NULL UNIQUE,
  programme_name TEXT NOT NULL,
  programme_level TEXT NOT NULL,
  register_prefix TEXT UNIQUE,
  mapping_status TEXT NOT NULL DEFAULT 'Pending',
  department_status TEXT NOT NULL DEFAULT 'Active',
  description TEXT,
  official_email TEXT,
  official_contact TEXT,
  data_classification TEXT NOT NULL DEFAULT 'UNVERIFIED_INFORMATION'
    CHECK (data_classification IN ('VERIFIED_INFORMATION', 'DEMONSTRATION_DATA', 'UNVERIFIED_INFORMATION')),
  verification_status TEXT NOT NULL DEFAULT 'Published'
    CHECK (verification_status IN ('Draft', 'Published', 'Temporarily Hidden', 'Archived', 'Removed', 'Pending Verification', 'Verified', 'Rejected', 'Expired')),
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  last_updated DATE NOT NULL DEFAULT CURRENT_DATE
);

-- 3. Student Profiles
CREATE TABLE IF NOT EXISTS public.student_profiles (
  student_id TEXT PRIMARY KEY,
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  register_number TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  programme_id TEXT,
  programme_name TEXT NOT NULL,
  department_id TEXT NOT NULL REFERENCES public.departments(department_id),
  admission_year INTEGER NOT NULL CHECK (admission_year BETWEEN 2018 AND 2035),
  batch TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  current_semester TEXT NOT NULL,
  photograph_url TEXT,
  official_email TEXT,
  profile_classification TEXT NOT NULL DEFAULT 'DEMO STUDENT PROFILE',
  data_classification TEXT NOT NULL DEFAULT 'DEMONSTRATION_DATA'
    CHECK (data_classification IN ('VERIFIED_INFORMATION', 'DEMONSTRATION_DATA', 'UNVERIFIED_INFORMATION')),
  profile_status TEXT NOT NULL DEFAULT 'DEMO STUDENT PROFILE',
  is_demo BOOLEAN NOT NULL DEFAULT TRUE
);

-- 4. Faculty Directory & Official Faculty Accounts (Administrator-managed only; no self-registration)
CREATE TABLE IF NOT EXISTS public.faculty (
  faculty_id TEXT PRIMARY KEY,
  employee_id TEXT UNIQUE,
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  faculty_name TEXT NOT NULL,
  photograph TEXT,
  department_id TEXT NOT NULL REFERENCES public.departments(department_id),
  designation TEXT NOT NULL,
  subjects_handled TEXT,
  qualifications TEXT,
  official_email TEXT UNIQUE,
  official_contact TEXT,
  research_interests TEXT,
  account_status TEXT NOT NULL DEFAULT 'Active'
    CHECK (account_status IN ('Active', 'Suspended', 'Deactivated')),
  permissions JSONB NOT NULL DEFAULT '{"can_publish":true,"can_edit_own":true,"can_mark_urgent":true,"can_archive_own":true}'::jsonb,
  must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
  source TEXT NOT NULL,
  data_classification TEXT NOT NULL DEFAULT 'UNVERIFIED_INFORMATION'
    CHECK (data_classification IN ('VERIFIED_INFORMATION', 'DEMONSTRATION_DATA', 'UNVERIFIED_INFORMATION')),
  verification_status TEXT NOT NULL DEFAULT 'Published'
    CHECK (verification_status IN ('Draft', 'Published', 'Temporarily Hidden', 'Archived', 'Removed', 'Pending Verification', 'Verified', 'Rejected', 'Expired')),
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_updated DATE NOT NULL DEFAULT CURRENT_DATE
);

-- 5. Administrative Contacts
CREATE TABLE IF NOT EXISTS public.administrative_contacts (
  admin_id TEXT PRIMARY KEY,
  office_name TEXT NOT NULL,
  staff_name TEXT,
  designation TEXT NOT NULL,
  responsibilities TEXT NOT NULL,
  official_email TEXT,
  official_contact TEXT,
  office_location TEXT,
  working_hours TEXT,
  source TEXT NOT NULL,
  data_classification TEXT NOT NULL DEFAULT 'UNVERIFIED_INFORMATION'
    CHECK (data_classification IN ('VERIFIED_INFORMATION', 'DEMONSTRATION_DATA', 'UNVERIFIED_INFORMATION')),
  verification_status TEXT NOT NULL DEFAULT 'Published'
    CHECK (verification_status IN ('Draft', 'Published', 'Temporarily Hidden', 'Archived', 'Removed', 'Pending Verification', 'Verified', 'Rejected', 'Expired')),
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  last_updated DATE NOT NULL DEFAULT CURRENT_DATE
);

-- 6. Academics
CREATE TABLE IF NOT EXISTS public.academics (
  academic_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  department_id TEXT NOT NULL REFERENCES public.departments(department_id),
  academic_year TEXT,
  applicable_batch TEXT,
  semester TEXT,
  description TEXT NOT NULL,
  document_link TEXT,
  version TEXT NOT NULL DEFAULT 'v1.0',
  source TEXT NOT NULL,
  contributor_id TEXT,
  clarification_contact_id TEXT,
  publisher_id TEXT,
  is_urgent BOOLEAN NOT NULL DEFAULT FALSE,
  data_classification TEXT NOT NULL DEFAULT 'UNVERIFIED_INFORMATION'
    CHECK (data_classification IN ('VERIFIED_INFORMATION', 'DEMONSTRATION_DATA', 'UNVERIFIED_INFORMATION')),
  verification_status TEXT NOT NULL DEFAULT 'Published'
    CHECK (verification_status IN ('Draft', 'Published', 'Temporarily Hidden', 'Archived', 'Removed', 'Pending Verification', 'Verified', 'Rejected', 'Expired')),
  hidden_reason TEXT,
  removal_reason TEXT,
  last_action_remarks TEXT,
  verified_date DATE,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  last_updated DATE NOT NULL DEFAULT CURRENT_DATE
);

-- 7. Opportunities
CREATE TABLE IF NOT EXISTS public.opportunities (
  opportunity_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  organiser TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  eligibility TEXT NOT NULL,
  eligibility_warning TEXT,
  department_id TEXT REFERENCES public.departments(department_id),
  relevant_departments TEXT,
  relevant_years TEXT,
  application_start_date DATE,
  application_deadline DATE,
  fee_details TEXT,
  stipend TEXT,
  official_source_url TEXT,
  application_url TEXT,
  source TEXT NOT NULL,
  contributor_id TEXT,
  clarification_contact_id TEXT,
  publisher_id TEXT,
  is_urgent BOOLEAN NOT NULL DEFAULT FALSE,
  last_verified_date DATE,
  data_classification TEXT NOT NULL DEFAULT 'UNVERIFIED_INFORMATION'
    CHECK (data_classification IN ('VERIFIED_INFORMATION', 'DEMONSTRATION_DATA', 'UNVERIFIED_INFORMATION')),
  verification_status TEXT NOT NULL DEFAULT 'Published'
    CHECK (verification_status IN ('Draft', 'Published', 'Temporarily Hidden', 'Archived', 'Removed', 'Pending Verification', 'Verified', 'Rejected', 'Expired')),
  hidden_reason TEXT,
  removal_reason TEXT,
  last_action_remarks TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  last_updated DATE NOT NULL DEFAULT CURRENT_DATE
);

-- 8. Events
CREATE TABLE IF NOT EXISTS public.events (
  event_id TEXT PRIMARY KEY,
  event_name TEXT NOT NULL,
  category TEXT NOT NULL,
  organizer TEXT NOT NULL,
  department_id TEXT REFERENCES public.departments(department_id),
  target_audience TEXT,
  relevant_year_semester TEXT,
  description TEXT NOT NULL,
  event_date DATE NOT NULL,
  start_time TEXT,
  end_time TEXT,
  venue TEXT NOT NULL,
  registration_deadline DATE,
  registration_link TEXT,
  source TEXT NOT NULL,
  contributor_id TEXT,
  clarification_contact_id TEXT,
  publisher_id TEXT,
  is_urgent BOOLEAN NOT NULL DEFAULT FALSE,
  data_classification TEXT NOT NULL DEFAULT 'UNVERIFIED_INFORMATION'
    CHECK (data_classification IN ('VERIFIED_INFORMATION', 'DEMONSTRATION_DATA', 'UNVERIFIED_INFORMATION')),
  verification_status TEXT NOT NULL DEFAULT 'Published'
    CHECK (verification_status IN ('Draft', 'Published', 'Temporarily Hidden', 'Archived', 'Removed', 'Pending Verification', 'Verified', 'Rejected', 'Expired')),
  hidden_reason TEXT,
  removal_reason TEXT,
  last_action_remarks TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  last_updated DATE NOT NULL DEFAULT CURRENT_DATE
);

-- 9. Announcements
CREATE TABLE IF NOT EXISTS public.announcements (
  announcement_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  target_audience TEXT NOT NULL,
  relevant_year_semester TEXT,
  department_id TEXT REFERENCES public.departments(department_id),
  publication_date DATE NOT NULL DEFAULT CURRENT_DATE,
  event_date DATE,
  event_time TEXT,
  venue TEXT,
  registration_deadline DATE,
  expiry_date DATE,
  attachments_links TEXT,
  is_urgent BOOLEAN NOT NULL DEFAULT FALSE,
  source TEXT NOT NULL,
  contributor_id TEXT,
  clarification_contact_id TEXT,
  publisher_id TEXT,
  data_classification TEXT NOT NULL DEFAULT 'UNVERIFIED_INFORMATION'
    CHECK (data_classification IN ('VERIFIED_INFORMATION', 'DEMONSTRATION_DATA', 'UNVERIFIED_INFORMATION')),
  verification_status TEXT NOT NULL DEFAULT 'Published'
    CHECK (verification_status IN ('Draft', 'Published', 'Temporarily Hidden', 'Archived', 'Removed', 'Pending Verification', 'Verified', 'Rejected', 'Expired')),
  hidden_reason TEXT,
  removal_reason TEXT,
  last_action_remarks TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  last_updated DATE NOT NULL DEFAULT CURRENT_DATE
);

-- 10. Clubs
CREATE TABLE IF NOT EXISTS public.clubs (
  club_id TEXT PRIMARY KEY,
  club_name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  department_id TEXT REFERENCES public.departments(department_id),
  official_contact TEXT,
  registration_link TEXT,
  source TEXT NOT NULL,
  contributor_id TEXT,
  clarification_contact_id TEXT,
  publisher_id TEXT,
  data_classification TEXT NOT NULL DEFAULT 'UNVERIFIED_INFORMATION'
    CHECK (data_classification IN ('VERIFIED_INFORMATION', 'DEMONSTRATION_DATA', 'UNVERIFIED_INFORMATION')),
  verification_status TEXT NOT NULL DEFAULT 'Published'
    CHECK (verification_status IN ('Draft', 'Published', 'Temporarily Hidden', 'Archived', 'Removed', 'Pending Verification', 'Verified', 'Rejected', 'Expired')),
  hidden_reason TEXT,
  removal_reason TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  last_updated DATE NOT NULL DEFAULT CURRENT_DATE
);

-- 11. Campus Resources
CREATE TABLE IF NOT EXISTS public.campus_resources (
  resource_id TEXT PRIMARY KEY,
  resource_name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  responsible_department TEXT NOT NULL,
  contact_information TEXT,
  availability_information TEXT,
  source TEXT NOT NULL,
  contributor_id TEXT,
  clarification_contact_id TEXT,
  publisher_id TEXT,
  is_urgent BOOLEAN NOT NULL DEFAULT FALSE,
  data_classification TEXT NOT NULL DEFAULT 'UNVERIFIED_INFORMATION'
    CHECK (data_classification IN ('VERIFIED_INFORMATION', 'DEMONSTRATION_DATA', 'UNVERIFIED_INFORMATION')),
  verification_status TEXT NOT NULL DEFAULT 'Published'
    CHECK (verification_status IN ('Draft', 'Published', 'Temporarily Hidden', 'Archived', 'Removed', 'Pending Verification', 'Verified', 'Rejected', 'Expired')),
  hidden_reason TEXT,
  removal_reason TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_updated DATE NOT NULL DEFAULT CURRENT_DATE
);

-- 12. Student Reports (Private moderation reports; never public, never auto-removes content)
CREATE TABLE IF NOT EXISTS public.student_reports (
  report_id TEXT PRIMARY KEY,
  record_id TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_title TEXT NOT NULL,
  original_author_id TEXT,
  reason TEXT NOT NULL,
  explanation TEXT,
  reported_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reported_by_label TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Open'
    CHECK (status IN ('Open', 'Under Investigation', 'Corrected', 'Hidden', 'Removed', 'Dismissed')),
  admin_action_notes TEXT,
  resolved_by TEXT,
  resolved_at TIMESTAMPTZ,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Notifications (Scoped correction alerts, urgent notices & moderation notices)
CREATE TABLE IF NOT EXISTS public.notifications (
  notification_id TEXT PRIMARY KEY,
  recipient_role TEXT NOT NULL CHECK (recipient_role IN ('student', 'faculty', 'administrator')),
  recipient_department_id TEXT,
  recipient_user_id TEXT,
  record_id TEXT,
  table_name TEXT,
  notification_type TEXT NOT NULL
    CHECK (notification_type IN ('correction', 'urgent', 'report_alert', 'admin_correction', 'profile_request')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_urgent BOOLEAN NOT NULL DEFAULT FALSE,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. Faculty Profile Correction Requests (Faculty request admin updates to protected institutional fields)
CREATE TABLE IF NOT EXISTS public.profile_correction_requests (
  request_id TEXT PRIMARY KEY,
  faculty_id TEXT NOT NULL REFERENCES public.faculty(faculty_id) ON DELETE CASCADE,
  requested_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  field_name TEXT NOT NULL,
  current_value TEXT,
  requested_value TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending'
    CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  admin_notes TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- 15. Verification & Audit History (Immutable Append-Only Audit Log)
CREATE TABLE IF NOT EXISTS public.verification_history (
  history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL DEFAULT 'STATUS_CHANGE',
  record_id TEXT NOT NULL,
  table_name TEXT NOT NULL,
  previous_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  previous_value JSONB,
  updated_value JSONB,
  action_by TEXT NOT NULL,
  actor_role TEXT NOT NULL DEFAULT 'administrator',
  action_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  remarks TEXT,
  reason TEXT,
  reference_state TEXT NOT NULL DEFAULT 'Active',
  is_demo BOOLEAN NOT NULL DEFAULT FALSE
);

-- Helpful Indexes for Fast Search, Moderation & Audit Queries
CREATE INDEX IF NOT EXISTS idx_academics_dept_status ON public.academics(department_id, verification_status);
CREATE INDEX IF NOT EXISTS idx_opportunities_status_deadline ON public.opportunities(verification_status, application_deadline);
CREATE INDEX IF NOT EXISTS idx_events_status_date ON public.events(verification_status, event_date);
CREATE INDEX IF NOT EXISTS idx_announcements_dept_status ON public.announcements(department_id, verification_status);
CREATE INDEX IF NOT EXISTS idx_faculty_status ON public.faculty(account_status, department_id);
CREATE INDEX IF NOT EXISTS idx_reports_status_record ON public.student_reports(status, table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_role, recipient_department_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_history_record ON public.verification_history(table_name, record_id, action_date DESC);
