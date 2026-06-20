// Canonical type definitions for admin settings and bus model configuration.
// Schema verified against live Supabase on 2026-06-20.
// The admin_settings table has 2 columns: id (text "singleton") and profiles (jsonb).

export type BaseModels = "Moffusil" | "Town" | "College" | "Staff" | "Kerala Series" | "Travel Series" | "Mini Bus Series";

export interface SeatingRowConfig {
  id: string;
  location: string;
  type: string;
  multiplier: number;
}

export interface Category {
  id: string;
  name: string;
  options: string[];
  optionPricing?: Record<string, number>;
  note?: string;
}

export interface SpecCategoryGroup {
  groupName: string;
  fields: Category[];
}

export interface BusModelProfile {
  basePrice: number;
  specGroups: SpecCategoryGroup[];
  standardSelections: Record<string, string[]>;
  extrasPricing?: Record<string, number>;
  optionPricing?: Record<string, number>;
  structurePricing?: Record<string, number>;
  seatingRows?: SeatingRowConfig[];
}

// Mirrors the Supabase admin_settings table structure.
// The table stores a single row with id="singleton" containing all model profiles.
export interface AdminSettingsRow {
  id: string;                                   // always "singleton"
  profiles: Record<BaseModels, BusModelProfile>;
}
