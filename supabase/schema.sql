-- RC Innovation Club — Supabase schema
-- Run this entire file in: Supabase Dashboard → SQL Editor → New query → Run

-- =============================================================================
-- TABLES
-- =============================================================================

CREATE TABLE IF NOT EXISTS cms_content (
  id          text PRIMARY KEY DEFAULT 'main',
  data        jsonb NOT NULL DEFAULT '{}',
  schema_version int NOT NULL DEFAULT 1,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  updated_by  text
);

CREATE TABLE IF NOT EXISTS admin_profiles (
  id           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        text NOT NULL,
  username     text,
  role         text NOT NULL DEFAULT 'super' CHECK (role IN ('super', 'content', 'membership')),
  display_name text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS applications (
  id                      text PRIMARY KEY,
  name                    text NOT NULL,
  enrollment_number       text NOT NULL,
  enrollment_number_lower text NOT NULL,
  course                  text NOT NULL,
  semester                text NOT NULL,
  email                   text NOT NULL,
  phone                   text NOT NULL,
  skills                  text DEFAULT '',
  interests               text DEFAULT '',
  reason                  text NOT NULL,
  status                  text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at            timestamptz NOT NULL DEFAULT now(),
  reviewed_at             timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS applications_enrollment_lower_idx
  ON applications (enrollment_number_lower);

CREATE TABLE IF NOT EXISTS contact_messages (
  id           text PRIMARY KEY,
  name         text NOT NULL,
  email        text NOT NULL,
  subject      text NOT NULL,
  message      text NOT NULL,
  status       text NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read')),
  submitted_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subscribers (
  id            text PRIMARY KEY,
  email         text NOT NULL,
  subscribed_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS subscribers_email_idx ON subscribers (email);

CREATE TABLE IF NOT EXISTS certificates (
  id              text PRIMARY KEY,
  recipient_name  text NOT NULL,
  type            text NOT NULL DEFAULT 'participation',
  event_title     text NOT NULL DEFAULT 'RC Innovation Club',
  description     text DEFAULT '',
  issue_date      date NOT NULL,
  status          text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  issued_at       timestamptz NOT NULL DEFAULT now()
);

-- Seed empty CMS row
INSERT INTO cms_content (id, data) VALUES ('main', '{}')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- HELPER: admin role lookup
-- =============================================================================

CREATE OR REPLACE FUNCTION public.rc_admin_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM admin_profiles WHERE id = auth.uid()
$$;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE cms_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- Admin profiles
CREATE POLICY "admin_profiles_select_own" ON admin_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "admin_profiles_insert_own" ON admin_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "admin_profiles_update_own" ON admin_profiles
  FOR UPDATE USING (auth.uid() = id);

-- CMS content — public read, content editors write
CREATE POLICY "cms_public_read" ON cms_content
  FOR SELECT USING (true);

CREATE POLICY "cms_editors_write" ON cms_content
  FOR ALL USING (rc_admin_role() IN ('super', 'content'))
  WITH CHECK (rc_admin_role() IN ('super', 'content'));

-- Membership applications — public submit, managers manage
CREATE POLICY "applications_public_insert" ON applications
  FOR INSERT WITH CHECK (status = 'pending');

CREATE POLICY "applications_managers_select" ON applications
  FOR SELECT USING (rc_admin_role() IN ('super', 'membership'));

CREATE POLICY "applications_managers_update" ON applications
  FOR UPDATE USING (rc_admin_role() IN ('super', 'membership'));

CREATE POLICY "applications_managers_delete" ON applications
  FOR DELETE USING (rc_admin_role() IN ('super', 'membership'));

-- Contact messages
CREATE POLICY "contact_public_insert" ON contact_messages
  FOR INSERT WITH CHECK (status = 'unread');

CREATE POLICY "contact_managers_select" ON contact_messages
  FOR SELECT USING (rc_admin_role() IN ('super', 'membership'));

CREATE POLICY "contact_managers_update" ON contact_messages
  FOR UPDATE USING (rc_admin_role() IN ('super', 'membership'));

CREATE POLICY "contact_managers_delete" ON contact_messages
  FOR DELETE USING (rc_admin_role() IN ('super', 'membership'));

-- Newsletter subscribers
CREATE POLICY "subscribers_public_insert" ON subscribers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "subscribers_managers_select" ON subscribers
  FOR SELECT USING (rc_admin_role() IN ('super', 'membership'));

CREATE POLICY "subscribers_managers_delete" ON subscribers
  FOR DELETE USING (rc_admin_role() IN ('super', 'membership'));

-- Certificates — public verify, managers manage
CREATE POLICY "certificates_public_read" ON certificates
  FOR SELECT USING (true);

CREATE POLICY "certificates_managers_write" ON certificates
  FOR INSERT WITH CHECK (rc_admin_role() IN ('super', 'membership'));

CREATE POLICY "certificates_managers_update" ON certificates
  FOR UPDATE USING (rc_admin_role() IN ('super', 'membership'));

CREATE POLICY "certificates_managers_delete" ON certificates
  FOR DELETE USING (rc_admin_role() IN ('super', 'membership'));

-- =============================================================================
-- STORAGE (run after creating bucket in Dashboard)
-- Dashboard → Storage → New bucket → name: gallery → Public bucket: ON
-- Then run the policies below in SQL Editor:
-- =============================================================================

-- CREATE POLICY "gallery_public_read" ON storage.objects
--   FOR SELECT USING (bucket_id = 'gallery');
--
-- CREATE POLICY "gallery_editors_upload" ON storage.objects
--   FOR INSERT WITH CHECK (
--     bucket_id = 'gallery' AND rc_admin_role() IN ('super', 'content')
--   );
--
-- CREATE POLICY "gallery_editors_update" ON storage.objects
--   FOR UPDATE USING (
--     bucket_id = 'gallery' AND rc_admin_role() IN ('super', 'content')
--   );
--
-- CREATE POLICY "gallery_editors_delete" ON storage.objects
--   FOR DELETE USING (
--     bucket_id = 'gallery' AND rc_admin_role() IN ('super', 'content')
--   );

-- =============================================================================
-- REALTIME (enable for live CMS sync)
-- Dashboard → Database → Replication → enable cms_content
-- =============================================================================
