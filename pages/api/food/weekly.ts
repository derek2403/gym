import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";
import { foodEntries } from "@/lib/schema";
import { sql } from "drizzle-orm";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).end();
  }

  const { start, end } = req.query;
  if (!start || !end) return res.status(400).json({ error: "start and end required" });

  const entries = db
    .select()
    .from(foodEntries)
    .where(
      sql`${foodEntries.date} >= ${start} AND ${foodEntries.date} <= ${end}`
    )
    .all();

  // Group by date
  const byDate: Record<string, { calories: number; proteinG: number; carbsG: number; fatG: number }> = {};
  for (const e of entries) {
    if (!byDate[e.date]) {
      byDate[e.date] = { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 };
    }
    byDate[e.date].calories += e.calories;
    byDate[e.date].proteinG += e.proteinG;
    byDate[e.date].carbsG += e.carbsG;
    byDate[e.date].fatG += e.fatG;
  }

  // Totals
  const totals = entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      proteinG: acc.proteinG + e.proteinG,
      carbsG: acc.carbsG + e.carbsG,
      fatG: acc.fatG + e.fatG,
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }
  );

  res.json({ byDate, totals, entryCount: entries.length });
}
