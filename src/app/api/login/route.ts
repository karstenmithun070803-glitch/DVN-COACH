import { createHmac } from "crypto";
import { compare } from "bcryptjs";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    console.error("SESSION_SECRET environment variable is not set");
    return Response.json({ ok: false, error: "Server configuration error" }, { status: 500 });
  }

  const { username, password } = await req.json();

  if (!username || !password) {
    return Response.json({ ok: false, error: "Username and password are required" }, { status: 400 });
  }

  const validUser = process.env.AUTH_USERNAME;
  const validPass = process.env.AUTH_PASSWORD;

  const isAdmin = validUser && validPass && username === validUser && password === validPass;

  let isStaff = false;
  if (!isAdmin) {
    try {
      const staffRaw = process.env.STAFF_CREDENTIALS;
      const staffList: { u: string; p: string }[] = staffRaw ? JSON.parse(staffRaw) : [];
      const match = staffList.find(s => s.u === username);
      if (match) {
        // p may be a bcrypt hash (starts with $2b$) or legacy plaintext
        const isBcrypt = match.p.startsWith("$2b$") || match.p.startsWith("$2a$");
        isStaff = isBcrypt ? await compare(password, match.p) : match.p === password;
      }
    } catch { /* malformed env var — treat as no staff */ }
  }

  if (!isAdmin && !isStaff) {
    return Response.json({ ok: false, error: "Invalid username or password" }, { status: 401 });
  }

  const role = isAdmin ? "SUPER_ADMIN" : "STAFF";
  const displayName = isAdmin ? "DVN Vijay" : username;
  const expires = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
  const token = createHmac("sha256", secret).update(`${username}:${expires}`).digest("hex");

  return Response.json({ ok: true, token, expires, role, displayName });
}
