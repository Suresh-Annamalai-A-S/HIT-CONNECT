// HIT Connect — Reusable Glass Card Renderer & Universal Search View

// ==================== REUSABLE GLASS CARD RENDERER ====================
function renderCard(table, rec) {
  const meta = TABLE_META[table];
  const id = rec[meta.key];
  const title = rec[meta.label];
  const isStudent = state.session && state.session.role === 'student';
  const isStaff = state.session && state.session.role !== 'student';
  const trustBadge = classificationBadge(rec.Data_Classification, rec);
  const urgBadge = urgentBadge(rec);
  let primaryRightBadge = isStaff ? workflowBadge(rec.Verification_Status) : '';

  if (table === 'Opportunities') {
    primaryRightBadge = availabilityBadge(getOpportunityAvailability(rec)) + (isStaff && rec.Verification_Status !== 'Published' ? ' ' + workflowBadge(rec.Verification_Status) : '');
  } else if (table === 'Events') {
    const st = getEventTimeStatus(rec.Event_Date);
    primaryRightBadge = `<span class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${st === 'Upcoming' ? 'bg-blue-50/90 text-blue-800 border-blue-200' : 'bg-white/80 text-slate-600 border-slate-200'}">${st}</span>` + (isStaff && rec.Verification_Status !== 'Published' ? ' ' + workflowBadge(rec.Verification_Status) : '');
  } else if (table === 'Academics' && rec.Version) {
    primaryRightBadge = `<span class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-navy-50/90 text-navy-800 border border-navy-100">${escapeHtml(rec.Version)}${rec.Verification_Status === 'Archived' ? ' · Archived' : ''}</span>`;
  }

  const reportBtnHtml = (isStudent && REPORTABLE_TABLES.includes(table) && rec.Verification_Status === 'Published')
    ? `<button type="button" data-report-table="${escapeHtml(table)}" data-report-id="${escapeHtml(id)}" class="report-info-btn stop-prop text-[11px] font-semibold text-[#64748B] hover:text-crimson-700 inline-flex items-center gap-1 py-0.5"><i data-lucide="flag" class="w-3 h-3" aria-hidden="true"></i> Report</button>`
    : '';

  if (table === 'Faculty') {
    return `
      <article tabindex="0" role="button" data-open-table="Faculty" data-open-id="${escapeHtml(id)}" class="record-card cursor-pointer glass-card glass-card-interactive p-4 space-y-3">
        ${(trustBadge || isStaff) ? `<div class="flex items-center justify-between gap-2">${trustBadge}${isStaff ? accountStatusBadge(rec.Account_Status) : ''}</div>` : ''}
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-full bg-crimson-50/90 text-crimson-700 font-bold text-xs flex items-center justify-center shrink-0 border border-crimson-200">${escapeHtml(getInitials(title))}</div>
          <div class="min-w-0">
            <h3 class="text-sm font-bold text-[#18212F] truncate">${escapeHtml(title)}</h3>
            <p class="text-xs text-[#64748B] truncate">${escapeHtml(rec.Designation || 'Faculty')}</p>
          </div>
        </div>
        <p class="text-xs text-[#64748B] line-clamp-2"><strong class="text-[#18212F]">Subjects:</strong> ${escapeHtml(rec.Subjects_Handled || 'Not listed')}</p>
        <div class="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
          <span class="font-medium text-[#64748B]">${escapeHtml(getDeptBadgeText(rec.Department_ID))}</span>
          <span class="text-crimson-600 font-semibold inline-flex items-center gap-0.5">View Profile <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i></span>
        </div>
      </article>
    `;
  }

  if (table === 'Opportunities') {
    const avail = getOpportunityAvailability(rec);
    const appUrl = rec.Application_URL || rec.Application_Link || '';
    const attr = getRecordAttribution('Opportunities', rec);
    return `
      <article tabindex="0" role="button" data-open-table="Opportunities" data-open-id="${escapeHtml(id)}" class="record-card cursor-pointer glass-card glass-card-interactive p-4 space-y-2.5">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex flex-wrap items-center gap-1.5">${trustBadge}${urgBadge}</div>
          <div class="flex flex-wrap items-center gap-1.5">${primaryRightBadge}</div>
        </div>
        <div>
          <h3 class="text-sm sm:text-[15px] font-bold text-[#18212F] leading-snug">${escapeHtml(title)}</h3>
          <p class="text-xs text-[#64748B] mt-0.5">${escapeHtml(rec.Organiser || rec.Organizer || '')} &middot; <span class="font-medium text-[#18212F]">${escapeHtml(rec.Category || '')}</span></p>
        </div>
        ${rec.Eligibility_Warning ? `<div class="rounded-lg bg-amber-50/90 border border-amber-200 px-2.5 py-1.5 text-[11px] text-amber-900 font-medium">${escapeHtml(rec.Eligibility_Warning)}</div>` : ''}
        <div class="text-xs text-[#64748B] space-y-1">
          <p><strong class="text-[#18212F]">Eligible Years:</strong> ${escapeHtml(rec.Relevant_Years || 'See details')}</p>
          <p><strong class="text-[#18212F]">Deadline:</strong> ${escapeHtml(rec.Application_Deadline ? formatDisplayDate(rec.Application_Deadline) : 'Course-specific / Check portal')}</p>
        </div>
        <div class="pt-2 border-t border-slate-200/60 space-y-1.5 text-xs">
          ${attr.contributor ? `<div class="text-[11px] text-[#64748B] truncate">Source: <strong class="text-[#18212F]">${escapeHtml(attr.contributor.shortName || attr.contributor.name)}</strong> &middot; ${escapeHtml(attr.contributor.departmentCode)}</div>` : ''}
          <div class="flex items-center justify-between gap-2">
            <span class="text-[#64748B] truncate">${escapeHtml(rec.Relevant_Departments || getDeptBadgeText(rec.Department_ID))}</span>
            <div class="flex items-center gap-2.5 shrink-0">
              ${reportBtnHtml}
              <span class="text-crimson-600 font-semibold">Contact & Details</span>
              ${isValidHttpsUrl(appUrl) && avail.status !== 'Expired' ? `<a href="${escapeHtml(appUrl)}" target="_blank" rel="noopener noreferrer" class="stop-prop px-3 py-1 rounded-lg glass-btn-primary font-semibold">Apply</a>` : ''}
            </div>
          </div>
        </div>
      </article>
    `;
  }

  let subtitle = rec.Description || rec.Responsibilities || '';
  let footerLeft = rec.Department_ID ? getDeptBadgeText(rec.Department_ID) : (rec.Location || rec.Office_Location || '');
  if (table === 'Events') footerLeft = `${formatDisplayDate(rec.Event_Date) || rec.Event_Date}${rec.Start_Time ? ' · ' + rec.Start_Time : ''} · ${rec.Venue || ''}`;
  if (table === 'Announcements') {
    const parts = [formatDisplayDate(rec.Publication_Date) || rec.Publication_Date, rec.Target_Audience || 'All'];
    if (rec.Venue) parts.push(rec.Venue);
    footerLeft = parts.filter(Boolean).join(' · ');
  }
  if (table === 'Academics') footerLeft = `${getDeptBadgeText(rec.Department_ID)} · Sem ${rec.Semester || 'All'} · ${rec.Academic_Year || ''}`;

  const topBadgesHtml = (trustBadge || urgBadge || primaryRightBadge)
    ? `<div class="flex flex-wrap items-center justify-between gap-2"><div class="flex flex-wrap items-center gap-1.5">${trustBadge}${urgBadge}</div><div class="flex flex-wrap items-center gap-1.5">${primaryRightBadge}</div></div>`
    : '';

  return `
    <article tabindex="0" role="button" data-open-table="${escapeHtml(table)}" data-open-id="${escapeHtml(id)}" class="record-card cursor-pointer glass-card glass-card-interactive p-4 space-y-2.5">
      ${topBadgesHtml}
      <div>
        <h3 class="text-sm sm:text-[15px] font-bold text-[#18212F] leading-snug">${escapeHtml(title)}</h3>
        ${rec.Category || rec.Designation ? `<p class="text-xs text-[#64748B] mt-0.5">${escapeHtml(rec.Category || rec.Designation)}${rec.Relevant_Year_Semester ? ' &middot; ' + escapeHtml(rec.Relevant_Year_Semester) : ''}</p>` : ''}
      </div>
      ${subtitle ? `<p class="text-xs text-[#64748B] line-clamp-2">${escapeHtml(subtitle)}</p>` : ''}
      ${(table === 'Announcements' && (rec.Event_Date || rec.Registration_Deadline)) ? `
        <div class="text-[11px] text-[#64748B] flex flex-wrap gap-x-3 gap-y-0.5">
          ${rec.Event_Date ? `<span><strong class="text-[#18212F]">Date:</strong> ${escapeHtml(formatDisplayDate(rec.Event_Date) || rec.Event_Date)}${rec.Event_Time ? ' · ' + escapeHtml(rec.Event_Time) : ''}</span>` : ''}
          ${rec.Registration_Deadline ? `<span><strong class="text-[#18212F]">Deadline:</strong> ${escapeHtml(formatDisplayDate(rec.Registration_Deadline) || rec.Registration_Deadline)}</span>` : ''}
        </div>
      ` : ''}
      <div class="pt-2 border-t border-slate-200/60 space-y-1 text-xs">
        ${!['Administrative_Contacts', 'Departments'].includes(table) ? (() => { const attr = getRecordAttribution(table, rec); return attr.contributor ? `<div class="text-[11px] text-[#64748B] truncate">Responsible: <strong class="text-[#18212F]">${escapeHtml(attr.contributor.shortName || attr.contributor.name)}</strong> &middot; ${escapeHtml(attr.contributor.departmentCode)}</div>` : ''; })() : ''}
        <div class="flex items-center justify-between gap-2">
          <span class="text-[#64748B] truncate">${escapeHtml(footerLeft)}</span>
          <div class="flex items-center gap-2.5 shrink-0">
            ${reportBtnHtml}
            <span class="text-crimson-600 font-semibold inline-flex items-center gap-0.5">${['Administrative_Contacts', 'Departments'].includes(table) ? 'View Profile' : 'Details'} <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i></span>
          </div>
        </div>
      </div>
    </article>
  `;
}

// ==================== UNIVERSAL CAMPUS SEARCH RESULTS ====================
function renderSearchResults() {
  const isStudent = state.session && state.session.role === 'student';
  const typeMap = {
    ALL: CONTENT_TABLES,
    Academics: ['Academics'],
    Opportunities: ['Opportunities'],
    Events: ['Events'],
    Announcements: ['Announcements'],
    People: ['Faculty', 'Administrative_Contacts', 'Departments'],
    Services: ['Campus_Resources', 'Clubs']
  };
  const tables = typeMap[state.searchType] || CONTENT_TABLES;

  let total = 0;
  let sectionsHtml = '';

  tables.forEach((t) => {
    let rows = (state.db[t] || []).filter((r) => matchesFilters(r, t));
    if (!isStudent && state.searchClassification !== 'ALL') rows = rows.filter((r) => r.Data_Classification === state.searchClassification);
    if (state.searchYear !== 'ALL' && (t === 'Opportunities' || t === 'Academics')) {
      const yrKey = state.searchYear.toLowerCase();
      rows = rows.filter((r) => {
        const txt = `${r.Relevant_Years || ''} ${r.Semester || ''}`.toLowerCase();
        return txt.includes('all') || txt.includes(yrKey);
      });
    }
    if (state.searchAvailability !== 'ALL' && t === 'Opportunities') {
      rows = rows.filter((r) => getOpportunityAvailability(r).status === state.searchAvailability);
    }
    if (state.searchDate !== 'ALL') {
      if (state.searchDate === 'Archived') rows = rows.filter((r) => r.Verification_Status === 'Archived');
      else if (state.searchDate === 'Upcoming' && t === 'Events') rows = rows.filter((r) => getEventTimeStatus(r.Event_Date) === 'Upcoming');
    }

    if (rows.length > 0) {
      total += rows.length;
      sectionsHtml += `
        <div class="space-y-2.5">
          <h3 class="text-xs font-bold uppercase tracking-wider text-[#64748B]">${escapeHtml(TABLE_META[t].friendly)} (${rows.length})</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">${rows.map((r) => renderCard(t, r)).join('')}</div>
        </div>
      `;
    }
  });

  const live = document.getElementById('search-live-region');
  if (live) live.textContent = `${total} search results found for ${state.searchQuery}`;

  const showYearFilter = state.searchType === 'ALL' || state.searchType === 'Opportunities' || state.searchType === 'Academics';
  const showAvailFilter = state.searchType === 'ALL' || state.searchType === 'Opportunities';
  const showDateFilter = state.searchType === 'ALL' || state.searchType === 'Events' || state.searchType === 'Announcements' || state.searchType === 'Academics';

  const activePills = [];
  if (state.searchType !== 'ALL') activePills.push({ k: 'searchType', label: `Type: ${state.searchType}` });
  if (state.deptFilter !== 'ALL') activePills.push({ k: 'deptFilter', label: `Dept: ${getDeptBadgeText(state.deptFilter)}` });
  if (state.searchYear !== 'ALL') activePills.push({ k: 'searchYear', label: `Year: ${state.searchYear}` });
  if (state.searchDate !== 'ALL') activePills.push({ k: 'searchDate', label: `Date: ${state.searchDate}` });
  if (!isStudent && state.searchClassification !== 'ALL') activePills.push({ k: 'searchClassification', label: `Source: ${state.searchClassification === 'DEMONSTRATION_DATA' ? 'Demo Data' : 'Campus Record'}` });
  if (state.searchAvailability !== 'ALL') activePills.push({ k: 'searchAvailability', label: `Availability: ${state.searchAvailability}` });

  return `
    <section class="space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h2 class="text-lg font-bold text-[#18212F]">Search Results for “${escapeHtml(state.searchQuery)}” <span class="text-sm font-normal text-[#64748B]">(${total})</span></h2>
        <button id="clear-all-search-filters" type="button" class="min-h-[36px] px-3.5 rounded-xl glass-btn-secondary text-xs font-semibold">Clear Search & Filters</button>
      </div>

      <div class="glass-panel p-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-xs">
        <select id="sf-type" aria-label="Filter by information type" class="min-h-[40px] px-2.5 glass-input rounded-lg">
          ${['ALL', 'Academics', 'Opportunities', 'Events', 'Announcements', 'People', 'Services'].map((v) => `<option value="${v}" ${state.searchType === v ? 'selected' : ''}>${v === 'ALL' ? 'All Types' : v}</option>`).join('')}
        </select>
        ${showYearFilter ? `
          <select id="sf-year" aria-label="Filter by academic year" class="min-h-[40px] px-2.5 glass-input rounded-lg">
            ${[['ALL', 'All Years'], ['1st', 'First Year'], ['2nd', 'Second Year'], ['3rd', 'Third Year'], ['Final', 'Fourth / Final Year']].map(([v, l]) => `<option value="${v}" ${state.searchYear === v ? 'selected' : ''}>${l}</option>`).join('')}
          </select>
        ` : ''}
        ${showDateFilter ? `
          <select id="sf-date" aria-label="Filter by date status" class="min-h-[40px] px-2.5 glass-input rounded-lg">
            ${[['ALL', 'All Dates'], ['Upcoming', 'Upcoming'], ['Recent', 'Recent'], ['Archived', 'Archived']].map(([v, l]) => `<option value="${v}" ${state.searchDate === v ? 'selected' : ''}>${l}</option>`).join('')}
          </select>
        ` : ''}
        ${!isStudent ? `
          <select id="sf-class" aria-label="Filter by data source" class="min-h-[40px] px-2.5 glass-input rounded-lg">
            ${[['ALL', 'All Records'], ['DEMONSTRATION_DATA', 'Demo Data']].map(([v, l]) => `<option value="${v}" ${state.searchClassification === v ? 'selected' : ''}>${l}</option>`).join('')}
          </select>
        ` : ''}
        ${showAvailFilter ? `
          <select id="sf-avail" aria-label="Filter by availability" class="min-h-[40px] px-2.5 glass-input rounded-lg">
            ${['ALL', 'Open', 'Closing Soon', 'Upcoming', 'Expired'].map((v) => `<option value="${v}" ${state.searchAvailability === v ? 'selected' : ''}>${v === 'ALL' ? 'All Availability' : v}</option>`).join('')}
          </select>
        ` : ''}
      </div>

      ${activePills.length ? `
        <div class="flex flex-wrap items-center gap-1.5">
          ${activePills.map((p) => `<button type="button" data-remove-filter="${p.k}" class="remove-filter-btn inline-flex items-center gap-1 px-3 py-1 rounded-full bg-crimson-50/90 text-crimson-700 border border-crimson-200 text-xs font-semibold">${escapeHtml(p.label)} <i data-lucide="x" class="w-3 h-3"></i></button>`).join('')}
        </div>
      ` : ''}

      ${total > 0 ? sectionsHtml : `
        <div class="glass-panel p-8 text-center space-y-2">
          <h3 class="text-sm font-bold text-[#18212F]">No matching campus records found</h3>
          <p class="text-xs text-[#64748B]">Try removing active filters or searching for "ECE", "internship", "scholarship", or "exam cell".</p>
        </div>
      `}
    </section>
  `;
}
