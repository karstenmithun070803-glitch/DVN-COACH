-- =============================================================================
-- Seed data: DVN Coach Builders CRM
-- Purpose:   Populate a fresh local/staging Supabase project with sample jobs
--            so a developer can see the application working immediately.
--
-- Usage:     Run in the Supabase SQL editor on a new project after running
--            the migration files in supabase/migrations/.
--
-- WARNING:   Do NOT run this on the production Supabase project.
--            It uses INSERT ... ON CONFLICT DO NOTHING so it is safe to re-run.
-- =============================================================================

-- Admin settings singleton (minimal — real data is managed in the app UI)
INSERT INTO admin_settings (id, profiles)
VALUES (
  'singleton',
  '{}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- Sample jobs representing each production stage
INSERT INTO jobs (
  id, "customerName", "jobNo", "chassisNo", "engineNo", "mobileNo",
  model, stage, "startDate", status, "createdAt"
)
VALUES
  (
    'seed-job-001',
    'Sample Customer A',
    'DVN-001',
    'MB1SAMPLE001',
    'ENGSAMPLE001',
    '9876543210',
    'Moffusil',
    'Chassis Arrival',
    '2026-06-01',
    'active',
    now()
  ),
  (
    'seed-job-002',
    'Sample Customer B',
    'DVN-002',
    'MB1SAMPLE002',
    'ENGSAMPLE002',
    '9876543211',
    'Town',
    'Structure & Framing',
    '2026-05-20',
    'active',
    now()
  ),
  (
    'seed-job-003',
    'Sample Customer C',
    'DVN-003',
    'MB1SAMPLE003',
    'ENGSAMPLE003',
    NULL,
    'College',
    'Paneling & Flooring',
    '2026-05-10',
    'active',
    now()
  ),
  (
    'seed-job-004',
    'Sample Customer D',
    'DVN-004',
    'MB1SAMPLE004',
    'ENGSAMPLE004',
    '9876543212',
    'Staff',
    'Painting & Interior',
    '2026-04-25',
    'active',
    now()
  ),
  (
    'seed-job-005',
    'Sample Customer E',
    'DVN-005',
    'MB1SAMPLE005',
    'ENGSAMPLE005',
    '9876543213',
    'Kerala Series',
    'Final Inspection & Delivery',
    '2026-04-01',
    'active',
    now()
  ),
  (
    'seed-job-006',
    'Archived Customer F',
    'DVN-006',
    'MB1SAMPLE006',
    'ENGSAMPLE006',
    NULL,
    'Moffusil',
    'Final Inspection & Delivery',
    '2026-03-01',
    'delivered',
    now()
  )
ON CONFLICT (id) DO NOTHING;

-- Seed complete.
