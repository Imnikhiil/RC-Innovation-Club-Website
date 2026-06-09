window.RC_PARTNERS = {
  TYPES: {
    sponsor: 'Sponsor',
    partner: 'Partner',
    collaborator: 'Collaborator'
  },

  escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },

  getTypeLabel(type) {
    return this.TYPES[type] || this.TYPES.partner;
  },

  buildCardHtml(item, index) {
    const name = this.escapeHtml(item.name);
    const type = item.type && this.TYPES[item.type] ? item.type : 'partner';
    const typeLabel = this.escapeHtml(this.getTypeLabel(type));
    const logo = (item.logo || '').trim();
    const url = (item.url || '').trim();
    const desc = (item.description || '').trim();

    const logoInner = logo
      ? `<img src="${this.escapeHtml(logo)}" alt="${name}" class="partner-card__logo" loading="lazy" onerror="this.style.display='none';this.nextElementSibling?.classList.remove('is-hidden');" />
         <span class="partner-card__fallback is-hidden">${name.charAt(0)}</span>`
      : `<span class="partner-card__fallback">${name.charAt(0)}</span>`;

    const inner = `
      <div class="partner-card__logo-wrap">${logoInner}</div>
      <p class="partner-card__name">${name}</p>
      ${desc ? `<p class="partner-card__desc">${this.escapeHtml(desc)}</p>` : ''}
      <span class="partner-card__badge partner-card__badge--${type}">${typeLabel}</span>
    `;

    if (url) {
      return `
        <a href="${this.escapeHtml(url)}" class="partner-card glass card-hover" target="_blank" rel="noopener noreferrer" data-aos="fade-up" data-aos-delay="${(index % 6) * 60}">
          ${inner}
        </a>
      `;
    }

    return `
      <article class="partner-card glass card-hover partner-card--static" data-aos="fade-up" data-aos-delay="${(index % 6) * 60}">
        ${inner}
      </article>
    `;
  },

  groupByType(items) {
    const order = ['sponsor', 'partner', 'collaborator'];
    const groups = { sponsor: [], partner: [], collaborator: [] };
    (items || []).forEach((item) => {
      const type = item.type && groups[item.type] ? item.type : 'partner';
      groups[type].push(item);
    });
    return order
      .filter((type) => groups[type].length)
      .map((type) => ({ type, label: this.getTypeLabel(type), items: groups[type] }));
  }
};
