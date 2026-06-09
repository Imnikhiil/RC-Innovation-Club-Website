window.RC_GALLERY = {
  CATEGORIES: ['Workshop', 'Robotics', 'Hackathon', 'Competition', 'Club Activity', 'Seminar', 'Other'],
  HOME_PREVIEW_COUNT: 6,
  VIDEO_MIN_SECONDS: 0,
  VIDEO_MAX_SECONDS: 90,

  migrateItem(item, index = 0) {
    if (!item) return null;
    const legacyImage = item.image || item.src || '';
    return {
      id: item.id || `gal_${index}_${legacyImage.slice(-12).replace(/\W/g, '') || 'item'}`,
      type: item.type || 'image',
      title: item.title || 'Untitled Event',
      eventDate: item.eventDate || '',
      description: item.description || '',
      category: item.category || 'Club Activity',
      src: item.mediaUrl || (item.mediaId ? '' : legacyImage),
      mediaId: item.mediaId || null,
      mediaUrl: item.mediaUrl || null,
      mediaPath: item.mediaPath || null,
      thumbnailId: item.thumbnailId || null,
      thumbnailUrl: item.thumbnailUrl || null,
      thumbnailPath: item.thumbnailPath || null,
      uploadedAt: item.uploadedAt || new Date().toISOString(),
      order: typeof item.order === 'number' ? item.order : index
    };
  },

  getItems() {
    const raw = window.RC_CMS?.getContent().gallery || [];
    return raw
      .map((item, i) => this.migrateItem(item, i))
      .filter(Boolean)
      .sort((a, b) => a.order - b.order);
  },

  getHomeItems() {
    return this.getItems().slice(0, this.HOME_PREVIEW_COUNT);
  },

  saveItems(items) {
    const content = window.RC_CMS.getContent();
    content.gallery = items.map((item, i) => ({ ...item, order: i }));
    return window.RC_CMS.saveContent(content).then(() => content.gallery);
  },

  formatDate(dateStr) {
    if (!dateStr) return '';
    try {
      return new Date(dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  },

  formatUploadDate(iso) {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric'
      });
    } catch {
      return '';
    }
  },

  escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },

  async resolveMediaUrl(item) {
    if (!item) return '';
    if (item.mediaUrl) return item.mediaUrl;
    if (item.mediaId && window.RC_GALLERY_MEDIA) {
      return RC_GALLERY_MEDIA.getObjectUrl(item.mediaId);
    }
    return item.src || item.image || '';
  },

  async resolveThumbnailUrl(item) {
    if (!item) return '';
    if (item.type === 'video') {
      if (item.thumbnailUrl) return item.thumbnailUrl;
      if (item.thumbnailId && window.RC_GALLERY_MEDIA) {
        return RC_GALLERY_MEDIA.getObjectUrl(item.thumbnailId, item.thumbnailUrl);
      }
      if (item.mediaUrl) return item.mediaUrl;
      if (item.mediaId && window.RC_GALLERY_MEDIA) {
        return RC_GALLERY_MEDIA.getObjectUrl(item.mediaId);
      }
    }
    return this.resolveMediaUrl(item);
  },

  filterItems(items, { category = 'all', search = '' } = {}) {
    let result = [...items];
    if (category && category !== 'all') {
      result = result.filter((item) => item.category === category);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter((item) =>
        [item.title, item.description, item.category, item.eventDate]
          .some((v) => String(v || '').toLowerCase().includes(q))
      );
    }
    return result;
  },

  buildCardHtml(item, index, { lazy = true, showMeta = true } = {}) {
    const isVideo = item.type === 'video';
    const mediaSrc = item.src || '';
    const thumbSrc = mediaSrc;
    const lazyAttr = lazy ? 'loading="lazy" decoding="async"' : '';
    const dataAttrs = `data-gallery-id="${this.escapeHtml(item.id)}" data-gallery-type="${item.type}" data-gallery-index="${index}"`;

    const metaHtml = showMeta ? `
      <div class="gallery-card__meta">
        ${item.eventDate ? `<span class="gallery-card__date"><i class="fas fa-calendar-alt"></i> ${this.escapeHtml(this.formatDate(item.eventDate))}</span>` : ''}
        <span class="gallery-card__category">${this.escapeHtml(item.category)}</span>
      </div>
    ` : '';

    if (isVideo) {
      return `
        <article class="gallery-card gallery-card--video glass card-hover" ${dataAttrs} role="button" tabindex="0" aria-label="Play video: ${this.escapeHtml(item.title)}">
          <div class="gallery-card__media">
            <img class="gallery-card__thumb" src="${this.escapeHtml(item.thumbnailUrl || thumbSrc)}" alt="" ${lazyAttr} data-media-id="${this.escapeHtml(item.thumbnailId || item.mediaId || '')}" data-media-url="${this.escapeHtml(item.thumbnailUrl || item.mediaUrl || '')}" />
            <div class="gallery-card__play"><i class="fas fa-play"></i></div>
          </div>
          <div class="gallery-card__body">
            <h3 class="gallery-card__title">${this.escapeHtml(item.title)}</h3>
            ${metaHtml}
          </div>
        </article>
      `;
    }

    return `
      <article class="gallery-card gallery-card--image glass card-hover" ${dataAttrs} role="button" tabindex="0" aria-label="View photo: ${this.escapeHtml(item.title)}">
        <div class="gallery-card__media">
          <img class="gallery-card__thumb" src="${this.escapeHtml(item.mediaUrl || mediaSrc)}" alt="${this.escapeHtml(item.title)}" ${lazyAttr} data-media-id="${this.escapeHtml(item.mediaId || '')}" data-media-url="${this.escapeHtml(item.mediaUrl || '')}" />
        </div>
        <div class="gallery-card__overlay">
          <h3 class="gallery-card__title">${this.escapeHtml(item.title)}</h3>
          ${metaHtml}
        </div>
      </article>
    `;
  },

  async hydrateCardMedia(root = document) {
    const imgs = root.querySelectorAll('img[data-media-id]');
    await Promise.all([...imgs].map(async (img) => {
      const mediaId = img.dataset.mediaId;
      const mediaUrl = img.dataset.mediaUrl;
      if (!mediaId && !mediaUrl) return;
      const url = await RC_GALLERY_MEDIA.getObjectUrl(mediaId, mediaUrl);
      if (url) img.src = url;
    }));
  }
};
