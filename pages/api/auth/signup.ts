import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { hashPassword, createToken, setAuthCookie, type AuthUser } from "@/lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end();
  }

  const { name, email, password } = req.body;

  if (!name?.trim() || !email?.trim() || !password) {
    return res.status(400).json({ error: "Name, email, and password are required" });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  const existing = db.select().from(users).where(eq(users.email, email.trim().toLowerCase())).get();
  if (existing) {
    return res.status(409).json({ error: "Email already registered" });
  }

  const passwordHash = await hashPassword(password);
  const result = db.insert(users).values({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    passwordHash,
  }).returning().all();

  const user = result[0];
  const authUser: AuthUser = { id: user.id, name: user.name, email: user.email };
  const token = createToken(authUser);
  setAuthCookie(res, token);

  return res.status(201).json({ user: authUser });
}
