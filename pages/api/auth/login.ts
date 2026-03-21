import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { verifyPassword, createToken, setAuthCookie, type AuthUser } from "@/lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end();
  }

  const { email, password } = req.body;

  if (!email?.trim() || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const user = db.select().from(users).where(eq(users.email, email.trim().toLowerCase())).get();
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const authUser: AuthUser = { id: user.id, name: user.name, email: user.email };
  const token = createToken(authUser);
  setAuthCookie(res, token);

  return res.json({ user: authUser });
}
