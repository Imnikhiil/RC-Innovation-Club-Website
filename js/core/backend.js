/**
 * Unified cloud backend — Supabase when enabled, otherwise local-only.
 */
(function () {
  function active() {
    if (window.RC_SUPABASE?.isEnabled()) return window.RC_SUPABASE;
    return null;
  }

  function noop() {
    return Promise.resolve(false);
  }

  window.RC_BACKEND = {
    get PATHS() {
      return active()?.PATHS || {};
    },

    isEnabled() {
      return !!active();
    },

    isConfigured() {
      return window.RC_SUPABASE?.isConfigured?.() || false;
    },

    provider() {
      return active() ? 'supabase' : 'local';
    },

    init() {
      return active()?.init() ?? noop();
    },

    signIn(username, password) {
      return active()?.signIn(username, password);
    },

    signOut() {
      return active()?.signOut() ?? noop();
    },

    getCurrentUser() {
      return active()?.getCurrentUser?.() ?? null;
    },

    getCmsContent() {
      return active()?.getCmsContent();
    },

    saveCmsContent(content) {
      return active()?.saveCmsContent(content);
    },

    watchCmsContent(callback) {
      return active()?.watchCmsContent(callback) ?? (() => {});
    },

    listCollection(table, orderField, direction) {
      return active()?.listCollection(table, orderField, direction);
    },

    addDoc(table, id, data) {
      return active()?.addDoc(table, id, data);
    },

    updateDoc(table, id, data) {
      return active()?.updateDoc(table, id, data);
    },

    deleteDoc(table, id) {
      return active()?.deleteDoc(table, id);
    },

    queryByField(table, field, value) {
      return active()?.queryByField(table, field, value);
    },

    uploadFile(path, blob, contentType) {
      return active()?.uploadFile(path, blob, contentType);
    },

    deleteFile(path) {
      return active()?.deleteFile(path);
    },

    seedFromLocalIfEmpty() {
      return active()?.seedFromLocalIfEmpty() ?? Promise.resolve(false);
    }
  };
})();
