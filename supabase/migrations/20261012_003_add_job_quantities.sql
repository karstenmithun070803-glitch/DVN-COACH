-- Per-unit quantities for perUnit spec fields, keyed by field id.
alter table jobs add column if not exists "quantities" jsonb;
