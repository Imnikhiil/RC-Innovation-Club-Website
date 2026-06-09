window.RC_EVENTS = {
  migrateEvent(event, index = 0) {
    if (!event) return null;
    const eventDate = event.eventDate || this.parseLegacyDate(event.date) || '';
    return {
      id: event.id || `evt_${index}_${(event.title || 'event').slice(0, 12).replace(/\W/g, '')}`,
      tag: event.tag || 'Event',
      title: event.title || 'Untitled Event',
      date: event.date || '',
      eventDate,
      venue: event.venue || '',
      time: event.time || '',
      description: event.description || '',
      image: event.image || '',
      registerUrl: event.registerUrl || '',
      registerLabel: event.registerLabel || 'Register Now',
      forceStatus: event.forceStatus || 'auto'
    };
  },

  parseLegacyDate(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return '';
    const cleaned = dateStr.split('·')[0].trim();
    if (/special moment/i.test(cleaned)) return '';
    const parsed = new Date(cleaned);
    if (Number.isNaN(parsed.getTime())) return '';
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  },

  isUpcoming(event) {
    const e = event.id ? event : this.migrateEvent(event);
    if (e.forceStatus === 'upcoming') return true;
    if (e.forceStatus === 'past') return false;
    if (!e.eventDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDay = new Date(`${e.eventDate}T00:00:00`);
    return eventDay >= today;
  },

  getAll(events) {
    return (events || []).map((e, i) => this.migrateEvent(e, i)).filter(Boolean);
  },

  getUpcoming(events) {
    return this.getAll(events)
      .filter((e) => this.isUpcoming(e))
      .sort((a, b) => (a.eventDate || '').localeCompare(b.eventDate || ''));
  },

  getPast(events) {
    return this.getAll(events)
      .filter((e) => !this.isUpcoming(e));
  },

  formatEventDate(eventDate, fallback) {
    if (!eventDate) return fallback || '';
    try {
      return new Date(`${eventDate}T00:00:00`).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric'
      });
    } catch {
      return fallback || eventDate;
    }
  },

  buildUpcomingCard(event) {
    const e = this.migrateEvent(event);
    const displayDate = e.date || this.formatEventDate(e.eventDate);
    const registerBtn = e.registerUrl
      ? `<a href="${this.escapeHtml(e.registerUrl)}" class="upcoming-event-card__btn btn-primary" ${e.registerUrl.startsWith('http') ? 'target="_blank" rel="noopener"' : ''}>${this.escapeHtml(e.registerLabel)}</a>`
      : '';

    return `
      <article class="upcoming-event-card glass card-hover" data-aos="fade-up">
        <div class="upcoming-event-card__media">
          <img src="${this.escapeHtml(e.image)}" alt="${this.escapeHtml(e.title)}" loading="lazy" />
          <span class="upcoming-event-card__badge">Upcoming</span>
        </div>
        <div class="upcoming-event-card__body">
          <span class="event-tag">${this.escapeHtml(e.tag)}</span>
          <h3 class="upcoming-event-card__title">${this.escapeHtml(e.title)}</h3>
          <div class="upcoming-event-card__meta">
            ${displayDate ? `<span><i class="fas fa-calendar-alt"></i> ${this.escapeHtml(displayDate)}</span>` : ''}
            ${e.time ? `<span><i class="fas fa-clock"></i> ${this.escapeHtml(e.time)}</span>` : ''}
            ${e.venue ? `<span><i class="fas fa-location-dot"></i> ${this.escapeHtml(e.venue)}</span>` : ''}
          </div>
          <p class="upcoming-event-card__desc">${this.escapeHtml(e.description)}</p>
          ${registerBtn}
        </div>
      </article>
    `;
  },

  buildPastCard(event) {
    const e = this.migrateEvent(event);
    return `
      <div class="event-card glass rounded-2xl overflow-hidden">
        <img src="${this.escapeHtml(e.image)}" class="w-full object-cover" alt="${this.escapeHtml(e.title)}" loading="lazy">
        <div class="p-6">
          <span class="event-tag">${this.escapeHtml(e.tag)}</span>
          <h3 class="text-lg font-bold mt-3">${this.escapeHtml(e.title)}</h3>
          <p class="text-slate-500 text-sm mt-2">${this.escapeHtml(e.date || this.formatEventDate(e.eventDate))}</p>
          <p class="text-slate-400 text-sm mt-3 leading-relaxed">${this.escapeHtml(e.description)}</p>
        </div>
      </div>
    `;
  },

  escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
};
