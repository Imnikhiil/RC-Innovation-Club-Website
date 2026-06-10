window.RC_PROJECTS = {
  STATUSES: {
    completed: 'Completed',
    'in-progress': 'In Progress',
    planned: 'Planned'
  },

  CATEGORIES: ['Web', 'Robotics', 'AI', 'Mobile', 'IoT', 'Other'],

  escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },

  parseTech(tech) {
    if (!tech) return [];
    if (Array.isArray(tech)) return tech.filter(Boolean);
    return String(tech).split(',').map((t) => t.trim()).filter(Boolean);
  },

  getStatus(status) {
    return this.STATUSES[status] ? status : 'completed';
  },

  buildTechTags(tech) {
    const tags = this.parseTech(tech);
    if (!tags.length) return '';
    return `<div class="project-card__tech">${tags.map((t) =>
      `<span class="project-card__tag">${this.escapeHtml(t)}</span>`
    ).join('')}</div>`;
  },

  buildLinks(item) {
    const github = (item.githubUrl || '').trim();
    const demo = (item.demoUrl || '').trim();
    if (!github && !demo) return '';

    return `<div class="project-card__links">
      ${github ? `<a href="${this.escapeHtml(github)}" class="project-card__link" target="_blank" rel="noopener noreferrer"><i class="fab fa-github" aria-hidden="true"></i> Code</a>` : ''}
      ${demo ? `<a href="${this.escapeHtml(demo)}" class="project-card__link project-card__link--demo" target="_blank" rel="noopener noreferrer"><i class="fas fa-external-link-alt" aria-hidden="true"></i> Demo</a>` : ''}
    </div>`;
  },

  buildCardHtml(item, index) {
    const title = this.escapeHtml(item.title);
    const desc = this.escapeHtml(item.description);
    const status = this.getStatus(item.status);
    const statusLabel = this.escapeHtml(this.STATUSES[status]);
    const category = this.escapeHtml(item.category || 'Other');
    const image = (item.image || '').trim();
    const team = (item.team || '').trim();
    const delay = (index % 6) * 60;

    const media = image
      ? `<img src="${this.escapeHtml(image)}" alt="" class="project-card__image" loading="lazy" onerror="this.parentElement.classList.add('project-card__media--fallback');" />`
      : `<div class="project-card__placeholder" aria-hidden="true"><i class="fas fa-code"></i></div>`;

    return `
      <article class="project-card glass card-hover" data-project-status="${status}" data-aos="fade-up" data-aos-delay="${delay}">
        <div class="project-card__media">${media}</div>
        <div class="project-card__body">
          <div class="project-card__meta">
            <span class="project-card__status project-card__status--${status}">${statusLabel}</span>
            <span class="project-card__category">${category}</span>
          </div>
          <h3 class="project-card__title">${title}</h3>
          <p class="project-card__desc">${desc}</p>
          ${this.buildTechTags(item.tech)}
          ${team ? `<p class="project-card__team"><i class="fas fa-users" aria-hidden="true"></i> ${this.escapeHtml(team)}</p>` : ''}
          ${this.buildLinks(item)}
        </div>
      </article>
    `;
  },

  filterProjects(items, status = 'all') {
    if (!status || status === 'all') return items || [];
    return (items || []).filter((p) => this.getStatus(p.status) === status);
  },

  initFilters() {
    const wrap = document.getElementById('projects-filters');
    const grid = document.getElementById('cms-projects-grid');
    if (!wrap || !grid) return;

    const items = JSON.parse(grid.dataset.projects || '[]');
    let active = 'all';

    const render = () => {
      const filtered = this.filterProjects(items, active);
      grid.innerHTML = filtered.length
        ? filtered.map((p, i) => this.buildCardHtml(p, i)).join('')
        : '<p class="projects-empty">No projects in this category yet.</p>';
      if (window.RC_REVEAL) RC_REVEAL.refresh();
    };

    const statuses = [
      { id: 'all', label: 'All' },
      { id: 'completed', label: 'Completed' },
      { id: 'in-progress', label: 'In Progress' },
      { id: 'planned', label: 'Planned' }
    ];

    wrap.innerHTML = statuses.map((s) => `
      <button type="button" class="projects-filter-btn${active === s.id ? ' is-active' : ''}" data-project-filter="${s.id}">
        ${s.label}
      </button>
    `).join('');

    wrap.querySelectorAll('[data-project-filter]').forEach((btn) => {
      btn.addEventListener('click', () => {
        active = btn.dataset.projectFilter;
        wrap.querySelectorAll('[data-project-filter]').forEach((b) => {
          b.classList.toggle('is-active', b.dataset.projectFilter === active);
        });
        render();
      });
    });
  }
};
