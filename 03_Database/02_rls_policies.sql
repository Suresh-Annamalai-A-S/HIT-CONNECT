-- ============================================================================
-- HIT Connect — Row Level Security (RLS) Policies
-- Enforces Student, Faculty & Administrator responsibilities at the DB layer:
--   - Students: read-only Published content; private report submission; no admin/publish
--   - Faculty: no self-registration; active admin-created accounts publish directly
--              and edit ONLY their own non-restricted records
--   - Administrators: manage faculty accounts, post-publication moderation, reports, audit
--   - Audit log: strictly append-only (no UPDATE/DELETE for any standard role)
-- Run this SECOND in Supabase Dashboard -> SQL Editor
-- ============================================================================

-- Helper: safely read signed-in user's role without RLS recursion
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()),
    'student'
  );
$$;

-- Helper: verify caller is an ACTIVE administrator-created faculty account
CREATE OR REPLACE FUNCTION public.is_active_faculty()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_profiles
    WHERE id = auth.uid()
      AND role = 'faculty'
      AND account_status = 'Active'
  );
$$;

-- Enable RLS on ALL tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.administrative_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campus_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_correction_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_history ENABLE ROW LEVEL SECURITY;

-- 1. user_profiles: Users read own profile; ONLY administrators create/manage accounts (no faculty self-registration)
CREATE POLICY "Users read own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id OR public.current_user_role() = 'administrator');

CREATE POLICY "Admins manage all profiles"
  ON public.user_profiles FOR ALL
  USING (public.current_user_role() = 'administrator')
  WITH CHECK (public.current_user_role() = 'administrator');

-- 2. departments
CREATE POLICY "Read active departments"
  ON public.departments FOR SELECT
  USING (department_status = 'Active' OR public.current_user_role() = 'administrator');

CREATE POLICY "Admins manage departments"
  ON public.departments FOR ALL
  USING (public.current_user_role() = 'administrator')
  WITH CHECK (public.current_user_role() = 'administrator');

-- 3. student_profiles
CREATE POLICY "Students view own student profile"
  ON public.student_profiles FOR SELECT
  USING (user_id = auth.uid() OR public.current_user_role() = 'administrator');

CREATE POLICY "Admins manage student profiles"
  ON public.student_profiles FOR ALL
  USING (public.current_user_role() = 'administrator')
  WITH CHECK (public.current_user_role() = 'administrator');

-- 4. Directory tables (faculty, administrative_contacts, clubs)
-- Only Administrators can create/update faculty accounts & official faculty profiles.
CREATE POLICY "Read published faculty"
  ON public.faculty FOR SELECT
  USING (
    (verification_status IN ('Published', 'Verified') AND account_status = 'Active')
    OR user_id = auth.uid()
    OR public.current_user_role() = 'administrator'
  );

CREATE POLICY "Admins manage faculty"
  ON public.faculty FOR ALL
  USING (public.current_user_role() = 'administrator')
  WITH CHECK (public.current_user_role() = 'administrator');

CREATE POLICY "Read published admin contacts"
  ON public.administrative_contacts FOR SELECT
  USING (verification_status IN ('Published', 'Verified') OR public.current_user_role() = 'administrator');

CREATE POLICY "Admins manage admin contacts"
  ON public.administrative_contacts FOR ALL
  USING (public.current_user_role() = 'administrator')
  WITH CHECK (public.current_user_role() = 'administrator');

CREATE POLICY "Read published clubs"
  ON public.clubs FOR SELECT
  USING (verification_status IN ('Published', 'Verified') OR public.current_user_role() = 'administrator');

CREATE POLICY "Admins manage clubs"
  ON public.clubs FOR ALL
  USING (public.current_user_role() = 'administrator')
  WITH CHECK (public.current_user_role() = 'administrator');

-- 5. Direct-Publish Content Tables: academics, opportunities, events, announcements, campus_resources
-- Rules:
--   - Students: SELECT only Published (plus Archived for academics)
--   - Active Faculty: SELECT Published + own records; INSERT directly as Draft or Published;
--                     UPDATE only own records that are NOT Temporarily Hidden or Removed
--   - Administrators: Full access for post-publication moderation

-- ACADEMICS
CREATE POLICY "Read academics by role"
  ON public.academics FOR SELECT
  USING (
    verification_status IN ('Published', 'Verified', 'Archived')
    OR created_by_user_id = auth.uid()
    OR public.current_user_role() = 'administrator'
  );

CREATE POLICY "Active faculty publish academics"
  ON public.academics FOR INSERT
  WITH CHECK (
    public.current_user_role() = 'administrator'
    OR (
      public.is_active_faculty()
      AND created_by_user_id = auth.uid()
      AND verification_status IN ('Draft', 'Published')
    )
  );

CREATE POLICY "Active faculty edit own academics"
  ON public.academics FOR UPDATE
  USING (
    public.current_user_role() = 'administrator'
    OR (
      public.is_active_faculty()
      AND created_by_user_id = auth.uid()
      AND verification_status IN ('Draft', 'Published', 'Archived')
    )
  )
  WITH CHECK (
    public.current_user_role() = 'administrator'
    OR (
      public.is_active_faculty()
      AND created_by_user_id = auth.uid()
      AND verification_status IN ('Draft', 'Published', 'Archived')
    )
  );

CREATE POLICY "Admins delete academics"
  ON public.academics FOR DELETE
  USING (public.current_user_role() = 'administrator');

-- OPPORTUNITIES
CREATE POLICY "Read opportunities by role"
  ON public.opportunities FOR SELECT
  USING (
    verification_status IN ('Published', 'Verified')
    OR created_by_user_id = auth.uid()
    OR public.current_user_role() = 'administrator'
  );

CREATE POLICY "Active faculty publish opportunities"
  ON public.opportunities FOR INSERT
  WITH CHECK (
    public.current_user_role() = 'administrator'
    OR (
      public.is_active_faculty()
      AND created_by_user_id = auth.uid()
      AND verification_status IN ('Draft', 'Published')
    )
  );

CREATE POLICY "Active faculty edit own opportunities"
  ON public.opportunities FOR UPDATE
  USING (
    public.current_user_role() = 'administrator'
    OR (
      public.is_active_faculty()
      AND created_by_user_id = auth.uid()
      AND verification_status IN ('Draft', 'Published', 'Archived')
    )
  )
  WITH CHECK (
    public.current_user_role() = 'administrator'
    OR (
      public.is_active_faculty()
      AND created_by_user_id = auth.uid()
      AND verification_status IN ('Draft', 'Published', 'Archived')
    )
  );

CREATE POLICY "Admins delete opportunities"
  ON public.opportunities FOR DELETE
  USING (public.current_user_role() = 'administrator');

-- EVENTS
CREATE POLICY "Read events by role"
  ON public.events FOR SELECT
  USING (
    verification_status IN ('Published', 'Verified')
    OR created_by_user_id = auth.uid()
    OR public.current_user_role() = 'administrator'
  );

CREATE POLICY "Active faculty publish events"
  ON public.events FOR INSERT
  WITH CHECK (
    public.current_user_role() = 'administrator'
    OR (
      public.is_active_faculty()
      AND created_by_user_id = auth.uid()
      AND verification_status IN ('Draft', 'Published')
    )
  );

CREATE POLICY "Active faculty edit own events"
  ON public.events FOR UPDATE
  USING (
    public.current_user_role() = 'administrator'
    OR (
      public.is_active_faculty()
      AND created_by_user_id = auth.uid()
      AND verification_status IN ('Draft', 'Published', 'Archived')
    )
  )
  WITH CHECK (
    public.current_user_role() = 'administrator'
    OR (
      public.is_active_faculty()
      AND created_by_user_id = auth.uid()
      AND verification_status IN ('Draft', 'Published', 'Archived')
    )
  );

CREATE POLICY "Admins delete events"
  ON public.events FOR DELETE
  USING (public.current_user_role() = 'administrator');

-- ANNOUNCEMENTS
CREATE POLICY "Read announcements by role"
  ON public.announcements FOR SELECT
  USING (
    verification_status IN ('Published', 'Verified')
    OR created_by_user_id = auth.uid()
    OR public.current_user_role() = 'administrator'
  );

CREATE POLICY "Active faculty publish announcements"
  ON public.announcements FOR INSERT
  WITH CHECK (
    public.current_user_role() = 'administrator'
    OR (
      public.is_active_faculty()
      AND created_by_user_id = auth.uid()
      AND verification_status IN ('Draft', 'Published')
    )
  );

CREATE POLICY "Active faculty edit own announcements"
  ON public.announcements FOR UPDATE
  USING (
    public.current_user_role() = 'administrator'
    OR (
      public.is_active_faculty()
      AND created_by_user_id = auth.uid()
      AND verification_status IN ('Draft', 'Published', 'Archived')
    )
  )
  WITH CHECK (
    public.current_user_role() = 'administrator'
    OR (
      public.is_active_faculty()
      AND created_by_user_id = auth.uid()
      AND verification_status IN ('Draft', 'Published', 'Archived')
    )
  );

CREATE POLICY "Admins delete announcements"
  ON public.announcements FOR DELETE
  USING (public.current_user_role() = 'administrator');

-- CAMPUS RESOURCES
CREATE POLICY "Read campus resources by role"
  ON public.campus_resources FOR SELECT
  USING (
    verification_status IN ('Published', 'Verified')
    OR created_by_user_id = auth.uid()
    OR public.current_user_role() = 'administrator'
  );

CREATE POLICY "Active faculty publish campus resources"
  ON public.campus_resources FOR INSERT
  WITH CHECK (
    public.current_user_role() = 'administrator'
    OR (
      public.is_active_faculty()
      AND created_by_user_id = auth.uid()
      AND verification_status IN ('Draft', 'Published')
    )
  );

CREATE POLICY "Active faculty edit own campus resources"
  ON public.campus_resources FOR UPDATE
  USING (
    public.current_user_role() = 'administrator'
    OR (
      public.is_active_faculty()
      AND created_by_user_id = auth.uid()
      AND verification_status IN ('Draft', 'Published', 'Archived')
    )
  )
  WITH CHECK (
    public.current_user_role() = 'administrator'
    OR (
      public.is_active_faculty()
      AND created_by_user_id = auth.uid()
      AND verification_status IN ('Draft', 'Published', 'Archived')
    )
  );

CREATE POLICY "Admins delete campus resources"
  ON public.campus_resources FOR DELETE
  USING (public.current_user_role() = 'administrator');

-- 6. Student Reports: Private — students see only their own reports; admins manage all
CREATE POLICY "Students submit private reports"
  ON public.student_reports FOR INSERT
  WITH CHECK (
    public.current_user_role() = 'student'
    AND reported_by_user_id = auth.uid()
  );

CREATE POLICY "Read reports privately"
  ON public.student_reports FOR SELECT
  USING (
    reported_by_user_id = auth.uid()
    OR public.current_user_role() = 'administrator'
  );

CREATE POLICY "Admins moderate reports"
  ON public.student_reports FOR UPDATE
  USING (public.current_user_role() = 'administrator')
  WITH CHECK (public.current_user_role() = 'administrator');

-- 7. Notifications
CREATE POLICY "Users read relevant notifications"
  ON public.notifications FOR SELECT
  USING (
    public.current_user_role() = 'administrator'
    OR recipient_user_id = auth.uid()::text
    OR recipient_role = public.current_user_role()
  );

CREATE POLICY "Staff and system insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (
    public.current_user_role() IN ('administrator')
    OR public.is_active_faculty()
    OR public.current_user_role() = 'student'
  );

-- 8. Faculty Profile Correction Requests
CREATE POLICY "Faculty submit own profile correction requests"
  ON public.profile_correction_requests FOR INSERT
  WITH CHECK (
    public.is_active_faculty()
    AND requested_by_user_id = auth.uid()
  );

CREATE POLICY "Read profile correction requests"
  ON public.profile_correction_requests FOR SELECT
  USING (
    requested_by_user_id = auth.uid()
    OR public.current_user_role() = 'administrator'
  );

CREATE POLICY "Admins resolve profile correction requests"
  ON public.profile_correction_requests FOR UPDATE
  USING (public.current_user_role() = 'administrator')
  WITH CHECK (public.current_user_role() = 'administrator');

-- 9. Audit History (verification_history): Strictly Append-Only (NO UPDATE or DELETE policies)
CREATE POLICY "Admins view full audit history"
  ON public.verification_history FOR SELECT
  USING (
    public.current_user_role() = 'administrator'
    OR action_by_user_id = auth.uid()
  );

CREATE POLICY "Active faculty and admins append audit history"
  ON public.verification_history FOR INSERT
  WITH CHECK (
    public.current_user_role() = 'administrator'
    OR public.is_active_faculty()
  );
