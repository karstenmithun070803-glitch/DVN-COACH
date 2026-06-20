// Canonical type definitions for the jobs entity.
// Schema verified against live Supabase on 2026-06-20.
// The jobs table uses camelCase column names (created before the naming standard was set).

export type ProductionStage =
  | "Chassis Arrival"
  | "Structure & Framing"
  | "Paneling & Flooring"
  | "Painting & Interior"
  | "Final Inspection & Delivery";

export type JobStatus = "active" | "archived" | "delivered";

// Mirrors the exact column names in the Supabase `jobs` table.
export interface JobCard {
  id: string;
  customerName: string;
  jobNo: string;              // Entered manually by the user in the New Job form
  chassisNo: string;
  engineNo: string;
  mobileNo?: string;
  address?: string;
  model: string;              // One of BaseModels: 'Moffusil' | 'Town' | 'College' | 'Staff' | 'Kerala Series'
  stage: ProductionStage;
  startDate: string;          // ISO date string YYYY-MM-DD
  selections?: Record<string, string[]>;
  fieldNotes?: Record<string, string>;
  seatingCapacity?: Record<string, number>;
  totalEstimate?: number;
  status: JobStatus;
  deliveredDate?: string;     // ISO date string, set when status → 'delivered'
  createdAt?: string;
  createdBy?: string;
}

export type JobCardInsert = Omit<JobCard, "createdAt" | "createdBy">;

export type JobCardUpdate = Partial<Omit<JobCard, "id" | "createdAt" | "createdBy">>;
