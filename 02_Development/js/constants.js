// HIT Connect — Constants, Roles, Workflow Transitions & Form Schemas

const STORAGE_KEY = 'hit_connect_prototype_db_v1';
const SESSION_KEY = 'hit_connect_demo_session_v1';
const RECENT_SEARCH_KEY = 'hit_connect_recent_searches_v1';

const DEMO_ENVIRONMENT_NOTICE = 'DEMO ENVIRONMENT — Information and activities shown here are sample data and are not official college records.';

const UNMAPPED_REGISTER_PREFIXES = ['720826102', '720826107'];
const SUPPORTED_BATCH_MAP = {
  '26': { admissionYear: 2026, batch: '2026–2030' },
  '25': { admissionYear: 2025, batch: '2025–2029' },
  '24': { admissionYear: 2024, batch: '2024–2028' },
  '23': { admissionYear: 2023, batch: '2023–2027' }
};
const ROMAN_SEMESTERS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

const DEFAULT_FACULTY_PERMISSIONS = {
  canPublish: true,
  canEditOwn: true,
  canMarkUrgent: true,
  canArchiveOwn: true
};

const PERMISSION_LABELS = {
  canPublish: { label: 'Direct Publish Information', consequence: 'Allows publishing announcements, events, opportunities, and academic notices directly to students without an approval queue.' },
  canEditOwn: { label: 'Edit Own Published Posts', consequence: 'Allows modifying own published announcements and records (all edits are recorded in audit history).' },
  canMarkUrgent: { label: 'Mark Urgent Announcements', consequence: 'Allows prioritizing notifications for genuinely urgent notices scoped to the selected department/audience.' },
  canArchiveOwn: { label: 'Archive Outdated Own Posts', consequence: 'Allows archiving own outdated announcements so students see only active information.' }
};

const DEMO_ACCOUNTS = {
  faculty: [
    { userId: 'DEMO-FAC-001', linkedPersonId: 'FAC-001', identifiers: ['faculty.demo@example.com', 'cse.hod.demo@example.com', 'DEMO-FAC-001', 'HIT-FAC-001'], name: 'Dr. Ramesh Kumar (Demo)', designation: 'Professor & Head of Department', departmentId: 'DEP-001', role: 'faculty', roleLabel: 'Faculty', demoSecret: 'faculty-demo-2026' },
    { userId: 'DEMO-FAC-002', linkedPersonId: 'FAC-002', identifiers: ['ece.hod.demo@example.com', 'DEMO-FAC-002', 'HIT-FAC-002'], name: 'Dr. Meenakshi Sundaram (Demo)', designation: 'Professor & Head of Department', departmentId: 'DEP-002', role: 'faculty', roleLabel: 'Faculty', demoSecret: 'faculty-ece-2026' }
  ],
  administrator: [
    { userId: 'DEMO-ADM-001', linkedPersonId: 'ADM-001', identifiers: ['admin.demo@example.com', 'DEMO-ADM-001'], name: 'Mr. Aravindhan R. (Demo)', designation: 'Academic Coordinator (Illustrative)', departmentId: 'ALL', role: 'administrator', roleLabel: 'Administrator', demoSecret: 'admin-demo-2026' }
  ]
};

const ACCOUNT_PERMISSIONS = {
  student: {
    viewAllStatuses: false,
    create: false,
    directPublish: false,
    editExisting: false,
    publishNewVersion: false,
    canReport: true,
    manageFacultyAccounts: false,
    manageReports: false,
    allowedTargets: []
  },
  faculty: {
    viewAllStatuses: false,
    visibleStatuses: ['Draft', 'Published', 'Temporarily Hidden', 'Archived', 'Removed'],
    create: true,
    directPublish: true,
    editExisting: true,
    publishNewVersion: true,
    canReport: false,
    manageFacultyAccounts: false,
    manageReports: false,
    allowedTargets: ['Draft', 'Published', 'Archived']
  },
  administrator: {
    viewAllStatuses: true,
    create: true,
    directPublish: true,
    editExisting: true,
    publishNewVersion: true,
    canReport: false,
    manageFacultyAccounts: true,
    manageReports: true,
    allowedTargets: ['Draft', 'Published', 'Temporarily Hidden', 'Archived', 'Removed', 'Expired']
  }
};

// Internal lifecycle states (NEVER exposed to students)
const INTERNAL_LIFECYCLE_STATES = ['Draft', 'Published', 'Temporarily Hidden', 'Archived', 'Removed'];
const STATUS_OPTIONS = ['Draft', 'Published', 'Temporarily Hidden', 'Archived', 'Removed', 'Expired', 'Pending Verification', 'Verified', 'Rejected'];
const DATA_CLASSIFICATIONS = ['VERIFIED_INFORMATION', 'DEMONSTRATION_DATA', 'UNVERIFIED_INFORMATION'];

const ALLOWED_TRANSITIONS = {
  'Draft': ['Published', 'Archived', 'Removed'],
  'Published': ['Temporarily Hidden', 'Archived', 'Removed', 'Expired'],
  'Temporarily Hidden': ['Published', 'Archived', 'Removed'],
  'Archived': ['Published', 'Draft', 'Removed'],
  'Removed': ['Published'],
  'Expired': ['Published', 'Archived', 'Removed'],
  // Backward-compatible legacy states
  'Pending Verification': ['Published', 'Draft', 'Temporarily Hidden', 'Archived', 'Removed'],
  'Verified': ['Published', 'Temporarily Hidden', 'Archived', 'Removed'],
  'Rejected': ['Draft', 'Published', 'Archived', 'Removed']
};

const REPORT_REASONS = [
  'Incorrect information',
  'Outdated announcement',
  'Incorrect dates or venues',
  'Broken links',
  'Misleading descriptions',
  'Missing or incorrect contact information',
  'Duplicate announcements'
];

// Changes to these fields by an administrator trigger student correction notifications
const SIGNIFICANT_CORRECTION_FIELDS = [
  'Event_Date',
  'Event_Time',
  'Start_Time',
  'End_Time',
  'Venue',
  'Location',
  'Registration_Deadline',
  'Application_Deadline',
  'Expiry_Date',
  'Eligibility',
  'Eligibility_Warning',
  'Target_Audience',
  'Relevant_Year_Semester',
  'Relevant_Years',
  'Description'
];

const CATEGORY_OPTIONS = {
  Academics: ['Curriculum', 'Syllabus', 'Subjects', 'Timetable', 'Academic Calendar', 'Examinations', 'Regulations', 'Academic Documents'],
  Opportunities: ['Internship', 'Scholarship', 'Hackathon', 'Competition', 'Workshop', 'Training', 'Research', 'Online Course'],
  Events: ['Technical', 'Cultural', 'Academic', 'Sports', 'Workshop', 'Other'],
  Announcements: ['Official Notice', 'Department Notice', 'Academic', 'Administrative', 'Events', 'Opportunities'],
  Clubs: ['Technical', 'Cultural', 'Sports', 'Social Service', 'Entrepreneurship', 'Literary', 'Other'],
  Campus_Resources: ['Library', 'Laboratories', 'Facilities', 'Student Services', 'IT Support', 'Infrastructure']
};

const TABLE_META = {
  Departments: { key: 'Department_ID', prefix: 'DEP', label: 'Department_Name', friendly: 'Department' },
  Faculty: { key: 'Faculty_ID', prefix: 'FAC', label: 'Faculty_Name', friendly: 'Faculty' },
  Academics: { key: 'Academic_ID', prefix: 'ACA', label: 'Title', friendly: 'Academics' },
  Opportunities: { key: 'Opportunity_ID', prefix: 'OPP', label: 'Title', friendly: 'Opportunities' },
  Events: { key: 'Event_ID', prefix: 'EVT', label: 'Event_Name', friendly: 'Events' },
  Announcements: { key: 'Announcement_ID', prefix: 'ANN', label: 'Title', friendly: 'Announcements' },
  Clubs: { key: 'Club_ID', prefix: 'CLB', label: 'Club_Name', friendly: 'Clubs & Communities' },
  Administrative_Contacts: { key: 'Admin_ID', prefix: 'ADM', label: 'Office_Name', friendly: 'Administrative Offices' },
  Campus_Resources: { key: 'Resource_ID', prefix: 'RES', label: 'Resource_Name', friendly: 'Campus Services' },
  Verification_History: { key: 'History_ID', prefix: 'HIS', label: 'Record_ID', friendly: 'Audit History' },
  Student_Reports: { key: 'Report_ID', prefix: 'RPT', label: 'Record_Title', friendly: 'Student Reports' },
  Notifications: { key: 'Notification_ID', prefix: 'NTF', label: 'Title', friendly: 'Notifications' },
  Profile_Correction_Requests: { key: 'Request_ID', prefix: 'PCR', label: 'Field_Name', friendly: 'Profile Requests' }
};

const CONTENT_TABLES = ['Departments', 'Faculty', 'Academics', 'Opportunities', 'Events', 'Announcements', 'Clubs', 'Administrative_Contacts', 'Campus_Resources'];
const REPORTABLE_TABLES = ['Announcements', 'Events', 'Opportunities', 'Academics', 'Campus_Resources', 'Clubs'];
const FACULTY_PUBLISH_TABLES = ['Announcements', 'Opportunities', 'Academics', 'Events', 'Campus_Resources'];

const SUBMISSION_CATEGORIES = [
  { table: 'Announcements', title: 'Announcement', desc: 'Official notices, circulars, or department updates', icon: 'megaphone', facultyAllowed: true },
  { table: 'Opportunities', title: 'Opportunity', desc: 'Internships, scholarships, hackathons, or courses', icon: 'briefcase', facultyAllowed: true },
  { table: 'Academics', title: 'Academic Information', desc: 'Curriculum, syllabus, timetable, or exam calendar', icon: 'book-open', facultyAllowed: true },
  { table: 'Events', title: 'Campus Event', desc: 'Workshops, symposiums, cultural or sports events', icon: 'calendar-days', facultyAllowed: true },
  { table: 'Campus_Resources', title: 'Campus Resource', desc: 'Library, labs, facilities, or IT support details', icon: 'building-2', facultyAllowed: true },
  { table: 'Administrative_Contacts', title: 'Administrative Office', desc: 'Add or update campus office contact', icon: 'phone-call', facultyAllowed: false },
  { table: 'Clubs', title: 'Student Club', desc: 'Register a campus club or community', icon: 'sparkles', facultyAllowed: false }
];

const FORM_SCHEMAS = {
  Announcements: [
    { name: 'Title', label: 'Announcement Title', type: 'text', required: true, step: 2 },
    { name: 'Category', label: 'Category', type: 'category', required: true, step: 2 },
    { name: 'Department_ID', label: 'Department', type: 'dept', required: true, step: 2, facultyLocked: true },
    { name: 'Target_Audience', label: 'Target Audience', type: 'text', required: true, placeholder: 'e.g. All Students, 2nd Year CSE', step: 2 },
    { name: 'Relevant_Year_Semester', label: 'Relevant Year / Semester (Optional)', type: 'text', placeholder: 'e.g. All Semesters, 2nd Year / Sem III', step: 2 },
    { name: 'Publication_Date', label: 'Publication Date', type: 'date', required: true, step: 2 },
    { name: 'Event_Date', label: 'Event / Activity Date (Optional)', type: 'date', step: 2 },
    { name: 'Event_Time', label: 'Event / Activity Time (Optional)', type: 'text', placeholder: 'e.g. 10:00 AM – 12:30 PM', step: 2 },
    { name: 'Venue', label: 'Venue / Location (Optional)', type: 'text', placeholder: 'e.g. Seminar Hall 1 or Main Auditorium', step: 2 },
    { name: 'Registration_Deadline', label: 'Registration Deadline (Optional)', type: 'date', step: 2 },
    { name: 'Expiry_Date', label: 'Valid Until / Expiry Date (Optional)', type: 'date', step: 2 },
    { name: 'Description', label: 'Full Announcement Details', type: 'textarea', required: true, step: 2 },
    { name: 'Is_Urgent', label: 'Mark as Urgent Announcement (prioritises notifications for selected audience)', type: 'checkbox', step: 2 },
    { name: 'Attachments_Links', label: 'Attachment / External Link (HTTPS URL, Optional)', type: 'url', placeholder: 'https://...', step: 3 },
    { name: 'Source', label: 'Official Source / Circular Reference', type: 'text', required: true, placeholder: 'e.g. Department of CSE Circular #12', step: 3 }
  ],
  Opportunities: [
    { name: 'Title', label: 'Opportunity Title', type: 'text', required: true, step: 2 },
    { name: 'Organiser', label: 'Organiser / Institution', type: 'text', required: true, step: 2 },
    { name: 'Category', label: 'Opportunity Type', type: 'category', required: true, step: 2 },
    { name: 'Department_ID', label: 'Primary Department', type: 'dept', required: true, step: 2, facultyLocked: true },
    { name: 'Relevant_Departments', label: 'Eligible Departments', type: 'text', placeholder: 'e.g. All Engineering Departments or CSE, ECE', step: 2 },
    { name: 'Relevant_Years', label: 'Eligible Academic Years', type: 'text', placeholder: 'e.g. All Years, 2nd & 3rd Year, Final Year', step: 2 },
    { name: 'Eligibility', label: 'Eligibility Criteria', type: 'textarea', required: true, step: 2 },
    { name: 'Application_Deadline', label: 'Application Deadline (Leave blank if course-specific)', type: 'date', step: 2 },
    { name: 'Fee_Details', label: 'Fees (Free vs Paid)', type: 'text', placeholder: 'e.g. Free registration', step: 2 },
    { name: 'Stipend', label: 'Stipend / Prizes (Optional)', type: 'text', placeholder: 'e.g. ₹7,000/month', step: 2 },
    { name: 'Description', label: 'Description & Application Procedure', type: 'textarea', required: true, step: 2 },
    { name: 'Is_Urgent', label: 'Mark as Urgent Opportunity', type: 'checkbox', step: 2 },
    { name: 'Official_Source_URL', label: 'Official Source URL (HTTPS)', type: 'url', required: true, placeholder: 'https://...', step: 3 },
    { name: 'Application_URL', label: 'Application Portal URL (HTTPS)', type: 'url', required: true, placeholder: 'https://...', step: 3 },
    { name: 'Source', label: 'Source Name', type: 'text', required: true, placeholder: 'e.g. Official Organiser Portal', step: 3 }
  ],
  Academics: [
    { name: 'Title', label: 'Document Title', type: 'text', required: true, step: 2 },
    { name: 'Category', label: 'Document Type', type: 'category', required: true, step: 2 },
    { name: 'Department_ID', label: 'Department', type: 'dept', required: true, step: 2, facultyLocked: true },
    { name: 'Academic_Year', label: 'Academic Year', type: 'text', placeholder: 'e.g. 2026-2027', step: 2 },
    { name: 'Semester', label: 'Semester', type: 'text', placeholder: 'e.g. All, I, III, V', step: 2 },
    { name: 'Version', label: 'Version', type: 'text', required: true, placeholder: 'e.g. v1.0', step: 2 },
    { name: 'Description', label: 'Summary / Notes', type: 'textarea', required: true, step: 2 },
    { name: 'Is_Urgent', label: 'Mark as Urgent Academic Notice', type: 'checkbox', step: 2 },
    { name: 'Document_Link', label: 'Document Link (HTTPS URL)', type: 'url', placeholder: 'https://...', step: 3 },
    { name: 'Source', label: 'Issuing Authority / Source', type: 'text', required: true, placeholder: 'e.g. Academic Council / Department Office', step: 3 }
  ],
  Events: [
    { name: 'Event_Name', label: 'Event Name', type: 'text', required: true, step: 2 },
    { name: 'Category', label: 'Event Category', type: 'category', required: true, step: 2 },
    { name: 'Organizer', label: 'Organiser', type: 'text', required: true, step: 2 },
    { name: 'Department_ID', label: 'Hosting Department', type: 'dept', required: true, step: 2, facultyLocked: true },
    { name: 'Target_Audience', label: 'Target Audience (Optional)', type: 'text', placeholder: 'e.g. All Students, CSE & IT', step: 2 },
    { name: 'Relevant_Year_Semester', label: 'Relevant Year / Semester (Optional)', type: 'text', placeholder: 'e.g. All Years, 2nd & 3rd Year', step: 2 },
    { name: 'Event_Date', label: 'Event Date', type: 'date', required: true, step: 2 },
    { name: 'Start_Time', label: 'Start Time', type: 'text', placeholder: 'e.g. 10:00 AM', step: 2 },
    { name: 'End_Time', label: 'End Time', type: 'text', placeholder: 'e.g. 01:00 PM', step: 2 },
    { name: 'Venue', label: 'Venue or Online Mode', type: 'text', required: true, step: 2 },
    { name: 'Registration_Deadline', label: 'Registration Deadline (Optional)', type: 'date', step: 2 },
    { name: 'Description', label: 'Event Details & Eligibility', type: 'textarea', required: true, step: 2 },
    { name: 'Is_Urgent', label: 'Mark as Urgent Event Update', type: 'checkbox', step: 2 },
    { name: 'Registration_Link', label: 'Registration Link (HTTPS URL)', type: 'url', placeholder: 'https://...', step: 3 },
    { name: 'Source', label: 'Official Source', type: 'text', required: true, step: 3 }
  ],
  Campus_Resources: [
    { name: 'Resource_Name', label: 'Service / Facility Name', type: 'text', required: true, step: 2 },
    { name: 'Category', label: 'Service Category', type: 'category', required: true, step: 2 },
    { name: 'Location', label: 'Campus Location', type: 'text', required: true, step: 2 },
    { name: 'Responsible_Department', label: 'Responsible Office / Department', type: 'text', required: true, step: 2 },
    { name: 'Contact_Information', label: 'Official Contact (Optional)', type: 'text', step: 2 },
    { name: 'Availability_Information', label: 'Working Hours / Access Info', type: 'text', placeholder: 'e.g. Mon–Sat, 8:30 AM – 6:00 PM', step: 2 },
    { name: 'Description', label: 'Description', type: 'textarea', required: true, step: 2 },
    { name: 'Source', label: 'Official Source', type: 'text', required: true, step: 3 }
  ],
  Faculty: [
    { name: 'Faculty_Name', label: 'Faculty Name', type: 'text', required: true, step: 2 },
    { name: 'Employee_ID', label: 'Faculty / Employee ID', type: 'text', required: true, placeholder: 'e.g. HIT-FAC-009', step: 2 },
    { name: 'Official_Email', label: 'Official Email Address', type: 'email', required: true, placeholder: 'e.g. faculty@hit.edu.in', step: 2 },
    { name: 'Department_ID', label: 'Department', type: 'dept', required: true, step: 2 },
    { name: 'Designation', label: 'Designation', type: 'text', required: true, placeholder: 'e.g. Assistant Professor', step: 2 },
    { name: 'Qualifications', label: 'Qualifications', type: 'text', required: true, placeholder: 'e.g. Ph.D., M.E.', step: 2 },
    { name: 'Subjects_Handled', label: 'Subjects Handled', type: 'text', required: true, step: 2 },
    { name: 'Official_Contact', label: 'Official Contact Details', type: 'text', required: true, step: 2 },
    { name: 'Research_Interests', label: 'Research Interests (Optional)', type: 'text', step: 2 },
    { name: 'Photograph', label: 'Photograph URL (Optional, HTTPS)', type: 'url', placeholder: 'https://...', step: 3 },
    { name: 'Source', label: 'Official Source', type: 'text', required: true, step: 3 }
  ],
  Administrative_Contacts: [
    { name: 'Office_Name', label: 'Office Name', type: 'text', required: true, step: 2 },
    { name: 'Staff_Name', label: 'Contact Person (Optional)', type: 'text', step: 2 },
    { name: 'Designation', label: 'Designation', type: 'text', required: true, step: 2 },
    { name: 'Responsibilities', label: 'Responsibilities', type: 'textarea', required: true, step: 2 },
    { name: 'Official_Email', label: 'Official Email', type: 'email', step: 2 },
    { name: 'Official_Contact', label: 'Official Contact', type: 'text', step: 2 },
    { name: 'Office_Location', label: 'Office Location', type: 'text', step: 2 },
    { name: 'Working_Hours', label: 'Working Hours', type: 'text', step: 2 },
    { name: 'Source', label: 'Official Source', type: 'text', required: true, step: 3 }
  ],
  Clubs: [
    { name: 'Club_Name', label: 'Club Name', type: 'text', required: true, step: 2 },
    { name: 'Category', label: 'Club Category', type: 'category', required: true, step: 2 },
    { name: 'Department_ID', label: 'Associated Department', type: 'dept', required: true, step: 2 },
    { name: 'Description', label: 'Description', type: 'textarea', required: true, step: 2 },
    { name: 'Official_Contact', label: 'Contact Email', type: 'text', step: 2 },
    { name: 'Registration_Link', label: 'Join / Info Link (HTTPS)', type: 'url', step: 3 },
    { name: 'Source', label: 'Official Source', type: 'text', required: true, step: 3 }
  ]
};
