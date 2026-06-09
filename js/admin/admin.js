let content = {};
let editingList = {};

const PANEL_TITLES = {
  dashboard: 'Dashboard',
  hero: 'Hero',
  stats: 'Stats',
  about: 'About',
  events: 'Events',
  faculty: 'Faculty In-Charge',
  core: 'Core Team',
  ambassadors: 'Ambassadors',
  members: 'Members',
  legacy: 'Legacy',
  testimonials: 'Testimonials',
  partners: 'Partners & Sponsors',
  projects: 'Project Showcase',
  resources: 'Resource Hub',
  gallery: 'Gallery',
  join: 'Join & Footer',
  membership: 'Membership Registration',
  contact: 'Contact Messages',
  certificates: 'Certificates & IDs',
  newsletter: 'Newsletter & Announcements',
  seo: 'SEO & Social Sharing',
  analytics: 'Analytics',
  notifications: 'Email Notifications'
};

const SEO_PLATFORMS = ['whatsapp', 'twitter', 'facebook', 'linkedin', 'telegram', 'copy'];

let membershipFilters = { search: '', status: 'all' };
let contactFilters = { search: '', status: 'all', subject: 'all' };
let certificateFilters = { search: '', type: 'all', status: 'all' };
let newsletterFilters = { search: '' };

function canPanel(name) {
  return RC_CMS.canAccessPanel(name);
}

function canAction(action) {
  return RC_CMS.canPerformAction(action);
}

document.addEventListener('DOMContentLoaded', async () => {
  await RC_CMS.init();

  if (RC_CMS.isLoggedIn()) {
    await showAdmin();
  } else {
    showLogin();
  }

  document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('admin-id').value.trim();
    const pass = document.getElementById('admin-pass').value;
    const loginBtn = e.target.querySelector('button[type="submit"]');
    if (loginBtn) loginBtn.disabled = true;

    const ok = await RC_CMS.login(id, pass);
    if (loginBtn) loginBtn.disabled = false;

    if (ok) {
      document.getElementById('login-error')?.classList.remove('show');
      await showAdmin();
    } else {
      document.getElementById('login-error')?.classList.add('show');
    }
  });

  document.getElementById('logout-btn')?.addEventListener('click', () => {
    RC_CMS.logout();
    showLogin();
  });

  document.getElementById('save-all-btn')?.addEventListener('click', saveAll);
  document.getElementById('admin-nav')?.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-panel]');
    if (!btn) return;
    switchPanel(btn.dataset.panel);
  });
});

function showLogin() {
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('admin-app').style.display = 'none';
  document.getElementById('login-error')?.classList.remove('show');
  const badge = document.getElementById('admin-role-badge');
  if (badge) badge.hidden = true;
}

async function showAdmin() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('admin-app').style.display = 'flex';

  await Promise.all([
    RC_CMS.ensureReady(),
    RC_MEMBERSHIP?.ensureReady?.(),
    RC_CONTACT?.ensureReady?.(),
    RC_NEWSLETTER?.ensureReady?.(),
    RC_CERTIFICATES?.ensureReady?.()
  ].filter(Boolean));

  content = RC_CMS.getContent();
  applyRoleUI();
  renderAllPanels();
  switchPanel(RC_ADMIN_ROLES.getDefaultPanel(RC_CMS.getRole()));
}

function applyRoleUI() {
  const role = RC_CMS.getRole();
  const roleCfg = RC_ADMIN_ROLES.getRoleConfig(role);

  document.querySelectorAll('.admin-nav button[data-panel]').forEach((btn) => {
    btn.hidden = !canPanel(btn.dataset.panel);
  });

  const badge = document.getElementById('admin-role-badge');
  if (badge) {
    badge.hidden = false;
    badge.textContent = roleCfg.label;
    badge.title = roleCfg.description;
  }

  const saveBtn = document.getElementById('save-all-btn');
  if (saveBtn) saveBtn.hidden = !canAction('save');
}

function switchPanel(name) {
  if (!canPanel(name)) {
    toast('You do not have access to this section.');
    switchPanel(RC_ADMIN_ROLES.getDefaultPanel(RC_CMS.getRole()));
    return;
  }

  document.querySelectorAll('.admin-nav button').forEach((b) => {
    b.classList.toggle('active', b.dataset.panel === name);
  });
  document.querySelectorAll('.admin-panel').forEach((p) => p.classList.remove('active'));
  document.getElementById(`panel-${name}`)?.classList.add('active');
  document.getElementById('panel-title').textContent = PANEL_TITLES[name] || name;
}

function toast(msg) {
  const el = document.getElementById('admin-toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2800);
}

async function saveAll() {
  if (!canAction('save')) {
    toast('You do not have permission to save changes.');
    return;
  }
  collectAllForms();
  try {
    await RC_CMS.saveContent(content);
    toast('Changes saved! Refresh the main website to see updates.');
  } catch {
    toast('Save failed. Check your connection and try again.');
  }
}

function field(label, id, value = '', type = 'text', rows) {
  if (type === 'textarea') {
    return `<div class="admin-field"><label for="${id}">${label}</label><textarea id="${id}" rows="${rows || 3}">${esc(value)}</textarea></div>`;
  }
  return `<div class="admin-field"><label for="${id}">${label}</label><input type="${type}" id="${id}" value="${esc(value)}" /></div>`;
}

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

function val(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function numVal(id) {
  return parseInt(val(id), 10) || 0;
}

function collectAllForms() {
  if (document.getElementById('hero-badge')) {
    content.hero = {
      badge: val('hero-badge'),
      title: val('hero-title'),
      titleHighlight: val('hero-highlight'),
      description: val('hero-desc'),
      btnPrimary: val('hero-btn1'),
      btnSecondary: val('hero-btn2')
    };
  }
  if (document.getElementById('stats-eyebrow')) {
    content.statsSection = {
      enabled: document.getElementById('stats-enabled')?.checked !== false,
      eyebrow: val('stats-eyebrow'),
      title: val('stats-title'),
      subtitle: val('stats-subtitle')
    };
  }
  if (document.getElementById('about-eyebrow')) {
    content.about = {
      eyebrow: val('about-eyebrow'),
      title: val('about-title'),
      subtitle: val('about-subtitle'),
      mission: val('about-mission'),
      vision: val('about-vision'),
      culture: val('about-culture')
    };
  }
  if (document.getElementById('events-eyebrow')) {
    content.eventsSection = {
      eyebrow: val('events-eyebrow'),
      title: val('events-title'),
      subtitle: val('events-subtitle'),
      upcomingTitle: val('events-upcoming-title'),
      pastTitle: val('events-past-title')
    };
  }
  if (document.getElementById('faculty-eyebrow')) {
    content.facultySection = {
      eyebrow: val('faculty-eyebrow'),
      title: val('faculty-title'),
      subtitle: val('faculty-subtitle')
    };
  }
  if (document.getElementById('core-eyebrow')) {
    content.coreSection = {
      eyebrow: val('core-eyebrow'),
      title: val('core-title'),
      subtitle: val('core-subtitle')
    };
    content.teamHierarchySection = {
      enabled: document.getElementById('team-hierarchy-enabled')?.checked !== false,
      hint: val('team-hierarchy-hint')
    };
  }
  if (document.getElementById('amb-eyebrow')) {
    content.ambassadorsSection = {
      eyebrow: val('amb-eyebrow'),
      title: val('amb-title'),
      subtitle: val('amb-subtitle')
    };
  }
  if (document.getElementById('mem-eyebrow')) {
    content.membersSection = {
      eyebrow: val('mem-eyebrow'),
      title: val('mem-title'),
      subtitle: val('mem-subtitle'),
      currentTitle: val('mem-current-title'),
      previousTitle: val('mem-prev-title')
    };
  }
  if (document.getElementById('legacy-eyebrow')) {
    content.legacySection = {
      eyebrow: val('legacy-eyebrow'),
      title: val('legacy-title'),
      subtitle: val('legacy-subtitle')
    };
  }
  if (document.getElementById('testimonials-eyebrow')) {
    content.testimonialsSection = {
      eyebrow: val('testimonials-eyebrow'),
      title: val('testimonials-title'),
      subtitle: val('testimonials-subtitle')
    };
  }
  if (document.getElementById('partners-eyebrow')) {
    content.partnersSection = {
      eyebrow: val('partners-eyebrow'),
      title: val('partners-title'),
      subtitle: val('partners-subtitle')
    };
  }
  if (document.getElementById('projects-eyebrow')) {
    content.projectsSection = {
      eyebrow: val('projects-eyebrow'),
      title: val('projects-title'),
      subtitle: val('projects-subtitle')
    };
  }
  if (document.getElementById('resources-eyebrow')) {
    content.resourcesSection = {
      eyebrow: val('resources-eyebrow'),
      title: val('resources-title'),
      subtitle: val('resources-subtitle')
    };
  }
  if (document.getElementById('gallery-eyebrow')) {
    content.gallerySection = {
      eyebrow: val('gallery-eyebrow'),
      title: val('gallery-title'),
      subtitle: val('gallery-subtitle')
    };
  }
  if (document.getElementById('join-eyebrow')) {
    content.join = {
      eyebrow: val('join-eyebrow'),
      title: val('join-title'),
      description: val('join-desc'),
      btnInstagram: val('join-btn-ig'),
      btnWhatsapp: val('join-btn-wa')
    };
    content.footer = {
      brand: val('footer-brand'),
      description: val('footer-desc'),
      email: val('footer-email'),
      copyright: val('footer-copy')
    };
    content.social = {
      instagram: val('social-ig'),
      whatsapp: val('social-wa'),
      email: val('footer-email')
    };
  }
  if (document.getElementById('seo-site-name')) {
    const platforms = SEO_PLATFORMS.filter((p) => document.getElementById(`seo-platform-${p}`)?.checked);
    content.seo = {
      siteName: val('seo-site-name'),
      siteUrl: val('seo-site-url'),
      defaultImage: val('seo-default-image'),
      organizationName: val('seo-org-name'),
      organizationType: val('seo-org-type'),
      twitterHandle: val('seo-twitter-handle'),
      twitterCard: val('seo-twitter-card'),
      robots: val('seo-robots'),
      pages: {
        home: {
          title: val('seo-home-title'),
          description: val('seo-home-desc'),
          keywords: val('seo-home-keywords'),
          ogImage: val('seo-home-image'),
          canonicalUrl: val('seo-home-canonical'),
          robots: val('seo-home-robots'),
          ogType: val('seo-home-og-type')
        },
        gallery: {
          title: val('seo-gallery-title'),
          description: val('seo-gallery-desc'),
          keywords: val('seo-gallery-keywords'),
          ogImage: val('seo-gallery-image'),
          canonicalUrl: val('seo-gallery-canonical'),
          robots: val('seo-gallery-robots'),
          ogType: val('seo-gallery-og-type')
        }
      },
      share: {
        enabled: document.getElementById('seo-share-enabled')?.checked !== false,
        sectionLabel: val('seo-share-label'),
        title: val('seo-share-title'),
        text: val('seo-share-text'),
        platforms,
        copySuccess: val('seo-copy-success'),
        copyError: val('seo-copy-error')
      }
    };
  }
  if (document.getElementById('announce-enabled')) {
    content.announcementBar = {
      enabled: document.getElementById('announce-enabled').checked,
      announcementId: val('announce-id'),
      message: val('announce-message'),
      linkUrl: val('announce-link-url'),
      linkLabel: val('announce-link-label'),
      variant: val('announce-variant'),
      dismissible: document.getElementById('announce-dismissible').checked
    };
  }
  if (document.getElementById('newsletter-enabled')) {
    content.newsletterSection = {
      enabled: document.getElementById('newsletter-enabled').checked,
      title: val('newsletter-title'),
      subtitle: val('newsletter-subtitle'),
      placeholder: val('newsletter-placeholder'),
      buttonLabel: val('newsletter-btn-label'),
      successMessage: val('newsletter-success'),
      privacyNote: val('newsletter-privacy')
    };
  }
  if (document.getElementById('contact-eyebrow')) {
    content.contactSection = {
      eyebrow: val('contact-eyebrow'),
      title: val('contact-title'),
      subtitle: val('contact-subtitle'),
      successMessage: val('contact-success'),
      nameLabel: val('contact-name-label'),
      emailLabel: val('contact-email-label'),
      subjectLabel: val('contact-subject-label'),
      messageLabel: val('contact-message-label'),
      submitLabel: val('contact-submit-label')
    };
  }
  if (document.getElementById('notify-enabled')) {
    content.notificationsSection = {
      enabled: document.getElementById('notify-enabled')?.checked !== false,
      provider: val('notify-provider') || 'web3forms',
      web3formsAccessKey: val('notify-web3forms-key'),
      notifyEmail: val('notify-email'),
      notifyOnContact: document.getElementById('notify-on-contact')?.checked !== false,
      notifyOnMembership: document.getElementById('notify-on-membership')?.checked !== false,
      contactSubject: val('notify-contact-subject'),
      membershipSubject: val('notify-membership-subject'),
      setupHint: val('notify-setup-hint')
    };
  }
  if (document.getElementById('analytics-enabled')) {
    content.analyticsSection = {
      enabled: document.getElementById('analytics-enabled')?.checked !== false,
      trackLocal: document.getElementById('analytics-local')?.checked !== false,
      ga4MeasurementId: val('analytics-ga4-id'),
      privacyNote: val('analytics-privacy-note')
    };
  }
  if (document.getElementById('cert-eyebrow')) {
    content.certificatesSection = {
      enabled: document.getElementById('cert-enabled')?.checked !== false,
      eyebrow: val('cert-eyebrow'),
      title: val('cert-title'),
      subtitle: val('cert-subtitle'),
      verifyLabel: val('cert-verify-label'),
      verifyPlaceholder: val('cert-verify-placeholder'),
      verifyHint: val('cert-verify-hint'),
      verifyButton: val('cert-verify-btn-label'),
      validMessage: val('cert-valid-msg'),
      invalidMessage: val('cert-invalid-msg'),
      revokedMessage: val('cert-revoked-msg'),
      issuerName: val('cert-issuer-name'),
      issuerTitle: val('cert-issuer-title')
    };
  }
  if (document.getElementById('reg-enabled')) {
    content.registration = {
      enabled: document.getElementById('reg-enabled').checked,
      startDate: val('reg-start'),
      endDate: val('reg-end'),
      upcomingMessage: val('reg-upcoming-msg'),
      expiredMessage: val('reg-expired-msg'),
      closedMessage: val('reg-expired-msg'),
      disabledMessage: val('reg-disabled-msg'),
      successMessage: val('reg-success-msg')
    };
  }
}

function renderAllPanels() {
  if (canPanel('dashboard')) renderDashboard();
  if (canPanel('hero')) renderHeroPanel();
  if (canPanel('stats')) renderStatsPanel();
  if (canPanel('about')) renderAboutPanel();
  if (canPanel('events')) renderEventsPanel();
  if (canPanel('faculty')) renderFacultyPanel();
  if (canPanel('core')) renderCorePanel();
  if (canPanel('ambassadors')) renderAmbassadorsPanel();
  if (canPanel('members')) renderMembersPanel();
  if (canPanel('legacy')) renderLegacyPanel();
  if (canPanel('testimonials')) renderTestimonialsPanel();
  if (canPanel('partners')) renderPartnersPanel();
  if (canPanel('projects')) renderProjectsPanel();
  if (canPanel('resources')) renderResourcesPanel();
  if (canPanel('gallery')) renderGalleryPanel();
  if (canPanel('join')) renderJoinPanel();
  if (canPanel('membership')) renderMembershipPanel();
  if (canPanel('contact')) renderContactPanel();
  if (canPanel('certificates')) renderCertificatesPanel();
  if (canPanel('newsletter')) renderNewsletterPanel();
  if (canPanel('seo')) renderSeoPanel();
  if (canPanel('analytics')) renderAnalyticsPanel();
  if (canPanel('notifications')) renderNotificationsPanel();
}

function renderDashboard() {
  const el = document.getElementById('panel-dashboard');
  const role = RC_CMS.getRole();
  const roleCfg = RC_ADMIN_ROLES.getRoleConfig(role);
  const displayName = RC_CMS.getDisplayName();

  const contentStats = canPanel('hero') ? `
    ${content.stats?.length || 0} stats · ${content.events?.length || 0} events ·
    ${content.faculty?.length || 0} faculty · ${content.coreTeam?.length || 0} core members · ${content.gallery?.length || 0} gallery images ·
    ${content.testimonials?.length || 0} testimonials · ${content.partners?.length || 0} partners ·
    ${content.projects?.length || 0} projects · ${content.resources?.length || 0} resources ·
    ${content.legacy?.length || 0} legacy items` : '';

  const opsStats = (canPanel('membership') || canPanel('contact')) ? `
    ${canPanel('membership') ? `${RC_MEMBERSHIP.getApplications().length} membership applications (${RC_MEMBERSHIP.getApplications().filter((a) => a.status === 'pending').length} pending)` : ''}
    ${canPanel('contact') && window.RC_CONTACT ? ` · ${RC_CONTACT.getMessages().length} contact messages (${RC_CONTACT.getMessages().filter((m) => m.status === 'unread').length} unread)` : ''}
    ${canPanel('certificates') && window.RC_CERTIFICATES ? ` · ${RC_CERTIFICATES.getCertificates().length} certificates (${RC_CERTIFICATES.getCertificates().filter((c) => c.status === 'active').length} active)` : ''}
    ${canPanel('newsletter') && window.RC_NEWSLETTER ? ` · ${RC_NEWSLETTER.getSubscribers().length} newsletter subscribers` : ''}` : '';

  const backupCard = canAction('export') ? `
    <div class="admin-card">
      <h3>Backup & Restore</h3>
      <div class="admin-actions">
        <button type="button" class="admin-btn admin-btn--success" id="export-btn"><i class="fas fa-download"></i> Export JSON</button>
        ${canAction('import') ? '<button type="button" class="admin-btn" id="import-btn"><i class="fas fa-upload"></i> Import JSON</button>' : ''}
        ${canAction('reset') ? '<button type="button" class="admin-btn admin-btn--danger" id="reset-btn"><i class="fas fa-undo"></i> Reset to Default</button>' : ''}
      </div>
      <p class="admin-hint">Export your content before resetting. Import restores from a backup file.</p>
    </div>` : '';

  el.innerHTML = `
    <div class="admin-card">
      <h3>Welcome, ${esc(displayName)}</h3>
      <p class="admin-role-inline"><i class="fas fa-user-shield" aria-hidden="true"></i> ${esc(roleCfg.label)}</p>
      <p style="color:var(--admin-muted);line-height:1.7;margin-top:0.75rem;">
        ${esc(roleCfg.description)}
        ${canAction('save') ? ' Click <strong>Save Changes</strong> after editing.' : ''}
      </p>
      <p class="admin-hint">Tip: Open the main site in another tab. After saving, refresh it to see updates.</p>
    </div>
    ${backupCard}
    <div class="admin-card">
      <h3>Quick Stats</h3>
      <p style="color:var(--admin-muted)">${contentStats}${contentStats && opsStats ? '<br>' : ''}${opsStats}</p>
    </div>
  `;

  document.getElementById('export-btn')?.addEventListener('click', () => RC_CMS.exportContent());
  document.getElementById('import-btn')?.addEventListener('click', () => document.getElementById('import-file').click());
  document.getElementById('reset-btn')?.addEventListener('click', async () => {
    if (confirm('Reset ALL website content to default? This cannot be undone unless you have a backup.')) {
      content = await RC_CMS.resetContent();
      renderAllPanels();
      toast('Content reset to default.');
    }
  });
  document.getElementById('import-file').onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      content = await RC_CMS.importContent(file);
      renderAllPanels();
      toast('Content imported successfully!');
    } catch (err) {
      alert(err.message);
    }
    e.target.value = '';
  };
}

function renderHeroPanel() {
  const h = content.hero;
  document.getElementById('panel-hero').innerHTML = `
    <div class="admin-card"><h3>Hero Section</h3>
      ${field('Badge', 'hero-badge', h.badge)}
      ${field('Title Line 1', 'hero-title', h.title)}
      ${field('Title Highlight', 'hero-highlight', h.titleHighlight)}
      ${field('Description', 'hero-desc', h.description, 'textarea', 3)}
      <div class="admin-grid-2">
        ${field('Primary Button', 'hero-btn1', h.btnPrimary)}
        ${field('Secondary Button', 'hero-btn2', h.btnSecondary)}
      </div>
    </div>
  `;
}

function renderStatsPanel() {
  const s = content.statsSection || {};
  document.getElementById('panel-stats').innerHTML = `
    <div class="admin-card">
      <h3>Stats Section</h3>
      <label class="admin-checkbox" style="margin-bottom:1rem;">
        <input type="checkbox" id="stats-enabled" ${s.enabled !== false ? 'checked' : ''} />
        Show stats section on homepage
      </label>
      ${field('Eyebrow', 'stats-eyebrow', s.eyebrow)}
      ${field('Title', 'stats-title', s.title)}
      ${field('Subtitle', 'stats-subtitle', s.subtitle, 'textarea', 2)}
      <p class="admin-hint">Stats animate when scrolled into view. Accent colors: sky, indigo, emerald, amber, rose, violet.</p>
    </div>
    ${listEditor('stats', STATS_FIELDS, 'Stat')}
  `;
  bindListEvents('panel-stats', 'stats', STATS_FIELDS);
}

function renderAboutPanel() {
  const a = content.about;
  document.getElementById('panel-about').innerHTML = `
    <div class="admin-card"><h3>About Section</h3>
      ${field('Eyebrow', 'about-eyebrow', a.eyebrow)}
      ${field('Title', 'about-title', a.title)}
      ${field('Subtitle', 'about-subtitle', a.subtitle, 'textarea', 3)}
      ${field('Mission', 'about-mission', a.mission, 'textarea')}
      ${field('Vision', 'about-vision', a.vision, 'textarea')}
      ${field('Culture', 'about-culture', a.culture, 'textarea')}
    </div>
  `;
}

function listEditor(key, fields, itemLabel, options = {}) {
  const items = content[key] || [];
  const editIdx = editingList[key];
  const reorderable = options.reorderable === true;

  let formHtml = '';
  if (editIdx !== undefined) {
    const item = editIdx === 'new' ? {} : { ...items[editIdx] };
    formHtml = `<div class="admin-card"><h3>${editIdx === 'new' ? 'Add' : 'Edit'} ${itemLabel}</h3>
      ${fields.map((f) => field(f.label, `le-${f.id}`, item[f.id], f.type || 'text', f.rows)).join('')}
      ${fields.find((f) => f.id === 'lead') ? `<label class="admin-checkbox"><input type="checkbox" id="le-lead" ${item.lead ? 'checked' : ''} /> Mark as Lead / Ambassador</label>` : ''}
      ${fields.find((f) => f.id === 'accent') ? `<div class="admin-field"><label>Accent Color</label><select id="le-accent"><option value="sky" ${item.accent !== 'violet' ? 'selected' : ''}>Sky Blue</option><option value="violet" ${item.accent === 'violet' ? 'selected' : ''}>Violet</option></select></div>` : ''}
      <div class="admin-actions" style="margin-top:1rem;">
        <button type="button" class="admin-btn admin-btn--primary" id="le-save"><i class="fas fa-check"></i> Save Item</button>
        <button type="button" class="admin-btn" id="le-cancel">Cancel</button>
      </div>
    </div>`;
  }

  const listHtml = items.map((item, i) => `
    <div class="admin-list-item">
      <div class="admin-list-item__info">
        <strong>${esc(item.title || item.name || item.label || `Item ${i + 1}`)}</strong>
        <small>${esc(item.period || item.role || item.designation || item.date || item.year || item.description || item.image || '').slice(0, 120)}</small>
      </div>
      <div class="admin-list-item__actions">
        ${reorderable ? `
          <button type="button" class="admin-btn" data-move-up="${key}" data-idx="${i}" ${i === 0 ? 'disabled' : ''} title="Move up"><i class="fas fa-arrow-up"></i></button>
          <button type="button" class="admin-btn" data-move-down="${key}" data-idx="${i}" ${i === items.length - 1 ? 'disabled' : ''} title="Move down"><i class="fas fa-arrow-down"></i></button>
        ` : ''}
        <button type="button" class="admin-btn" data-edit="${key}" data-idx="${i}"><i class="fas fa-edit"></i></button>
        <button type="button" class="admin-btn admin-btn--danger" data-del="${key}" data-idx="${i}"><i class="fas fa-trash"></i></button>
      </div>
    </div>
  `).join('');

  return `${formHtml}
    <div class="admin-card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
        <h3 style="margin:0">${itemLabel} (${items.length})</h3>
        <button type="button" class="admin-btn admin-btn--primary" data-add="${key}"><i class="fas fa-plus"></i> Add New</button>
      </div>
      ${listHtml || '<p style="color:var(--admin-muted)">No items yet.</p>'}
    </div>`;
}

function moveListItem(key, index, direction, panelId) {
  const items = content[key];
  const newIndex = index + direction;
  if (!Array.isArray(items) || newIndex < 0 || newIndex >= items.length) return;
  [items[index], items[newIndex]] = [items[newIndex], items[index]];
  RC_CMS.saveContent(content);
  renderAllPanels();
  switchPanel(panelId.replace('panel-', ''));
  toast('Order updated.');
}

function bindListEvents(panelId, key, fields, options = {}) {
  const panel = document.getElementById(panelId);

  panel.querySelector(`[data-add="${key}"]`)?.addEventListener('click', () => {
    editingList[key] = 'new';
    renderAllPanels();
    switchPanel(panelId.replace('panel-', ''));
  });

  panel.querySelectorAll(`[data-edit="${key}"]`).forEach((btn) => {
    btn.addEventListener('click', () => {
      editingList[key] = parseInt(btn.dataset.idx, 10);
      renderAllPanels();
      switchPanel(panelId.replace('panel-', ''));
    });
  });

  panel.querySelectorAll(`[data-del="${key}"]`).forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!confirm('Delete this item?')) return;
      content[key].splice(parseInt(btn.dataset.idx, 10), 1);
      delete editingList[key];
      RC_CMS.saveContent(content);
      renderAllPanels();
      switchPanel(panelId.replace('panel-', ''));
      toast('Item deleted.');
    });
  });

  document.getElementById('le-save')?.addEventListener('click', () => {
    const item = {};
    fields.forEach((f) => {
      item[f.id] = f.type === 'number' ? numVal(`le-${f.id}`) : val(`le-${f.id}`);
    });
    if (document.getElementById('le-accent')) item.accent = val('le-accent');
    if (document.getElementById('le-lead')) item.lead = document.getElementById('le-lead').checked;
    if (fields.find((f) => f.id === 'value')) item.value = numVal('le-value');

    if (!content[key]) content[key] = [];
    if (editingList[key] === 'new') {
      content[key].push(item);
    } else {
      content[key][editingList[key]] = item;
    }
    delete editingList[key];
    RC_CMS.saveContent(content);
    renderAllPanels();
    switchPanel(panelId.replace('panel-', ''));
    toast('Item saved.');
  });

  document.getElementById('le-cancel')?.addEventListener('click', () => {
    delete editingList[key];
    renderAllPanels();
    switchPanel(panelId.replace('panel-', ''));
  });

  if (options.reorderable) {
    panel.querySelectorAll(`[data-move-up="${key}"]`).forEach((btn) => {
      btn.addEventListener('click', () => moveListItem(key, parseInt(btn.dataset.idx, 10), -1, panelId));
    });
    panel.querySelectorAll(`[data-move-down="${key}"]`).forEach((btn) => {
      btn.addEventListener('click', () => moveListItem(key, parseInt(btn.dataset.idx, 10), 1, panelId));
    });
  }
}

const EVENT_FIELDS = [
  { id: 'tag', label: 'Category Tag' },
  { id: 'title', label: 'Event Title' },
  { id: 'date', label: 'Display Date' },
  { id: 'eventDate', label: 'Event Date (for sorting)', type: 'date' },
  { id: 'time', label: 'Time (e.g. 10:00 AM)' },
  { id: 'venue', label: 'Venue' },
  { id: 'description', label: 'Description', type: 'textarea', rows: 3 },
  { id: 'image', label: 'Image Path or URL' },
  { id: 'registerUrl', label: 'Registration Link (#join or URL)' },
  { id: 'registerLabel', label: 'Register Button Text' },
  { id: 'forceStatus', label: 'Status: auto, upcoming, or past' }
];

const CORE_FIELDS = [
  { id: 'name', label: 'Name' },
  { id: 'role', label: 'Role' },
  { id: 'img', label: 'Photo Path' },
  { id: 'accent', label: 'Accent' },
  { id: 'lead', label: 'Lead' },
  { id: 'department', label: 'Department: leadership, events, media, technical, finance, operations' }
];

const FACULTY_FIELDS = [
  { id: 'name', label: 'Name' },
  { id: 'designation', label: 'Designation (e.g. Assistant Professor)' },
  { id: 'role', label: 'Role (e.g. Faculty In-Charge, RC Innovation Club)' },
  { id: 'period', label: 'Tenure Period (e.g. 2021 – 2025 or 2026 – Present)' },
  { id: 'description', label: 'Contribution Description', type: 'textarea', rows: 4 },
  { id: 'image', label: 'Photo Path (e.g. assets/team/faculty/name.jpg)' }
];

const AMB_FIELDS = [
  { id: 'label', label: 'Label (e.g. Ambassador)' },
  { id: 'name', label: 'Name' },
  { id: 'period', label: 'Period' },
  { id: 'description', label: 'Description', type: 'textarea', rows: 3 },
  { id: 'image', label: 'Photo Path' }
];

const MEMBER_FIELDS = [{ id: 'name', label: 'Name' }];
const MEMBER_PREV_FIELDS = [
  { id: 'name', label: 'Name' },
  { id: 'role', label: 'Role (optional)' }
];

const LEGACY_FIELDS = [
  { id: 'year', label: 'Year' },
  { id: 'title', label: 'Title' },
  { id: 'description', label: 'Description', type: 'textarea', rows: 3 }
];

const TESTIMONIAL_FIELDS = [
  { id: 'name', label: 'Name' },
  { id: 'role', label: 'Role / Year (e.g. 2nd Year CSE)' },
  { id: 'quote', label: 'Quote', type: 'textarea', rows: 4 },
  { id: 'image', label: 'Photo Path or URL (optional)' },
  { id: 'rating', label: 'Star Rating (1–5, 0 to hide)', type: 'number' }
];

const STATS_FIELDS = [
  { id: 'label', label: 'Label' },
  { id: 'value', label: 'Value', type: 'number' },
  { id: 'prefix', label: 'Prefix (optional, e.g. $)' },
  { id: 'suffix', label: 'Suffix (e.g. +, %)' },
  { id: 'icon', label: 'Icon (Font Awesome class, e.g. fas fa-users)' },
  { id: 'description', label: 'Short Description', type: 'textarea', rows: 2 },
  { id: 'accent', label: 'Accent: sky, indigo, emerald, amber, rose, violet' }
];

const PARTNER_FIELDS = [
  { id: 'name', label: 'Organization Name' },
  { id: 'type', label: 'Type: sponsor, partner, or collaborator' },
  { id: 'logo', label: 'Logo Path or URL' },
  { id: 'url', label: 'Website URL (optional)' },
  { id: 'description', label: 'Short Description', type: 'textarea', rows: 2 }
];

const PROJECT_FIELDS = [
  { id: 'title', label: 'Project Title' },
  { id: 'description', label: 'Description', type: 'textarea', rows: 3 },
  { id: 'image', label: 'Image Path or URL' },
  { id: 'tech', label: 'Tech Stack (comma-separated)' },
  { id: 'status', label: 'Status: completed, in-progress, or planned' },
  { id: 'category', label: 'Category: Web, Robotics, AI, Mobile, IoT, Other' },
  { id: 'githubUrl', label: 'GitHub URL (optional)' },
  { id: 'demoUrl', label: 'Live Demo URL (optional)' },
  { id: 'team', label: 'Team / Members (optional)' }
];

const RESOURCE_FIELDS = [
  { id: 'title', label: 'Resource Title' },
  { id: 'description', label: 'Description', type: 'textarea', rows: 3 },
  { id: 'category', label: 'Category: Tutorial, Workshop, Cheatsheet, Template, Slides, Guide, Other' },
  { id: 'type', label: 'Type: pdf, link, video, slides, doc' },
  { id: 'url', label: 'File Path or URL' },
  { id: 'icon', label: 'Icon (Font Awesome class, optional)' },
  { id: 'tags', label: 'Tags (comma-separated)' }
];


function renderEventsPanel() {
  const s = content.eventsSection;
  const upcoming = window.RC_EVENTS ? RC_EVENTS.getUpcoming(content.events) : [];
  const past = window.RC_EVENTS ? RC_EVENTS.getPast(content.events) : [];
  document.getElementById('panel-events').innerHTML = `
    <div class="admin-card"><h3>Section Header</h3>
      ${field('Eyebrow', 'events-eyebrow', s.eyebrow)}
      ${field('Title', 'events-title', s.title)}
      ${field('Subtitle', 'events-subtitle', s.subtitle, 'textarea')}
      <div class="admin-grid-2">
        ${field('Upcoming Heading', 'events-upcoming-title', s.upcomingTitle || 'Upcoming Events')}
        ${field('Past Heading', 'events-past-title', s.pastTitle || 'Past Events')}
      </div>
      <p class="admin-hint">${upcoming.length} upcoming · ${past.length} past — set Event Date and Status to control placement.</p>
    </div>
    ${listEditor('events', EVENT_FIELDS, 'Events')}
  `;
  bindListEvents('panel-events', 'events', EVENT_FIELDS);
}

function renderFacultyPanel() {
  const s = content.facultySection || {};
  document.getElementById('panel-faculty').innerHTML = `
    <div class="admin-card"><h3>Section Header</h3>
      ${field('Eyebrow', 'faculty-eyebrow', s.eyebrow)}
      ${field('Title', 'faculty-title', s.title)}
      ${field('Subtitle', 'faculty-subtitle', s.subtitle, 'textarea', 3)}
      <p class="admin-hint">Timeline entries appear in the order listed below. Use the arrow buttons to reorder faculty in-charges.</p>
    </div>
    ${listEditor('faculty', FACULTY_FIELDS, 'Faculty In-Charge', { reorderable: true })}
  `;
  bindListEvents('panel-faculty', 'faculty', FACULTY_FIELDS, { reorderable: true });
}

function renderCorePanel() {
  const s = content.coreSection;
  const th = content.teamHierarchySection || {};
  document.getElementById('panel-core').innerHTML = `
    <div class="admin-card"><h3>Section Header</h3>
      ${field('Eyebrow', 'core-eyebrow', s.eyebrow)}
      ${field('Title', 'core-title', s.title)}
      ${field('Subtitle', 'core-subtitle', s.subtitle, 'textarea')}
    </div>
    <div class="admin-card"><h3>Team Hierarchy Filter</h3>
      <label class="admin-checkbox">
        <input type="checkbox" id="team-hierarchy-enabled" ${th.enabled !== false ? 'checked' : ''} />
        Show hierarchy filter bar on homepage
      </label>
      ${field('Filter hint', 'team-hierarchy-hint', th.hint)}
    </div>
    ${listEditor('coreTeam', CORE_FIELDS, 'Core Team Members')}
  `;
  bindListEvents('panel-core', 'coreTeam', CORE_FIELDS);
}

function renderAmbassadorsPanel() {
  const s = content.ambassadorsSection;
  document.getElementById('panel-ambassadors').innerHTML = `
    <div class="admin-card"><h3>Section Header</h3>
      ${field('Eyebrow', 'amb-eyebrow', s.eyebrow)}
      ${field('Title', 'amb-title', s.title)}
      ${field('Subtitle', 'amb-subtitle', s.subtitle, 'textarea')}
    </div>
    ${listEditor('ambassadors', AMB_FIELDS, 'Ambassadors')}
  `;
  bindListEvents('panel-ambassadors', 'ambassadors', AMB_FIELDS);
}

function renderMembersPanel() {
  const s = content.membersSection;
  document.getElementById('panel-members').innerHTML = `
    <div class="admin-card"><h3>Section Header</h3>
      ${field('Eyebrow', 'mem-eyebrow', s.eyebrow)}
      ${field('Title', 'mem-title', s.title)}
      ${field('Subtitle', 'mem-subtitle', s.subtitle, 'textarea')}
      <div class="admin-grid-2">
        ${field('Current Panel Title', 'mem-current-title', s.currentTitle)}
        ${field('Previous Panel Title', 'mem-prev-title', s.previousTitle)}
      </div>
    </div>
    ${listEditor('membersCurrent', MEMBER_FIELDS, 'Current Members')}
    ${listEditor('membersPrevious', MEMBER_PREV_FIELDS, 'Previous Members')}
  `;
  bindListEvents('panel-members', 'membersCurrent', MEMBER_FIELDS);
  bindListEvents('panel-members', 'membersPrevious', MEMBER_PREV_FIELDS);
}

function renderLegacyPanel() {
  const s = content.legacySection;
  document.getElementById('panel-legacy').innerHTML = `
    <div class="admin-card"><h3>Section Header</h3>
      ${field('Eyebrow', 'legacy-eyebrow', s.eyebrow)}
      ${field('Title', 'legacy-title', s.title)}
      ${field('Subtitle', 'legacy-subtitle', s.subtitle, 'textarea')}
    </div>
    ${listEditor('legacy', LEGACY_FIELDS, 'Timeline Items')}
  `;
  bindListEvents('panel-legacy', 'legacy', LEGACY_FIELDS);
}

function renderTestimonialsPanel() {
  const s = content.testimonialsSection || {};
  document.getElementById('panel-testimonials').innerHTML = `
    <div class="admin-card">
      ${field('Eyebrow', 'testimonials-eyebrow', s.eyebrow)}
      ${field('Title', 'testimonials-title', s.title)}
      ${field('Subtitle', 'testimonials-subtitle', s.subtitle, 'textarea', 3)}
    </div>
    ${listEditor('testimonials', TESTIMONIAL_FIELDS, 'Testimonial')}
  `;
  bindListEvents('panel-testimonials', 'testimonials', TESTIMONIAL_FIELDS);
}

function renderPartnersPanel() {
  const s = content.partnersSection || {};
  document.getElementById('panel-partners').innerHTML = `
    <div class="admin-card">
      ${field('Eyebrow', 'partners-eyebrow', s.eyebrow)}
      ${field('Title', 'partners-title', s.title)}
      ${field('Subtitle', 'partners-subtitle', s.subtitle, 'textarea', 3)}
      <p class="admin-hint">Partners are grouped by type: Sponsors, Partners, Collaborators.</p>
    </div>
    ${listEditor('partners', PARTNER_FIELDS, 'Partner / Sponsor')}
  `;
  bindListEvents('panel-partners', 'partners', PARTNER_FIELDS);
}

function renderProjectsPanel() {
  const s = content.projectsSection || {};
  document.getElementById('panel-projects').innerHTML = `
    <div class="admin-card">
      ${field('Eyebrow', 'projects-eyebrow', s.eyebrow)}
      ${field('Title', 'projects-title', s.title)}
      ${field('Subtitle', 'projects-subtitle', s.subtitle, 'textarea', 3)}
    </div>
    ${listEditor('projects', PROJECT_FIELDS, 'Project')}
  `;
  bindListEvents('panel-projects', 'projects', PROJECT_FIELDS);
}

function renderResourcesPanel() {
  const s = content.resourcesSection || {};
  document.getElementById('panel-resources').innerHTML = `
    <div class="admin-card">
      ${field('Eyebrow', 'resources-eyebrow', s.eyebrow)}
      ${field('Title', 'resources-title', s.title)}
      ${field('Subtitle', 'resources-subtitle', s.subtitle, 'textarea', 3)}
      <p class="admin-hint">Add links to PDFs, slides, tutorials, or external learning resources. Leave URL empty for coming-soon items.</p>
    </div>
    ${listEditor('resources', RESOURCE_FIELDS, 'Resource')}
  `;
  bindListEvents('panel-resources', 'resources', RESOURCE_FIELDS);
}

function renderGalleryPanel() {
  if (typeof window.renderGalleryAdminPanel === 'function') {
    window.renderGalleryAdminPanel();
    return;
  }
  const s = content.gallerySection;
  document.getElementById('panel-gallery').innerHTML = `
    <div class="admin-card"><h3>Section Header</h3>
      ${field('Eyebrow', 'gallery-eyebrow', s.eyebrow)}
      ${field('Title', 'gallery-title', s.title)}
      ${field('Subtitle', 'gallery-subtitle', s.subtitle, 'textarea')}
    </div>
    <p class="admin-hint">Load gallery-admin.js for full media management.</p>
  `;
}

function renderJoinPanel() {
  const j = content.join;
  const f = content.footer;
  const soc = content.social;
  document.getElementById('panel-join').innerHTML = `
    <div class="admin-card"><h3>Join Section</h3>
      ${field('Eyebrow', 'join-eyebrow', j.eyebrow)}
      ${field('Title', 'join-title', j.title)}
      ${field('Description', 'join-desc', j.description, 'textarea', 3)}
      <div class="admin-grid-2">
        ${field('Instagram Button', 'join-btn-ig', j.btnInstagram)}
        ${field('WhatsApp Button', 'join-btn-wa', j.btnWhatsapp)}
      </div>
    </div>
    <div class="admin-card"><h3>Footer & Social Links</h3>
      ${field('Brand Name', 'footer-brand', f.brand)}
      ${field('Footer Description', 'footer-desc', f.description, 'textarea', 3)}
      ${field('Email', 'footer-email', f.email)}
      ${field('Copyright Text', 'footer-copy', f.copyright)}
      ${field('Instagram URL', 'social-ig', soc.instagram)}
      ${field('WhatsApp URL', 'social-wa', soc.whatsapp)}
    </div>
  `;
}

function membershipStatusBadge(status) {
  const labels = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected' };
  return `<span class="admin-status admin-status--${status}">${labels[status] || status}</span>`;
}

function membershipRegStatusLabel() {
  if (!window.RC_MEMBERSHIP) return 'Unknown';
  const status = RC_MEMBERSHIP.getRegistrationStatus();
  const map = { open: 'Open', closed: 'Closed', upcoming: 'Upcoming (not yet open)', disabled: 'Disabled' };
  return map[status] || status;
}

function renderMembershipPanel() {
  const reg = content.registration || {};
  const allApps = RC_MEMBERSHIP.getApplications();
  const filtered = RC_MEMBERSHIP.filterApplications(membershipFilters);
  const counts = {
    total: allApps.length,
    pending: allApps.filter((a) => a.status === 'pending').length,
    approved: allApps.filter((a) => a.status === 'approved').length,
    rejected: allApps.filter((a) => a.status === 'rejected').length
  };

  document.getElementById('panel-membership').innerHTML = `
    <div class="admin-card">
      <h3>Registration Period</h3>
      <label class="admin-checkbox" style="margin-bottom:1rem;">
        <input type="checkbox" id="reg-enabled" ${reg.enabled ? 'checked' : ''} />
        Enable membership registration
      </label>
      <div class="admin-grid-2">
        ${field('Start Date', 'reg-start', reg.startDate, 'date')}
        ${field('End Date', 'reg-end', reg.endDate, 'date')}
      </div>
      ${field('Not Open Yet Message', 'reg-upcoming-msg', reg.upcomingMessage, 'textarea', 2)}
      ${field('Expired / Closed Message', 'reg-expired-msg', reg.expiredMessage || reg.closedMessage, 'textarea', 2)}
      ${field('Disabled Message', 'reg-disabled-msg', reg.disabledMessage, 'textarea', 2)}
      ${field('Success Message', 'reg-success-msg', reg.successMessage, 'textarea', 2)}
      <p class="admin-hint">Students see the matching message when registration is upcoming, expired, or turned off.</p>
      <div class="admin-actions" style="margin-top:1rem;">
        <button type="button" class="admin-btn admin-btn--primary" id="reg-save-btn">
          <i class="fas fa-save"></i> Save Registration Settings
        </button>
      </div>
      <p class="admin-hint">
        Current status: <strong class="admin-reg-status admin-reg-status--${RC_MEMBERSHIP.getRegistrationStatus()}">${membershipRegStatusLabel()}</strong>
        — The "Join RC Innovation Club" button appears only when registration is open within the set dates.
      </p>
    </div>

    <div class="admin-card">
      <div class="admin-membership-header">
        <h3 style="margin:0">Applications (${filtered.length}${filtered.length !== counts.total ? ` of ${counts.total}` : ''})</h3>
        <div class="admin-actions">
          <button type="button" class="admin-btn admin-btn--success" id="export-apps-btn">
            <i class="fas fa-file-excel"></i> Export to Excel
          </button>
        </div>
      </div>

      <div class="admin-membership-stats">
        <span><strong>${counts.total}</strong> Total</span>
        <span><strong>${counts.pending}</strong> Pending</span>
        <span><strong>${counts.approved}</strong> Approved</span>
        <span><strong>${counts.rejected}</strong> Rejected</span>
      </div>

      <div class="admin-membership-filters">
        <div class="admin-field" style="margin:0;flex:1;min-width:200px;">
          <input type="search" id="app-search" placeholder="Search by name, enrollment, email…" value="${esc(membershipFilters.search)}" />
        </div>
        <div class="admin-field" style="margin:0;width:auto;">
          <select id="app-status-filter">
            <option value="all" ${membershipFilters.status === 'all' ? 'selected' : ''}>All Status</option>
            <option value="pending" ${membershipFilters.status === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="approved" ${membershipFilters.status === 'approved' ? 'selected' : ''}>Approved</option>
            <option value="rejected" ${membershipFilters.status === 'rejected' ? 'selected' : ''}>Rejected</option>
          </select>
        </div>
      </div>

      <div class="admin-table-wrap">
        ${filtered.length ? `
          <table class="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Enrollment</th>
                <th>Course</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map((app) => `
                <tr>
                  <td>
                    <strong>${esc(app.name)}</strong>
                    ${app.skills ? `<br><small class="admin-table-meta">Skills: ${esc(app.skills)}</small>` : ''}
                    ${app.interests ? `<br><small class="admin-table-meta">Interests: ${esc(app.interests)}</small>` : ''}
                    ${app.reason ? `<br><small class="admin-table-meta">Reason: ${esc(app.reason).slice(0, 80)}${app.reason.length > 80 ? '…' : ''}</small>` : ''}
                  </td>
                  <td>${esc(app.enrollmentNumber)}<br><small class="admin-table-meta">${esc(app.semester)}</small></td>
                  <td>${esc(app.course)}</td>
                  <td>
                    <a href="mailto:${esc(app.email)}" class="admin-table-link">${esc(app.email)}</a><br>
                    <small class="admin-table-meta">${esc(app.phone)}</small>
                  </td>
                  <td>${membershipStatusBadge(app.status)}</td>
                  <td><small>${esc(RC_MEMBERSHIP.formatDate(app.submittedAt))}</small></td>
                  <td>
                    <div class="admin-table-actions">
                      ${app.status !== 'approved' ? `<button type="button" class="admin-btn admin-btn--success admin-btn--sm" data-approve="${esc(app.id)}" title="Approve"><i class="fas fa-check"></i></button>` : ''}
                      ${app.status !== 'rejected' ? `<button type="button" class="admin-btn admin-btn--danger admin-btn--sm" data-reject="${esc(app.id)}" title="Reject"><i class="fas fa-times"></i></button>` : ''}
                      ${app.status !== 'pending' ? `<button type="button" class="admin-btn admin-btn--sm" data-pending="${esc(app.id)}" title="Mark Pending"><i class="fas fa-undo"></i></button>` : ''}
                      <button type="button" class="admin-btn admin-btn--danger admin-btn--sm" data-delete="${esc(app.id)}" title="Delete"><i class="fas fa-trash"></i></button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : `<p style="color:var(--admin-muted);text-align:center;padding:2rem 0;">No applications found.</p>`}
      </div>
    </div>
  `;

  document.getElementById('reg-save-btn')?.addEventListener('click', async () => {
    collectAllForms();
    await RC_CMS.saveContent(content);
    renderMembershipPanel();
    toast('Registration settings saved.');
  });

  document.getElementById('export-apps-btn')?.addEventListener('click', () => {
    const apps = RC_MEMBERSHIP.filterApplications(membershipFilters);
    if (!apps.length) {
      toast('No applications to export.');
      return;
    }
    RC_MEMBERSHIP.exportToExcel(apps);
    toast(`Exported ${apps.length} application(s).`);
  });

  let searchTimer;
  document.getElementById('app-search')?.addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      membershipFilters.search = e.target.value;
      renderMembershipPanel();
    }, 300);
  });

  document.getElementById('app-status-filter')?.addEventListener('change', (e) => {
    membershipFilters.status = e.target.value;
    renderMembershipPanel();
  });

  document.querySelectorAll('[data-approve]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await RC_MEMBERSHIP.updateStatus(btn.dataset.approve, 'approved');
      renderMembershipPanel();
      toast('Application approved.');
    });
  });

  document.querySelectorAll('[data-reject]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await RC_MEMBERSHIP.updateStatus(btn.dataset.reject, 'rejected');
      renderMembershipPanel();
      toast('Application rejected.');
    });
  });

  document.querySelectorAll('[data-pending]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await RC_MEMBERSHIP.updateStatus(btn.dataset.pending, 'pending');
      renderMembershipPanel();
      toast('Application marked as pending.');
    });
  });

  document.querySelectorAll('[data-delete]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this application permanently?')) return;
      await RC_MEMBERSHIP.deleteApplication(btn.dataset.delete);
      renderMembershipPanel();
      toast('Application deleted.');
    });
  });
}

function contactStatusBadge(status) {
  return status === 'read'
    ? '<span class="admin-status admin-status--approved">Read</span>'
    : '<span class="admin-status admin-status--pending">Unread</span>';
}

function renderContactPanel() {
  if (!window.RC_CONTACT) return;
  const s = content.contactSection || {};
  const all = RC_CONTACT.getMessages();
  const filtered = RC_CONTACT.filterMessages(contactFilters);
  const unread = all.filter((m) => m.status === 'unread').length;

  document.getElementById('panel-contact').innerHTML = `
    <div class="admin-card">
      <h3>Contact Section</h3>
      ${field('Eyebrow', 'contact-eyebrow', s.eyebrow)}
      ${field('Title', 'contact-title', s.title)}
      ${field('Subtitle', 'contact-subtitle', s.subtitle, 'textarea', 3)}
      ${field('Success Message', 'contact-success', s.successMessage, 'textarea', 2)}
      <div class="admin-grid-2">
        ${field('Name Label', 'contact-name-label', s.nameLabel)}
        ${field('Email Label', 'contact-email-label', s.emailLabel)}
        ${field('Subject Label', 'contact-subject-label', s.subjectLabel)}
        ${field('Message Label', 'contact-message-label', s.messageLabel)}
      </div>
      ${field('Submit Button', 'contact-submit-label', s.submitLabel)}
      <div class="admin-actions" style="margin-top:1rem;">
        <button type="button" class="admin-btn admin-btn--primary" id="contact-settings-save">
          <i class="fas fa-save"></i> Save Contact Settings
        </button>
      </div>
    </div>

    <div class="admin-card">
      <div class="admin-membership-header">
        <h3 style="margin:0">Messages (${filtered.length}${filtered.length !== all.length ? ` of ${all.length}` : ''})</h3>
        <div class="admin-actions">
          <button type="button" class="admin-btn admin-btn--success" id="export-contact-btn">
            <i class="fas fa-file-excel"></i> Export to Excel
          </button>
        </div>
      </div>
      <p class="admin-hint">${unread} unread message(s)</p>

      <div class="admin-membership-filters">
        <div class="admin-field" style="margin:0;flex:1;min-width:200px;">
          <input type="search" id="contact-search" placeholder="Search messages…" value="${esc(contactFilters.search)}" />
        </div>
        <div class="admin-field" style="margin:0;width:auto;">
          <select id="contact-status-filter">
            <option value="all" ${contactFilters.status === 'all' ? 'selected' : ''}>All</option>
            <option value="unread" ${contactFilters.status === 'unread' ? 'selected' : ''}>Unread</option>
            <option value="read" ${contactFilters.status === 'read' ? 'selected' : ''}>Read</option>
          </select>
        </div>
        <div class="admin-field" style="margin:0;width:auto;">
          <select id="contact-subject-filter">
            <option value="all">All Subjects</option>
            ${RC_CONTACT.SUBJECTS.map((sub) => `<option value="${esc(sub)}" ${contactFilters.subject === sub ? 'selected' : ''}>${esc(sub)}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="admin-table-wrap">
        ${filtered.length ? `
          <table class="admin-table">
            <thead>
              <tr>
                <th>From</th>
                <th>Subject</th>
                <th>Message</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map((msg) => `
                <tr class="${msg.status === 'unread' ? 'admin-row--unread' : ''}">
                  <td>
                    <strong>${esc(msg.name)}</strong><br>
                    <a href="mailto:${esc(msg.email)}" class="admin-table-link">${esc(msg.email)}</a>
                  </td>
                  <td>${esc(msg.subject)}</td>
                  <td><small class="admin-table-meta">${esc(msg.message).slice(0, 120)}${msg.message.length > 120 ? '…' : ''}</small></td>
                  <td>${contactStatusBadge(msg.status)}</td>
                  <td><small>${esc(RC_CONTACT.formatDate(msg.submittedAt))}</small></td>
                  <td>
                    <div class="admin-table-actions">
                      ${msg.status === 'unread' ? `<button type="button" class="admin-btn admin-btn--success admin-btn--sm" data-contact-read="${esc(msg.id)}" title="Mark read"><i class="fas fa-check"></i></button>` : `<button type="button" class="admin-btn admin-btn--sm" data-contact-unread="${esc(msg.id)}" title="Mark unread"><i class="fas fa-envelope"></i></button>`}
                      <button type="button" class="admin-btn admin-btn--danger admin-btn--sm" data-contact-del="${esc(msg.id)}" title="Delete"><i class="fas fa-trash"></i></button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : '<p style="color:var(--admin-muted);text-align:center;padding:2rem 0;">No messages found.</p>'}
      </div>
    </div>
  `;

  document.getElementById('contact-settings-save')?.addEventListener('click', async () => {
    collectAllForms();
    await RC_CMS.saveContent(content);
    toast('Contact settings saved.');
  });

  document.getElementById('export-contact-btn')?.addEventListener('click', () => {
    const list = RC_CONTACT.filterMessages(contactFilters);
    if (!list.length) {
      toast('No messages to export.');
      return;
    }
    RC_CONTACT.exportToExcel(list);
    toast(`Exported ${list.length} message(s).`);
  });

  let contactSearchTimer;
  document.getElementById('contact-search')?.addEventListener('input', (e) => {
    clearTimeout(contactSearchTimer);
    contactSearchTimer = setTimeout(() => {
      contactFilters.search = e.target.value;
      renderContactPanel();
    }, 300);
  });

  document.getElementById('contact-status-filter')?.addEventListener('change', (e) => {
    contactFilters.status = e.target.value;
    renderContactPanel();
  });

  document.getElementById('contact-subject-filter')?.addEventListener('change', (e) => {
    contactFilters.subject = e.target.value;
    renderContactPanel();
  });

  document.querySelectorAll('[data-contact-read]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await RC_CONTACT.updateStatus(btn.dataset.contactRead, 'read');
      renderContactPanel();
      toast('Marked as read.');
    });
  });

  document.querySelectorAll('[data-contact-unread]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await RC_CONTACT.updateStatus(btn.dataset.contactUnread, 'unread');
      renderContactPanel();
      toast('Marked as unread.');
    });
  });

  document.querySelectorAll('[data-contact-del]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this message permanently?')) return;
      await RC_CONTACT.deleteMessage(btn.dataset.contactDel);
      renderContactPanel();
      toast('Message deleted.');
    });
  });
}

function certStatusBadge(status) {
  return status === 'revoked'
    ? '<span class="admin-status admin-status--rejected">Revoked</span>'
    : '<span class="admin-status admin-status--approved">Active</span>';
}

function renderCertificatesPanel() {
  if (!window.RC_CERTIFICATES) return;
  const s = content.certificatesSection || {};
  const all = RC_CERTIFICATES.getCertificates();
  const filtered = RC_CERTIFICATES.filterCertificates(certificateFilters);
  const active = all.filter((c) => c.status === 'active').length;

  document.getElementById('panel-certificates').innerHTML = `
    <div class="admin-card">
      <h3>Verification Section</h3>
      <label class="admin-checkbox">
        <input type="checkbox" id="cert-enabled" ${s.enabled !== false ? 'checked' : ''} />
        Show certificate verification on homepage
      </label>
      ${field('Eyebrow', 'cert-eyebrow', s.eyebrow)}
      ${field('Title', 'cert-title', s.title)}
      ${field('Subtitle', 'cert-subtitle', s.subtitle, 'textarea', 3)}
      <div class="admin-grid-2">
        ${field('Verify Label', 'cert-verify-label', s.verifyLabel)}
        ${field('Verify Button', 'cert-verify-btn-label', s.verifyButton)}
        ${field('Input Placeholder', 'cert-verify-placeholder', s.verifyPlaceholder)}
        ${field('Input Hint', 'cert-verify-hint', s.verifyHint)}
      </div>
      <div class="admin-grid-2">
        ${field('Issuer Name', 'cert-issuer-name', s.issuerName)}
        ${field('Issuer Title', 'cert-issuer-title', s.issuerTitle)}
      </div>
      ${field('Valid Message', 'cert-valid-msg', s.validMessage, 'textarea', 2)}
      ${field('Invalid Message', 'cert-invalid-msg', s.invalidMessage, 'textarea', 2)}
      ${field('Revoked Message', 'cert-revoked-msg', s.revokedMessage, 'textarea', 2)}
    </div>

    <div class="admin-card">
      <h3>Issue New Certificate</h3>
      <p class="admin-hint">Certificates are saved immediately. Click Save Changes to update section text on the homepage.</p>
      <div class="admin-grid-2">
        <div class="admin-field">
          <label for="cert-issue-name">Recipient Name *</label>
          <input type="text" id="cert-issue-name" placeholder="Student full name" />
        </div>
        <div class="admin-field">
          <label for="cert-issue-type">Type *</label>
          <select id="cert-issue-type">
            ${Object.entries(RC_CERTIFICATES.TYPES).map(([id, label]) =>
              `<option value="${id}">${esc(label)}</option>`
            ).join('')}
          </select>
        </div>
        <div class="admin-field">
          <label for="cert-issue-event">Event / Program *</label>
          <input type="text" id="cert-issue-event" placeholder="e.g. Python Jam 2025" />
        </div>
        <div class="admin-field">
          <label for="cert-issue-date">Issue Date</label>
          <input type="date" id="cert-issue-date" value="${new Date().toISOString().slice(0, 10)}" />
        </div>
      </div>
      <div class="admin-field">
        <label for="cert-issue-desc">Description (optional)</label>
        <textarea id="cert-issue-desc" rows="2" placeholder="Short note printed on the certificate"></textarea>
      </div>
      <div class="admin-actions">
        <button type="button" class="admin-btn admin-btn--success" id="cert-issue-btn">
          <i class="fas fa-plus"></i> Issue Certificate
        </button>
      </div>
      <div class="admin-error" id="cert-issue-error" style="margin-top:0.75rem;"></div>
    </div>

    <div class="admin-card">
      <div class="admin-card__header">
        <h3>Issued Certificates (${all.length} total · ${active} active)</h3>
        <div class="admin-actions">
          <button type="button" class="admin-btn" id="cert-export-btn"><i class="fas fa-download"></i> Export CSV</button>
        </div>
      </div>
      <div class="admin-filters">
        <div class="admin-field" style="margin:0;flex:1;">
          <input type="search" id="cert-search" placeholder="Search by ID, name, event…" value="${esc(certificateFilters.search)}" />
        </div>
        <div class="admin-field" style="margin:0;width:auto;">
          <select id="cert-type-filter">
            <option value="all" ${certificateFilters.type === 'all' ? 'selected' : ''}>All types</option>
            ${Object.entries(RC_CERTIFICATES.TYPES).map(([id, label]) =>
              `<option value="${id}" ${certificateFilters.type === id ? 'selected' : ''}>${esc(label)}</option>`
            ).join('')}
          </select>
        </div>
        <div class="admin-field" style="margin:0;width:auto;">
          <select id="cert-status-filter">
            <option value="all" ${certificateFilters.status === 'all' ? 'selected' : ''}>All statuses</option>
            <option value="active" ${certificateFilters.status === 'active' ? 'selected' : ''}>Active</option>
            <option value="revoked" ${certificateFilters.status === 'revoked' ? 'selected' : ''}>Revoked</option>
          </select>
        </div>
      </div>
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Recipient</th>
              <th>Type</th>
              <th>Event</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.length ? filtered.map((c) => `
              <tr>
                <td><code>${esc(c.id)}</code></td>
                <td>${esc(c.recipientName)}</td>
                <td>${esc(RC_CERTIFICATES.getTypeLabel(c.type))}</td>
                <td>${esc(c.eventTitle)}</td>
                <td>${esc(RC_CERTIFICATES.formatDate(c.issueDate))}</td>
                <td>${certStatusBadge(c.status)}</td>
                <td class="admin-table__actions">
                  <button type="button" class="admin-btn admin-btn--sm" data-cert-download="${esc(c.id)}" title="Download"><i class="fas fa-download"></i></button>
                  <button type="button" class="admin-btn admin-btn--sm" data-cert-copy="${esc(c.id)}" title="Copy verify link"><i class="fas fa-link"></i></button>
                  ${c.status === 'active'
                    ? `<button type="button" class="admin-btn admin-btn--sm admin-btn--danger" data-cert-revoke="${esc(c.id)}" title="Revoke"><i class="fas fa-ban"></i></button>`
                    : `<button type="button" class="admin-btn admin-btn--sm admin-btn--success" data-cert-activate="${esc(c.id)}" title="Reactivate"><i class="fas fa-check"></i></button>`
                  }
                  <button type="button" class="admin-btn admin-btn--sm admin-btn--danger" data-cert-delete="${esc(c.id)}" title="Delete"><i class="fas fa-trash"></i></button>
                </td>
              </tr>
            `).join('') : '<tr><td colspan="7" style="text-align:center;color:var(--admin-muted);padding:2rem;">No certificates match your filters.</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById('cert-issue-btn')?.addEventListener('click', async () => {
    const errEl = document.getElementById('cert-issue-error');
    if (errEl) errEl.classList.remove('show');
    const result = await RC_CERTIFICATES.issueCertificate({
      recipientName: document.getElementById('cert-issue-name')?.value || '',
      type: document.getElementById('cert-issue-type')?.value || 'participation',
      eventTitle: document.getElementById('cert-issue-event')?.value || '',
      description: document.getElementById('cert-issue-desc')?.value || '',
      issueDate: document.getElementById('cert-issue-date')?.value || ''
    });
    if (!result.ok) {
      if (errEl) {
        errEl.textContent = result.error;
        errEl.classList.add('show');
      }
      return;
    }
    document.getElementById('cert-issue-name').value = '';
    document.getElementById('cert-issue-event').value = '';
    document.getElementById('cert-issue-desc').value = '';
    toast(`Certificate issued: ${result.certificate.id}`);
    renderCertificatesPanel();
  });

  document.getElementById('cert-export-btn')?.addEventListener('click', () => {
    const list = RC_CERTIFICATES.filterCertificates(certificateFilters);
    if (!list.length) {
      toast('No certificates to export.');
      return;
    }
    RC_CERTIFICATES.exportCsv(list);
    toast('CSV exported.');
  });

  let certSearchTimer;
  document.getElementById('cert-search')?.addEventListener('input', (e) => {
    clearTimeout(certSearchTimer);
    certSearchTimer = setTimeout(() => {
      certificateFilters.search = e.target.value;
      renderCertificatesPanel();
    }, 300);
  });

  document.getElementById('cert-type-filter')?.addEventListener('change', (e) => {
    certificateFilters.type = e.target.value;
    renderCertificatesPanel();
  });

  document.getElementById('cert-status-filter')?.addEventListener('change', (e) => {
    certificateFilters.status = e.target.value;
    renderCertificatesPanel();
  });

  document.querySelectorAll('[data-cert-download]').forEach((btn) => {
    btn.addEventListener('click', () => RC_CERTIFICATES.openPrintWindow(btn.dataset.certDownload));
  });

  document.querySelectorAll('[data-cert-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const url = `${window.location.origin}${window.location.pathname.replace('admin.html', 'index.html')}?cert=${encodeURIComponent(btn.dataset.certCopy)}#certificates`;
      try {
        await navigator.clipboard.writeText(url);
        toast('Verify link copied.');
      } catch {
        window.prompt('Copy verify link:', url);
      }
    });
  });

  document.querySelectorAll('[data-cert-revoke]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Revoke this certificate? It will fail public verification.')) return;
      await RC_CERTIFICATES.updateStatus(btn.dataset.certRevoke, 'revoked');
      renderCertificatesPanel();
      toast('Certificate revoked.');
    });
  });

  document.querySelectorAll('[data-cert-activate]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await RC_CERTIFICATES.updateStatus(btn.dataset.certActivate, 'active');
      renderCertificatesPanel();
      toast('Certificate reactivated.');
    });
  });

  document.querySelectorAll('[data-cert-delete]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this certificate permanently?')) return;
      await RC_CERTIFICATES.deleteCertificate(btn.dataset.certDelete);
      renderCertificatesPanel();
      toast('Certificate deleted.');
    });
  });
}

function renderNewsletterPanel() {
  if (!window.RC_NEWSLETTER) return;
  const announce = content.announcementBar || {};
  const news = content.newsletterSection || {};
  const allSubs = RC_NEWSLETTER.getSubscribers();
  const filteredSubs = RC_NEWSLETTER.filterSubscribers(newsletterFilters);

  document.getElementById('panel-newsletter').innerHTML = `
    <div class="admin-card">
      <h3>Announcement Bar</h3>
      <p class="admin-hint">Top banner shown on the homepage. Visitors can dismiss it; changing the Announcement ID shows it again to everyone.</p>
      <label class="admin-checkbox" style="margin-bottom:1rem;">
        <input type="checkbox" id="announce-enabled" ${announce.enabled !== false ? 'checked' : ''} />
        Show announcement bar
      </label>
      <div class="admin-grid-2">
        ${field('Announcement ID', 'announce-id', announce.announcementId || 'default')}
        ${field('Style', 'announce-variant', announce.variant || 'accent')}
      </div>
      ${field('Message', 'announce-message', announce.message, 'textarea', 2)}
      <div class="admin-grid-2">
        ${field('Link URL', 'announce-link-url', announce.linkUrl)}
        ${field('Link Label', 'announce-link-label', announce.linkLabel)}
      </div>
      <label class="admin-checkbox" style="margin:0.5rem 0 1rem;">
        <input type="checkbox" id="announce-dismissible" ${announce.dismissible !== false ? 'checked' : ''} />
        Allow visitors to dismiss
      </label>
      <div class="admin-actions">
        <button type="button" class="admin-btn admin-btn--primary" id="announce-settings-save">
          <i class="fas fa-save"></i> Save Announcement
        </button>
        <button type="button" class="admin-btn" id="announce-clear-dismiss">
          <i class="fas fa-redo"></i> Reset Dismissals
        </button>
      </div>
      <p class="admin-hint" style="margin-top:0.75rem;">Variants: <code>accent</code>, <code>info</code>, <code>warning</code>, <code>success</code></p>
    </div>

    <div class="admin-card">
      <h3>Newsletter Section</h3>
      <label class="admin-checkbox" style="margin-bottom:1rem;">
        <input type="checkbox" id="newsletter-enabled" ${news.enabled !== false ? 'checked' : ''} />
        Show newsletter signup on homepage
      </label>
      ${field('Title', 'newsletter-title', news.title)}
      ${field('Subtitle', 'newsletter-subtitle', news.subtitle, 'textarea', 2)}
      <div class="admin-grid-2">
        ${field('Email Placeholder', 'newsletter-placeholder', news.placeholder)}
        ${field('Button Label', 'newsletter-btn-label', news.buttonLabel)}
      </div>
      ${field('Success Message', 'newsletter-success', news.successMessage, 'textarea', 2)}
      ${field('Privacy Note', 'newsletter-privacy', news.privacyNote)}
      <div class="admin-actions" style="margin-top:1rem;">
        <button type="button" class="admin-btn admin-btn--primary" id="newsletter-settings-save">
          <i class="fas fa-save"></i> Save Newsletter Settings
        </button>
      </div>
    </div>

    <div class="admin-card">
      <div class="admin-membership-header">
        <h3 style="margin:0">Subscribers (${filteredSubs.length}${filteredSubs.length !== allSubs.length ? ` of ${allSubs.length}` : ''})</h3>
        <div class="admin-actions">
          <button type="button" class="admin-btn admin-btn--success" id="export-newsletter-btn">
            <i class="fas fa-file-excel"></i> Export to Excel
          </button>
        </div>
      </div>

      <div class="admin-membership-filters">
        <div class="admin-field" style="margin:0;flex:1;min-width:200px;">
          <input type="search" id="newsletter-search" placeholder="Search by email…" value="${esc(newsletterFilters.search)}" />
        </div>
      </div>

      <div class="admin-table-wrap">
        ${filteredSubs.length ? `
          <table class="admin-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Subscribed</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${filteredSubs.map((sub) => `
                <tr>
                  <td><a href="mailto:${esc(sub.email)}" class="admin-table-link">${esc(sub.email)}</a></td>
                  <td><small>${esc(RC_NEWSLETTER.formatDate(sub.subscribedAt))}</small></td>
                  <td>
                    <button type="button" class="admin-btn admin-btn--danger admin-btn--sm" data-newsletter-del="${esc(sub.id)}" title="Delete">
                      <i class="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : '<p style="color:var(--admin-muted);text-align:center;padding:2rem 0;">No subscribers yet.</p>'}
      </div>
    </div>
  `;

  document.getElementById('announce-settings-save')?.addEventListener('click', () => {
    collectAllForms();
    RC_CMS.saveContent(content);
    toast('Announcement settings saved.');
  });

  document.getElementById('announce-clear-dismiss')?.addEventListener('click', () => {
    if (!window.RC_ANNOUNCE) return;
    if (!confirm('Clear all visitor dismissals? The announcement bar will show again for everyone.')) return;
    RC_ANNOUNCE.clearDismissed();
    toast('Dismissals cleared.');
  });

  document.getElementById('newsletter-settings-save')?.addEventListener('click', async () => {
    collectAllForms();
    await RC_CMS.saveContent(content);
    toast('Newsletter settings saved.');
  });

  document.getElementById('export-newsletter-btn')?.addEventListener('click', () => {
    const list = RC_NEWSLETTER.filterSubscribers(newsletterFilters);
    if (!list.length) {
      toast('No subscribers to export.');
      return;
    }
    RC_NEWSLETTER.exportToExcel(list);
    toast(`Exported ${list.length} subscriber(s).`);
  });

  let newsletterSearchTimer;
  document.getElementById('newsletter-search')?.addEventListener('input', (e) => {
    clearTimeout(newsletterSearchTimer);
    newsletterSearchTimer = setTimeout(() => {
      newsletterFilters.search = e.target.value;
      renderNewsletterPanel();
    }, 300);
  });

  document.querySelectorAll('[data-newsletter-del]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Remove this subscriber?')) return;
      await RC_NEWSLETTER.deleteSubscriber(btn.dataset.newsletterDel);
      renderNewsletterPanel();
      toast('Subscriber removed.');
    });
  });
}

function seoPlatformCheckboxes(selected) {
  const active = Array.isArray(selected) ? selected : [];
  return `<div class="admin-share-platforms">${SEO_PLATFORMS.map((p) => `
    <label class="admin-checkbox admin-checkbox--inline">
      <input type="checkbox" id="seo-platform-${p}" ${active.includes(p) ? 'checked' : ''} />
      ${p.charAt(0).toUpperCase() + p.slice(1)}
    </label>
  `).join('')}</div>`;
}

function renderNotificationsPanel() {
  if (!window.RC_EMAIL_NOTIFY) return;
  const cfg = content.notificationsSection || RC_EMAIL_NOTIFY.getConfig();
  const log = RC_EMAIL_NOTIFY.getLog();

  const logRows = log.length ? log.map((entry) => `
    <tr>
      <td>${esc(RC_EMAIL_NOTIFY.formatDate(entry.at))}</td>
      <td>${esc(entry.type)}</td>
      <td>${RC_EMAIL_NOTIFY.statusBadge(entry.status)}</td>
      <td>${esc(entry.subject || '—')}</td>
      <td>${entry.replyTo ? esc(entry.replyTo) : '—'}</td>
      <td class="admin-table__actions">
        ${entry.mailto ? `<a href="${entry.mailto}" class="admin-btn admin-btn--sm" title="Open mailto"><i class="fas fa-envelope"></i></a>` : ''}
        ${entry.error ? `<span class="admin-hint" title="${esc(entry.error)}"><i class="fas fa-circle-info"></i></span>` : ''}
      </td>
    </tr>
  `).join('') : '<tr><td colspan="6" style="text-align:center;color:var(--admin-muted);padding:1.5rem;">No notification attempts logged yet.</td></tr>';

  document.getElementById('panel-notifications').innerHTML = `
    <div class="admin-card">
      <h3>Email Notification Settings</h3>
      <label class="admin-checkbox">
        <input type="checkbox" id="notify-enabled" ${cfg.enabled !== false ? 'checked' : ''} />
        Enable email notifications on form submissions
      </label>
      <div class="admin-field">
        <label for="notify-provider">Delivery method</label>
        <select id="notify-provider">
          <option value="web3forms" ${cfg.provider === 'web3forms' ? 'selected' : ''}>Web3Forms (recommended — real email)</option>
          <option value="mailto" ${cfg.provider === 'mailto' ? 'selected' : ''}>Mailto log only (manual send from admin)</option>
          <option value="off" ${cfg.provider === 'off' ? 'selected' : ''}>Off (log only, no delivery)</option>
        </select>
      </div>
      ${field('Club notification email', 'notify-email', cfg.notifyEmail)}
      ${field('Web3Forms access key', 'notify-web3forms-key', cfg.web3formsAccessKey)}
      <p class="admin-hint">${esc(cfg.setupHint || 'Get a free access key at web3forms.com. The key is tied to the inbox that receives alerts.')}</p>
      <div class="admin-grid-2">
        <label class="admin-checkbox">
          <input type="checkbox" id="notify-on-contact" ${cfg.notifyOnContact !== false ? 'checked' : ''} />
          Notify on contact form submissions
        </label>
        <label class="admin-checkbox">
          <input type="checkbox" id="notify-on-membership" ${cfg.notifyOnMembership !== false ? 'checked' : ''} />
          Notify on membership applications
        </label>
      </div>
      ${field('Contact email subject', 'notify-contact-subject', cfg.contactSubject)}
      ${field('Membership email subject', 'notify-membership-subject', cfg.membershipSubject)}
      <p class="admin-hint">Subject placeholders: contact — <code>{name}</code>, <code>{subject}</code>, <code>{email}</code> · membership — <code>{name}</code>, <code>{enrollment}</code>, <code>{email}</code></p>
      <div class="admin-actions" style="margin-top:1rem;">
        <button type="button" class="admin-btn admin-btn--success" id="notify-test-btn"><i class="fas fa-paper-plane"></i> Send Test Email</button>
        <span class="admin-hint" id="notify-test-result" style="margin:0;"></span>
      </div>
    </div>

    <div class="admin-card">
      <div class="admin-card__header">
        <h3>Notification Log (${log.length})</h3>
        <button type="button" class="admin-btn admin-btn--danger" id="notify-clear-log-btn"><i class="fas fa-trash"></i> Clear Log</button>
      </div>
      <p class="admin-hint">Form data is always saved in Contact / Membership panels. This log tracks email delivery attempts.</p>
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr><th>Date</th><th>Type</th><th>Status</th><th>Subject</th><th>Reply-To</th><th></th></tr>
          </thead>
          <tbody>${logRows}</tbody>
        </table>
      </div>
    </div>

    <div class="admin-card">
      <h3>Setup guide (Web3Forms)</h3>
      <ol style="color:var(--admin-muted);line-height:1.8;padding-left:1.25rem;margin:0;">
        <li>Go to <a href="https://web3forms.com" target="_blank" rel="noopener">web3forms.com</a> and create a free access key.</li>
        <li>Link the key to <strong>${esc(cfg.notifyEmail || 'rcinnovationclub@gmail.com')}</strong> (or your club inbox).</li>
        <li>Paste the access key above and click <strong>Save Changes</strong>.</li>
        <li>Use <strong>Send Test Email</strong> to verify delivery.</li>
        <li>Submit a test contact or membership form on the public site.</li>
      </ol>
    </div>
  `;

  document.getElementById('notify-test-btn')?.addEventListener('click', async () => {
    collectAllForms();
    RC_CMS.saveContent(content);
    const resultEl = document.getElementById('notify-test-result');
    if (resultEl) resultEl.textContent = 'Sending…';
    const result = await RC_EMAIL_NOTIFY.sendTest();
    if (resultEl) {
      resultEl.textContent = result.ok
        ? (result.mailto ? 'Mailto entry logged — open from log below.' : 'Test email sent!')
        : `Failed: ${result.error || 'unknown error'}`;
    }
    renderNotificationsPanel();
    toast(result.ok ? 'Test notification sent.' : 'Test notification failed.');
  });

  document.getElementById('notify-clear-log-btn')?.addEventListener('click', () => {
    if (!confirm('Clear the notification log?')) return;
    RC_EMAIL_NOTIFY.clearLog();
    renderNotificationsPanel();
    toast('Notification log cleared.');
  });
}

function renderAnalyticsPanel() {
  if (!window.RC_ANALYTICS) return;
  const cfg = content.analyticsSection || RC_ANALYTICS.getConfig();
  const stats = RC_ANALYTICS.getStats();

  const pageRows = Object.entries(stats.byPage)
    .sort((a, b) => b[1] - a[1])
    .map(([page, count]) => {
      const pct = stats.totalViews ? Math.round((count / stats.totalViews) * 100) : 0;
      const label = RC_ANALYTICS.PAGE_LABELS[page] || page;
      return `<tr>
        <td>${esc(label)}</td>
        <td>${count}</td>
        <td>
          <div class="analytics-bar"><span style="width:${pct}%"></span></div>
          <span class="analytics-bar__pct">${pct}%</span>
        </td>
      </tr>`;
    }).join('') || '<tr><td colspan="3" style="text-align:center;color:var(--admin-muted);padding:1.5rem;">No page views recorded yet.</td></tr>';

  const chartBars = stats.daily.map((d) => {
    const h = stats.maxDaily ? Math.round((d.count / stats.maxDaily) * 100) : 0;
    return `<div class="analytics-chart__col" title="${esc(RC_ANALYTICS.formatShortDate(d.date))}: ${d.count} views">
      <div class="analytics-chart__bar" style="height:${Math.max(h, 4)}%"></div>
      <span class="analytics-chart__label">${esc(RC_ANALYTICS.formatShortDate(d.date))}</span>
    </div>`;
  }).join('');

  const referrerRows = stats.topReferrers.map(([ref, count]) => `
    <tr><td>${esc(ref)}</td><td>${count}</td></tr>
  `).join('') || '<tr><td colspan="2" style="text-align:center;color:var(--admin-muted);padding:1rem;">No referrer data yet.</td></tr>';

  const eventRows = Object.entries(stats.byEvent)
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => `
      <tr>
        <td>${esc(RC_ANALYTICS.EVENT_LABELS[type] || type)}</td>
        <td>${count}</td>
      </tr>
    `).join('') || '<tr><td colspan="2" style="text-align:center;color:var(--admin-muted);padding:1rem;">No conversion events yet.</td></tr>';

  const deviceRows = Object.entries(stats.byDevice).map(([dev, count]) => `
    <tr><td>${esc(dev)}</td><td>${count}</td></tr>
  `).join('') || '<tr><td colspan="2" style="text-align:center;color:var(--admin-muted);padding:1rem;">—</td></tr>';

  document.getElementById('panel-analytics').innerHTML = `
    <div class="admin-card">
      <h3>Analytics Settings</h3>
      <label class="admin-checkbox">
        <input type="checkbox" id="analytics-enabled" ${cfg.enabled !== false ? 'checked' : ''} />
        Enable analytics tracking
      </label>
      <label class="admin-checkbox">
        <input type="checkbox" id="analytics-local" ${cfg.trackLocal !== false ? 'checked' : ''} />
        Store anonymous visit stats in browser localStorage
      </label>
      ${field('Google Analytics 4 Measurement ID', 'analytics-ga4-id', cfg.ga4MeasurementId, 'text')}
      <p class="admin-hint">Optional. Example: <code>G-XXXXXXXXXX</code>. Leave blank to use local stats only.</p>
      ${field('Privacy note (internal)', 'analytics-privacy-note', cfg.privacyNote, 'textarea', 2)}
    </div>

    <div class="analytics-summary">
      <div class="analytics-stat-card">
        <span class="analytics-stat-card__value">${stats.totalViews}</span>
        <span class="analytics-stat-card__label">Total page views</span>
      </div>
      <div class="analytics-stat-card">
        <span class="analytics-stat-card__value">${stats.viewsToday}</span>
        <span class="analytics-stat-card__label">Views today</span>
      </div>
      <div class="analytics-stat-card">
        <span class="analytics-stat-card__value">${stats.viewsWeek}</span>
        <span class="analytics-stat-card__label">Views (7 days)</span>
      </div>
      <div class="analytics-stat-card">
        <span class="analytics-stat-card__value">${stats.sessionsWeek}</span>
        <span class="analytics-stat-card__label">Sessions (7 days)</span>
      </div>
    </div>

    <div class="admin-card">
      <div class="admin-card__header">
        <h3>Views — last 14 days</h3>
        <div class="admin-actions">
          <button type="button" class="admin-btn" id="analytics-export-btn"><i class="fas fa-download"></i> Export CSV</button>
          ${canAction('clearAnalytics') ? '<button type="button" class="admin-btn admin-btn--danger" id="analytics-clear-btn"><i class="fas fa-trash"></i> Clear Data</button>' : ''}
        </div>
      </div>
      <div class="analytics-chart">${chartBars}</div>
      <p class="admin-hint" style="margin-top:0.75rem;">
        Tracking since ${esc(RC_ANALYTICS.formatDate(stats.startedAt))}
        ${stats.lastView ? ` · Last visit ${esc(RC_ANALYTICS.formatDate(stats.lastView))}` : ''}
      </p>
      <p class="admin-hint">Local analytics are stored per browser. Deployed sites with real traffic should also connect Google Analytics 4.</p>
    </div>

    <div class="admin-grid-2">
      <div class="admin-card">
        <h3>Page breakdown</h3>
        <div class="admin-table-wrap">
          <table class="admin-table">
            <thead><tr><th>Page</th><th>Views</th><th>Share</th></tr></thead>
            <tbody>${pageRows}</tbody>
          </table>
        </div>
      </div>
      <div class="admin-card">
        <h3>Top referrers</h3>
        <div class="admin-table-wrap">
          <table class="admin-table">
            <thead><tr><th>Source</th><th>Views</th></tr></thead>
            <tbody>${referrerRows}</tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="admin-grid-2">
      <div class="admin-card">
        <h3>Conversion events</h3>
        <div class="admin-table-wrap">
          <table class="admin-table">
            <thead><tr><th>Event</th><th>Count</th></tr></thead>
            <tbody>${eventRows}</tbody>
          </table>
        </div>
      </div>
      <div class="admin-card">
        <h3>Devices</h3>
        <div class="admin-table-wrap">
          <table class="admin-table">
            <thead><tr><th>Device</th><th>Views</th></tr></thead>
            <tbody>${deviceRows}</tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="admin-card">
      <h3>Engagement overview</h3>
      <p style="color:var(--admin-muted);line-height:1.8;">
        ${RC_MEMBERSHIP.getApplications().length} membership applications ·
        ${window.RC_CONTACT ? RC_CONTACT.getMessages().length : 0} contact messages ·
        ${window.RC_NEWSLETTER ? RC_NEWSLETTER.getSubscribers().length : 0} newsletter subscribers ·
        ${window.RC_CERTIFICATES ? RC_CERTIFICATES.getCertificates().length : 0} certificates issued
      </p>
    </div>
  `;

  document.getElementById('analytics-export-btn')?.addEventListener('click', () => {
    RC_ANALYTICS.exportCsv();
    toast('Analytics exported.');
  });

  document.getElementById('analytics-clear-btn')?.addEventListener('click', () => {
    if (!confirm('Clear all local analytics data? This cannot be undone.')) return;
    RC_ANALYTICS.clearData();
    renderAnalyticsPanel();
    toast('Analytics data cleared.');
  });
}

function renderSeoPanel() {
  if (!window.RC_SEO) return;
  const seo = content.seo || RC_SEO.getConfig();
  const home = seo.pages?.home || {};
  const gallery = seo.pages?.gallery || {};
  const share = seo.share || {};

  document.getElementById('panel-seo').innerHTML = `
    <div class="admin-card">
      <h3>Global SEO</h3>
      <p class="admin-hint">Set your live website URL when deployed so Open Graph images and canonical links resolve correctly.</p>
      <div class="admin-grid-2">
        ${field('Site Name', 'seo-site-name', seo.siteName)}
        ${field('Site URL (production)', 'seo-site-url', seo.siteUrl, 'url')}
        ${field('Default Share Image', 'seo-default-image', seo.defaultImage)}
        ${field('Twitter Handle', 'seo-twitter-handle', seo.twitterHandle, 'text')}
        ${field('Organization Name', 'seo-org-name', seo.organizationName)}
        ${field('Organization Type', 'seo-org-type', seo.organizationType)}
        ${field('Twitter Card', 'seo-twitter-card', seo.twitterCard || 'summary_large_image')}
        ${field('Default Robots', 'seo-robots', seo.robots || 'index, follow')}
      </div>
    </div>

    <div class="admin-card">
      <h3>Homepage SEO</h3>
      ${field('Page Title', 'seo-home-title', home.title)}
      ${field('Meta Description', 'seo-home-desc', home.description, 'textarea', 3)}
      ${field('Keywords', 'seo-home-keywords', home.keywords)}
      <div class="admin-grid-2">
        ${field('OG Image Path', 'seo-home-image', home.ogImage)}
        ${field('Canonical URL (optional)', 'seo-home-canonical', home.canonicalUrl, 'url')}
        ${field('Robots', 'seo-home-robots', home.robots || 'index, follow')}
        ${field('OG Type', 'seo-home-og-type', home.ogType || 'website')}
      </div>
    </div>

    <div class="admin-card">
      <h3>Gallery Page SEO</h3>
      ${field('Page Title', 'seo-gallery-title', gallery.title)}
      ${field('Meta Description', 'seo-gallery-desc', gallery.description, 'textarea', 3)}
      ${field('Keywords', 'seo-gallery-keywords', gallery.keywords)}
      <div class="admin-grid-2">
        ${field('OG Image Path', 'seo-gallery-image', gallery.ogImage)}
        ${field('Canonical URL (optional)', 'seo-gallery-canonical', gallery.canonicalUrl, 'url')}
        ${field('Robots', 'seo-gallery-robots', gallery.robots || 'index, follow')}
        ${field('OG Type', 'seo-gallery-og-type', gallery.ogType || 'website')}
      </div>
    </div>

    <div class="admin-card">
      <h3>Social Sharing</h3>
      <label class="admin-checkbox" style="margin-bottom:1rem;">
        <input type="checkbox" id="seo-share-enabled" ${share.enabled !== false ? 'checked' : ''} />
        Show share buttons in footer
      </label>
      ${field('Section Label', 'seo-share-label', share.sectionLabel || 'Share this site')}
      ${field('Share Title', 'seo-share-title', share.title)}
      ${field('Share Text', 'seo-share-text', share.text, 'textarea', 2)}
      <p class="admin-hint" style="margin:0.75rem 0 0.5rem;">Share platforms</p>
      ${seoPlatformCheckboxes(share.platforms)}
      <div class="admin-grid-2" style="margin-top:1rem;">
        ${field('Copy Success Message', 'seo-copy-success', share.copySuccess)}
        ${field('Copy Error Message', 'seo-copy-error', share.copyError)}
      </div>
      <div class="admin-actions" style="margin-top:1rem;">
        <button type="button" class="admin-btn admin-btn--primary" id="seo-settings-save">
          <i class="fas fa-save"></i> Save SEO Settings
        </button>
      </div>
      <p class="admin-hint" style="margin-top:0.75rem;">
        Tip: Social crawlers read static HTML meta tags. After deploying, set <strong>Site URL</strong> to your live domain for best link previews.
      </p>
    </div>
  `;

  document.getElementById('seo-settings-save')?.addEventListener('click', () => {
    collectAllForms();
    RC_CMS.saveContent(content);
    toast('SEO settings saved. Refresh the website to apply.');
  });
}
