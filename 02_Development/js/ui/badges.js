// HIT Connect — UI Badge Renderers
// Policy: Students NEVER see internal moderation or verification labels
// (no Verified, Unverified, Pending Verification, Awaiting Administrator Approval, or Under Internal Review).

function classificationBadge(cls, rec) {
  const isStudent = state.session && state.session.role === 'student';
  const demo = cls === 'DEMONSTRATION_DATA' || isDemoRecord(rec);

  if (demo) {
    return `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gold-50/90 text-gold-800 border border-gold-200/90"><i data-lucide="flask-conical" class="w-3.5 h-3.5" aria-hidden="true"></i>DEMO DATA</span>`;
  }
  // Never expose internal verification labels to students
  if (isStudent) return '';

  // For staff/admin only, keep institutional source clean
  return `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/80 text-slate-700 border border-slate-200/90"><i data-lucide="building-2" class="w-3.5 h-3.5" aria-hidden="true"></i>Campus Record</span>`;
}

function urgentBadge(rec) {
  if (!rec || !rec.Is_Urgent) return '';
  return `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100/95 text-rose-900 border border-rose-300"><i data-lucide="alert-triangle" class="w-3 h-3" aria-hidden="true"></i>Urgent</span>`;
}

function workflowBadge(status) {
  // Never show internal lifecycle states to students
  if (state.session && state.session.role === 'student') return '';
  const map = {
    'Published': 'bg-emerald-100/90 text-emerald-900 border-emerald-300',
    'Draft': 'bg-white/80 text-slate-700 border-slate-200',
    'Temporarily Hidden': 'bg-amber-100/95 text-amber-900 border-amber-300',
    'Archived': 'bg-amber-50/90 text-amber-900 border-amber-200',
    'Removed': 'bg-rose-100/95 text-rose-900 border-rose-300',
    'Expired': 'bg-rose-50/90 text-rose-800 border-rose-200'
  };
  return `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${map[status] || map.Draft}">${escapeHtml(status)}</span>`;
}

function accountStatusBadge(status) {
  const st = status || 'Active';
  const map = {
    'Active': 'bg-emerald-100/90 text-emerald-900 border-emerald-300',
    'Suspended': 'bg-amber-100/95 text-amber-900 border-amber-300',
    'Deactivated': 'bg-rose-100/95 text-rose-900 border-rose-300'
  };
  return `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${map[st] || map.Active}">${escapeHtml(st)}</span>`;
}

function reportStatusBadge(status) {
  const map = {
    'Open': 'bg-rose-100/90 text-rose-900 border-rose-300',
    'Under Investigation': 'bg-amber-100/90 text-amber-900 border-amber-300',
    'Corrected': 'bg-emerald-100/90 text-emerald-900 border-emerald-300',
    'Hidden': 'bg-amber-50/90 text-amber-900 border-amber-200',
    'Removed': 'bg-rose-50/90 text-rose-800 border-rose-200',
    'Dismissed': 'bg-white/80 text-slate-700 border-slate-200'
  };
  return `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${map[status] || map.Open}">${escapeHtml(status)}</span>`;
}

function availabilityBadge(avail) {
  const map = {
    'Open': { cls: 'bg-emerald-50/90 text-emerald-800 border-emerald-200', icon: 'circle-check' },
    'Closing Soon': { cls: 'bg-amber-100/90 text-amber-900 border-amber-300', icon: 'alarm-clock' },
    'Upcoming': { cls: 'bg-blue-50/90 text-blue-800 border-blue-200', icon: 'calendar-clock' },
    'Expired': { cls: 'bg-rose-50/90 text-rose-800 border-rose-200', icon: 'calendar-off' },
    'Course-Specific': { cls: 'bg-white/80 text-slate-700 border-slate-200', icon: 'calendar' }
  };
  const c = map[avail.status] || map['Course-Specific'];
  return `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${c.cls}"><i data-lucide="${c.icon}" class="w-3 h-3" aria-hidden="true"></i>${escapeHtml(avail.label)}</span>`;
}
