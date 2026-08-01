/**
 * Shared admin image upload + crop for events, team, partners, etc.
 * Uses CropperJS modal and RC_GALLERY_MEDIA.saveBlob.
 */
window.RC_ADMIN_MEDIA = {
  cropper: null,
  pending: null,
  bound: false,

  ensureModal() {
    if (document.getElementById('admin-content-crop-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'admin-content-crop-modal';
    modal.className = 'gallery-crop-modal';
    modal.style.display = 'none';
    modal.innerHTML = `
      <div class="gallery-crop-modal__dialog admin-card">
        <h3 style="margin-top:0">Crop Photo</h3>
        <div class="gallery-crop-aspects">
          <button type="button" class="admin-btn" data-admin-aspect="NaN">Free</button>
          <button type="button" class="admin-btn" data-admin-aspect="1">1:1</button>
          <button type="button" class="admin-btn" data-admin-aspect="1.777">16:9</button>
          <button type="button" class="admin-btn" data-admin-aspect="0.8">4:5</button>
        </div>
        <div class="gallery-crop-stage"><img id="admin-content-crop-image" alt="Crop preview" /></div>
        <div class="admin-actions" style="margin-top:1rem">
          <button type="button" class="admin-btn admin-btn--primary" id="admin-content-crop-apply">
            <i class="fas fa-check"></i> Apply & Upload
          </button>
          <button type="button" class="admin-btn" id="admin-content-crop-cancel">Cancel</button>
        </div>
        <p id="admin-content-crop-status" class="admin-muted" style="margin:0.75rem 0 0"></p>
      </div>`;
    document.body.appendChild(modal);

    document.getElementById('admin-content-crop-apply')?.addEventListener('click', () => this.applyCrop());
    document.getElementById('admin-content-crop-cancel')?.addEventListener('click', () => this.closeCrop());
    modal.querySelectorAll('[data-admin-aspect]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (!this.cropper) return;
        const raw = btn.getAttribute('data-admin-aspect');
        const val = Number(raw);
        this.cropper.setAspectRatio(Number.isFinite(val) ? val : NaN);
      });
    });
  },

  bindPanel(root = document) {
    this.ensureModal();
    root.querySelectorAll('input[type="file"][data-upload-for]').forEach((input) => {
      if (input.dataset.boundUpload === 'true') return;
      input.dataset.boundUpload = 'true';
      input.addEventListener('change', () => {
        const file = input.files && input.files[0];
        input.value = '';
        if (!file) return;
        this.startUpload({
          file,
          inputId: input.getAttribute('data-upload-for'),
          pathInputId: input.getAttribute('data-path-for') || '',
          folder: input.getAttribute('data-folder') || 'uploads',
          aspect: Number(input.getAttribute('data-aspect') || '1')
        });
      });
    });

    root.querySelectorAll('[data-clear-photo]').forEach((btn) => {
      if (btn.dataset.boundClear === 'true') return;
      btn.dataset.boundClear = 'true';
      btn.addEventListener('click', () => {
        const inputId = btn.getAttribute('data-clear-photo');
        const pathInputId = btn.getAttribute('data-path-for') || '';
        this.clearPhoto(inputId, pathInputId);
      });

      const inputId = btn.getAttribute('data-clear-photo');
      const urlInput = inputId ? document.getElementById(inputId) : null;
      if (urlInput && urlInput.dataset.boundClearSync !== 'true') {
        urlInput.dataset.boundClearSync = 'true';
        urlInput.addEventListener('input', () => {
          const preview = document.getElementById(`${inputId}-preview`);
          const value = urlInput.value.trim();
          if (preview) {
            if (value) {
              preview.src = value;
              preview.hidden = false;
            } else {
              preview.removeAttribute('src');
              preview.hidden = true;
            }
          }
          this.syncClearButton(inputId);
        });
      }
    });
  },

  clearPhoto(inputId, pathInputId = '') {
    const input = document.getElementById(inputId);
    const hasPhoto = Boolean(input?.value?.trim());
    const pathInput = pathInputId ? document.getElementById(pathInputId) : null;
    const hasPath = Boolean(pathInput?.value?.trim());

    if (!hasPhoto && !hasPath) {
      if (typeof toast === 'function') toast('No photo to remove.');
      return;
    }

    if (!confirm('Remove this photo?')) return;

    if (input) {
      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    if (pathInput) pathInput.value = '';

    const preview = document.getElementById(`${inputId}-preview`);
    if (preview) {
      preview.removeAttribute('src');
      preview.hidden = true;
    }

    const clearBtn = document.querySelector(`[data-clear-photo="${inputId}"]`);
    if (clearBtn) clearBtn.hidden = true;

    if (typeof toast === 'function') toast('Photo removed. Click Save Item to keep changes.');
  },

  syncClearButton(inputId) {
    const input = document.getElementById(inputId);
    const clearBtn = document.querySelector(`[data-clear-photo="${inputId}"]`);
    if (!clearBtn) return;
    clearBtn.hidden = !input?.value?.trim();
  },

  startUpload({ file, inputId, pathInputId, folder, aspect }) {
    if (!file || !file.type.startsWith('image/')) {
      if (typeof toast === 'function') toast('Please select a valid image file.');
      return;
    }
    if (typeof Cropper === 'undefined') {
      if (typeof toast === 'function') toast('Image cropper failed to load. Refresh and try again.');
      return;
    }

    this.ensureModal();
    this.pending = { inputId, pathInputId, folder, aspect: Number.isFinite(aspect) ? aspect : 1 };

    const reader = new FileReader();
    reader.onload = () => this.openCrop(reader.result);
    reader.readAsDataURL(file);
  },

  openCrop(dataUrl) {
    const modal = document.getElementById('admin-content-crop-modal');
    const img = document.getElementById('admin-content-crop-image');
    const status = document.getElementById('admin-content-crop-status');
    if (!modal || !img || !this.pending) return;

    if (status) status.textContent = '';
    modal.style.display = 'flex';
    img.src = dataUrl;

    if (this.cropper) {
      this.cropper.destroy();
      this.cropper = null;
    }

    this.cropper = new Cropper(img, {
      aspectRatio: this.pending.aspect,
      viewMode: 1,
      autoCropArea: 1,
      responsive: true
    });
  },

  closeCrop() {
    const modal = document.getElementById('admin-content-crop-modal');
    if (modal) modal.style.display = 'none';
    if (this.cropper) {
      this.cropper.destroy();
      this.cropper = null;
    }
    this.pending = null;
  },

  setStatus(msg) {
    const status = document.getElementById('admin-content-crop-status');
    if (status) status.textContent = msg || '';
  },

  applyCrop() {
    if (!this.cropper || !this.pending) return;
    const canvas = this.cropper.getCroppedCanvas({
      maxWidth: 1600,
      maxHeight: 1600,
      imageSmoothingQuality: 'high'
    });
    if (!canvas) return;

    this.setStatus('Uploading…');
    canvas.toBlob(async (blob) => {
      if (!blob) {
        this.setStatus('Could not process image.');
        return;
      }
      try {
        await this.uploadBlob(blob);
      } catch (err) {
        console.warn('Admin media upload failed', err);
        this.setStatus(err.message || 'Upload failed. Check connection / Supabase.');
        if (typeof toast === 'function') toast('Photo upload failed.');
      }
    }, 'image/jpeg', 0.88);
  },

  async uploadBlob(blob) {
    const pending = this.pending;
    if (!pending || !window.RC_GALLERY_MEDIA) {
      throw new Error('Upload helper not ready.');
    }

    const mediaId = RC_GALLERY_MEDIA.generateId('img');
    const result = await RC_GALLERY_MEDIA.saveBlob(mediaId, blob, {
      itemId: mediaId,
      folder: pending.folder,
      kind: 'image',
      type: 'image'
    });

    const url = result.url || '';
    if (!url) throw new Error('Upload returned no URL.');

    const input = document.getElementById(pending.inputId);
    if (input) {
      input.value = url;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }

    const pathInput = pending.pathInputId ? document.getElementById(pending.pathInputId) : null;
    if (pathInput) pathInput.value = result.path || '';

    const preview = document.getElementById(`${pending.inputId}-preview`);
    if (preview) {
      preview.src = url;
      preview.hidden = false;
    }

    this.syncClearButton(pending.inputId);
    this.closeCrop();
    if (typeof toast === 'function') toast('Photo uploaded. Click Save Item to keep it.');
  },

  listFieldHtml(f, item) {
    const id = `le-${f.id}`;
    const value = item[f.id] || '';
    const pathId = `le-${f.id}-mediaPath`;
    const pathVal = item.mediaPath || item.imagePath || item.logoPath || '';
    const upload = f.upload || {};
    const folder = upload.folder || 'uploads';
    const aspect = upload.aspect == null ? 1 : upload.aspect;
    const hasPhoto = Boolean(value);
    const preview = value
      ? `<img id="${id}-preview" class="admin-media-preview" src="${escAttr(value)}" alt="Preview" />`
      : `<img id="${id}-preview" class="admin-media-preview" alt="Preview" hidden />`;

    return `<div class="admin-field">
      <label for="${id}">${f.label}</label>
      <input type="text" id="${id}" value="${escAttr(value)}" placeholder="Upload below or paste path/URL" />
      <input type="hidden" id="${pathId}" value="${escAttr(pathVal)}" />
      <div class="admin-media-row">
        ${preview}
        <label class="admin-btn admin-upload-btn">
          <i class="fas fa-cloud-arrow-up" aria-hidden="true"></i> Upload Photo
          <input type="file" accept="image/*" data-upload-for="${id}" data-path-for="${pathId}" data-folder="${escAttr(folder)}" data-aspect="${aspect}" />
        </label>
        <button type="button" class="admin-btn admin-btn--danger admin-btn--sm" data-clear-photo="${id}" data-path-for="${pathId}" ${hasPhoto ? '' : 'hidden'}>
          <i class="fas fa-trash" aria-hidden="true"></i> Delete Photo
        </button>
      </div>
      <small class="admin-muted">Crop & upload a new photo, or keep using a path/URL. Use Delete Photo to remove it.</small>
    </div>`;
  },

  /** Standalone upload control for SEO / non-list fields */
  fieldHtml(label, id, value, { folder = 'seo', aspect = 1.777 } = {}) {
    const hasPhoto = Boolean(value);
    const preview = value
      ? `<img id="${id}-preview" class="admin-media-preview" src="${escAttr(value)}" alt="Preview" />`
      : `<img id="${id}-preview" class="admin-media-preview" alt="Preview" hidden />`;
    return `<div class="admin-field">
      <label for="${id}">${label}</label>
      <input type="text" id="${id}" value="${escAttr(value || '')}" placeholder="Upload below or paste path/URL" />
      <div class="admin-media-row">
        ${preview}
        <label class="admin-btn admin-upload-btn">
          <i class="fas fa-cloud-arrow-up" aria-hidden="true"></i> Upload Photo
          <input type="file" accept="image/*" data-upload-for="${id}" data-folder="${escAttr(folder)}" data-aspect="${aspect}" />
        </label>
        <button type="button" class="admin-btn admin-btn--danger admin-btn--sm" data-clear-photo="${id}" ${hasPhoto ? '' : 'hidden'}>
          <i class="fas fa-trash" aria-hidden="true"></i> Delete Photo
        </button>
      </div>
    </div>`;
  }
};

function escAttr(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}
