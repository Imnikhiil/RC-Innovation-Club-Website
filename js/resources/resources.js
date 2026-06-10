window.RC_RESOURCES = {
  CATEGORIES: ['All', 'Tutorial', 'Workshop', 'Cheatsheet', 'Template', 'Slides', 'Guide', 'Other'],

  TYPES: {
    pdf: { label: 'PDF', icon: 'fas fa-file-pdf' },
    link: { label: 'Link', icon: 'fas fa-link' },
    video: { label: 'Video', icon: 'fas fa-play-circle' },
    slides: { label: 'Slides', icon: 'fas fa-file-powerpoint' },
    doc: { label: 'Document', icon: 'fas fa-file-alt' }
  },

  escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },

  getType(type) {
    return this.TYPES[type] ? type : 'link';
  },

  getTypeInfo(type) {
    return this.TYPES[this.getType(type)] || this.TYPES.link;
  },

  filterResources(items, { category = 'All', search = '' } = {}) {
    let list = items || [];
    if (category && category !== 'All') {
      list = list.filter((r) => (r.category || 'Other') === category);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((r) =>
        [r.title, r.description, r.category, r.tags]
          .some((v) => String(v || '').toLowerCase().includes(q))
      );
    }
    return list;
  },

  buildCardHtml(item, index) {
    const title = this.escapeHtml(item.title);
    const desc = this.escapeHtml(item.description);
    const category = this.escapeHtml(item.category || 'Other');
    const url = (item.url || '').trim();
    const type = this.getType(item.type);
    const typeInfo = this.getTypeInfo(type);
    const icon = (item.icon || '').trim() || typeInfo.icon;
    const btnLabel = type === 'pdf' || type === 'slides' || type === 'doc' ? 'Download' : 'Open';

    const tags = String(item.tags || '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    return `
      <article class="resource-card glass card-hover" data-resource-category="${this.escapeHtml(item.category || 'Other')}" data-aos="fade-up" data-aos-delay="${(index % 8) * 50}">
        <div class="resource-card__icon" aria-hidden="true"><i class="${this.escapeHtml(icon)}"></i></div>
        <div class="resource-card__body">
          <div class="resource-card__meta">
            <span class="resource-card__category">${category}</span>
            <span class="resource-card__type">${this.escapeHtml(typeInfo.label)}</span>
          </div>
          <h3 class="resource-card__title">${title}</h3>
          <p class="resource-card__desc">${desc}</p>
          ${tags.length ? `<div class="resource-card__tags">${tags.map((t) =>
            `<span class="resource-card__tag">${this.escapeHtml(t)}</span>`
          ).join('')}</div>` : ''}
          ${url ? `<a href="${this.escapeHtml(url)}" class="resource-card__btn" target="_blank" rel="noopener noreferrer">
            <i class="fas fa-arrow-down" aria-hidden="true"></i> ${btnLabel}
          </a>` : ''}
        </div>
      </article>
    `;
  },

  renderGrid(items) {
    const grid = document.getElementById('cms-resources-grid');
    const empty = document.getElementById('resources-empty');
    if (!grid) return;

    if (!items.length) {
      grid.innerHTML = '';
      if (empty) empty.hidden = false;
      return;
    }

    if (empty) empty.hidden = true;
    grid.innerHTML = items.map((r, i) => this.buildCardHtml(r, i)).join('');
    if (window.RC_REVEAL) RC_REVEAL.refresh();
  },

  initHub() {
    const grid = document.getElementById('cms-resources-grid');
    const searchInput = document.getElementById('resources-search');
    const filtersWrap = document.getElementById('resources-filters');
    if (!grid) return;

    const state = { category: 'All', search: '' };

    const getItems = () => JSON.parse(grid.dataset.resources || '[]');

    const apply = () => {
      const filtered = this.filterResources(getItems(), state);
      this.renderGrid(filtered);
    };

    if (filtersWrap) {
      const cats = [...new Set(['All', ...getItems().map((r) => r.category || 'Other').filter(Boolean)])];
      filtersWrap.innerHTML = cats.map((cat) => `
        <button type="button" class="resources-filter-btn${state.category === cat ? ' is-active' : ''}" data-resource-filter="${this.escapeHtml(cat)}">
          ${cat === 'All' ? 'All' : this.escapeHtml(cat)}
        </button>
      `).join('');

      filtersWrap.querySelectorAll('[data-resource-filter]').forEach((btn) => {
        btn.addEventListener('click', () => {
          state.category = btn.dataset.resourceFilter;
          filtersWrap.querySelectorAll('[data-resource-filter]').forEach((b) => {
            b.classList.toggle('is-active', b.dataset.resourceFilter === state.category);
          });
          apply();
        });
      });
    }

    if (searchInput && searchInput.dataset.bound !== 'true') {
      searchInput.dataset.bound = 'true';
      let timer;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          state.search = e.target.value;
          apply();
        }, 250);
      });
    }

    apply();
  }
};
