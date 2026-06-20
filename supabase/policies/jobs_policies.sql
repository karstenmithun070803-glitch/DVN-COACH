-- =============================================================================
-- RLS Policies: jobs table
-- Context: Single-tenant workshop (Durga Industries, Karur).
--          No per-organisation isolation required. All authenticated users
--          share access to the same job pool.
--
-- Authentication model: Custom HMAC token stored in localStorage.
--          Supabase is accessed with the anon key only — there is no Supabase
--          Auth user session. This means auth.uid() is NULL for all requests.
--
-- CONSEQUENCE: Standard Supabase RLS using auth.uid() cannot restrict access
-- because requests arrive unauthenticated from Supabase's perspective.
-- The policies below use the service role key pattern instead:
--   - anon key: READ ONLY (safe for the PWA to load jobs on boot)
--   - All writes (INSERT/UPDATE/DELETE) must use the service role key
--     server-side, or RLS must be temporarily permissive if the app
--     writes directly from the client with the anon key.
--
-- CURRENT STATE: The app writes jobs directly from the client using the anon
-- key. Until server-side writes are implemented, the INSERT/UPDATE/DELETE
-- policies below are permissive (anon role allowed). This is a known
-- limitation documented in HANDOFF.md under "Known Technical Debt".
--
-- TO HARDEN: Route all writes through a Next.js API route that validates the
-- DVN session token before calling Supabase with the service role key.
-- =============================================================================

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- SELECT: anon and authenticated may read all rows
CREATE POLICY "jobs_select_policy"
ON jobs FOR SELECT
TO anon, authenticated
USING (true);

-- INSERT: anon and authenticated may insert (client writes directly)
-- TODO: Restrict to authenticated service-role writes once API routes exist
CREATE POLICY "jobs_insert_policy"
ON jobs FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- UPDATE: anon and authenticated may update
-- TODO: Restrict to authenticated service-role writes once API routes exist
CREATE POLICY "jobs_update_policy"
ON jobs FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- DELETE: anon and authenticated may delete
-- TODO: Restrict to service-role only once API routes exist
CREATE POLICY "jobs_delete_policy"
ON jobs FOR DELETE
TO anon, authenticated
USING (true);
