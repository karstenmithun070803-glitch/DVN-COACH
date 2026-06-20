-- =============================================================================
-- RLS Policies: admin_settings table
-- Context: Same authentication model as jobs (anon key, custom HMAC session).
--
-- The admin_settings table contains a single row (id = 'singleton') that
-- stores all bus model configuration. It should ideally be:
--   - Readable by all workshop users (anon)
--   - Writable only by SUPER_ADMIN users
--
-- Because role enforcement is currently client-side only (the Supabase request
-- has no way to distinguish SUPER_ADMIN from STAFF), the write policy is
-- permissive for now — the UI enforces read-only mode for STAFF users.
--
-- TO HARDEN: Route admin_settings writes through a Next.js API route that
-- validates role === "SUPER_ADMIN" from the DVN session token before writing.
-- =============================================================================

ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- SELECT: anon and authenticated may read the singleton settings row
CREATE POLICY "admin_settings_select_policy"
ON admin_settings FOR SELECT
TO anon, authenticated
USING (true);

-- INSERT: allow anon (app upserts on first load if table is empty)
CREATE POLICY "admin_settings_insert_policy"
ON admin_settings FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- UPDATE: allow anon for now
-- TODO: Restrict to SUPER_ADMIN role once server-side auth validation exists
CREATE POLICY "admin_settings_update_policy"
ON admin_settings FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- DELETE: block all — admin_settings is a singleton and should never be deleted
-- (removing the singleton row would break the entire admin configuration)
CREATE POLICY "admin_settings_no_delete_policy"
ON admin_settings FOR DELETE
TO anon, authenticated
USING (false);
