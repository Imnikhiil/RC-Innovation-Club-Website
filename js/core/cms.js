const CMS_STORAGE_KEY = 'rc_innovation_club_content';
const CMS_SESSION_KEY = 'rc_admin_session';

let contentCache = null;
let cmsReady = false;
let cmsInitPromise = null;
let cmsUnsubscribe = null;

const ASSET_PATH_MIGRATIONS = [
  [/^CLUB LOGO\//, 'assets/logo/'],
  [/^PAST EVENTS PICTURES\//, 'assets/events/'],
  [/^CURRENT CORE MEMBERS PIC\//, 'assets/team/core/'],
  [/^Core Images\//, 'assets/team/other/'],
  [/^Ambassdor\//, 'assets/team/ambassadors/'],
  ['assets/logo/logo.png', 'assets/logo/logo.webp'],
  ['assets/events/3D Modeling Workshop.jpg', 'assets/events/3D Modeling Workshop.webp'],
  ['assets/events/Cyber Security Woekshop.jpg', 'assets/events/Cyber Security Woekshop.webp'],
  ['assets/events/Robotic Competetion Winner.jpg', 'assets/events/Robotic Competetion Winner.webp'],
  ['assets/events/Robotics Workshop.jpg', 'assets/events/Robotics Workshop.webp'],
  ['assets/events/Fresher to Future-Ready pic.jpeg', 'assets/events/Fresher to Future-Ready pic.webp'],
  ['assets/events/Pic with manish sir.jpeg', 'assets/events/Pic with manish sir.webp'],
  ['assets/team/core/Ankit Singh Dhami.png', 'assets/team/core/Ankit Singh Dhami.jpg'],
  ['assets/team/core/Rishab.png', 'assets/team/core/Rishab.jpg'],
  ['assets/team/core/Rishabh.png', 'assets/team/core/Rishabh.jpg'],
  ['assets/team/core/Aunirudh.jpeg', 'assets/team/core/Aunirudh.webp']
];

function migrateAssetPath(path) {
  if (!path || typeof path !== 'string' || path.startsWith('http')) return path;
  let migrated = path;
  ASSET_PATH_MIGRATIONS.forEach((rule) => {
    if (Array.isArray(rule) && rule[0] instanceof RegExp) {
      migrated = migrated.replace(rule[0], rule[1]);
    } else if (Array.isArray(rule) && typeof rule[0] === 'string' && migrated === rule[0]) {
      migrated = rule[1];
    }
  });
  return migrated;
}

function mergeCoreTeamProfiles(defaultTeam, savedTeam) {
  if (!Array.isArray(savedTeam)) return savedTeam;
  const profilesByName = {};
  (defaultTeam || []).forEach((member) => {
    if (member.profile) profilesByName[member.name] = member.profile;
  });
  return savedTeam.map((member) => {
    if (member.profile || !profilesByName[member.name]) return member;
    return { ...member, profile: profilesByName[member.name] };
  });
}

function migrateContentAssets(content) {
  if (!content || typeof content !== 'object') return content;

  if (Array.isArray(content.events)) {
    content.events = content.events.map((e) => ({ ...e, image: migrateAssetPath(e.image) }));
  }
  if (Array.isArray(content.coreTeam)) {
    content.coreTeam = content.coreTeam.map((m) => ({ ...m, img: migrateAssetPath(m.img) }));
  }
  if (Array.isArray(content.ambassadors)) {
    content.ambassadors = content.ambassadors.map((a) => ({ ...a, image: migrateAssetPath(a.image) }));
  }
  if (Array.isArray(content.faculty)) {
    content.faculty = content.faculty.map((f) => ({ ...f, image: migrateAssetPath(f.image) }));
  }
  if (Array.isArray(content.partners)) {
    content.partners = content.partners.map((p) => ({ ...p, logo: migrateAssetPath(p.logo) }));
  }
  if (Array.isArray(content.projects)) {
    content.projects = content.projects.map((p) => ({ ...p, image: migrateAssetPath(p.image) }));
  }
  if (Array.isArray(content.gallery)) {
    content.gallery = content.gallery.map((g) => ({
      ...g,
      src: migrateAssetPath(g.src || g.image),
      image: migrateAssetPath(g.image)
    }));
  }
  if (content.seo && typeof content.seo === 'object') {
    content.seo = {
      ...content.seo,
      defaultImage: migrateAssetPath(content.seo.defaultImage),
      pages: content.seo.pages
        ? Object.fromEntries(
            Object.entries(content.seo.pages).map(([key, page]) => [
              key,
              page && typeof page === 'object'
                ? { ...page, ogImage: migrateAssetPath(page.ogImage) }
                : page
            ])
          )
        : content.seo.pages
    };
  }
  return content;
}

function loadLocalContent() {
  try {
    const saved = localStorage.getItem(CMS_STORAGE_KEY);
    if (saved) {
      return window.RC_CMS.mergeContent(window.RC_CMS.getDefaultContent(), JSON.parse(saved));
    }
  } catch (e) {
    console.warn('CMS: could not load saved content', e);
  }
  return migrateContentAssets(window.RC_CMS.getDefaultContent());
}

window.RC_CMS = {
  getDefaultContent() {
    if (typeof structuredClone === 'function') {
      try {
        return structuredClone(window.RC_DEFAULT_CONTENT);
      } catch (_) { /* fall through */ }
    }
    return JSON.parse(JSON.stringify(window.RC_DEFAULT_CONTENT));
  },

  async init() {
    if (cmsInitPromise) return cmsInitPromise;

    cmsInitPromise = (async () => {
      if (window.RC_BACKEND?.isEnabled()) {
        const withTimeout = (promise, ms) =>
          Promise.race([
            promise,
            new Promise((_, reject) => setTimeout(() => reject(new Error('CMS sync timeout')), ms))
          ]);

        try {
          await withTimeout(RC_BACKEND.init(), 5000);
        } catch (e) {
          console.warn('CMS: backend init skipped', e.message);
          contentCache = loadLocalContent();
          cmsReady = true;
          return contentCache;
        }

        let remote;
        try {
          remote = await withTimeout(RC_BACKEND.getCmsContent(), 5000);
        } catch (e) {
          console.warn('CMS: remote fetch timeout, using local', e.message);
          contentCache = loadLocalContent();
          cmsReady = true;
          return contentCache;
        }
        if (!remote || !Object.keys(remote).length) {
          await RC_BACKEND.seedFromLocalIfEmpty();
          remote = await RC_BACKEND.getCmsContent();
        }
        contentCache = migrateContentAssets(
          remote
            ? this.mergeContent(this.getDefaultContent(), remote)
            : loadLocalContent()
        );
        localStorage.setItem(CMS_STORAGE_KEY, JSON.stringify(contentCache));

        if (cmsUnsubscribe) cmsUnsubscribe();
        cmsUnsubscribe = RC_BACKEND.watchCmsContent((data) => {
          contentCache = migrateContentAssets(this.mergeContent(this.getDefaultContent(), data));
          localStorage.setItem(CMS_STORAGE_KEY, JSON.stringify(contentCache));
          window.dispatchEvent(new CustomEvent('rc-content-updated'));
        });
      } else {
        contentCache = loadLocalContent();
      }
      cmsReady = true;
      return contentCache;
    })();

    return cmsInitPromise;
  },

  async ensureReady() {
    if (cmsReady) return contentCache;
    return this.init();
  },

  getContent() {
    if (contentCache) return contentCache;
    contentCache = loadLocalContent();
    return contentCache;
  },

  mergeContent(defaults, saved) {
    const merged = { ...defaults, ...saved };
    const arrays = [
      'stats', 'events', 'faculty', 'coreTeam', 'ambassadors',
      'membersCurrent', 'membersPrevious', 'legacy', 'testimonials', 'partners', 'projects', 'resources', 'gallery'
    ];
    arrays.forEach((key) => {
      if (Array.isArray(saved[key])) merged[key] = saved[key];
    });
    if (Array.isArray(merged.coreTeam)) {
      merged.coreTeam = mergeCoreTeamProfiles(defaults.coreTeam, merged.coreTeam);
    }
    const objects = [
      'hero', 'statsSection', 'about', 'eventsSection', 'facultySection', 'teamHierarchySection', 'coreSection', 'ambassadorsSection',
      'membersSection', 'legacySection', 'testimonialsSection', 'partnersSection', 'projectsSection', 'resourcesSection', 'gallerySection', 'announcementBar', 'newsletterSection',
      'analyticsSection', 'notificationsSection', 'certificatesSection', 'contactSection', 'join', 'footer', 'social', 'registration', 'seo'
    ];
    objects.forEach((key) => {
      if (saved[key] && typeof saved[key] === 'object') {
        merged[key] = { ...defaults[key], ...saved[key] };
      } else if (defaults[key] && typeof defaults[key] === 'object') {
        merged[key] = { ...defaults[key] };
      }
    });

    const reg = merged.registration;
    if (
      reg &&
      reg.enabled === false &&
      !reg.startDate &&
      !reg.endDate &&
      defaults.registration
    ) {
      merged.registration = { ...defaults.registration, ...reg, enabled: defaults.registration.enabled };
    }

    if (merged.seo && defaults.seo) {
      merged.seo.pages = {
        home: { ...(defaults.seo.pages?.home || {}), ...(merged.seo.pages?.home || {}) },
        gallery: { ...(defaults.seo.pages?.gallery || {}), ...(merged.seo.pages?.gallery || {}) }
      };
      merged.seo.share = { ...(defaults.seo.share || {}), ...(merged.seo.share || {}) };
    }

    return migrateContentAssets(merged);
  },

  saveContent(content) {
    contentCache = content;
    localStorage.setItem(CMS_STORAGE_KEY, JSON.stringify(content));
    window.dispatchEvent(new CustomEvent('rc-content-updated'));

    if (window.RC_BACKEND?.isEnabled()) {
      return RC_BACKEND.saveCmsContent(content).catch((e) => {
        console.error('CMS: cloud save failed', e);
        throw e;
      });
    }
    return Promise.resolve(true);
  },

  resetContent() {
    localStorage.removeItem(CMS_STORAGE_KEY);
    contentCache = migrateContentAssets(this.getDefaultContent());
    window.dispatchEvent(new CustomEvent('rc-content-updated'));
    if (window.RC_BACKEND?.isEnabled()) {
      return RC_BACKEND.saveCmsContent(contentCache).then(() => contentCache);
    }
    return Promise.resolve(contentCache);
  },

  exportContent() {
    const blob = new Blob([JSON.stringify(this.getContent(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rc-innovation-club-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  importContent(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          const merged = this.mergeContent(this.getDefaultContent(), data);
          Promise.resolve(this.saveContent(merged))
            .then(() => resolve(this.getContent()))
            .catch(reject);
        } catch (e) {
          reject(new Error('Invalid JSON file'));
        }
      };
      reader.onerror = () => reject(new Error('Could not read file'));
      reader.readAsText(file);
    });
  },

  getAdminUsers() {
    const config = window.RC_ADMIN_CONFIG;
    if (!config) return [];
    if (Array.isArray(config.users) && config.users.length) return config.users;
    if (config.username) {
      return [{
        username: config.username,
        password: config.password,
        role: 'super',
        displayName: 'Super Admin'
      }];
    }
    return [];
  },

  getSession() {
    try {
      const raw = sessionStorage.getItem(CMS_SESSION_KEY);
      if (!raw) return null;
      const session = JSON.parse(raw);
      if (Date.now() > session.expires) {
        this.logout();
        return null;
      }
      if (!session.role) {
        session.role = 'super';
      }
      return session;
    } catch {
      return null;
    }
  },

  getRole() {
    return this.getSession()?.role || 'super';
  },

  getDisplayName() {
    const session = this.getSession();
    return session?.displayName || session?.user || 'Admin';
  },

  async login(username, password) {
    const config = window.RC_ADMIN_CONFIG;
    if (!config) return false;

    if (window.RC_BACKEND?.isEnabled()) {
      try {
        const profile = await RC_BACKEND.signIn(username, password);
        const hours = config.sessionHours || 8;
        const session = {
          user: profile.username,
          uid: profile.uid,
          email: profile.email,
          role: profile.role || 'super',
          displayName: profile.displayName || profile.username,
          expires: Date.now() + hours * 60 * 60 * 1000
        };
        sessionStorage.setItem(CMS_SESSION_KEY, JSON.stringify(session));
        return true;
      } catch (e) {
        console.warn('CMS: cloud login failed', e);
        return false;
      }
    }

    const user = this.getAdminUsers().find(
      (u) => u.username === username && u.password === password
    );
    if (!user) return false;

    const hours = config.sessionHours || 8;
    const session = {
      user: user.username,
      role: user.role || 'super',
      displayName: user.displayName || user.username,
      expires: Date.now() + hours * 60 * 60 * 1000
    };
    sessionStorage.setItem(CMS_SESSION_KEY, JSON.stringify(session));
    return true;
  },

  logout() {
    sessionStorage.removeItem(CMS_SESSION_KEY);
    if (window.RC_BACKEND?.isEnabled()) {
      RC_BACKEND.signOut();
    }
  },

  isLoggedIn() {
    return !!this.getSession();
  },

  canAccessPanel(panel) {
    if (!window.RC_ADMIN_ROLES) return true;
    return RC_ADMIN_ROLES.canAccessPanel(this.getRole(), panel);
  },

  canPerformAction(action) {
    if (!window.RC_ADMIN_ROLES) return true;
    return RC_ADMIN_ROLES.canPerformAction(this.getRole(), action);
  },

  requireAuth() {
    if (!this.isLoggedIn()) {
      window.location.href = 'admin.html';
      return false;
    }
    return true;
  }
};
