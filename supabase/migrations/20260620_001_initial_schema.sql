-- =============================================================================
-- Migration: 20260620_001_initial_schema.sql
-- Purpose:   Document and formalise the existing Supabase schema for the
--            DVN Coach Builders CRM.
--
-- IMPORTANT: This schema was VERIFIED against the live Supabase project on
--            2026-06-20 by querying the REST API. Column names are confirmed.
--
-- NOTE ON COLUMN NAMING: The jobs table uses camelCase column names because it
-- was created before a naming standard was established. This is not corrected
-- here to avoid a breaking migration on a live production table.
--
-- HOW TO USE THIS FILE:
--   If setting up a NEW Supabase project, run this file in the SQL editor.
--   If your project already has these tables, skip to the ALTER TABLE section
--   at the bottom to add any columns that may be missing.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- TABLE: jobs
-- Purpose: Stores every bus body-building job through its full lifecycle.
-- One row = one customer order.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS jobs (
  id              text         PRIMARY KEY,
  "customerName"  text         NOT NULL DEFAULT '',
  "jobNo"         text         NOT NULL DEFAULT '',
  "chassisNo"     text         NOT NULL DEFAULT '',
  "engineNo"      text         NOT NULL DEFAULT '',
  "mobileNo"      text,
  address         text,
  model           text         NOT NULL DEFAULT '',
    CONSTRAINT jobs_model_check CHECK (
      model IN ('Moffusil', 'Town', 'College', 'Staff', 'Kerala Series', '')
    ),
  stage           text         NOT NULL DEFAULT 'Chassis Arrival',
    CONSTRAINT jobs_stage_check CHECK (
      stage IN (
        'Chassis Arrival',
        'Structure & Framing',
        'Paneling & Flooring',
        'Painting & Interior',
        'Final Inspection & Delivery'
      )
    ),
  "startDate"     text         NOT NULL DEFAULT '',
  selections      jsonb,
  "fieldNotes"    jsonb,
  "seatingCapacity" jsonb,
  "totalEstimate" numeric(14, 2),
  status          text         NOT NULL DEFAULT 'active',
    CONSTRAINT jobs_status_check CHECK (
      status IN ('active', 'archived', 'delivered')
    ),
  "deliveredDate" text,
  "createdAt"     timestamptz  NOT NULL DEFAULT now(),
  "createdBy"     text
);

COMMENT ON TABLE jobs IS 'One row per bus body-building job. Status lifecycle: active → archived | delivered.';
COMMENT ON COLUMN jobs."jobNo"          IS 'Manually entered by the user in the New Job form. Not auto-generated.';
COMMENT ON COLUMN jobs.selections       IS 'JSONB map of spec field name → array of selected option values.';
COMMENT ON COLUMN jobs."fieldNotes"     IS 'JSONB map of spec field name → free-text note.';
COMMENT ON COLUMN jobs."seatingCapacity" IS 'JSONB map of seating row id → computed passenger count.';
COMMENT ON COLUMN jobs."deliveredDate"  IS 'ISO date string set when status transitions to delivered.';

-- Index for the two most common filter patterns
CREATE INDEX IF NOT EXISTS jobs_status_idx ON jobs (status);
CREATE INDEX IF NOT EXISTS jobs_model_idx  ON jobs (model);
CREATE INDEX IF NOT EXISTS jobs_stage_idx  ON jobs (stage);

-- Enable RLS (rows will be inaccessible without a policy — add policies next)
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- TABLE: admin_settings
-- Purpose: Stores the full admin configuration for all bus models as a single
--          singleton JSON document. One row only, id = 'singleton'.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_settings (
  id       text  PRIMARY KEY,
  profiles jsonb NOT NULL DEFAULT '{}'::jsonb
);

COMMENT ON TABLE admin_settings IS 'Singleton table (one row, id=singleton). Stores all BusModelProfile configs as a JSONB blob.';
COMMENT ON COLUMN admin_settings.profiles IS 'Full map of BaseModels → BusModelProfile. Loaded and saved wholesale by AdminSettingsContext.';

-- Enable RLS
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- COLUMNS THAT MAY BE MISSING FROM YOUR LIVE TABLE
-- Run these only if the column does not already exist.
-- Check with: SELECT column_name FROM information_schema.columns WHERE table_name = 'jobs';
-- =============================================================================

-- address column (added after initial table creation)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS address text;

-- fieldNotes column
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS "fieldNotes" jsonb;

-- seatingCapacity column
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS "seatingCapacity" jsonb;

-- deliveredDate column
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS "deliveredDate" text;

-- createdAt column (timestamptz, default now())
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS "createdAt" timestamptz NOT NULL DEFAULT now();

-- createdBy column
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS "createdBy" text;

-- Migration complete.
