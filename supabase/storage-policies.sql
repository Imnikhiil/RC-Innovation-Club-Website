-- Run AFTER creating Storage bucket "gallery" (public read) in Supabase Dashboard.
-- Storage → New bucket → name: gallery → Public bucket: ON

CREATE POLICY "gallery_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'gallery');

CREATE POLICY "gallery_editors_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'gallery' AND public.rc_admin_role() IN ('super', 'content')
  );

CREATE POLICY "gallery_editors_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'gallery' AND public.rc_admin_role() IN ('super', 'content')
  );

CREATE POLICY "gallery_editors_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'gallery' AND public.rc_admin_role() IN ('super', 'content')
  );
