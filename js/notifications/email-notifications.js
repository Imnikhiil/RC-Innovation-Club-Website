const EMAIL_NOTIFY_LOG_KEY = 'rc_email_notifications_log';
const MAX_LOG = 200;

window.RC_EMAIL_NOTIFY = {
  getConfig() {
    const defaults = window.RC_DEFAULT_CONTENT?.notificationsSection || {};
    const content = window.RC_CMS?.getContent() || {};
    const social = content.social || window.RC_DEFAULT_CONTENT?.social || {};
    const cfg = { ...defaults, ...(content.notificationsSection || {}) };
    if (!cfg.notifyEmail && social.email) {
      cfg.notifyEmail = social.email;
    }
    return cfg;
  },

  getLog() {
    try {
      const raw = localStorage.getItem(EMAIL_NOTIFY_LOG_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Email notify: could not load log', e);
    }
    return [];
  },

  saveLog(list) {
    const trimmed = list.slice(0, MAX_LOG);
    localStorage.setItem(EMAIL_NOTIFY_LOG_KEY, JSON.stringify(trimmed));
    window.dispatchEvent(new CustomEvent('rc-email-notify-updated'));
    return true;
  },

  addLog(entry) {
    const log = this.getLog();
    log.unshift({
      id: `en_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      at: new Date().toISOString(),
      ...entry
    });
    this.saveLog(log);
  },

  interpolate(template, vars) {
    return String(template || '').replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? '');
  },

  isActive(type) {
    const cfg = this.getConfig();
    if (cfg.enabled === false || cfg.provider === 'off') return false;
    if (type === 'contact') return cfg.notifyOnContact !== false;
    if (type === 'membership') return cfg.notifyOnMembership !== false;
    return false;
  },

  buildContactBody(message) {
    return [
      'New contact form submission — RC Innovation Club',
      '',
      `Name: ${message.name}`,
      `Email: ${message.email}`,
      `Subject: ${message.subject}`,
      `Submitted: ${message.submittedAt || new Date().toISOString()}`,
      '',
      'Message:',
      message.message
    ].join('\n');
  },

  buildMembershipBody(application) {
    return [
      'New membership application — RC Innovation Club',
      '',
      `Name: ${application.name}`,
      `Enrollment: ${application.enrollmentNumber}`,
      `Course: ${application.course}`,
      `Semester: ${application.semester}`,
      `Email: ${application.email}`,
      `Phone: ${application.phone}`,
      `Skills: ${application.skills || '—'}`,
      `Interests: ${application.interests || '—'}`,
      `Submitted: ${application.submittedAt || new Date().toISOString()}`,
      '',
      'Reason for joining:',
      application.reason
    ].join('\n');
  },

  buildMailtoUrl({ to, subject, body }) {
    const params = new URLSearchParams();
    if (subject) params.set('subject', subject);
    if (body) params.set('body', body);
    return `mailto:${encodeURIComponent(to)}?${params.toString()}`;
  },

  async sendWeb3Forms({ subject, body, replyTo, replyName }) {
    const cfg = this.getConfig();
    const accessKey = (cfg.web3formsAccessKey || '').trim();
    if (!accessKey) {
      return { ok: false, error: 'Web3Forms access key is not configured in Admin → Email Notifications.' };
    }

    const payload = {
      access_key: accessKey,
      subject,
      name: replyName || 'RC Innovation Club Website',
      email: replyTo || cfg.notifyEmail || 'noreply@example.com',
      message: body,
      from_name: 'RC Innovation Club Website'
    };

    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        return { ok: false, error: data.message || `Email service returned status ${res.status}` };
      }
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message || 'Could not reach the email service.' };
    }
  },

  async dispatch({ type, subject, body, replyTo, replyName }) {
    const cfg = this.getConfig();
    const provider = cfg.provider || 'web3forms';

    if (provider === 'off') {
      this.addLog({ type, status: 'skipped', subject, replyTo, error: 'Provider set to Off' });
      return { ok: false, skipped: true, error: 'Email provider is set to Off.' };
    }

    if (provider === 'mailto') {
      const mailto = this.buildMailtoUrl({
        to: cfg.notifyEmail || 'rcinnovationclub@gmail.com',
        subject,
        body
      });
      this.addLog({
        type,
        status: 'mailto',
        subject,
        replyTo,
        mailto
      });
      return { ok: true, mailto: true };
    }

    const result = await this.sendWeb3Forms({ subject, body, replyTo, replyName });
    this.addLog({
      type,
      status: result.ok ? 'sent' : 'failed',
      subject,
      replyTo,
      error: result.error || ''
    });
    return result;
  },

  async notifyContact(message) {
    if (!this.isActive('contact') || !message) return { ok: false, skipped: true };

    const cfg = this.getConfig();
    const subject = this.interpolate(cfg.contactSubject || 'RC Club Contact: {subject} from {name}', {
      name: message.name,
      subject: message.subject,
      email: message.email
    });
    const body = this.buildContactBody(message);

    return this.dispatch({
      type: 'contact',
      subject,
      body,
      replyTo: message.email,
      replyName: message.name
    });
  },

  async notifyMembership(application) {
    if (!this.isActive('membership') || !application) return { ok: false, skipped: true };

    const cfg = this.getConfig();
    const subject = this.interpolate(cfg.membershipSubject || 'RC Club Membership: {name} ({enrollment})', {
      name: application.name,
      enrollment: application.enrollmentNumber,
      email: application.email
    });
    const body = this.buildMembershipBody(application);

    return this.dispatch({
      type: 'membership',
      subject,
      body,
      replyTo: application.email,
      replyName: application.name
    });
  },

  async sendTest() {
    const cfg = this.getConfig();
    const body = [
      'This is a test notification from the RC Innovation Club website admin panel.',
      '',
      `Sent at: ${new Date().toLocaleString('en-IN')}`,
      `Notify email: ${cfg.notifyEmail || 'not set'}`,
      `Provider: ${cfg.provider || 'web3forms'}`
    ].join('\n');

    return this.dispatch({
      type: 'test',
      subject: 'RC Innovation Club — Test Email Notification',
      body,
      replyTo: cfg.notifyEmail,
      replyName: 'RC Innovation Club Admin'
    });
  },

  clearLog() {
    localStorage.removeItem(EMAIL_NOTIFY_LOG_KEY);
    window.dispatchEvent(new CustomEvent('rc-email-notify-updated'));
    return true;
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

  statusBadge(status) {
    const map = {
      sent: '<span class="admin-status admin-status--approved">Sent</span>',
      failed: '<span class="admin-status admin-status--rejected">Failed</span>',
      mailto: '<span class="admin-status admin-status--pending">Mailto</span>',
      skipped: '<span class="admin-status">Skipped</span>'
    };
    return map[status] || `<span class="admin-status">${status}</span>`;
  }
};
