import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";
import { exerciseTemplates, templateExercises, workouts } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const id = Number(req.query.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

  const template = db.select().from(exerciseTemplates).where(and(eq(exerciseTemplates.id, id), eq(exerciseTemplates.userId, userId))).get();
  if (!template) return res.status(404).json({ error: "Not found" });

  if (req.method === "GET") {
    const exercises = db.select().from(templateExercises).where(eq(templateExercises.templateId, id)).orderBy(templateExercises.sortOrder).all();
    return res.json({ ...template, exercises });
  }

  if (req.method === "PUT") {
    const { name, exercises } = req.body as { name: string; exercises: { exerciseName: string; targetSets: number; targetReps: number; restSeconds?: number; intervalSeconds?: number }[] };
    db.update(exerciseTemplates).set({ name: name.trim() }).where(eq(exerciseTemplates.id, id)).run();
    db.delete(templateExercises).where(eq(templateExercises.templateId, id)).run();
    if (exercises?.length) {
      db.insert(templateExercises).values(exercises.map((e, i) => ({
        templateId: id, exerciseName: e.exerciseName, targetSets: e.targetSets || 3, targetReps: e.targetReps || 10, restSeconds: e.restSeconds ?? 90, intervalSeconds: e.intervalSeconds ?? 120, sortOrder: i,
      }))).run();
    }
    const updated = db.select().from(exerciseTemplates).where(eq(exerciseTemplates.id, id)).get();
    const updatedEx = db.select().from(templateExercises).where(eq(templateExercises.templateId, id)).all();
    return res.json({ ...updated, exercises: updatedEx });
  }

  if (req.method === "DELETE") {
    db.update(workouts).set({ templateId: null }).where(eq(workouts.templateId, id)).run();
    db.delete(exerciseTemplates).where(eq(exerciseTemplates.id, id)).run();
    return res.status(204).end();
  }

  res.setHeader("Allow", "GET, PUT, DELETE");
  res.status(405).end();
}
