# -*- coding: utf-8 -*-
from pathlib import Path

root = Path(r'c:\Users\Nikhil\Desktop\RC INNOVATION CLUB FINAL WEBSITE')

for rel in ['css/style.css', 'css/gallery.css', 'css/home.css', 'css/site-ui.css']:
    p = root / rel
    if not p.exists():
        continue
    t = p.read_text(encoding='utf-8')
    orig = t
    for old in ['#94a3b8', '#64748b']:
        t = t.replace(f'color: {old}', 'color: var(--text-muted)')
        t = t.replace(f'color:{old}', 'color: var(--text-muted)')
    t = t.replace('color: #cbd5e1', 'color: var(--text-muted)')
    t = t.replace('color:#cbd5e1', 'color: var(--text-muted)')
    t = t.replace('color: #e2e8f0', 'color: var(--text-primary)')
    t = t.replace('color:#e2e8f0', 'color: var(--text-primary)')
    if t != orig:
        p.write_text(t, encoding='utf-8')
        print('updated', rel)
    else:
        print('no swaps', rel)

needle_a = "t = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';"
needle_b = 't = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";'
for p in root.glob('*.html'):
    t = p.read_text(encoding='utf-8')
    o = t
    if needle_a in t:
        t = t.replace(needle_a, "t = 'dark';")
    if needle_b in t:
        t = t.replace(needle_b, "t = 'dark';")
    if t != o:
        p.write_text(t, encoding='utf-8')
        print('FOUC', p.name)
    else:
        print('skip FOUC', p.name)

# Append readability helpers once
readability = root / 'css' / 'readability.css'
readability.write_text('''/* Permanent readability — Dark Ocean baseline */
:root,
[data-theme="dark"] {
  color-scheme: dark;
}

body {
  color: var(--text-primary);
  background-color: var(--bg-primary);
}

p, li, small, .section-subtitle, .section-eyebrow,
.contact-info__text, .newsletter-panel__subtitle,
.newsletter-panel__privacy, .share-section__label,
.events-hint, .team-hierarchy-hint {
  color: inherit;
}

.section-subtitle,
.dash-about__lead,
.dash-hero__lead,
.dash-stats__subtitle,
.contact-info__text,
.newsletter-panel__subtitle,
.newsletter-panel__privacy,
.share-section__label,
.events-hint,
.team-hierarchy-hint,
.membership-notice__body p,
.members-panel__meta {
  color: var(--text-muted) !important;
}

.section-title,
.dash-about__title,
.dash-hero__title,
.dash-stats__title,
h1, h2, h3, h4 {
  color: var(--text-primary);
}

.btn-primary {
  color: var(--dash-btn-text, #031016);
}

[data-theme="light"] .btn-primary {
  color: #fff;
}

a.nav-link,
.footer-links a,
.mobile-nav a {
  color: var(--text-muted);
}

a.nav-link:hover,
a.nav-link.active,
.footer-links a:hover,
.mobile-nav a:hover,
.mobile-nav a.active {
  color: var(--text-primary);
}

input, textarea, select {
  color: var(--input-text, var(--text-primary));
  background: var(--input-bg);
  border-color: var(--input-border);
}

::placeholder {
  color: var(--text-muted);
  opacity: 0.85;
}
''', encoding='utf-8')
print('wrote readability.css')
