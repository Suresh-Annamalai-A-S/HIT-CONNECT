// HIT Connect — Data Service (Local Demo Storage + RBAC Validation + Reporting + Notifications + Audit Engine)

// ==================== DATABASE LOAD & MIGRATION ====================
function cloneInitial() {
  const cloned = JSON.parse(JSON.stringify(INITIAL_DB));
  cloned.Faculty_Accounts = buildInitialFacultyAccounts();
  return cloned;
}

function loadDB() {
  const fallback = cloneInitial();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return fallback;

    const db = {};
    CONTENT_TABLES.forEach((t) => {
      db[t] = Array.isArray(parsed[t]) ? parsed[t] : fallback[t];
      db[t].forEach((r) => {
        if (r.Data_Classification === 'PENDING_VERIFICATION' || !DATA_CLASSIFICATIONS.includes(r.Data_Classification)) {
          const src = String(r.Source || '').toUpperCase();
          r.Data_Classification = (src.includes('DEMO') || src.includes('SAMPLE')) ? 'DEMONSTRATION_DATA' : 'UNVERIFIED_INFORMATION';
        }
        if (!STATUS_OPTIONS.includes(r.Verification_Status)) r.Verification_Status = 'Draft';
        if (typeof r.Is_Demo !== 'boolean') {
          r.Is_Demo = r.Data_Classification === 'DEMONSTRATION_DATA';
        }
      });
    });

    db.Student_Profiles = Array.isArray(parsed.Student_Profiles) ? parsed.Student_Profiles : fallback.Student_Profiles;
    db.Verification_History = Array.isArray(parsed.Verification_History) ? parsed.Verification_History : fallback.Verification_History;
    db.Faculty_Accounts = (Array.isArray(parsed.Faculty_Accounts) && parsed.Faculty_Accounts.length) ? parsed.Faculty_Accounts : fallback.Faculty_Accounts;
    db.Student_Reports = Array.isArray(parsed.Student_Reports) ? parsed.Student_Reports : fallback.Student_Reports;
    db.Notifications = Array.isArray(parsed.Notifications) ? parsed.Notifications : fallback.Notifications;
    db.Profile_Correction_Requests = Array.isArray(parsed.Profile_Correction_Requests) ? parsed.Profile_Correction_Requests : fallback.Profile_Correction_Requests;

    // Ensure Departments and Faculty have refined fields
    const deptIds = new Set(db.Departments.map((d) => d.Department_ID));
    INITIAL_DEPARTMENTS.forEach((d) => { if (!deptIds.has(d.Department_ID)) db.Departments.push({ ...d }); });

    (db.Faculty || []).forEach((f, idx) => {
      if (!f.Employee_ID) f.Employee_ID = `HIT-${f.Faculty_ID || ('FAC-' + String(idx + 1).padStart(3, '0'))}`;
      if (!f.Account_Status) f.Account_Status = 'Active';
      if (!f.Permissions || typeof f.Permissions !== 'object') f.Permissions = { ...DEFAULT_FACULTY_PERMISSIONS };
      if (typeof f.Has_Login_Account !== 'boolean') {
        f.Has_Login_Account = db.Faculty_Accounts.some((a) => a.linkedPersonId === f.Faculty_ID);
      }
    });

    // Backward-compatible attribution migration
    const defaultContactByTable = {
      Academics: 'ADM-001',
      Opportunities: 'ADM-005',
      Events: 'FAC-001',
      Announcements: 'ADM-001',
      Clubs: 'ADM-004',
      Campus_Resources: 'ADM-006'
    };
    ['Academics', 'Opportunities', 'Events', 'Announcements', 'Clubs', 'Campus_Resources'].forEach((t) => {
      (db[t] || []).forEach((r) => {
        if (!r.Contributor_ID) {
          r.Contributor_ID = r.Created_By_User_ID === 'DEMO-FAC-001' ? 'FAC-001' : (r.Created_By_User_ID === 'DEMO-FAC-002' ? 'FAC-002' : (r.Created_By_User_ID === 'DEMO-ADM-001' ? 'ADM-001' : (t === 'Opportunities' ? 'ADM-005' : 'FAC-002')));
        }
        if (!r.Clarification_Contact_ID) r.Clarification_Contact_ID = defaultContactByTable[t] || 'ADM-001';
        if (!r.Publisher_ID && (r.Verification_Status === 'Published' || r.Verification_Status === 'Verified')) {
          r.Publisher_ID = r.Contributor_ID || 'ADM-001';
        }
        if (!r.Created_At) r.Created_At = r.Publication_Date || r.Last_Updated || '2026-11-26';
      });
    });

    return db;
  } catch (e) {
    return fallback;
  }
}

// ==================== ATTRIBUTION & CLARIFICATION CONTACT ENGINE ====================
function isDemoOrPlaceholderContact(val) {
  const s = String(val || '').trim().toLowerCase();
  if (!s) return true;
  return s.includes('demo') || s.includes('example.com') || s.includes('placeholder') || s.includes('pending') || s.includes('00000');
}

function resolveLinkedPerson(personId) {
  if (!personId || personId === 'UNAVAILABLE') return null;
  const fac = (state.db.Faculty || []).find((f) => f.Faculty_ID === personId);
  if (fac) {
    return {
      id: fac.Faculty_ID,
      employeeId: fac.Employee_ID || fac.Faculty_ID,
      table: 'Faculty',
      type: 'Faculty',
      name: fac.Faculty_Name,
      designation: fac.Designation || 'Faculty Member',
      department: getDeptFullName(fac.Department_ID),
      departmentCode: getDeptBadgeText(fac.Department_ID),
      email: fac.Official_Email || '',
      phone: fac.Official_Contact || '',
      isDemo: isDemoRecord(fac)
    };
  }
  const adm = (state.db.Administrative_Contacts || []).find((a) => a.Admin_ID === personId);
  if (adm) {
    return {
      id: adm.Admin_ID,
      table: 'Administrative_Contacts',
      type: 'Administrative Office',
      name: adm.Staff_Name ? `${adm.Staff_Name} — ${adm.Office_Name}` : adm.Office_Name,
      shortName: adm.Office_Name,
      designation: adm.Designation || 'Administrative Office',
      department: adm.Office_Name,
      departmentCode: adm.Office_Name,
      email: adm.Official_Email || '',
      phone: adm.Official_Contact || '',
      location: adm.Office_Location || '',
      hours: adm.Working_Hours || '',
      isDemo: isDemoRecord(adm)
    };
  }
  const dep = (state.db.Departments || []).find((d) => d.Department_ID === personId);
  if (dep) {
    return {
      id: dep.Department_ID,
      table: 'Departments',
      type: 'Department',
      name: dep.Department_Name,
      designation: 'Department Office',
      department: dep.Department_Name,
      departmentCode: dep.Department_Code,
      email: dep.Official_Email || '',
      phone: dep.Official_Contact || '',
      isDemo: isDemoRecord(dep)
    };
  }
  return null;
}

function getAllContactOptions() {
  const opts = [];
  (state.db.Faculty || []).filter((f) => (f.Account_Status || 'Active') === 'Active').forEach((f) => {
    opts.push({ id: f.Faculty_ID, label: `${f.Faculty_Name} (${getDeptBadgeText(f.Department_ID)} · Faculty)` });
  });
  (state.db.Administrative_Contacts || []).forEach((a) => opts.push({ id: a.Admin_ID, label: `${a.Office_Name} (Admin Office)` }));
  (state.db.Departments || []).forEach((d) => opts.push({ id: d.Department_ID, label: `${d.Department_Code} Department Office` }));
  opts.push({ id: 'UNAVAILABLE', label: 'Contact currently unavailable (Department Office fallback)' });
  return opts;
}

function getRecordAttribution(table, rec) {
  const contributor = resolveLinkedPerson(rec.Contributor_ID || (rec.Created_By_User_ID === 'DEMO-FAC-001' ? 'FAC-001' : (rec.Created_By_User_ID === 'DEMO-FAC-002' ? 'FAC-002' : 'ADM-001')));
  const publisher = resolveLinkedPerson(rec.Publisher_ID || (rec.Verification_Status === 'Published' ? (rec.Contributor_ID || 'ADM-001') : ''));
  const contact = resolveLinkedPerson(rec.Clarification_Contact_ID || rec.Contributor_ID || rec.Department_ID);
  return {
    contributor,
    publisher,
    contact,
    addedOn: rec.Created_At || rec.Publication_Date || rec.Last_Updated || '—',
    lastUpdated: rec.Last_Updated || '—',
    publishedOn: rec.Published_At || (rec.Verification_Status === 'Published' ? (rec.Publication_Date || rec.Last_Updated || '—') : '')
  };
}

function renderClarificationContactBlock(contact, rec) {
  if (!contact || rec.Clarification_Contact_ID === 'UNAVAILABLE') {
    return `
      <div class="rounded-xl glass-subtle p-4 space-y-2 border-l-4 border-l-crimson-600">
        <div class="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-crimson-700">
          <i data-lucide="help-circle" class="w-4 h-4" aria-hidden="true"></i> Need clarification?
        </div>
        <p class="text-xs text-[#64748B] leading-relaxed">Contact details are currently unavailable. Please check with your department office.</p>
      </div>
    `;
  }
  const canEmail = isValidEmail(contact.email) && !isDemoOrPlaceholderContact(contact.email);
  const cleanPhone = String(contact.phone || '').replace(/[^\d+]/g, '');
  const canCall = cleanPhone.length >= 10 && !isDemoOrPlaceholderContact(contact.phone);

  return `
    <div class="rounded-xl glass-subtle p-4 space-y-3 border-l-4 border-l-crimson-600">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-crimson-700">
          <i data-lucide="help-circle" class="w-4 h-4" aria-hidden="true"></i> Official Contact for Clarification
        </div>
        ${contact.isDemo ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gold-50 text-gold-800 border border-gold-200">DEMO DATA — NOT OFFICIAL</span>` : ''}
      </div>
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-crimson-50 text-crimson-700 border border-crimson-200 font-bold text-xs flex items-center justify-center shrink-0">${escapeHtml(getInitials(contact.name))}</div>
        <div class="min-w-0">
          <div class="text-sm font-bold text-[#18212F]">${escapeHtml(contact.name)}</div>
          <div class="text-xs text-[#64748B]">${escapeHtml(contact.designation)} &middot; ${escapeHtml(contact.department)}</div>
        </div>
      </div>
      <div class="text-xs space-y-1 text-[#18212F]">
        <div><span class="text-[#64748B] font-medium">Email:</span> ${escapeHtml(contact.email || 'Not available')}</div>
        <div><span class="text-[#64748B] font-medium">Phone:</span> ${escapeHtml(contact.phone || 'Not available')}</div>
        ${contact.location ? `<div><span class="text-[#64748B] font-medium">Office:</span> ${escapeHtml(contact.location)}</div>` : ''}
      </div>
      <div class="flex flex-wrap items-center gap-2 pt-1">
        ${canEmail ? `<a href="mailto:${escapeHtml(contact.email)}" class="min-h-[38px] px-3.5 rounded-xl glass-btn-primary text-xs font-semibold inline-flex items-center gap-1.5"><i data-lucide="mail" class="w-3.5 h-3.5"></i> Email</a>` : ''}
        ${canCall ? `<a href="tel:${escapeHtml(cleanPhone)}" class="min-h-[38px] px-3.5 rounded-xl glass-btn-navy text-xs font-semibold inline-flex items-center gap-1.5"><i data-lucide="phone" class="w-3.5 h-3.5"></i> Call</a>` : ''}
        <button type="button" data-open-table="${escapeHtml(contact.table)}" data-open-id="${escapeHtml(contact.id)}" class="linked-profile-btn min-h-[38px] px-3.5 rounded-xl glass-btn-secondary text-xs font-semibold inline-flex items-center gap-1.5 text-crimson-700 border-crimson-200">
          <i data-lucide="user-circle" class="w-3.5 h-3.5"></i> View Profile
        </button>
      </div>
      ${(!canEmail && !canCall) ? `<p class="text-[11px] text-[#64748B]">Direct email/call links are disabled for demonstration placeholders.</p>` : ''}
    </div>
  `;
}

// ==================== SECURITY & PERMISSION VALIDATION ENGINE ====================
function getCurrentFacultyProfile() {
  if (!state.session || state.session.role !== 'faculty') return null;
  return (state.db.Faculty || []).find((f) => f.Faculty_ID === state.session.linkedPersonId) || null;
}

function isFacultyAccountActive() {
  if (!state.session || state.session.role !== 'faculty') return false;
  const fac = getCurrentFacultyProfile();
  return Boolean(fac && (fac.Account_Status || 'Active') === 'Active');
}

function hasFacultyPermission(permKey) {
  if (!state.session) return false;
  if (state.session.role === 'administrator') return true;
  if (state.session.role !== 'faculty') return false;
  const fac = getCurrentFacultyProfile();
  if (!fac || (fac.Account_Status || 'Active') !== 'Active') return false;
  const perms = { ...DEFAULT_FACULTY_PERMISSIONS, ...(fac.Permissions || {}) };
  return Boolean(perms[permKey]);
}

function isOwnedByCurrentFaculty(rec) {
  if (!state.session || state.session.role !== 'faculty' || !rec) return false;
  return rec.Created_By_User_ID === state.session.userId || (state.session.linkedPersonId && rec.Contributor_ID === state.session.linkedPersonId);
}

function canReviseRecord(rec, tableName) {
  if (!state.session || !rec) return false;
  if (state.session.role === 'administrator') return true;
  if (state.session.role === 'faculty') {
    if (!isFacultyAccountActive() || !hasFacultyPermission('canEditOwn')) return false;
    if (tableName && !FACULTY_PUBLISH_TABLES.includes(tableName)) return false;
    if (!isOwnedByCurrentFaculty(rec)) return false;
    // Faculty cannot bypass administrator Hide or Remove restrictions
    if (rec.Verification_Status === 'Temporarily Hidden' || rec.Verification_Status === 'Removed') return false;
    return true;
  }
  return false;
}

function canArchiveOwnRecord(rec, tableName) {
  if (!state.session || !rec) return false;
  if (state.session.role === 'faculty') {
    if (!isFacultyAccountActive() || !hasFacultyPermission('canArchiveOwn')) return false;
    if (tableName && !FACULTY_PUBLISH_TABLES.includes(tableName)) return false;
    return isOwnedByCurrentFaculty(rec) && rec.Verification_Status === 'Published';
  }
  return false;
}

function isVisibleInCurrentMode(record, tableName) {
  if (!state.session || !record) return false;
  if (canViewAllStatuses()) return true;
  const st = record.Verification_Status;

  // Faculty sees Published content + their own records in any status
  if (state.session.role === 'faculty') {
    if (tableName === 'Faculty') return (record.Account_Status || 'Active') === 'Active' || record.Faculty_ID === state.session.linkedPersonId;
    if (st === 'Published' || st === 'Verified') return true;
    if (isOwnedByCurrentFaculty(record)) return true;
    return false;
  }

  // Student sees ONLY Published content (never Draft, Temporarily Hidden, Removed, Pending Verification, or Rejected)
  if (tableName === 'Departments') return record.Department_Status === 'Active';
  if (tableName === 'Faculty') return (st === 'Published' || st === 'Verified') && (record.Account_Status || 'Active') === 'Active';
  if (st === 'Published' || st === 'Verified') return true;
  if (tableName === 'Academics' && st === 'Archived' && state.showArchivedAcademics) return true;
  return false;
}

function matchesDepartment(record, tableName, deptId) {
  if (!deptId || deptId === 'ALL') return true;
  const code = getDeptBadgeText(deptId).toLowerCase();
  if (tableName === 'Opportunities') {
    const rel = String(record.Relevant_Departments || '').toLowerCase();
    if (rel.includes('all engineering') || rel.includes('all streams') || rel.includes(code)) return true;
    return record.Department_ID === deptId;
  }
  if (record.Department_ID) return record.Department_ID === deptId;
  return true;
}

function matchesFilters(record, tableName) {
  if (!isVisibleInCurrentMode(record, tableName)) return false;
  if (!matchesDepartment(record, tableName, state.deptFilter)) return false;
  const q = state.searchQuery.trim().toLowerCase();
  if (!q) return true;
  const deptName = record.Department_ID ? getDeptFullName(record.Department_ID).toLowerCase() : '';
  const text = Object.values(record).join(' ').toLowerCase() + ' ' + deptName;
  return text.includes(q);
}

// ==================== IMMUTABLE AUDIT HISTORY ENGINE ====================
function generateUniqueId(table) {
  const meta = TABLE_META[table];
  let max = 0;
  (state.db[table] || []).forEach((r) => {
    const m = String(r[meta.key] || '').match(new RegExp(`^${meta.prefix}-(\\d+)$`));
    if (m) max = Math.max(max, parseInt(m[1], 10));
  });
  return `${meta.prefix}-${String(max + 1).padStart(3, '0')}`;
}

function logAuditEvent({ actionType, table, recordId, prevStatus, nextStatus, prevValue, nextValue, remarks, reason }) {
  if (!Array.isArray(state.db.Verification_History)) state.db.Verification_History = [];
  state.db.Verification_History.push({
    History_ID: generateUniqueId('Verification_History'),
    Action_Type: actionType || 'UPDATE',
    Record_ID: recordId,
    Table_Name: table,
    Previous_Status: prevStatus || 'New',
    New_Status: nextStatus || prevStatus || 'Updated',
    Previous_Value: prevValue !== undefined ? prevValue : null,
    Updated_Value: nextValue !== undefined ? nextValue : null,
    Action_By: currentActorLabel(),
    Actor_Role: state.session ? state.session.role : 'system',
    Action_Date: nowLocalTimestamp(),
    Remarks: remarks || reason || '',
    Reason: reason || remarks || '',
    Reference_State: 'Active',
    Is_Demo: isDemoEnvironment()
  });
}

function logVerificationHistory(table, recordId, prev, next, remarks) {
  logAuditEvent({
    actionType: 'STATUS_CHANGE',
    table,
    recordId,
    prevStatus: prev,
    nextStatus: next,
    remarks,
    reason: remarks
  });
}

// ==================== NOTIFICATIONS ENGINE ====================
function createNotification({ recipientRole, recipientDepartmentId, recipientUserId, recordId, tableName, type, title, message, isUrgent }) {
  if (!Array.isArray(state.db.Notifications)) state.db.Notifications = [];
  const notif = {
    Notification_ID: generateUniqueId('Notifications'),
    Recipient_Role: recipientRole,
    Recipient_Department_ID: recipientDepartmentId || 'ALL',
    Recipient_User_ID: recipientUserId || '',
    Record_ID: recordId || '',
    Table_Name: tableName || '',
    Notification_Type: type || 'correction',
    Title: title,
    Message: message,
    Is_Urgent: Boolean(isUrgent),
    Read_By: [],
    Created_At: nowLocalTimestamp(),
    Is_Demo: isDemoEnvironment()
  };
  state.db.Notifications.unshift(notif);
  return notif;
}

function getNotificationsForCurrentUser() {
  if (!state.session) return [];
  const role = state.session.role;
  const uid = state.session.userId;
  const deptId = state.session.departmentId;
  return (state.db.Notifications || []).filter((n) => {
    if (n.Recipient_Role !== role) return false;
    if (n.Recipient_User_ID && n.Recipient_User_ID !== uid && n.Recipient_User_ID !== state.session.linkedPersonId) return false;
    if (role === 'student' && n.Recipient_Department_ID && n.Recipient_Department_ID !== 'ALL' && n.Recipient_Department_ID !== deptId) return false;
    return true;
  });
}

function markNotificationRead(notificationId) {
  if (!state.session) return;
  const n = (state.db.Notifications || []).find((x) => x.Notification_ID === notificationId);
  if (!n) return;
  if (!Array.isArray(n.Read_By)) n.Read_By = [];
  if (!n.Read_By.includes(state.session.userId)) {
    n.Read_By.push(state.session.userId);
    saveDB();
  }
}

// ==================== DIRECT PUBLISHING & EDITING ENGINE ====================
function publishOrSaveRecord(table, formData, options = {}) {
  if (!state.session) return { ok: false, error: 'Authentication required.' };
  const role = state.session.role;
  if (role === 'student') return { ok: false, error: 'Students do not have publishing permissions.' };

  if (role === 'faculty') {
    if (!isFacultyAccountActive()) return { ok: false, error: 'Your faculty account is not active. Publishing is disabled.' };
    if (!FACULTY_PUBLISH_TABLES.includes(table)) return { ok: false, error: 'Faculty accounts are not permitted to modify this category.' };
    if (!options.editId && !hasFacultyPermission('canPublish')) return { ok: false, error: 'Your account does not currently have publishing permission.' };
    if (formData.Is_Urgent && !hasFacultyPermission('canMarkUrgent')) return { ok: false, error: 'Your account does not currently have permission to mark announcements as urgent.' };
  }

  const meta = TABLE_META[table];
  if (!meta) return { ok: false, error: 'Invalid record category.' };

  const targetStatus = options.targetStatus === 'Draft' ? 'Draft' : 'Published';
  const nowDate = todayLocalISO();
  const nowTs = nowLocalTimestamp();

  // Enforce authenticated identity on backend (never trust user-editable form fields for protected faculty identity)
  const sanitized = { ...formData };
  if (role === 'faculty') {
    const facProfile = getCurrentFacultyProfile();
    if (facProfile) {
      sanitized.Department_ID = facProfile.Department_ID;
    }
  }
  sanitized.Is_Urgent = Boolean(sanitized.Is_Urgent);

  if (options.editId) {
    const idx = (state.db[table] || []).findIndex((r) => r[meta.key] === options.editId);
    if (idx < 0) return { ok: false, error: 'Record not found.' };
    const existing = state.db[table][idx];
    if (!canReviseRecord(existing, table)) {
      return { ok: false, error: 'You do not have permission to edit this record.' };
    }
    const diff = computeRecordDiff(table, existing, sanitized);
    if (role === 'administrator' && (!options.correctionReason || options.correctionReason.trim().length < 3)) {
      return { ok: false, error: 'Please provide a clear reason for this administrative edit or correction.' };
    }

    const updated = {
      ...existing,
      ...sanitized,
      Verification_Status: existing.Verification_Status === 'Draft' ? targetStatus : existing.Verification_Status,
      Last_Updated: nowDate,
      Last_Action_Remarks: options.correctionReason ? options.correctionReason.trim() : existing.Last_Action_Remarks
    };
    if (updated.Verification_Status === 'Published' && !updated.Published_At) {
      updated.Published_At = nowTs;
      updated.Publisher_ID = updated.Publisher_ID || state.session.linkedPersonId || state.session.userId;
    }

    state.db[table][idx] = updated;

    const prevVals = {};
    const nextVals = {};
    diff.forEach((d) => { prevVals[d.field] = d.before; nextVals[d.field] = d.after; });

    logAuditEvent({
      actionType: role === 'administrator' ? 'ADMIN_CORRECTION' : 'FACULTY_EDIT',
      table,
      recordId: options.editId,
      prevStatus: existing.Verification_Status,
      nextStatus: updated.Verification_Status,
      prevValue: prevVals,
      nextValue: nextVals,
      remarks: options.correctionReason || (role === 'administrator' ? 'Administrator corrected published information.' : 'Faculty updated own publication.'),
      reason: options.correctionReason || 'Author edit'
    });

    // Notify affected students ONLY when an administrator corrects significant details (and not marked minor formatting)
    const hasSignificant = diff.some((d) => d.isSignificant);
    if (role === 'administrator' && updated.Verification_Status === 'Published') {
      if (hasSignificant && options.notifyStudents !== false) {
        const changedNames = diff.filter((d) => d.isSignificant).map((d) => d.label).join(', ');
        const audienceDept = String(updated.Target_Audience || updated.Relevant_Departments || '').toLowerCase().includes('all') ? 'ALL' : (updated.Department_ID || 'ALL');
        createNotification({
          recipientRole: 'student',
          recipientDepartmentId: audienceDept,
          recordId: options.editId,
          tableName: table,
          type: 'correction',
          title: `Updated: ${updated[meta.label]}`,
          message: `Important details (${changedNames}) were corrected by Administration. Reason: ${options.correctionReason.trim()}`,
          isUrgent: Boolean(updated.Is_Urgent)
        });
      }
      // Notify original faculty author about admin correction
      if (existing.Created_By_User_ID && existing.Created_By_User_ID !== state.session.userId) {
        createNotification({
          recipientRole: 'faculty',
          recipientUserId: existing.Created_By_User_ID,
          recordId: options.editId,
          tableName: table,
          type: 'admin_correction',
          title: `Administrator Corrected: ${updated[meta.label]}`,
          message: `An Administrator updated your post. Reason: ${options.correctionReason.trim()}`,
          isUrgent: false
        });
      }
    }

    saveDB();
    return { ok: true, id: options.editId, record: updated, notifiedStudents: Boolean(role === 'administrator' && hasSignificant && options.notifyStudents !== false) };
  }

  // Creating a brand-new record (direct publish or draft)
  const newId = generateUniqueId(table);
  const newRec = {
    [meta.key]: newId,
    ...sanitized,
    Contributor_ID: state.session.linkedPersonId || state.session.userId,
    Clarification_Contact_ID: sanitized.Clarification_Contact_ID || state.session.linkedPersonId || 'ADM-001',
    Publisher_ID: targetStatus === 'Published' ? (state.session.linkedPersonId || state.session.userId) : '',
    Data_Classification: isDemoEnvironment() ? 'DEMONSTRATION_DATA' : 'VERIFIED_INFORMATION',
    Verification_Status: targetStatus,
    Is_Demo: isDemoEnvironment(),
    Created_By_User_ID: state.session.userId,
    Created_At: nowTs,
    Published_At: targetStatus === 'Published' ? nowTs : '',
    Last_Updated: nowDate
  };

  state.db[table].push(newRec);

  logAuditEvent({
    actionType: targetStatus === 'Published' ? 'PUBLISH' : 'CREATE_DRAFT',
    table,
    recordId: newId,
    prevStatus: 'New',
    nextStatus: targetStatus,
    prevValue: null,
    nextValue: { Title: newRec[meta.label], Department_ID: newRec.Department_ID || '', Is_Urgent: newRec.Is_Urgent, Verification_Status: targetStatus },
    remarks: targetStatus === 'Published'
      ? `Published directly by ${role === 'faculty' ? 'Faculty' : 'Administrator'} after mandatory confirmation summary.`
      : 'Saved as Draft.',
    reason: targetStatus === 'Published' ? 'Direct publication confirmed' : 'Draft saved'
  });

  // Scoped Urgent Notification (avoid unrelated departments!)
  if (targetStatus === 'Published' && newRec.Is_Urgent) {
    const audienceText = String(newRec.Target_Audience || newRec.Relevant_Departments || '').toLowerCase();
    const targetDept = (audienceText.includes('all students') || audienceText.includes('all engineering') || audienceText.includes('campus-wide'))
      ? 'ALL'
      : (newRec.Department_ID || 'ALL');
    createNotification({
      recipientRole: 'student',
      recipientDepartmentId: targetDept,
      recordId: newId,
      tableName: table,
      type: 'urgent',
      title: `URGENT: ${newRec[meta.label]}`,
      message: `Published by ${state.session.name} (${getDeptBadgeText(newRec.Department_ID)}) at ${nowTs}.`,
      isUrgent: true
    });
  }

  saveDB();
  return { ok: true, id: newId, record: newRec };
}

// ==================== POST-PUBLICATION MODERATION & ARCHIVING ====================
function canTransition(currentStatus, targetStatus) {
  const p = getCurrentPermissions();
  if (!p) return false;
  return (ALLOWED_TRANSITIONS[currentStatus] || []).includes(targetStatus) && p.allowedTargets.includes(targetStatus);
}

function transitionRecordStatus(table, id, targetStatus, remarks, newClassification) {
  if (!state.session) return { ok: false, error: 'Authentication required.' };
  const meta = TABLE_META[table];
  const rec = (state.db[table] || []).find((r) => r[meta.key] === id);
  if (!rec) return { ok: false, error: 'Record not found.' };

  if (state.session.role === 'student') return { ok: false, error: 'Students cannot change publication status.' };
  if (state.session.role === 'faculty') {
    if (!isFacultyAccountActive()) return { ok: false, error: 'Your faculty account is not active.' };
    if (!isOwnedByCurrentFaculty(rec)) return { ok: false, error: 'Faculty can only manage their own publications.' };
    if (rec.Verification_Status === 'Temporarily Hidden' || rec.Verification_Status === 'Removed') {
      return { ok: false, error: 'This record was restricted by an Administrator and cannot be modified by faculty.' };
    }
    if (targetStatus === 'Archived' && !hasFacultyPermission('canArchiveOwn')) {
      return { ok: false, error: 'Your account does not have permission to archive posts.' };
    }
    if (!['Published', 'Archived', 'Draft'].includes(targetStatus)) {
      return { ok: false, error: 'Action permitted only for Administrators.' };
    }
  }

  if (!canTransition(rec.Verification_Status, targetStatus)) {
    return { ok: false, error: 'Action not permitted for your role or current lifecycle state.' };
  }

  const requiresReason = ['Temporarily Hidden', 'Removed', 'Archived', 'Rejected'].includes(targetStatus);
  if (requiresReason && (!remarks || remarks.trim().length < 3)) {
    return { ok: false, error: `Please provide a clear reason (at least 3 characters) to mark as ${targetStatus}.` };
  }

  const prev = rec.Verification_Status;
  rec.Verification_Status = targetStatus;
  rec.Last_Updated = todayLocalISO();
  rec.Reviewed_By = currentActorLabel();
  if (remarks && remarks.trim()) rec.Last_Action_Remarks = remarks.trim();

  if (targetStatus === 'Temporarily Hidden') rec.Hidden_Reason = remarks.trim();
  if (targetStatus === 'Removed') rec.Removal_Reason = remarks.trim();
  if (targetStatus === 'Published') {
    rec.Hidden_Reason = '';
    if (!rec.Published_At) rec.Published_At = nowLocalTimestamp();
  }

  if (state.session.role === 'administrator' && newClassification && DATA_CLASSIFICATIONS.includes(newClassification)) {
    rec.Data_Classification = newClassification;
  }

  const actionTypeMap = {
    'Temporarily Hidden': 'HIDE',
    'Removed': 'REMOVE',
    'Published': prev === 'Temporarily Hidden' || prev === 'Removed' || prev === 'Archived' ? 'RESTORE' : 'PUBLISH',
    'Archived': 'ARCHIVE'
  };

  logAuditEvent({
    actionType: actionTypeMap[targetStatus] || 'STATUS_CHANGE',
    table,
    recordId: id,
    prevStatus: prev,
    nextStatus: targetStatus,
    prevValue: { Verification_Status: prev },
    nextValue: { Verification_Status: targetStatus },
    remarks: (remarks || '').trim() || `Changed status to ${targetStatus}.`,
    reason: (remarks || '').trim() || `Changed status to ${targetStatus}.`
  });

  // Notify faculty author if an administrator hides, removes, or restores their post
  if (state.session.role === 'administrator' && rec.Created_By_User_ID && rec.Created_By_User_ID !== state.session.userId) {
    createNotification({
      recipientRole: 'faculty',
      recipientUserId: rec.Created_By_User_ID,
      recordId: id,
      tableName: table,
      type: 'admin_correction',
      title: `Post ${targetStatus}: ${rec[meta.label]}`,
      message: `Administrator marked your post as "${targetStatus}". Reason: ${(remarks || '').trim() || 'Administrative moderation.'}`,
      isUrgent: false
    });
  }

  saveDB();
  return { ok: true };
}

// ==================== STUDENT REPORTING ENGINE (PRIVATE, RATE-LIMITED, NON-DESTRUCTIVE) ====================
function submitStudentReport(table, recordId, reason, explanation) {
  if (!state.session || state.session.role !== 'student') {
    return { ok: false, error: 'Only students can submit information reports.' };
  }
  if (!REPORTABLE_TABLES.includes(table)) {
    return { ok: false, error: 'This item type cannot be reported.' };
  }
  const meta = TABLE_META[table];
  const rec = (state.db[table] || []).find((r) => r[meta.key] === recordId);
  if (!rec || rec.Verification_Status !== 'Published') {
    return { ok: false, error: 'Reported information item is not available.' };
  }
  if (!REPORT_REASONS.includes(reason)) {
    return { ok: false, error: 'Please select a valid reporting reason.' };
  }

  if (!Array.isArray(state.db.Student_Reports)) state.db.Student_Reports = [];
  const nowMs = Date.now();

  // Duplicate check: same student cannot file another active report for the same record
  const dup = state.db.Student_Reports.find((r) =>
    r.Table_Name === table &&
    r.Record_ID === recordId &&
    r.Reported_By_User_ID === state.session.userId &&
    (r.Status === 'Open' || r.Status === 'Under Investigation')
  );
  if (dup) {
    return { ok: false, error: 'You have already submitted an open report for this item. An Administrator will review it.' };
  }

  // Rate limit: max 5 reports per student within 10 minutes
  const recentCount = state.db.Student_Reports.filter((r) =>
    r.Reported_By_User_ID === state.session.userId &&
    (nowMs - (r.Created_Ms || 0)) < 10 * 60 * 1000
  ).length;
  if (recentCount >= 5) {
    return { ok: false, error: 'Rate limit reached: you can submit up to 5 reports every 10 minutes.' };
  }

  const report = {
    Report_ID: generateUniqueId('Student_Reports'),
    Record_ID: recordId,
    Table_Name: table,
    Record_Title: rec[meta.label] || recordId,
    Original_Author_ID: rec.Contributor_ID || rec.Created_By_User_ID || 'ADM-001',
    Reason: reason,
    Explanation: String(explanation || '').trim().slice(0, 600),
    Reported_By_User_ID: state.session.userId,
    Reported_By_Label: `${state.session.name || 'Student'} (${state.session.userId})`,
    Status: 'Open',
    Admin_Action_Notes: '',
    Resolved_By: '',
    Resolved_At: '',
    Created_At: nowLocalTimestamp(),
    Created_Ms: nowMs,
    Is_Demo: isDemoEnvironment()
  };

  state.db.Student_Reports.unshift(report);

  // Notify responsible faculty author privately (does NOT remove or hide the announcement!)
  if (rec.Created_By_User_ID) {
    createNotification({
      recipientRole: 'faculty',
      recipientUserId: rec.Created_By_User_ID,
      recordId,
      tableName: table,
      type: 'report_alert',
      title: `Student Report Received: ${report.Record_Title}`,
      message: `A student reported "${reason}" on your post. The Administrator will review it; your post remains published unless moderated.`,
      isUrgent: false
    });
  }

  saveDB();
  return { ok: true, report };
}

function adminResolveReport(reportId, newStatus, notes) {
  if (!state.session || state.session.role !== 'administrator') {
    return { ok: false, error: 'Only Administrators can manage student reports.' };
  }
  const rep = (state.db.Student_Reports || []).find((r) => r.Report_ID === reportId);
  if (!rep) return { ok: false, error: 'Report not found.' };
  if (!notes || notes.trim().length < 3) {
    return { ok: false, error: 'Please provide a brief reason or resolution note (at least 3 characters).' };
  }
  const prevStatus = rep.Status;
  rep.Status = newStatus;
  rep.Admin_Action_Notes = notes.trim();
  rep.Resolved_By = currentActorLabel();
  rep.Resolved_At = nowLocalTimestamp();

  logAuditEvent({
    actionType: 'REPORT_' + newStatus.toUpperCase().replace(/\s+/g, '_'),
    table: 'Student_Reports',
    recordId: reportId,
    prevStatus,
    nextStatus: newStatus,
    prevValue: { Status: prevStatus },
    nextValue: { Status: newStatus, Target_Record: `${rep.Table_Name}:${rep.Record_ID}` },
    remarks: `Student report on ${rep.Record_Title} marked ${newStatus}.`,
    reason: notes.trim()
  });

  saveDB();
  return { ok: true, report: rep };
}

// ==================== ADMINISTRATOR FACULTY ACCOUNT MANAGEMENT ====================
function adminCreateFacultyAccount(profileData, permissions, tempPassword) {
  if (!state.session || state.session.role !== 'administrator') {
    return { ok: false, error: 'Only Administrators can create faculty accounts.' };
  }
  const required = ['Faculty_Name', 'Employee_ID', 'Official_Email', 'Department_ID', 'Designation', 'Qualifications', 'Subjects_Handled', 'Official_Contact'];
  for (const key of required) {
    if (!String(profileData[key] || '').trim()) {
      return { ok: false, error: `${key.replace(/_/g, ' ')} is required.` };
    }
  }
  if (!isValidEmail(profileData.Official_Email.trim())) {
    return { ok: false, error: 'Please enter a valid Official Email address.' };
  }
  if (!tempPassword || String(tempPassword).length < 8) {
    return { ok: false, error: 'Temporary password must be at least 8 characters long.' };
  }

  const emailLower = profileData.Official_Email.trim().toLowerCase();
  const empLower = profileData.Employee_ID.trim().toLowerCase();
  const dupFac = (state.db.Faculty || []).find((f) =>
    String(f.Official_Email || '').trim().toLowerCase() === emailLower ||
    String(f.Employee_ID || '').trim().toLowerCase() === empLower
  );
  if (dupFac) {
    return { ok: false, error: 'A faculty profile with this Official Email or Employee ID already exists.' };
  }

  const newFacId = generateUniqueId('Faculty');
  const newUserId = `USR-${newFacId}`;
  const perms = { ...DEFAULT_FACULTY_PERMISSIONS, ...(permissions || {}) };

  const newFaculty = {
    Faculty_ID: newFacId,
    Employee_ID: profileData.Employee_ID.trim(),
    Faculty_Name: profileData.Faculty_Name.trim(),
    Photograph: String(profileData.Photograph || '').trim(),
    Department_ID: profileData.Department_ID,
    Designation: profileData.Designation.trim(),
    Qualifications: profileData.Qualifications.trim(),
    Subjects_Handled: profileData.Subjects_Handled.trim(),
    Official_Email: profileData.Official_Email.trim(),
    Official_Contact: profileData.Official_Contact.trim(),
    Research_Interests: String(profileData.Research_Interests || '').trim(),
    Account_Status: 'Active',
    Permissions: perms,
    Has_Login_Account: true,
    Must_Change_Password: true,
    Source: isDemoEnvironment() ? 'DEMO ACTION — Administrator Created Faculty Profile' : 'Official HIT Administration',
    Data_Classification: isDemoEnvironment() ? 'DEMONSTRATION_DATA' : 'VERIFIED_INFORMATION',
    Verification_Status: 'Published',
    Is_Demo: isDemoEnvironment(),
    Created_By_User_ID: state.session.userId,
    Last_Updated: todayLocalISO()
  };

  const newAccount = {
    userId: newUserId,
    linkedPersonId: newFacId,
    identifiers: [profileData.Official_Email.trim(), profileData.Employee_ID.trim(), newFacId],
    passwordHash: hashSecretSync(tempPassword, newUserId), // NEVER store plain text
    mustChangePassword: true,
    createdAt: nowLocalTimestamp(),
    createdBy: currentActorLabel(),
    isDemo: isDemoEnvironment()
  };

  state.db.Faculty.push(newFaculty);
  if (!Array.isArray(state.db.Faculty_Accounts)) state.db.Faculty_Accounts = [];
  state.db.Faculty_Accounts.push(newAccount);

  logAuditEvent({
    actionType: 'FACULTY_ACCOUNT_CREATED',
    table: 'Faculty',
    recordId: newFacId,
    prevStatus: 'New',
    nextStatus: 'Active',
    prevValue: null,
    nextValue: {
      Faculty_Name: newFaculty.Faculty_Name,
      Employee_ID: newFaculty.Employee_ID,
      Department_ID: newFaculty.Department_ID,
      Designation: newFaculty.Designation,
      Permissions: perms,
      Must_Change_Password: true
    },
    remarks: `Administrator created official faculty account for ${newFaculty.Faculty_Name} (${newFaculty.Employee_ID}). Temporary credentials issued securely (never stored in plain text).`,
    reason: 'Official faculty onboarding'
  });

  saveDB();
  return { ok: true, faculty: newFaculty, userId: newUserId };
}

function adminUpdateFacultyPermissions(facultyId, newPermissions, reason) {
  if (!state.session || state.session.role !== 'administrator') {
    return { ok: false, error: 'Only Administrators can change faculty permissions.' };
  }
  const fac = (state.db.Faculty || []).find((f) => f.Faculty_ID === facultyId);
  if (!fac) return { ok: false, error: 'Faculty record not found.' };
  if (!reason || reason.trim().length < 3) return { ok: false, error: 'Please provide a reason for the permission change.' };

  const prevPerms = { ...DEFAULT_FACULTY_PERMISSIONS, ...(fac.Permissions || {}) };
  const nextPerms = { ...DEFAULT_FACULTY_PERMISSIONS, ...(newPermissions || {}) };
  fac.Permissions = nextPerms;
  fac.Last_Updated = todayLocalISO();

  logAuditEvent({
    actionType: 'PERMISSION_CHANGE',
    table: 'Faculty',
    recordId: facultyId,
    prevStatus: fac.Account_Status || 'Active',
    nextStatus: fac.Account_Status || 'Active',
    prevValue: prevPerms,
    nextValue: nextPerms,
    remarks: `Updated permissions for ${fac.Faculty_Name}.`,
    reason: reason.trim()
  });

  saveDB();
  return { ok: true, faculty: fac };
}

function adminSetFacultyAccountStatus(facultyId, newStatus, reason) {
  if (!state.session || state.session.role !== 'administrator') {
    return { ok: false, error: 'Only Administrators can suspend, deactivate, or reactivate faculty accounts.' };
  }
  if (!['Active', 'Suspended', 'Deactivated'].includes(newStatus)) {
    return { ok: false, error: 'Invalid account status.' };
  }
  const fac = (state.db.Faculty || []).find((f) => f.Faculty_ID === facultyId);
  if (!fac) return { ok: false, error: 'Faculty record not found.' };
  if (!reason || reason.trim().length < 3) return { ok: false, error: 'Please provide a reason for changing account status.' };

  const prevStatus = fac.Account_Status || 'Active';
  fac.Account_Status = newStatus;
  fac.Last_Updated = todayLocalISO();

  logAuditEvent({
    actionType: newStatus === 'Active' ? 'ACCOUNT_ACTIVATED' : 'ACCOUNT_' + newStatus.toUpperCase(),
    table: 'Faculty',
    recordId: facultyId,
    prevStatus,
    nextStatus: newStatus,
    prevValue: { Account_Status: prevStatus },
    nextValue: { Account_Status: newStatus },
    remarks: `Changed faculty account status for ${fac.Faculty_Name} from ${prevStatus} to ${newStatus}.`,
    reason: reason.trim()
  });

  saveDB();
  return { ok: true, faculty: fac };
}

function adminResetFacultyCredentials(facultyId, newTempPassword, reason) {
  if (!state.session || state.session.role !== 'administrator') {
    return { ok: false, error: 'Only Administrators can reset faculty credentials.' };
  }
  const fac = (state.db.Faculty || []).find((f) => f.Faculty_ID === facultyId);
  if (!fac) return { ok: false, error: 'Faculty record not found.' };
  if (!newTempPassword || newTempPassword.length < 8) return { ok: false, error: 'Temporary password must be at least 8 characters.' };
  if (!reason || reason.trim().length < 3) return { ok: false, error: 'Please provide a reason for resetting credentials.' };

  if (!Array.isArray(state.db.Faculty_Accounts)) state.db.Faculty_Accounts = [];
  let acc = state.db.Faculty_Accounts.find((a) => a.linkedPersonId === facultyId);
  if (!acc) {
    const newUserId = `USR-${facultyId}`;
    acc = {
      userId: newUserId,
      linkedPersonId: facultyId,
      identifiers: [fac.Official_Email, fac.Employee_ID, facultyId].filter(Boolean),
      passwordHash: hashSecretSync(newTempPassword, newUserId),
      mustChangePassword: true,
      createdAt: nowLocalTimestamp(),
      createdBy: currentActorLabel(),
      isDemo: isDemoEnvironment()
    };
    state.db.Faculty_Accounts.push(acc);
    fac.Has_Login_Account = true;
  } else {
    acc.passwordHash = hashSecretSync(newTempPassword, acc.userId);
    acc.mustChangePassword = true;
    acc.passwordResetAt = nowLocalTimestamp();
  }
  fac.Must_Change_Password = true;

  logAuditEvent({
    actionType: 'CREDENTIALS_RESET',
    table: 'Faculty',
    recordId: facultyId,
    prevStatus: fac.Account_Status || 'Active',
    nextStatus: 'Password Reset Required',
    remarks: `Administrator issued temporary credentials for ${fac.Faculty_Name} (first-login password change enforced; password not stored in plain text).`,
    reason: reason.trim()
  });

  saveDB();
  return { ok: true };
}

// ==================== FACULTY PROFILE CORRECTION REQUESTS ====================
function submitProfileCorrectionRequest(fieldName, requestedValue, reason) {
  if (!state.session || state.session.role !== 'faculty' || !isFacultyAccountActive()) {
    return { ok: false, error: 'Only active faculty members can submit profile correction requests.' };
  }
  const fac = getCurrentFacultyProfile();
  if (!fac) return { ok: false, error: 'Official faculty profile not found.' };
  if (!fieldName || !String(requestedValue || '').trim() || !String(reason || '').trim()) {
    return { ok: false, error: 'Please select a field and provide both the requested value and reason.' };
  }

  if (!Array.isArray(state.db.Profile_Correction_Requests)) state.db.Profile_Correction_Requests = [];
  const req = {
    Request_ID: generateUniqueId('Profile_Correction_Requests'),
    Faculty_ID: fac.Faculty_ID,
    Faculty_Name: fac.Faculty_Name,
    Field_Name: fieldName,
    Current_Value: String(fac[fieldName] || '—'),
    Requested_Value: String(requestedValue).trim(),
    Reason: String(reason).trim(),
    Status: 'Pending',
    Admin_Notes: '',
    Created_At: nowLocalTimestamp(),
    Is_Demo: isDemoEnvironment()
  };
  state.db.Profile_Correction_Requests.unshift(req);

  logAuditEvent({
    actionType: 'PROFILE_CORRECTION_REQUEST',
    table: 'Faculty',
    recordId: fac.Faculty_ID,
    prevStatus: 'Active',
    nextStatus: 'Correction Requested',
    prevValue: { [fieldName]: req.Current_Value },
    nextValue: { [fieldName]: req.Requested_Value },
    remarks: `Faculty requested update to ${fieldName.replace(/_/g, ' ')}.`,
    reason: req.Reason
  });

  saveDB();
  return { ok: true, request: req };
}

function adminResolveProfileRequest(requestId, decision, notes) {
  if (!state.session || state.session.role !== 'administrator') {
    return { ok: false, error: 'Only Administrators can resolve profile correction requests.' };
  }
  const req = (state.db.Profile_Correction_Requests || []).find((r) => r.Request_ID === requestId);
  if (!req) return { ok: false, error: 'Request not found.' };
  const fac = (state.db.Faculty || []).find((f) => f.Faculty_ID === req.Faculty_ID);

  req.Status = decision;
  req.Admin_Notes = String(notes || '').trim();
  req.Resolved_At = nowLocalTimestamp();

  if (decision === 'Approved' && fac) {
    const prevVal = fac[req.Field_Name];
    fac[req.Field_Name] = req.Requested_Value;
    fac.Last_Updated = todayLocalISO();
    logAuditEvent({
      actionType: 'FACULTY_PROFILE_UPDATED',
      table: 'Faculty',
      recordId: fac.Faculty_ID,
      prevStatus: 'Active',
      nextStatus: 'Active',
      prevValue: { [req.Field_Name]: prevVal },
      nextValue: { [req.Field_Name]: req.Requested_Value },
      remarks: `Approved faculty profile correction request ${requestId}.`,
      reason: req.Admin_Notes || 'Approved faculty correction request'
    });
  } else {
    logAuditEvent({
      actionType: 'PROFILE_CORRECTION_REJECTED',
      table: 'Faculty',
      recordId: req.Faculty_ID,
      prevStatus: 'Pending',
      nextStatus: 'Rejected',
      remarks: `Rejected faculty profile correction request ${requestId}.`,
      reason: req.Admin_Notes || 'Rejected by Administrator'
    });
  }

  saveDB();
  return { ok: true };
}
