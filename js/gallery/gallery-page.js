let galleryPageItems = [];
let galleryPageFilter = { category: 'all', search: '' };

async function initGalleryPage() {
  if (!window.RC_GALLERY) return;

  const content = window.RC_CMS.getContent();
  if (window.RC_THEME) RC_THEME.init();
  if (window.RC_SEO) RC_SEO.init('gallery');
  if (window.RC_ANALYTICS) RC_ANALYTICS.init('gallery');
  if (typeof window.renderAnnouncementBar === 'function') {
    window.renderAnnouncementBar(content.announcementBar);
  }
  if (typeof window.initAnnouncementBar === 'function') {
    window.initAnnouncementBar();
  }

  const section = content.gallerySection || {};
  document.getElementById('gallery-page-eyebrow').textContent = section.eyebrow || 'Moments';
  document.getElementById('gallery-page-title').textContent = section.title || 'Gallery';
  document.getElementById('gallery-page-subtitle').textContent = section.subtitle || '';

  galleryPageItems = RC_GALLERY.getItems();
  renderGalleryFilters();
  await renderGalleryPageGrid();
  initGalleryLightbox(galleryPageItems);

  document.getElementById('gallery-search')?.addEventListener('input', (e) => {
    clearTimeout(window._gallerySearchTimer);
    window._gallerySearchTimer = setTimeout(async () => {
      galleryPageFilter.search = e.target.value;
      await renderGalleryPageGrid();
    }, 250);
  });
}

function renderGalleryFilters() {
  const wrap = document.getElementById('gallery-filters');
  if (!wrap) return;

  const cats = ['all', ...RC_GALLERY.CATEGORIES];
  wrap.innerHTML = cats.map((cat) => `
    <button type="button" class="gallery-filter-btn${galleryPageFilter.category === cat ? ' is-active' : ''}" data-category="${RC_GALLERY.escapeHtml(cat)}">
      ${cat === 'all' ? 'All' : RC_GALLERY.escapeHtml(cat)}
    </button>
  `).join('');

  wrap.querySelectorAll('.gallery-filter-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      galleryPageFilter.category = btn.dataset.category;
      renderGalleryFilters();
      await renderGalleryPageGrid();
    });
  });
}

async function renderGalleryPageGrid() {
  const grid = document.getElementById('gallery-page-grid');
  const empty = document.getElementById('gallery-page-empty');
  if (!grid) return;

  const filtered = RC_GALLERY.filterItems(galleryPageItems, galleryPageFilter);
  grid.innerHTML = filtered.map((item, i) => RC_GALLERY.buildCardHtml(item, i)).join('');
  await RC_GALLERY.hydrateCardMedia(grid);

  if (empty) empty.style.display = filtered.length ? 'none' : 'block';
  initGalleryLightbox(filtered);
}

document.addEventListener('DOMContentLoaded', initGalleryPage);
window.addEventListener('rc-content-updated', initGalleryPage);
