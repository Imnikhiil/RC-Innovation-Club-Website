window.RC_SEO = {
  getConfig() {
    const defaults = window.RC_DEFAULT_CONTENT?.seo || {};
    const saved = window.RC_CMS?.getContent()?.seo || {};
    const pageKeys = [
      'home', 'about', 'events', 'team', 'projects', 'gallery',
      'resources', 'join', 'contact'
    ];
    const pages = {};
    pageKeys.forEach((key) => {
      pages[key] = { ...(defaults.pages?.[key] || {}), ...(saved.pages?.[key] || {}) };
    });
    return {
      ...defaults,
      ...saved,
      pages,
      share: { ...(defaults.share || {}), ...(saved.share || {}) }
    };
  },

  getPageKey() {
    const raw = (window.location.pathname || '/').toLowerCase().replace(/\/+$/, '') || '/';
    const file = raw.split('/').pop() || '';
    if (!file || file === 'index.html' || raw === '/') return 'home';
    return file.replace(/\.html$/, '');
  },

  getSiteUrl() {
    const cfg = this.getConfig();
    if (cfg.siteUrl && cfg.siteUrl.trim()) {
      return cfg.siteUrl.trim().replace(/\/$/, '');
    }
    const { origin, pathname } = window.location;
    if (origin && origin !== 'null' && !origin.startsWith('file:')) {
      const base = pathname.replace(/[^/]*$/, '').replace(/\/$/, '');
      return `${origin}${base}`;
    }
    return '';
  },

  resolveUrl(path) {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    const site = this.getSiteUrl();
    if (!site) return path;
    try {
      return new URL(path.replace(/^\//, ''), `${site}/`).href;
    } catch {
      return path;
    }
  },

  getPageMeta(pageKey) {
    const cfg = this.getConfig();
    const page = cfg.pages?.[pageKey] || cfg.pages?.home || {};
    const siteUrl = this.getSiteUrl();
    const path = pageKey === 'home' ? '/' : `/${pageKey}`;
    const canonical = page.canonicalUrl?.trim() || (siteUrl ? `${siteUrl}${path === '/' ? '/' : path}` : '');
    const image = page.ogImage || cfg.defaultImage || 'assets/logo/og-share.png';

    return {
      title: page.title || cfg.siteName || 'RC Innovation Club',
      description: page.description || '',
      keywords: page.keywords || '',
      canonical,
      image: this.resolveUrl(image),
      robots: page.robots || cfg.robots || 'index, follow',
      ogType: page.ogType || 'website'
    };
  },

  setMeta(attr, key, value) {
    if (value == null || value === '') return;
    let el = document.querySelector(`meta[${attr}="${key}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    el.setAttribute('content', value);
  },

  setLink(rel, href) {
    if (!href) return;
    let el = document.querySelector(`link[rel="${rel}"]`);
    if (!el) {
      el = document.createElement('link');
      el.setAttribute('rel', rel);
      document.head.appendChild(el);
    }
    el.setAttribute('href', href);
  },

  ensureFavicons() {
    const icons = [
      { rel: 'icon', href: 'favicon.ico', sizes: 'any' },
      { rel: 'icon', type: 'image/png', sizes: '32x32', href: 'assets/logo/favicon-32.png' },
      { rel: 'icon', type: 'image/png', sizes: '48x48', href: 'assets/logo/favicon-48.png' },
      { rel: 'apple-touch-icon', sizes: '180x180', href: 'assets/logo/apple-touch-icon.png' }
    ];
    icons.forEach((cfg) => {
      const sel = cfg.sizes
        ? `link[rel="${cfg.rel}"][sizes="${cfg.sizes}"]`
        : `link[rel="${cfg.rel}"]`;
      let el = document.querySelector(sel);
      if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', cfg.rel);
        if (cfg.type) el.setAttribute('type', cfg.type);
        if (cfg.sizes) el.setAttribute('sizes', cfg.sizes);
        document.head.appendChild(el);
      }
      el.setAttribute('href', cfg.href);
    });
  },

  applyPageSeo(pageKey) {
    const cfg = this.getConfig();
    const meta = this.getPageMeta(pageKey);

    document.title = meta.title;

    this.setMeta('name', 'description', meta.description);
    this.setMeta('name', 'keywords', meta.keywords);
    this.setMeta('name', 'robots', meta.robots);
    this.setLink('canonical', meta.canonical);

    this.setMeta('property', 'og:title', meta.title);
    this.setMeta('property', 'og:description', meta.description);
    this.setMeta('property', 'og:image', meta.image);
    this.setMeta('property', 'og:image:type', 'image/png');
    this.setMeta('property', 'og:image:width', '1200');
    this.setMeta('property', 'og:image:height', '630');
    this.setMeta('property', 'og:image:alt', cfg.siteName || 'RC Innovation Club');
    this.setMeta('property', 'og:url', meta.canonical);
    this.setMeta('property', 'og:type', meta.ogType);
    this.setMeta('property', 'og:site_name', cfg.siteName || 'RC Innovation Club');

    this.setMeta('name', 'twitter:card', cfg.twitterCard || 'summary_large_image');
    this.setMeta('name', 'twitter:title', meta.title);
    this.setMeta('name', 'twitter:description', meta.description);
    this.setMeta('name', 'twitter:image', meta.image);
    this.ensureFavicons();
    if (cfg.twitterHandle) {
      this.setMeta('name', 'twitter:site', cfg.twitterHandle);
    }

    this.applyStructuredData(cfg, meta);
    return meta;
  },

  applyStructuredData(cfg, meta) {
    const social = window.RC_CMS?.getContent()?.social || window.RC_DEFAULT_CONTENT?.social || {};
    const sameAs = [social.instagram, social.whatsapp].filter(Boolean);

    const data = {
      '@context': 'https://schema.org',
      '@type': cfg.organizationType || 'Organization',
      name: cfg.organizationName || cfg.siteName || 'RC Innovation Club',
      url: meta.canonical || this.getSiteUrl(),
      logo: this.resolveUrl('assets/logo/logo.png') || meta.image,
      description: meta.description,
      email: social.email || undefined,
      sameAs: sameAs.length ? sameAs : undefined
    };

    Object.keys(data).forEach((k) => {
      if (data[k] === undefined) delete data[k];
    });

    let script = document.getElementById('seo-jsonld');
    if (!script) {
      script = document.createElement('script');
      script.id = 'seo-jsonld';
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(data);
  },

  getSharePayload(pageKey) {
    const meta = this.getPageMeta(pageKey);
    const cfg = this.getConfig();
    const share = cfg.share || {};
    return {
      url: meta.canonical || window.location.href,
      title: share.title || meta.title,
      text: share.text || meta.description
    };
  },

  buildShareUrl(platform, payload) {
    const { url, title, text } = payload;
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    const encodedText = encodeURIComponent(text);

    switch (platform) {
      case 'whatsapp':
        return `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`;
      case 'twitter':
        return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText || encodedTitle}`;
      case 'facebook':
        return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
      case 'linkedin':
        return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
      case 'telegram':
        return `https://t.me/share/url?url=${encodedUrl}&text=${encodedText || encodedTitle}`;
      default:
        return url;
    }
  },

  async copyShareLink(url) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        return true;
      }
    } catch {
      /* fallback below */
    }

    const input = document.createElement('input');
    input.value = url;
    document.body.appendChild(input);
    input.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(input);
    return ok;
  },

  initShareButtons() {
    const cfg = this.getConfig();
    const share = cfg.share || {};
    if (share.enabled === false) return;

    const wrap = document.getElementById('share-buttons');
    const section = document.getElementById('share-section');
    if (!wrap) return;

    const pageKey = this.getPageKey();
    const payload = this.getSharePayload(pageKey);
    const platforms = Array.isArray(share.platforms) && share.platforms.length
      ? share.platforms
      : ['whatsapp', 'twitter', 'facebook', 'linkedin', 'copy'];

    const labels = {
      whatsapp: { icon: 'fab fa-whatsapp', label: 'WhatsApp' },
      twitter: { icon: 'fab fa-x-twitter', label: 'X' },
      facebook: { icon: 'fab fa-facebook-f', label: 'Facebook' },
      linkedin: { icon: 'fab fa-linkedin-in', label: 'LinkedIn' },
      telegram: { icon: 'fab fa-telegram-plane', label: 'Telegram' },
      copy: { icon: 'fas fa-link', label: 'Copy link' }
    };

    wrap.innerHTML = platforms.map((p) => {
      const info = labels[p] || { icon: 'fas fa-share-alt', label: p };
      return `<button type="button" class="share-btn" data-share="${p}" aria-label="Share on ${info.label}" title="${info.label}">
        <i class="${info.icon}" aria-hidden="true"></i>
      </button>`;
    }).join('');

    if (section) {
      section.hidden = false;
      const labelEl = document.getElementById('share-section-label');
      if (labelEl && share.sectionLabel) labelEl.textContent = share.sectionLabel;
    }

    if (wrap.dataset.bound === 'true') return;
    wrap.dataset.bound = 'true';

    wrap.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-share]');
      if (!btn) return;

      const platform = btn.dataset.share;
      const currentPayload = this.getSharePayload(this.getPageKey());

      if (platform === 'copy') {
        const ok = await this.copyShareLink(currentPayload.url);
        this.showShareToast(ok ? (share.copySuccess || 'Link copied!') : (share.copyError || 'Could not copy link'));
        return;
      }

      if (navigator.share && platform === 'native') {
        try {
          await navigator.share({ title: currentPayload.title, text: currentPayload.text, url: currentPayload.url });
          return;
        } catch {
          /* user cancelled or unsupported */
        }
      }

      const shareUrl = this.buildShareUrl(platform, currentPayload);
      window.open(shareUrl, '_blank', 'noopener,noreferrer,width=600,height=500');
    });
  },

  showShareToast(message) {
    let toast = document.getElementById('share-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'share-toast';
      toast.className = 'share-toast';
      toast.setAttribute('role', 'status');
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(window._shareToastTimer);
    window._shareToastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2600);
  },

  init(pageKey) {
    const key = pageKey || this.getPageKey();
    this.applyPageSeo(key);
    this.initShareButtons();
  }
};
