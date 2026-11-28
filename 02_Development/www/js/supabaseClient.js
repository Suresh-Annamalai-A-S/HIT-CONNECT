// HIT Connect — Supabase Client & Cloud Sync Helper
// Works gracefully alongside Demo Mode (localStorage) until Supabase credentials are added in js/config.js.

(function () {
  let client = null;

  function initSupabase() {
    if (client) return client;
    if (!window.HIT_CONFIG || !window.HIT_CONFIG.isSupabaseConfigured) return null;
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      client = window.supabase.createClient(
        window.HIT_CONFIG.SUPABASE_URL,
        window.HIT_CONFIG.SUPABASE_ANON_KEY
      );
    }
    return client;
  }

  // Maps prototype PascalCase table names to PostgreSQL snake_case table names
  const PG_TABLE_MAP = {
    Departments: 'departments',
    Faculty: 'faculty',
    Academics: 'academics',
    Opportunities: 'opportunities',
    Events: 'events',
    Announcements: 'announcements',
    Clubs: 'clubs',
    Administrative_Contacts: 'administrative_contacts',
    Student_Profiles: 'student_profiles',
    Campus_Resources: 'campus_resources',
    Student_Reports: 'student_reports',
    Notifications: 'notifications',
    Profile_Correction_Requests: 'profile_correction_requests',
    Verification_History: 'verification_history'
  };

  window.SupabaseService = {
    getClient: initSupabase,
    isEnabled() {
      return Boolean(initSupabase());
    },
    getPgTable(prototypeTableName) {
      return PG_TABLE_MAP[prototypeTableName] || prototypeTableName.toLowerCase();
    },
    async signInWithEmail(email, password) {
      const sb = initSupabase();
      if (!sb) return { ok: false, error: 'Supabase backend is not configured (running in Demo Environment).' };
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) return { ok: false, error: error.message };
      const { data: profile, error: profErr } = await sb
        .from('user_profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
      if (profErr) return { ok: false, error: 'Signed in, but user profile/role could not be loaded.' };
      if (profile.account_status && profile.account_status !== 'Active') {
        await sb.auth.signOut();
        return { ok: false, error: `This account is currently ${profile.account_status}. Please contact the Administrator.` };
      }
      return { ok: true, user: data.user, profile };
    },
    async signOut() {
      const sb = initSupabase();
      if (sb) await sb.auth.signOut();
    },
    async fetchTable(prototypeTableName) {
      const sb = initSupabase();
      if (!sb) return { ok: false, error: 'Supabase is not configured.', data: [] };
      const pgTable = this.getPgTable(prototypeTableName);
      const { data, error } = await sb.from(pgTable).select('*');
      if (error) return { ok: false, error: error.message, data: [] };
      return { ok: true, data: data || [] };
    },
    async upsertRecord(prototypeTableName, record) {
      const sb = initSupabase();
      if (!sb) return { ok: false, error: 'Supabase is not configured.' };
      const pgTable = this.getPgTable(prototypeTableName);
      const { data, error } = await sb.from(pgTable).upsert(record).select().single();
      if (error) return { ok: false, error: error.message };
      return { ok: true, data };
    }
  };
})();
