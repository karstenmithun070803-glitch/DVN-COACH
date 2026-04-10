import { BaseModels } from "./specs";

export type ProductionStage = 
  | "Chassis Arrival"
  | "Structure & Framing"
  | "Paneling & Flooring"
  | "Painting & Interior"
  | "Final Inspection & Delivery";

export interface JobCard {
  id: string;
  customerName: string;
  jobNo: string;
  chassisNo: string;
  engineNo: string;
  mobileNo?: string;
  address?: string;
  model: BaseModels;
  stage: ProductionStage;
  startDate: string;
  selections?: Record<string, string[]>;
  fieldNotes?: Record<string, string>;
  seatingCapacity?: {
    rhSide3Pass: number;
    rhSide2Plus1: number;
    lhSide2Pass: number;
    platform2Pass: number;
    platform1Plus1: number;
    platform1Pass: number;
  };
  totalEstimate?: number;
  status: "active" | "delivered" | "archived";
  deliveredDate?: string;
}

export const STAGES: ProductionStage[] = [
  "Chassis Arrival",
  "Structure & Framing",
  "Paneling & Flooring",
  "Painting & Interior",
  "Final Inspection & Delivery"
];

export const MOCK_JOBS: JobCard[] = [
  {
    id: "job-1",
    customerName: "VRL Travels",
    jobNo: "DVN-2024-001",
    chassisNo: "AL-772391",
    engineNo: "ENG-9921",
    model: "Moffusil",
    stage: "Chassis Arrival",
    startDate: "2024-04-01",
    status: "active"
  },
  {
    id: "job-2",
    customerName: "KPN Speed",
    jobNo: "DVN-2024-002",
    chassisNo: "TT-881233",
    engineNo: "ENG-1123",
    model: "Town",
    stage: "Structure & Framing",
    startDate: "2024-03-28",
    status: "active"
  },
  {
    id: "job-3",
    customerName: "PSG College",
    jobNo: "DVN-2024-003",
    chassisNo: "EH-661200",
    engineNo: "ENG-4455",
    model: "College",
    stage: "Paneling & Flooring",
    startDate: "2024-03-25",
    status: "active"
  },
  {
    id: "job-4",
    customerName: "SRS Travels",
    jobNo: "DVN-2024-004",
    chassisNo: "AL-990011",
    engineNo: "ENG-8877",
    model: "Moffusil",
    stage: "Painting & Interior",
    startDate: "2024-03-20",
    status: "active"
  },
  {
    id: "job-5",
    customerName: "TCS Staff",
    jobNo: "DVN-2024-005",
    chassisNo: "EH-220033",
    engineNo: "ENG-3344",
    model: "Staff",
    stage: "Final Inspection & Delivery",
    startDate: "2024-03-15",
    status: "active"
  },
  {
    id: "job-6",
    customerName: "Raja School",
    jobNo: "DVN-2024-006",
    chassisNo: "TT-112233",
    engineNo: "ENG-5566",
    model: "College",
    stage: "Chassis Arrival",
    startDate: "2024-04-02",
    status: "active"
  }
];
