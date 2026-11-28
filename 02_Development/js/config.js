// HIT Connect — Runtime Configuration
// SECURITY NOTE: Only place the Supabase Project URL and public 'anon' key here.
// NEVER place a Supabase 'service_role' key or database password in frontend code.

window.HIT_CONFIG = {
  APP_NAME: 'HIT Connect',
  INSTITUTION: 'Hindusthan Institute of Technology, Coimbatore',
  // Set these two values from your Supabase Dashboard -> Project Settings -> API
  SUPABASE_URL: '',
  SUPABASE_ANON_KEY: '',
  // Automatically uses Supabase when both URL and ANON_KEY are set; otherwise runs in local Demo Mode
  get isSupabaseConfigured() {
    return Boolean(
      this.SUPABASE_URL &&
      this.SUPABASE_ANON_KEY &&
      this.SUPABASE_URL.startsWith('https://') &&
      !this.SUPABASE_URL.includes('YOUR_PROJECT_REF')
    );
  }
};

// Centralized Official Institutional Logo Helper (Hindusthan Institute of Technology, Coimbatore)
window.HIT_LOGO_PRIMARY = 'assets/logo/HIT_Official_Logo.png';
window.HIT_LOGO_SECONDARY = 'assets/logo/favicon-192x192.png';
window.handleHitLogoError = function (img) {
  if (!img) return;
  const step = Number(img.dataset.fallbackStep || '0');
  if (step === 0) {
    img.dataset.fallbackStep = '1';
    img.src = window.HIT_LOGO_SECONDARY;
  } else {
    img.classList.add('hidden');
    const fallback = img.nextElementSibling;
    if (fallback) fallback.classList.remove('hidden');
  }
};
