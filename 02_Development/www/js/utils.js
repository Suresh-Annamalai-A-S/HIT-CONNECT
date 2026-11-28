// HIT Connect — Utility Helpers (Dates, Validation, Hashing, Diffing, Academic Context)

// ==================== UTILITY HELPERS ====================
function todayLocalISO(dateObj) {
  const d = dateObj || new Date();
  try {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d);
    return `${parts.find((p) => p.type === 'year').value}-${parts.find((p) => p.type === 'month').value}-${parts.find((p) => p.type === 'day').value}`;
  } catch (e) {
    return d.toISOString().slice(0, 10);
  }
}

function nowLocalTimestamp(dateObj) {
  const d = dateObj || new Date();
  try {
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(d);
    const g = (t) => parts.find((p) => p.type === t).value;
    return `${g('year')}-${g('month')}-${g('day')} ${g('hour')}:${g('minute')} IST`;
  } catch (e) {
    return `${todayLocalISO(d)} IST`;
  }
}

function isValidISODate(str) {
  if (typeof str !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const [y, m, d] = str.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

function dateOnlyToUtcMs(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

function formatDisplayDate(isoDate) {
  if (!isValidISODate(isoDate)) return '';
  const [y, m, d] = isoDate.split('-').map(Number);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d} ${months[m - 1]} ${y}`;
}

function isValidEmail(str) { return typeof str === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(str); }
function isValidHttpsUrl(str) { try { const u = new URL(str); return u.protocol === 'https:' && Boolean(u.hostname); } catch (e) { return false; } }
function escapeHtml(val) { return String(val ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
function getInitials(name) {
  const c = String(name || '').replace(/^SAMPLE\s*[—-]\s*/i, '').replace(/^Dr\.?\s+/i, '').trim();
  const p = c.split(/\s+/).filter(Boolean);
  return p.length === 0 ? 'HI' : p.length === 1 ? p[0].slice(0, 2).toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

// Synchronous salted hash for local Demo Mode credentials so plain-text passwords are NEVER stored or displayed
function hashSecretSync(secret, salt) {
  const input = `hit_connect_v2:${String(salt || 'hit')}:${String(secret || '')}`;
  let h1 = 0xdeadbeef ^ input.length;
  let h2 = 0x41c6ce57 ^ input.length;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 'hc$' + (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

function isDemoEnvironment() {
  return !(window.HIT_CONFIG && window.HIT_CONFIG.isSupabaseConfigured);
}

function isDemoRecord(rec) {
  if (!rec) return false;
  if (rec.Is_Demo === true) return true;
  if (rec.Data_Classification === 'DEMONSTRATION_DATA') return true;
  const src = String(rec.Source || '').toUpperCase();
  if (src.includes('DEMO') || src.includes('SAMPLE') || src.includes('PROTOTYPE')) return true;
  return false;
}

function computeRecordDiff(table, originalObj, updatedObj) {
  const schema = FORM_SCHEMAS[table] || [];
  const labelMap = {};
  schema.forEach((f) => { labelMap[f.name] = f.label; });
  labelMap.Clarification_Contact_ID = 'Clarification Contact';
  labelMap.Verification_Status = 'Publication Status';

  const keys = Array.from(new Set([...schema.map((f) => f.name), 'Clarification_Contact_ID']));
  const changes = [];
  keys.forEach((k) => {
    const beforeVal = originalObj ? (originalObj[k] ?? '') : '';
    const afterVal = updatedObj ? (updatedObj[k] ?? '') : '';
    const normBefore = typeof beforeVal === 'boolean' ? String(beforeVal) : String(beforeVal).trim();
    const normAfter = typeof afterVal === 'boolean' ? String(afterVal) : String(afterVal).trim();
    if (normBefore !== normAfter) {
      changes.push({
        field: k,
        label: labelMap[k] || k.replace(/_/g, ' '),
        before: normBefore || '—',
        after: normAfter || '—',
        isSignificant: SIGNIFICANT_CORRECTION_FIELDS.includes(k)
      });
    }
  });
  return changes;
}

function calculateAcademicContext(admissionYear) {
  const yr = Number(admissionYear);
  if (!Number.isInteger(yr) || yr < 2018 || yr > 2035) {
    return { admissionYear: null, batch: 'Pending Verification', academicYear: 'Pending Verification', semesterNumber: null, semesterRoman: 'Pending Verification', yearOfStudy: null, statusNote: 'Admission year could not be validated.' };
  }
  const batch = `${yr}–${yr + 4}`;
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', year: 'numeric', month: 'numeric' }).formatToParts(new Date());
  const curYear = Number((parts.find((p) => p.type === 'year') || {}).value);
  const curMonth = Number((parts.find((p) => p.type === 'month') || {}).value);
  const isOdd = curMonth >= 7;
  const academicYear = isOdd ? `${curYear}–${String(curYear + 1).slice(-2)}` : `${curYear - 1}–${String(curYear).slice(-2)}`;
  const sem = isOdd ? (curYear - yr) * 2 + 1 : (curYear - yr) * 2;
  if (sem < 1) return { admissionYear: yr, batch, academicYear, semesterNumber: null, semesterRoman: 'Upcoming Batch', yearOfStudy: 1, statusNote: 'Programme has not commenced yet.' };
  if (sem > 8) return { admissionYear: yr, batch, academicYear, semesterNumber: null, semesterRoman: 'Completed', yearOfStudy: 4, statusNote: 'Batch has completed standard progression.' };
  return { admissionYear: yr, batch, academicYear, semesterNumber: sem, semesterRoman: ROMAN_SEMESTERS[sem - 1], yearOfStudy: Math.ceil(sem / 2), statusNote: 'Estimated from admission batch and current date.' };
}

function getOpportunityAvailability(rec) {
  const deadlineStr = rec ? rec.Application_Deadline : '';
  const startStr = rec ? rec.Application_Start_Date : '';
  if (!isValidISODate(deadlineStr)) return { status: 'Course-Specific', label: 'Dates Course-Specific' };
  const todayIso = todayLocalISO();
  if (isValidISODate(startStr) && dateOnlyToUtcMs(todayIso) < dateOnlyToUtcMs(startStr)) {
    const d = Math.round((dateOnlyToUtcMs(startStr) - dateOnlyToUtcMs(todayIso)) / 86400000);
    return { status: 'Upcoming', label: `Upcoming (${d}d)` };
  }
  const diff = Math.round((dateOnlyToUtcMs(deadlineStr) - dateOnlyToUtcMs(todayIso)) / 86400000);
  if (diff < 0) return { status: 'Expired', label: 'Expired' };
  if (diff <= 7) return { status: 'Closing Soon', label: diff === 0 ? 'Closes Today' : `Closing Soon (${diff}d)` };
  return { status: 'Open', label: `Open (${diff}d left)` };
}

function getEventTimeStatus(eventDateStr) {
  if (!isValidISODate(eventDateStr)) return 'Upcoming';
  return eventDateStr < todayLocalISO() ? 'Past' : 'Upcoming';
}
