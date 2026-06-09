# RC Innovation Club — Official Website

Official website for **RC Innovation Club** at DSEU Rajokri Campus. A modern, feature-rich static site with a built-in CMS admin panel — no backend server required.

![Static Site](https://img.shields.io/badge/Static-HTML%20%2B%20JS-blue)
![CMS](https://img.shields.io/badge/CMS-localStorage-orange)
![Theme](https://img.shields.io/badge/Theme-Dark%20%2F%20Light-22d3ee)

---

## Live preview

Open `index.html` in a browser, or serve the folder locally:

```bash
# Python
python -m http.server 8080

# Node (npx)
npx serve .
```

Then visit `http://localhost:8080`

---

## Features

### Public website
- **Hero** — animated landing with club branding
- **Stats** — animated counters with icons and accents
- **About** — mission, vision, and culture
- **Events** — upcoming events + past events carousel
- **Team** — core team, ambassadors, members, legacy
- **Team hierarchy filter** — filter by role and department
- **Testimonials** — quote carousel
- **Partners & sponsors** — logo cards by type
- **Projects** — showcase with status filters
- **Gallery** — homepage preview + full gallery page with lightbox
- **Resources** — searchable resource hub with categories
- **Certificates** — public certificate ID verification
- **Membership** — inline registration form
- **Contact** — inquiry form with subject categories
- **Newsletter** — email subscribe + dismissible announcement bar
- **Dark / light mode** — theme toggle with saved preference
- **SEO & social sharing** — meta tags, Open Graph, JSON-LD, share buttons

### Admin panel (`admin.html`)
- Full content management (hero, stats, team, events, gallery, etc.)
- **Role-based access** — Super Admin, Content Editor, Membership Manager
- Membership application inbox with export
- Contact message inbox
- Certificate issuing and management
- Newsletter subscribers
- Email notification settings (Web3Forms)
- Local analytics dashboard + optional Google Analytics 4
- Backup / restore (export & import JSON)

> **Note:** Content and form data are stored in the browser **localStorage**. Each device/browser has its own data unless you deploy with a shared backend later.

---

## Project structure

```
RC INNOVATION CLUB FINAL WEBSITE/
├── index.html              # Homepage
├── gallery.html            # Full gallery page
├── admin.html              # Admin panel
├── README.md
├── css/
│   ├── style.css           # Main styles
│   ├── gallery.css         # Gallery & lightbox
│   ├── theme.css           # Light mode overrides
│   └── admin.css           # Admin panel styles
├── js/
│   ├── config/
│   │   ├── content-default.js   # Default site content
│   │   └── admin-config.js        # Admin login & roles
│   ├── core/
│   │   ├── cms.js                 # Content management API
│   │   ├── site-renderer.js       # Renders CMS → pages
│   │   └── script.js              # Main site interactions
│   ├── admin/                     # Admin panel logic
│   ├── analytics/                 # Visit tracking
│   ├── certificates/              # Certificate verify & PDF
│   ├── contact/                   # Contact form storage
│   ├── events/                    # Upcoming / past events
│   ├── gallery/                   # Gallery + lightbox + admin upload
│   ├── membership/                # Registration system
│   ├── newsletter/              # Subscribers & announcement bar
│   ├── notifications/             # Email alerts (Web3Forms)
│   ├── partners/ projects/ resources/ stats/ testimonials/
│   ├── seo/ theme/ team/
│   └── ...
└── assets/
    ├── logo/
    ├── events/
    └── team/
```

---

## Admin access

| Role | Username | Default password | Access |
|------|----------|------------------|--------|
| Super Admin | `admin` | `` | Everything |
| Content Editor | `editor` | `` | Website content & SEO |
| Membership Manager | `membership` | `` | Applications, contact, certificates |

Open **`admin.html`** → log in → edit sections → **Save Changes** → refresh the public site.

### Change credentials before going live

Edit `js/config/admin-config.js` and replace the default usernames and passwords.

---

## Configuration

| File | Purpose |
|------|---------|
| `js/config/content-default.js` | Default text, images, team, events, SEO |
| `js/config/admin-config.js` | Admin users, roles, session duration |
| `js/core/cms.js` | Content merge & localStorage keys |

### Email notifications

1. Create a free key at [web3forms.com](https://web3forms.com)
2. Admin → **Email Alerts** → paste access key → Save
3. Send a test email from the admin panel

### Google Analytics (optional)

Admin → **Analytics** → add your GA4 Measurement ID (`G-XXXXXXXXXX`)

---

## Deploy to GitHub Pages

1. Push this repository to GitHub
2. Go to **Settings → Pages**
3. Source: **Deploy from branch** → `main` → `/ (root)`
4. Your site will be at `https://<username>.github.io/<repo-name>/`

After deploying, set your production URL in **Admin → SEO → Global SEO → Site URL** so canonical links and sharing work correctly.

---

## Development tips

- Use **hard refresh** (`Ctrl + Shift + R`) after CSS/JS changes
- Export content regularly from **Admin → Dashboard → Export JSON**
- Gallery images uploaded in admin are stored in **IndexedDB** (browser-local)
- For production use, consider migrating to Firebase/Supabase for shared data across devices

---

## Tech stack

- HTML5, CSS3 (custom design system)
- Vanilla JavaScript (no build step)
- [Tailwind CSS](https://tailwindcss.com) (CDN, utilities)
- [Font Awesome](https://fontawesome.com) icons
- [AOS](https://michalsnik.github.io/aos/) scroll animations
- [Cropper.js](https://fengyuanchen.github.io/cropperjs/) (admin image crop)

---

## Credits

Built for **RC Innovation Club**, Delhi Skill and Entrepreneurship University (DSEU), Rajokri Campus.

---

## License

This project is maintained by RC Innovation Club. Contact the club for reuse or contribution guidelines.
