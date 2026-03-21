import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";
import { workouts, workoutSets } from "@/lib/schema";
import { desc, eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = requireAuth(req, res);
  if (!userId) return;

  if (req.method === "GET") {
    const limit = Number(req.query.limit) || 50;
    const all = db.select().from(workouts).where(eq(workouts.userId, userId)).orderBy(desc(workouts.startedAt)).limit(limit).all();
    const result = all.map((w) => ({ ...w, sets: db.select().from(workoutSets).where(eq(workoutSets.workoutId, w.id)).all() }));
    return res.json(result);
  }

  if (req.method === "POST") {
    const { templateId } = req.body;
    const result = db.insert(workouts).values({ userId, templateId: templateId || null }).returning().all();
    return res.status(201).json({ ...result[0], sets: [] });
  }

  res.setHeader("Allow", "GET, POST");
  res.status(405).end();
}
