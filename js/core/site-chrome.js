/**
 * Shared navbar + footer for multi-page public site.
 * Expects placeholders: #site-nav-mount, #site-footer-mount
 * Optional: #site-announce-mount (announcement bar)
 */
window.RC_SITE_CHROME = {
  NAV_ITEMS: [
    { href: '/', label: 'Home', key: 'home' },
    { href: '/about', label: 'About', key: 'about' },
    { href: '/events', label: 'Events', key: 'events' },
    { href: '/team', label: 'Team', key: 'team' },
    { href: '/projects', label: 'Projects', key: 'projects' },
    { href: '/gallery', label: 'Gallery', key: 'gallery' },
    { href: '/resources', label: 'Resources', key: 'resources' },
    { href: '/contact', label: 'Contact', key: 'contact' }
  ],

  getPageKey() {
    const raw = (window.location.pathname || '/').toLowerCase().replace(/\/+$/, '') || '/';
    const file = raw.split('/').pop() || '';
    if (!file || file === 'index.html' || raw === '/') return 'home';
    return file.replace(/\.html$/, '');
  },

  themeControls(compact) {
    const cls = compact ? 'theme-picker theme-picker--compact' : 'theme-picker';
    return `
      <div class="${cls}" data-theme-picker>
        <button type="button" class="theme-picker__trigger" data-theme-picker-trigger aria-label="Choose color theme" aria-haspopup="listbox" aria-expanded="false">
          <i class="fas fa-palette" aria-hidden="true"></i>
        </button>
        <div class="theme-picker__panel" data-theme-picker-panel hidden role="listbox" aria-label="Color themes">
          <p class="theme-picker__heading">Color theme</p>
          <div class="theme-picker__swatches">
            <button type="button" class="theme-picker__swatch theme-picker__swatch--ocean" data-color-pick="ocean" aria-label="Ocean" title="Ocean"></button>
            <button type="button" class="theme-picker__swatch theme-picker__swatch--sunset" data-color-pick="sunset" aria-label="Sunset" title="Sunset"></button>
            <button type="button" class="theme-picker__swatch theme-picker__swatch--emerald" data-color-pick="emerald" aria-label="Emerald" title="Emerald"></button>
            <button type="button" class="theme-picker__swatch theme-picker__swatch--royal" data-color-pick="royal" aria-label="Royal" title="Royal"></button>
            <button type="button" class="theme-picker__swatch theme-picker__swatch--coral" data-color-pick="coral" aria-label="Coral" title="Coral"></button>
          </div>
        </div>
      </div>
      <button type="button" class="theme-toggle" data-theme-toggle aria-label="Switch to light mode" aria-pressed="false">
        <i class="fas fa-sun theme-toggle__icon theme-toggle__icon--light" aria-hidden="true"></i>
        <i class="fas fa-moon theme-toggle__icon theme-toggle__icon--dark" aria-hidden="true"></i>
      </button>`;
  },

  renderNav() {
    const active = this.getPageKey();
    const links = this.NAV_ITEMS.map((item) => {
      const isActive = item.key === active ? ' active' : '';
      return `<a href="${item.href}" class="nav-link${isActive}" data-page="${item.key}">${item.label}</a>`;
    }).join('\n      ');

    const mobileLinks = this.NAV_ITEMS.map((item) => {
      const isActive = item.key === active ? ' class="active"' : '';
      return `<a href="${item.href}"${isActive}>${item.label}</a>`;
    }).join('\n    ');

    return `
  <div class="scroll-progress" aria-hidden="true"></div>
  <div class="mobile-nav-overlay xl:hidden" aria-hidden="true"></div>

  <div id="announce-bar" class="announce-bar announce-bar--hidden" role="region" aria-label="Site announcement" hidden>
    <div class="announce-bar__inner">
      <p class="announce-bar__text" id="cms-announce-text"></p>
      <a href="#" id="cms-announce-link" class="announce-bar__link"></a>
      <button type="button" class="announce-bar__dismiss" id="announce-dismiss" aria-label="Dismiss announcement">
        <i class="fas fa-times" aria-hidden="true"></i>
      </button>
    </div>
  </div>

  <nav class="navbar fixed w-full z-[100] glass flex justify-between items-center">
    <a href="/" class="navbar-brand flex items-center gap-3">
      <img src="assets/logo/logo.webp" alt="RC Innovation Club Logo"
        class="navbar-brand__logo w-10 h-10 rounded-xl object-cover border border-white/10" width="40" height="40" />
      <span class="navbar-brand__text text-lg hidden sm:block">
        RC Innovation <span class="navbar-brand__accent">Club</span>
      </span>
    </a>

    <div class="desktop-nav tracking-wide">
      ${links}
      <div class="theme-controls hidden xl:flex items-center gap-2">
        ${this.themeControls(false)}
      </div>
      <a href="/join" class="btn-primary px-5 py-2 rounded-full text-sm whitespace-nowrap${active === 'join' ? ' active' : ''}">Join Now</a>
    </div>

    <div class="theme-controls flex items-center gap-2 xl:hidden">
      ${this.themeControls(true)}
    </div>

    <button class="mobile-menu-btn xl:hidden" aria-label="Open menu" aria-expanded="false" type="button">
      <span></span><span></span><span></span>
    </button>
  </nav>

  <div class="mobile-nav xl:hidden">
    ${mobileLinks}
    <div class="mobile-theme-bar" aria-label="Color themes">
      <span class="mobile-theme-bar__label">Color theme</span>
      <div class="mobile-theme-bar__swatches">
        <button type="button" class="theme-picker__swatch theme-picker__swatch--ocean" data-color-pick="ocean" aria-label="Ocean" title="Ocean"></button>
        <button type="button" class="theme-picker__swatch theme-picker__swatch--sunset" data-color-pick="sunset" aria-label="Sunset" title="Sunset"></button>
        <button type="button" class="theme-picker__swatch theme-picker__swatch--emerald" data-color-pick="emerald" aria-label="Emerald" title="Emerald"></button>
        <button type="button" class="theme-picker__swatch theme-picker__swatch--royal" data-color-pick="royal" aria-label="Royal" title="Royal"></button>
        <button type="button" class="theme-picker__swatch theme-picker__swatch--coral" data-color-pick="coral" aria-label="Coral" title="Coral"></button>
      </div>
    </div>
    <a href="/join" class="mobile-nav-cta">Join Now</a>
  </div>`;
  },

  renderFooter() {
    return `
  <footer class="site-footer border-t border-white/10">
    <div class="site-container !px-0 max-w-[var(--container-max)]">
      <div class="footer-grid">
        <div class="footer-brand">
          <div class="flex items-center gap-3 mb-2">
            <img src="assets/logo/logo.webp" alt="" class="w-9 h-9 rounded-lg object-cover border border-white/10" width="36" height="36" />
            <span class="font-extrabold text-lg" id="cms-footer-brand">RC Innovation Club</span>
          </div>
          <p id="cms-footer-desc">Student-led innovation community at Delhi Skill and Entrepreneurship University, Rajokri Campus.</p>
          <div class="social-links mt-5">
            <a href="#" id="cms-footer-ig" target="_blank" rel="noopener" aria-label="Instagram">
              <i class="fab fa-instagram"></i>
            </a>
            <a href="#" id="cms-footer-wa" target="_blank" rel="noopener" aria-label="WhatsApp">
              <i class="fab fa-whatsapp"></i>
            </a>
            <a href="#" id="cms-footer-mail" aria-label="Email">
              <i class="fas fa-envelope"></i>
            </a>
          </div>
          <div class="share-section" id="share-section" hidden>
            <p class="share-section__label" id="share-section-label">Share this site</p>
            <div class="share-buttons" id="share-buttons"></div>
          </div>
        </div>

        <div>
          <h4 class="footer-heading">Navigate</h4>
          <div class="footer-links">
            <a href="/about">About</a>
            <a href="/events">Events</a>
            <a href="/team">Team</a>
            <a href="/gallery">Gallery</a>
          </div>
        </div>

        <div>
          <h4 class="footer-heading">Contact</h4>
          <div class="footer-links">
            <a href="#" id="cms-footer-email-link">rcinnovationclub@gmail.com</a>
            <a href="/contact">Contact Us</a>
            <a href="/resources#certificates">Verify Certificate</a>
            <a href="/join">Join the Club</a>
            <a href="#" id="cms-contact-ig" target="_blank" rel="noopener">Instagram</a>
          </div>
        </div>
      </div>

      <p class="text-center text-slate-600 text-sm" id="cms-footer-copyright"></p>
      <p class="text-center mt-4">
        <a href="/admin" class="text-slate-700 text-xs hover:text-sky-400 transition">Admin Panel</a>
      </p>
    </div>
  </footer>

  <button class="back-to-top" aria-label="Back to top" type="button">
    <i class="fas fa-arrow-up text-sm"></i>
  </button>`;
  },

  inject() {
    const navMount = document.getElementById('site-nav-mount');
    const footerMount = document.getElementById('site-footer-mount');
    if (navMount) navMount.outerHTML = this.renderNav();
    if (footerMount) footerMount.outerHTML = this.renderFooter();
    document.documentElement.dataset.page = this.getPageKey();
  }
};

(function bootChrome() {
  function run() {
    if (window.RC_SITE_CHROME) RC_SITE_CHROME.inject();
  }
  // defer scripts run after body parse — inject immediately so later inits find the nav
  if (document.getElementById('site-nav-mount') || document.getElementById('site-footer-mount')) {
    run();
  } else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
