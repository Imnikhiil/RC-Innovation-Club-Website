# RC Innovation Club — Official Website

Official website for **RC Innovation Club** at DSEU Rajokri Campus. A static site with a built-in CMS admin panel, powered by **Supabase** for cloud data storage.

![Static Site](https://img.shields.io/badge/Static-HTML%20%2B%20JS-blue)
![Backend](https://img.shields.io/badge/Backend-Supabase-3ecf8e)
![Hosting](https://img.shields.io/badge/Hosting-Render-46e3b7)
![Theme](https://img.shields.io/badge/Theme-Dark%20%2F%20Light-22d3ee)

---

## Pages

| Page | URL | Description |
|------|-----|-------------|
| Homepage | `/` or `/index.html` | Main club website |
| Gallery | `/gallery.html` or `/gallery` | Full photo & video gallery |
| Admin | `/admin.html` or `/admin` | Content management panel |

---

## Features

### Public website
- Hero, stats, about, events, faculty, team, testimonials, partners, projects
- Gallery with lightbox, resources hub, certificate verification
- Membership registration, contact form, newsletter
- Dark / light mode, SEO & social sharing

### Admin panel (`admin.html`)
- Full CMS for all website sections
- Role-based access — Super Admin, Content Editor, Membership Manager
- Membership inbox, contact messages, certificates, newsletter
- Gallery upload (Supabase Storage), backup export/import JSON
- Email alerts (Web3Forms), optional Google Analytics 4

---

## Project structure

```
rc-innovation-club/                 # repo root (publish on Render)
├── index.html                      # Homepage
├── gallery.html                    # Gallery page
├── admin.html                      # Admin panel
├── 404.html                        # Not-found page
├── robots.txt                      # Search engine rules
├── render.yaml                     # Render deployment config
├── README.md
├── LICENSE
├── .gitignore
│
├── css/                            # Stylesheets
│   ├── style.css
│   ├── gallery.css
│   ├── theme.css
│   └── admin.css
│
├── assets/                         # Images & media
│   ├── logo/
│   ├── events/
│   └── team/
│
├── js/
│   ├── config/
│   │   ├── content-default.js      # Default site content
│   │   ├── admin-config.js         # Admin roles & emails
│   │   ├── supabase-config.js      # Supabase credentials (production)
│   │   └── supabase-config.example.js
│   ├── core/
│   │   ├── cms.js                  # Content management
│   │   ├── backend.js              # Cloud backend wrapper
│   │   ├── site-renderer.js        # Renders CMS → pages
│   │   └── script.js               # Main interactions
│   ├── supabase/
│   │   └── supabase-core.js        # Supabase auth, DB, storage
│   ├── admin/                      # Admin panel
│   ├── gallery/                    # Gallery + lightbox
│   ├── membership/                 # Registration
│   ├── contact/                    # Contact form
│   ├── certificates/               # Certificate system
│   ├── newsletter/                 # Subscribers
│   └── …                           # events, seo, theme, etc.
│
└── supabase/                       # Database setup (run once in Supabase)
    ├── schema.sql                  # Tables + security policies
    └── storage-policies.sql        # Gallery bucket permissions
```

---

## Local development

```bash
# From project root
python -m http.server 8080
```

Open:
- [http://localhost:8080](http://localhost:8080)
- [http://localhost:8080/admin.html](http://localhost:8080/admin.html)

> Use `localhost` — not `http://[::]:8080/` (that URL does not work in browsers).

---

## Supabase setup (required for production)

| Service | Free tier |
|---------|-----------|
| PostgreSQL database | 500 MB |
| Authentication | 50,000 MAU |
| Storage | 1 GB |

### One-time setup

1. Create a project at [supabase.com](https://supabase.com)
2. **SQL Editor** → run `supabase/schema.sql`
3. **Storage** → create bucket `gallery` → **Public: ON**
4. **SQL Editor** → run `supabase/storage-policies.sql`
5. **Authentication → Users** → add admins (emails from `admin-config.js`)
6. Copy **Project URL** + **anon key** into `js/config/supabase-config.js`
7. Set `enabled: true`
8. **Database → Replication** → enable `cms_content` (optional live sync)

### Database tables

| Table | Purpose |
|-------|---------|
| `cms_content` | Full website content (JSON) |
| `applications` | Membership applications |
| `contact_messages` | Contact inbox |
| `subscribers` | Newsletter emails |
| `certificates` | Issued certificates |
| `admin_profiles` | Admin roles |

---

## Deploy to GitHub

### 1. Create repository

On [github.com/new](https://github.com/new):
- Name: `rc-innovation-club` (no spaces — cleaner URLs)
- Visibility: Public or Private
- Do **not** add README (you already have one)

### 2. Push code

```bash
cd "C:\Users\Nikhil\Desktop\RC INNOVATION CLUB FINAL WEBSITE"

git init
git add .
git commit -m "Initial commit: RC Innovation Club website with Supabase"

git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/rc-innovation-club.git
git push -u origin main
```

### 3. Before pushing — checklist

- [ ] `js/config/supabase-config.js` has your Supabase URL + anon key
- [ ] `enabled: true` in supabase-config.js
- [ ] Admin passwords in Supabase Auth (not just `admin-config.js`)
- [ ] Default passwords in `admin-config.js` changed or only used for local fallback

---

## Deploy on Render

### Option A — Blueprint (recommended)

1. Go to [render.com](https://render.com) → sign up / log in
2. **New → Blueprint**
3. Connect your GitHub account
4. Select the `rc-innovation-club` repository
5. Render reads `render.yaml` automatically → click **Apply**
6. Wait for deploy → your site URL will be like `https://rc-innovation-club.onrender.com`

### Option B — Manual static site

1. **New → Static Site**
2. Connect GitHub repo
3. Settings:
   - **Name:** `rc-innovation-club`
   - **Branch:** `main`
   - **Build Command:** *(leave empty)*
   - **Publish Directory:** `.` (dot = root)
4. Click **Create Static Site**

### After Render deploy

**1. Supabase — allow your live URL**

Supabase → **Authentication → URL Configuration**:

| Field | Value |
|-------|--------|
| Site URL | `https://rc-innovation-club.onrender.com` |
| Redirect URLs | `https://rc-innovation-club.onrender.com/**` |

**2. Admin panel — set production URL**

Log in to `https://your-site.onrender.com/admin.html` → **SEO → Global SEO → Site URL** → paste your Render URL.

**3. Test on production**

- Homepage loads with your content
- Admin login works (Supabase email + password)
- Membership form submits → appears in Supabase `applications` table
- Gallery upload → appears in Supabase Storage `gallery` bucket

### Custom domain (optional)

Render → your service → **Settings → Custom Domains** → add your domain (e.g. `rcinnovation.club`).

Update Supabase **Site URL** and **Redirect URLs** to match the custom domain.

---

## Configuration reference

| File | Purpose |
|------|---------|
| `js/config/supabase-config.js` | Supabase URL, anon key, enable flag |
| `js/config/admin-config.js` | Admin emails, roles, local fallback passwords |
| `js/config/content-default.js` | Default website content |
| `render.yaml` | Render hosting configuration |
| `supabase/schema.sql` | Database schema + RLS |
| `supabase/storage-policies.sql` | Gallery storage permissions |

### Email notifications (optional)

1. Free key at [web3forms.com](https://web3forms.com)
2. Admin → **Email Alerts** → paste key → Save

### Google Analytics (optional)

Admin → **Analytics** → GA4 Measurement ID (`G-XXXXXXXXXX`)

---

## Admin access

With Supabase enabled, log in at `/admin.html` using your **Supabase email + password**.

| Role | Email (example) | Access |
|------|-----------------|--------|
| Super Admin | `admin@rcinnovation.club` | Everything |
| Content Editor | `editor@rcinnovation.club` | Content, gallery, SEO |
| Membership Manager | `membership@rcinnovation.club` | Applications, contact, certificates |

Roles are defined in `admin-config.js` and synced to `admin_profiles` on first login.

---

## Tech stack

- HTML5, CSS3, Vanilla JavaScript (no build step)
- [Supabase](https://supabase.com) — Auth, PostgreSQL, Storage
- [Render](https://render.com) — Static hosting
- [Tailwind CSS](https://tailwindcss.com) (CDN)
- [Font Awesome](https://fontawesome.com), [AOS](https://michalsnik.github.io/aos/), [Cropper.js](https://fengyuanchen.github.io/cropperjs/)

---

## Credits

Built for **RC Innovation Club**, Delhi Skill and Entrepreneurship University (DSEU), Rajokri Campus.

---

## License

MIT — see [LICENSE](LICENSE).
