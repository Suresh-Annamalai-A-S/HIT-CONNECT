// HIT Connect — Authentication Service (Demo Mode + Supabase Auth Ready)
// Policy: No public faculty self-registration. Faculty accounts are created exclusively by Administrators.

function getActiveDepartmentsList() {
  return (typeof state !== 'undefined' && state.db && Array.isArray(state.db.Departments)) ? state.db.Departments : INITIAL_DEPARTMENTS;
}

function findStudentProfile(registerNumber) {
  const reg = String(registerNumber || '').trim();
  const list = (typeof state !== 'undefined' && state.db && Array.isArray(state.db.Student_Profiles)) ? state.db.Student_Profiles : INITIAL_STUDENT_PROFILES;
  return list.find((p) => String(p.Register_Number || '').trim() === reg) || null;
}

function buildInitialFacultyAccounts() {
  return (DEMO_ACCOUNTS.faculty || []).map((a) => ({
    userId: a.userId,
    linkedPersonId: a.linkedPersonId,
    identifiers: [...a.identifiers],
    passwordHash: hashSecretSync(a.demoSecret, a.userId),
    mustChangePassword: false,
    createdAt: '2026-11-26 09:00 IST',
    createdBy: 'Demo Administrator (Seed)',
    isDemo: true
  }));
}

function resolveProgrammeFromRegisterNumber(registerNumber) {
  const reg = String(registerNumber || '').trim();
  if (!reg) return { ok: false, error: 'Please enter your Student Register Number.' };
  const m = reg.match(/^(7208)(\d{2})(\d{3})(\d{3})$/);
  if (!m) return { ok: false, error: 'Enter a valid 12-digit HIT Register Number starting with 7208 (e.g. 720826104001).' };
  const [, collegeCode, yearDigits, deptDigits] = m;
  const prefix = `${collegeCode}${yearDigits}${deptDigits}`;
  const batchInfo = SUPPORTED_BATCH_MAP[yearDigits];
  if (!batchInfo) return { ok: false, error: `Admission year code "${yearDigits}" is not mapped in this prototype.` };
  if (UNMAPPED_REGISTER_PREFIXES.includes(prefix)) return { ok: false, error: `Department code ${deptDigits} is pending official verification.` };

  const dept = getActiveDepartmentsList().find((d) => {
    const dp = String(d.Register_Prefix || '').trim();
    return dp === prefix || (dp.length === 9 && dp.startsWith(collegeCode) && dp.slice(6, 9) === deptDigits);
  });
  if (!dept) return { ok: false, error: 'Register number does not match a recognised HIT programme prefix.' };

  const acadCtx = calculateAcademicContext(batchInfo.admissionYear);
  return {
    ok: true,
    registerNumber: reg,
    admissionYear: acadCtx.admissionYear,
    batch: acadCtx.batch,
    academicYear: acadCtx.academicYear,
    currentSemester: acadCtx.semesterRoman,
    yearOfStudy: acadCtx.yearOfStudy,
    academicStatusNote: acadCtx.statusNote,
    programmeName: dept.Programme_Name || dept.Department_Name,
    departmentId: dept.Department_ID,
    departmentCode: dept.Department_Code,
    departmentName: dept.Department_Name
  };
}

const AuthService = {
  buildStudentSession(reg, loggedInAt) {
    const prog = resolveProgrammeFromRegisterNumber(reg);
    if (!prog.ok) return null;
    const profile = findStudentProfile(reg);
    const admYr = (profile && profile.Admission_Year) ? Number(profile.Admission_Year) : prog.admissionYear;
    const ctx = calculateAcademicContext(admYr);
    return {
      userId: prog.registerNumber,
      studentId: profile ? profile.Student_ID : '',
      name: profile ? profile.Full_Name : '',
      programmeName: prog.programmeName,
      departmentId: prog.departmentId,
      departmentCode: prog.departmentCode,
      departmentName: prog.departmentName,
      admissionYear: ctx.admissionYear,
      batch: ctx.batch,
      academicYear: ctx.academicYear,
      currentSemester: ctx.semesterRoman,
      yearOfStudy: ctx.yearOfStudy,
      academicStatusNote: ctx.statusNote,
      photographUrl: profile ? (profile.Photograph_URL || '') : '',
      profileStatus: profile ? (profile.Profile_Classification || 'DEMO STUDENT PROFILE') : 'DEMO STUDENT PROFILE',
      role: 'student',
      roleLabel: `Student — ${prog.departmentCode}`,
      loggedInAt: loggedInAt || nowLocalTimestamp()
    };
  },

  buildFacultySessionFromDB(acc, loggedInAt) {
    const facList = (typeof state !== 'undefined' && state.db && Array.isArray(state.db.Faculty)) ? state.db.Faculty : INITIAL_DB.Faculty;
    const fac = facList.find((f) => f.Faculty_ID === acc.linkedPersonId);
    if (!fac) return { ok: false, error: 'Official faculty profile could not be found. Contact the Administrator.' };
    const status = fac.Account_Status || 'Active';
    if (status !== 'Active') {
      return { ok: false, error: `Your faculty account is currently ${status}. Please contact the Administrator.` };
    }
    return {
      ok: true,
      session: {
        userId: acc.userId,
        linkedPersonId: fac.Faculty_ID,
        facultyId: fac.Faculty_ID,
        employeeId: fac.Employee_ID || fac.Faculty_ID,
        name: fac.Faculty_Name,
        designation: fac.Designation || 'Faculty',
        departmentId: fac.Department_ID,
        officialEmail: fac.Official_Email || '',
        officialContact: fac.Official_Contact || '',
        permissions: { ...DEFAULT_FACULTY_PERMISSIONS, ...(fac.Permissions || {}) },
        mustChangePassword: Boolean(acc.mustChangePassword),
        accountStatus: status,
        role: 'faculty',
        roleLabel: 'Faculty',
        loggedInAt: loggedInAt || nowLocalTimestamp()
      }
    };
  },

  authenticateStudent(reg, dob) {
    if (!String(dob || '').trim()) return { ok: false, error: 'Please enter your Password (simulated Date of Birth).' };
    const prog = resolveProgrammeFromRegisterNumber(reg);
    if (!prog.ok) return { ok: false, error: prog.error };
    return { ok: true, session: this.buildStudentSession(reg) };
  },

  authenticateStaff(accountType, id, pw) {
    const roleKey = accountType === 'administrator' ? 'administrator' : 'faculty';
    const cleanId = String(id || '').trim().toLowerCase();
    const secret = String(pw || '');
    if (!cleanId || !secret) return { ok: false, error: 'Please enter both your Official Email / Employee ID and Password.' };

    if (roleKey === 'administrator') {
      const pool = DEMO_ACCOUNTS.administrator || [];
      const match = pool.find((a) => a.identifiers.some((i) => i.toLowerCase() === cleanId) && a.demoSecret === secret);
      if (!match) return { ok: false, error: 'Invalid administrator credentials.' };
      return {
        ok: true,
        session: {
          userId: match.userId,
          linkedPersonId: match.linkedPersonId || '',
          name: match.name,
          designation: match.designation || '',
          departmentId: match.departmentId,
          role: 'administrator',
          roleLabel: 'Administrator',
          loggedInAt: nowLocalTimestamp()
        }
      };
    }

    // Faculty login: strictly against administrator-created accounts stored in DB (hashed credentials only)
    const accounts = (typeof state !== 'undefined' && state.db && Array.isArray(state.db.Faculty_Accounts))
      ? state.db.Faculty_Accounts
      : buildInitialFacultyAccounts();

    const acc = accounts.find((a) => {
      const idMatch = (a.identifiers || []).some((i) => String(i || '').trim().toLowerCase() === cleanId);
      if (!idMatch) return false;
      return a.passwordHash === hashSecretSync(secret, a.userId);
    });

    if (!acc) return { ok: false, error: 'Invalid faculty credentials. Faculty accounts must be created by an Administrator.' };
    return this.buildFacultySessionFromDB(acc);
  },

  changeFacultyPassword(userId, currentPw, newPw) {
    if (!state.session || state.session.role !== 'faculty' || state.session.userId !== userId) {
      return { ok: false, error: 'Unauthorised password change attempt.' };
    }
    const acc = (state.db.Faculty_Accounts || []).find((a) => a.userId === userId);
    if (!acc) return { ok: false, error: 'Faculty account record not found.' };
    if (acc.passwordHash !== hashSecretSync(currentPw, acc.userId)) {
      return { ok: false, error: 'Current / temporary password is incorrect.' };
    }
    if (!newPw || newPw.length < 8) {
      return { ok: false, error: 'New password must be at least 8 characters long.' };
    }
    if (newPw === currentPw) {
      return { ok: false, error: 'New password must be different from your temporary password.' };
    }
    acc.passwordHash = hashSecretSync(newPw, acc.userId);
    acc.mustChangePassword = false;
    acc.passwordUpdatedAt = nowLocalTimestamp();

    const fac = (state.db.Faculty || []).find((f) => f.Faculty_ID === acc.linkedPersonId);
    if (fac) fac.Must_Change_Password = false;

    state.session.mustChangePassword = false;
    AuthService.saveSession(state.session);
    logAuditEvent({
      actionType: 'PASSWORD_CHANGED',
      table: 'Faculty',
      recordId: acc.linkedPersonId,
      prevStatus: 'Temporary Credentials',
      nextStatus: 'Active Credentials',
      remarks: 'Faculty completed mandatory first-login password update (credentials hashed; never logged).',
      reason: 'Mandatory first-login credential update'
    });
    saveDB();
    return { ok: true };
  },

  loadSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.role) return null;
      if (parsed.role === 'student') return this.buildStudentSession(parsed.userId, parsed.loggedInAt);
      if (parsed.role === 'faculty') {
        const accounts = (typeof state !== 'undefined' && state.db && Array.isArray(state.db.Faculty_Accounts))
          ? state.db.Faculty_Accounts
          : buildInitialFacultyAccounts();
        const acc = accounts.find((a) => a.userId === parsed.userId);
        if (!acc) return null;
        const rebuilt = this.buildFacultySessionFromDB(acc, parsed.loggedInAt);
        return rebuilt.ok ? rebuilt.session : null;
      }
      const pool = DEMO_ACCOUNTS[parsed.role] || [];
      const acc = pool.find((a) => a.userId === parsed.userId);
      return acc ? { userId: acc.userId, linkedPersonId: acc.linkedPersonId || '', name: acc.name, designation: acc.designation || '', departmentId: acc.departmentId, role: acc.role, roleLabel: acc.roleLabel, loggedInAt: parsed.loggedInAt || nowLocalTimestamp() } : null;
    } catch (e) { return null; }
  },

  saveSession(s) { try { if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s)); else localStorage.removeItem(SESSION_KEY); } catch (e) {} },
  logout() { this.saveSession(null); }
};
