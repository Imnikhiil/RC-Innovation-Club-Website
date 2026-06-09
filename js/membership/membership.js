const MEMBERSHIP_STORAGE_KEY = 'rc_membership_applications';

window.RC_MEMBERSHIP = {
  getApplications() {
    try {
      const raw = localStorage.getItem(MEMBERSHIP_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Membership: could not load applications', e);
    }
    return [];
  },

  saveApplications(apps) {
    localStorage.setItem(MEMBERSHIP_STORAGE_KEY, JSON.stringify(apps));
    window.dispatchEvent(new CustomEvent('rc-membership-updated'));
    return true;
  },

  getRegistrationConfig() {
    const defaults = window.RC_DEFAULT_CONTENT?.registration || {};
    const content = window.RC_CMS?.getContent() || {};
    return { ...defaults, ...(content.registration || {}) };
  },

  isRegistrationOpen() {
    const cfg = this.getRegistrationConfig();
    if (!cfg.enabled) return false;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (cfg.startDate) {
      const start = new Date(cfg.startDate + 'T00:00:00');
      if (today < start) return false;
    }

    if (cfg.endDate) {
      const end = new Date(cfg.endDate + 'T23:59:59');
      if (now > end) return false;
    }

    return true;
  },

  getRegistrationStatus() {
    const cfg = this.getRegistrationConfig();
    if (!cfg.enabled) return 'disabled';
    if (this.isRegistrationOpen()) return 'open';

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (cfg.startDate) {
      const start = new Date(cfg.startDate + 'T00:00:00');
      if (today < start) return 'upcoming';
    }

    return 'closed';
  },

  formatRegDate(dateStr) {
    if (!dateStr) return '';
    try {
      return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  },

  getPublicNotice() {
    const cfg = this.getRegistrationConfig();
    const status = this.getRegistrationStatus();

    if (status === 'open') return null;

    if (status === 'upcoming') {
      const openDate = this.formatRegDate(cfg.startDate);
      let message = cfg.upcomingMessage
        || 'Membership registration has not opened yet. Please check back on the opening date — we would love to have you join RC Innovation Club!';
      message = message.replace('{date}', openDate || 'the opening date');
      if (openDate && !message.includes(openDate)) {
        message = `${message} Registration opens on ${openDate}.`;
      }
      return {
        variant: 'upcoming',
        title: 'Registration Not Open Yet',
        message
      };
    }

    if (status === 'closed') {
      const message = cfg.expiredMessage || cfg.closedMessage
        || 'Membership registration for this semester has ended. The form is now closed — please try again next semester.';
      return {
        variant: 'expired',
        title: 'Registration Closed',
        message
      };
    }

    return {
      variant: 'disabled',
      title: 'Registration Unavailable',
      message: cfg.disabledMessage
        || 'Membership registration is not available at the moment. Follow us on social media for updates.'
    };
  },

  generateId() {
    return `app_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  },

  findByEnrollment(enrollmentNumber) {
    const normalized = enrollmentNumber.trim().toLowerCase();
    return this.getApplications().find(
      (a) => a.enrollmentNumber.trim().toLowerCase() === normalized
    );
  },

  submitApplication(data) {
    if (!this.isRegistrationOpen()) {
      return { ok: false, error: 'Registration is currently closed.' };
    }

    const enrollment = (data.enrollmentNumber || '').trim();
    if (this.findByEnrollment(enrollment)) {
      return { ok: false, error: 'An application with this enrollment number already exists.' };
    }

    const application = {
      id: this.generateId(),
      name: (data.name || '').trim(),
      enrollmentNumber: enrollment,
      course: (data.course || '').trim(),
      semester: (data.semester || '').trim(),
      email: (data.email || '').trim(),
      phone: (data.phone || '').trim(),
      skills: (data.skills || '').trim(),
      interests: (data.interests || '').trim(),
      reason: (data.reason || '').trim(),
      status: 'pending',
      submittedAt: new Date().toISOString()
    };

    const required = ['name', 'enrollmentNumber', 'course', 'semester', 'email', 'phone', 'reason'];
    for (const field of required) {
      if (!application[field]) {
        return { ok: false, error: 'Please fill in all required fields.' };
      }
    }

    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(application.email)) {
      return { ok: false, error: 'Please enter a valid email address.' };
    }

    const apps = this.getApplications();
    apps.unshift(application);
    this.saveApplications(apps);
    return { ok: true, application };
  },

  updateStatus(id, status) {
    if (!['pending', 'approved', 'rejected'].includes(status)) return false;
    const apps = this.getApplications();
    const idx = apps.findIndex((a) => a.id === id);
    if (idx === -1) return false;
    apps[idx].status = status;
    apps[idx].reviewedAt = new Date().toISOString();
    this.saveApplications(apps);
    return true;
  },

  deleteApplication(id) {
    const apps = this.getApplications().filter((a) => a.id !== id);
    this.saveApplications(apps);
    return true;
  },

  filterApplications({ search = '', status = 'all' } = {}) {
    let apps = this.getApplications();
    const q = search.trim().toLowerCase();

    if (status && status !== 'all') {
      apps = apps.filter((a) => a.status === status);
    }

    if (q) {
      apps = apps.filter((a) =>
        [a.name, a.enrollmentNumber, a.email, a.course, a.phone, a.skills, a.interests]
          .some((v) => String(v || '').toLowerCase().includes(q))
      );
    }

    return apps;
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

  exportToExcel(applications) {
    const apps = applications || this.getApplications();
    const headers = [
      'Name', 'Enrollment Number', 'Course', 'Semester', 'Email', 'Phone',
      'Skills', 'Interests', 'Reason for Joining', 'Status', 'Submitted At'
    ];

    const escapeCsv = (val) => {
      const s = String(val ?? '').replace(/"/g, '""');
      return /[",\n\r]/.test(s) ? `"${s}"` : s;
    };

    const rows = apps.map((a) => [
      a.name, a.enrollmentNumber, a.course, a.semester, a.email, a.phone,
      a.skills, a.interests, a.reason, a.status, this.formatDate(a.submittedAt)
    ].map(escapeCsv).join(','));

    const csv = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rc-membership-applications-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }
};
