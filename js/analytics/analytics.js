const ANALYTICS_STORAGE_KEY = 'rc_analytics_data';
const ANALYTICS_SESSION_KEY = 'rc_analytics_session';
const MAX_VIEWS = 3000;
const MAX_EVENTS = 1000;
const DEDUPE_MS = 60000;

window.RC_ANALYTICS = {
  PAGE_LABELS: {
    home: 'Homepage',
    gallery: 'Gallery Page'
  },

  EVENT_LABELS: {
    contact_submit: 'Contact form',
    membership_submit: 'Membership application',
    newsletter_subscribe: 'Newsletter signup',
    certificate_verify: 'Certificate verified'
  },

  getConfig() {
    const defaults = window.RC_DEFAULT_CONTENT?.analyticsSection || {};
    const content = window.RC_CMS?.getContent() || {};
    return { ...defaults, ...(content.analyticsSection || {}) };
  },

  getPageKey() {
    const path = (window.location.pathname || '').toLowerCase();
    if (path.includes('gallery')) return 'gallery';
    if (path.includes('admin')) return null;
    return 'home';
  },

  getData() {
    try {
      const raw = localStorage.getItem(ANALYTICS_STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        return {
          views: Array.isArray(data.views) ? data.views : [],
          events: Array.isArray(data.events) ? data.events : [],
          startedAt: data.startedAt || null
        };
      }
    } catch (e) {
      console.warn('Analytics: could not load data', e);
    }
    return { views: [], events: [], startedAt: null };
  },

  saveData(data) {
    localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('rc-analytics-updated'));
    return true;
  },

  getSessionId() {
    try {
      const raw = sessionStorage.getItem(ANALYTICS_SESSION_KEY);
      if (raw) {
        const session = JSON.parse(raw);
        if (session.id && Date.now() - session.lastAt < 30 * 60 * 1000) {
          session.lastAt = Date.now();
          sessionStorage.setItem(ANALYTICS_SESSION_KEY, JSON.stringify(session));
          return session.id;
        }
      }
    } catch (e) {
      /* ignore */
    }
    const session = {
      id: `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      lastAt: Date.now()
    };
    sessionStorage.setItem(ANALYTICS_SESSION_KEY, JSON.stringify(session));
    return session.id;
  },

  getReferrer() {
    const ref = document.referrer || '';
    if (!ref) return 'Direct';
    try {
      const url = new URL(ref);
      if (url.hostname === window.location.hostname) return 'Internal';
      return url.hostname.replace(/^www\./, '');
    } catch {
      return 'Other';
    }
  },

  getDevice() {
    return /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop';
  },

  trimData(data) {
    if (data.views.length > MAX_VIEWS) {
      data.views = data.views.slice(-MAX_VIEWS);
    }
    if (data.events.length > MAX_EVENTS) {
      data.events = data.events.slice(-MAX_EVENTS);
    }
    return data;
  },

  trackPageView(pageKey) {
    const cfg = this.getConfig();
    if (cfg.enabled === false || cfg.trackLocal === false) return;

    const page = pageKey || this.getPageKey();
    if (!page) return;

    const data = this.getData();
    if (!data.startedAt) data.startedAt = new Date().toISOString();

    const sessionId = this.getSessionId();
    const now = Date.now();
    const last = data.views[data.views.length - 1];
    if (
      last &&
      last.page === page &&
      last.sessionId === sessionId &&
      now - new Date(last.at).getTime() < DEDUPE_MS
    ) {
      return;
    }

    data.views.push({
      page,
      at: new Date().toISOString(),
      sessionId,
      referrer: this.getReferrer(),
      device: this.getDevice()
    });

    this.saveData(this.trimData(data));
  },

  trackEvent(type, label = '') {
    const cfg = this.getConfig();
    if (cfg.enabled === false || cfg.trackLocal === false) return;

    const data = this.getData();
    if (!data.startedAt) data.startedAt = new Date().toISOString();

    data.events.push({
      type,
      label: label || '',
      at: new Date().toISOString(),
      sessionId: this.getSessionId()
    });

    this.saveData(this.trimData(data));

    const gaId = (cfg.ga4MeasurementId || '').trim();
    if (gaId && typeof window.gtag === 'function') {
      window.gtag('event', type, { event_label: label || type });
    }
  },

  clearData() {
    localStorage.removeItem(ANALYTICS_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('rc-analytics-updated'));
    return true;
  },

  startOfDay(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  },

  daysAgo(n) {
    const d = this.startOfDay(new Date());
    d.setDate(d.getDate() - n);
    return d;
  },

  isAfter(iso, date) {
    return new Date(iso).getTime() >= date.getTime();
  },

  getStats() {
    const data = this.getData();
    const now = new Date();
    const todayStart = this.startOfDay(now);
    const weekStart = this.daysAgo(6);
    const chartStart = this.daysAgo(13);

    const viewsToday = data.views.filter((v) => this.isAfter(v.at, todayStart));
    const viewsWeek = data.views.filter((v) => this.isAfter(v.at, weekStart));
    const viewsChart = data.views.filter((v) => this.isAfter(v.at, chartStart));

    const sessionsWeek = new Set(viewsWeek.map((v) => v.sessionId)).size;
    const sessionsAll = new Set(data.views.map((v) => v.sessionId)).size;

    const byPage = {};
    data.views.forEach((v) => {
      byPage[v.page] = (byPage[v.page] || 0) + 1;
    });

    const byReferrer = {};
    data.views.forEach((v) => {
      const ref = v.referrer || 'Direct';
      byReferrer[ref] = (byReferrer[ref] || 0) + 1;
    });

    const byDevice = {};
    data.views.forEach((v) => {
      const dev = v.device || 'Unknown';
      byDevice[dev] = (byDevice[dev] || 0) + 1;
    });

    const dailyMap = {};
    for (let i = 13; i >= 0; i--) {
      const d = this.daysAgo(i);
      dailyMap[d.toISOString().slice(0, 10)] = 0;
    }
    viewsChart.forEach((v) => {
      const key = v.at.slice(0, 10);
      if (dailyMap[key] != null) dailyMap[key] += 1;
    });

    const daily = Object.entries(dailyMap).map(([date, count]) => ({ date, count }));
    const maxDaily = Math.max(...daily.map((d) => d.count), 1);

    const byEvent = {};
    data.events.forEach((e) => {
      byEvent[e.type] = (byEvent[e.type] || 0) + 1;
    });

    const recentEvents = [...data.events].reverse().slice(0, 20);

    const topReferrers = Object.entries(byReferrer)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    return {
      totalViews: data.views.length,
      viewsToday: viewsToday.length,
      viewsWeek: viewsWeek.length,
      sessionsWeek,
      sessionsAll,
      byPage,
      byDevice,
      topReferrers,
      daily,
      maxDaily,
      byEvent,
      recentEvents,
      startedAt: data.startedAt,
      lastView: data.views.length ? data.views[data.views.length - 1].at : null
    };
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

  formatShortDate(dateStr) {
    try {
      return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short'
      });
    } catch {
      return dateStr;
    }
  },

  injectGA4() {
    const cfg = this.getConfig();
    const id = (cfg.ga4MeasurementId || '').trim();
    if (!id || cfg.enabled === false) return;

    if (document.getElementById('rc-ga4-script')) return;

    const script = document.createElement('script');
    script.id = 'rc-ga4-script';
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', id, { anonymize_ip: true });
  },

  init(pageKey) {
    if (this.getPageKey() === null && !pageKey) return;
    this.injectGA4();
    this.trackPageView(pageKey);
  },

  exportCsv() {
    const data = this.getData();
    const lines = ['Type,Page/Event,Date,Referrer,Device,Session'];
    data.views.forEach((v) => {
      lines.push([
        'pageview',
        v.page,
        v.at,
        `"${(v.referrer || '').replace(/"/g, '""')}"`,
        v.device || '',
        v.sessionId
      ].join(','));
    });
    data.events.forEach((e) => {
      lines.push([
        'event',
        e.type,
        e.at,
        `"${(e.label || '').replace(/"/g, '""')}"`,
        '',
        e.sessionId
      ].join(','));
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `rc_analytics_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
};
