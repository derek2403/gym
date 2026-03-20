import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";
import { workouts, workoutSets } from "@/lib/schema";
import { desc, eq } from "drizzle-orm";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const limit = Number(req.query.limit) || 50;
    const all = db.select().from(workouts).orderBy(desc(workouts.startedAt)).limit(limit).all();

    const result = all.map((w) => {
      const sets = db.select().from(workoutSets).where(eq(workoutSets.workoutId, w.id)).all();
      return { ...w, sets };
    });

    return res.json(result);
  }

  if (req.method === "POST") {
    const { templateId } = req.body;
    const result = db
      .insert(workouts)
      .values({ templateId: templateId || null })
      .returning()
      .all();
    return res.status(201).json({ ...result[0], sets: [] });
  }

  res.setHeader("Allow", "GET, POST");
  res.status(405).end();
}
