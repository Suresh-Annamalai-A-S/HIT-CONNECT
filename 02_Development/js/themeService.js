// HIT Connect — Application-Wide Light / Dark / System Theme Service
(function initThemeServiceModule(global) {
  const THEME_STORAGE_KEY = 'hit_connect_theme_v1'; // 'system' | 'light' | 'dark'
  const OFFICIAL_LOGO_SRC = 'assets/logo/HIT_Official_Logo.png';
  const LOGO_LIGHT_SRC = OFFICIAL_LOGO_SRC;
  const LOGO_DARK_SRC = OFFICIAL_LOGO_SRC;
  const VALID_MODES = ['system', 'light', 'dark'];

  const mediaQuery = global.matchMedia
    ? global.matchMedia('(prefers-color-scheme: dark)')
    : null;

  function getSavedPreference() {
    try {
      const saved = global.localStorage.getItem(THEME_STORAGE_KEY);
      if (VALID_MODES.includes(saved)) return saved;
    } catch (e) {}
    return 'system';
  }

  function resolveEffectiveTheme(preference) {
    const mode = VALID_MODES.includes(preference) ? preference : getSavedPreference();
    if (mode === 'system') {
      return mediaQuery && mediaQuery.matches ? 'dark' : 'light';
    }
    return mode;
  }

  function getLogoSrcForTheme() {
    return OFFICIAL_LOGO_SRC;
  }

  function syncAllLogos(effectiveTheme) {
    const targetSrc = getLogoSrcForTheme(effectiveTheme);
    document.querySelectorAll('img[data-hit-logo]').forEach((img) => {
      if (img.getAttribute('src') !== targetSrc) {
        img.setAttribute('src', targetSrc);
      }
      // Restore image visibility if a fallback had been triggered earlier
      img.classList.remove('hidden');
      const fallback = img.nextElementSibling;
      if (fallback && (fallback.classList.contains('hit-logo-fallback') || fallback.classList.contains('hit-loader-monogram'))) {
        fallback.classList.add('hidden');
      }
    });
  }

  function syncStatusBar(effectiveTheme) {
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    const bgHex = effectiveTheme === 'dark' ? '#0B1220' : '#F8FAFC';
    if (metaTheme) {
      metaTheme.setAttribute('content', bgHex);
    }

    try {
      const statusBar = global.Capacitor && global.Capacitor.Plugins && global.Capacitor.Plugins.StatusBar;
      if (statusBar) {
        if (typeof statusBar.setBackgroundColor === 'function') {
          statusBar.setBackgroundColor({ color: effectiveTheme === 'dark' ? '#0B1220' : '#A51D3D' }).catch(() => {});
        }
        if (typeof statusBar.setStyle === 'function') {
          statusBar.setStyle({ style: 'DARK' }).catch(() => {});
        }
      }
    } catch (e) {}
  }

  function syncThemeControls(preference, effectiveTheme) {
    // Update Appearance modal option buttons
    document.querySelectorAll('[data-theme-choice]').forEach((btn) => {
      const isSelected = btn.dataset.themeChoice === preference;
      btn.setAttribute('aria-pressed', String(isSelected));
      btn.classList.toggle('is-selected-theme', isSelected);
    });

    // Update active theme summary label
    const activeLabel = document.getElementById('theme-current-summary');
    if (activeLabel) {
      const modeText = preference === 'system'
        ? `System Default (${effectiveTheme === 'dark' ? 'Dark' : 'Light'})`
        : (preference === 'dark' ? 'Dark Theme' : 'Light Theme');
      activeLabel.textContent = modeText;
    }

    // Update quick toggle icons/labels in header and login screen
    document.querySelectorAll('[data-theme-toggle-icon]').forEach((el) => {
      el.setAttribute('data-lucide', effectiveTheme === 'dark' ? 'moon' : 'sun');
    });
    document.querySelectorAll('[data-theme-toggle-label]').forEach((el) => {
      el.textContent = preference === 'system'
        ? 'Auto'
        : (effectiveTheme === 'dark' ? 'Dark' : 'Light');
    });

    if (global.lucide && typeof global.lucide.createIcons === 'function') {
      global.lucide.createIcons();
    }
  }

  function applyTheme(preference, options = {}) {
    const mode = VALID_MODES.includes(preference) ? preference : getSavedPreference();
    if (!options.skipSave) {
      try {
        global.localStorage.setItem(THEME_STORAGE_KEY, mode);
      } catch (e) {}
    }

    const effective = resolveEffectiveTheme(mode);
    const root = document.documentElement;
    root.setAttribute('data-theme', effective);
    root.setAttribute('data-theme-mode', mode);
    root.classList.toggle('dark', effective === 'dark');
    root.style.colorScheme = effective;

    syncAllLogos(effective);
    syncStatusBar(effective);
    syncThemeControls(mode, effective);

    return { mode, effective };
  }

  function init() {
    const state = applyTheme(getSavedPreference(), { skipSave: true });
    if (mediaQuery) {
      const onSystemThemeChange = () => {
        if (getSavedPreference() === 'system') {
          applyTheme('system', { skipSave: true });
        }
      };
      if (typeof mediaQuery.addEventListener === 'function') {
        mediaQuery.addEventListener('change', onSystemThemeChange);
      } else if (typeof mediaQuery.addListener === 'function') {
        mediaQuery.addListener(onSystemThemeChange);
      }
    }
    return state;
  }

  global.ThemeService = {
    STORAGE_KEY: THEME_STORAGE_KEY,
    LOGO_LIGHT_SRC,
    LOGO_DARK_SRC,
    getSavedPreference,
    resolveEffectiveTheme,
    getLogoSrcForTheme,
    applyTheme,
    syncAllLogos,
    init
  };
})(window);
