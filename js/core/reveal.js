window.RC_REVEAL = {
  observer: null,
  bound: false,

  getDelay(el) {
    const raw = el.getAttribute('data-reveal-delay') || el.getAttribute('data-aos-delay') || '0';
    const ms = parseInt(raw, 10);
    return Number.isFinite(ms) ? ms : 0;
  },

  reveal(el) {
    const delay = this.getDelay(el);
    if (delay > 0) {
      setTimeout(() => el.classList.add('is-revealed'), delay);
    } else {
      el.classList.add('is-revealed');
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
      const delay = this.getDelay(el) || i * 100;
      setTimeout(() => el.classList.add('is-revealed'), 160 + delay);
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
        { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
      );
    }

    this.revealHero();
    this.observeAll();
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
