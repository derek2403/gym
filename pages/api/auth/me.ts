import type { NextApiRequest, NextApiResponse } from "next";
import { getAuthUser, clearAuthCookie } from "@/lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: "Not authenticated" });
    return res.json({ user });
  }

  if (req.method === "DELETE") {
    clearAuthCookie(res);
    return res.json({ ok: true });
  }

  res.setHeader("Allow", "GET, DELETE");
  res.status(405).end();
}
