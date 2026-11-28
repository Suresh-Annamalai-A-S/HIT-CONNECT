// HIT Connect — Core Campus Sections (Academics, Opportunities, Updates, People, Services, Department)

// ==================== OTHER 6 TOP-LEVEL SECTIONS ====================
function renderAcademics() {
  let rows = state.db.Academics.filter((r) => matchesFilters(r, 'Academics'));
  if (state.academicsCategory !== 'ALL') rows = rows.filter((r) => r.Category === state.academicsCategory);
  return `
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div><h2 class="hit-serif text-xl font-bold text-[#18212F]">Academics</h2><p class="text-xs text-[#64748B]">Curriculum, syllabus, timetables, exam schedules, and regulations.</p></div>
      <label class="inline-flex items-center gap-2 text-xs font-medium glass-card px-3 py-2 cursor-pointer">
        <input id="toggle-archived" type="checkbox" ${state.showArchivedAcademics ? 'checked' : ''} class="rounded text-crimson-600" /> Show Archived Versions
      </label>
    </div>
    <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
      ${['ALL', ...CATEGORY_OPTIONS.Academics].map((c) => `<button type="button" data-acad-cat="${escapeHtml(c)}" class="acad-cat-btn shrink-0 min-h-[38px] px-3.5 rounded-full text-xs font-semibold border ${state.academicsCategory === c ? 'glass-btn-primary border-transparent' : 'glass-btn-secondary'}">${c === 'ALL' ? 'All' : escapeHtml(c)}</button>`).join('')}
    </div>
    ${rows.length ? `<div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">${rows.map((r) => renderCard('Academics', r)).join('')}</div>` : `<div class="glass-panel p-8 text-center text-xs text-[#64748B]">No academic documents match your current filters.</div>`}
  `;
}

function renderOpportunities() {
  let rows = state.db.Opportunities.filter((r) => matchesFilters(r, 'Opportunities'));
  if (state.opportunitiesCategory !== 'ALL') rows = rows.filter((r) => r.Category === state.opportunitiesCategory);
  if (state.opportunitiesAvailability !== 'ALL') rows = rows.filter((r) => getOpportunityAvailability(r).status === state.opportunitiesAvailability);
  return `
    <div><h2 class="hit-serif text-xl font-bold text-[#18212F]">Opportunities</h2><p class="text-xs text-[#64748B]">Internships, scholarships, hackathons, research, and online courses.</p></div>
    <div class="glass-panel p-3.5 space-y-2.5">
      <div class="flex flex-wrap items-center gap-1.5">
        ${['ALL', 'Open', 'Closing Soon', 'Upcoming', 'Expired'].map((a) => `<button type="button" data-opp-avail="${a}" class="opp-avail-btn min-h-[36px] px-3.5 rounded-full text-xs font-semibold border ${state.opportunitiesAvailability === a ? 'glass-btn-navy border-transparent' : 'glass-btn-secondary'}">${a === 'ALL' ? 'All Deadlines' : a}</button>`).join('')}
      </div>
      <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        ${['ALL', ...CATEGORY_OPTIONS.Opportunities].map((c) => `<button type="button" data-opp-cat="${escapeHtml(c)}" class="opp-cat-btn shrink-0 min-h-[36px] px-3.5 rounded-full text-xs font-semibold border ${state.opportunitiesCategory === c ? 'glass-btn-primary border-transparent' : 'glass-btn-secondary'}">${c === 'ALL' ? 'All Categories' : escapeHtml(c)}</button>`).join('')}
      </div>
    </div>
    ${rows.length ? `<div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">${rows.map((r) => renderCard('Opportunities', r)).join('')}</div>` : `<div class="glass-panel p-8 text-center text-xs text-[#64748B]">No opportunities match your filters.</div>`}
  `;
}

function renderCampusUpdates() {
  const sub = state.updatesSubTab;
  let body = '';
  if (sub === 'events') {
    let rows = state.db.Events.filter((r) => matchesFilters(r, 'Events'));
    if (state.eventsTimeFilter !== 'ALL') rows = rows.filter((r) => getEventTimeStatus(r.Event_Date) === state.eventsTimeFilter);
    body = rows.length ? `<div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">${rows.map((r) => renderCard('Events', r)).join('')}</div>` : `<div class="glass-panel p-8 text-center text-xs text-[#64748B]">No events found.</div>`;
  } else if (sub === 'announcements') {
    const rows = state.db.Announcements.filter((r) => matchesFilters(r, 'Announcements') && r.Verification_Status !== 'Archived');
    body = rows.length ? `<div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">${rows.map((r) => renderCard('Announcements', r)).join('')}</div>` : `<div class="glass-panel p-8 text-center text-xs text-[#64748B]">No active announcements.</div>`;
  } else {
    const rows = [...state.db.Announcements.filter((r) => r.Verification_Status === 'Archived').map((r) => renderCard('Announcements', r)), ...state.db.Events.filter((r) => getEventTimeStatus(r.Event_Date) === 'Past').map((r) => renderCard('Events', r))];
    body = rows.length ? `<div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">${rows.join('')}</div>` : `<div class="glass-panel p-8 text-center text-xs text-[#64748B]">No archived updates.</div>`;
  }
  return `
    <div><h2 class="hit-serif text-xl font-bold text-[#18212F]">Campus Updates</h2><p class="text-xs text-[#64748B]">Events, official notices, and department announcements.</p></div>
    <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
      ${[['events', 'Events'], ['announcements', 'Announcements & Notices'], ['archived', 'Archived Updates']].map(([k, l]) => `<button type="button" data-upd-sub="${k}" class="upd-sub-btn shrink-0 min-h-[40px] px-4 rounded-xl text-xs font-semibold border ${sub === k ? 'glass-btn-primary border-transparent' : 'glass-btn-secondary'}">${l}</button>`).join('')}
    </div>
    ${body}
  `;
}

function renderPeople() {
  const sub = state.peopleSubTab;
  const table = sub === 'faculty' ? 'Faculty' : sub === 'admin' ? 'Administrative_Contacts' : 'Departments';
  const rows = (state.db[table] || []).filter((r) => matchesFilters(r, table));
  return `
    <div><h2 class="hit-serif text-xl font-bold text-[#18212F]">People & Contacts</h2><p class="text-xs text-[#64748B]">Faculty directory, administrative offices, and department contacts.</p></div>
    <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
      ${[['faculty', 'Faculty Directory'], ['admin', 'Administrative Offices'], ['departments', 'Department Contacts']].map(([k, l]) => `<button type="button" data-ppl-sub="${k}" class="ppl-sub-btn shrink-0 min-h-[40px] px-4 rounded-xl text-xs font-semibold border ${sub === k ? 'glass-btn-primary border-transparent' : 'glass-btn-secondary'}">${l}</button>`).join('')}
    </div>
    ${rows.length ? `<div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">${rows.map((r) => renderCard(table, r)).join('')}</div>` : `<div class="glass-panel p-8 text-center text-xs text-[#64748B]">No contacts match your filter.</div>`}
  `;
}

function renderServices() {
  const sub = state.servicesSubTab;
  const table = sub === 'resources' ? 'Campus_Resources' : 'Clubs';
  const rows = (state.db[table] || []).filter((r) => matchesFilters(r, table));
  return `
    <div><h2 class="hit-serif text-xl font-bold text-[#18212F]">Campus Services</h2><p class="text-xs text-[#64748B]">Library, laboratories, IT support, facilities, and student clubs.</p></div>
    <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
      ${[['resources', 'Facilities & Support'], ['clubs', 'Clubs & Communities']].map(([k, l]) => `<button type="button" data-svc-sub="${k}" class="svc-sub-btn shrink-0 min-h-[40px] px-4 rounded-xl text-xs font-semibold border ${sub === k ? 'glass-btn-primary border-transparent' : 'glass-btn-secondary'}">${l}</button>`).join('')}
    </div>
    ${rows.length ? `<div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">${rows.map((r) => renderCard(table, r)).join('')}</div>` : `<div class="glass-panel p-8 text-center text-xs text-[#64748B]">No campus services found.</div>`}
  `;
}

function renderMyDepartment() {
  const deptId = state.session.role === 'student' ? state.session.departmentId : state.selectedDeptViewId;
  const dept = getDept(deptId) || state.db.Departments[0];
  const fac = state.db.Faculty.filter((r) => isVisibleInCurrentMode(r, 'Faculty') && r.Department_ID === dept.Department_ID);
  const acad = state.db.Academics.filter((r) => isVisibleInCurrentMode(r, 'Academics') && r.Department_ID === dept.Department_ID);
  const anns = state.db.Announcements.filter((r) => isVisibleInCurrentMode(r, 'Announcements') && r.Department_ID === dept.Department_ID);
  const evts = state.db.Events.filter((r) => isVisibleInCurrentMode(r, 'Events') && r.Department_ID === dept.Department_ID);
  const opps = state.db.Opportunities.filter((r) => isVisibleInCurrentMode(r, 'Opportunities') && matchesDepartment(r, 'Opportunities', dept.Department_ID));

  const sub = state.deptSubTab;
  let body = '';
  if (sub === 'faculty') body = fac.length ? `<div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">${fac.map((r) => renderCard('Faculty', r)).join('')}</div>` : `<div class="glass-panel p-6 text-xs text-[#64748B]">No faculty profiles listed for ${escapeHtml(dept.Department_Code)} yet.</div>`;
  else if (sub === 'academics') body = acad.length ? `<div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">${acad.map((r) => renderCard('Academics', r)).join('')}</div>` : `<div class="glass-panel p-6 text-xs text-[#64748B]">No academic documents for ${escapeHtml(dept.Department_Code)} yet.</div>`;
  else if (sub === 'updates') body = (anns.length + evts.length) ? `<div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">${anns.map((r) => renderCard('Announcements', r)).join('')}${evts.map((r) => renderCard('Events', r)).join('')}</div>` : `<div class="glass-panel p-6 text-xs text-[#64748B]">No department updates yet.</div>`;
  else if (sub === 'opportunities') body = opps.length ? `<div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">${opps.map((r) => renderCard('Opportunities', r)).join('')}</div>` : `<div class="glass-panel p-6 text-xs text-[#64748B]">No opportunities found.</div>`;
  else {
    body = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="glass-panel p-4 space-y-2 text-xs">
          <h3 class="text-sm font-bold text-[#18212F]">Department Profile</h3>
          <p class="text-[#64748B] leading-relaxed">${escapeHtml(dept.Description)}</p>
          <div class="pt-2 border-t border-slate-200/60 space-y-1">
            <div><strong class="text-[#18212F]">Programme:</strong> ${escapeHtml(dept.Programme_Name)}</div>
            <div><strong class="text-[#18212F]">Contact:</strong> ${escapeHtml(dept.Official_Contact || 'Pending official verification')}</div>
          </div>
        </div>
        <div class="glass-panel p-4 space-y-2">
          <h3 class="text-sm font-bold text-[#18212F]">Key Faculty (${fac.length})</h3>
          ${fac.slice(0, 2).map((f) => `<div class="text-xs flex items-center justify-between py-1.5 border-b border-slate-200/60 last:border-0"><div><div class="font-semibold text-[#18212F]">${escapeHtml(f.Faculty_Name)}</div><div class="text-[#64748B]">${escapeHtml(f.Designation)}</div></div><button type="button" data-open-table="Faculty" data-open-id="${f.Faculty_ID}" class="record-card text-crimson-600 font-semibold">Profile</button></div>`).join('')}
        </div>
      </div>
    `;
  }

  return `
    <section class="glass-panel p-4 sm:p-5 space-y-3">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span class="text-[11px] font-semibold uppercase tracking-wider text-crimson-700">${escapeHtml(dept.Department_Code)} Hub</span>
          <h2 class="hit-serif text-xl font-bold text-[#18212F]">${escapeHtml(dept.Department_Name)}</h2>
        </div>
        ${state.session.role !== 'student' ? `
          <select id="switch-dept-hub" aria-label="Select department" class="min-h-[40px] px-3 text-xs glass-input rounded-xl">
            ${state.db.Departments.map((d) => `<option value="${d.Department_ID}" ${d.Department_ID === dept.Department_ID ? 'selected' : ''}>${escapeHtml(d.Department_Code)} — ${escapeHtml(d.Department_Name)}</option>`).join('')}
          </select>
        ` : ''}
      </div>
      <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
        ${[['overview', 'Overview'], ['faculty', `Faculty (${fac.length})`], ['academics', `Academics (${acad.length})`], ['updates', `Updates (${anns.length + evts.length})`], ['opportunities', `Opportunities (${opps.length})`]].map(([k, l]) => `<button type="button" data-dept-sub="${k}" class="dept-sub-btn shrink-0 min-h-[38px] px-3.5 rounded-xl text-xs font-semibold border ${sub === k ? 'glass-btn-primary border-transparent' : 'glass-btn-secondary'}">${l}</button>`).join('')}
      </div>
    </section>
    ${body}
  `;
}
