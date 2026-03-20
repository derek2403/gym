import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";
import { foodEntries } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const date = req.query.date as string | undefined;

    if (date) {
      const entries = db
        .select()
        .from(foodEntries)
        .where(eq(foodEntries.date, date))
        .orderBy(foodEntries.createdAt)
        .all();
      return res.json(entries);
    }

    const entries = db.select().from(foodEntries).orderBy(desc(foodEntries.date)).limit(100).all();
    return res.json(entries);
  }

  if (req.method === "POST") {
    const { date, mealType, description, calories, proteinG, carbsG, fatG } = req.body;
    const result = db
      .insert(foodEntries)
      .values({
        date,
        mealType,
        description,
        calories,
        proteinG,
        carbsG,
        fatG,
      })
      .returning()
      .all();
    return res.status(201).json(result[0]);
  }

  if (req.method === "DELETE") {
    const id = Number(req.query.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
    db.delete(foodEntries).where(eq(foodEntries.id, id)).run();
    return res.status(204).end();
  }

  res.setHeader("Allow", "GET, POST, DELETE");
  res.status(405).end();
}
