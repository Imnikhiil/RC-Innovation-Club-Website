window.RC_TEAM_PROFILES = {
  bound: false,

  escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },

  isValidLink(url) {
    if (!url || typeof url !== 'string') return false;
    const trimmed = url.trim();
    return trimmed.length > 0 && trimmed !== '#' && !/^YOUR_/i.test(trimmed);
  },

  buildSocialLinks(links) {
    if (!links) return '';

    const items = [
      { key: 'whatsapp', icon: 'fa-brands fa-whatsapp', label: 'WhatsApp', class: 'wa-c' },
      { key: 'linkedin', icon: 'fa-brands fa-linkedin', label: 'LinkedIn', class: 'li-c' },
      { key: 'instagram', icon: 'fa-brands fa-instagram', label: 'Instagram', class: 'ig-c' },
      { key: 'github', icon: 'fa-brands fa-github', label: 'GitHub', class: 'gh-c' },
      { key: 'email', icon: 'fa-solid fa-envelope', label: 'Email', class: 'em-c' },
      { key: 'portfolio', icon: 'fa-solid fa-globe', label: 'Portfolio', class: 'pf-c' }
    ];

    const boxes = items
      .filter((item) => this.isValidLink(links[item.key]))
      .map((item, i) => {
        const raw = links[item.key].trim();
        const href = item.key === 'email' ? `mailto:${raw}` : raw;
        return `
          <a href="${this.escapeHtml(href)}" target="_blank" rel="noopener noreferrer" class="team-profile__social ${item.class}" data-reveal-item style="--reveal-i: ${i}">
            <span class="team-profile__social-glow" aria-hidden="true"></span>
            <i class="${item.icon}" aria-hidden="true"></i>
            <span>${item.label}</span>
          </a>
        `;
      })
      .join('');

    if (!boxes) return '';
    return `
      <div class="team-profile-card__dock" data-reveal-item style="--reveal-i: 6">
        <p class="team-profile-card__dock-label">Connect</p>
        <div class="team-profile__connect">${boxes}</div>
      </div>
    `;
  },

  buildResponsibilities(items) {
    return items
      .map((item, i) => `
        <li class="team-profile-card__list-item" data-reveal-item style="--reveal-i: ${i + 2}">
          <span class="team-profile-card__check" aria-hidden="true"><i class="fa-solid fa-check"></i></span>
          <span>${this.escapeHtml(item)}</span>
        </li>
      `)
      .join('');
  },

  buildSkills(skills) {
    return skills
      .map((skill, i) => `
        <span class="team-profile-card__skill" data-reveal-item style="--reveal-i: ${i}">${this.escapeHtml(skill)}</span>
      `)
      .join('');
  },

  buildProfileCard(member) {
    const profile = member.profile;
    if (!profile) return '';

    const responsibilities = (profile.responsibilities || []).length
      ? this.buildResponsibilities(profile.responsibilities)
      : '';

    const skills = (profile.skills || []).length
      ? this.buildSkills(profile.skills)
      : '';

    return `
      <article class="team-profile-card">
        <div class="team-profile-card__frame" aria-hidden="true"></div>
        <div class="team-profile-card__aurora" aria-hidden="true">
          <span class="team-profile-card__orb team-profile-card__orb--1"></span>
          <span class="team-profile-card__orb team-profile-card__orb--2"></span>
          <span class="team-profile-card__orb team-profile-card__orb--3"></span>
        </div>
        <div class="team-profile-card__noise" aria-hidden="true"></div>

        <header class="team-profile-card__hero">
          <div class="team-profile-card__avatar-stage">
            <div class="team-profile-card__ring team-profile-card__ring--outer"></div>
            <div class="team-profile-card__ring team-profile-card__ring--inner"></div>
            <img src="${this.escapeHtml(member.img)}" alt="${this.escapeHtml(member.name)}" class="team-profile-card__avatar" loading="lazy" decoding="async">
          </div>

          <div class="team-profile-card__identity">
            <span class="team-profile-card__role-badge">${this.escapeHtml(member.role)}</span>
            <h2 class="team-profile-card__name">${this.escapeHtml(member.name)}</h2>
            <p class="team-profile-card__club">RC Innovation Club</p>
            ${profile.campus ? `<p class="team-profile-card__campus"><i class="fa-solid fa-location-dot" aria-hidden="true"></i> ${this.escapeHtml(profile.campus)}</p>` : ''}
          </div>

          <button type="button" class="team-profile-card__explore" aria-expanded="false">
            <span class="team-profile-card__explore-shine" aria-hidden="true"></span>
            <span class="team-profile-card__explore-text">Explore Profile</span>
            <span class="team-profile-card__explore-icon" aria-hidden="true">
              <i class="fa-solid fa-arrow-down"></i>
            </span>
          </button>
        </header>

        <div class="team-profile-card__body">
          <div class="team-profile-card__body-inner">
            ${profile.tagline ? `
              <blockquote class="team-profile-card__tagline" data-reveal-item style="--reveal-i: 0">
                <span class="team-profile-card__quote-mark" aria-hidden="true">"</span>
                ${this.escapeHtml(profile.tagline)}
              </blockquote>
            ` : ''}

            ${profile.introduction ? `
              <section class="team-profile-card__section" data-reveal-item style="--reveal-i: 1">
                <div class="team-profile-card__section-head">
                  <span class="team-profile-card__section-icon"><i class="fa-solid fa-fingerprint" aria-hidden="true"></i></span>
                  <h3>Introduction</h3>
                </div>
                <p class="team-profile-card__text">${this.escapeHtml(profile.introduction)}</p>
              </section>
            ` : ''}

            ${responsibilities ? `
              <section class="team-profile-card__section">
                <div class="team-profile-card__section-head" data-reveal-item style="--reveal-i: 1">
                  <span class="team-profile-card__section-icon"><i class="fa-solid fa-bullseye" aria-hidden="true"></i></span>
                  <h3>Responsibilities</h3>
                </div>
                <ul class="team-profile-card__list">${responsibilities}</ul>
              </section>
            ` : ''}

            ${skills ? `
              <section class="team-profile-card__section">
                <div class="team-profile-card__section-head" data-reveal-item style="--reveal-i: 1">
                  <span class="team-profile-card__section-icon"><i class="fa-solid fa-sparkles" aria-hidden="true"></i></span>
                  <h3>Skills</h3>
                </div>
                <div class="team-profile-card__skills">${skills}</div>
              </section>
            ` : ''}

            ${this.buildSocialLinks(profile.links)}
          </div>
        </div>
      </article>
    `;
  },

  findMemberBySlug(slug) {
    const team = window.SiteContent?.coreTeam || window.RC_CMS?.getContent()?.coreTeam || [];
    return team.find((m) => m.profile && this.slugify(m.name) === slug);
  },

  slugify(name) {
    return String(name || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  },

  staggerReveal(card) {
    const items = card.querySelectorAll('[data-reveal-item]');
    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    items.forEach((el, i) => {
      const delay = isMobile ? 40 + i * 35 : 120 + i * 65;
      setTimeout(() => el.classList.add('is-revealed'), delay);
    });
  },

  setExploreLabel(card, expanded) {
    const label = card?.querySelector('.team-profile-card__explore-text');
    if (label) label.textContent = expanded ? 'Show Less' : 'Explore Profile';
  },

  expand(card) {
    if (!card || card.classList.contains('is-expanded')) return;
    const btn = card.querySelector('.team-profile-card__explore');
    card.classList.add('is-expanded');
    if (btn) btn.setAttribute('aria-expanded', 'true');
    this.setExploreLabel(card, true);
    this.staggerReveal(card);
  },

  collapse(card) {
    if (!card) return;
    const btn = card.querySelector('.team-profile-card__explore');
    card.classList.remove('is-expanded');
    if (btn) btn.setAttribute('aria-expanded', 'false');
    this.setExploreLabel(card, false);
    card.querySelectorAll('[data-reveal-item]').forEach((el) => el.classList.remove('is-revealed'));
  },

  bindCard(card) {
    if (!card || card.dataset.profileBound === 'true') return;
    card.dataset.profileBound = 'true';

    const exploreBtn = card.querySelector('.team-profile-card__explore');
    exploreBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (card.classList.contains('is-expanded')) {
        this.collapse(card);
      } else {
        this.expand(card);
      }
    });
  },

  unbindCard(card) {
    if (!card) return;
    delete card.dataset.profileBound;
  },

  open(member) {
    const modal = document.getElementById('team-profile-modal');
    const mount = document.getElementById('team-profile-mount');
    const wrap = modal?.querySelector('.team-profile-modal__wrap');
    if (!modal || !mount || !member?.profile) return;

    if (wrap) {
      wrap.scrollTop = 0;
      wrap.scrollLeft = 0;
      wrap.style.overflow = '';
    }

    mount.innerHTML = this.buildProfileCard(member);
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('profile-modal-open');

    const card = mount.querySelector('.team-profile-card');
    if (card) {
      this.bindCard(card);
      requestAnimationFrame(() => {
        if (document.activeElement?.closest('.team-card--has-profile')) {
          document.activeElement.blur();
        }
        modal.classList.add('is-animating');
        card.classList.add('is-entering');
      });
    }
  },

  close() {
    const modal = document.getElementById('team-profile-modal');
    const mount = document.getElementById('team-profile-mount');
    const wrap = modal?.querySelector('.team-profile-modal__wrap');
    if (!modal) return;

    const card = mount?.querySelector('.team-profile-card');
    if (card) {
      this.collapse(card);
      this.unbindCard(card);
      card.classList.remove('is-entering');
    }

    if (wrap) {
      wrap.scrollTop = 0;
      wrap.scrollLeft = 0;
      wrap.style.overflow = 'hidden';
    }

    modal.classList.remove('is-animating');
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('profile-modal-open');

    if (document.activeElement?.closest('#team-profile-modal')) {
      document.activeElement.blur();
    }

    if (mount) {
      mount.innerHTML = '';
    }
  },

  onTeamCardClick(e) {
    const card = e.target.closest('.team-card--has-profile');
    if (!card) return;
    e.preventDefault();
    const slug = card.dataset.profileSlug;
    const member = RC_TEAM_PROFILES.findMemberBySlug(slug);
    if (member) RC_TEAM_PROFILES.open(member);
  },

  onModalKeydown(e) {
    const modal = document.getElementById('team-profile-modal');
    if (!modal?.classList.contains('is-open')) return;
    if (e.key === 'Escape') RC_TEAM_PROFILES.close();
  },

  init() {
    if (this.bound) return;
    this.bound = true;

    document.addEventListener('click', this.onTeamCardClick);
    document.addEventListener('keydown', this.onModalKeydown);

    document.getElementById('team-profile-modal')?.addEventListener('click', (e) => {
      if (e.target.closest('[data-profile-close]')) RC_TEAM_PROFILES.close();
    });

    document.addEventListener('keydown', (e) => {
      const card = e.target.closest('.team-card--has-profile');
      if (!card || (e.key !== 'Enter' && e.key !== ' ')) return;
      e.preventDefault();
      card.click();
    });
  }
};
