/**
 * Supabase integration layer for RC Innovation Club.
 * Used by RC_BACKEND for all cloud data operations.
 */
(function () {
  const SCHEMA_VERSION = 1;
  const CMS_ID = 'main';
  const STORAGE_BUCKET = 'gallery';

  const PATHS = {
    CMS: 'cms_content',
    APPLICATIONS: 'applications',
    CONTACT: 'contact_messages',
    SUBSCRIBERS: 'subscribers',
    CERTIFICATES: 'certificates',
    ADMIN_PROFILES: 'admin_profiles'
  };

  const CAMEL_TO_SNAKE = {
    enrollmentNumber: 'enrollment_number',
    enrollmentNumberLower: 'enrollment_number_lower',
    submittedAt: 'submitted_at',
    reviewedAt: 'reviewed_at',
    subscribedAt: 'subscribed_at',
    recipientName: 'recipient_name',
    eventTitle: 'event_title',
    issueDate: 'issue_date',
    issuedAt: 'issued_at',
    displayName: 'display_name',
    createdAt: 'created_at'
  };

  const SNAKE_TO_CAMEL = Object.fromEntries(
    Object.entries(CAMEL_TO_SNAKE).map(([k, v]) => [v, k])
  );

  let client = null;
  let initialized = false;
  let initPromise = null;
  let authUser = null;
  let cmsChannel = null;

  function config() {
    return window.RC_SUPABASE_CONFIG || {};
  }

  function isConfigured() {
    const c = config();
    return !!(c.url && c.anonKey && c.url !== 'YOUR_SUPABASE_URL');
  }

  function isEnabled() {
    return config().enabled === true && isConfigured() && typeof window.supabase !== 'undefined';
  }

  function toSnake(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    const out = {};
    Object.entries(obj).forEach(([key, val]) => {
      const snake = CAMEL_TO_SNAKE[key] || key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
      out[snake] = val;
    });
    return out;
  }

  function toCamel(row) {
    if (!row || typeof row !== 'object') return row;
    const out = { ...row };
    Object.entries(SNAKE_TO_CAMEL).forEach(([snake, camel]) => {
      if (snake in out) {
        out[camel] = out[snake];
        delete out[snake];
      }
    });
    if (out.display_name !== undefined) {
      out.displayName = out.display_name;
      delete out.display_name;
    }
    return out;
  }

  function resolveEmail(usernameOrEmail) {
    const input = (usernameOrEmail || '').trim();
    if (input.includes('@')) return input.toLowerCase();

    const users = window.RC_CMS?.getAdminUsers() || [];
    const match = users.find((u) => u.username === input || u.email === input);
    return (match?.email || input).toLowerCase();
  }

  function getRoleForEmail(email) {
    const users = window.RC_CMS?.getAdminUsers() || [];
    const match = users.find((u) => (u.email || '').toLowerCase() === email.toLowerCase());
    return match?.role || 'super';
  }

  function getDisplayNameForEmail(email) {
    const users = window.RC_CMS?.getAdminUsers() || [];
    const match = users.find((u) => (u.email || '').toLowerCase() === email.toLowerCase());
    return match?.displayName || email.split('@')[0];
  }

  async function init() {
    if (!isEnabled()) return false;
    if (initialized) return true;
    if (initPromise) return initPromise;

    initPromise = (async () => {
      const c = config();
      client = window.supabase.createClient(c.url, c.anonKey);

      const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
        authUser = session?.user || null;
      });

      const { data: { session } } = await client.auth.getSession();
      authUser = session?.user || null;
      window._rcSupabaseAuthUnsub = subscription;

      initialized = true;
      return true;
    })();

    return initPromise;
  }

  function getClient() {
    return client;
  }

  async function signIn(emailOrUsername, password) {
    await init();
    const email = resolveEmail(emailOrUsername);
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const uid = data.user.id;
    authUser = data.user;

    let profile = await getAdminProfile(uid);
    if (!profile) {
      profile = {
        id: uid,
        email: data.user.email,
        username: email.split('@')[0],
        role: getRoleForEmail(data.user.email),
        display_name: getDisplayNameForEmail(data.user.email)
      };
      const { error: insertErr } = await client.from(PATHS.ADMIN_PROFILES).upsert(profile);
      if (insertErr) console.warn('Supabase: could not save admin profile', insertErr);
      profile = await getAdminProfile(uid) || profile;
    }

    const camel = toCamel(profile);
    return {
      uid,
      email: data.user.email,
      role: camel.role || profile.role || 'super',
      displayName: camel.displayName || profile.display_name || data.user.email,
      username: camel.username || profile.username || email.split('@')[0]
    };
  }

  async function signOut() {
    if (!isEnabled() || !client) return;
    await client.auth.signOut();
    authUser = null;
  }

  function getCurrentUser() {
    return authUser;
  }

  async function getAdminProfile(uid) {
    const { data, error } = await client.from(PATHS.ADMIN_PROFILES).select('*').eq('id', uid).maybeSingle();
    if (error) throw error;
    return data;
  }

  async function getCmsContent() {
    await init();
    const { data, error } = await client.from(PATHS.CMS).select('data').eq('id', CMS_ID).maybeSingle();
    if (error) throw error;
    return data?.data && typeof data.data === 'object' ? data.data : null;
  }

  async function saveCmsContent(content) {
    await init();
    const user = getCurrentUser();
    const { error } = await client.from(PATHS.CMS).upsert({
      id: CMS_ID,
      data: content,
      schema_version: SCHEMA_VERSION,
      updated_at: new Date().toISOString(),
      updated_by: user?.email || 'system'
    });
    if (error) throw error;
    return true;
  }

  function watchCmsContent(callback) {
    if (!isEnabled()) return () => {};

    if (cmsChannel) {
      client.removeChannel(cmsChannel);
      cmsChannel = null;
    }

    cmsChannel = client
      .channel('rc-cms-content')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: PATHS.CMS,
        filter: `id=eq.${CMS_ID}`
      }, (payload) => {
        const row = payload.new;
        if (row?.data && typeof row.data === 'object') callback(row.data);
      })
      .subscribe();

    return () => {
      if (cmsChannel) {
        client.removeChannel(cmsChannel);
        cmsChannel = null;
      }
    };
  }

  async function listCollection(table, orderField = 'submitted_at', direction = 'desc') {
    await init();
    const snakeOrder = CAMEL_TO_SNAKE[orderField] || orderField;
    const { data, error } = await client
      .from(table)
      .select('*')
      .order(snakeOrder, { ascending: direction === 'asc' });
    if (error) throw error;
    return (data || []).map((row) => {
      const camel = toCamel(row);
      return { id: row.id, ...camel };
    });
  }

  async function addDoc(table, id, docData) {
    await init();
    const row = toSnake({ id, ...docData });
    const { error } = await client.from(table).insert(row);
    if (error) throw error;
    return { id, ...docData };
  }

  async function updateDoc(table, id, docData) {
    await init();
    const row = toSnake(docData);
    const { error } = await client.from(table).update(row).eq('id', id);
    if (error) throw error;
    return true;
  }

  async function deleteDoc(table, id) {
    await init();
    const { error } = await client.from(table).delete().eq('id', id);
    if (error) throw error;
    return true;
  }

  async function queryByField(table, field, value) {
    await init();
    const snakeField = CAMEL_TO_SNAKE[field] || field;
    const { data, error } = await client.from(table).select('*').eq(snakeField, value).limit(1).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const camel = toCamel(data);
    return { id: data.id, ...camel };
  }

  async function uploadFile(storagePath, blob, contentType) {
    await init();
    const { error } = await client.storage.from(STORAGE_BUCKET).upload(storagePath, blob, {
      contentType: contentType || blob.type || 'application/octet-stream',
      upsert: true
    });
    if (error) throw error;
    const { data } = client.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath);
    return data.publicUrl;
  }

  async function deleteFile(storagePath) {
    if (!storagePath) return;
    await init();
    try {
      await client.storage.from(STORAGE_BUCKET).remove([storagePath]);
    } catch (e) {
      console.warn('Supabase: could not delete file', storagePath, e);
    }
  }

  async function seedFromLocalIfEmpty() {
    const existing = await getCmsContent();
    if (existing && Object.keys(existing).length > 0) return false;

    const local = localStorage.getItem('rc_innovation_club_content');
    if (!local) return false;

    try {
      const parsed = JSON.parse(local);
      await saveCmsContent(parsed);
      return true;
    } catch {
      return false;
    }
  }

  window.RC_SUPABASE = {
    PATHS,
    SCHEMA_VERSION,
    isEnabled,
    isConfigured,
    init,
    getClient,
    signIn,
    signOut,
    getCurrentUser,
    getAdminProfile,
    getCmsContent,
    saveCmsContent,
    watchCmsContent,
    listCollection,
    addDoc,
    updateDoc,
    deleteDoc,
    queryByField,
    uploadFile,
    deleteFile,
    seedFromLocalIfEmpty,
    resolveEmail
  };
})();
