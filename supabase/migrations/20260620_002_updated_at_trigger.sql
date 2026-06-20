-- =============================================================================
-- Migration: 20260620_002_updated_at_trigger.sql
-- Purpose:   Add an updated_at column to jobs and admin_settings, and attach
--            a trigger to keep it current automatically.
--
-- NOTE: The live Supabase tables do not currently have an updated_at column.
-- This migration adds it. The column is nullable so existing rows are not
-- affected (they will have NULL until next update).
-- =============================================================================

-- Auto-update function (shared across all tables)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Add updated_at to jobs
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS updated_at timestamptz;

-- Trigger on jobs
DROP TRIGGER IF EXISTS set_jobs_updated_at ON jobs;
CREATE TRIGGER set_jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add updated_at to admin_settings
ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS updated_at timestamptz;

-- Trigger on admin_settings
DROP TRIGGER IF EXISTS set_admin_settings_updated_at ON admin_settings;
CREATE TRIGGER set_admin_settings_updated_at
  BEFORE UPDATE ON admin_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Migration complete.
