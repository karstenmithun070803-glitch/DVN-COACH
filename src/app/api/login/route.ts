import { createHmac } from "crypto";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  const validUser = process.env.AUTH_USERNAME;
  const validPass = process.env.AUTH_PASSWORD;
  const secret = process.env.SESSION_SECRET ?? "fallback";

  const isAdmin = validUser && validPass && username === validUser && password === validPass;

  let isStaff = false;
  if (!isAdmin) {
    try {
      const staffRaw = process.env.STAFF_CREDENTIALS;
      const staffList: { u: string; p: string }[] = staffRaw ? JSON.parse(staffRaw) : [];
      isStaff = staffList.some(s => s.u === username && s.p === password);
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
