/**
 * Supabase configuration for RC Innovation Club website.
 *
 * SETUP:
 * 1. Create a free project at https://supabase.com
 * 2. Run supabase/schema.sql in SQL Editor
 * 3. Create Storage bucket "gallery" (public read) — see schema.sql notes
 * 4. Authentication → Users → create admin accounts (same emails as admin-config.js)
 * 5. Paste Project URL + anon key below
 * 6. Set enabled: true
 */
window.RC_SUPABASE_CONFIG = {
  enabled: true,

  url: 'https://lejarqcqjjukpabetump.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlamFycWNxamp1a3BhYmV0dW1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwMjQ4MDEsImV4cCI6MjA5NjYwMDgwMX0.hTkf3MAc2QJ2mnsrKxN5ScQKyg9brNqk2BTEWnJanHQ'  // Settings → API → anon public key
};
