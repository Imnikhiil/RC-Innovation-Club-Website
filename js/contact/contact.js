const CONTACT_STORAGE_KEY = 'rc_contact_messages';

let messagesCache = null;
let contactReady = false;

window.RC_CONTACT = {
  SUBJECTS: ['General Inquiry', 'Collaboration', 'Sponsorship', 'Event Query', 'Feedback', 'Other'],

  async init() {
    if (contactReady) return messagesCache;
    await RC_CMS.ensureReady();

    if (window.RC_BACKEND?.isEnabled()) {
      try {
        messagesCache = await RC_BACKEND.listCollection(RC_BACKEND.PATHS.CONTACT, 'submittedAt');
        localStorage.setItem(CONTACT_STORAGE_KEY, JSON.stringify(messagesCache));
      } catch (e) {
        console.warn('Contact: cloud load failed, using local cache', e);
        messagesCache = this._loadLocal();
      }
    } else {
      messagesCache = this._loadLocal();
    }
    contactReady = true;
    return messagesCache;
  },

  async ensureReady() {
    if (contactReady) return messagesCache;
    return this.init();
  },

  _loadLocal() {
    try {
      const raw = localStorage.getItem(CONTACT_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Contact: could not load messages', e);
    }
    return [];
  },

  getConfig() {
    const defaults = window.RC_DEFAULT_CONTENT?.contactSection || {};
    const content = window.RC_CMS?.getContent() || {};
    return { ...defaults, ...(content.contactSection || {}) };
  },

  getMessages() {
    if (messagesCache) return messagesCache;
    messagesCache = this._loadLocal();
    return messagesCache;
  },

  saveMessages(messages) {
    messagesCache = messages;
    localStorage.setItem(CONTACT_STORAGE_KEY, JSON.stringify(messages));
    window.dispatchEvent(new CustomEvent('rc-contact-updated'));
    return true;
  },

  generateId() {
    return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  },

  async submitMessage(data) {
    const message = {
      id: this.generateId(),
      name: (data.name || '').trim(),
      email: (data.email || '').trim(),
      subject: (data.subject || '').trim(),
      message: (data.message || '').trim(),
      status: 'unread',
      submittedAt: new Date().toISOString()
    };

    if (!message.name || !message.email || !message.subject || !message.message) {
      return { ok: false, error: 'Please fill in all required fields.' };
    }

    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(message.email)) {
      return { ok: false, error: 'Please enter a valid email address.' };
    }

    if (message.message.length < 10) {
      return { ok: false, error: 'Message must be at least 10 characters.' };
    }

    if (window.RC_BACKEND?.isEnabled()) {
      try {
        await RC_BACKEND.addDoc(RC_BACKEND.PATHS.CONTACT, message.id, message);
        const messages = this.getMessages();
        messages.unshift(message);
        this.saveMessages(messages);
      } catch (e) {
        console.error('Contact: submit failed', e);
        return { ok: false, error: 'Could not send message. Please try again later.' };
      }
    } else {
      const messages = this.getMessages();
      messages.unshift(message);
      this.saveMessages(messages);
    }

    return { ok: true, message };
  },

  async updateStatus(id, status) {
    if (!['unread', 'read'].includes(status)) return false;
    const messages = this.getMessages();
    const idx = messages.findIndex((m) => m.id === id);
    if (idx === -1) return false;
    messages[idx].status = status;
    this.saveMessages(messages);
    if (window.RC_BACKEND?.isEnabled()) {
      await RC_BACKEND.updateDoc(RC_BACKEND.PATHS.CONTACT, id, { status });
    }
    return true;
  },

  async deleteMessage(id) {
    const messages = this.getMessages().filter((m) => m.id !== id);
    this.saveMessages(messages);
    if (window.RC_BACKEND?.isEnabled()) {
      await RC_BACKEND.deleteDoc(RC_BACKEND.PATHS.CONTACT, id);
    }
    return true;
  },

  filterMessages({ search = '', status = 'all', subject = 'all' } = {}) {
    let list = this.getMessages();
    const q = search.trim().toLowerCase();

    if (status && status !== 'all') {
      list = list.filter((m) => m.status === status);
    }
    if (subject && subject !== 'all') {
      list = list.filter((m) => m.subject === subject);
    }
    if (q) {
      list = list.filter((m) =>
        [m.name, m.email, m.subject, m.message]
          .some((v) => String(v || '').toLowerCase().includes(q))
      );
    }
    return list;
  },

  formatDate(iso) {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return iso;
    }
  },

  exportToExcel(messages) {
    const list = messages || this.getMessages();
    const headers = ['Name', 'Email', 'Subject', 'Message', 'Status', 'Submitted At'];
    const escapeCsv = (val) => {
      const s = String(val ?? '').replace(/"/g, '""');
      return /[",\n\r]/.test(s) ? `"${s}"` : s;
    };
    const rows = list.map((m) => [
      m.name, m.email, m.subject, m.message, m.status, this.formatDate(m.submittedAt)
    ].map(escapeCsv).join(','));
    const csv = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rc-contact-messages-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }
};
