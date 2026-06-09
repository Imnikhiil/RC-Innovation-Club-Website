async function initGalleryHome(items) {
  if (!window.RC_GALLERY) return;
  const grid = document.getElementById('cms-gallery-grid');
  if (grid) await RC_GALLERY.hydrateCardMedia(grid);
  if (typeof window.initGalleryLightbox === 'function') {
    window.initGalleryLightbox(items || RC_GALLERY.getHomeItems());
  }
}
window.initGalleryHome = initGalleryHome;

function initSite() {
  if (typeof window.renderSite === 'function') {
    window.renderSite(window.RC_CMS.getContent());
  }
  initTeamCards();
  initFacultyCards();
  if (window.RC_TEAM_HIERARCHY) RC_TEAM_HIERARCHY.init();
  initStatCounters();
  initPopAnimations();
  initEventsScroll();
  updateMembershipCTA();
  initGalleryHome();
  if (typeof AOS !== 'undefined') AOS.refresh();
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
    e.preventDefault();
    const joinSection = document.getElementById('join');
    if (joinSection) joinSection.scrollIntoView({ behavior: 'smooth' });
    setTimeout(openMembershipForm, 400);
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
      interests: document.getElementById('mem-interests')?.value || '',
      reason: document.getElementById('mem-reason')?.value || ''
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

  if (window.RC_MEMBERSHIP.isRegistrationOpen() && window.location.hash === '#join') {
    setTimeout(openMembershipForm, 600);
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

document.addEventListener('DOMContentLoaded', async () => {
  await RC_CMS.init();
  if (window.RC_CERTIFICATES?.init) await RC_CERTIFICATES.init();

  if (window.RC_THEME) RC_THEME.init();
  if (window.RC_SEO) RC_SEO.init();
  if (window.RC_ANALYTICS) RC_ANALYTICS.init();
  initMembershipRegistration();
  initContactForm();
  if (window.RC_CERTIFICATES) RC_CERTIFICATES.initVerify();
  if (typeof window.initAnnouncementBar === 'function') window.initAnnouncementBar();
  initNewsletterForm();
  initSite();

  window.addEventListener('rc-content-updated', () => initSite());

  try {
    if (typeof AOS !== 'undefined') {
      AOS.init({
        duration: 800,
        once: true,
        offset: 40,
        easing: 'ease-out-cubic',
        disable: () => window.innerWidth < 480
      });
    }
  } catch (err) {
    console.warn('AOS init skipped:', err);
  }

  initNavbar();
  initMobileMenu();
  initBackToTop();
  initScrollProgress();
  initActiveNav();

  window.addEventListener('rc-content-updated', initSite);
});

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function initTeamCards() {
  const cards = document.querySelectorAll('.team-card');
  if (!cards.length) return;

  cards.forEach((card) => {
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

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );

  cards.forEach((card) => observer.observe(card));
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
  if (!navbar) return;

  const onScroll = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
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
  raf: null,
  bound: false,
  isHovered: false,
  isTouching: false,
  isVisible: false,
  pauseUntil: 0,
  container: null,
  wrapper: null,
  SCROLL_SPEED: 0.55
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
  progressFill.style.width = `${progress}%`;
}

function eventsUpdateSpotlight() {
  const container = eventsGetContainer();
  const cards = eventsGetCards();
  if (!container || !cards.length) return;

  const containerRect = container.getBoundingClientRect();
  const centerX = containerRect.left + containerRect.width / 2;
  let closest = cards[0];
  let closestDist = Infinity;

  cards.forEach((card) => {
    const rect = card.getBoundingClientRect();
    const cardCenter = rect.left + rect.width / 2;
    const dist = Math.abs(centerX - cardCenter);
    if (dist < closestDist) {
      closestDist = dist;
      closest = card;
    }
  });

  cards.forEach((card) => {
    card.classList.toggle('is-focused', card === closest);
  });
}

function eventsOnScroll() {
  eventsUpdateProgress();
  eventsUpdateSpotlight();
}

function eventsPauseAuto(ms = 2500) {
  eventsCarousel.pauseUntil = Date.now() + ms;
}

function eventsGetCurrentCardIndex() {
  const container = eventsGetContainer();
  const cards = eventsGetCards();
  if (!container || !cards.length) return 0;

  const scrollCenter = container.scrollLeft + container.clientWidth / 2;
  let currentIdx = 0;
  let best = Infinity;

  cards.forEach((card, i) => {
    const cardCenter = card.offsetLeft + card.offsetWidth / 2;
    const dist = Math.abs(cardCenter - scrollCenter);
    if (dist < best) {
      best = dist;
      currentIdx = i;
    }
  });

  return currentIdx;
}

function eventsScrollToCardIndex(index, { smooth = true, pause = true } = {}) {
  const cards = eventsGetCards();
  if (!cards.length) return;

  const total = cards.length;
  const targetIdx = ((index % total) + total) % total;

  cards[targetIdx].scrollIntoView({
    behavior: smooth ? 'smooth' : 'auto',
    inline: 'center',
    block: 'nearest'
  });

  if (pause) eventsPauseAuto();
  requestAnimationFrame(eventsOnScroll);
}

function eventsScrollByDirection(direction) {
  if (!eventsGetCards().length) return;
  const current = eventsGetCurrentCardIndex();
  const next = direction === 'next' ? current + 1 : current - 1;
  eventsScrollToCardIndex(next);
}

function eventsStopAutoScroll() {
  if (eventsCarousel.raf) {
    cancelAnimationFrame(eventsCarousel.raf);
    eventsCarousel.raf = null;
  }
  eventsGetContainer()?.classList.remove('is-auto-scrolling');
}

function eventsCanAutoScroll() {
  if (prefersReducedMotion()) return false;
  if (!eventsCarousel.isVisible) return false;
  if (eventsCarousel.isHovered || eventsCarousel.isTouching) return false;
  if (Date.now() < eventsCarousel.pauseUntil) return false;

  const container = eventsGetContainer();
  if (!container) return false;
  if (eventsGetCards().length < 2) return false;

  return container.scrollWidth > container.clientWidth + 2;
}

function eventsAutoScrollTick() {
  eventsCarousel.raf = requestAnimationFrame(eventsAutoScrollTick);

  const container = eventsGetContainer();
  if (!container) return;

  if (!eventsCanAutoScroll()) {
    container.classList.remove('is-auto-scrolling');
    return;
  }

  container.classList.add('is-auto-scrolling');
  container.scrollLeft += eventsCarousel.SCROLL_SPEED;

  const maxScroll = container.scrollWidth - container.clientWidth;
  if (maxScroll > 0 && container.scrollLeft >= maxScroll - 1) {
    container.scrollLeft = 0;
  }

  eventsUpdateProgress();
  eventsUpdateSpotlight();
}

function eventsStartAutoScroll() {
  if (eventsCarousel.raf || prefersReducedMotion()) return;
  eventsCarousel.raf = requestAnimationFrame(eventsAutoScrollTick);
}

function initEventsScroll() {
  const wrapper = document.querySelector('.events-wrapper');
  const container = document.querySelector('.events-scroll');
  if (!wrapper || !container) return;

  eventsCarousel.wrapper = wrapper;
  eventsCarousel.container = container;

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

    container.addEventListener('pointerenter', () => {
      eventsCarousel.isHovered = true;
    });

    container.addEventListener('pointerleave', () => {
      eventsCarousel.isHovered = false;
    });

    container.addEventListener('touchstart', () => {
      eventsCarousel.isTouching = true;
      eventsPauseAuto(2000);
    }, { passive: true });

    container.addEventListener('touchend', () => {
      setTimeout(() => { eventsCarousel.isTouching = false; }, 800);
    }, { passive: true });

    container.addEventListener('scroll', eventsOnScroll, { passive: true });

    container.addEventListener('mousemove', (e) => {
      const card = e.target.closest('.event-card');
      if (!card || !card.classList.contains('is-focused')) return;

      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty('--mouse-x', `${x}%`);
      card.style.setProperty('--mouse-y', `${y}%`);

      const tiltX = ((e.clientX - rect.left) / rect.width - 0.5) * 10;
      const tiltY = ((e.clientY - rect.top) / rect.height - 0.5) * -10;
      card.style.transform = `perspective(900px) rotateY(${tiltX}deg) rotateX(${tiltY}deg) scale(1.04) translateY(-6px)`;
    });

    container.addEventListener('mouseleave', () => {
      eventsGetCards().forEach((card) => { card.style.transform = ''; });
    });

    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          eventsCarousel.isVisible = entry.isIntersecting;
          if (!entry.isIntersecting) {
            eventsCarousel.isHovered = false;
            eventsCarousel.isTouching = false;
          }
          if (eventsCarousel.isVisible) {
            eventsStartAutoScroll();
          } else {
            eventsStopAutoScroll();
          }
        });
      },
      { threshold: 0.15 }
    );

    visibilityObserver.observe(wrapper);
    window.addEventListener('resize', eventsOnScroll);
  }

  eventsOnScroll();

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      eventsOnScroll();
      if (eventsCarousel.isVisible) {
        eventsStartAutoScroll();
      }
    });
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
    const duration = 1800;
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

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !entry.target.dataset.counted) {
          entry.target.dataset.counted = 'true';
          animateCounter(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach((counter) => observer.observe(counter));
}

function initPopAnimations() {
  const items = document.querySelectorAll('.animate-pop');
  if (!items.length) return;

  if (prefersReducedMotion()) {
    items.forEach((item) => item.classList.add('in-view'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.3 }
  );

  items.forEach((item) => observer.observe(item));
}

function initBackToTop() {
  const btn = document.querySelector('.back-to-top');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 500);
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function initScrollProgress() {
  const bar = document.querySelector('.scroll-progress');
  if (!bar) return;

  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width = `${progress}%`;
  }, { passive: true });
}

function initActiveNav() {
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
    { rootMargin: '-35% 0px -50% 0px', threshold: 0 }
  );

  sections.forEach((section) => observer.observe(section));
}
