// Canonical type definitions for authentication and session management.

export type Role = "SUPER_ADMIN" | "STAFF";

export interface Session {
  token: string;
  expires: number;   // Unix timestamp (ms)
  role: Role;
  displayName: string;
}

// Shape of a staff credential entry in STAFF_CREDENTIALS env var.
// p must be a bcrypt hash (prefix $2b$). Legacy plaintext is still accepted
// but should be migrated using scripts/hash-staff-passwords.ts.
export interface StaffCredential {
  u: string;   // username
  p: string;   // bcrypt hash of password
}

export interface AuthContextType {
  isLoggedIn: boolean;
  isChecked: boolean;
  role: Role | null;
  displayName: string | null;
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
}
