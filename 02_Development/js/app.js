
// ==================== CONTROLLED MINIMUM-DURATION SPLASH CONTROLLER ====================
(function initHitStartupLoader() {
  const loader = document.getElementById('hit-startup-loader');
  if (!loader) return;

  const statusTextEl = document.getElementById('hit-loader-status-text');
  const startTime = performance.now();
  const MIN_DISPLAY_MS = 3500;
  const MAX_SAFETY_MS = 10000;

  let appInitCompleted = false;
  let windowLoaded = document.readyState === 'complete';
  let dismissed = false;
  let dismissTimer = null;

  function performDismiss() {
    if (dismissed) return;
    dismissed = true;
    clearTimeout(dismissTimer);

    loader.setAttribute('aria-hidden', 'true');
    loader.classList.add('is-leaving');

    setTimeout(() => {
      if (loader.parentNode) loader.parentNode.removeChild(loader);
    }, 460);
  }

  function tryScheduleDismiss() {
    if (dismissed || !appInitCompleted || !windowLoaded) return;
    const elapsed = performance.now() - startTime;
    const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);

    clearTimeout(dismissTimer);
    dismissTimer = setTimeout(performDismiss, remaining);
  }

  window.dismissHitStartupLoader = function markHitAppInitialized(statusMessage) {
    appInitCompleted = true;
    if (statusMessage && statusTextEl) {
      statusTextEl.textContent = statusMessage;
    }
    tryScheduleDismiss();
  };

  if (!windowLoaded) {
    window.addEventListener('load', () => {
      windowLoaded = true;
      tryScheduleDismiss();
    }, { once: true });
  }

  setTimeout(() => {
    if (!dismissed) {
      appInitCompleted = true;
      windowLoaded = true;
      performDismiss();
    }
  }, MAX_SAFETY_MS);
})();

// HIT Connect — Application Entry Point, State & Event Wiring

// ==================== APPLICATION STATE ====================
const state = {
  db: loadDB(),
  session: null,
  activeLoginSection: 'student',
  selectedStaffRole: 'faculty',
  activeTab: 'home',
  searchQuery: '',
  deptFilter: 'ALL',
  searchType: 'ALL',
  searchYear: 'ALL',
  searchDate: 'ALL',
  searchClassification: 'ALL',
  searchAvailability: 'ALL',
  recentSearches: (() => { try { return JSON.parse(localStorage.getItem(RECENT_SEARCH_KEY) || '[]'); } catch (e) { return []; } })(),
  academicsCategory: 'ALL',
  showArchivedAcademics: true,
  opportunitiesCategory: 'ALL',
  opportunitiesAvailability: 'ALL',
  updatesSubTab: 'events',
  eventsTimeFilter: 'Upcoming',
  peopleSubTab: 'faculty',
  servicesSubTab: 'resources',
  deptSubTab: 'overview',
  selectedDeptViewId: 'DEP-001',
  facultySubTab: 'Published',
  adminQueueTab: 'information',
  adminInfoSearch: '',
  adminInfoTable: 'ALL',
  adminInfoDept: 'ALL',
  adminInfoStatus: 'ALL',
  wizard: { active: false, step: 1, table: 'Announcements', editId: null, original: null, data: {} },
  pendingReasonAction: null,
  pendingReport: null,
  lastFocusedEl: null
};
state.session = AuthService.loadSession();
if (state.session && state.session.departmentId && state.session.departmentId !== 'ALL') {
  state.selectedDeptViewId = state.session.departmentId;
}

function saveDB() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.db)); } catch (e) {} }
function getCurrentPermissions() { return state.session ? ACCOUNT_PERMISSIONS[state.session.role] : null; }
function canViewAllStatuses() { const p = getCurrentPermissions(); return Boolean(p && p.viewAllStatuses); }
function canCreateRecord() {
  const p = getCurrentPermissions();
  if (!p || !p.create) return false;
  if (state.session.role === 'faculty') return isFacultyAccountActive() && hasFacultyPermission('canPublish');
  return true;
}
function currentActorLabel() { return state.session ? `${state.session.name || state.session.userId} (${state.session.roleLabel})` : 'Unauthenticated'; }

function getDept(deptId) { return state.db.Departments.find((d) => d.Department_ID === deptId) || null; }
function getDeptBadgeText(deptId) { const d = getDept(deptId); return d ? d.Department_Code : (deptId || 'General'); }
function getDeptFullName(deptId) { const d = getDept(deptId); return d ? `${d.Department_Name} (${d.Department_Code})` : 'General / Campus-wide'; }

// ==================== RENDER & EVENT BINDING ====================
function showToast(msg) {
  const el = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => el.classList.add('hidden'), 3500);
}

function openModal(id) {
  state.lastFocusedEl = document.activeElement;
  const m = document.getElementById(id);
  if (m) { m.classList.remove('hidden'); const f = m.querySelector('button, input, select, textarea'); if (f) f.focus(); }
}

function closeModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.add('hidden');
  if (state.lastFocusedEl && typeof state.lastFocusedEl.focus === 'function') { state.lastFocusedEl.focus(); state.lastFocusedEl = null; }
}

function syncDemoEnvironmentBanners() {
  const demo = isDemoEnvironment();
  document.getElementById('login-demo-banner')?.classList.toggle('hidden', !demo);
  document.getElementById('app-demo-banner')?.classList.toggle('hidden', !demo);
  document.getElementById('btn-reset-demo')?.classList.toggle('hidden', !demo);
  const envBadge = document.getElementById('header-env-badge');
  if (envBadge) {
    envBadge.textContent = demo ? 'Demo Mode' : 'Live';
  }
  const footerNote = document.getElementById('footer-env-note');
  if (footerNote) {
    footerNote.textContent = demo
      ? 'DEMO ENVIRONMENT · Local browser storage (simulated until Supabase backend is configured)'
      : 'Connected to HIT Connect Supabase Backend';
  }
}

function updateLoginUI() {
  syncDemoEnvironmentBanners();
  const isStu = state.activeLoginSection === 'student';
  const isAdm = state.selectedStaffRole === 'administrator';
  document.getElementById('tab-role-student').className = isStu ? 'min-h-[44px] px-3 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-1.5 glass-btn-primary' : 'min-h-[44px] px-3 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-1.5 text-slate-600 hover:text-slate-900';
  document.getElementById('tab-role-staff').className = !isStu ? 'min-h-[44px] px-3 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-1.5 glass-btn-navy' : 'min-h-[44px] px-3 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-1.5 text-slate-600 hover:text-slate-900';
  document.getElementById('staff-subrole-wrap').classList.toggle('hidden', isStu);
  document.getElementById('student-login-form').classList.toggle('hidden', !isStu);
  document.getElementById('staff-login-form').classList.toggle('hidden', isStu);
  document.getElementById('active-role-badge').textContent = isStu ? 'Student Portal' : (isAdm ? 'Administrator' : 'Faculty');
  document.getElementById('staff-role-faculty').className = !isAdm ? 'min-h-[40px] px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 bg-white/95 text-[#18212F] shadow-sm' : 'min-h-[40px] px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 text-slate-600';
  document.getElementById('staff-role-admin').className = isAdm ? 'min-h-[40px] px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 glass-btn-navy' : 'min-h-[40px] px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 text-slate-600';
  document.getElementById('staff-login-btn-text').textContent = isAdm ? 'Login as Administrator' : 'Login as Faculty';
  document.getElementById('staff-demo-title').textContent = isAdm ? 'DEMO DATA — Administrator Account' : 'DEMO DATA — Faculty Account';
  document.getElementById('staff-demo-creds').innerHTML = isAdm ? 'admin.demo@example.com &middot; admin-demo-2026' : 'faculty.demo@example.com &middot; faculty-demo-2026';
}

function renderRecentSearches() {
  const wrap = document.getElementById('recent-searches-wrap');
  const clearBtn = document.getElementById('btn-clear-history');
  if (!wrap) return;
  if (!state.recentSearches.length) {
    if (clearBtn) clearBtn.classList.add('hidden');
    wrap.innerHTML = `
      <div class="w-full rounded-xl glass-subtle px-3 py-2.5 flex items-center gap-2.5 text-xs">
        <div class="w-8 h-8 rounded-lg bg-white/80 border border-slate-200/80 flex items-center justify-center text-[#64748B] shrink-0">
          <i data-lucide="search" class="w-4 h-4" aria-hidden="true"></i>
        </div>
        <div>
          <div class="font-semibold text-[#18212F]">No recent searches</div>
          <div class="text-[11px] text-[#64748B]">Your recent searches will appear here.</div>
        </div>
      </div>
    `;
    return;
  }
  if (clearBtn) clearBtn.classList.remove('hidden');
  wrap.innerHTML = state.recentSearches.slice(0, 5).map((q) => `
    <button type="button" data-suggest="${escapeHtml(q)}" class="suggest-chip inline-flex items-center gap-1.5 min-h-[32px] px-3 py-1 rounded-full bg-crimson-50/85 border border-crimson-200/90 text-crimson-700 hover:bg-crimson-100/90 font-medium transition">
      <i data-lucide="clock" class="w-3 h-3 shrink-0" aria-hidden="true"></i>
      <span>${escapeHtml(q)}</span>
    </button>
  `).join('');
  wrap.querySelectorAll('.suggest-chip').forEach((b) => b.addEventListener('click', () => applySearchSuggestion(b.dataset.suggest)));
}

function applySearchSuggestion(term) {
  state.searchQuery = term;
  const inp = document.getElementById('global-search');
  if (inp) inp.value = term;
  document.getElementById('clear-search').classList.toggle('hidden', !term);
  render();
}

function render() {
  syncDemoEnvironmentBanners();
  if (!state.session) {
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('app-shell').classList.add('hidden');
    updateLoginUI();
    if (window.lucide) lucide.createIcons();
    return;
  }
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app-shell').classList.remove('hidden');

  // Enforce mandatory password change on first login for faculty accounts with temporary credentials
  if (state.session.role === 'faculty' && state.session.mustChangePassword) {
    document.getElementById('pw-change-error').classList.add('hidden');
    openModal('password-change-modal');
  } else {
    document.getElementById('password-change-modal')?.classList.add('hidden');
  }

  const sel = document.getElementById('dept-filter');
  sel.innerHTML = '<option value="ALL">All Departments</option>' + state.db.Departments.map((d) => `<option value="${d.Department_ID}">${escapeHtml(d.Department_Code)} — ${escapeHtml(d.Programme_Name)}</option>`).join('');
  sel.value = state.deptFilter;

  const pill = document.getElementById('session-user-pill');
  pill.innerHTML = `<span class="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${state.session.role === 'administrator' ? 'bg-navy-800 text-white' : state.session.role === 'faculty' ? 'bg-gold-100 text-gold-800' : 'bg-crimson-50 text-crimson-700'}">${escapeHtml(state.session.role)}</span><span class="font-semibold text-[#18212F] truncate max-w-[160px]">${escapeHtml(state.session.name || state.session.userId)}</span>`;

  const showSub = canCreateRecord();
  document.getElementById('btn-submit-desktop').classList.toggle('hidden', !showSub);
  document.getElementById('btn-submit-desktop').classList.toggle('inline-flex', showSub);
  document.getElementById('btn-submit-mobile').classList.toggle('hidden', !showSub);
  document.getElementById('btn-submit-mobile').classList.toggle('inline-flex', showSub);

  document.querySelectorAll('.nav-btn').forEach((b) => {
    const a = b.dataset.tab === state.activeTab && !state.searchQuery.trim();
    b.classList.toggle('border-crimson-600', a);
    b.classList.toggle('text-crimson-600', a);
    b.classList.toggle('font-semibold', a);
    b.classList.toggle('border-transparent', !a);
    b.classList.toggle('text-[#64748B]', !a);
  });
  document.querySelectorAll('.mnav-btn').forEach((b) => {
    const a = b.dataset.tab === state.activeTab && !state.searchQuery.trim();
    b.classList.toggle('is-active', a);
    b.setAttribute('aria-current', a ? 'page' : 'false');
  });
  const moreTabs = ['updates', 'services', 'department'];
  const moreActive = moreTabs.includes(state.activeTab) && !state.searchQuery.trim();
  const mMoreBtn = document.getElementById('mobile-more-btn');
  if (mMoreBtn) mMoreBtn.classList.toggle('is-active', moreActive);
  document.querySelectorAll('.more-nav-btn').forEach((b) => {
    const a = b.dataset.tab === state.activeTab && !state.searchQuery.trim();
    b.classList.toggle('bg-crimson-50/90', a);
    b.classList.toggle('text-crimson-700', a);
    b.classList.toggle('font-semibold', a);
    b.classList.toggle('text-[#18212F]', !a);
  });

  renderRecentSearches();

  const outlet = document.getElementById('view-outlet');
  if (state.searchQuery.trim()) outlet.innerHTML = renderSearchResults();
  else if (state.activeTab === 'home') outlet.innerHTML = state.session.role === 'administrator' ? renderAdminDashboard() : state.session.role === 'faculty' ? renderFacultyDashboard() : renderStudentDashboard();
  else if (state.activeTab === 'academics') outlet.innerHTML = renderAcademics();
  else if (state.activeTab === 'opportunities') outlet.innerHTML = renderOpportunities();
  else if (state.activeTab === 'updates') outlet.innerHTML = renderCampusUpdates();
  else if (state.activeTab === 'people') outlet.innerHTML = renderPeople();
  else if (state.activeTab === 'services') outlet.innerHTML = renderServices();
  else if (state.activeTab === 'department') outlet.innerHTML = renderMyDepartment();

  if (window.lucide) lucide.createIcons();
  bindDynamicEvents();
}

function bindDynamicEvents() {
  document.querySelectorAll('.stop-prop').forEach((a) => a.addEventListener('click', (e) => e.stopPropagation()));
  document.querySelectorAll('.record-card').forEach((c) => {
    c.addEventListener('click', () => openDetail(c.dataset.openTable, c.dataset.openId));
    c.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDetail(c.dataset.openTable, c.dataset.openId); } });
  });
  document.querySelectorAll('.report-info-btn').forEach((b) => {
    b.addEventListener('click', (e) => { e.stopPropagation(); openReportModal(b.dataset.reportTable, b.dataset.reportId); });
  });
  document.querySelectorAll('.mark-notif-read').forEach((b) => {
    b.addEventListener('click', () => { markNotificationRead(b.dataset.markRead); render(); });
  });
  document.querySelectorAll('.jump-btn').forEach((b) => b.addEventListener('click', () => { state.activeTab = b.dataset.jump; state.searchQuery = ''; document.getElementById('global-search').value = ''; render(); }));
  document.querySelectorAll('.quick-add-btn').forEach((b) => b.addEventListener('click', () => openGuidedSubmission(b.dataset.quickAdd)));
  document.querySelectorAll('.revise-btn').forEach((b) => b.addEventListener('click', () => openGuidedSubmission(b.dataset.reviseTable, b.dataset.reviseId)));
  document.querySelectorAll('.fac-tab-btn').forEach((b) => b.addEventListener('click', () => { state.facultySubTab = b.dataset.facTab; render(); }));
  document.querySelectorAll('.admin-q-btn').forEach((b) => b.addEventListener('click', () => { state.adminQueueTab = b.dataset.adminQ; render(); }));
  document.querySelectorAll('.acad-cat-btn').forEach((b) => b.addEventListener('click', () => { state.academicsCategory = b.dataset.acadCat; render(); }));
  document.querySelectorAll('.opp-cat-btn').forEach((b) => b.addEventListener('click', () => { state.opportunitiesCategory = b.dataset.oppCat; render(); }));
  document.querySelectorAll('.opp-avail-btn').forEach((b) => b.addEventListener('click', () => { state.opportunitiesAvailability = b.dataset.oppAvail; render(); }));
  document.querySelectorAll('.upd-sub-btn').forEach((b) => b.addEventListener('click', () => { state.updatesSubTab = b.dataset.updSub; render(); }));
  document.querySelectorAll('.ppl-sub-btn').forEach((b) => b.addEventListener('click', () => { state.peopleSubTab = b.dataset.pplSub; render(); }));
  document.querySelectorAll('.svc-sub-btn').forEach((b) => b.addEventListener('click', () => { state.servicesSubTab = b.dataset.svcSub; render(); }));
  document.querySelectorAll('.dept-sub-btn').forEach((b) => b.addEventListener('click', () => { state.deptSubTab = b.dataset.deptSub; render(); }));

  // Faculty profile correction request button
  document.getElementById('btn-request-profile-fix')?.addEventListener('click', () => {
    document.getElementById('profile-req-form').reset();
    document.getElementById('profile-req-error').classList.add('hidden');
    openModal('profile-request-modal');
  });

  // Administrator dashboard controls
  document.getElementById('btn-create-faculty-account')?.addEventListener('click', () => openCreateFacultyModal());
  document.getElementById('btn-admin-new-faculty')?.addEventListener('click', () => openCreateFacultyModal());

  document.querySelectorAll('.admin-quick-mod').forEach((b) => {
    b.addEventListener('click', () => openModerationActionFlow(b.dataset.quickModTable, b.dataset.quickModId, b.dataset.quickModStatus, b.dataset.reportId || ''));
  });
  document.querySelectorAll('.dismiss-report-btn').forEach((b) => {
    b.addEventListener('click', () => {
      const repId = b.dataset.dismissReport;
      const rep = (state.db.Student_Reports || []).find((r) => r.Report_ID === repId);
      if (!rep) return;
      openConfirmationSummary({
        title: 'Dismiss Student Report',
        subtitle: 'Provide a clear reason for dismissing this report. The announcement remains published.',
        summaryHtml: `<div class="rounded-xl glass-subtle p-3 text-xs space-y-1"><div class="font-bold text-[#18212F]">${escapeHtml(rep.Record_Title)}</div><div class="text-[#64748B]">Reported Reason: ${escapeHtml(rep.Reason)}</div></div>`,
        requireReason: true,
        reasonPlaceholder: 'Explain why this report is being dismissed...',
        confirmLabel: 'Confirm Dismiss Report',
        onConfirm: (reason) => {
          const res = adminResolveReport(repId, 'Dismissed', reason);
          if (res.ok) { render(); showToast(`${isDemoEnvironment() ? 'DEMO ACTION: ' : ''}Report dismissed`); }
          return res;
        }
      });
    });
  });

  document.querySelectorAll('.fac-perm-btn').forEach((b) => b.addEventListener('click', () => openFacultyPermissionsFlow(b.dataset.facPerm)));
  document.querySelectorAll('.fac-reset-btn').forEach((b) => b.addEventListener('click', () => openFacultyResetCredentialsFlow(b.dataset.facReset)));
  document.querySelectorAll('.fac-status-btn').forEach((b) => b.addEventListener('click', () => openFacultyAccountStatusFlow(b.dataset.facStatusId, b.dataset.facStatusTarget)));
  document.querySelectorAll('.resolve-prof-req').forEach((b) => {
    b.addEventListener('click', () => {
      const reqId = b.dataset.resolveReq;
      const decision = b.dataset.reqDecision;
      openConfirmationSummary({
        title: `${decision === 'Approved' ? 'Approve' : 'Reject'} Profile Correction Request`,
        subtitle: 'Confirm administrative action on this faculty profile update request.',
        summaryHtml: `<div class="rounded-xl glass-subtle p-3 text-xs">Request ID: <strong>${escapeHtml(reqId)}</strong> &rarr; Decision: <strong>${escapeHtml(decision)}</strong></div>`,
        requireReason: true,
        reasonPlaceholder: 'Administrator note for audit log...',
        confirmLabel: `Confirm ${decision}`,
        onConfirm: (notes) => {
          const res = adminResolveProfileRequest(reqId, decision, notes);
          if (res.ok) { render(); showToast(`${isDemoEnvironment() ? 'DEMO ACTION: ' : ''}Profile request ${decision.toLowerCase()}`); }
          return res;
        }
      });
    });
  });

  // Admin Information Management search & filter controls
  const aSearch = document.getElementById('admin-info-search');
  if (aSearch) aSearch.addEventListener('input', (e) => { state.adminInfoSearch = e.target.value; render(); });
  const aTbl = document.getElementById('admin-info-table');
  if (aTbl) aTbl.addEventListener('change', (e) => { state.adminInfoTable = e.target.value; render(); });
  const aDept = document.getElementById('admin-info-dept');
  if (aDept) aDept.addEventListener('change', (e) => { state.adminInfoDept = e.target.value; render(); });
  const aStat = document.getElementById('admin-info-status');
  if (aStat) aStat.addEventListener('change', (e) => { state.adminInfoStatus = e.target.value; render(); });

  const tArch = document.getElementById('toggle-archived');
  if (tArch) tArch.addEventListener('change', (e) => { state.showArchivedAcademics = e.target.checked; render(); });
  const swDept = document.getElementById('switch-dept-hub');
  if (swDept) swDept.addEventListener('change', (e) => { state.selectedDeptViewId = e.target.value; render(); });

  const bindSel = (id, key) => { const el = document.getElementById(id); if (el) el.addEventListener('change', (e) => { state[key] = e.target.value; render(); }); };
  bindSel('sf-type', 'searchType');
  bindSel('sf-year', 'searchYear');
  bindSel('sf-date', 'searchDate');
  bindSel('sf-class', 'searchClassification');
  bindSel('sf-avail', 'searchAvailability');

  document.querySelectorAll('.remove-filter-btn').forEach((b) => b.addEventListener('click', () => { state[b.dataset.removeFilter] = 'ALL'; render(); }));
  const clrAll = document.getElementById('clear-all-search-filters');
  if (clrAll) clrAll.addEventListener('click', () => {
    state.searchQuery = ''; state.deptFilter = 'ALL'; state.searchType = 'ALL'; state.searchYear = 'ALL'; state.searchDate = 'ALL'; state.searchClassification = 'ALL'; state.searchAvailability = 'ALL';
    document.getElementById('global-search').value = '';
    document.getElementById('clear-search').classList.add('hidden');
    render();
  });
}

// ==================== STATIC EVENT LISTENERS ====================
document.getElementById('tab-role-student').addEventListener('click', () => { state.activeLoginSection = 'student'; updateLoginUI(); });
document.getElementById('tab-role-staff').addEventListener('click', () => { state.activeLoginSection = 'staff'; updateLoginUI(); });
document.getElementById('staff-role-faculty').addEventListener('click', () => { state.selectedStaffRole = 'faculty'; updateLoginUI(); });
document.getElementById('staff-role-admin').addEventListener('click', () => { state.selectedStaffRole = 'administrator'; updateLoginUI(); });

const togglePw = (inId) => { const i = document.getElementById(inId); i.type = i.type === 'password' ? 'text' : 'password'; };
document.getElementById('toggle-student-pw').addEventListener('click', () => togglePw('student-password-input'));
document.getElementById('toggle-staff-pw').addEventListener('click', () => togglePw('staff-password-input'));

document.getElementById('fill-demo-student').addEventListener('click', () => {
  document.getElementById('student-id-input').value = '720826104095';
  document.getElementById('student-password-input').value = '01-01-2006';
});
document.getElementById('fill-demo-staff').addEventListener('click', () => {
  const isAdm = state.selectedStaffRole === 'administrator';
  document.getElementById('staff-id-input').value = isAdm ? 'admin.demo@example.com' : 'faculty.demo@example.com';
  document.getElementById('staff-password-input').value = isAdm ? 'admin-demo-2026' : 'faculty-demo-2026';
});

document.getElementById('student-login-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const err = document.getElementById('student-login-error');
  const res = AuthService.authenticateStudent(document.getElementById('student-id-input').value, document.getElementById('student-password-input').value);
  if (!res.ok) { err.textContent = res.error; err.classList.remove('hidden'); return; }
  err.classList.add('hidden');
  state.session = res.session;
  state.selectedDeptViewId = res.session.departmentId;
  state.activeTab = 'home';
  AuthService.saveSession(res.session);
  render();
  showToast(`Welcome, ${res.session.name || res.session.userId}`);
});

document.getElementById('staff-login-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const err = document.getElementById('staff-login-error');
  const res = AuthService.authenticateStaff(state.selectedStaffRole, document.getElementById('staff-id-input').value, document.getElementById('staff-password-input').value);
  if (!res.ok) { err.textContent = res.error; err.classList.remove('hidden'); return; }
  err.classList.add('hidden');
  state.session = res.session;
  if (res.session.departmentId && res.session.departmentId !== 'ALL') state.selectedDeptViewId = res.session.departmentId;
  state.activeTab = 'home';
  AuthService.saveSession(res.session);
  render();
  showToast(`Signed in as ${res.session.name} (${res.session.roleLabel})`);
});

document.getElementById('btn-logout').addEventListener('click', () => {
  AuthService.logout();
  state.session = null;
  state.searchQuery = '';
  state.deptFilter = 'ALL';
  render();
  showToast('Signed out');
});

document.getElementById('brand-home-btn').addEventListener('click', () => { state.activeTab = 'home'; state.searchQuery = ''; document.getElementById('global-search').value = ''; render(); });
document.querySelectorAll('.nav-btn, .mnav-btn, .more-nav-btn').forEach((b) => b.addEventListener('click', () => {
  state.activeTab = b.dataset.tab;
  state.searchQuery = '';
  document.getElementById('global-search').value = '';
  document.getElementById('clear-search').classList.add('hidden');
  document.getElementById('mobile-more-menu').classList.add('hidden');
  render();
}));

const moreBtn = document.getElementById('mobile-more-btn');
const moreMenu = document.getElementById('mobile-more-menu');
moreBtn.addEventListener('click', (e) => { e.stopPropagation(); const hidden = moreMenu.classList.toggle('hidden'); moreBtn.setAttribute('aria-expanded', String(!hidden)); });
document.addEventListener('click', (e) => { if (!moreMenu.contains(e.target) && e.target !== moreBtn) moreMenu.classList.add('hidden'); });

let searchTimer = null;
const searchInput = document.getElementById('global-search');
searchInput.addEventListener('input', (e) => {
  const val = e.target.value;
  document.getElementById('clear-search').classList.toggle('hidden', !val);
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    state.searchQuery = val;
    if (val.trim().length >= 3 && !state.recentSearches.includes(val.trim())) {
      state.recentSearches = [val.trim(), ...state.recentSearches].slice(0, 5);
      try { localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(state.recentSearches)); } catch (err) {}
    }
    render();
  }, 180);
});
document.getElementById('clear-search').addEventListener('click', () => applySearchSuggestion(''));
document.querySelectorAll('.suggest-chip').forEach((b) => b.addEventListener('click', () => applySearchSuggestion(b.dataset.suggest)));
document.getElementById('dept-filter').addEventListener('change', (e) => { state.deptFilter = e.target.value; render(); });

document.getElementById('btn-submit-desktop').addEventListener('click', () => openGuidedSubmission());
document.getElementById('btn-submit-mobile').addEventListener('click', () => openGuidedSubmission());
document.getElementById('close-detail').addEventListener('click', () => closeModal('detail-modal'));
document.getElementById('close-form').addEventListener('click', () => closeModal('form-modal'));
document.getElementById('close-reason').addEventListener('click', () => closeModal('reason-modal'));
document.getElementById('cancel-reason').addEventListener('click', () => closeModal('reason-modal'));
document.getElementById('close-report').addEventListener('click', () => closeModal('report-modal'));
document.getElementById('cancel-report').addEventListener('click', () => closeModal('report-modal'));
document.getElementById('close-admin-confirm').addEventListener('click', () => closeModal('admin-confirm-modal'));
document.getElementById('close-fac-acc').addEventListener('click', () => closeModal('faculty-account-modal'));
document.getElementById('cancel-fac-acc').addEventListener('click', () => closeModal('faculty-account-modal'));
document.getElementById('close-profile-req').addEventListener('click', () => closeModal('profile-request-modal'));
document.getElementById('cancel-profile-req').addEventListener('click', () => closeModal('profile-request-modal'));

// Student Report Form Submission
document.getElementById('report-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const ctx = state.pendingReport;
  if (!ctx) return;
  const reason = document.getElementById('report-reason-select').value;
  const explanation = document.getElementById('report-explanation-input').value;
  const errEl = document.getElementById('report-error');
  const res = submitStudentReport(ctx.table, ctx.id, reason, explanation);
  if (!res.ok) {
    errEl.textContent = res.error;
    errEl.classList.remove('hidden');
    return;
  }
  closeModal('report-modal');
  showToast(`${isDemoEnvironment() ? 'DEMO ACTION: ' : ''}Report submitted privately to Administrator for review.`);
});

// Admin Review Faculty Details Step (Mandatory Confirmation Before Account Creation)
document.getElementById('review-fac-acc').addEventListener('click', () => {
  const form = document.getElementById('fac-acc-form');
  const fd = new FormData(form);
  const profile = {
    Faculty_Name: String(fd.get('Faculty_Name') || '').trim(),
    Employee_ID: String(fd.get('Employee_ID') || '').trim(),
    Official_Email: String(fd.get('Official_Email') || '').trim(),
    Department_ID: String(fd.get('Department_ID') || '').trim(),
    Designation: String(fd.get('Designation') || '').trim(),
    Qualifications: String(fd.get('Qualifications') || '').trim(),
    Subjects_Handled: String(fd.get('Subjects_Handled') || '').trim(),
    Official_Contact: String(fd.get('Official_Contact') || '').trim(),
    Research_Interests: String(fd.get('Research_Interests') || '').trim(),
    Photograph: String(fd.get('Photograph') || '').trim()
  };
  const tempPassword = String(fd.get('Temp_Password') || '');
  const permissions = {
    canPublish: Boolean(form.querySelector('[name="perm_canPublish"]').checked),
    canEditOwn: Boolean(form.querySelector('[name="perm_canEditOwn"]').checked),
    canMarkUrgent: Boolean(form.querySelector('[name="perm_canMarkUrgent"]').checked),
    canArchiveOwn: Boolean(form.querySelector('[name="perm_canArchiveOwn"]').checked)
  };

  const errEl = document.getElementById('fac-acc-error');
  const required = ['Faculty_Name', 'Employee_ID', 'Official_Email', 'Department_ID', 'Designation', 'Qualifications', 'Subjects_Handled', 'Official_Contact'];
  const missing = required.filter((k) => !profile[k]);
  if (missing.length) {
    errEl.textContent = `Please complete all required fields: ${missing.map((m) => m.replace(/_/g, ' ')).join(', ')}.`;
    errEl.classList.remove('hidden');
    return;
  }
  if (!isValidEmail(profile.Official_Email)) {
    errEl.textContent = 'Please enter a valid Official Email address.';
    errEl.classList.remove('hidden');
    return;
  }
  if (tempPassword.length < 8) {
    errEl.textContent = 'Temporary password must be at least 8 characters long.';
    errEl.classList.remove('hidden');
    return;
  }
  errEl.classList.add('hidden');
  closeModal('faculty-account-modal');

  const permSummary = Object.entries(permissions).filter(([, v]) => v).map(([k]) => PERMISSION_LABELS[k]?.label || k).join(', ') || 'None';
  const reviewRows = [
    ['Faculty Name', profile.Faculty_Name],
    ['Faculty / Employee ID', profile.Employee_ID],
    ['Official Email', profile.Official_Email],
    ['Department', getDeptFullName(profile.Department_ID)],
    ['Designation', profile.Designation],
    ['Qualifications', profile.Qualifications],
    ['Subjects Handled', profile.Subjects_Handled],
    ['Official Contact', profile.Official_Contact],
    ['Research Interests', profile.Research_Interests || 'Not specified'],
    ['Photograph URL', profile.Photograph || 'Not provided'],
    ['Assigned Permissions', permSummary],
    ['Credential Policy', 'Temporary password hashed securely (never displayed in plain text) · Mandatory password change on first login']
  ];

  const summaryHtml = `
    <div class="rounded-xl glass-subtle p-3.5 text-xs space-y-2">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        ${reviewRows.map(([k, v]) => `
          <div class="${k === 'Credential Policy' || k === 'Assigned Permissions' ? 'sm:col-span-2' : ''}">
            <div class="text-[10px] font-semibold uppercase tracking-wide text-[#64748B]">${escapeHtml(k)}</div>
            <div class="text-xs font-medium text-[#18212F] mt-0.5 break-words">${escapeHtml(v)}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  openConfirmationSummary({
    title: 'Review Faculty Details',
    subtitle: 'Verify every field before creating the official faculty profile and account.',
    summaryHtml,
    requireReason: false,
    confirmLabel: 'Verify & Create Account',
    onBack: { label: 'Edit Details', fn: () => openCreateFacultyModal({ profile, permissions, tempPassword }) },
    onConfirm: () => {
      const res = adminCreateFacultyAccount(profile, permissions, tempPassword);
      if (res.ok) {
        render();
        showToast(`${isDemoEnvironment() ? 'DEMO ACTION: ' : ''}Official faculty account created for ${profile.Faculty_Name}`);
      }
      return res;
    }
  });
});

// Mandatory First-Login Password Change Form
document.getElementById('pw-change-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const cur = document.getElementById('pw-current-input').value;
  const nw = document.getElementById('pw-new-input').value;
  const cf = document.getElementById('pw-confirm-input').value;
  const errEl = document.getElementById('pw-change-error');
  if (nw !== cf) {
    errEl.textContent = 'New password and confirmation do not match.';
    errEl.classList.remove('hidden');
    return;
  }
  const res = AuthService.changeFacultyPassword(state.session.userId, cur, nw);
  if (!res.ok) {
    errEl.textContent = res.error;
    errEl.classList.remove('hidden');
    return;
  }
  document.getElementById('pw-change-form').reset();
  closeModal('password-change-modal');
  render();
  showToast(`${isDemoEnvironment() ? 'DEMO ACTION: ' : ''}Password updated successfully`);
});
document.getElementById('pw-change-logout').addEventListener('click', () => {
  closeModal('password-change-modal');
  AuthService.logout();
  state.session = null;
  render();
});

// Faculty Profile Correction Request Form
document.getElementById('profile-req-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const field = document.getElementById('profile-req-field').value;
  const val = document.getElementById('profile-req-value').value;
  const reason = document.getElementById('profile-req-reason').value;
  const errEl = document.getElementById('profile-req-error');
  const res = submitProfileCorrectionRequest(field, val, reason);
  if (!res.ok) {
    errEl.textContent = res.error;
    errEl.classList.remove('hidden');
    return;
  }
  closeModal('profile-request-modal');
  showToast(`${isDemoEnvironment() ? 'DEMO ACTION: ' : ''}Profile correction request sent to Administrator`);
});

document.getElementById('reason-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const ctx = state.pendingReasonAction;
  const reason = document.getElementById('reason-input').value.trim();
  const err = document.getElementById('reason-error');
  if (reason.length < 3) { err.textContent = 'Please provide a brief reason (at least 3 characters).'; err.classList.remove('hidden'); return; }
  const res = transitionRecordStatus(ctx.table, ctx.id, ctx.targetStatus, reason);
  if (!res.ok) { err.textContent = res.error; err.classList.remove('hidden'); return; }
  closeModal('reason-modal');
  openDetail(ctx.table, ctx.id);
  render();
  showToast(`${isDemoEnvironment() ? 'DEMO ACTION: ' : ''}Record marked as ${ctx.targetStatus}`);
});

document.getElementById('btn-reset-demo').addEventListener('click', () => openModal('confirm-modal'));
document.getElementById('cancel-reset').addEventListener('click', () => closeModal('confirm-modal'));
document.getElementById('confirm-reset').addEventListener('click', () => {
  state.db = cloneInitial();
  saveDB();
  closeModal('confirm-modal');
  render();
  showToast('DEMO ACTION: Sample data restored');
});

document.getElementById('btn-clear-history').addEventListener('click', () => openModal('clear-history-modal'));
document.getElementById('cancel-clear-history').addEventListener('click', () => closeModal('clear-history-modal'));
document.getElementById('confirm-clear-history').addEventListener('click', () => {
  state.recentSearches = [];
  try { localStorage.removeItem(RECENT_SEARCH_KEY); } catch (err) {}
  closeModal('clear-history-modal');
  renderRecentSearches();
  if (window.lucide) lucide.createIcons();
  showToast('Search history cleared');
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    ['theme-modal', 'clear-history-modal', 'reason-modal', 'confirm-modal', 'report-modal', 'admin-confirm-modal', 'faculty-account-modal', 'profile-request-modal', 'form-modal', 'detail-modal'].forEach((id) => closeModal(id));
  }
});

// ==================== THEME SETTINGS MODAL WIRING ====================
const openThemeSettings = () => {
  document.getElementById('mobile-more-menu')?.classList.add('hidden');
  if (window.ThemeService) window.ThemeService.applyTheme(window.ThemeService.getSavedPreference(), { skipSave: true });
  openModal('theme-modal');
};
document.getElementById('btn-theme-settings')?.addEventListener('click', openThemeSettings);
document.getElementById('btn-theme-login')?.addEventListener('click', openThemeSettings);
document.getElementById('btn-theme-mobile')?.addEventListener('click', openThemeSettings);
document.getElementById('close-theme-modal')?.addEventListener('click', () => closeModal('theme-modal'));
document.getElementById('done-theme-modal')?.addEventListener('click', () => closeModal('theme-modal'));
document.querySelectorAll('[data-theme-choice]').forEach((btn) => {
  btn.addEventListener('click', () => {
    if (!window.ThemeService) return;
    const result = window.ThemeService.applyTheme(btn.dataset.themeChoice);
    const label = result.mode === 'system'
      ? `System Default (${result.effective === 'dark' ? 'Dark' : 'Light'})`
      : (result.mode === 'dark' ? 'Dark Theme' : 'Light Theme');
    showToast(`Theme set to ${label}`);
  });
});

// ==================== INITIAL APPLICATION BOOTSTRAP ====================
try {
  if (window.ThemeService) window.ThemeService.init();
  render();
  if (window.ThemeService) window.ThemeService.syncAllLogos(window.ThemeService.resolveEffectiveTheme());
} catch (bootErr) {
  console.error('HIT Connect initialization error:', bootErr);
} finally {
  if (typeof window.dismissHitStartupLoader === 'function') {
    requestAnimationFrame(() => window.dismissHitStartupLoader());
  }
}

// ==================== CAPACITOR ANDROID BACK-BUTTON SUPPORT ====================
if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
  window.Capacitor.Plugins.App.addListener('backButton', ({ canGoBack }) => {
    const openModals = ['theme-modal', 'clear-history-modal', 'reason-modal', 'confirm-modal', 'report-modal', 'admin-confirm-modal', 'faculty-account-modal', 'profile-request-modal', 'form-modal', 'detail-modal'];
    const activeModal = openModals.find((id) => {
      const el = document.getElementById(id);
      return el && !el.classList.contains('hidden');
    });
    if (activeModal) {
      closeModal(activeModal);
      return;
    }
    if (state.searchQuery.trim()) {
      applySearchSuggestion('');
      return;
    }
    if (state.activeTab !== 'home') {
      state.activeTab = 'home';
      render();
      return;
    }
    if (canGoBack) {
      window.history.back();
    } else {
      window.Capacitor.Plugins.App.exitApp();
    }
  });
}
