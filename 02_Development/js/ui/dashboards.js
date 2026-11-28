// HIT Connect — Role-Based Dashboards (Student, Faculty, Administrator)

// ==================== 1. STUDENT DASHBOARD ====================
function renderStudentDashboard() {
  const s = state.session;
  const myDeptId = s.departmentId;
  const myYear = s.yearOfStudy || 1;
  const anns = state.db.Announcements.filter((r) => isVisibleInCurrentMode(r, 'Announcements')).slice(0, 3);
  const evts = state.db.Events.filter((r) => isVisibleInCurrentMode(r, 'Events') && getEventTimeStatus(r.Event_Date) === 'Upcoming').slice(0, 2);
  const opps = state.db.Opportunities.filter((r) => {
    if (!isVisibleInCurrentMode(r, 'Opportunities')) return false;
    const yrs = String(r.Relevant_Years || '').toLowerCase();
    if (myYear === 1 && (yrs.includes('1st') || yrs.includes('all'))) return true;
    if (myYear === 2 && (yrs.includes('2nd') || yrs.includes('all'))) return true;
    if (myYear === 3 && (yrs.includes('3rd') || yrs.includes('all'))) return true;
    if (myYear === 4 && (yrs.includes('final') || yrs.includes('4th') || yrs.includes('all'))) return true;
    return false;
  });
  const myDeptAcad = state.db.Academics.filter((r) => isVisibleInCurrentMode(r, 'Academics') && r.Department_ID === myDeptId);
  const unreadNotifs = getNotificationsForCurrentUser().filter((n) => !(n.Read_By || []).includes(s.userId));

  const quickLinks = [
    { tab: 'academics', label: 'Academics', sub: 'Syllabus & Docs', icon: 'book-open', cls: 'bg-crimson-50 text-crimson-700 border-crimson-200' },
    { tab: 'opportunities', label: 'Opportunities', sub: 'Internships & More', icon: 'briefcase', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { tab: 'updates', label: 'Campus Updates', sub: 'Events & Notices', icon: 'bell', cls: 'bg-gold-50 text-gold-800 border-gold-200' },
    { tab: 'people', label: 'People', sub: 'Faculty & Offices', icon: 'users', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    { tab: 'services', label: 'Campus Services', sub: 'Library & Clubs', icon: 'building-2', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    { tab: 'department', label: 'My Department', sub: s.departmentCode || 'Dept Hub', icon: 'landmark', cls: 'bg-navy-50 text-navy-800 border-navy-100' }
  ];

  return `
    <section class="glass-panel p-4 sm:p-5 space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-3.5 min-w-0">
          <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-full glass-btn-primary font-bold text-base flex items-center justify-center shrink-0">${escapeHtml(getInitials(s.name || 'ST'))}</div>
          <div class="min-w-0">
            <h2 class="hit-serif text-lg sm:text-xl font-bold text-[#18212F] truncate">${s.name ? `Welcome, ${escapeHtml(s.name)}` : 'Welcome to HIT Connect'}</h2>
            <p class="text-xs sm:text-sm font-semibold text-crimson-700 truncate">${escapeHtml(s.programmeName)}</p>
            <p class="text-xs text-[#64748B]">Reg. No: <span class="font-mono text-[#18212F]">${escapeHtml(s.userId)}</span></p>
          </div>
        </div>
        ${isDemoEnvironment() ? `<span class="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gold-50/90 text-gold-800 border border-gold-200">DEMO DATA</span>` : ''}
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-slate-200/60 text-xs">
        <div class="rounded-xl glass-subtle p-2.5"><div class="text-[10px] uppercase font-semibold text-[#64748B]">Department</div><div class="font-semibold text-[#18212F] mt-0.5">${escapeHtml(s.departmentCode)}</div></div>
        <div class="rounded-xl glass-subtle p-2.5"><div class="text-[10px] uppercase font-semibold text-[#64748B]">Admission Batch</div><div class="font-semibold text-[#18212F] mt-0.5">${escapeHtml(s.batch)}</div></div>
        <div class="rounded-xl glass-subtle p-2.5"><div class="text-[10px] uppercase font-semibold text-[#64748B]">Academic Year</div><div class="font-semibold text-[#18212F] mt-0.5">${escapeHtml(s.academicYear)}</div></div>
        <div class="rounded-xl glass-subtle p-2.5"><div class="text-[10px] uppercase font-semibold text-[#64748B]">Current Semester</div><div class="font-semibold text-crimson-700 mt-0.5">Semester ${escapeHtml(s.currentSemester)}</div></div>
      </div>
    </section>

    ${unreadNotifs.length ? `
      <section class="glass-panel p-4 space-y-2.5" aria-label="Campus Notifications">
        <div class="flex items-center justify-between gap-2">
          <h3 class="text-sm font-bold text-[#18212F] flex items-center gap-1.5">
            <i data-lucide="bell-ring" class="w-4 h-4 text-crimson-600"></i> Important Notifications (${unreadNotifs.length})
          </h3>
        </div>
        <div class="space-y-2">
          ${unreadNotifs.slice(0, 4).map((n) => `
            <div class="rounded-xl glass-subtle p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${n.Is_Urgent ? 'border-l-4 border-l-rose-600' : 'border-l-4 border-l-crimson-600'}">
              <div class="space-y-0.5">
                <div class="flex flex-wrap items-center gap-1.5">
                  ${n.Is_Urgent ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-300">URGENT</span>` : ''}
                  ${n.Is_Demo ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gold-50 text-gold-800 border border-gold-200">DEMO DATA</span>` : ''}
                  <strong class="text-[#18212F]">${escapeHtml(n.Title)}</strong>
                </div>
                <p class="text-[#64748B]">${escapeHtml(n.Message)}</p>
                <div class="text-[10px] text-[#64748B]">${escapeHtml(n.Created_At)}</div>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                ${n.Table_Name && n.Record_ID ? `<button type="button" data-open-table="${escapeHtml(n.Table_Name)}" data-open-id="${escapeHtml(n.Record_ID)}" class="record-card px-2.5 py-1 rounded-lg glass-btn-secondary text-[11px] font-semibold">View</button>` : ''}
                <button type="button" data-mark-read="${escapeHtml(n.Notification_ID)}" class="mark-notif-read px-2.5 py-1 rounded-lg text-[11px] font-semibold text-crimson-700 hover:bg-crimson-50">Dismiss</button>
              </div>
            </div>
          `).join('')}
        </div>
      </section>
    ` : ''}

    <section aria-label="Quick Access">
      <h3 class="text-sm font-bold text-[#18212F] mb-2.5">Quick Access</h3>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        ${quickLinks.map((q) => `
          <button type="button" data-jump="${q.tab}" class="jump-btn glass-card glass-card-interactive p-3 text-left flex flex-col gap-2 min-h-[86px]">
            <div class="w-9 h-9 rounded-lg border ${q.cls} flex items-center justify-center"><i data-lucide="${q.icon}" class="w-4 h-4"></i></div>
            <div>
              <div class="text-xs font-bold text-[#18212F]">${q.label}</div>
              <div class="text-[11px] text-[#64748B]">${q.sub}</div>
            </div>
          </button>
        `).join('')}
      </div>
    </section>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <section class="lg:col-span-7 space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-base font-bold text-[#18212F]">Important Campus Updates</h3>
          <button type="button" data-jump="updates" class="jump-btn text-xs font-semibold text-crimson-600 hover:underline">View all</button>
        </div>
        <div class="space-y-3">
          ${anns.map((r) => renderCard('Announcements', r)).join('')}
          ${evts.map((r) => renderCard('Events', r)).join('')}
          ${(!anns.length && !evts.length) ? `<div class="glass-card p-6 text-center text-xs text-[#64748B]">No campus updates published yet.</div>` : ''}
        </div>
      </section>

      <section class="lg:col-span-5 space-y-5">
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-base font-bold text-[#18212F]">Recommended for Your Year</h3>
            <button type="button" data-jump="opportunities" class="jump-btn text-xs font-semibold text-crimson-600 hover:underline">All opportunities</button>
          </div>
          <div class="space-y-3">
            ${(opps.length ? opps : state.db.Opportunities.filter((r) => isVisibleInCurrentMode(r, 'Opportunities'))).slice(0, 2).map((r) => renderCard('Opportunities', r)).join('')}
          </div>
        </div>

        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-base font-bold text-[#18212F]">${escapeHtml(s.departmentCode)} Academics</h3>
            <button type="button" data-jump="department" class="jump-btn text-xs font-semibold text-crimson-600 hover:underline">Open My Department</button>
          </div>
          ${myDeptAcad.length
            ? `<div class="space-y-3">${myDeptAcad.slice(0, 2).map((r) => renderCard('Academics', r)).join('')}</div>`
            : `<div class="glass-card p-4 text-xs text-[#64748B]">No department-specific academic documents published for ${escapeHtml(s.departmentCode)} yet. <button type="button" data-jump="academics" class="jump-btn text-crimson-600 font-semibold hover:underline">Browse all Academics</button>.</div>`}
        </div>
      </section>
    </div>
  `;
}

// ==================== 2. FACULTY DASHBOARD ====================
function renderFacultyDashboard() {
  const s = state.session;
  const facProfile = getCurrentFacultyProfile();
  const myRecords = [];
  FACULTY_PUBLISH_TABLES.forEach((t) => {
    (state.db[t] || []).forEach((r) => {
      if (isOwnedByCurrentFaculty(r)) myRecords.push({ table: t, rec: r });
    });
  });

  const counts = {
    'Published': myRecords.filter((x) => x.rec.Verification_Status === 'Published' || x.rec.Verification_Status === 'Verified').length,
    'Draft': myRecords.filter((x) => x.rec.Verification_Status === 'Draft').length,
    'Archived': myRecords.filter((x) => x.rec.Verification_Status === 'Archived').length,
    'Moderated': myRecords.filter((x) => x.rec.Verification_Status === 'Temporarily Hidden' || x.rec.Verification_Status === 'Removed').length
  };

  if (!['Published', 'Draft', 'Archived', 'Moderated'].includes(state.facultySubTab)) {
    state.facultySubTab = 'Published';
  }

  const filtered = myRecords.filter((x) => {
    if (state.facultySubTab === 'Published') return x.rec.Verification_Status === 'Published' || x.rec.Verification_Status === 'Verified';
    if (state.facultySubTab === 'Moderated') return x.rec.Verification_Status === 'Temporarily Hidden' || x.rec.Verification_Status === 'Removed';
    return x.rec.Verification_Status === state.facultySubTab;
  });

  const facNotifs = getNotificationsForCurrentUser().filter((n) => !(n.Read_By || []).includes(s.userId));

  return `
    <!-- Official Faculty Profile (Auto-Populated from DB) -->
    <section class="glass-panel p-4 sm:p-5 space-y-3">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-12 h-12 rounded-full bg-crimson-50 text-crimson-700 border border-crimson-200 font-bold text-sm flex items-center justify-center shrink-0">${escapeHtml(getInitials(s.name))}</div>
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <h2 class="hit-serif text-lg sm:text-xl font-bold text-[#18212F] truncate">${escapeHtml(s.name)}</h2>
              ${accountStatusBadge(facProfile ? facProfile.Account_Status : 'Active')}
              ${isDemoEnvironment() ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gold-50 text-gold-800 border border-gold-200">DEMO DATA</span>` : ''}
            </div>
            <p class="text-xs text-[#64748B]">${escapeHtml(s.designation)} &middot; <strong class="text-crimson-700">${escapeHtml(getDeptFullName(s.departmentId))}</strong></p>
            <p class="text-[11px] text-[#64748B]">Faculty ID: <span class="font-mono text-[#18212F]">${escapeHtml(s.employeeId || s.facultyId)}</span> &middot; ${escapeHtml(s.officialEmail || '')}</p>
          </div>
        </div>
        <button id="btn-request-profile-fix" type="button" class="min-h-[36px] px-3 rounded-xl glass-btn-secondary text-xs font-semibold">Request Profile Correction</button>
      </div>
      ${facProfile ? `
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 text-xs">
          <div class="rounded-xl glass-subtle p-2.5"><div class="text-[10px] uppercase font-semibold text-[#64748B]">Qualifications</div><div class="font-medium text-[#18212F] mt-0.5">${escapeHtml(facProfile.Qualifications || '—')}</div></div>
          <div class="rounded-xl glass-subtle p-2.5"><div class="text-[10px] uppercase font-semibold text-[#64748B]">Subjects Handled</div><div class="font-medium text-[#18212F] mt-0.5 truncate">${escapeHtml(facProfile.Subjects_Handled || '—')}</div></div>
          <div class="rounded-xl glass-subtle p-2.5"><div class="text-[10px] uppercase font-semibold text-[#64748B]">Publishing Mode</div><div class="font-semibold text-emerald-800 mt-0.5">Direct Publish (Confirmed Summary)</div></div>
        </div>
      ` : ''}
    </section>

    ${facNotifs.length ? `
      <section class="glass-panel p-4 space-y-2.5">
        <h3 class="text-sm font-bold text-[#18212F] flex items-center gap-1.5">
          <i data-lucide="bell" class="w-4 h-4 text-crimson-600"></i> Administrative &amp; Report Alerts (${facNotifs.length})
        </h3>
        <div class="space-y-2">
          ${facNotifs.slice(0, 4).map((n) => `
            <div class="rounded-xl glass-subtle p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-l-4 border-l-amber-500">
              <div>
                <div class="font-bold text-[#18212F]">${escapeHtml(n.Title)}</div>
                <div class="text-[#64748B]">${escapeHtml(n.Message)}</div>
                <div class="text-[10px] text-[#64748B] mt-0.5">${escapeHtml(n.Created_At)}</div>
              </div>
              <button type="button" data-mark-read="${escapeHtml(n.Notification_ID)}" class="mark-notif-read shrink-0 px-2.5 py-1 rounded-lg glass-btn-secondary text-[11px] font-semibold">Mark Read</button>
            </div>
          `).join('')}
        </div>
      </section>
    ` : ''}

    <section class="glass-panel p-4 sm:p-5 space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 class="text-base font-bold text-[#18212F]">Create &amp; Publish Information Directly</h3>
          <p class="text-xs text-[#64748B]">Your official faculty identity and department are populated automatically. Review and confirm before publishing.</p>
        </div>
      </div>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <button type="button" data-quick-add="Announcements" class="quick-add-btn min-h-[78px] p-3.5 rounded-xl glass-btn-primary text-left flex flex-col justify-between">
          <i data-lucide="megaphone" class="w-5 h-5"></i>
          <span class="text-xs sm:text-sm font-semibold">Publish Announcement</span>
        </button>
        <button type="button" data-quick-add="Opportunities" class="quick-add-btn min-h-[78px] p-3.5 rounded-xl glass-btn-navy text-left flex flex-col justify-between">
          <i data-lucide="briefcase" class="w-5 h-5"></i>
          <span class="text-xs sm:text-sm font-semibold">Publish Opportunity</span>
        </button>
        <button type="button" data-quick-add="Academics" class="quick-add-btn min-h-[78px] p-3.5 rounded-xl glass-card glass-card-interactive text-left flex flex-col justify-between">
          <i data-lucide="book-open" class="w-5 h-5 text-crimson-600"></i>
          <span class="text-xs sm:text-sm font-semibold text-[#18212F]">Publish Academic Info</span>
        </button>
        <button type="button" data-quick-add="Events" class="quick-add-btn min-h-[78px] p-3.5 rounded-xl glass-card glass-card-interactive text-left flex flex-col justify-between">
          <i data-lucide="calendar-days" class="w-5 h-5 text-crimson-600"></i>
          <span class="text-xs sm:text-sm font-semibold text-[#18212F]">Publish Campus Event</span>
        </button>
      </div>
    </section>

    <section class="glass-panel p-4 sm:p-5 space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h3 class="text-base font-bold text-[#18212F]">My Publications</h3>
        <span class="text-xs text-[#64748B]">You can edit your own active posts. All changes are logged in audit history.</span>
      </div>

      <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1" role="tablist">
        ${[
          ['Published', `Published (${counts.Published})`],
          ['Draft', `Drafts (${counts.Draft})`],
          ['Archived', `Archived (${counts.Archived})`],
          ['Moderated', `Hidden / Removed (${counts.Moderated})`]
        ].map(([k, lbl]) => `
          <button type="button" data-fac-tab="${k}" class="fac-tab-btn shrink-0 min-h-[40px] px-3.5 rounded-xl text-xs font-semibold border transition ${
            state.facultySubTab === k ? 'glass-btn-primary border-transparent' : 'glass-btn-secondary'
          }">${lbl}</button>
        `).join('')}
      </div>

      ${filtered.length ? `
        <div class="space-y-3">
          ${filtered.map(({ table, rec }) => {
            const meta = TABLE_META[table];
            const id = rec[meta.key];
            return `
              <div class="rounded-xl glass-card p-4 space-y-2.5">
                <div class="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div class="flex flex-wrap items-center gap-1.5">
                      <span class="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">${escapeHtml(meta.friendly)}</span>
                      ${urgentBadge(rec)}
                      ${isDemoRecord(rec) ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gold-50 text-gold-800 border border-gold-200">DEMO DATA</span>` : ''}
                    </div>
                    <h4 class="text-sm font-bold text-[#18212F] mt-0.5">${escapeHtml(rec[meta.label])}</h4>
                    <p class="text-xs text-[#64748B]">Last updated: ${escapeHtml(rec.Last_Updated || '—')}</p>
                  </div>
                  ${workflowBadge(rec.Verification_Status)}
                </div>
                ${(rec.Verification_Status === 'Temporarily Hidden' || rec.Verification_Status === 'Removed') ? `
                  <div class="rounded-lg bg-amber-50/90 border border-amber-200 p-2.5 text-xs text-amber-900">
                    <strong>Administrator Notice:</strong> ${escapeHtml(rec.Hidden_Reason || rec.Removal_Reason || rec.Last_Action_Remarks || 'Moderated by Administration.')}
                  </div>
                ` : ''}
                <div class="flex flex-wrap items-center gap-2 pt-1">
                  <button type="button" data-open-table="${table}" data-open-id="${escapeHtml(id)}" class="record-card min-h-[36px] px-3 rounded-lg glass-btn-secondary text-xs font-semibold">View Details</button>
                  ${canReviseRecord(rec, table) ? `<button type="button" data-revise-table="${table}" data-revise-id="${escapeHtml(id)}" class="revise-btn min-h-[36px] px-3.5 rounded-lg glass-btn-primary text-xs font-semibold">Edit Publication</button>` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      ` : `<p class="text-xs text-[#64748B] py-4 text-center">No publications in this category.</p>`}
    </section>
  `;
}

// ==================== 3. ADMINISTRATOR CONTROL CENTRE ====================
function getAdminMetrics() {
  const allInfo = [];
  FACULTY_PUBLISH_TABLES.forEach((t) => {
    (state.db[t] || []).forEach((r) => allInfo.push({ table: t, rec: r }));
  });
  const openReports = (state.db.Student_Reports || []).filter((r) => r.Status === 'Open' || r.Status === 'Under Investigation');
  const activeFaculty = (state.db.Faculty || []).filter((f) => (f.Account_Status || 'Active') === 'Active');
  const history = (state.db.Verification_History || []).slice().reverse();
  return { allInfo, openReports, activeFaculty, history };
}

function renderAdminDashboard() {
  const { allInfo, openReports, activeFaculty, history } = getAdminMetrics();
  if (!['information', 'reports', 'faculty', 'history'].includes(state.adminQueueTab)) {
    state.adminQueueTab = 'information';
  }

  let tabBody = '';

  if (state.adminQueueTab === 'information') {
    const q = (state.adminInfoSearch || '').trim().toLowerCase();
    const deptF = state.adminInfoDept || 'ALL';
    const catF = state.adminInfoTable || 'ALL';
    const statusF = state.adminInfoStatus || 'ALL';

    const filtered = allInfo.filter(({ table, rec }) => {
      if (catF !== 'ALL' && table !== catF) return false;
      if (deptF !== 'ALL' && rec.Department_ID !== deptF) return false;
      if (statusF !== 'ALL' && rec.Verification_Status !== statusF) return false;
      if (q) {
        const attr = getRecordAttribution(table, rec);
        const hay = `${rec[TABLE_META[table].label] || ''} ${rec.Category || ''} ${attr.contributor ? attr.contributor.name : ''} ${getDeptFullName(rec.Department_ID)}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    tabBody = `
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
        <input id="admin-info-search" type="search" value="${escapeHtml(state.adminInfoSearch || '')}" placeholder="Search title, author, category..." class="min-h-[38px] px-3 glass-input rounded-lg" />
        <select id="admin-info-table" class="min-h-[38px] px-2.5 glass-input rounded-lg">
          <option value="ALL" ${catF === 'ALL' ? 'selected' : ''}>All Categories</option>
          ${FACULTY_PUBLISH_TABLES.map((t) => `<option value="${t}" ${catF === t ? 'selected' : ''}>${escapeHtml(TABLE_META[t].friendly)}</option>`).join('')}
        </select>
        <select id="admin-info-dept" class="min-h-[38px] px-2.5 glass-input rounded-lg">
          <option value="ALL" ${deptF === 'ALL' ? 'selected' : ''}>All Departments</option>
          ${state.db.Departments.map((d) => `<option value="${d.Department_ID}" ${deptF === d.Department_ID ? 'selected' : ''}>${escapeHtml(d.Department_Code)}</option>`).join('')}
        </select>
        <select id="admin-info-status" class="min-h-[38px] px-2.5 glass-input rounded-lg">
          ${['ALL', 'Published', 'Temporarily Hidden', 'Draft', 'Archived', 'Removed'].map((st) => `<option value="${st}" ${statusF === st ? 'selected' : ''}>${st === 'ALL' ? 'All Statuses' : st}</option>`).join('')}
        </select>
      </div>
      ${filtered.length ? `
        <div class="space-y-2.5">
          ${filtered.map(({ table, rec }) => {
            const meta = TABLE_META[table];
            const id = rec[meta.key];
            const attr = getRecordAttribution(table, rec);
            return `
              <div class="rounded-xl glass-card p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div class="min-w-0 space-y-1">
                  <div class="flex flex-wrap items-center gap-1.5">
                    <span class="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">${escapeHtml(meta.friendly)} · ${escapeHtml(id)}</span>
                    ${workflowBadge(rec.Verification_Status)}
                    ${urgentBadge(rec)}
                    ${isDemoRecord(rec) ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gold-50 text-gold-800 border border-gold-200">DEMO DATA</span>` : ''}
                  </div>
                  <div class="text-sm font-bold text-[#18212F] truncate">${escapeHtml(rec[meta.label])}</div>
                  <div class="text-[11px] text-[#64748B]">Author: <strong class="text-[#18212F]">${escapeHtml(attr.contributor ? attr.contributor.name : 'Campus Office')}</strong> &middot; ${escapeHtml(getDeptBadgeText(rec.Department_ID))} &middot; Updated ${escapeHtml(rec.Last_Updated || '—')}</div>
                </div>
                <div class="flex flex-wrap items-center gap-1.5 shrink-0">
                  <button type="button" data-open-table="${table}" data-open-id="${escapeHtml(id)}" class="record-card min-h-[34px] px-2.5 rounded-lg glass-btn-secondary text-xs font-semibold">Inspect</button>
                  <button type="button" data-revise-table="${table}" data-revise-id="${escapeHtml(id)}" class="revise-btn min-h-[34px] px-2.5 rounded-lg glass-btn-navy text-xs font-semibold">Edit</button>
                  ${rec.Verification_Status === 'Published'
                    ? `<button type="button" data-quick-mod-table="${table}" data-quick-mod-id="${escapeHtml(id)}" data-quick-mod-status="Temporarily Hidden" class="admin-quick-mod min-h-[34px] px-2.5 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 text-xs font-semibold">Hide</button>`
                    : `<button type="button" data-quick-mod-table="${table}" data-quick-mod-id="${escapeHtml(id)}" data-quick-mod-status="Published" class="admin-quick-mod min-h-[34px] px-2.5 rounded-lg bg-emerald-700 text-white text-xs font-semibold">Restore</button>`}
                  ${rec.Verification_Status !== 'Removed' ? `<button type="button" data-quick-mod-table="${table}" data-quick-mod-id="${escapeHtml(id)}" data-quick-mod-status="Removed" class="admin-quick-mod min-h-[34px] px-2.5 rounded-lg bg-rose-600 text-white text-xs font-semibold">Remove</button>` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      ` : `<p class="text-xs text-[#64748B] py-6 text-center">No records match your current search and filter criteria.</p>`}
    `;
  } else if (state.adminQueueTab === 'reports') {
    const reports = state.db.Student_Reports || [];
    tabBody = reports.length ? `
      <div class="space-y-3">
        ${reports.map((r) => {
          const targetRec = (state.db[r.Table_Name] || []).find((x) => x[TABLE_META[r.Table_Name].key] === r.Record_ID);
          const author = resolveLinkedPerson(r.Original_Author_ID);
          const curStatus = targetRec ? targetRec.Verification_Status : 'Not Found';
          return `
            <div class="rounded-xl glass-card p-4 space-y-2.5">
              <div class="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div class="flex flex-wrap items-center gap-1.5">
                    <span class="text-[11px] font-mono text-[#64748B]">${escapeHtml(r.Report_ID)}</span>
                    ${reportStatusBadge(r.Status)}
                    ${r.Is_Demo ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gold-50 text-gold-800 border border-gold-200">DEMO DATA</span>` : ''}
                  </div>
                  <h4 class="text-sm font-bold text-[#18212F] mt-1">${escapeHtml(r.Record_Title)}</h4>
                  <div class="text-xs text-[#64748B]">Reason: <strong class="text-crimson-700">${escapeHtml(r.Reason)}</strong> &middot; Submitted: ${escapeHtml(r.Created_At)}</div>
                  <div class="text-[11px] text-[#64748B]">Original Author: <strong class="text-[#18212F]">${escapeHtml(author ? author.name : r.Original_Author_ID)}</strong> &middot; Current Post Status: <strong>${escapeHtml(curStatus)}</strong></div>
                </div>
              </div>
              ${r.Explanation ? `<div class="rounded-lg glass-subtle p-2.5 text-xs text-[#18212F]"><strong>Student Note:</strong> ${escapeHtml(r.Explanation)}</div>` : ''}
              ${r.Admin_Action_Notes ? `<div class="text-[11px] text-[#64748B]"><strong>Admin Resolution:</strong> ${escapeHtml(r.Admin_Action_Notes)} (${escapeHtml(r.Resolved_At)})</div>` : ''}
              <div class="flex flex-wrap items-center gap-2 pt-1">
                ${targetRec ? `<button type="button" data-revise-table="${escapeHtml(r.Table_Name)}" data-revise-id="${escapeHtml(r.Record_ID)}" class="revise-btn min-h-[34px] px-3 rounded-lg glass-btn-navy text-xs font-semibold">Edit / Correct Post</button>` : ''}
                ${targetRec && curStatus === 'Published' ? `<button type="button" data-quick-mod-table="${escapeHtml(r.Table_Name)}" data-quick-mod-id="${escapeHtml(r.Record_ID)}" data-quick-mod-status="Temporarily Hidden" data-report-id="${escapeHtml(r.Report_ID)}" class="admin-quick-mod min-h-[34px] px-3 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 text-xs font-semibold">Hide During Investigation</button>` : ''}
                ${targetRec && curStatus !== 'Removed' ? `<button type="button" data-quick-mod-table="${escapeHtml(r.Table_Name)}" data-quick-mod-id="${escapeHtml(r.Record_ID)}" data-quick-mod-status="Removed" data-report-id="${escapeHtml(r.Report_ID)}" class="admin-quick-mod min-h-[34px] px-3 rounded-lg bg-rose-600 text-white text-xs font-semibold">Remove Post</button>` : ''}
                ${(r.Status === 'Open' || r.Status === 'Under Investigation') ? `<button type="button" data-dismiss-report="${escapeHtml(r.Report_ID)}" class="dismiss-report-btn min-h-[34px] px-3 rounded-lg glass-btn-secondary text-xs font-semibold">Dismiss Report</button>` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    ` : `<p class="text-xs text-[#64748B] py-6 text-center">No student reports have been submitted.</p>`;
  } else if (state.adminQueueTab === 'faculty') {
    const pendingReqs = (state.db.Profile_Correction_Requests || []).filter((x) => x.Status === 'Pending');
    tabBody = `
      <div class="flex flex-wrap items-center justify-between gap-2">
        <p class="text-xs text-[#64748B]">Create official faculty accounts, manage permissions, reset temporary credentials, or suspend/deactivate access.</p>
        <button id="btn-create-faculty-account" type="button" class="min-h-[38px] px-3.5 rounded-xl glass-btn-primary text-xs font-semibold inline-flex items-center gap-1.5">
          <i data-lucide="user-plus" class="w-4 h-4"></i> Create Faculty Account
        </button>
      </div>

      ${pendingReqs.length ? `
        <div class="rounded-xl glass-subtle p-3.5 space-y-2 border-l-4 border-l-amber-500">
          <div class="text-xs font-bold text-[#18212F]">Pending Faculty Profile Correction Requests (${pendingReqs.length})</div>
          ${pendingReqs.map((rq) => `
            <div class="rounded-lg bg-white/80 border border-slate-200 p-2.5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <strong>${escapeHtml(rq.Faculty_Name)}</strong> requested <strong>${escapeHtml(rq.Field_Name.replace(/_/g, ' '))}</strong>:
                <span class="line-through text-rose-700">${escapeHtml(rq.Current_Value)}</span> &rarr; <strong class="text-emerald-800">${escapeHtml(rq.Requested_Value)}</strong>
                <div class="text-[11px] text-[#64748B]">Reason: ${escapeHtml(rq.Reason)}</div>
              </div>
              <div class="flex items-center gap-1.5 shrink-0">
                <button type="button" data-resolve-req="${escapeHtml(rq.Request_ID)}" data-req-decision="Approved" class="resolve-prof-req px-2.5 py-1 rounded-lg bg-emerald-700 text-white text-[11px] font-semibold">Approve</button>
                <button type="button" data-resolve-req="${escapeHtml(rq.Request_ID)}" data-req-decision="Rejected" class="resolve-prof-req px-2.5 py-1 rounded-lg glass-btn-secondary text-[11px] font-semibold">Reject</button>
              </div>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <div class="space-y-2.5">
        ${(state.db.Faculty || []).map((f) => {
          const st = f.Account_Status || 'Active';
          const perms = { ...DEFAULT_FACULTY_PERMISSIONS, ...(f.Permissions || {}) };
          const enabledPerms = Object.entries(perms).filter(([, v]) => v).map(([k]) => PERMISSION_LABELS[k]?.label || k);
          return `
            <div class="rounded-xl glass-card p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div class="space-y-1 min-w-0">
                <div class="flex flex-wrap items-center gap-1.5">
                  <span class="text-sm font-bold text-[#18212F]">${escapeHtml(f.Faculty_Name)}</span>
                  <span class="text-[11px] font-mono text-[#64748B]">${escapeHtml(f.Employee_ID || f.Faculty_ID)}</span>
                  ${accountStatusBadge(st)}
                  ${isDemoRecord(f) ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gold-50 text-gold-800 border border-gold-200">DEMO DATA</span>` : ''}
                </div>
                <div class="text-xs text-[#64748B]">${escapeHtml(f.Designation)} &middot; ${escapeHtml(getDeptBadgeText(f.Department_ID))} &middot; ${escapeHtml(f.Official_Email || 'No email')}</div>
                <div class="text-[11px] text-[#64748B]">Permissions: ${escapeHtml(enabledPerms.join(', ') || 'None')}</div>
              </div>
              <div class="flex flex-wrap items-center gap-1.5 shrink-0">
                <button type="button" data-open-table="Faculty" data-open-id="${escapeHtml(f.Faculty_ID)}" class="record-card min-h-[34px] px-2.5 rounded-lg glass-btn-secondary text-xs font-semibold">Profile</button>
                <button type="button" data-fac-perm="${escapeHtml(f.Faculty_ID)}" class="fac-perm-btn min-h-[34px] px-2.5 rounded-lg glass-btn-navy text-xs font-semibold">Permissions</button>
                <button type="button" data-fac-reset="${escapeHtml(f.Faculty_ID)}" class="fac-reset-btn min-h-[34px] px-2.5 rounded-lg glass-btn-secondary text-xs font-semibold">Reset Credentials</button>
                ${st === 'Active'
                  ? `<button type="button" data-fac-status-id="${escapeHtml(f.Faculty_ID)}" data-fac-status-target="Suspended" class="fac-status-btn min-h-[34px] px-2.5 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 text-xs font-semibold">Suspend</button>
                     <button type="button" data-fac-status-id="${escapeHtml(f.Faculty_ID)}" data-fac-status-target="Deactivated" class="fac-status-btn min-h-[34px] px-2.5 rounded-lg bg-rose-600 text-white text-xs font-semibold">Deactivate</button>`
                  : `<button type="button" data-fac-status-id="${escapeHtml(f.Faculty_ID)}" data-fac-status-target="Active" class="fac-status-btn min-h-[34px] px-2.5 rounded-lg bg-emerald-700 text-white text-xs font-semibold">Reactivate</button>`}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  } else {
    tabBody = history.length ? `
      <div class="space-y-2.5">
        ${history.map((h) => `
          <div class="rounded-xl glass-subtle p-3 text-xs space-y-1">
            <div class="flex flex-wrap items-center justify-between gap-1.5">
              <div class="flex flex-wrap items-center gap-1.5">
                <span class="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-navy-800 text-white">${escapeHtml(h.Action_Type || 'ACTION')}</span>
                <span class="font-bold text-[#18212F]">${escapeHtml(h.Record_ID)}</span>
                <span class="text-[#64748B]">(${escapeHtml(String(h.Table_Name || '').replace(/_/g, ' '))})</span>
                ${h.Is_Demo ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gold-50 text-gold-800 border border-gold-200">DEMO DATA</span>` : ''}
              </div>
              <span class="text-[11px] text-[#64748B]">${escapeHtml(h.Action_Date)}</span>
            </div>
            <div class="text-[#18212F]">${escapeHtml(h.Previous_Status)} &rarr; <strong class="text-crimson-700">${escapeHtml(h.New_Status)}</strong> &middot; By <strong>${escapeHtml(h.Action_By)}</strong> (${escapeHtml(h.Actor_Role || 'staff')})</div>
            ${(h.Reason || h.Remarks) ? `<div class="text-[#64748B]">Reason: ${escapeHtml(h.Reason || h.Remarks)}</div>` : ''}
          </div>
        `).join('')}
      </div>
    ` : `<p class="text-xs text-[#64748B] py-6 text-center">No audit history recorded yet.</p>`;
  }

  return `
    <section class="glass-panel p-4 sm:p-5 space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 class="hit-serif text-xl font-bold text-[#18212F]">Administrator Control Centre</h2>
          <p class="text-xs text-[#64748B]">Manage official faculty accounts, oversee published information, resolve student reports, and inspect audit history.</p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <button type="button" id="btn-admin-new-faculty" class="min-h-[40px] px-3.5 rounded-xl glass-btn-navy text-xs font-semibold inline-flex items-center gap-1.5">
            <i data-lucide="user-plus" class="w-4 h-4"></i> New Faculty Account
          </button>
          <button type="button" data-quick-add="Announcements" class="quick-add-btn min-h-[40px] px-3.5 rounded-xl glass-btn-primary text-xs font-semibold inline-flex items-center gap-1.5">
            <i data-lucide="plus" class="w-4 h-4"></i> Publish Information
          </button>
        </div>
      </div>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <button type="button" data-admin-q="information" class="admin-q-btn text-left p-3.5 rounded-xl glass-card glass-card-interactive ${state.adminQueueTab === 'information' ? 'ring-2 ring-crimson-600' : ''}">
          <div class="text-xs font-semibold text-crimson-700">Published Information</div>
          <div class="text-2xl font-bold text-[#18212F] mt-1">${allInfo.filter((x) => x.rec.Verification_Status === 'Published').length}</div>
          <div class="text-[11px] text-[#64748B]">${allInfo.length} total records</div>
        </button>
        <button type="button" data-admin-q="reports" class="admin-q-btn text-left p-3.5 rounded-xl glass-card glass-card-interactive ${state.adminQueueTab === 'reports' ? 'ring-2 ring-crimson-600' : ''}">
          <div class="text-xs font-semibold text-rose-700">Student Reports</div>
          <div class="text-2xl font-bold text-[#18212F] mt-1">${openReports.length}</div>
          <div class="text-[11px] text-[#64748B]">Open for moderation</div>
        </button>
        <button type="button" data-admin-q="faculty" class="admin-q-btn text-left p-3.5 rounded-xl glass-card glass-card-interactive ${state.adminQueueTab === 'faculty' ? 'ring-2 ring-crimson-600' : ''}">
          <div class="text-xs font-semibold text-navy-800">Faculty Accounts</div>
          <div class="text-2xl font-bold text-[#18212F] mt-1">${activeFaculty.length}</div>
          <div class="text-[11px] text-[#64748B]">${(state.db.Faculty || []).length} official profiles</div>
        </button>
        <button type="button" data-admin-q="history" class="admin-q-btn text-left p-3.5 rounded-xl glass-card glass-card-interactive ${state.adminQueueTab === 'history' ? 'ring-2 ring-crimson-600' : ''}">
          <div class="text-xs font-semibold text-emerald-700">Audit History</div>
          <div class="text-2xl font-bold text-[#18212F] mt-1">${history.length}</div>
          <div class="text-[11px] text-[#64748B]">Immutable activity log</div>
        </button>
      </div>
    </section>

    <section class="glass-panel p-4 sm:p-5 space-y-4">
      <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        ${[
          ['information', `Information Management (${allInfo.length})`],
          ['reports', `Student Reports (${openReports.length})`],
          ['faculty', `Faculty Accounts (${(state.db.Faculty || []).length})`],
          ['history', `Audit History (${history.length})`]
        ].map(([k, lbl]) => `
          <button type="button" data-admin-q="${k}" class="admin-q-btn shrink-0 min-h-[40px] px-3.5 rounded-xl text-xs font-semibold border transition ${
            state.adminQueueTab === k ? 'glass-btn-navy border-transparent' : 'glass-btn-secondary'
          }">${lbl}</button>
        `).join('')}
      </div>
      ${tabBody}
    </section>
  `;
}
