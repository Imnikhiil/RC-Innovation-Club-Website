-- RC Innovation Club — Storage RLS policies for bucket "gallery"
--
-- RUN THIS in: Supabase Dashboard → SQL Editor → New query → Run
--
-- Prerequisites:
-- 1. Create Storage bucket named "gallery" (Public: ON)
--    Dashboard → Storage → New bucket → name: gallery → Public bucket: ON
-- 2. schema.sql already applied (needs public.rc_admin_role())
-- 3. Admin users exist in Authentication + admin_profiles

-- Drop old policies so this file is safe to re-run
DROP POLICY IF EXISTS "gallery_public_read" ON storage.objects;
DROP POLICY IF EXISTS "gallery_editors_upload" ON storage.objects;
DROP POLICY IF EXISTS "gallery_editors_update" ON storage.objects;
DROP POLICY IF EXISTS "gallery_editors_delete" ON storage.objects;
DROP POLICY IF EXISTS "Public read gallery" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload gallery" ON storage.objects;

-- Anyone can view public gallery files
CREATE POLICY "gallery_public_read"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'gallery');

-- Super + content admins can upload (new files)
CREATE POLICY "gallery_editors_upload"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'gallery'
    AND public.rc_admin_role() IN ('super', 'content')
  );

-- Needed for upsert: true (replace existing photo)
CREATE POLICY "gallery_editors_update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'gallery'
    AND public.rc_admin_role() IN ('super', 'content')
  )
  WITH CHECK (
    bucket_id = 'gallery'
    AND public.rc_admin_role() IN ('super', 'content')
  );

-- Super + content admins can delete
CREATE POLICY "gallery_editors_delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'gallery'
    AND public.rc_admin_role() IN ('super', 'content')
  );

-- Ensure every Auth user who should admin has a profile row.
-- Creates/updates profiles for known admin emails after they exist in Authentication → Users.
INSERT INTO admin_profiles (id, email, username, role, display_name)
SELECT
  u.id,
  u.email,
  split_part(u.email, '@', 1),
  CASE
    WHEN u.email ILIKE 'editor@%' THEN 'content'
    WHEN u.email ILIKE 'membership@%' THEN 'membership'
    ELSE 'super'
  END,
  split_part(u.email, '@', 1)
FROM auth.users u
WHERE u.email IN (
  'admin@rcinnovation.club',
  'editor@rcinnovation.club',
  'membership@rcinnovation.club'
)
ON CONFLICT (id) DO UPDATE
SET
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  username = EXCLUDED.username;
