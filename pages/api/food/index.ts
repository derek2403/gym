import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";
import { foodEntries } from "@/lib/schema";
import { eq, desc, and } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = requireAuth(req, res);
  if (!userId) return;

  if (req.method === "GET") {
    const date = req.query.date as string | undefined;
    if (date) {
      return res.json(db.select().from(foodEntries).where(and(eq(foodEntries.userId, userId), eq(foodEntries.date, date))).orderBy(foodEntries.createdAt).all());
    }
    return res.json(db.select().from(foodEntries).where(eq(foodEntries.userId, userId)).orderBy(desc(foodEntries.date)).limit(100).all());
  }

  if (req.method === "POST") {
    const { date, mealType, description, calories, proteinG, carbsG, fatG } = req.body;
    const result = db.insert(foodEntries).values({ userId, date, mealType, description, calories, proteinG, carbsG, fatG }).returning().all();
    return res.status(201).json(result[0]);
  }

  if (req.method === "DELETE") {
    const id = Number(req.query.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
    db.delete(foodEntries).where(and(eq(foodEntries.id, id), eq(foodEntries.userId, userId))).run();
    return res.status(204).end();
  }

  res.setHeader("Allow", "GET, POST, DELETE");
  res.status(405).end();
}
