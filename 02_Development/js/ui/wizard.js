// HIT Connect — Guided Direct Publishing & Before/After Edit Wizard

function openGuidedSubmission(presetTable, editId) {
  if (!canCreateRecord()) { showToast('Students have read-only access.'); return; }
  if (state.session.role === 'faculty' && !isFacultyAccountActive()) {
    showToast('Your faculty account is not active. Publishing is disabled.');
    return;
  }

  let existing = null;
  if (editId && presetTable) {
    existing = (state.db[presetTable] || []).find((r) => r[TABLE_META[presetTable].key] === editId);
    if (!canReviseRecord(existing, presetTable)) {
      showToast('You do not have permission to edit this record.');
      return;
    }
  } else if (state.session.role === 'faculty' && !hasFacultyPermission('canPublish')) {
    showToast('Your faculty account does not currently have publishing permission.');
    return;
  }

  const defaultDept = state.session.departmentId && state.session.departmentId !== 'ALL' ? state.session.departmentId : 'DEP-001';
  state.wizard = {
    active: true,
    step: presetTable ? 2 : 1,
    table: presetTable || 'Announcements',
    editId: editId || null,
    original: existing ? JSON.parse(JSON.stringify(existing)) : null,
    data: existing
      ? { ...existing }
      : {
          Publication_Date: todayLocalISO(),
          Department_ID: defaultDept,
          Clarification_Contact_ID: state.session.linkedPersonId || 'ADM-001',
          Is_Urgent: false
        }
  };

  document.getElementById('form-modal-title').textContent = editId
    ? (state.session.role === 'administrator' ? 'Edit / Correct Information' : 'Edit My Publication')
    : 'Create Information';
  document.getElementById('form-modal-subtitle').textContent = editId
    ? 'Update the required fields and review the before-and-after summary before saving.'
    : 'Complete all details and confirm the publication summary to publish directly.';
  document.getElementById('form-reverify-notice').classList.toggle('hidden', !editId);
  renderWizardStep();
  openModal('form-modal');
}

function captureWizardInputs() {
  const form = document.getElementById('record-form');
  if (!form) return;
  const schema = FORM_SCHEMAS[state.wizard.table] || [];
  const stepFields = schema.filter((f) => f.step === state.wizard.step);
  stepFields.forEach((f) => {
    const el = form.querySelector(`[name="${f.name}"]`);
    if (!el) return;
    if (f.type === 'checkbox') {
      state.wizard.data[f.name] = Boolean(el.checked);
    } else if (!(state.session.role === 'faculty' && f.facultyLocked)) {
      state.wizard.data[f.name] = String(el.value || '').trim();
    }
  });
  const contactEl = form.querySelector('[name="Clarification_Contact_ID"]');
  if (contactEl) state.wizard.data.Clarification_Contact_ID = contactEl.value;
}

function renderPublicationSummaryGrid(w) {
  const d = w.data;
  const meta = TABLE_META[w.table];
  const titleVal = d[meta.label] || d.Title || d.Event_Name || d.Resource_Name || '—';
  const contactObj = resolveLinkedPerson(d.Clarification_Contact_ID || state.session.linkedPersonId);
  const authorIdentity = state.session.role === 'faculty'
    ? `${state.session.name} (${state.session.employeeId || state.session.facultyId}) · ${state.session.designation}`
    : `${state.session.name} (Administrator)`;
  const deptName = getDeptFullName(d.Department_ID || state.session.departmentId);
  const attachLink = d.Attachments_Links || d.Document_Link || d.Registration_Link || d.Application_URL || '';

  const rows = [
    ['Title', titleVal],
    ['Category', `${meta.friendly}${d.Category ? ' — ' + d.Category : ''}`],
    ['Description', d.Description || d.Responsibilities || '—'],
    ['Author Official Identity', authorIdentity],
    ['Department', deptName],
    ['Target Audience', d.Target_Audience || d.Relevant_Departments || 'All Students'],
    ['Relevant Year / Semester', d.Relevant_Year_Semester || d.Relevant_Years || d.Semester || 'All'],
    ['Event Date & Time', [formatDisplayDate(d.Event_Date) || d.Event_Date, d.Event_Time || [d.Start_Time, d.End_Time].filter(Boolean).join(' – ')].filter(Boolean).join(' · ') || 'Not applicable'],
    ['Venue / Location', d.Venue || d.Location || 'Not applicable'],
    ['Registration / Application Deadline', formatDisplayDate(d.Registration_Deadline || d.Application_Deadline) || d.Registration_Deadline || d.Application_Deadline || 'Not applicable'],
    ['Official Contact Details', contactObj ? `${contactObj.name} (${contactObj.email || contactObj.phone || 'Official Directory'})` : 'Department Office'],
    ['Attachments & Links', attachLink || 'None'],
    ['Urgency / Priority', d.Is_Urgent ? 'URGENT (Prioritised notification to selected audience)' : 'Standard'],
    ['Visibility & Validity Period', `Published immediately to selected audience${d.Expiry_Date ? ' · Valid until ' + (formatDisplayDate(d.Expiry_Date) || d.Expiry_Date) : ''}`]
  ];

  return `
    <div class="rounded-xl glass-subtle p-3.5 space-y-2 text-xs">
      <div class="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-200/70">
        <span class="font-bold uppercase tracking-wider text-navy-800">Mandatory Publication Summary</span>
        ${isDemoEnvironment() ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gold-50 text-gold-800 border border-gold-200">DEMO ACTION</span>` : ''}
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        ${rows.map(([lbl, val]) => `
          <div class="${lbl === 'Description' ? 'sm:col-span-2' : ''}">
            <div class="text-[10px] font-semibold uppercase tracking-wide text-[#64748B]">${escapeHtml(lbl)}</div>
            <div class="text-xs text-[#18212F] font-medium mt-0.5 break-words">${escapeHtml(val)}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderBeforeAfterDiffHtml(w) {
  const diffs = computeRecordDiff(w.table, w.original, w.data);
  const isAdmin = state.session.role === 'administrator';
  const hasSignificant = diffs.some((d) => d.isSignificant);

  if (!diffs.length) {
    return `<div class="rounded-xl glass-subtle p-4 text-xs text-[#64748B]">No field changes detected compared to the current saved version. Go back to modify fields or cancel.</div>`;
  }

  return `
    <div class="rounded-xl glass-subtle p-3.5 space-y-2.5 text-xs">
      <div class="flex items-center justify-between gap-2">
        <span class="font-bold uppercase tracking-wider text-navy-800">Before &amp; After Comparison (${diffs.length} change${diffs.length > 1 ? 's' : ''})</span>
        ${hasSignificant ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-900 border border-amber-300">Significant Details Changed</span>` : `<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/80 text-slate-700 border border-slate-200">Minor Edit</span>`}
      </div>
      <div class="space-y-2">
        ${diffs.map((d) => `
          <div class="rounded-lg bg-white/75 border border-slate-200/80 p-2.5 space-y-1">
            <div class="font-semibold text-[#18212F]">${escapeHtml(d.label)}</div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div class="rounded-md bg-rose-50/80 border border-rose-200/80 px-2.5 py-1.5">
                <span class="block text-[10px] font-bold uppercase text-rose-800">Original</span>
                <span class="text-[#18212F] break-words">${escapeHtml(d.before)}</span>
              </div>
              <div class="rounded-md bg-emerald-50/80 border border-emerald-200/80 px-2.5 py-1.5">
                <span class="block text-[10px] font-bold uppercase text-emerald-800">Proposed</span>
                <span class="text-[#18212F] break-words">${escapeHtml(d.after)}</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
      ${isAdmin ? `
        <div class="pt-2 border-t border-slate-200/70 space-y-2">
          <div>
            <label for="wiz-correction-reason" class="block text-xs font-semibold text-[#18212F] mb-1">Correction / Edit Reason (Recorded in Audit History) <span class="text-crimson-600">*</span></label>
            <textarea id="wiz-correction-reason" rows="2" placeholder="Explain what was corrected and why..." class="w-full px-3 py-2 glass-input rounded-xl text-xs"></textarea>
          </div>
          <label class="flex items-start gap-2 text-xs cursor-pointer">
            <input id="wiz-notify-students" type="checkbox" ${hasSignificant ? 'checked' : ''} class="mt-0.5 rounded text-crimson-600" />
            <span><strong>Notify affected students</strong> about this update (recommended only for date, venue, deadline, eligibility, or instruction changes — leave unchecked for minor formatting fixes).</span>
          </label>
        </div>
      ` : `
        <div class="pt-2 border-t border-slate-200/70">
          <label for="wiz-correction-reason" class="block text-xs font-semibold text-[#18212F] mb-1">Edit Note (Optional, Recorded in Audit History)</label>
          <input id="wiz-correction-reason" type="text" placeholder="e.g. Updated seminar hall room number" class="w-full min-h-[38px] px-3 glass-input rounded-xl text-xs" />
        </div>
      `}
    </div>
  `;
}

function renderWizardStep() {
  const w = state.wizard;
  const isFaculty = state.session.role === 'faculty';
  document.getElementById('form-error').classList.add('hidden');
  document.querySelectorAll('.step-ind').forEach((el) => {
    const s = Number(el.dataset.stepInd);
    el.className = s === w.step ? 'step-ind text-crimson-700 font-bold' : s < w.step ? 'step-ind text-emerald-700' : 'step-ind text-slate-400';
  });

  const content = document.getElementById('form-step-content');
  const footer = document.getElementById('form-footer');
  const schema = FORM_SCHEMAS[w.table] || [];

  if (w.step === 1) {
    const cats = SUBMISSION_CATEGORIES.filter((c) => state.session.role === 'administrator' || c.facultyAllowed);
    content.innerHTML = `
      <p class="text-xs text-[#64748B]">Select the category of campus information you want to publish:</p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        ${cats.map((c) => `
          <button type="button" data-wiz-cat="${c.table}" class="wiz-cat-btn text-left p-3.5 rounded-xl glass-card ${w.table === c.table ? 'ring-2 ring-crimson-600 bg-crimson-50/70' : 'hover:border-crimson-400'} transition flex items-start gap-3">
            <div class="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 text-crimson-600"><i data-lucide="${c.icon}" class="w-4 h-4"></i></div>
            <div><div class="text-sm font-bold text-[#18212F]">${c.title}</div><div class="text-[11px] text-[#64748B]">${c.desc}</div></div>
          </button>
        `).join('')}
      </div>
    `;
    footer.innerHTML = `<button type="button" id="wiz-cancel" class="min-h-[40px] px-4 rounded-xl glass-btn-secondary text-xs font-semibold">Cancel</button><button type="button" id="wiz-next" class="min-h-[40px] px-4 rounded-xl glass-btn-primary text-xs font-semibold">Continue &rarr;</button>`;
  } else if (w.step === 2 || w.step === 3) {
    const fields = schema.filter((f) => f.step === w.step);
    const autoIdentityBanner = w.step === 3 ? `
      <div class="rounded-xl glass-subtle p-3.5 text-xs space-y-1 border-l-4 border-l-navy-800">
        <div class="font-bold text-[#18212F]">Official Author Identity (Auto-Populated from Database)</div>
        <div class="text-[#18212F] font-semibold">${escapeHtml(state.session.name)} ${state.session.employeeId ? `· ${escapeHtml(state.session.employeeId)}` : ''}</div>
        <div class="text-[#64748B]">${escapeHtml(state.session.designation || state.session.roleLabel)} &middot; ${escapeHtml(getDeptFullName(state.session.departmentId))}</div>
        ${isFaculty ? `<p class="text-[11px] text-[#64748B]">Protected institutional identity fields are linked to your official account and cannot be altered here.</p>` : ''}
      </div>
      ${!['Faculty', 'Administrative_Contacts', 'Departments'].includes(w.table) ? `
        <div>
          <label class="block text-xs font-semibold text-[#18212F] mb-1">Official Contact for Student Clarification <span class="text-crimson-600">*</span></label>
          <select name="Clarification_Contact_ID" class="w-full min-h-[42px] px-3 glass-input rounded-xl text-sm">
            ${getAllContactOptions().map((o) => `<option value="${escapeHtml(o.id)}" ${(w.data.Clarification_Contact_ID || state.session.linkedPersonId || 'ADM-001') === o.id ? 'selected' : ''}>${escapeHtml(o.label)}</option>`).join('')}
          </select>
        </div>
      ` : ''}
    ` : '';

    content.innerHTML = autoIdentityBanner + fields.map((f) => {
      if (f.type === 'checkbox') {
        if (f.name === 'Is_Urgent' && isFaculty && !hasFacultyPermission('canMarkUrgent')) return '';
        return `
          <label class="flex items-start gap-2.5 p-3 rounded-xl glass-subtle text-xs cursor-pointer">
            <input name="${f.name}" type="checkbox" ${w.data[f.name] ? 'checked' : ''} class="mt-0.5 rounded text-crimson-600" />
            <span class="font-semibold text-[#18212F]">${escapeHtml(f.label)}</span>
          </label>
        `;
      }
      const val = w.data[f.name] || '';
      const req = f.required ? '<span class="text-crimson-600">*</span>' : '';
      if (f.type === 'dept') {
        const locked = isFaculty && f.facultyLocked;
        const lockedDeptId = locked ? state.session.departmentId : val;
        return `
          <div>
            <label class="block text-xs font-semibold text-[#18212F] mb-1">${f.label} ${req} ${locked ? '<span class="text-[10px] text-[#64748B] font-normal">(Auto-populated from official profile)</span>' : ''}</label>
            <select name="${f.name}" ${locked ? 'disabled' : ''} class="w-full min-h-[42px] px-3 glass-input rounded-xl text-sm ${locked ? 'opacity-80 cursor-not-allowed' : ''}">
              ${state.db.Departments.map((d) => `<option value="${d.Department_ID}" ${lockedDeptId === d.Department_ID ? 'selected' : ''}>${escapeHtml(d.Department_Code)} — ${escapeHtml(d.Department_Name)}</option>`).join('')}
            </select>
          </div>
        `;
      }
      if (f.type === 'category') {
        return `<div><label class="block text-xs font-semibold text-[#18212F] mb-1">${f.label} ${req}</label><select name="${f.name}" class="w-full min-h-[42px] px-3 glass-input rounded-xl text-sm">${(CATEGORY_OPTIONS[w.table] || ['General']).map((o) => `<option value="${escapeHtml(o)}" ${val === o ? 'selected' : ''}>${escapeHtml(o)}</option>`).join('')}</select></div>`;
      }
      if (f.type === 'textarea') {
        return `<div><label class="block text-xs font-semibold text-[#18212F] mb-1">${f.label} ${req}</label><textarea name="${f.name}" rows="3" class="w-full px-3 py-2 glass-input rounded-xl text-sm">${escapeHtml(val)}</textarea></div>`;
      }
      return `<div><label class="block text-xs font-semibold text-[#18212F] mb-1">${f.label} ${req}</label><input name="${f.name}" type="${f.type}" value="${escapeHtml(val)}" placeholder="${escapeHtml(f.placeholder || '')}" class="w-full min-h-[42px] px-3 glass-input rounded-xl text-sm" /></div>`;
    }).join('');

    footer.innerHTML = `<button type="button" id="wiz-back" class="min-h-[40px] px-4 rounded-xl glass-btn-secondary text-xs font-semibold">&larr; Back</button><button type="button" id="wiz-next" class="min-h-[40px] px-4 rounded-xl glass-btn-primary text-xs font-semibold">${w.step === 2 ? 'Next: Contact &amp; Source &rarr;' : 'Next: Review Summary &rarr;'}</button>`;
  } else {
    // Step 4: Mandatory Confirmation Summary (New Direct Publish OR Before/After Edit Diff)
    if (w.editId) {
      content.innerHTML = `
        ${renderBeforeAfterDiffHtml(w)}
        ${renderPublicationSummaryGrid(w)}
        <div class="rounded-xl bg-amber-50/90 border border-amber-200 p-3 text-xs text-amber-900 font-medium">
          Please verify that all updated information displayed above is accurate before saving changes.
        </div>
      `;
      const hasChanges = computeRecordDiff(w.table, w.original, w.data).length > 0;
      footer.innerHTML = `
        <button type="button" id="wiz-back" class="min-h-[40px] px-3.5 rounded-xl glass-btn-secondary text-xs font-semibold">Go Back &amp; Edit</button>
        <div class="flex items-center gap-2">
          <button type="button" id="wiz-cancel" class="min-h-[40px] px-3.5 rounded-xl glass-btn-secondary text-xs font-semibold">Cancel</button>
          <button type="button" id="wiz-confirm-publish" ${hasChanges ? '' : 'disabled'} class="min-h-[40px] px-4 rounded-xl glass-btn-primary text-xs font-semibold ${hasChanges ? '' : 'opacity-50 cursor-not-allowed'}">Confirm &amp; Save Changes</button>
        </div>
      `;
    } else {
      content.innerHTML = `
        ${renderPublicationSummaryGrid(w)}
        <div class="rounded-xl bg-crimson-50/90 border border-crimson-200 p-3.5 text-xs text-crimson-900 font-medium leading-relaxed">
          Please verify that all the information displayed above is accurate and ready to be published to the selected students.
        </div>
      `;
      footer.innerHTML = `
        <button type="button" id="wiz-back" class="min-h-[40px] px-3.5 rounded-xl glass-btn-secondary text-xs font-semibold">Go Back &amp; Edit</button>
        <div class="flex flex-wrap items-center gap-2">
          <button type="button" id="wiz-cancel" class="min-h-[40px] px-3 rounded-xl glass-btn-secondary text-xs font-semibold">Cancel</button>
          <button type="button" id="wiz-save-draft" class="min-h-[40px] px-3 rounded-xl glass-btn-secondary text-xs font-semibold">Save Draft</button>
          <button type="button" id="wiz-confirm-publish" class="min-h-[40px] px-4 rounded-xl glass-btn-primary text-xs font-semibold">Confirm &amp; Publish</button>
        </div>
      `;
    }
  }

  if (window.lucide) lucide.createIcons();

  content.querySelectorAll('.wiz-cat-btn').forEach((b) => {
    b.addEventListener('click', () => { state.wizard.table = b.dataset.wizCat; renderWizardStep(); });
  });
  const cancel = document.getElementById('wiz-cancel');
  if (cancel) cancel.addEventListener('click', () => closeModal('form-modal'));
  const back = document.getElementById('wiz-back');
  if (back) back.addEventListener('click', () => {
    if (w.step === 2 || w.step === 3) captureWizardInputs();
    state.wizard.step = Math.max(w.editId ? 2 : 1, state.wizard.step - 1);
    renderWizardStep();
  });
  const next = document.getElementById('wiz-next');
  if (next) next.addEventListener('click', () => {
    captureWizardInputs();
    if (w.step === 2 || w.step === 3) {
      const errs = [];
      schema.filter((f) => f.step === w.step).forEach((f) => {
        if (f.type === 'checkbox') return;
        const v = String(w.data[f.name] || '').trim();
        if (f.required && !v && !(isFaculty && f.facultyLocked)) errs.push(`${f.label} is required.`);
        if (v && f.type === 'url' && !isValidHttpsUrl(v)) errs.push(`${f.label} must be a valid https:// URL.`);
        if (v && f.type === 'email' && !isValidEmail(v)) errs.push(`${f.label} must be a valid email.`);
      });
      if (errs.length) {
        const errEl = document.getElementById('form-error');
        errEl.textContent = errs.join(' ');
        errEl.classList.remove('hidden');
        return;
      }
    }
    state.wizard.step += 1;
    renderWizardStep();
  });

  const saveDraft = document.getElementById('wiz-save-draft');
  if (saveDraft) saveDraft.addEventListener('click', () => finalizeWizardSubmission('Draft'));
  const confirmPub = document.getElementById('wiz-confirm-publish');
  if (confirmPub) confirmPub.addEventListener('click', () => finalizeWizardSubmission('Published'));
}

function finalizeWizardSubmission(targetStatus) {
  const w = state.wizard;
  const reasonInput = document.getElementById('wiz-correction-reason');
  const notifyCheck = document.getElementById('wiz-notify-students');
  const correctionReason = reasonInput ? reasonInput.value.trim() : '';
  const notifyStudents = notifyCheck ? notifyCheck.checked : true;

  const res = publishOrSaveRecord(w.table, w.data, {
    editId: w.editId,
    targetStatus,
    correctionReason,
    notifyStudents
  });

  if (!res.ok) {
    const errEl = document.getElementById('form-error');
    errEl.textContent = res.error;
    errEl.classList.remove('hidden');
    return;
  }

  closeModal('form-modal');
  render();
  const prefix = isDemoEnvironment() ? 'DEMO ACTION: ' : '';
  if (w.editId) {
    showToast(`${prefix}Changes saved${res.notifiedStudents ? ' & affected students notified' : ''}`);
  } else {
    showToast(targetStatus === 'Published' ? `${prefix}Information published directly to students` : `${prefix}Saved as Draft`);
  }
}
