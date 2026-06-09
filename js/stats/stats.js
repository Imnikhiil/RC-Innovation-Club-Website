window.RC_STATS = {
  ACCENTS: ['sky', 'indigo', 'emerald', 'amber', 'rose', 'violet'],

  DEFAULT_ICONS: {
    'events hosted': 'fas fa-calendar-check',
    'core members': 'fas fa-users',
    'years active': 'fas fa-clock',
    'students reached': 'fas fa-graduation-cap',
    members: 'fas fa-user-group',
    workshops: 'fas fa-laptop-code',
    projects: 'fas fa-lightbulb',
    partners: 'fas fa-handshake'
  },

  escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },

  getIcon(stat) {
    if (stat.icon?.trim()) return stat.icon.trim();
    const key = String(stat.label || '').toLowerCase();
    return this.DEFAULT_ICONS[key] || 'fas fa-chart-line';
  },

  getAccent(stat, index) {
    const accent = stat.accent?.trim();
    if (accent && this.ACCENTS.includes(accent)) return accent;
    return this.ACCENTS[index % this.ACCENTS.length];
  },

  buildCardHtml(stat, index) {
    const icon = this.escapeHtml(this.getIcon(stat));
    const accent = this.getAccent(stat, index);
    const prefix = this.escapeHtml(stat.prefix || '');
    const suffix = this.escapeHtml(stat.suffix || '');
    const label = this.escapeHtml(stat.label);
    const desc = stat.description?.trim();

    return `
      <div class="stat-card glass card-hover stat-card--${accent} animate-pop" style="animation-delay: ${index * 0.1}s">
        <div class="stat-card__icon" aria-hidden="true"><i class="${icon}"></i></div>
        <div class="stat-number" data-count="${parseInt(stat.value, 10) || 0}" data-prefix="${prefix}" data-suffix="${suffix}">0</div>
        <div class="stat-label">${label}</div>
        ${desc ? `<p class="stat-card__desc">${this.escapeHtml(desc)}</p>` : ''}
      </div>
    `;
  }
};
