import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";
import { workoutSets, workouts } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { nowISO } from "@/lib/utils";
import { requireAuth } from "@/lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const workoutId = Number(req.query.id);
  if (isNaN(workoutId)) return res.status(400).json({ error: "Invalid ID" });

  const workout = db.select().from(workouts).where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId))).get();
  if (!workout) return res.status(404).json({ error: "Not found" });

  if (req.method === "GET") {
    return res.json(db.select().from(workoutSets).where(eq(workoutSets.workoutId, workoutId)).all());
  }

  if (req.method === "POST") {
    const { exerciseName, setNumber, weightKg, reps } = req.body;
    const result = db.insert(workoutSets).values({ workoutId, exerciseName, setNumber, weightKg: weightKg || 0, reps: reps || 0, completedAt: nowISO() }).returning().all();
    return res.status(201).json(result[0]);
  }

  res.setHeader("Allow", "GET, POST");
  res.status(405).end();
}
