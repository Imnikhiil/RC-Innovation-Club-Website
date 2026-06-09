const NEWSLETTER_STORAGE_KEY = 'rc_newsletter_subscribers';
const ANNOUNCE_DISMISS_KEY = 'rc_announce_dismissed';

let subscribersCache = null;
let newsletterReady = false;

window.RC_NEWSLETTER = {
  async init() {
    if (newsletterReady) return subscribersCache;
    await RC_CMS.ensureReady();

    if (window.RC_BACKEND?.isEnabled()) {
      try {
        subscribersCache = await RC_BACKEND.listCollection(RC_BACKEND.PATHS.SUBSCRIBERS, 'subscribedAt');
        localStorage.setItem(NEWSLETTER_STORAGE_KEY, JSON.stringify(subscribersCache));
      } catch (e) {
        console.warn('Newsletter: cloud load failed, using local cache', e);
        subscribersCache = this._loadLocal();
      }
    } else {
      subscribersCache = this._loadLocal();
    }
    newsletterReady = true;
    return subscribersCache;
  },

  async ensureReady() {
    if (newsletterReady) return subscribersCache;
    return this.init();
  },

  _loadLocal() {
    try {
      const raw = localStorage.getItem(NEWSLETTER_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Newsletter: could not load subscribers', e);
    }
    return [];
  },

  getConfig() {
    const defaults = window.RC_DEFAULT_CONTENT?.newsletterSection || {};
    const content = window.RC_CMS?.getContent() || {};
    return { ...defaults, ...(content.newsletterSection || {}) };
  },

  getSubscribers() {
    if (subscribersCache) return subscribersCache;
    subscribersCache = this._loadLocal();
    return subscribersCache;
  },

  saveSubscribers(list) {
    subscribersCache = list;
    localStorage.setItem(NEWSLETTER_STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('rc-newsletter-updated'));
    return true;
  },

  generateId() {
    return `sub_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  },

  async subscribe(email) {
    const normalized = (email || '').trim().toLowerCase();
    if (!normalized) {
      return { ok: false, error: 'Please enter your email address.' };
    }

    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(normalized)) {
      return { ok: false, error: 'Please enter a valid email address.' };
    }

    const list = this.getSubscribers();
    if (list.some((s) => s.email === normalized)) {
      return { ok: false, error: 'This email is already subscribed.' };
    }

    const subscriber = {
      id: this.generateId(),
      email: normalized,
      subscribedAt: new Date().toISOString()
    };

    if (window.RC_BACKEND?.isEnabled()) {
      try {
        await RC_BACKEND.addDoc(RC_BACKEND.PATHS.SUBSCRIBERS, subscriber.id, subscriber);
      } catch (e) {
        console.error('Newsletter: subscribe failed', e);
        return { ok: false, error: 'Could not subscribe. Please try again later.' };
      }
    }

    list.unshift(subscriber);
    this.saveSubscribers(list);
    return { ok: true, subscriber };
  },

  async deleteSubscriber(id) {
    const list = this.getSubscribers().filter((s) => s.id !== id);
    this.saveSubscribers(list);
    if (window.RC_BACKEND?.isEnabled()) {
      await RC_BACKEND.deleteDoc(RC_BACKEND.PATHS.SUBSCRIBERS, id);
    }
    return true;
  },

  filterSubscribers({ search = '' } = {}) {
    let list = this.getSubscribers();
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((s) => s.email.includes(q));
    }
    return list;
  },

  formatDate(iso) {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return iso;
    }
  },

  exportToExcel(subscribers) {
    const list = subscribers || this.getSubscribers();
    const headers = ['Email', 'Subscribed At'];
    const escapeCsv = (val) => {
      const s = String(val ?? '').replace(/"/g, '""');
      return /[",\n\r]/.test(s) ? `"${s}"` : s;
    };
    const rows = list.map((s) => [
      s.email, this.formatDate(s.subscribedAt)
    ].map(escapeCsv).join(','));
    const csv = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rc-newsletter-subscribers-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  },

};

window.RC_ANNOUNCE = {
  getConfig() {
    const defaults = window.RC_DEFAULT_CONTENT?.announcementBar || {};
    const content = window.RC_CMS?.getContent() || {};
    return { ...defaults, ...(content.announcementBar || {}) };
  },

  getDismissedIds() {
    try {
      const raw = localStorage.getItem(ANNOUNCE_DISMISS_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      /* ignore */
    }
    return [];
  },

  isDismissed(announcementId) {
    if (!announcementId) return false;
    return this.getDismissedIds().includes(announcementId);
  },

  dismiss(announcementId) {
    if (!announcementId) return;
    const ids = this.getDismissedIds();
    if (!ids.includes(announcementId)) {
      ids.push(announcementId);
      localStorage.setItem(ANNOUNCE_DISMISS_KEY, JSON.stringify(ids));
    }
  },

  clearDismissed() {
    localStorage.removeItem(ANNOUNCE_DISMISS_KEY);
  }
};

window.syncAnnounceBarOffset = function syncAnnounceBarOffset() {
  const bar = document.getElementById('announce-bar');
  const height = bar && !bar.hidden && !bar.classList.contains('announce-bar--hidden')
    ? bar.offsetHeight
    : 0;
  document.documentElement.style.setProperty('--announce-bar-height', `${height}px`);
};

window.initAnnouncementBar = function initAnnouncementBar() {
  const bar = document.getElementById('announce-bar');
  const dismissBtn = document.getElementById('announce-dismiss');
  if (!bar || !window.RC_ANNOUNCE) return;

  if (dismissBtn && dismissBtn.dataset.bound !== 'true') {
    dismissBtn.dataset.bound = 'true';
    dismissBtn.addEventListener('click', () => {
      const cfg = RC_ANNOUNCE.getConfig();
      if (cfg.dismissible === false) return;
      RC_ANNOUNCE.dismiss(cfg.announcementId);
      bar.hidden = true;
      bar.classList.add('announce-bar--hidden');
      document.body.classList.remove('has-announce-bar');
      syncAnnounceBarOffset();
    });
  }

  syncAnnounceBarOffset();
  if (!window._announceResizeBound) {
    window._announceResizeBound = true;
    window.addEventListener('resize', syncAnnounceBarOffset);
  }
};
