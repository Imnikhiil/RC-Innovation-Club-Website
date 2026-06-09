const galleryLightboxState = {
  items: [],
  index: 0,
  bound: false
};

function initGalleryLightbox(items) {
  galleryLightboxState.items = items;

  if (!galleryLightboxState.bound) {
    galleryLightboxState.bound = true;
    document.addEventListener('click', onGalleryCardClick);
    document.addEventListener('keydown', onGalleryLightboxKeydown);
    document.getElementById('gallery-lightbox')?.addEventListener('click', (e) => {
      if (e.target.closest('[data-lightbox-close]')) closeGalleryLightbox();
    });
    document.getElementById('gallery-lightbox-prev')?.addEventListener('click', () => stepGalleryLightbox(-1));
    document.getElementById('gallery-lightbox-next')?.addEventListener('click', () => stepGalleryLightbox(1));

    document.addEventListener('keydown', (e) => {
      const card = e.target.closest('.gallery-card[data-gallery-id]');
      if (!card || (e.key !== 'Enter' && e.key !== ' ')) return;
      e.preventDefault();
      card.click();
    });
  }
}

function onGalleryCardClick(e) {
  const card = e.target.closest('.gallery-card[data-gallery-id]');
  if (!card) return;
  e.preventDefault();
  const id = card.dataset.galleryId;
  const items = galleryLightboxState.items.length
    ? galleryLightboxState.items
    : (window.RC_GALLERY?.getItems() || []);
  const index = items.findIndex((item) => item.id === id);
  if (index >= 0) openGalleryLightbox(items, index);
}

function onGalleryLightboxKeydown(e) {
  const lb = document.getElementById('gallery-lightbox');
  if (!lb?.classList.contains('is-open')) return;
  if (e.key === 'Escape') closeGalleryLightbox();
  if (e.key === 'ArrowLeft') stepGalleryLightbox(-1);
  if (e.key === 'ArrowRight') stepGalleryLightbox(1);
}

async function openGalleryLightbox(items, index) {
  const lb = document.getElementById('gallery-lightbox');
  if (!lb) return;

  galleryLightboxState.items = items;
  galleryLightboxState.index = index;
  lb.classList.add('is-open');
  lb.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  await renderGalleryLightboxSlide();
}

function closeGalleryLightbox() {
  const lb = document.getElementById('gallery-lightbox');
  const video = document.getElementById('gallery-lightbox-video');
  if (video) {
    video.pause();
    video.removeAttribute('src');
    video.load();
  }
  if (lb) {
    lb.classList.remove('is-open');
    lb.setAttribute('aria-hidden', 'true');
  }
  document.body.style.overflow = '';
}

async function stepGalleryLightbox(dir) {
  const total = galleryLightboxState.items.length;
  if (!total) return;
  galleryLightboxState.index = (galleryLightboxState.index + dir + total) % total;
  await renderGalleryLightboxSlide();
}

async function renderGalleryLightboxSlide() {
  const item = galleryLightboxState.items[galleryLightboxState.index];
  if (!item) return;

  const mediaWrap = document.getElementById('gallery-lightbox-media');
  const titleEl = document.getElementById('gallery-lightbox-title');
  const metaEl = document.getElementById('gallery-lightbox-meta');
  const descEl = document.getElementById('gallery-lightbox-desc');
  const counterEl = document.getElementById('gallery-lightbox-counter');

  if (titleEl) titleEl.textContent = item.title;
  if (descEl) descEl.textContent = item.description || '';
  if (counterEl) {
    counterEl.textContent = `${galleryLightboxState.index + 1} / ${galleryLightboxState.items.length}`;
  }
  if (metaEl) {
    const parts = [];
    if (item.eventDate) parts.push(`<span><i class="fas fa-calendar-alt"></i> ${RC_GALLERY.escapeHtml(RC_GALLERY.formatDate(item.eventDate))}</span>`);
    parts.push(`<span><i class="fas fa-tag"></i> ${RC_GALLERY.escapeHtml(item.category)}</span>`);
    if (item.uploadedAt) parts.push(`<span><i class="fas fa-upload"></i> ${RC_GALLERY.escapeHtml(RC_GALLERY.formatUploadDate(item.uploadedAt))}</span>`);
    metaEl.innerHTML = parts.join('');
  }

  if (!mediaWrap) return;
  mediaWrap.innerHTML = '<div class="gallery-lightbox__loading"><i class="fas fa-spinner fa-spin"></i></div>';

  const url = await RC_GALLERY.resolveMediaUrl(item);
  if (item.type === 'video') {
    mediaWrap.innerHTML = `
      <video id="gallery-lightbox-video" class="gallery-lightbox__video" controls playsinline preload="metadata">
        <source src="${RC_GALLERY.escapeHtml(url)}" />
      </video>
    `;
    document.getElementById('gallery-lightbox-video')?.play().catch(() => {});
  } else {
    mediaWrap.innerHTML = `<img class="gallery-lightbox__image" src="${RC_GALLERY.escapeHtml(url)}" alt="${RC_GALLERY.escapeHtml(item.title)}" />`;
  }
}

window.initGalleryLightbox = initGalleryLightbox;
window.openGalleryLightbox = openGalleryLightbox;
window.closeGalleryLightbox = closeGalleryLightbox;
