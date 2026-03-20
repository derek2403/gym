import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";
import { workouts, workoutSets } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { nowISO } from "@/lib/utils";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = Number(req.query.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

  if (req.method === "GET") {
    const workout = db.select().from(workouts).where(eq(workouts.id, id)).get();
    if (!workout) return res.status(404).json({ error: "Not found" });
    const sets = db.select().from(workoutSets).where(eq(workoutSets.workoutId, id)).all();
    return res.json({ ...workout, sets });
  }

  if (req.method === "PUT") {
    const { completedAt } = req.body;
    db.update(workouts)
      .set({ completedAt: completedAt || nowISO() })
      .where(eq(workouts.id, id))
      .run();
    const workout = db.select().from(workouts).where(eq(workouts.id, id)).get();
    const sets = db.select().from(workoutSets).where(eq(workoutSets.workoutId, id)).all();
    return res.json({ ...workout, sets });
  }

  if (req.method === "DELETE") {
    db.delete(workouts).where(eq(workouts.id, id)).run();
    return res.status(204).end();
  }

  res.setHeader("Allow", "GET, PUT, DELETE");
  res.status(405).end();
}
