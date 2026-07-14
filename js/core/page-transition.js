/**
 * Smooth multi-page transitions (fade + soft lift).
 * Respects prefers-reduced-motion.
 */
window.RC_PAGE_TRANSITION = {
  overlay: null,
  navigating: false,
  DURATION: 320,

  prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  ensureOverlay() {
    if (this.overlay) return this.overlay;
    let el = document.getElementById('page-transition');
    if (!el) {
      el = document.createElement('div');
      el.id = 'page-transition';
      el.className = 'page-transition';
      el.setAttribute('aria-hidden', 'true');
      el.innerHTML = '<div class="page-transition__veil"></div>';
      document.body.appendChild(el);
    }
    this.overlay = el;
    return el;
  },

  isInternalNav(anchor) {
    if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return false;
    const href = anchor.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) {
      return false;
    }
    try {
      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) return false;
      // same page hash-only already excluded; same path with hash is still transition-worthy if different path
      const current = window.location.pathname.replace(/\/index\.html$/i, '/').replace(/\.html$/i, '') || '/';
      const next = url.pathname.replace(/\/index\.html$/i, '/').replace(/\.html$/i, '') || '/';
      if (current === next && url.hash) return false;
      if (current === next && !url.search) return false;
      return true;
    } catch {
      return false;
    }
  },

  enter() {
    document.documentElement.classList.add('page-enter');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.documentElement.classList.add('page-enter-active');
        document.documentElement.classList.remove('page-enter');
        window.setTimeout(() => {
          document.documentElement.classList.remove('page-enter-active');
        }, this.DURATION + 40);
      });
    });
  },

  leave(url) {
    if (this.navigating) return;
    if (this.prefersReducedMotion()) {
      window.location.href = url;
      return;
    }

    this.navigating = true;
    const overlay = this.ensureOverlay();
    document.documentElement.classList.add('page-leaving');
    overlay.classList.add('is-active');

    window.setTimeout(() => {
      window.location.href = url;
    }, this.DURATION);
  },

  init() {
    if (document.documentElement.dataset.pageTransitionInit === 'true') return;
    document.documentElement.dataset.pageTransitionInit = 'true';

    this.ensureOverlay();
    if (!this.prefersReducedMotion()) this.enter();

    document.addEventListener('click', (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = e.target.closest('a[href]');
      if (!this.isInternalNav(anchor)) return;
      e.preventDefault();
      const url = new URL(anchor.getAttribute('href'), window.location.href);
      this.leave(url.href);
    }, true);
  }
};

(function bootPageTransition() {
  function run() {
    if (window.RC_PAGE_TRANSITION) RC_PAGE_TRANSITION.init();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
