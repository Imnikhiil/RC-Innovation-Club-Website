const CERTIFICATES_STORAGE_KEY = 'rc_certificates_issued';

window.RC_CERTIFICATES = {
  TYPES: {
    participation: 'Event Participation',
    membership: 'Club Membership',
    achievement: 'Achievement',
    volunteer: 'Volunteer Service',
    leadership: 'Leadership'
  },

  STATUS: {
    active: 'Active',
    revoked: 'Revoked'
  },

  getConfig() {
    const defaults = window.RC_DEFAULT_CONTENT?.certificatesSection || {};
    const content = window.RC_CMS?.getContent() || {};
    return { ...defaults, ...(content.certificatesSection || {}) };
  },

  getCertificates() {
    try {
      const raw = localStorage.getItem(CERTIFICATES_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Certificates: could not load', e);
    }
    const seeded = this.getSeedCertificates();
    this.saveCertificates(seeded);
    return seeded;
  },

  getSeedCertificates() {
    return [
      {
        id: 'RCIC-2026-DEMO01',
        recipientName: 'Priya Sharma',
        type: 'participation',
        eventTitle: 'Python Jam 2025',
        description: 'For outstanding participation in the intercampus coding competition.',
        issueDate: '2025-11-14',
        status: 'active',
        issuedAt: '2025-11-15T10:00:00.000Z'
      },
      {
        id: 'RCIC-2026-DEMO02',
        recipientName: 'Nikhil Kumar',
        type: 'membership',
        eventTitle: 'RC Innovation Club',
        description: 'Official member of RC Innovation Club, DSEU Rajokri Campus.',
        issueDate: '2025-08-01',
        status: 'active',
        issuedAt: '2025-08-01T09:00:00.000Z'
      }
    ];
  },

  saveCertificates(list) {
    localStorage.setItem(CERTIFICATES_STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('rc-certificates-updated'));
    return true;
  },

  generateId() {
    const year = new Date().getFullYear();
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return `RCIC-${year}-${code}`;
  },

  normalizeId(id) {
    return String(id || '').trim().toUpperCase();
  },

  findById(id) {
    const norm = this.normalizeId(id);
    return this.getCertificates().find((c) => this.normalizeId(c.id) === norm) || null;
  },

  issueCertificate(data) {
    const recipientName = (data.recipientName || '').trim();
    const type = this.TYPES[data.type] ? data.type : 'participation';
    const eventTitle = (data.eventTitle || '').trim();
    const description = (data.description || '').trim();
    const issueDate = (data.issueDate || '').trim() || new Date().toISOString().slice(0, 10);

    if (!recipientName) {
      return { ok: false, error: 'Recipient name is required.' };
    }
    if (!eventTitle && type !== 'membership') {
      return { ok: false, error: 'Event or program title is required.' };
    }

    const list = this.getCertificates();
    let id = this.generateId();
    while (list.some((c) => c.id === id)) {
      id = this.generateId();
    }

    const cert = {
      id,
      recipientName,
      type,
      eventTitle: eventTitle || 'RC Innovation Club',
      description,
      issueDate,
      status: 'active',
      issuedAt: new Date().toISOString()
    };

    list.unshift(cert);
    this.saveCertificates(list);
    return { ok: true, certificate: cert };
  },

  verify(id) {
    const norm = this.normalizeId(id);
    if (!norm) {
      return { ok: false, reason: 'empty' };
    }

    const cert = this.findById(norm);
    if (!cert) {
      return { ok: false, reason: 'not_found' };
    }
    if (cert.status === 'revoked') {
      return { ok: false, reason: 'revoked', certificate: cert };
    }
    return { ok: true, certificate: cert };
  },

  updateStatus(id, status) {
    if (!['active', 'revoked'].includes(status)) return false;
    const list = this.getCertificates();
    const idx = list.findIndex((c) => c.id === id);
    if (idx === -1) return false;
    list[idx].status = status;
    this.saveCertificates(list);
    return true;
  },

  deleteCertificate(id) {
    this.saveCertificates(this.getCertificates().filter((c) => c.id !== id));
    return true;
  },

  filterCertificates({ search = '', type = 'all', status = 'all' } = {}) {
    let list = this.getCertificates();
    const q = search.trim().toLowerCase();

    if (type && type !== 'all') {
      list = list.filter((c) => c.type === type);
    }
    if (status && status !== 'all') {
      list = list.filter((c) => c.status === status);
    }
    if (q) {
      list = list.filter((c) =>
        [c.id, c.recipientName, c.eventTitle, c.description, c.type]
          .some((v) => String(v || '').toLowerCase().includes(q))
      );
    }
    return list;
  },

  formatDate(dateStr) {
    if (!dateStr) return '—';
    try {
      return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  },

  getTypeLabel(type) {
    return this.TYPES[type] || type;
  },

  getTitleForType(type) {
    const map = {
      participation: 'Certificate of Participation',
      membership: 'Certificate of Membership',
      achievement: 'Certificate of Achievement',
      volunteer: 'Certificate of Appreciation',
      leadership: 'Certificate of Leadership'
    };
    return map[type] || 'Certificate of Recognition';
  },

  escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },

  buildVerifyResultHtml(result) {
    const cfg = this.getConfig();

    if (!result.ok) {
      const msg = result.reason === 'revoked'
        ? (cfg.revokedMessage || 'This certificate has been revoked and is no longer valid.')
        : (cfg.invalidMessage || 'No certificate found with this ID. Please check and try again.');
      return `<div class="cert-verify-result cert-verify-result--error" role="alert">
        <i class="fas fa-circle-xmark" aria-hidden="true"></i>
        <p>${this.escapeHtml(msg)}</p>
      </div>`;
    }

    const c = result.certificate;
    const verifyUrl = `${window.location.origin}${window.location.pathname}?cert=${encodeURIComponent(c.id)}#certificates`;

    return `<div class="cert-verify-result cert-verify-result--valid" role="status">
      <div class="cert-verify-result__badge"><i class="fas fa-circle-check" aria-hidden="true"></i> Verified</div>
      <h3 class="cert-verify-result__name">${this.escapeHtml(c.recipientName)}</h3>
      <p class="cert-verify-result__type">${this.escapeHtml(this.getTypeLabel(c.type))}</p>
      <dl class="cert-verify-result__meta">
        <div><dt>Certificate ID</dt><dd><code>${this.escapeHtml(c.id)}</code></dd></div>
        <div><dt>Event / Program</dt><dd>${this.escapeHtml(c.eventTitle)}</dd></div>
        <div><dt>Issue Date</dt><dd>${this.escapeHtml(this.formatDate(c.issueDate))}</dd></div>
        ${c.description ? `<div><dt>Details</dt><dd>${this.escapeHtml(c.description)}</dd></div>` : ''}
      </dl>
      <div class="cert-verify-result__actions">
        <button type="button" class="btn-primary cert-download-btn" data-cert-id="${this.escapeHtml(c.id)}">
          <i class="fas fa-download" aria-hidden="true"></i> Download Certificate
        </button>
        <button type="button" class="btn-secondary cert-copy-btn" data-cert-url="${this.escapeHtml(verifyUrl)}">
          <i class="fas fa-link" aria-hidden="true"></i> Copy Verify Link
        </button>
      </div>
    </div>`;
  },

  openPrintWindow(cert) {
    const cfg = this.getConfig();
    const c = cert.id ? cert : this.findById(cert);
    if (!c || c.status === 'revoked') return false;

    const title = this.getTitleForType(c.type);
    const issuerName = cfg.issuerName || 'RC Innovation Club';
    const issuerTitle = cfg.issuerTitle || 'DSEU Rajokri Campus';
    const logoPath = new URL('assets/logo/logo.png', window.location.href).href;
    const issueDate = this.formatDate(c.issueDate);
    const bodyText = c.type === 'membership'
      ? `This certifies that <strong>${this.escapeHtml(c.recipientName)}</strong> is an official member of <strong>${this.escapeHtml(c.eventTitle)}</strong>.`
      : `This is to certify that <strong>${this.escapeHtml(c.recipientName)}</strong> has been recognized for <strong>${this.escapeHtml(c.eventTitle)}</strong>.`;

    const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8" />
<title>${this.escapeHtml(title)} — ${this.escapeHtml(c.recipientName)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Georgia, 'Times New Roman', serif; background: #f8fafc; color: #0f172a; padding: 2rem; }
  .cert { max-width: 800px; margin: 0 auto; border: 3px double #0284c7; padding: 3rem 3.5rem; background: #fff; position: relative; }
  .cert::before, .cert::after { content: ''; position: absolute; width: 60px; height: 60px; border: 2px solid #38bdf8; }
  .cert::before { top: 18px; left: 18px; border-right: none; border-bottom: none; }
  .cert::after { bottom: 18px; right: 18px; border-left: none; border-top: none; }
  .cert-header { text-align: center; margin-bottom: 2rem; }
  .cert-logo { width: 72px; height: 72px; border-radius: 12px; object-fit: cover; margin-bottom: 1rem; }
  .cert-org { font-size: 0.95rem; letter-spacing: 0.12em; text-transform: uppercase; color: #0369a1; font-weight: 700; }
  .cert-campus { font-size: 0.85rem; color: #64748b; margin-top: 0.25rem; }
  .cert-title { text-align: center; font-size: 1.75rem; color: #0c4a6e; margin: 2rem 0 1.5rem; font-weight: 700; }
  .cert-body { text-align: center; font-size: 1.1rem; line-height: 1.8; color: #334155; margin-bottom: 1.5rem; }
  .cert-name { display: block; font-size: 2rem; color: #0284c7; margin: 1.25rem 0; font-weight: 700; font-style: italic; }
  .cert-desc { text-align: center; font-size: 0.95rem; color: #475569; line-height: 1.6; margin-bottom: 2rem; max-width: 560px; margin-left: auto; margin-right: auto; }
  .cert-footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 2.5rem; padding-top: 1.5rem; border-top: 1px solid #e2e8f0; }
  .cert-sign { text-align: center; min-width: 180px; }
  .cert-sign-line { border-top: 1px solid #94a3b8; margin-top: 2.5rem; padding-top: 0.5rem; font-size: 0.85rem; color: #475569; }
  .cert-id { font-family: monospace; font-size: 0.8rem; color: #64748b; text-align: center; margin-top: 1.5rem; }
  .cert-date { font-size: 0.9rem; color: #475569; }
  @media print { body { padding: 0; background: #fff; } .cert { border-width: 2px; } }
</style></head><body>
  <div class="cert">
    <div class="cert-header">
      <img src="${logoPath}" alt="RC Innovation Club" class="cert-logo" onerror="this.style.display='none'" />
      <div class="cert-org">${this.escapeHtml(issuerName)}</div>
      <div class="cert-campus">${this.escapeHtml(issuerTitle)}</div>
    </div>
    <h1 class="cert-title">${this.escapeHtml(title)}</h1>
    <p class="cert-body">${bodyText}</p>
    <span class="cert-name">${this.escapeHtml(c.recipientName)}</span>
    ${c.description ? `<p class="cert-desc">${this.escapeHtml(c.description)}</p>` : ''}
    <div class="cert-footer">
      <div class="cert-date">Issued on ${this.escapeHtml(issueDate)}</div>
      <div class="cert-sign">
        <div class="cert-sign-line">Authorized Signatory<br>${this.escapeHtml(issuerName)}</div>
      </div>
    </div>
    <p class="cert-id">Certificate ID: ${this.escapeHtml(c.id)}</p>
  </div>
  <script>window.onload = function() { window.print(); };<\/script>
</body></html>`;

    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) return false;
    win.document.write(html);
    win.document.close();
    return true;
  },

  exportCsv(list) {
    const rows = list || this.getCertificates();
    const header = ['ID', 'Recipient', 'Type', 'Event', 'Issue Date', 'Status', 'Description', 'Issued At'];
    const lines = [header.join(',')];
    rows.forEach((c) => {
      lines.push([
        c.id,
        `"${(c.recipientName || '').replace(/"/g, '""')}"`,
        this.getTypeLabel(c.type),
        `"${(c.eventTitle || '').replace(/"/g, '""')}"`,
        c.issueDate,
        c.status,
        `"${(c.description || '').replace(/"/g, '""')}"`,
        c.issuedAt
      ].join(','));
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `rc_certificates_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    return true;
  },

  initVerify() {
    const form = document.getElementById('cert-verify-form');
    const input = document.getElementById('cert-verify-input');
    const resultWrap = document.getElementById('cert-verify-result');
    if (!form || !input || !resultWrap) return;

    const runVerify = (id) => {
      const result = this.verify(id);
      if (result.ok && window.RC_ANALYTICS) {
        RC_ANALYTICS.trackEvent('certificate_verify', id);
      }
      resultWrap.innerHTML = this.buildVerifyResultHtml(result);
      resultWrap.hidden = false;

      resultWrap.querySelector('.cert-download-btn')?.addEventListener('click', () => {
        this.openPrintWindow(result.certificate?.id || id);
      });

      resultWrap.querySelector('.cert-copy-btn')?.addEventListener('click', async (e) => {
        const url = e.currentTarget.dataset.certUrl;
        try {
          await navigator.clipboard.writeText(url);
          e.currentTarget.innerHTML = '<i class="fas fa-check" aria-hidden="true"></i> Copied!';
          setTimeout(() => {
            e.currentTarget.innerHTML = '<i class="fas fa-link" aria-hidden="true"></i> Copy Verify Link';
          }, 2000);
        } catch {
          window.prompt('Copy this link:', url);
        }
      });
    };

    if (form.dataset.bound !== 'true') {
      form.dataset.bound = 'true';
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        runVerify(input.value);
      });
    }

    const params = new URLSearchParams(window.location.search);
    const certParam = params.get('cert') || params.get('verify');
    if (certParam) {
      input.value = certParam;
      runVerify(certParam);
      document.getElementById('certificates')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
};
