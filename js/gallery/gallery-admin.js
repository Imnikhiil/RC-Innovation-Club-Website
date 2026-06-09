let galleryEditState = null;
let galleryCropper = null;
let galleryPendingBlob = null;
let galleryPendingType = 'image';

function galleryEsc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

function renderGalleryAdminPanel() {
  const s = content.gallerySection || {};
  const items = RC_GALLERY.getItems();
  const cats = RC_GALLERY.CATEGORIES;

  document.getElementById('panel-gallery').innerHTML = `
    <div class="admin-card">
      <h3>Section Header</h3>
      ${field('Eyebrow', 'gallery-eyebrow', s.eyebrow)}
      ${field('Title', 'gallery-title', s.title)}
      ${field('Subtitle', 'gallery-subtitle', s.subtitle, 'textarea')}
    </div>

    <div class="admin-card">
      <div class="admin-gallery-toolbar">
        <h3 style="margin:0">Media Library (${items.length})</h3>
        <div class="admin-actions">
          <label class="admin-btn admin-btn--primary admin-upload-btn">
            <i class="fas fa-image"></i> Upload Photo
            <input type="file" id="gallery-upload-image" accept="image/*" hidden />
          </label>
          <label class="admin-btn admin-upload-btn">
            <i class="fas fa-video"></i> Upload Video
            <input type="file" id="gallery-upload-video" accept="video/*" hidden />
          </label>
        </div>
      </div>
      <p class="admin-hint">Photos can be cropped before publishing. Videos must be 90 seconds or shorter.</p>
      <div id="gallery-admin-error" class="admin-gallery-error"></div>
      ${items.length ? items.map((item, i) => galleryAdminItemRow(item, i, items.length)).join('') : '<p style="color:var(--admin-muted)">No gallery items yet.</p>'}
    </div>

    ${galleryEditState ? galleryAdminEditForm(galleryEditState, cats) : ''}

    <div id="gallery-crop-modal" class="gallery-crop-modal" style="display:none">
      <div class="gallery-crop-modal__dialog admin-card">
        <h3>Crop Photo</h3>
        <div class="gallery-crop-aspects">
          <button type="button" class="admin-btn" data-aspect="1">Square</button>
          <button type="button" class="admin-btn" data-aspect="1.777">Landscape</button>
          <button type="button" class="admin-btn" data-aspect="0.75">Portrait</button>
          <button type="button" class="admin-btn" data-aspect="NaN">Custom</button>
        </div>
        <div class="gallery-crop-stage"><img id="gallery-crop-image" alt="Crop preview" /></div>
        <div class="admin-actions" style="margin-top:1rem">
          <button type="button" class="admin-btn admin-btn--primary" id="gallery-crop-apply"><i class="fas fa-check"></i> Apply Crop</button>
          <button type="button" class="admin-btn" id="gallery-crop-cancel">Cancel</button>
        </div>
      </div>
    </div>
  `;

  bindGalleryAdminEvents(items, cats);
}

function galleryAdminItemRow(item, index, total) {
  const preview = item.src || '';
  const typeLabel = item.type === 'video' ? 'Video' : 'Photo';
  return `
    <div class="admin-gallery-item" data-id="${galleryEsc(item.id)}">
      <div class="admin-gallery-item__thumb">
        ${item.type === 'video' ? '<span class="admin-gallery-item__badge"><i class="fas fa-video"></i></span>' : ''}
        <img src="${galleryEsc(item.thumbnailUrl || item.mediaUrl || preview)}" alt="" data-admin-thumb="${galleryEsc(item.thumbnailId || item.mediaId || '')}" data-admin-thumb-url="${galleryEsc(item.thumbnailUrl || item.mediaUrl || '')}" />
      </div>
      <div class="admin-gallery-item__info">
        <strong>${galleryEsc(item.title)}</strong>
        <small>${galleryEsc(typeLabel)} · ${galleryEsc(item.category)}${item.eventDate ? ` · ${galleryEsc(item.eventDate)}` : ''}</small>
      </div>
      <div class="admin-gallery-item__actions">
        <button type="button" class="admin-btn admin-btn--sm" data-gallery-up="${index}" ${index === 0 ? 'disabled' : ''} title="Move up"><i class="fas fa-arrow-up"></i></button>
        <button type="button" class="admin-btn admin-btn--sm" data-gallery-down="${index}" ${index === total - 1 ? 'disabled' : ''} title="Move down"><i class="fas fa-arrow-down"></i></button>
        <button type="button" class="admin-btn admin-btn--sm" data-gallery-edit="${galleryEsc(item.id)}" title="Edit"><i class="fas fa-edit"></i></button>
        <button type="button" class="admin-btn admin-btn--danger admin-btn--sm" data-gallery-del="${galleryEsc(item.id)}" title="Delete"><i class="fas fa-trash"></i></button>
      </div>
    </div>
  `;
}

function galleryAdminEditForm(item, cats) {
  const isNew = item._isNew;
  return `
    <div class="admin-card">
      <h3>${isNew ? 'Publish' : 'Edit'} Gallery Item</h3>
      <div class="admin-grid-2">
        ${field('Event Title', 'gal-title', item.title)}
        ${field('Event Date', 'gal-date', item.eventDate, 'date')}
      </div>
      <div class="admin-field">
        <label for="gal-category">Category</label>
        <select id="gal-category">
          ${cats.map((c) => `<option value="${galleryEsc(c)}" ${item.category === c ? 'selected' : ''}>${galleryEsc(c)}</option>`).join('')}
        </select>
      </div>
      ${field('Description (optional)', 'gal-desc', item.description, 'textarea', 3)}
      ${!isNew && item.type === 'image' && item.src ? field('Replace Image Path', 'gal-src', item.src) : ''}
      ${!isNew ? `<label class="admin-upload-btn admin-btn" style="margin-bottom:1rem;display:inline-flex"><i class="fas fa-sync"></i> Replace Media<input type="file" id="gallery-replace-file" accept="${item.type === 'video' ? 'video/*' : 'image/*'}" hidden /></label>` : ''}
      <div class="admin-actions">
        <button type="button" class="admin-btn admin-btn--primary" id="gallery-save-item"><i class="fas fa-check"></i> Save Item</button>
        <button type="button" class="admin-btn" id="gallery-cancel-edit">Cancel</button>
      </div>
    </div>
  `;
}

function galleryShowError(msg) {
  const el = document.getElementById('gallery-admin-error');
  if (el) {
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 4000);
  } else {
    alert(msg);
  }
}

function bindGalleryAdminEvents(items) {
  document.getElementById('gallery-upload-image')?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (file) startGalleryImageUpload(file);
    e.target.value = '';
  });

  document.getElementById('gallery-upload-video')?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (file) startGalleryVideoUpload(file);
    e.target.value = '';
  });

  document.querySelectorAll('[data-gallery-edit]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = items.find((i) => i.id === btn.dataset.galleryEdit);
      galleryEditState = item ? { ...item } : null;
      renderGalleryAdminPanel();
      switchPanel('gallery');
    });
  });

  document.querySelectorAll('[data-gallery-del]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this gallery item?')) return;
      await deleteGalleryItem(btn.dataset.galleryDel);
      toast('Gallery item deleted.');
    });
  });

  document.querySelectorAll('[data-gallery-up]').forEach((btn) => {
    btn.addEventListener('click', () => moveGalleryItem(parseInt(btn.dataset.galleryUp, 10), -1));
  });

  document.querySelectorAll('[data-gallery-down]').forEach((btn) => {
    btn.addEventListener('click', () => moveGalleryItem(parseInt(btn.dataset.galleryDown, 10), 1));
  });

  document.getElementById('gallery-save-item')?.addEventListener('click', saveGalleryEditItem);
  document.getElementById('gallery-cancel-edit')?.addEventListener('click', () => {
    galleryEditState = null;
    galleryPendingBlob = null;
    renderGalleryAdminPanel();
    switchPanel('gallery');
  });

  document.getElementById('gallery-replace-file')?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file || !galleryEditState) return;
    if (galleryEditState.type === 'video') startGalleryVideoUpload(file, true);
    else startGalleryImageUpload(file, true);
    e.target.value = '';
  });

  document.getElementById('gallery-crop-apply')?.addEventListener('click', applyGalleryCrop);
  document.getElementById('gallery-crop-cancel')?.addEventListener('click', closeGalleryCropModal);

  document.querySelectorAll('[data-aspect]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!galleryCropper) return;
      const val = parseFloat(btn.dataset.aspect);
      galleryCropper.setAspectRatio(Number.isNaN(val) ? NaN : val);
    });
  });

  document.querySelectorAll('[data-admin-thumb]').forEach(async (img) => {
    const id = img.dataset.adminThumb;
    const url = img.dataset.adminThumbUrl;
    if (!id && !url) return;
    const resolved = await RC_GALLERY_MEDIA.getObjectUrl(id, url);
    if (resolved) img.src = resolved;
  });
}

async function moveGalleryItem(index, direction) {
  const items = RC_GALLERY.getItems();
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= items.length) return;
  const copy = [...items];
  [copy[index], copy[newIndex]] = [copy[newIndex], copy[index]];
  await RC_GALLERY.saveItems(copy);
  content = RC_CMS.getContent();
  renderGalleryAdminPanel();
  switchPanel('gallery');
  toast('Order updated.');
}

async function deleteGalleryItem(id) {
  const items = RC_GALLERY.getItems();
  const item = items.find((i) => i.id === id);
  if (item?.mediaId || item?.mediaPath) await RC_GALLERY_MEDIA.deleteBlob(item.mediaId, item.mediaPath);
  if (item?.thumbnailId || item?.thumbnailPath) await RC_GALLERY_MEDIA.deleteBlob(item.thumbnailId, item.thumbnailPath);
  await RC_GALLERY.saveItems(items.filter((i) => i.id !== id));
  content = RC_CMS.getContent();
  galleryEditState = null;
  renderGalleryAdminPanel();
  switchPanel('gallery');
}

function startGalleryImageUpload(file, replace = false) {
  if (!file.type.startsWith('image/')) {
    galleryShowError('Please select a valid image file.');
    return;
  }
  galleryPendingType = 'image';
  const reader = new FileReader();
  reader.onload = () => openGalleryCropModal(reader.result, file, replace);
  reader.readAsDataURL(file);
}

async function startGalleryVideoUpload(file, replace = false) {
  if (!file.type.startsWith('video/')) {
    galleryShowError('Please select a valid video file.');
    return;
  }
  try {
    const duration = await RC_GALLERY_MEDIA.getVideoDuration(file);
    if (duration > RC_GALLERY.VIDEO_MAX_SECONDS) {
      galleryShowError(`Video must be ${RC_GALLERY.VIDEO_MAX_SECONDS} seconds or shorter. Selected video is ${Math.round(duration)}s.`);
      return;
    }
  } catch {
    galleryShowError('Could not validate video duration.');
    return;
  }

  galleryPendingType = 'video';
  galleryPendingBlob = file;

  if (replace && galleryEditState) {
    await finalizeGalleryUpload(replace);
    return;
  }

  galleryEditState = {
    _isNew: true,
    id: RC_GALLERY_MEDIA.generateId('gal'),
    type: 'video',
    title: file.name.replace(/\.[^.]+$/, ''),
    eventDate: '',
    description: '',
    category: 'Club Activity',
    src: '',
    mediaId: null,
    thumbnailId: null,
    uploadedAt: new Date().toISOString()
  };
  renderGalleryAdminPanel();
  switchPanel('gallery');
}

function openGalleryCropModal(dataUrl, file, replace) {
  const modal = document.getElementById('gallery-crop-modal');
  const img = document.getElementById('gallery-crop-image');
  if (!modal || !img) return;

  galleryPendingBlob = file;
  galleryPendingReplace = replace;
  modal.style.display = 'flex';
  img.src = dataUrl;

  if (galleryCropper) galleryCropper.destroy();
  galleryCropper = new Cropper(img, {
    aspectRatio: 1,
    viewMode: 1,
    autoCropArea: 1,
    responsive: true
  });
}

let galleryPendingReplace = false;

function closeGalleryCropModal() {
  const modal = document.getElementById('gallery-crop-modal');
  if (modal) modal.style.display = 'none';
  if (galleryCropper) {
    galleryCropper.destroy();
    galleryCropper = null;
  }
}

async function applyGalleryCrop() {
  if (!galleryCropper) return;
  const canvas = galleryCropper.getCroppedCanvas({ maxWidth: 1920, maxHeight: 1920, imageSmoothingQuality: 'high' });
  if (!canvas) return;

  canvas.toBlob(async (blob) => {
    if (!blob) return;
    galleryPendingBlob = blob;
    closeGalleryCropModal();

    if (galleryPendingReplace && galleryEditState) {
      await finalizeGalleryUpload(true);
      return;
    }

    galleryEditState = {
      _isNew: true,
      id: RC_GALLERY_MEDIA.generateId('gal'),
      type: 'image',
      title: (galleryPendingBlob.name || 'New Event').replace(/\.[^.]+$/, ''),
      eventDate: '',
      description: '',
      category: 'Club Activity',
      src: '',
      mediaId: null,
      thumbnailId: null,
      uploadedAt: new Date().toISOString()
    };
    renderGalleryAdminPanel();
    switchPanel('gallery');
  }, 'image/jpeg', 0.9);
}

async function finalizeGalleryUpload(replace) {
  if (!galleryEditState || !galleryPendingBlob) return;

  const itemId = galleryEditState.id;
  const mediaId = RC_GALLERY_MEDIA.generateId('media');
  const mediaResult = await RC_GALLERY_MEDIA.saveBlob(mediaId, galleryPendingBlob, {
    itemId,
    kind: 'media',
    type: galleryEditState.type
  });

  let thumbnailId = galleryEditState.thumbnailId || null;
  let thumbnailUrl = galleryEditState.thumbnailUrl || null;
  let thumbnailPath = galleryEditState.thumbnailPath || null;

  if (galleryEditState.type === 'video') {
    if (galleryEditState.thumbnailId || galleryEditState.thumbnailPath) {
      await RC_GALLERY_MEDIA.deleteBlob(galleryEditState.thumbnailId, galleryEditState.thumbnailPath);
    }
    const thumbBlob = await RC_GALLERY_MEDIA.captureVideoThumbnail(galleryPendingBlob);
    thumbnailId = RC_GALLERY_MEDIA.generateId('thumb');
    const thumbResult = await RC_GALLERY_MEDIA.saveBlob(thumbnailId, thumbBlob, {
      itemId,
      kind: 'thumbnail',
      type: 'image'
    });
    thumbnailUrl = thumbResult.url || null;
    thumbnailPath = thumbResult.path || null;
  } else if (replace && (galleryEditState.mediaId || galleryEditState.mediaPath)) {
    await RC_GALLERY_MEDIA.deleteBlob(galleryEditState.mediaId, galleryEditState.mediaPath);
  }

  galleryEditState.mediaId = mediaResult.id || mediaId;
  galleryEditState.mediaUrl = mediaResult.url || null;
  galleryEditState.mediaPath = mediaResult.path || null;
  galleryEditState.thumbnailId = thumbnailId;
  galleryEditState.thumbnailUrl = thumbnailUrl;
  galleryEditState.thumbnailPath = thumbnailPath;
  galleryEditState.src = mediaResult.url || '';
  galleryPendingBlob = null;

  if (replace) {
    await saveGalleryEditItem();
  }
}

async function saveGalleryEditItem() {
  if (!galleryEditState) return;

  const title = document.getElementById('gal-title')?.value.trim();
  if (!title) {
    galleryShowError('Event title is required.');
    return;
  }

  const updated = {
    ...galleryEditState,
    title,
    eventDate: document.getElementById('gal-date')?.value || '',
    category: document.getElementById('gal-category')?.value || 'Club Activity',
    description: document.getElementById('gal-desc')?.value.trim() || '',
    src: document.getElementById('gal-src')?.value.trim() || galleryEditState.src || '',
    uploadedAt: galleryEditState.uploadedAt || new Date().toISOString()
  };
  delete updated._isNew;

  if (galleryPendingBlob && !updated.mediaId && !updated.mediaUrl) {
    galleryPendingType = updated.type;
    await finalizeGalleryUpload(false);
    updated.mediaId = galleryEditState.mediaId;
    updated.mediaUrl = galleryEditState.mediaUrl;
    updated.mediaPath = galleryEditState.mediaPath;
    updated.thumbnailId = galleryEditState.thumbnailId;
    updated.thumbnailUrl = galleryEditState.thumbnailUrl;
    updated.thumbnailPath = galleryEditState.thumbnailPath;
    updated.src = galleryEditState.src || '';
  }

  if (!updated.mediaId && !updated.mediaUrl && !updated.src) {
    galleryShowError('Please upload or provide media for this item.');
    return;
  }

  let items = RC_GALLERY.getItems();
  const idx = items.findIndex((i) => i.id === updated.id);
  if (idx >= 0) items[idx] = updated;
  else items.push(updated);

  await RC_GALLERY.saveItems(items);
  content = RC_CMS.getContent();
  galleryEditState = null;
  galleryPendingBlob = null;
  renderGalleryAdminPanel();
  switchPanel('gallery');
  toast('Gallery item saved.');
}

window.renderGalleryAdminPanel = renderGalleryAdminPanel;
