function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getInitials(name) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
}

window.renderSite = function renderSite(content) {
  const c = content || window.RC_CMS.getContent();
  window.SiteContent = c;

  renderHero(c.hero);
  renderStats(c.statsSection, c.stats);
  renderAbout(c.about);
  renderEventsSection(c.eventsSection, c.events);
  renderFacultySection(c.facultySection, c.faculty);
  renderCoreSection(c.coreSection);
  renderTeamHierarchySection(c.teamHierarchySection);
  renderCoreTeam(c.coreTeam);
  renderAmbassadorsSection(c.ambassadorsSection, c.ambassadors);
  renderMembersSection(c.membersSection, c.membersCurrent, c.membersPrevious);
  renderLegacySection(c.legacySection, c.legacy);
  renderTestimonialsSection(c.testimonialsSection, c.testimonials);
  renderPartnersSection(c.partnersSection, c.partners);
  renderProjectsSection(c.projectsSection, c.projects);
  renderResourcesSection(c.resourcesSection, c.resources);
  renderGallerySection(c.gallerySection, c.gallery);
  renderCertificatesSection(c.certificatesSection);
  renderContactSection(c.contactSection, c.social);
  renderAnnouncementBar(c.announcementBar);
  renderNewsletterSection(c.newsletterSection);
  renderJoin(c.join, c.social, c.registration);
  renderFooter(c.footer, c.social);
};

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function setHtml(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

function setBtnLabel(id, text) {
  const el = document.getElementById(id);
  if (!el) return;
  const label = el.querySelector('span');
  if (label) label.textContent = text;
  else el.textContent = text;
}

function renderHero(hero) {
  setText('cms-hero-badge', hero.badge);
  setHtml('cms-hero-title', `${escapeHtml(hero.title)}<br><span class="dash-hero__highlight text-gradient text-gradient-animated">${escapeHtml(hero.titleHighlight)}</span>`);
  setText('cms-hero-desc', hero.description);
  setBtnLabel('cms-hero-btn1', hero.btnPrimary);
  setText('cms-hero-btn2', hero.btnSecondary);
  const btn1 = document.getElementById('cms-hero-btn1');
  const btn2 = document.getElementById('cms-hero-btn2');
  if (btn1 && (!btn1.getAttribute('href') || btn1.getAttribute('href').startsWith('#'))) {
    btn1.setAttribute('href', hero.btnPrimaryHref || 'events.html');
  }
  if (btn2 && (!btn2.getAttribute('href') || btn2.getAttribute('href').startsWith('#'))) {
    btn2.setAttribute('href', hero.btnSecondaryHref || 'about.html');
  }
}

function renderStats(section, stats) {
  const wrap = document.getElementById('stats');
  const header = document.getElementById('stats-header');
  const grid = document.getElementById('cms-stats-grid');
  if (!grid) return;

  const cfg = section || {};
  const items = stats || [];
  const showSection = cfg.enabled !== false && items.length > 0;

  if (wrap) wrap.hidden = !showSection;
  if (!showSection) {
    grid.innerHTML = '';
    return;
  }

  if (header) {
    const hasHeader = cfg.eyebrow || cfg.title || cfg.subtitle;
    header.hidden = !hasHeader;
    setText('cms-stats-eyebrow', cfg.eyebrow);
    setText('cms-stats-title', cfg.title);
    setText('cms-stats-subtitle', cfg.subtitle);
  }

  if (window.RC_STATS) {
    grid.innerHTML = items.map((s, i) => RC_STATS.buildCardHtml(s, i)).join('');
  } else {
    grid.innerHTML = items.map((s, i) => `
      <div class="stat-card glass animate-pop" style="animation-delay: ${i * 0.1}s">
        <div class="stat-number" data-count="${s.value}" data-suffix="${escapeHtml(s.suffix || '')}">0</div>
        <div class="stat-label">${escapeHtml(s.label)}</div>
      </div>
    `).join('');
  }
}

function renderAbout(about) {
  setText('cms-about-eyebrow', about.eyebrow);
  const aboutName = about.title.replace(/^About\s+/i, '') || about.title;
  setHtml('cms-about-title', `About <span class="dash-hero__highlight text-gradient">${escapeHtml(aboutName)}</span>`);
  setText('cms-about-subtitle', about.subtitle);
  setText('cms-about-mission', about.mission);
  setText('cms-about-vision', about.vision);
  setText('cms-about-culture', about.culture);
}

function renderEventsSection(section, events) {
  setText('cms-events-eyebrow', section.eyebrow);
  setText('cms-events-title', section.title);
  setText('cms-events-subtitle', section.subtitle);
  setText('cms-upcoming-title', section.upcomingTitle || 'Upcoming Events');
  setText('cms-past-title', section.pastTitle || 'Past Events');

  if (!window.RC_EVENTS) return;

  const upcoming = RC_EVENTS.getUpcoming(events);
  const past = RC_EVENTS.getPast(events);

  const upcomingWrap = document.getElementById('cms-upcoming-events-wrap');
  const upcomingGrid = document.getElementById('cms-upcoming-events');
  if (upcomingWrap && upcomingGrid) {
    if (upcoming.length) {
      upcomingWrap.style.display = '';
      upcomingGrid.innerHTML = upcoming.map((e) => RC_EVENTS.buildUpcomingCard(e)).join('');
    } else {
      upcomingWrap.style.display = 'none';
      upcomingGrid.innerHTML = '';
    }
  }

  const pastTitle = document.getElementById('cms-past-title');
  const eventsWrapper = document.querySelector('#events .events-wrapper');
  const eventsProgress = document.querySelector('#events .events-progress');
  const eventsHint = document.querySelector('#events .events-hint');

  if (pastTitle) pastTitle.style.display = past.length ? '' : 'none';
  if (eventsWrapper) eventsWrapper.style.display = past.length ? '' : 'none';
  if (eventsProgress) eventsProgress.style.display = past.length ? '' : 'none';
  if (eventsHint) eventsHint.style.display = past.length ? '' : 'none';

  const scroll = document.getElementById('cms-events-scroll');
  if (!scroll) return;
  scroll.innerHTML = past.map((e) => RC_EVENTS.buildPastCard(e)).join('');
}

function renderFacultySection(section, faculty) {
  const cfg = section || {};
  setText('cms-faculty-eyebrow', cfg.eyebrow);
  setText('cms-faculty-title', cfg.title);
  setText('cms-faculty-subtitle', cfg.subtitle);

  const timeline = document.getElementById('cms-faculty-timeline');
  const sectionEl = document.getElementById('faculty');
  const items = faculty || [];
  if (sectionEl) sectionEl.hidden = items.length === 0;
  if (!timeline) return;

  timeline.innerHTML = items.map((member, i) => {
    const initials = getInitials(member.name);
    const isCurrent = /present/i.test(member.period || '');
    const photo = member.image
      ? `<img src="${escapeHtml(member.image)}" alt="${escapeHtml(member.name)}" class="faculty-card__photo" loading="lazy" decoding="async">`
      : '';

    return `
      <article class="faculty-timeline-item${isCurrent ? ' faculty-timeline-item--current' : ''}" data-aos="fade-up" data-aos-delay="${i * 100}">
        <div class="faculty-timeline-marker" aria-hidden="true">
          <span class="faculty-timeline-period">${escapeHtml(member.period)}</span>
          <span class="faculty-timeline-dot"></span>
        </div>
        <div class="faculty-card glass card-hover">
          <div class="faculty-card__photo-wrap">
            ${photo}
            <div class="faculty-card__fallback" aria-hidden="true">${initials}</div>
          </div>
          <div class="faculty-card__body">
            ${isCurrent ? '<span class="faculty-card__badge">Current</span>' : ''}
            <h3 class="faculty-card__name">${escapeHtml(member.name)}</h3>
            <p class="faculty-card__designation">${escapeHtml(member.designation)}</p>
            <p class="faculty-card__role">${escapeHtml(member.role)}</p>
            <p class="faculty-card__desc">${escapeHtml(member.description)}</p>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function renderCoreSection(section) {
  setText('cms-core-eyebrow', section.eyebrow);
  setText('cms-core-title', section.title);
  setText('cms-core-subtitle', section.subtitle);
}

function renderTeamHierarchySection(section) {
  const wrap = document.getElementById('team-hierarchy-wrap');
  const hint = document.getElementById('cms-team-hierarchy-hint');
  const cfg = section || {};
  if (wrap) wrap.hidden = cfg.enabled === false;
  if (hint && cfg.hint) hint.textContent = cfg.hint;
}

function renderCoreTeam(team) {
  const grid = document.getElementById('team-grid');
  if (!grid) return;
  grid.dataset.team = JSON.stringify(team || []);
  grid.innerHTML = team.map((member, index) => {
    const initials = getInitials(member.name);
    const accent = member.accent === 'violet' ? 'violet' : 'sky';
    const leadClass = member.lead ? ' team-card--lead' : '';
    const profileClass = member.profile ? ' team-card--has-profile' : '';
    const profileSlug = member.profile && window.RC_TEAM_PROFILES
      ? RC_TEAM_PROFILES.slugify(member.name)
      : '';
    const profileAttrs = member.profile
      ? ` data-profile-slug="${escapeHtml(profileSlug)}" role="button" tabindex="0" aria-label="View ${escapeHtml(member.name)} profile"`
      : '';
    const badge = member.lead ? '<span class="team-card__badge">Lead</span>' : '';
    const viewHint = member.profile ? '<span class="team-card__view-hint"><i class="fa-solid fa-user" aria-hidden="true"></i> View Profile</span>' : '';
    return `
      <article class="team-card team-card--${accent}${leadClass}${profileClass}" data-reveal style="transition-delay: ${(index % 4) * 90}ms"${profileAttrs}>
        <div class="team-card__inner glass">
          ${badge}
          <div class="team-card__photo-wrap">
            <div class="team-card__blob" aria-hidden="true"></div>
            <img src="${escapeHtml(member.img)}" alt="${escapeHtml(member.name)}" class="team-card__photo" loading="lazy" decoding="async">
            <div class="team-card__shine" aria-hidden="true"></div>
            <div class="team-card__fallback" aria-hidden="true">${initials}</div>
          </div>
          <h4 class="team-card__name">${escapeHtml(member.name)}</h4>
          <span class="team-card__role">${escapeHtml(member.role)}</span>
          ${viewHint}
        </div>
      </article>
    `;
  }).join('');
}

function renderAmbassadorsSection(section, ambassadors) {
  setText('cms-ambassadors-eyebrow', section.eyebrow);
  setText('cms-ambassadors-title', section.title);
  setText('cms-ambassadors-subtitle', section.subtitle);
  const grid = document.getElementById('cms-ambassadors-grid');
  if (!grid) return;
  grid.innerHTML = ambassadors.map((a, i) => `
    <div class="ambassador-card glass card-hover" data-aos="${i % 2 === 0 ? 'fade-right' : 'fade-left'}">
      <img src="${escapeHtml(a.image)}" class="rounded-full border-4 border-sky-500/30 object-cover" alt="${escapeHtml(a.name)}">
      <div>
        <h4 class="font-black italic">${escapeHtml(a.label)}</h4>
        <p class="text-sky-400 font-bold mt-1">${escapeHtml(a.name)}</p>
        <p class="text-slate-500 font-semibold mt-1 text-sm">${escapeHtml(a.period)}</p>
        <p class="text-slate-400 mt-2 text-sm leading-relaxed">${escapeHtml(a.description)}</p>
      </div>
    </div>
  `).join('');
}

function buildMemberChip(member, index) {
  const accent = index % 2 === 0 ? 'sky' : 'violet';
  return `
    <div class="member-chip member-chip--${accent}" data-member-reveal style="--chip-i: ${index}">
      <div class="member-chip__inner">
        <span class="member-chip__ring" aria-hidden="true"></span>
        <span class="member-chip__avatar" aria-hidden="true">${getInitials(member.name)}</span>
        <span class="member-chip__name">${escapeHtml(member.name)}</span>
      </div>
    </div>
  `;
}

function buildAlumniCard(member, index) {
  return `
    <article class="alumni-card" data-member-reveal style="--chip-i: ${index}">
      <div class="alumni-card__shine" aria-hidden="true"></div>
      <span class="alumni-card__avatar" aria-hidden="true">${getInitials(member.name)}</span>
      <div class="alumni-card__body">
        <h4 class="alumni-card__name">${escapeHtml(member.name)}</h4>
        ${member.role ? `<span class="alumni-card__role">${escapeHtml(member.role)}</span>` : ''}
      </div>
      <span class="alumni-card__badge" aria-hidden="true"><i class="fas fa-star"></i></span>
    </article>
  `;
}

function renderMembersSection(section, current, previous) {
  setText('cms-members-eyebrow', section.eyebrow);
  setText('cms-members-title', section.title);
  setText('cms-members-subtitle', section.subtitle);
  setText('cms-members-current-title', section.currentTitle);
  setText('cms-members-previous-title', section.previousTitle);

  const currentList = document.getElementById('cms-members-current');
  const previousList = document.getElementById('cms-members-previous');
  const currentMeta = document.getElementById('cms-members-current-meta');
  const previousMeta = document.getElementById('cms-members-previous-meta');

  const currentItems = current || [];
  const previousItems = previous || [];

  if (currentMeta) {
    currentMeta.textContent = currentItems.length
      ? `${currentItems.length} active member${currentItems.length === 1 ? '' : 's'}`
      : '';
  }
  if (previousMeta) {
    previousMeta.textContent = previousItems.length
      ? `${previousItems.length} alumni contributor${previousItems.length === 1 ? '' : 's'}`
      : '';
  }

  if (currentList) {
    currentList.innerHTML = currentItems.length
      ? currentItems.map((m, i) => buildMemberChip(m, i)).join('')
      : '<p class="members-empty">No members listed for this cohort.</p>';
  }
  if (previousList) {
    previousList.innerHTML = previousItems.length
      ? previousItems.map((m, i) => buildAlumniCard(m, i)).join('')
      : '<p class="members-empty">No previous members listed.</p>';
  }

  if (typeof window.initMembersReveal === 'function') {
    window.initMembersReveal();
  }
}

function renderLegacySection(section, legacy) {
  setText('cms-legacy-eyebrow', section.eyebrow);
  setText('cms-legacy-title', section.title);
  setText('cms-legacy-subtitle', section.subtitle);
  const timeline = document.getElementById('cms-legacy-timeline');
  if (!timeline) return;
  timeline.innerHTML = legacy.map((item, i) => `
    <div class="timeline-item glass rounded-2xl p-6${i === legacy.length - 1 ? ' !pb-0' : ''}" data-aos="fade-up" data-aos-delay="${i * 80}">
      <div class="timeline-year">${escapeHtml(item.year)}</div>
      <h4 class="text-lg font-bold mt-1">${escapeHtml(item.title)}</h4>
      <p class="text-slate-400 text-sm mt-2 leading-relaxed">${escapeHtml(item.description)}</p>
    </div>
  `).join('');
}

function renderTestimonialsSection(section, testimonials) {
  setText('cms-testimonials-eyebrow', section.eyebrow);
  setText('cms-testimonials-title', section.title);
  setText('cms-testimonials-subtitle', section.subtitle);

  const track = document.getElementById('testimonials-track');
  const sectionEl = document.getElementById('testimonials');
  if (!track) return;

  const items = testimonials || [];
  if (sectionEl) sectionEl.hidden = items.length === 0;

  if (!window.RC_TESTIMONIALS) {
    track.innerHTML = '';
    return;
  }

  track.innerHTML = items.map((item, i) => RC_TESTIMONIALS.buildCardHtml(item, i)).join('');

  if (typeof window.RC_TESTIMONIALS.initCarousel === 'function') {
    RC_TESTIMONIALS.initCarousel();
  }
}

function renderPartnersSection(section, partners) {
  setText('cms-partners-eyebrow', section.eyebrow);
  setText('cms-partners-title', section.title);
  setText('cms-partners-subtitle', section.subtitle);

  const wrap = document.getElementById('cms-partners-groups');
  const sectionEl = document.getElementById('partners');
  if (!wrap || !window.RC_PARTNERS) return;

  const items = partners || [];
  if (sectionEl) sectionEl.hidden = items.length === 0;
  if (!items.length) {
    wrap.innerHTML = '';
    return;
  }

  const groups = RC_PARTNERS.groupByType(items);
  wrap.innerHTML = groups.map((group) => `
    <div class="partners-group">
      <h3 class="partners-group__title">${escapeHtml(group.label)}s</h3>
      <div class="partners-grid">
        ${group.items.map((item, i) => RC_PARTNERS.buildCardHtml(item, i)).join('')}
      </div>
    </div>
  `).join('');

  if (window.RC_REVEAL) RC_REVEAL.refresh();
}

function renderProjectsSection(section, projects) {
  setText('cms-projects-eyebrow', section.eyebrow);
  setText('cms-projects-title', section.title);
  setText('cms-projects-subtitle', section.subtitle);

  const wrap = document.getElementById('projects');
  const grid = document.getElementById('cms-projects-grid');
  const filters = document.getElementById('projects-filters');
  if (!grid || !window.RC_PROJECTS) return;

  const items = projects || [];
  if (wrap) wrap.hidden = items.length === 0;

  if (!items.length) {
    grid.innerHTML = '';
    if (filters) filters.innerHTML = '';
    return;
  }

  grid.dataset.projects = JSON.stringify(items);
  grid.innerHTML = items.map((p, i) => RC_PROJECTS.buildCardHtml(p, i)).join('');

  if (filters) RC_PROJECTS.initFilters();
}

function renderResourcesSection(section, resources) {
  setText('cms-resources-eyebrow', section.eyebrow);
  setText('cms-resources-title', section.title);
  setText('cms-resources-subtitle', section.subtitle);

  const wrap = document.getElementById('resources');
  const grid = document.getElementById('cms-resources-grid');
  if (!grid || !window.RC_RESOURCES) return;

  const items = resources || [];
  if (wrap) wrap.hidden = items.length === 0;

  if (!items.length) {
    grid.innerHTML = '';
    grid.dataset.resources = '[]';
    return;
  }

  grid.dataset.resources = JSON.stringify(items);

  if (typeof window.RC_RESOURCES.initHub === 'function') {
    RC_RESOURCES.initHub();
  }
}

function renderGallerySection(section, gallery) {
  setText('cms-gallery-eyebrow', section.eyebrow);
  setText('cms-gallery-title', section.title);
  setText('cms-gallery-subtitle', section.subtitle);
  const grid = document.getElementById('cms-gallery-grid');
  if (!grid || !window.RC_GALLERY) return;

  const items = (gallery || []).map((g, i) => RC_GALLERY.migrateItem(g, i));
  const homeItems = items.slice(0, RC_GALLERY.HOME_PREVIEW_COUNT);

  const viewAll = document.getElementById('gallery-view-all-wrap');
  if (viewAll) viewAll.style.display = items.length ? '' : 'none';

  grid.innerHTML = homeItems.map((g, i) => RC_GALLERY.buildCardHtml(g, i)).join('');

  if (typeof window.initGalleryHome === 'function') {
    window.initGalleryHome(homeItems);
  }
}

function renderCertificatesSection(section) {
  const cfg = section || {};
  const sectionEl = document.getElementById('certificates');
  if (sectionEl) sectionEl.hidden = cfg.enabled === false;

  setText('cms-cert-eyebrow', cfg.eyebrow);
  setText('cms-cert-title', cfg.title);
  setText('cms-cert-subtitle', cfg.subtitle);
  setText('cms-cert-verify-label', cfg.verifyLabel || 'Enter Certificate ID');
  setText('cms-cert-verify-hint', cfg.verifyHint || 'Enter the ID printed on your certificate or membership card.');

  const input = document.getElementById('cert-verify-input');
  if (input && cfg.verifyPlaceholder) input.placeholder = cfg.verifyPlaceholder;

  const btn = document.getElementById('cms-cert-verify-btn');
  if (btn) {
    btn.innerHTML = `<i class="fas fa-shield-halved" aria-hidden="true"></i> ${escapeHtml(cfg.verifyButton || 'Verify Certificate')}`;
  }

  if (window.RC_CERTIFICATES) {
    RC_CERTIFICATES.initVerify();
  }
}

function renderContactSection(section, social) {
  setText('cms-contact-eyebrow', section.eyebrow);
  setText('cms-contact-title', section.title);
  setText('cms-contact-subtitle', section.subtitle);
  setText('cms-contact-name-label', section.nameLabel || 'Full Name');
  setText('cms-contact-email-label', section.emailLabel || 'Email');
  setText('cms-contact-subject-label', section.subjectLabel || 'Subject');
  setText('cms-contact-message-label', section.messageLabel || 'Message');
  setText('cms-contact-submit-label', section.submitLabel || 'Send Message');

  const emailLink = document.getElementById('cms-contact-email');
  const igLink = document.getElementById('cms-contact-instagram');
  const waLink = document.getElementById('cms-contact-whatsapp');
  if (emailLink) {
    emailLink.href = `mailto:${social.email}`;
    emailLink.textContent = social.email;
  }
  if (igLink) igLink.href = social.instagram;
  if (waLink) waLink.href = social.whatsapp;

  const subjectSelect = document.getElementById('contact-subject');
  if (subjectSelect && window.RC_CONTACT) {
    const current = subjectSelect.value;
    subjectSelect.innerHTML = `<option value="">Select a subject</option>${RC_CONTACT.SUBJECTS.map((s) =>
      `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`
    ).join('')}`;
    if (current) subjectSelect.value = current;
  }

  if (typeof window.initContactForm === 'function') {
    window.initContactForm();
  }
}

window.renderAnnouncementBar = function renderAnnouncementBar(config) {
  const bar = document.getElementById('announce-bar');
  if (!bar || !window.RC_ANNOUNCE) return;

  const cfg = config || RC_ANNOUNCE.getConfig();
  const textEl = document.getElementById('cms-announce-text');
  const linkEl = document.getElementById('cms-announce-link');
  const dismissBtn = document.getElementById('announce-dismiss');

  const show = cfg.enabled && cfg.message && !RC_ANNOUNCE.isDismissed(cfg.announcementId);

  bar.classList.remove('announce-bar--accent', 'announce-bar--info', 'announce-bar--warning', 'announce-bar--success');
  bar.classList.add(`announce-bar--${cfg.variant || 'accent'}`);

  if (textEl) textEl.textContent = cfg.message || '';

  if (linkEl) {
    if (cfg.linkUrl && cfg.linkLabel) {
      linkEl.href = cfg.linkUrl;
      linkEl.textContent = cfg.linkLabel;
      linkEl.style.display = '';
    } else {
      linkEl.style.display = 'none';
    }
  }

  if (dismissBtn) {
    dismissBtn.style.display = cfg.dismissible !== false ? '' : 'none';
  }

  if (show) {
    bar.hidden = false;
    bar.classList.remove('announce-bar--hidden');
    document.body.classList.add('has-announce-bar');
  } else {
    bar.hidden = true;
    bar.classList.add('announce-bar--hidden');
    document.body.classList.remove('has-announce-bar');
  }

  if (typeof window.syncAnnounceBarOffset === 'function') {
    window.syncAnnounceBarOffset();
  }
};

function renderNewsletterSection(section) {
  const wrap = document.getElementById('newsletter');
  if (!wrap) return;

  const cfg = section || (window.RC_NEWSLETTER?.getConfig() || {});
  const enabled = cfg.enabled !== false;

  wrap.hidden = !enabled;
  if (!enabled) return;

  setText('cms-newsletter-title', cfg.title);
  setText('cms-newsletter-subtitle', cfg.subtitle);
  setText('cms-newsletter-privacy', cfg.privacyNote);
  setText('cms-newsletter-btn-label', cfg.buttonLabel || 'Subscribe');

  const emailInput = document.getElementById('newsletter-email');
  if (emailInput && cfg.placeholder) {
    emailInput.placeholder = cfg.placeholder;
  }

  if (typeof window.initNewsletterForm === 'function') {
    window.initNewsletterForm();
  }
}

function renderJoin(join, social, registration) {
  setText('cms-join-eyebrow', join.eyebrow);
  setText('cms-join-title', join.title);
  setText('cms-join-desc', join.description);
  setText('cms-join-btn-ig', join.btnInstagram);
  setText('cms-join-btn-wa', join.btnWhatsapp);
  const ig = document.getElementById('cms-join-link-ig');
  const wa = document.getElementById('cms-join-link-wa');
  if (ig) ig.href = social.instagram;
  if (wa) wa.href = social.whatsapp;

  if (typeof window.updateMembershipCTA === 'function') {
    window.updateMembershipCTA();
  }
}

function renderFooter(footer, social) {
  setText('cms-footer-brand', footer.brand);
  setText('cms-footer-desc', footer.description);
  setText('cms-footer-email-text', footer.email);
  setText('cms-footer-copyright', footer.copyright);
  const emailLink = document.getElementById('cms-footer-email-link');
  const igLink = document.getElementById('cms-footer-ig');
  const waLink = document.getElementById('cms-footer-wa');
  const mailLink = document.getElementById('cms-footer-mail');
  const contactEmail = document.getElementById('cms-contact-email');
  const contactIg = document.getElementById('cms-contact-ig');
  if (emailLink) { emailLink.href = `mailto:${footer.email}`; emailLink.textContent = footer.email; }
  if (igLink) igLink.href = social.instagram;
  if (waLink) waLink.href = social.whatsapp;
  if (mailLink) mailLink.href = `mailto:${footer.email}`;
  if (contactEmail) { contactEmail.href = `mailto:${footer.email}`; contactEmail.textContent = footer.email; }
  if (contactIg) contactIg.href = social.instagram;
}
