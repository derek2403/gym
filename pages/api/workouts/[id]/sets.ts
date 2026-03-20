import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";
import { workoutSets } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { nowISO } from "@/lib/utils";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const workoutId = Number(req.query.id);
  if (isNaN(workoutId)) return res.status(400).json({ error: "Invalid ID" });

  if (req.method === "GET") {
    const sets = db.select().from(workoutSets).where(eq(workoutSets.workoutId, workoutId)).all();
    return res.json(sets);
  }

  if (req.method === "POST") {
    const { exerciseName, setNumber, weightKg, reps } = req.body;
    const result = db
      .insert(workoutSets)
      .values({
        workoutId,
        exerciseName,
        setNumber,
        weightKg: weightKg || 0,
        reps: reps || 0,
        completedAt: nowISO(),
      })
      .returning()
      .all();
    return res.status(201).json(result[0]);
  }

  if (req.method === "DELETE") {
    const setId = Number(req.query.setId);
    if (!isNaN(setId)) {
      db.delete(workoutSets).where(eq(workoutSets.id, setId)).run();
    }
    return res.status(204).end();
  }

  res.setHeader("Allow", "GET, POST, DELETE");
  res.status(405).end();
}
