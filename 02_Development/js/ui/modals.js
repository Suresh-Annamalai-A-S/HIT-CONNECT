// HIT Connect — Structured Record Detail Modal, Post-Publication Moderation & Confirmation Summaries

// ==================== REUSABLE MANDATORY CONFIRMATION SUMMARY MODAL ====================
function openConfirmationSummary({ title, subtitle, summaryHtml, requireReason, reasonPlaceholder, confirmLabel, confirmBtnClass, onBack, onConfirm }) {
  document.getElementById('admin-confirm-title').textContent = title || 'Review Action Details';
  document.getElementById('admin-confirm-subtitle').textContent = subtitle || '';
  document.getElementById('admin-confirm-body').innerHTML = summaryHtml || '';

  const reasonWrap = document.getElementById('admin-confirm-reason-wrap');
  const reasonInput = document.getElementById('admin-confirm-reason-input');
  const errEl = document.getElementById('admin-confirm-error');
  errEl.classList.add('hidden');
  if (requireReason) {
    reasonWrap.classList.remove('hidden');
    reasonInput.value = '';
    reasonInput.placeholder = reasonPlaceholder || 'Provide a clear reason for the audit log...';
  } else {
    reasonWrap.classList.add('hidden');
  }

  const footer = document.getElementById('admin-confirm-footer');
  footer.innerHTML = `
    ${onBack ? `<button id="acm-back" type="button" class="min-h-[40px] px-3.5 rounded-xl glass-btn-secondary text-xs font-semibold">${escapeHtml(onBack.label || 'Edit Details')}</button>` : '<span></span>'}
    <div class="flex items-center gap-2">
      <button id="acm-cancel" type="button" class="min-h-[40px] px-3.5 rounded-xl glass-btn-secondary text-xs font-semibold">Cancel</button>
      <button id="acm-confirm" type="button" class="min-h-[40px] px-4 rounded-xl ${confirmBtnClass || 'glass-btn-primary'} text-xs font-semibold">${escapeHtml(confirmLabel || 'Confirm Action')}</button>
    </div>
  `;

  if (onBack) {
    document.getElementById('acm-back').addEventListener('click', () => {
      closeModal('admin-confirm-modal');
      onBack.fn();
    });
  }
  document.getElementById('acm-cancel').addEventListener('click', () => closeModal('admin-confirm-modal'));
  document.getElementById('acm-confirm').addEventListener('click', () => {
    const reason = requireReason ? reasonInput.value.trim() : '';
    if (requireReason && reason.length < 3) {
      errEl.textContent = 'Please provide a clear reason (at least 3 characters) before confirming.';
      errEl.classList.remove('hidden');
      return;
    }
    const result = onConfirm(reason);
    if (result && result.ok === false) {
      errEl.textContent = result.error || 'Action could not be completed.';
      errEl.classList.remove('hidden');
      return;
    }
    closeModal('admin-confirm-modal');
  });

  openModal('admin-confirm-modal');
  if (window.lucide) lucide.createIcons();
}

// ==================== STUDENT REPORT MODAL ====================
function openReportModal(table, id) {
  if (!state.session || state.session.role !== 'student') return;
  const meta = TABLE_META[table];
  const rec = (state.db[table] || []).find((r) => r[meta.key] === id);
  if (!rec) return;

  state.pendingReport = { table, id };
  document.getElementById('report-modal-subtitle').textContent = `Reporting: ${rec[meta.label]}`;
  const sel = document.getElementById('report-reason-select');
  sel.innerHTML = `<option value="">Select a reason...</option>` + REPORT_REASONS.map((r) => `<option value="${escapeHtml(r)}">${escapeHtml(r)}</option>`).join('');
  document.getElementById('report-explanation-input').value = '';
  document.getElementById('report-error').classList.add('hidden');
  openModal('report-modal');
  if (window.lucide) lucide.createIcons();
}

// ==================== ADMIN FACULTY ACCOUNT MANAGEMENT MODALS ====================
function openCreateFacultyModal(prefill) {
  if (!state.session || state.session.role !== 'administrator') return;
  const form = document.getElementById('fac-acc-form');
  const deptSel = document.getElementById('fac-acc-dept');
  deptSel.innerHTML = state.db.Departments.map((d) => `<option value="${d.Department_ID}">${escapeHtml(d.Department_Code)} — ${escapeHtml(d.Department_Name)}</option>`).join('');
  document.getElementById('fac-acc-error').classList.add('hidden');

  if (!prefill) {
    form.reset();
  } else {
    Object.entries(prefill.profile || {}).forEach(([k, v]) => {
      const el = form.querySelector(`[name="${k}"]`);
      if (el) el.value = v || '';
    });
    if (prefill.tempPassword) {
      const pwEl = form.querySelector('[name="Temp_Password"]');
      if (pwEl) pwEl.value = prefill.tempPassword;
    }
    Object.entries(prefill.permissions || DEFAULT_FACULTY_PERMISSIONS).forEach(([k, v]) => {
      const el = form.querySelector(`[name="perm_${k}"]`);
      if (el) el.checked = Boolean(v);
    });
  }
  openModal('faculty-account-modal');
  if (window.lucide) lucide.createIcons();
}

function openFacultyPermissionsFlow(facultyId) {
  const fac = (state.db.Faculty || []).find((f) => f.Faculty_ID === facultyId);
  if (!fac) return;
  const current = { ...DEFAULT_FACULTY_PERMISSIONS, ...(fac.Permissions || {}) };

  const summaryHtml = `
    <div class="rounded-xl glass-subtle p-3.5 text-xs space-y-1">
      <div class="font-bold text-[#18212F]">${escapeHtml(fac.Faculty_Name)} (${escapeHtml(fac.Employee_ID || fac.Faculty_ID)})</div>
      <div class="text-[#64748B]">${escapeHtml(fac.Designation)} &middot; ${escapeHtml(getDeptFullName(fac.Department_ID))}</div>
    </div>
    <div class="space-y-2 text-xs">
      <div class="font-bold text-[#18212F]">Select Proposed Permissions</div>
      ${Object.entries(PERMISSION_LABELS).map(([k, info]) => `
        <label class="flex items-start gap-2.5 p-2.5 rounded-xl glass-card cursor-pointer">
          <input type="checkbox" data-perm-key="${k}" ${current[k] ? 'checked' : ''} class="perm-edit-chk mt-0.5 rounded text-crimson-600" />
          <span>
            <strong class="block text-[#18212F]">${escapeHtml(info.label)} <span class="text-[10px] font-normal text-[#64748B]">(Currently: ${current[k] ? 'Enabled' : 'Disabled'})</span></strong>
            <span class="text-[11px] text-[#64748B]">${escapeHtml(info.consequence)}</span>
          </span>
        </label>
      `).join('')}
    </div>
  `;

  openConfirmationSummary({
    title: 'Manage Faculty Permissions',
    subtitle: 'Review current vs. proposed permissions and consequences before applying.',
    summaryHtml,
    requireReason: true,
    reasonPlaceholder: 'Reason for permission update (recorded in audit history)...',
    confirmLabel: 'Confirm Permission Changes',
    onConfirm: (reason) => {
      const proposed = {};
      document.querySelectorAll('.perm-edit-chk').forEach((c) => { proposed[c.dataset.permKey] = c.checked; });
      const res = adminUpdateFacultyPermissions(facultyId, proposed, reason);
      if (res.ok) {
        render();
        showToast(`${isDemoEnvironment() ? 'DEMO ACTION: ' : ''}Permissions updated for ${fac.Faculty_Name}`);
      }
      return res;
    }
  });
}

function openFacultyAccountStatusFlow(facultyId, targetStatus) {
  const fac = (state.db.Faculty || []).find((f) => f.Faculty_ID === facultyId);
  if (!fac) return;
  const currentStatus = fac.Account_Status || 'Active';
  const consequence = targetStatus === 'Active'
    ? 'Faculty member will regain login and direct publishing access.'
    : 'Faculty member will immediately lose login and publishing access. Existing published records remain untouched unless separately moderated.';

  const summaryHtml = `
    <div class="rounded-xl glass-subtle p-3.5 text-xs space-y-1.5">
      <div class="font-bold text-[#18212F]">${escapeHtml(fac.Faculty_Name)} (${escapeHtml(fac.Employee_ID || fac.Faculty_ID)})</div>
      <div class="text-[#64748B]">${escapeHtml(fac.Designation)} &middot; ${escapeHtml(getDeptFullName(fac.Department_ID))}</div>
      <div class="pt-1">Status Change: <strong>${escapeHtml(currentStatus)}</strong> &rarr; <strong class="text-crimson-700">${escapeHtml(targetStatus)}</strong></div>
    </div>
    <div class="rounded-xl bg-amber-50/90 border border-amber-200 p-3 text-xs text-amber-900">${escapeHtml(consequence)}</div>
  `;

  openConfirmationSummary({
    title: `${targetStatus === 'Active' ? 'Reactivate' : targetStatus} Faculty Account`,
    subtitle: 'Explicit administrator confirmation is required.',
    summaryHtml,
    requireReason: true,
    reasonPlaceholder: `Explain why this account is being marked ${targetStatus}...`,
    confirmLabel: `Confirm ${targetStatus}`,
    confirmBtnClass: targetStatus === 'Active' ? 'glass-btn-navy' : 'bg-rose-600 text-white hover:bg-rose-700',
    onConfirm: (reason) => {
      const res = adminSetFacultyAccountStatus(facultyId, targetStatus, reason);
      if (res.ok) {
        render();
        showToast(`${isDemoEnvironment() ? 'DEMO ACTION: ' : ''}Account marked ${targetStatus}`);
      }
      return res;
    }
  });
}

function openFacultyResetCredentialsFlow(facultyId) {
  const fac = (state.db.Faculty || []).find((f) => f.Faculty_ID === facultyId);
  if (!fac) return;

  const summaryHtml = `
    <div class="rounded-xl glass-subtle p-3.5 text-xs space-y-1">
      <div class="font-bold text-[#18212F]">${escapeHtml(fac.Faculty_Name)} (${escapeHtml(fac.Employee_ID || fac.Faculty_ID)})</div>
      <div class="text-[#64748B]">${escapeHtml(fac.Official_Email)} &middot; ${escapeHtml(getDeptFullName(fac.Department_ID))}</div>
    </div>
    <div>
      <label for="reset-temp-pw-input" class="block text-xs font-semibold text-[#18212F] mb-1">New Temporary Password (min 8 characters) <span class="text-crimson-600">*</span></label>
      <input id="reset-temp-pw-input" type="password" minlength="8" placeholder="Enter temporary password (hashed securely)" class="w-full min-h-[40px] px-3 glass-input rounded-xl text-sm" />
      <p class="text-[11px] text-[#64748B] mt-1">The faculty member will be forced to change this password on next login. Plain-text passwords are never saved or logged.</p>
    </div>
  `;

  openConfirmationSummary({
    title: 'Reset Faculty Credentials',
    subtitle: 'Issue new temporary credentials with mandatory first-login password change.',
    summaryHtml,
    requireReason: true,
    reasonPlaceholder: 'Reason for credential reset...',
    confirmLabel: 'Confirm Credential Reset',
    onConfirm: (reason) => {
      const pw = (document.getElementById('reset-temp-pw-input')?.value || '').trim();
      const res = adminResetFacultyCredentials(facultyId, pw, reason);
      if (res.ok) {
        render();
        showToast(`${isDemoEnvironment() ? 'DEMO ACTION: ' : ''}Temporary credentials issued (first-login change enforced)`);
      }
      return res;
    }
  });
}

// ==================== POST-PUBLICATION MODERATION CONFIRMATION FLOWS ====================
function openModerationActionFlow(table, id, targetStatus, relatedReportId) {
  const meta = TABLE_META[table];
  const rec = (state.db[table] || []).find((r) => r[meta.key] === id);
  if (!rec) return;
  const attr = getRecordAttribution(table, rec);

  const warningText = targetStatus === 'Temporarily Hidden'
    ? 'Students will no longer see this information while it is temporarily hidden. You can restore it later after review.'
    : targetStatus === 'Removed'
      ? 'This information will be removed from student view and preserved in the internal audit history.'
      : targetStatus === 'Archived'
        ? 'This information will be archived so students see only active announcements.'
        : 'This information will be restored to Published status and immediately visible to students.';

  const summaryHtml = `
    <div class="rounded-xl glass-subtle p-3.5 text-xs space-y-1.5">
      <div class="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">${escapeHtml(meta.friendly)} &middot; ${escapeHtml(id)}</div>
      <div class="text-sm font-bold text-[#18212F]">${escapeHtml(rec[meta.label])}</div>
      <div class="text-[#64748B]">Author: <strong class="text-[#18212F]">${escapeHtml(attr.contributor ? attr.contributor.name : 'Campus Contributor')}</strong> &middot; Current Status: <strong>${escapeHtml(rec.Verification_Status)}</strong></div>
      <div class="text-[#64748B] line-clamp-3">${escapeHtml(rec.Description || rec.Responsibilities || '')}</div>
    </div>
    <div class="rounded-xl ${targetStatus === 'Removed' ? 'bg-rose-50/90 border-rose-200 text-rose-900' : 'bg-amber-50/90 border-amber-200 text-amber-900'} border p-3 text-xs font-medium">
      ${escapeHtml(warningText)}
    </div>
  `;

  openConfirmationSummary({
    title: `${targetStatus === 'Published' ? 'Restore' : targetStatus} Information`,
    subtitle: 'Review the affected announcement and provide a clear reason for the audit log.',
    summaryHtml,
    requireReason: true,
    reasonPlaceholder: `Explain why this item is being marked ${targetStatus}...`,
    confirmLabel: `Confirm ${targetStatus === 'Published' ? 'Restore' : targetStatus}`,
    confirmBtnClass: targetStatus === 'Removed' ? 'bg-rose-600 text-white hover:bg-rose-700' : 'glass-btn-primary',
    onConfirm: (reason) => {
      const res = transitionRecordStatus(table, id, targetStatus, reason);
      if (res.ok && relatedReportId) {
        const repStatus = targetStatus === 'Temporarily Hidden' ? 'Hidden' : (targetStatus === 'Removed' ? 'Removed' : 'Corrected');
        adminResolveReport(relatedReportId, repStatus, reason);
      }
      if (res.ok) {
        closeModal('detail-modal');
        render();
        showToast(`${isDemoEnvironment() ? 'DEMO ACTION: ' : ''}Record marked as ${targetStatus}`);
      }
      return res;
    }
  });
}

// ==================== STRUCTURED RECORD DETAIL MODAL ====================
function openDetail(table, id) {
  const meta = TABLE_META[table];
  const rec = (state.db[table] || []).find((r) => r[meta.key] === id);
  if (!rec) return;

  const isAdmin = state.session && state.session.role === 'administrator';
  const isFaculty = state.session && state.session.role === 'faculty';
  const isStudent = state.session && state.session.role === 'student';

  document.getElementById('detail-title').textContent = rec[meta.label] || 'Record Details';
  document.getElementById('detail-badges').innerHTML = `
    ${classificationBadge(rec.Data_Classification, rec)}
    ${urgentBadge(rec)}
    ${table === 'Opportunities' ? availabilityBadge(getOpportunityAvailability(rec)) : ''}
    ${(isAdmin || isFaculty) ? (table === 'Faculty' ? accountStatusBadge(rec.Account_Status) : workflowBadge(rec.Verification_Status)) : ''}
  `;

  const row = (label, val) => val ? `<div class="py-2 border-b border-slate-200/60 last:border-0"><div class="text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">${escapeHtml(label)}</div><div class="text-sm text-[#18212F] mt-0.5 leading-relaxed">${val}</div></div>` : '';
  const linkVal = (url, text) => isValidHttpsUrl(url) ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="text-crimson-600 font-semibold hover:underline inline-flex items-center gap-1 break-all">${escapeHtml(text || url)} <i data-lucide="external-link" class="w-3.5 h-3.5"></i></a>` : escapeHtml(url || 'Not provided');

  let html = '';
  if (table === 'Opportunities') {
    html = `
      ${rec.Eligibility_Warning ? `<div class="rounded-xl bg-amber-50/90 border border-amber-200 p-3 text-xs text-amber-900 font-medium">${escapeHtml(rec.Eligibility_Warning)}</div>` : ''}
      ${row('Organiser', escapeHtml(rec.Organiser || rec.Organizer))}
      ${row('Category', escapeHtml(rec.Category))}
      ${row('Description', escapeHtml(rec.Description))}
      ${row('Eligibility', escapeHtml(rec.Eligibility))}
      ${row('Eligible Departments', escapeHtml(rec.Relevant_Departments || getDeptFullName(rec.Department_ID)))}
      ${row('Eligible Academic Years', escapeHtml(rec.Relevant_Years))}
      ${row('Application Deadline', escapeHtml(rec.Application_Deadline ? formatDisplayDate(rec.Application_Deadline) : 'Course-specific / Check official portal'))}
      ${row('Fees', escapeHtml(rec.Fee_Details))}
      ${row('Stipend / Prizes', escapeHtml(rec.Stipend))}
      ${row('Official Source', linkVal(rec.Official_Source_URL, rec.Source || rec.Official_Source_URL))}
      ${row('Application Portal', linkVal(rec.Application_URL || rec.Application_Link, 'Open Official Application Portal'))}
    `;
  } else if (table === 'Academics') {
    html = `
      ${row('Department', escapeHtml(getDeptFullName(rec.Department_ID)))}
      ${row('Document Category', escapeHtml(rec.Category))}
      ${row('Academic Year & Semester', `${escapeHtml(rec.Academic_Year || '—')} · Semester ${escapeHtml(rec.Semester || 'All')}`)}
      ${row('Version', escapeHtml(rec.Version))}
      ${row('Description', escapeHtml(rec.Description))}
      ${row('Document Link', linkVal(rec.Document_Link, 'View / Download Document'))}
      ${row('Source', escapeHtml(rec.Source))}
    `;
  } else if (table === 'Faculty') {
    html = `
      <div class="flex items-center gap-3.5 pb-3 border-b border-slate-200/60">
        <div class="w-14 h-14 rounded-full bg-crimson-50 text-crimson-700 font-bold flex items-center justify-center border border-crimson-200">${escapeHtml(getInitials(rec.Faculty_Name))}</div>
        <div>
          <div class="font-bold text-[#18212F]">${escapeHtml(rec.Faculty_Name)}</div>
          <div class="text-xs text-[#64748B]">${escapeHtml(rec.Designation)}${rec.Employee_ID ? ' · ' + escapeHtml(rec.Employee_ID) : ''}</div>
          <div class="text-xs text-crimson-700">${escapeHtml(getDeptFullName(rec.Department_ID))}</div>
        </div>
      </div>
      ${row('Subjects Handled', escapeHtml(rec.Subjects_Handled))}
      ${row('Qualifications', escapeHtml(rec.Qualifications))}
      ${row('Research Interests', escapeHtml(rec.Research_Interests))}
      ${row('Official Email', escapeHtml(rec.Official_Email || 'Not listed'))}
      ${row('Official Contact', escapeHtml(rec.Official_Contact || 'Not listed'))}
    `;
  } else if (table === 'Administrative_Contacts') {
    html = `
      ${row('Contact Person & Designation', escapeHtml(`${rec.Staff_Name || ''} ${rec.Designation ? '· ' + rec.Designation : ''}`.trim()))}
      ${row('Responsibilities', escapeHtml(rec.Responsibilities))}
      ${row('Office Location', escapeHtml(rec.Office_Location))}
      ${row('Working Hours', escapeHtml(rec.Working_Hours))}
      ${row('Official Email', escapeHtml(rec.Official_Email || 'Not listed'))}
      ${row('Official Contact', escapeHtml(rec.Official_Contact || 'Not listed'))}
    `;
  } else if (table === 'Events') {
    html = `
      ${row('Organiser', escapeHtml(rec.Organizer))}
      ${row('Category', escapeHtml(rec.Category))}
      ${row('Date & Time', `${escapeHtml(formatDisplayDate(rec.Event_Date) || rec.Event_Date)} ${rec.Start_Time ? '· ' + escapeHtml(rec.Start_Time) : ''}${rec.End_Time ? ' – ' + escapeHtml(rec.End_Time) : ''}`)}
      ${row('Venue / Mode', escapeHtml(rec.Venue))}
      ${rec.Registration_Deadline ? row('Registration Deadline', escapeHtml(formatDisplayDate(rec.Registration_Deadline) || rec.Registration_Deadline)) : ''}
      ${rec.Target_Audience ? row('Target Audience', escapeHtml(rec.Target_Audience)) : ''}
      ${row('Details', escapeHtml(rec.Description))}
      ${row('Registration', linkVal(rec.Registration_Link, 'Open Registration Link'))}
      ${row('Source', escapeHtml(rec.Source))}
    `;
  } else if (table === 'Announcements') {
    html = `
      ${row('Category', escapeHtml(rec.Category))}
      ${row('Department', escapeHtml(getDeptFullName(rec.Department_ID)))}
      ${row('Target Audience', escapeHtml(rec.Target_Audience))}
      ${rec.Relevant_Year_Semester ? row('Year / Semester', escapeHtml(rec.Relevant_Year_Semester)) : ''}
      ${row('Published On', escapeHtml(rec.Published_At || formatDisplayDate(rec.Publication_Date) || rec.Publication_Date))}
      ${rec.Event_Date ? row('Event Date & Time', `${escapeHtml(formatDisplayDate(rec.Event_Date) || rec.Event_Date)}${rec.Event_Time ? ' · ' + escapeHtml(rec.Event_Time) : ''}`) : ''}
      ${rec.Venue ? row('Venue / Location', escapeHtml(rec.Venue)) : ''}
      ${rec.Registration_Deadline ? row('Registration Deadline', escapeHtml(formatDisplayDate(rec.Registration_Deadline) || rec.Registration_Deadline)) : ''}
      ${rec.Expiry_Date ? row('Valid Until', escapeHtml(formatDisplayDate(rec.Expiry_Date) || rec.Expiry_Date)) : ''}
      ${row('Description', escapeHtml(rec.Description))}
      ${rec.Attachments_Links ? row('Attachment / External Link', linkVal(rec.Attachments_Links, 'Open Attachment / Link')) : ''}
      ${row('Source', escapeHtml(rec.Source))}
    `;
  } else {
    html = `
      ${row('Category', escapeHtml(rec.Category || rec.Programme_Name))}
      ${row('Description', escapeHtml(rec.Description))}
      ${row('Location', escapeHtml(rec.Location))}
      ${row('Responsible Office', escapeHtml(rec.Responsible_Department))}
      ${row('Hours / Availability', escapeHtml(rec.Availability_Information))}
      ${row('Contact', escapeHtml(rec.Contact_Information || rec.Official_Contact))}
      ${rec.Registration_Link ? row('Link', linkVal(rec.Registration_Link, 'Open Link')) : ''}
    `;
  }

  // Responsible Faculty / Office Attribution & Official Clarification Contact
  if (!['Faculty', 'Administrative_Contacts', 'Departments'].includes(table)) {
    const attr = getRecordAttribution(table, rec);
    html += `
      <div class="mt-4 pt-4 border-t border-slate-200/70 space-y-3.5">
        <div class="rounded-xl glass-subtle p-4 space-y-2">
          <div class="text-[11px] font-bold uppercase tracking-wider text-navy-800 flex items-center gap-1.5">
            <i data-lucide="user-check" class="w-3.5 h-3.5 text-crimson-600"></i> Published By &amp; Source Details
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div>
              <span class="text-[#64748B]">Responsible Author:</span>
              ${attr.contributor ? `<button type="button" data-open-table="${escapeHtml(attr.contributor.table)}" data-open-id="${escapeHtml(attr.contributor.id)}" class="linked-profile-btn font-semibold text-crimson-700 hover:underline text-left">${escapeHtml(attr.contributor.name)}</button>` : `<span class="font-semibold text-[#18212F]">Campus Office</span>`}
            </div>
            <div><span class="text-[#64748B]">Designation:</span> <span class="font-medium text-[#18212F]">${escapeHtml(attr.contributor ? attr.contributor.designation : '—')}</span></div>
            <div><span class="text-[#64748B]">Department / Office:</span> <span class="font-medium text-[#18212F]">${escapeHtml(attr.contributor ? attr.contributor.department : getDeptFullName(rec.Department_ID))}</span></div>
            <div><span class="text-[#64748B]">Last Updated:</span> <span class="font-medium text-[#18212F]">${escapeHtml(formatDisplayDate(attr.lastUpdated) || attr.lastUpdated)}</span></div>
          </div>
        </div>
        ${renderClarificationContactBlock(attr.contact, rec)}
      </div>
    `;
  } else {
    const linkedRecords = [];
    ['Academics', 'Opportunities', 'Events', 'Announcements', 'Clubs', 'Campus_Resources'].forEach((t) => {
      (state.db[t] || []).forEach((r) => {
        if (!isVisibleInCurrentMode(r, t)) return;
        if (r.Contributor_ID === id || r.Clarification_Contact_ID === id || r.Publisher_ID === id) {
          linkedRecords.push({ table: t, rec: r });
        }
      });
    });
    html += `
      <div class="mt-4 pt-3 border-t border-slate-200/70 space-y-2">
        <div class="text-xs font-bold uppercase tracking-wider text-navy-800">Associated Campus Information (${linkedRecords.length})</div>
        ${linkedRecords.length ? `<div class="space-y-1.5">${linkedRecords.slice(0, 6).map((x) => `
          <button type="button" data-open-table="${x.table}" data-open-id="${escapeHtml(x.rec[TABLE_META[x.table].key])}" class="linked-profile-btn w-full text-left p-2.5 rounded-xl glass-subtle hover:border-crimson-300 flex items-center justify-between gap-2 text-xs transition">
            <span class="font-semibold text-[#18212F] truncate">${escapeHtml(x.rec[TABLE_META[x.table].label])}</span>
            <span class="text-[11px] text-crimson-600 font-semibold shrink-0">${escapeHtml(TABLE_META[x.table].friendly)}</span>
          </button>
        `).join('')}</div>` : `<p class="text-xs text-[#64748B]">No published records currently linked to this profile.</p>`}
      </div>
    `;
  }

  // Faculty notice when Admin has restricted their post
  if (isFaculty && isOwnedByCurrentFaculty(rec) && (rec.Verification_Status === 'Temporarily Hidden' || rec.Verification_Status === 'Removed')) {
    html += `
      <div class="rounded-xl bg-amber-50/90 border border-amber-200 p-3.5 text-xs text-amber-900 space-y-1">
        <div class="font-bold">Administrative Moderation Notice (${escapeHtml(rec.Verification_Status)})</div>
        <div>Reason: ${escapeHtml(rec.Hidden_Reason || rec.Removal_Reason || rec.Last_Action_Remarks || 'Moderated by Administrator.')}</div>
        <div class="text-[11px] text-amber-800">Faculty cannot override administrative restrictions. Contact the Administrator for restoration.</div>
      </div>
    `;
  }

  // Administrator Post-Publication Moderation Panel
  if (isAdmin && table !== 'Departments') {
    const hist = (state.db.Verification_History || []).filter((h) => h.Table_Name === table && h.Record_ID === id).slice().reverse();
    html += `
      <div class="mt-4 rounded-xl glass-subtle p-4 space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-xs font-bold uppercase tracking-wider text-navy-800">Administrator Management &amp; Moderation</h3>
          <span class="text-[11px] font-mono text-[#64748B]">${escapeHtml(id)}</span>
        </div>
        ${table !== 'Faculty' ? `
          <div class="flex flex-wrap gap-2">
            <button type="button" id="admin-mod-edit" class="min-h-[36px] px-3 rounded-lg glass-btn-navy text-xs font-semibold">Edit / Correct</button>
            ${rec.Verification_Status === 'Published' ? `<button type="button" data-mod-status="Temporarily Hidden" class="admin-mod-btn min-h-[36px] px-3 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 text-xs font-semibold hover:bg-amber-200">Temporarily Hide</button>` : ''}
            ${['Temporarily Hidden', 'Archived', 'Removed', 'Draft'].includes(rec.Verification_Status) ? `<button type="button" data-mod-status="Published" class="admin-mod-btn min-h-[36px] px-3 rounded-lg bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800">Restore / Publish</button>` : ''}
            ${rec.Verification_Status !== 'Removed' ? `<button type="button" data-mod-status="Removed" class="admin-mod-btn min-h-[36px] px-3 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700">Remove</button>` : ''}
          </div>
        ` : `
          <div class="flex flex-wrap gap-2">
            <button type="button" id="admin-fac-perms" class="min-h-[36px] px-3 rounded-lg glass-btn-navy text-xs font-semibold">Manage Permissions</button>
            <button type="button" id="admin-fac-reset" class="min-h-[36px] px-3 rounded-lg glass-btn-secondary text-xs font-semibold">Reset Credentials</button>
            ${(rec.Account_Status || 'Active') === 'Active'
              ? `<button type="button" id="admin-fac-suspend" class="min-h-[36px] px-3 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 text-xs font-semibold">Suspend</button>
                 <button type="button" id="admin-fac-deactivate" class="min-h-[36px] px-3 rounded-lg bg-rose-600 text-white text-xs font-semibold">Deactivate</button>`
              : `<button type="button" id="admin-fac-activate" class="min-h-[36px] px-3 rounded-lg bg-emerald-700 text-white text-xs font-semibold">Reactivate Account</button>`}
          </div>
        `}
        <div class="pt-2 border-t border-slate-200/70 space-y-1.5">
          <div class="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Audit History (${hist.length})</div>
          ${hist.length ? hist.map((h) => `<div class="text-[11px] text-[#18212F]"><strong>${escapeHtml(h.Action_Type || 'UPDATE')}</strong> (${escapeHtml(h.Previous_Status)} &rarr; ${escapeHtml(h.New_Status)}) · ${escapeHtml(h.Action_Date)} · ${escapeHtml(h.Action_By)}${h.Reason ? ` — ${escapeHtml(h.Reason)}` : ''}</div>`).join('') : `<div class="text-[11px] text-[#64748B]">No audit entries recorded for this item yet.</div>`}
        </div>
      </div>
    `;
  }

  document.getElementById('detail-body').innerHTML = html;

  const footer = document.getElementById('detail-footer');
  if (isAdmin) {
    footer.innerHTML = `<button id="btn-admin-edit" type="button" class="min-h-[40px] px-4 rounded-xl glass-btn-secondary text-xs font-semibold">Edit Record Details</button><button id="close-detail-btn" type="button" class="min-h-[40px] px-4 rounded-xl glass-btn-navy text-xs font-semibold">Done</button>`;
    document.getElementById('btn-admin-edit').addEventListener('click', () => { closeModal('detail-modal'); openGuidedSubmission(table, id); });
  } else if (isFaculty && canReviseRecord(rec, table)) {
    footer.innerHTML = `
      <div class="flex flex-wrap items-center gap-2">
        <button id="btn-fac-edit" type="button" class="min-h-[40px] px-4 rounded-xl glass-btn-primary text-xs font-semibold">Edit Publication</button>
        ${canArchiveOwnRecord(rec, table) ? `<button id="btn-fac-archive" type="button" class="min-h-[40px] px-3.5 rounded-xl glass-btn-secondary text-xs font-semibold">Archive</button>` : ''}
      </div>
      <button id="close-detail-btn" type="button" class="min-h-[40px] px-4 rounded-xl glass-btn-secondary text-xs font-semibold">Close</button>
    `;
    document.getElementById('btn-fac-edit').addEventListener('click', () => { closeModal('detail-modal'); openGuidedSubmission(table, id); });
    const archBtn = document.getElementById('btn-fac-archive');
    if (archBtn) archBtn.addEventListener('click', () => openModerationActionFlow(table, id, 'Archived'));
  } else if (isStudent && REPORTABLE_TABLES.includes(table) && rec.Verification_Status === 'Published') {
    footer.innerHTML = `
      <button id="btn-student-report" type="button" class="min-h-[40px] px-3.5 rounded-xl glass-btn-secondary text-xs font-semibold text-crimson-700 border-crimson-200 inline-flex items-center gap-1.5">
        <i data-lucide="flag" class="w-3.5 h-3.5"></i> Report Information
      </button>
      <button id="close-detail-btn" type="button" class="min-h-[40px] px-4 rounded-xl glass-btn-navy text-xs font-semibold">Done</button>
    `;
    document.getElementById('btn-student-report').addEventListener('click', () => openReportModal(table, id));
  } else {
    footer.innerHTML = `<span class="text-xs text-[#64748B]">HIT Connect Campus Information</span><button id="close-detail-btn" type="button" class="min-h-[40px] px-4 rounded-xl glass-btn-navy text-xs font-semibold">Done</button>`;
  }

  document.getElementById('close-detail-btn').addEventListener('click', () => closeModal('detail-modal'));
  document.querySelectorAll('.linked-profile-btn').forEach((b) => {
    b.addEventListener('click', () => openDetail(b.dataset.openTable, b.dataset.openId));
  });

  // Bind Admin Moderation Buttons
  const modEdit = document.getElementById('admin-mod-edit');
  if (modEdit) modEdit.addEventListener('click', () => { closeModal('detail-modal'); openGuidedSubmission(table, id); });
  document.querySelectorAll('.admin-mod-btn').forEach((b) => {
    b.addEventListener('click', () => openModerationActionFlow(table, id, b.dataset.modStatus));
  });
  document.getElementById('admin-fac-perms')?.addEventListener('click', () => { closeModal('detail-modal'); openFacultyPermissionsFlow(id); });
  document.getElementById('admin-fac-reset')?.addEventListener('click', () => { closeModal('detail-modal'); openFacultyResetCredentialsFlow(id); });
  document.getElementById('admin-fac-suspend')?.addEventListener('click', () => { closeModal('detail-modal'); openFacultyAccountStatusFlow(id, 'Suspended'); });
  document.getElementById('admin-fac-deactivate')?.addEventListener('click', () => { closeModal('detail-modal'); openFacultyAccountStatusFlow(id, 'Deactivated'); });
  document.getElementById('admin-fac-activate')?.addEventListener('click', () => { closeModal('detail-modal'); openFacultyAccountStatusFlow(id, 'Active'); });

  openModal('detail-modal');
  if (window.lucide) lucide.createIcons();
}
