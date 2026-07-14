window.RC_REVEAL = {
  observer: null,
  bound: false,

  getDelay(el) {
    const raw = el.getAttribute('data-reveal-delay') || el.getAttribute('data-aos-delay') || '0';
    const ms = parseInt(raw, 10);
    return Number.isFinite(ms) ? ms : 0;
  },

  reveal(el, { instant = false } = {}) {
    if (instant) {
      el.classList.add('is-revealed');
      return;
    }
    const delay = Math.min(this.getDelay(el), 120);
    if (delay > 0) {
      setTimeout(() => el.classList.add('is-revealed'), delay);
    } else {
      el.classList.add('is-revealed');
    }
  },

  revealIn(root, { instant = true } = {}) {
    if (!root) return;
    root.classList?.add?.('is-nav-target');
    root.querySelectorAll?.('[data-reveal], [data-aos]')?.forEach((el) => {
      this.reveal(el, { instant });
      this.observer?.unobserve(el);
    });
    if (root.matches?.('[data-reveal], [data-aos]')) {
      this.reveal(root, { instant });
      this.observer?.unobserve(root);
    }
  },

  observeAll() {
    const nodes = document.querySelectorAll('[data-reveal]:not(.is-revealed), [data-aos]:not(.is-revealed)');
    if (!nodes.length || !this.observer) return;
    nodes.forEach((el) => {
      if (el.closest('.dash-hero')) return;
      this.observer.observe(el);
    });
  },

  revealHero() {
    const hero = document.querySelector('.dash-hero');
    if (!hero || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.querySelectorAll('.dash-hero [data-reveal], .dash-hero [data-aos]').forEach((el) => {
        el.classList.add('is-revealed');
      });
      return;
    }

    hero.querySelectorAll('[data-reveal], [data-aos]').forEach((el, i) => {
      const delay = Math.min(this.getDelay(el) || i * 40, 160);
      setTimeout(() => el.classList.add('is-revealed'), 40 + delay);
    });
  },

  init() {
    const targets = document.querySelectorAll('[data-reveal], [data-aos]');
    if (!targets.length) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      targets.forEach((el) => el.classList.add('is-revealed'));
      document.documentElement.classList.add('reveal-ready');
      return;
    }

    document.documentElement.classList.add('reveal-ready');

    if (!this.observer) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            this.reveal(entry.target);
            this.observer.unobserve(entry.target);
          });
        },
        { threshold: 0.08, rootMargin: '80px 0px -4% 0px' }
      );
    }

    this.revealHero();
    this.observeAll();

    if (location.hash) {
      const target = document.querySelector(location.hash);
      if (target) this.revealIn(target, { instant: true });
    }

    this.bound = true;
  },

  refresh() {
    if (!this.bound) {
      this.init();
      return;
    }
    this.observeAll();
  }
};

(function bootstrapReveal() {
  function run() {
    if (window.RC_REVEAL) RC_REVEAL.init();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
