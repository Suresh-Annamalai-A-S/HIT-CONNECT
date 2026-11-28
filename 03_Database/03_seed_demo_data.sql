-- ============================================================================
-- HIT Connect — Demonstration Seed Data
-- Run this THIRD in Supabase Dashboard -> SQL Editor
-- Note: All records marked is_demo = TRUE / DEMONSTRATION_DATA are sample data only.
-- ============================================================================

INSERT INTO public.departments (
  department_id, department_name, department_code, programme_name, programme_level,
  register_prefix, mapping_status, department_status, description, official_contact,
  data_classification, verification_status, is_demo, last_updated
) VALUES
  ('DEP-001', 'Department of Computer Science and Engineering', 'CSE', 'B.E. Computer Science and Engineering', 'B.E.', '720826103', 'Verified', 'Active', 'Undergraduate engineering programme in Computer Science and Engineering (contact details pending official verification).', 'Pending official verification', 'VERIFIED_INFORMATION', 'Published', FALSE, '2026-11-26'),
  ('DEP-002', 'Department of Electronics and Communication Engineering', 'ECE', 'B.E. Electronics and Communication Engineering', 'B.E.', '720826104', 'Verified', 'Active', 'Undergraduate engineering programme in Electronics and Communication Engineering (contact details pending official verification).', 'Pending official verification', 'VERIFIED_INFORMATION', 'Published', FALSE, '2026-11-26'),
  ('DEP-003', 'Department of Aeronautical Engineering', 'AERO', 'B.E. Aeronautical Engineering', 'B.E.', '720826101', 'Verified', 'Active', 'Undergraduate engineering programme in Aeronautical Engineering (contact details pending official verification).', 'Pending official verification', 'VERIFIED_INFORMATION', 'Published', FALSE, '2026-11-26'),
  ('DEP-004', 'Department of Mechanical Engineering', 'MECH', 'B.E. Mechanical Engineering', 'B.E.', '720826105', 'Verified', 'Active', 'Undergraduate engineering programme in Mechanical Engineering (contact details pending official verification).', 'Pending official verification', 'VERIFIED_INFORMATION', 'Published', FALSE, '2026-11-26'),
  ('DEP-005', 'Department of Information Technology', 'IT', 'B.Tech. Information Technology', 'B.Tech.', '720826106', 'Verified', 'Active', 'Undergraduate technology programme in Information Technology (contact details pending official verification).', 'Pending official verification', 'VERIFIED_INFORMATION', 'Published', FALSE, '2026-11-26'),
  ('DEP-006', 'Department of Artificial Intelligence and Data Science', 'AI&DS', 'B.Tech. Artificial Intelligence and Data Science', 'B.Tech.', '720826108', 'Verified', 'Active', 'Undergraduate technology programme in Artificial Intelligence and Data Science (contact details pending official verification).', 'Pending official verification', 'VERIFIED_INFORMATION', 'Published', FALSE, '2026-11-26')
ON CONFLICT (department_id) DO NOTHING;

INSERT INTO public.faculty (
  faculty_id, employee_id, faculty_name, department_id, designation, subjects_handled,
  qualifications, official_email, official_contact, research_interests, account_status,
  source, data_classification, verification_status, is_demo, last_updated
) VALUES
  ('FAC-001', 'HIT-FAC-001', 'Dr. Ramesh Kumar (Demo)', 'DEP-001', 'Professor & Head of Department', 'Data Structures, Design & Analysis of Algorithms', 'Ph.D. (CSE), M.E.', 'cse.hod.demo@example.com', '+91 00000 00101 (Demo Placeholder)', 'Distributed Systems, Software Engineering', 'Active', 'DEMO DATA — NOT OFFICIAL (Prototype Directory)', 'DEMONSTRATION_DATA', 'Published', TRUE, '2026-11-26'),
  ('FAC-002', 'HIT-FAC-002', 'Dr. Meenakshi Sundaram (Demo)', 'DEP-002', 'Professor & Head of Department', 'Digital Electronics, Embedded Systems, VLSI Design', 'Ph.D. (ECE), M.E.', 'ece.hod.demo@example.com', '+91 00000 00102 (Demo Placeholder)', 'Low-Power VLSI, IoT Sensor Networks', 'Active', 'DEMO DATA — NOT OFFICIAL (Prototype Directory)', 'DEMONSTRATION_DATA', 'Published', TRUE, '2026-11-26'),
  ('FAC-003', 'HIT-FAC-003', 'Dr. Senthil Nathan (Demo)', 'DEP-003', 'Associate Professor', 'Aerodynamics, Aircraft Structures, Flight Mechanics', 'Ph.D. (Aeronautical), M.E.', 'aero.faculty.demo@example.com', '+91 00000 00103 (Demo Placeholder)', 'Unmanned Aerial Vehicles, CFD', 'Active', 'DEMO DATA — NOT OFFICIAL (Prototype Directory)', 'DEMONSTRATION_DATA', 'Published', TRUE, '2026-11-26')
ON CONFLICT (faculty_id) DO NOTHING;

INSERT INTO public.administrative_contacts (
  admin_id, office_name, staff_name, designation, responsibilities,
  official_email, official_contact, office_location, working_hours,
  source, data_classification, verification_status, is_demo, last_updated
) VALUES
  ('ADM-001', 'Academic Administration (Demo)', 'Mr. Aravindhan R. (Demo)', 'Academic Coordinator (Illustrative)', 'Course registration, academic calendars, bonafide certificates, and curriculum circulars.', 'academics.office.demo@example.com', '+91 00000 00201 (Demo Placeholder)', 'Illustrative — Main Administrative Block, Ground Floor', 'Illustrative — Mon–Sat, 9:00 AM – 4:30 PM', 'DEMO DATA — NOT OFFICIAL (Prototype Directory)', 'DEMONSTRATION_DATA', 'Published', TRUE, '2026-11-26'),
  ('ADM-002', 'Examination Cell (Demo)', 'Dr. Sundararajan V. (Demo)', 'Controller of Examinations Office (Illustrative)', 'Semester exam timetables, hall tickets, grade sheets, revaluation, and transcript enquiries.', 'examcell.demo@example.com', '+91 00000 00202 (Demo Placeholder)', 'Illustrative — Examination Wing, First Floor', 'Illustrative — Mon–Sat, 9:30 AM – 4:30 PM', 'DEMO DATA — NOT OFFICIAL (Prototype Directory)', 'DEMONSTRATION_DATA', 'Published', TRUE, '2026-11-26')
ON CONFLICT (admin_id) DO NOTHING;

INSERT INTO public.announcements (
  announcement_id, title, description, category, target_audience, relevant_year_semester, department_id,
  publication_date, expiry_date, source, contributor_id, clarification_contact_id,
  publisher_id, data_classification, verification_status, is_demo, last_updated
) VALUES
  ('ANN-001', 'SAMPLE — Demonstration Academic Calendar Notice', 'DEMO DATA — Illustrative announcement showing how institutional notices appear with source, audience, and validity metadata.', 'Official Notice', 'All Students', 'All Semesters', 'DEP-001', '2026-11-26', '2026-12-31', 'DEMO DATA — NOT OFFICIAL (Prototype Sample)', 'ADM-001', 'ADM-001', 'ADM-001', 'DEMONSTRATION_DATA', 'Published', TRUE, '2026-11-26')
ON CONFLICT (announcement_id) DO NOTHING;
