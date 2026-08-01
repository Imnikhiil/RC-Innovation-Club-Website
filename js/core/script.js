async function initGalleryHome(items) {
  if (!window.RC_GALLERY) return;
  const grid = document.getElementById('cms-gallery-grid');
  if (grid) await RC_GALLERY.hydrateCardMedia(grid);
  if (typeof window.initGalleryLightbox === 'function') {
    window.initGalleryLightbox(items || RC_GALLERY.getHomeItems());
  }
}

function initGalleryHomeLazy() {
  const section = document.getElementById('gallery');
  const grid = document.getElementById('cms-gallery-grid');
  if (!section || !grid || section.dataset.galleryReady === 'true') return;

  const run = () => {
    if (section.dataset.galleryReady === 'true') return;
    section.dataset.galleryReady = 'true';
    initGalleryHome();
  };

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          run();
          observer.disconnect();
        }
      },
      { rootMargin: '200px 0px' }
    );
    observer.observe(section);
  } else {
    run();
  }
}
window.initGalleryHome = initGalleryHome;

function initSite() {
  if (typeof window.renderSite === 'function') {
    window.renderSite(window.RC_CMS.getContent());
  }
  initTeamCards();
  initFacultyCards();
  if (window.RC_TEAM_PROFILES) RC_TEAM_PROFILES.init();
  if (window.RC_TEAM_HIERARCHY) RC_TEAM_HIERARCHY.init();
  if (typeof window.initMembersReveal === 'function') window.initMembersReveal();
  initStatCounters();
  initPopAnimations();
  initEventsScroll();
  updateMembershipCTA();
  initGalleryHomeLazy();
  if (window.RC_REVEAL) RC_REVEAL.refresh();
}

function showEl(el) {
  if (el) el.style.display = '';
}

function hideEl(el) {
  if (el) el.style.display = 'none';
}

function updateMembershipCTA() {
  if (!window.RC_MEMBERSHIP) return;

  const cta = document.getElementById('membership-cta');
  const notice = document.getElementById('membership-closed-msg');
  const status = window.RC_MEMBERSHIP.getRegistrationStatus();

  if (!cta || !notice) return;

  const noticeTitle = document.getElementById('membership-closed-title');
  const noticeText = document.getElementById('membership-closed-text');
  const noticeIcon = document.getElementById('membership-notice-icon');
  const publicNotice = window.RC_MEMBERSHIP.getPublicNotice();

  if (status === 'open') {
    showEl(cta);
    hideEl(notice);
    closeMembershipForm();
    return;
  }

  hideEl(cta);
  closeMembershipForm();

  if (!publicNotice) {
    hideEl(notice);
    return;
  }

  showEl(notice);
  notice.className = `membership-notice membership-notice--${publicNotice.variant}`;

  if (noticeTitle) noticeTitle.textContent = publicNotice.title;
  if (noticeText) noticeText.textContent = publicNotice.message;

  if (noticeIcon) {
    const icons = {
      upcoming: 'fa-clock',
      expired: 'fa-calendar-xmark',
      disabled: 'fa-circle-info'
    };
    const iconClass = icons[publicNotice.variant] || 'fa-lock';
    noticeIcon.innerHTML = `<i class="fas ${iconClass}"></i>`;
  }
}

window.updateMembershipCTA = updateMembershipCTA;

function openMembershipForm(e) {
  if (e) e.preventDefault();

  const panel = document.getElementById('membership-form-panel');
  const form = document.getElementById('membership-form');
  const errorEl = document.getElementById('membership-form-error');
  const successEl = document.getElementById('membership-form-success');
  if (!panel || !form) return;

  if (!window.RC_MEMBERSHIP?.isRegistrationOpen()) {
    updateMembershipCTA();
    document.getElementById('membership-closed-msg')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  panel.classList.add('is-open');
  if (errorEl) errorEl.textContent = '';
  if (successEl) successEl.textContent = '';

  panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  setTimeout(() => document.getElementById('mem-name')?.focus(), 350);
}

function closeMembershipForm(e) {
  if (e) e.preventDefault();
  const panel = document.getElementById('membership-form-panel');
  if (!panel) return;
  panel.classList.remove('is-open');
}

window.openMembershipForm = openMembershipForm;
window.closeMembershipForm = closeMembershipForm;

function initMembershipRegistration() {
  const form = document.getElementById('membership-form');
  const errorEl = document.getElementById('membership-form-error');
  const successEl = document.getElementById('membership-form-success');
  const submitBtn = document.getElementById('membership-submit-btn');

  if (!form || !window.RC_MEMBERSHIP) return;

  document.getElementById('membership-open-btn')?.addEventListener('click', openMembershipForm);
  document.getElementById('membership-close-btn')?.addEventListener('click', closeMembershipForm);

  document.addEventListener('click', (e) => {
    const joinLink = e.target.closest('a[href="#join"]');
    if (!joinLink || !window.RC_MEMBERSHIP.isRegistrationOpen()) return;
    const joinSection = document.getElementById('join');
    if (!joinSection) return;
    e.preventDefault();
    if (window.RC_REVEAL) RC_REVEAL.revealIn(joinSection, { instant: true });
    joinSection.scrollIntoView({ behavior: 'auto', block: 'start' });
    setTimeout(openMembershipForm, 120);
  });

  document.addEventListener('keydown', (e) => {
    const panel = document.getElementById('membership-form-panel');
    if (e.key === 'Escape' && panel?.classList.contains('is-open')) {
      closeMembershipForm();
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (errorEl) errorEl.textContent = '';
    if (successEl) successEl.textContent = '';

    const data = {
      name: document.getElementById('mem-name')?.value || '',
      enrollmentNumber: document.getElementById('mem-enrollment')?.value || '',
      course: document.getElementById('mem-course')?.value || '',
      semester: document.getElementById('mem-semester')?.value || '',
      email: document.getElementById('mem-email')?.value || '',
      phone: document.getElementById('mem-phone')?.value || '',
      skills: document.getElementById('mem-skills')?.value || '',
      reason: document.getElementById('mem-reason')?.value || '',
      interests: document.getElementById('mem-interests')?.value || ''
    };

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Submitting…';
    }

    const result = await window.RC_MEMBERSHIP.submitApplication(data);

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fas fa-paper-plane" aria-hidden="true"></i> Submit Application';
    }

    if (!result.ok) {
      if (errorEl) errorEl.textContent = result.error;
      return;
    }

    if (window.RC_ANALYTICS) RC_ANALYTICS.trackEvent('membership_submit');
    if (window.RC_EMAIL_NOTIFY) {
      RC_EMAIL_NOTIFY.notifyMembership(result.application).catch(() => {});
    }
    const cfg = window.RC_MEMBERSHIP.getRegistrationConfig();
    if (successEl) {
      successEl.textContent = cfg.successMessage || 'Your application has been submitted successfully!';
    }
    form.reset();
    setTimeout(closeMembershipForm, 3000);
  });

  const onJoinPage = /(^|\/)join\.html$/i.test((location.pathname || '').replace(/\\/g, '/'));
  if (window.RC_MEMBERSHIP.isRegistrationOpen() && (window.location.hash === '#join' || (onJoinPage && window.location.hash === '#form'))) {
    setTimeout(openMembershipForm, 400);
  }
}

function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form || !window.RC_CONTACT) return;

  if (form.dataset.bound === 'true') return;
  form.dataset.bound = 'true';

  const errorEl = document.getElementById('contact-form-error');
  const successEl = document.getElementById('contact-form-success');
  const submitBtn = document.getElementById('contact-submit-btn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (errorEl) errorEl.textContent = '';
    if (successEl) successEl.textContent = '';

    const data = {
      name: document.getElementById('contact-name')?.value || '',
      email: document.getElementById('contact-email')?.value || '',
      subject: document.getElementById('contact-subject')?.value || '',
      message: document.getElementById('contact-message')?.value || ''
    };

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Sending…';
    }

    const result = await RC_CONTACT.submitMessage(data);

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<i class="fas fa-paper-plane" aria-hidden="true"></i> <span id="cms-contact-submit-label">${RC_CONTACT.getConfig().submitLabel || 'Send Message'}</span>`;
    }

    if (!result.ok) {
      if (errorEl) errorEl.textContent = result.error;
      return;
    }

    if (window.RC_ANALYTICS) RC_ANALYTICS.trackEvent('contact_submit');
    if (window.RC_EMAIL_NOTIFY) {
      RC_EMAIL_NOTIFY.notifyContact(result.message).catch(() => {});
    }
    const cfg = RC_CONTACT.getConfig();
    if (successEl) successEl.textContent = cfg.successMessage || 'Thank you! Your message has been sent.';
    form.reset();
  });
}

window.initContactForm = initContactForm;

function initNewsletterForm() {
  const form = document.getElementById('newsletter-form');
  if (!form || !window.RC_NEWSLETTER) return;

  if (form.dataset.bound === 'true') return;
  form.dataset.bound = 'true';

  const errorEl = document.getElementById('newsletter-form-error');
  const successEl = document.getElementById('newsletter-form-success');
  const submitBtn = document.getElementById('newsletter-submit-btn');
  const emailInput = document.getElementById('newsletter-email');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (errorEl) errorEl.textContent = '';
    if (successEl) successEl.textContent = '';

    const email = emailInput?.value || '';

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Subscribing…';
    }

    const result = await RC_NEWSLETTER.subscribe(email);

    const cfg = RC_NEWSLETTER.getConfig();
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<i class="fas fa-bell" aria-hidden="true"></i> <span id="cms-newsletter-btn-label">${cfg.buttonLabel || 'Subscribe'}</span>`;
    }

    if (!result.ok) {
      if (errorEl) errorEl.textContent = result.error;
      return;
    }

    if (window.RC_ANALYTICS) RC_ANALYTICS.trackEvent('newsletter_subscribe');
    if (successEl) successEl.textContent = cfg.successMessage || "You're subscribed!";
    form.reset();
  });
}

window.initNewsletterForm = initNewsletterForm;

document.addEventListener('DOMContentLoaded', () => {
  if (window.RC_THEME) RC_THEME.init();

  let lastPaintedFingerprint = '';
  const contentFingerprint = (content) => {
    try {
      // Lightweight fingerprint — enough to detect CMS updates without full stringify
      return [
        content?.updatedAt || '',
        content?.events?.length,
        content?.coreTeam?.length,
        content?.faculty?.length,
        content?.gallery?.length,
        content?.hero?.title || content?.hero?.heading || '',
        content?.stats?.length,
        content?.membersCurrent?.length,
        content?.testimonials?.length
      ].join('|');
    } catch (_) {
      return String(Date.now());
    }
  };

  const paintSite = (force = false) => {
    const content = window.RC_CMS.getContent();
    const fp = contentFingerprint(content);
    if (!force && fp === lastPaintedFingerprint) return;
    lastPaintedFingerprint = fp;
    initSite();
  };

  // Paint immediately from local cache — do not wait for cloud CMS
  paintSite(true);
  initNavbar();
  initMobileMenu();
  initSmoothNav();
  initBackToTop();
  initScrollProgress();
  initActiveNav();
  initMembershipRegistration();
  initContactForm();
  if (window.RC_CERTIFICATES) RC_CERTIFICATES.initVerify();
  if (typeof window.initAnnouncementBar === 'function') window.initAnnouncementBar();
  initNewsletterForm();
  if (window.RC_SEO) RC_SEO.init();
  if (window.RC_ANALYTICS) RC_ANALYTICS.init();
  if (window.RC_REVEAL) RC_REVEAL.refresh();

  window.addEventListener('rc-content-updated', () => paintSite(true));

  // Sync cloud content in background (won't block first paint)
  RC_CMS.init()
    .then(() => (window.RC_CERTIFICATES?.init ? RC_CERTIFICATES.init() : null))
    .then(() => {
      paintSite(false);
      if (window.RC_REVEAL) RC_REVEAL.refresh();
    })
    .catch((err) => console.warn('CMS background sync:', err.message || err));
});

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

const siteObservers = {
  team: null,
  stats: null,
  pop: null
};

function initTeamCards() {
  const cards = document.querySelectorAll('.team-card');
  if (!cards.length) return;

  cards.forEach((card) => {
    if (card.dataset.imgBound === 'true') return;
    card.dataset.imgBound = 'true';
    const img = card.querySelector('.team-card__photo');
    const wrap = card.querySelector('.team-card__photo-wrap');
    img?.addEventListener('error', () => {
      wrap?.classList.add('is-fallback');
    });
  });

  if (prefersReducedMotion()) {
    cards.forEach((card) => card.classList.add('is-visible'));
    return;
  }

  siteObservers.team?.disconnect();
  siteObservers.team = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          siteObservers.team.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -20px 0px' }
  );

  cards.forEach((card) => {
    if (!card.classList.contains('is-visible')) {
      siteObservers.team.observe(card);
    }
  });
}
window.initTeamCards = initTeamCards;

function initFacultyCards() {
  document.querySelectorAll('.faculty-card__photo-wrap').forEach((wrap) => {
    const img = wrap.querySelector('.faculty-card__photo');
    if (!img) {
      wrap.classList.add('is-fallback');
      return;
    }
    img.addEventListener('error', () => wrap.classList.add('is-fallback'));
  });
}

function initNavbar() {
  const navbar = document.querySelector('.navbar');
  if (!navbar || navbar.dataset.scrollBound === 'true') return;
  navbar.dataset.scrollBound = 'true';

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      navbar.classList.toggle('scrolled', window.scrollY > 40);
    });
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

function initSmoothNav() {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href || href === '#' || href.length < 2) return;
    // Only handle in-page anchors; leave cross-page links alone
    if (href === '#join' && !document.getElementById('join')) {
      e.preventDefault();
      window.location.href = '/join';
      return;
    }
    const target = document.querySelector(href);
    if (!target) {
      // Known legacy hashes → multi-page routes
      const map = {
        '#about': '/about',
        '#events': '/events',
        '#faculty': '/about#faculty',
        '#core': '/team#core',
        '#ambassadors': '/team#ambassadors',
        '#members': '/team#members',
        '#legacy': '/about#legacy',
        '#testimonials': '/about#testimonials',
        '#partners': '/about#partners',
        '#projects': '/projects',
        '#gallery': '/gallery',
        '#resources': '/resources',
        '#certificates': '/resources#certificates',
        '#contact': '/contact',
        '#join': '/join'
      };
      if (map[href]) {
        e.preventDefault();
        window.location.href = map[href];
      }
      return;
    }

    e.preventDefault();
    if (window.RC_REVEAL) RC_REVEAL.revealIn(target, { instant: true });
    target.scrollIntoView({ behavior: 'auto', block: 'start' });
    history.replaceState(null, '', href);
  });
}

function initMobileMenu() {
  const btn = document.querySelector('.mobile-menu-btn');
  const menu = document.querySelector('.mobile-nav');
  const overlay = document.querySelector('.mobile-nav-overlay');
  if (!btn || !menu) return;

  const close = () => {
    btn.classList.remove('open');
    menu.classList.remove('open');
    overlay?.classList.remove('open');
    document.body.style.overflow = '';
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', 'Open menu');
  };

  const open = () => {
    menu.classList.add('open');
    btn.classList.add('open');
    overlay?.classList.add('open');
    document.body.style.overflow = 'hidden';
    btn.setAttribute('aria-expanded', 'true');
    btn.setAttribute('aria-label', 'Close menu');
  };

  btn.addEventListener('click', () => {
    if (menu.classList.contains('open')) {
      close();
    } else {
      open();
    }
  });

  overlay?.addEventListener('click', close);

  menu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', close);
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth >= 1280) close();
  });
}

const eventsCarousel = {
  timer: null,
  scrollRaf: null,
  bound: false,
  isHovered: false,
  isTouching: false,
  isVisible: false,
  pauseUntil: 0,
  focusedIdx: -1,
  container: null,
  wrapper: null,
  visibilityObserver: null,
  AUTO_MS: 4500
};

function eventsGetContainer() {
  return eventsCarousel.container || document.querySelector('.events-scroll');
}

function eventsGetCards() {
  const container = eventsGetContainer();
  return container ? [...container.querySelectorAll('.event-card')] : [];
}

function eventsUpdateProgress() {
  const container = eventsGetContainer();
  const progressFill = document.querySelector('.events-progress-fill');
  if (!container || !progressFill) return;

  const maxScroll = container.scrollWidth - container.clientWidth;
  const progress = maxScroll > 0 ? (container.scrollLeft / maxScroll) * 100 : 0;
  progressFill.style.width = `${Math.min(100, Math.max(0, progress))}%`;
}

function eventsGetCurrentCardIndex() {
  const container = eventsGetContainer();
  const cards = eventsGetCards();
  if (!container || !cards.length) return 0;

  const scrollCenter = container.scrollLeft + container.clientWidth / 2;
  let currentIdx = 0;
  let best = Infinity;

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const cardCenter = card.offsetLeft + card.offsetWidth / 2;
    const dist = Math.abs(cardCenter - scrollCenter);
    if (dist < best) {
      best = dist;
      currentIdx = i;
    }
  }

  return currentIdx;
}

function eventsUpdateSpotlight() {
  const cards = eventsGetCards();
  if (!cards.length) return;

  const closestIdx = eventsGetCurrentCardIndex();
  if (closestIdx === eventsCarousel.focusedIdx) return;

  if (eventsCarousel.focusedIdx >= 0 && cards[eventsCarousel.focusedIdx]) {
    cards[eventsCarousel.focusedIdx].classList.remove('is-focused');
  }
  cards[closestIdx]?.classList.add('is-focused');
  eventsCarousel.focusedIdx = closestIdx;
}

function eventsOnScroll() {
  if (eventsCarousel.scrollRaf) return;
  eventsCarousel.scrollRaf = requestAnimationFrame(() => {
    eventsCarousel.scrollRaf = null;
    eventsUpdateProgress();
    eventsUpdateSpotlight();
  });
}

function eventsPauseAuto(ms = 5000) {
  eventsCarousel.pauseUntil = Date.now() + ms;
}

function eventsScrollToCardIndex(index, { smooth = true, pause = true } = {}) {
  const container = eventsGetContainer();
  const cards = eventsGetCards();
  if (!container || !cards.length) return;

  const total = cards.length;
  const targetIdx = ((index % total) + total) % total;
  const card = cards[targetIdx];
  const left = card.offsetLeft - (container.clientWidth - card.offsetWidth) / 2;

  container.classList.toggle('is-auto-scrolling', !smooth);
  container.scrollTo({
    left: Math.max(0, left),
    behavior: smooth ? 'smooth' : 'auto'
  });

  if (!smooth) {
    // Re-enable snap after instant jump settles
    requestAnimationFrame(() => {
      container.classList.remove('is-auto-scrolling');
    });
  }

  if (pause) eventsPauseAuto();
  eventsCarousel.focusedIdx = -1;
  eventsOnScroll();
}

function eventsScrollByDirection(direction) {
  if (!eventsGetCards().length) return;
  const current = eventsGetCurrentCardIndex();
  const next = direction === 'next' ? current + 1 : current - 1;
  eventsScrollToCardIndex(next);
}

function eventsStopAutoScroll() {
  if (eventsCarousel.timer) {
    clearInterval(eventsCarousel.timer);
    eventsCarousel.timer = null;
  }
}

function eventsCanAutoScroll() {
  if (document.hidden) return false;
  if (prefersReducedMotion()) return false;
  if (!eventsCarousel.isVisible) return false;
  if (eventsCarousel.isHovered || eventsCarousel.isTouching) return false;
  if (Date.now() < eventsCarousel.pauseUntil) return false;

  const container = eventsGetContainer();
  if (!container) return false;
  if (eventsGetCards().length < 2) return false;

  return container.scrollWidth > container.clientWidth + 2;
}

function eventsAutoAdvance() {
  if (!eventsCanAutoScroll()) return;

  const cards = eventsGetCards();
  if (!cards.length) return;

  const current = eventsGetCurrentCardIndex();
  const next = current + 1 >= cards.length ? 0 : current + 1;
  eventsScrollToCardIndex(next, { smooth: true, pause: false });
}

function eventsStartAutoScroll() {
  if (prefersReducedMotion() || document.hidden) return;
  if (eventsCarousel.timer) return;

  eventsCarousel.timer = setInterval(() => {
    eventsAutoAdvance();
  }, eventsCarousel.AUTO_MS);
}

function initEventsScroll() {
  const wrapper = document.querySelector('.events-wrapper');
  const container = document.querySelector('.events-scroll');
  if (!wrapper || !container) return;

  eventsCarousel.wrapper = wrapper;
  eventsCarousel.container = container;
  eventsCarousel.focusedIdx = -1;

  if (!eventsCarousel.bound) {
    eventsCarousel.bound = true;

    wrapper.addEventListener('click', (e) => {
      if (e.target.closest('.events-nav-btn.prev')) {
        e.preventDefault();
        e.stopPropagation();
        eventsScrollByDirection('prev');
      }
      if (e.target.closest('.events-nav-btn.next')) {
        e.preventDefault();
        e.stopPropagation();
        eventsScrollByDirection('next');
      }
    });

    wrapper.addEventListener('pointerenter', () => {
      eventsCarousel.isHovered = true;
    });

    wrapper.addEventListener('pointerleave', () => {
      eventsCarousel.isHovered = false;
    });

    container.addEventListener('touchstart', () => {
      eventsCarousel.isTouching = true;
      eventsPauseAuto(4000);
    }, { passive: true });

    container.addEventListener('touchend', () => {
      setTimeout(() => { eventsCarousel.isTouching = false; }, 600);
    }, { passive: true });

    container.addEventListener('scroll', eventsOnScroll, { passive: true });
    container.addEventListener('wheel', () => eventsPauseAuto(4000), { passive: true });

    // Cheap spotlight highlight only — no 3D tilt (that caused lag)
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      let highlightRaf = null;
      container.addEventListener('pointermove', (e) => {
        const card = e.target.closest('.event-card.is-focused');
        if (!card) return;
        if (highlightRaf) return;
        highlightRaf = requestAnimationFrame(() => {
          highlightRaf = null;
          const rect = card.getBoundingClientRect();
          card.style.setProperty('--mouse-x', `${((e.clientX - rect.left) / rect.width) * 100}%`);
          card.style.setProperty('--mouse-y', `${((e.clientY - rect.top) / rect.height) * 100}%`);
        });
      });
    }

    eventsCarousel.visibilityObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          eventsCarousel.isVisible = entry.isIntersecting;
          if (!entry.isIntersecting) {
            eventsCarousel.isHovered = false;
            eventsCarousel.isTouching = false;
            eventsStopAutoScroll();
          } else if (!document.hidden) {
            eventsStartAutoScroll();
          }
        });
      },
      { threshold: 0.1 }
    );

    eventsCarousel.visibilityObserver.observe(wrapper);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        eventsStopAutoScroll();
      } else if (eventsCarousel.isVisible) {
        eventsStartAutoScroll();
      }
    });

    let resizeRaf = null;
    window.addEventListener('resize', () => {
      if (resizeRaf) return;
      resizeRaf = requestAnimationFrame(() => {
        resizeRaf = null;
        eventsCarousel.focusedIdx = -1;
        eventsOnScroll();
      });
    });
  }

  eventsOnScroll();

  requestAnimationFrame(() => {
    const rect = wrapper.getBoundingClientRect();
    const inView = rect.top < window.innerHeight && rect.bottom > 0;
    if (inView || eventsCarousel.isVisible) {
      eventsCarousel.isVisible = true;
      eventsStartAutoScroll();
    }
  });
}

function initStatCounters() {
  const counters = document.querySelectorAll('.stat-number[data-count]');
  if (!counters.length) return;

  const formatCount = (el, value) => {
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    return `${prefix}${value}${suffix}`;
  };

  const animateCounter = (el) => {
    const target = parseInt(el.dataset.count, 10);
    const duration = 1400;
    const start = performance.now();

    el.classList.add('counting');

    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(target * eased);
      el.textContent = formatCount(el, value);

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        el.classList.remove('counting');
      }
    };

    if (prefersReducedMotion()) {
      el.textContent = formatCount(el, target);
      return;
    }

    requestAnimationFrame(tick);
  };

  siteObservers.stats?.disconnect();
  siteObservers.stats = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !entry.target.dataset.counted) {
          entry.target.dataset.counted = 'true';
          animateCounter(entry.target);
          siteObservers.stats.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.4 }
  );

  counters.forEach((counter) => {
    if (!counter.dataset.counted) siteObservers.stats.observe(counter);
  });
}

function initPopAnimations() {
  const items = document.querySelectorAll('.animate-pop');
  if (!items.length) return;

  if (prefersReducedMotion()) {
    items.forEach((item) => item.classList.add('in-view'));
    return;
  }

  siteObservers.pop?.disconnect();
  siteObservers.pop = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          siteObservers.pop.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.25 }
  );

  items.forEach((item) => {
    if (!item.classList.contains('in-view')) siteObservers.pop.observe(item);
  });
}

function initBackToTop() {
  const btn = document.querySelector('.back-to-top');
  const bar = document.querySelector('.scroll-progress');
  let ticking = false;

  const update = () => {
    ticking = false;
    const y = window.scrollY;
    if (btn) btn.classList.toggle('visible', y > 500);
    if (bar) {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (y / docHeight) * 100 : 0;
      bar.style.width = `${progress}%`;
    }
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });

  update();

  btn?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  });
}

function initScrollProgress() {
  // Handled inside initBackToTop to avoid duplicate scroll listeners
}

function initActiveNav() {
  // Multi-page: active state set by site-chrome via data-page
  const pageLinks = document.querySelectorAll('.nav-link[data-page]');
  if (pageLinks.length) return;

  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link[data-section]');
  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach((link) => {
            link.classList.toggle('active', link.dataset.section === id);
          });
        }
      });
    },
    { rootMargin: '-40% 0px -50% 0px', threshold: 0 }
  );

  sections.forEach((section) => observer.observe(section));
}
