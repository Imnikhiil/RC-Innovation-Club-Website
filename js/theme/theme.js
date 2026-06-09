const THEME_STORAGE_KEY = 'rc_theme_preference';

window.RC_THEME = {
  getPreference() {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {
      /* ignore */
    }
    return null;
  },

  getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  },

  getResolvedTheme() {
    return this.getPreference() || this.getSystemTheme();
  },

  apply(theme) {
    const resolved = theme === 'dark' || theme === 'light' ? theme : this.getResolvedTheme();
    document.documentElement.setAttribute('data-theme', resolved);

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', resolved === 'light' ? '#f8fafc' : '#020617');
    }

    this.updateToggleButtons(resolved);
    return resolved;
  },

  setPreference(theme) {
    if (theme !== 'dark' && theme !== 'light') return;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
    this.apply(theme);
    window.dispatchEvent(new CustomEvent('rc-theme-changed', { detail: { theme } }));
  },

  toggle() {
    const next = this.getResolvedTheme() === 'dark' ? 'light' : 'dark';
    this.setPreference(next);
    return next;
  },

  updateToggleButtons(theme) {
    const resolved = theme || this.getResolvedTheme();
    document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
      const label = resolved === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
      btn.setAttribute('aria-label', label);
      btn.setAttribute('title', label);
      btn.setAttribute('aria-pressed', resolved === 'light' ? 'true' : 'false');
    });
  },

  init() {
    this.apply();

    if (!window._rcThemeMediaBound) {
      window._rcThemeMediaBound = true;
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (!this.getPreference()) this.apply();
      });
    }

    document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
      if (btn.dataset.bound === 'true') return;
      btn.dataset.bound = 'true';
      btn.addEventListener('click', () => this.toggle());
    });

    this.updateToggleButtons();
  }
};
