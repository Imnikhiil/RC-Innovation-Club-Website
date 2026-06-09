const GALLERY_DB_NAME = 'rc_gallery_media';
const GALLERY_DB_VERSION = 1;
const GALLERY_STORE = 'blobs';

let galleryDbPromise = null;
const objectUrlCache = new Map();

function openGalleryDb() {
  if (galleryDbPromise) return galleryDbPromise;
  galleryDbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(GALLERY_DB_NAME, GALLERY_DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(GALLERY_STORE)) {
        db.createObjectStore(GALLERY_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return galleryDbPromise;
}

window.RC_GALLERY_MEDIA = {
  async saveBlob(id, blob) {
    const db = await openGalleryDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(GALLERY_STORE, 'readwrite');
      tx.objectStore(GALLERY_STORE).put(blob, id);
      tx.oncomplete = () => resolve(id);
      tx.onerror = () => reject(tx.error);
    });
  },

  async getBlob(id) {
    const db = await openGalleryDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(GALLERY_STORE, 'readonly');
      const req = tx.objectStore(GALLERY_STORE).get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  },

  async deleteBlob(id) {
    const db = await openGalleryDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(GALLERY_STORE, 'readwrite');
      tx.objectStore(GALLERY_STORE).delete(id);
      tx.oncomplete = () => {
        if (objectUrlCache.has(id)) {
          URL.revokeObjectURL(objectUrlCache.get(id));
          objectUrlCache.delete(id);
        }
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  },

  async getObjectUrl(id) {
    if (!id) return '';
    if (objectUrlCache.has(id)) return objectUrlCache.get(id);
    const blob = await this.getBlob(id);
    if (!blob) return '';
    const url = URL.createObjectURL(blob);
    objectUrlCache.set(id, url);
    return url;
  },

  revokeAll() {
    objectUrlCache.forEach((url) => URL.revokeObjectURL(url));
    objectUrlCache.clear();
  },

  generateId(prefix = 'media') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  },

  async blobFromFile(file) {
    return file instanceof Blob ? file : null;
  },

  async getVideoDuration(file) {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        const duration = video.duration;
        URL.revokeObjectURL(video.src);
        resolve(duration);
      };
      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        reject(new Error('Could not read video metadata.'));
      };
      video.src = URL.createObjectURL(file);
    });
  },

  async captureVideoThumbnail(file, atSeconds = 1) {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'auto';
      video.muted = true;
      video.playsInline = true;

      const cleanup = () => URL.revokeObjectURL(video.src);

      video.onloadeddata = () => {
        video.currentTime = Math.min(atSeconds, Math.max(0, video.duration - 0.1));
      };

      video.onseeked = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 360;
          canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => {
            cleanup();
            if (blob) resolve(blob);
            else reject(new Error('Could not create video thumbnail.'));
          }, 'image/jpeg', 0.85);
        } catch (err) {
          cleanup();
          reject(err);
        }
      };

      video.onerror = () => {
        cleanup();
        reject(new Error('Could not load video for thumbnail.'));
      };

      video.src = URL.createObjectURL(file);
    });
  }
};
