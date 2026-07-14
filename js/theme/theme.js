const THEME_STORAGE_KEY = 'rc_theme_preference';
const COLOR_STORAGE_KEY = 'rc_color_preference';
const VALID_COLORS = ['ocean', 'sunset', 'emerald', 'royal', 'coral'];

const COLOR_META = {
  ocean: { label: 'Ocean', themeColor: { dark: '#020617', light: '#f8fafc' } },
  sunset: { label: 'Sunset', themeColor: { dark: '#1a0a04', light: '#fff7ed' } },
  emerald: { label: 'Emerald', themeColor: { dark: '#021a14', light: '#f0fdf4' } },
  royal: { label: 'Royal', themeColor: { dark: '#0f0a2e', light: '#f5f3ff' } },
  coral: { label: 'Coral', themeColor: { dark: '#1a0610', light: '#fff1f2' } }
};

window.RC_THEME = {
  getPreference() {
    try {
      // One-time brand lock: Dark Ocean for readable permanent look
      if (!localStorage.getItem('rc_theme_brand_v1')) {
        localStorage.setItem('rc_theme_brand_v1', '1');
        localStorage.setItem(THEME_STORAGE_KEY, 'dark');
        localStorage.setItem(COLOR_STORAGE_KEY, 'ocean');
      }
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {
      /* ignore */
    }
    return null;
  },

  getColorPreference() {
    try {
      if (!localStorage.getItem('rc_theme_brand_v1')) {
        localStorage.setItem('rc_theme_brand_v1', '1');
        localStorage.setItem(THEME_STORAGE_KEY, 'dark');
        localStorage.setItem(COLOR_STORAGE_KEY, 'ocean');
      }
      const saved = localStorage.getItem(COLOR_STORAGE_KEY);
      if (VALID_COLORS.includes(saved)) return saved;
    } catch {
      /* ignore */
    }
    return 'ocean';
  },

  getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  },

  getResolvedTheme() {
    return this.getPreference() || 'dark';
  },

  getResolvedColor() {
    return this.getColorPreference();
  },

  updateMetaThemeColor(theme, color) {
    const resolvedTheme = theme || this.getResolvedTheme();
    const resolvedColor = color || this.getResolvedColor();
    const meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) return;
    const palette = COLOR_META[resolvedColor] || COLOR_META.ocean;
    meta.setAttribute('content', palette.themeColor[resolvedTheme] || palette.themeColor.dark);
  },

  applyColor(color) {
    const resolved = VALID_COLORS.includes(color) ? color : 'ocean';
    document.documentElement.setAttribute('data-color', resolved);
    this.updateColorPicker(resolved);
    this.updateMetaThemeColor(this.getResolvedTheme(), resolved);
    return resolved;
  },

  apply(theme) {
    const resolved = theme === 'dark' || theme === 'light' ? theme : this.getResolvedTheme();
    document.documentElement.setAttribute('data-theme', resolved);
    this.applyColor(this.getResolvedColor());
    this.updateToggleButtons(resolved);
    this.updateMetaThemeColor(resolved, this.getResolvedColor());
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
    window.dispatchEvent(new CustomEvent('rc-theme-changed', { detail: { theme, color: this.getResolvedColor() } }));
  },

  setColorPreference(color) {
    if (!VALID_COLORS.includes(color)) return;
    try {
      localStorage.setItem(COLOR_STORAGE_KEY, color);
    } catch {
      /* ignore */
    }
    this.applyColor(color);
    window.dispatchEvent(new CustomEvent('rc-theme-changed', { detail: { theme: this.getResolvedTheme(), color } }));
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

  updateColorPicker(color) {
    const resolved = VALID_COLORS.includes(color) ? color : 'ocean';
    document.querySelectorAll('[data-color-pick]').forEach((btn) => {
      const active = btn.getAttribute('data-color-pick') === resolved;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });
  },

  closeColorPicker() {
    document.querySelectorAll('[data-theme-picker]').forEach((picker) => {
      const panel = picker.querySelector('[data-theme-picker-panel]');
      const trigger = picker.querySelector('[data-theme-picker-trigger]');
      if (panel) panel.hidden = true;
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
      picker.classList.remove('is-open');
    });
  },

  toggleColorPicker(trigger) {
    const picker = trigger.closest('[data-theme-picker]');
    if (!picker) return;
    const panel = picker.querySelector('[data-theme-picker-panel]');
    if (!panel) return;
    const willOpen = panel.hidden;
    this.closeColorPicker();
    if (willOpen) {
      panel.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      picker.classList.add('is-open');
    }
  },

  initColorPicker() {
    document.querySelectorAll('[data-color-pick]').forEach((btn) => {
      if (btn.dataset.bound === 'true') return;
      btn.dataset.bound = 'true';
      btn.addEventListener('click', () => {
        this.setColorPreference(btn.getAttribute('data-color-pick'));
        this.closeColorPicker();
      });
    });

    document.querySelectorAll('[data-theme-picker-trigger]').forEach((trigger) => {
      if (trigger.dataset.bound === 'true') return;
      trigger.dataset.bound = 'true';
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleColorPicker(trigger);
      });
    });

    document.querySelectorAll('[data-theme-picker-panel]').forEach((panel) => {
      panel.addEventListener('click', (e) => e.stopPropagation());
    });

    if (!window._rcColorPickerDocBound) {
      window._rcColorPickerDocBound = true;
      document.addEventListener('click', () => this.closeColorPicker());
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') this.closeColorPicker();
      });
    }

    this.updateColorPicker(this.getResolvedColor());
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

    this.initColorPicker();
    this.updateToggleButtons();
  }
};
