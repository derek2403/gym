import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "./db";
import { users } from "./schema";
import { eq } from "drizzle-orm";
import type { NextApiRequest, NextApiResponse } from "next";
import { serialize, parse } from "cookie";

const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-production";
const COOKIE_NAME = "gym_token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export interface AuthUser {
  id: number;
  name: string;
  email: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function createToken(user: AuthUser): string {
  return jwt.sign({ id: user.id, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: "30d" });
}

export function verifyToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser;
  } catch {
    return null;
  }
}

export function setAuthCookie(res: NextApiResponse, token: string) {
  res.setHeader("Set-Cookie", serialize(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  }));
}

export function clearAuthCookie(res: NextApiResponse) {
  res.setHeader("Set-Cookie", serialize(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  }));
}

export function getAuthUser(req: NextApiRequest): AuthUser | null {
  const cookies = parse(req.headers.cookie || "");
  const token = cookies[COOKIE_NAME];
  if (!token) return null;
  return verifyToken(token);
}

export function requireAuth(req: NextApiRequest, res: NextApiResponse): number | null {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  return user.id;
}
