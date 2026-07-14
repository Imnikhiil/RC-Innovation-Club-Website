window.RC_TEAM_HIERARCHY = {
  GROUPS: {
    all: { label: 'All Team', sections: ['core', 'ambassadors', 'members'] },
    leadership: { label: 'Leadership', sections: ['core'], coreFilter: 'leadership' },
    core: { label: 'Core Team', sections: ['core'], coreFilter: 'all' },
    ambassadors: { label: 'Ambassadors', sections: ['ambassadors'] },
    members: { label: 'Members', sections: ['members'], membersPanel: 'current' },
    alumni: { label: 'Alumni', sections: ['members'], membersPanel: 'alumni' }
  },

  DEPARTMENTS: {
    all: 'All Roles',
    leadership: 'Leadership',
    events: 'Events',
    media: 'Media',
    technical: 'Technical',
    finance: 'Finance',
    operations: 'Operations'
  },

  escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },

  inferDepartment(member) {
    if (member.department && this.DEPARTMENTS[member.department]) {
      return member.department;
    }
    const role = String(member.role || '').toLowerCase();
    if (member.lead || /ambassador|secretary|president|leadership/.test(role)) return 'leadership';
    if (/event/.test(role)) return 'events';
    if (/media|poster|photo|video|content|social|design|editor/.test(role)) return 'media';
    if (/tech|developer|coding|support/.test(role)) return 'technical';
    if (/finance/.test(role)) return 'finance';
    return 'operations';
  },

  isLeadershipMember(member) {
    return member.lead === true || this.inferDepartment(member) === 'leadership';
  },

  buildCoreCard(member, index) {
    const initials = member.name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
    const accent = member.accent === 'violet' ? 'violet' : 'sky';
    const leadClass = member.lead ? ' team-card--lead' : '';
    const profileClass = member.profile ? ' team-card--has-profile' : '';
    const profileSlug = member.profile && window.RC_TEAM_PROFILES
      ? RC_TEAM_PROFILES.slugify(member.name)
      : '';
    const profileAttrs = member.profile
      ? ` data-profile-slug="${this.escapeHtml(profileSlug)}" role="button" tabindex="0" aria-label="View ${this.escapeHtml(member.name)} profile"`
      : '';
    const badge = member.lead ? '<span class="team-card__badge">Lead</span>' : '';
    const viewHint = member.profile ? '<span class="team-card__view-hint"><i class="fa-solid fa-user" aria-hidden="true"></i> View Profile</span>' : '';
    const dept = this.inferDepartment(member);

    return `
      <article class="team-card team-card--${accent}${leadClass}${profileClass}" data-reveal data-team-dept="${dept}" style="transition-delay: ${(index % 4) * 90}ms"${profileAttrs}>
        <div class="team-card__inner glass">
          ${badge}
          <div class="team-card__photo-wrap">
            <div class="team-card__blob" aria-hidden="true"></div>
            <img src="${this.escapeHtml(member.img)}" alt="${this.escapeHtml(member.name)}" class="team-card__photo" loading="lazy" decoding="async">
            <div class="team-card__shine" aria-hidden="true"></div>
            <div class="team-card__fallback" aria-hidden="true">${initials}</div>
          </div>
          <h4 class="team-card__name">${this.escapeHtml(member.name)}</h4>
          <span class="team-card__role">${this.escapeHtml(member.role)}</span>
          ${viewHint}
        </div>
      </article>
    `;
  },

  filterCoreTeam(team, { group = 'all', department = 'all' } = {}) {
    let list = team || [];

    if (group === 'leadership') {
      list = list.filter((m) => this.isLeadershipMember(m));
    }

    if (department && department !== 'all') {
      list = list.filter((m) => this.inferDepartment(m) === department);
    }

    return list;
  },

  setSectionVisible(id, visible) {
    const el = document.getElementById(id);
    if (!el) return;
    el.hidden = !visible;
    el.classList.toggle('team-section--hidden', !visible);
  },

  apply(state) {
    const group = this.GROUPS[state.group] || this.GROUPS.all;
    const team = JSON.parse(document.getElementById('team-grid')?.dataset.team || '[]');

    this.setSectionVisible('core', group.sections.includes('core'));
    this.setSectionVisible('ambassadors', group.sections.includes('ambassadors'));
    this.setSectionVisible('members', group.sections.includes('members'));

    const currentPanel = document.getElementById('cms-members-current')?.closest('.members-panel');
    const previousPanel = document.getElementById('cms-members-previous')?.closest('.members-panel');

    if (group.sections.includes('members')) {
      if (group.membersPanel === 'current') {
        if (currentPanel) currentPanel.style.display = '';
        if (previousPanel) previousPanel.style.display = 'none';
      } else if (group.membersPanel === 'alumni') {
        if (currentPanel) currentPanel.style.display = 'none';
        if (previousPanel) previousPanel.style.display = '';
      } else {
        if (currentPanel) currentPanel.style.display = '';
        if (previousPanel) previousPanel.style.display = '';
      }
    }

    const grid = document.getElementById('team-grid');
    const deptWrap = document.getElementById('team-dept-filters');
    const showDept = group.sections.includes('core') && state.group !== 'leadership';

    if (deptWrap) {
      deptWrap.classList.toggle('team-dept-filters--hidden', !showDept);
    }

    if (grid && group.sections.includes('core')) {
      const coreGroup = state.group === 'leadership' ? 'leadership' : 'all';
      const filtered = this.filterCoreTeam(team, {
        group: coreGroup,
        department: showDept ? state.department : 'all'
      });

      grid.innerHTML = filtered.length
        ? filtered.map((m, i) => this.buildCoreCard(m, i)).join('')
        : '<p class="team-empty-msg">No team members match this filter.</p>';

      if (typeof window.initTeamCards === 'function') {
        window.initTeamCards();
      }
    }

    const target = state.group === 'ambassadors' ? 'ambassadors'
      : state.group === 'members' || state.group === 'alumni' ? 'members'
      : 'core';
    const targetEl = document.getElementById(target);
    if (targetEl && state.group !== 'all') {
      if (window.RC_REVEAL) RC_REVEAL.revealIn(targetEl, { instant: true });
      targetEl.scrollIntoView({ behavior: 'auto', block: 'start' });
    }
  },

  init() {
    const groupWrap = document.getElementById('team-hierarchy-filters');
    const deptWrap = document.getElementById('team-dept-filters');
    const grid = document.getElementById('team-grid');
    if (!groupWrap || !grid) return;

    const cfg = window.RC_CMS?.getContent()?.teamHierarchySection || {};
    if (cfg.enabled === false) {
      document.getElementById('team-hierarchy-wrap')?.remove();
      return;
    }

    const state = { group: 'all', department: 'all' };

    groupWrap.innerHTML = Object.entries(this.GROUPS).map(([id, g]) => `
      <button type="button" class="team-hierarchy-btn${state.group === id ? ' is-active' : ''}" data-team-group="${id}">
        ${this.escapeHtml(g.label)}
      </button>
    `).join('');

    if (deptWrap) {
      deptWrap.innerHTML = Object.entries(this.DEPARTMENTS).map(([id, label]) => `
        <button type="button" class="team-dept-btn${state.department === id ? ' is-active' : ''}" data-team-dept="${id}">
          ${this.escapeHtml(label)}
        </button>
      `).join('');
    }

    const onChange = () => this.apply(state);

    if (groupWrap.dataset.bound !== 'true') {
      groupWrap.dataset.bound = 'true';
      groupWrap.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-team-group]');
        if (!btn) return;
        state.group = btn.dataset.teamGroup;
        if (state.group === 'leadership') state.department = 'all';
        groupWrap.querySelectorAll('[data-team-group]').forEach((b) => {
          b.classList.toggle('is-active', b.dataset.teamGroup === state.group);
        });
        if (state.group === 'leadership' && deptWrap) {
          deptWrap.classList.add('team-dept-filters--hidden');
        }
        onChange();
      });
    }

    if (deptWrap && deptWrap.dataset.bound !== 'true') {
      deptWrap.dataset.bound = 'true';
      deptWrap.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-team-dept]');
        if (!btn) return;
        state.department = btn.dataset.teamDept;
        deptWrap.querySelectorAll('[data-team-dept]').forEach((b) => {
          b.classList.toggle('is-active', b.dataset.teamDept === state.department);
        });
        onChange();
      });
    }

    onChange();
  }
};
