window.RC_TESTIMONIALS = {
  getInitials(name) {
    return String(name || '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0])
      .join('')
      .toUpperCase() || '?';
  },

  renderStars(rating) {
    const n = Math.min(5, Math.max(0, parseInt(rating, 10) || 0));
    if (!n) return '';
    return `<div class="testimonial-card__stars" aria-label="${n} out of 5 stars">${Array.from({ length: 5 }, (_, i) =>
      `<i class="fas fa-star${i < n ? '' : ' testimonial-card__star--empty'}" aria-hidden="true"></i>`
    ).join('')}</div>`;
  },

  buildCardHtml(item, index) {
    const name = this.escapeHtml(item.name);
    const role = this.escapeHtml(item.role);
    const quote = this.escapeHtml(item.quote);
    const img = item.image?.trim();
    const avatar = img
      ? `<img src="${this.escapeHtml(img)}" alt="" class="testimonial-card__avatar" loading="lazy" onerror="this.style.display='none';this.nextElementSibling?.classList.remove('is-hidden');" />
         <span class="testimonial-card__initials is-hidden">${this.escapeHtml(this.getInitials(item.name))}</span>`
      : `<span class="testimonial-card__initials">${this.escapeHtml(this.getInitials(item.name))}</span>`;

    return `
      <article class="testimonial-card glass card-hover" data-testimonial-index="${index}">
        <div class="testimonial-card__quote-icon" aria-hidden="true"><i class="fas fa-quote-left"></i></div>
        ${this.renderStars(item.rating)}
        <blockquote class="testimonial-card__quote">${quote}</blockquote>
        <div class="testimonial-card__author">
          <div class="testimonial-card__avatar-wrap">${avatar}</div>
          <div>
            <p class="testimonial-card__name">${name}</p>
            ${role ? `<p class="testimonial-card__role">${role}</p>` : ''}
          </div>
        </div>
      </article>
    `;
  },

  escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },

  initCarousel() {
    const track = document.getElementById('testimonials-track');
    const prev = document.getElementById('testimonials-prev');
    const next = document.getElementById('testimonials-next');
    const dots = document.getElementById('testimonials-dots');
    const wrap = document.getElementById('testimonials-carousel');
    if (!track || !wrap) return;

    const cards = track.querySelectorAll('.testimonial-card');
    if (!cards.length) {
      wrap.hidden = true;
      return;
    }
    wrap.hidden = false;

    let index = 0;
    let autoTimer;

    const perView = () => {
      if (window.innerWidth >= 1024) return Math.min(3, cards.length);
      if (window.innerWidth >= 640) return Math.min(2, cards.length);
      return 1;
    };

    const maxIndex = () => Math.max(0, cards.length - perView());

    const update = () => {
      const pv = perView();
      const max = maxIndex();
      if (index > max) index = max;
      const card = cards[0];
      const gap = parseFloat(getComputedStyle(track).gap) || 16;
      const cardWidth = card.offsetWidth;
      const offset = index * (cardWidth + gap);
      track.style.transform = `translateX(-${offset}px)`;

      if (prev) prev.disabled = index <= 0;
      if (next) next.disabled = index >= max;

      if (dots) {
        dots.querySelectorAll('[data-dot]').forEach((dot, i) => {
          dot.classList.toggle('is-active', i === index);
          dot.setAttribute('aria-selected', i === index ? 'true' : 'false');
        });
      }
    };

    const goTo = (i) => {
      index = Math.max(0, Math.min(maxIndex(), i));
      update();
    };

    const buildDots = () => {
      if (!dots) return;
      const count = maxIndex() + 1;
      if (count <= 1) {
        dots.innerHTML = '';
        dots.hidden = true;
        return;
      }
      dots.hidden = false;
      dots.innerHTML = Array.from({ length: count }, (_, i) =>
        `<button type="button" class="testimonials-dot${i === index ? ' is-active' : ''}" data-dot="${i}" aria-label="Go to testimonial ${i + 1}" aria-selected="${i === index ? 'true' : 'false'}"></button>`
      ).join('');

      dots.querySelectorAll('[data-dot]').forEach((btn) => {
        btn.addEventListener('click', () => goTo(parseInt(btn.dataset.dot, 10)));
      });
    };

    const startAuto = () => {
      clearInterval(autoTimer);
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      if (cards.length <= perView()) return;
      autoTimer = setInterval(() => {
        goTo(index >= maxIndex() ? 0 : index + 1);
      }, 6000);
    };

    if (wrap.dataset.bound === 'true') {
      index = Math.min(index, maxIndex());
      buildDots();
      update();
      startAuto();
      return;
    }
    wrap.dataset.bound = 'true';

    prev?.addEventListener('click', () => goTo(index - 1));
    next?.addEventListener('click', () => goTo(index + 1));

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        buildDots();
        update();
      }, 150);
    });

    track.addEventListener('mouseenter', () => clearInterval(autoTimer));
    track.addEventListener('mouseleave', startAuto);

    buildDots();
    update();
    startAuto();
  }
};
