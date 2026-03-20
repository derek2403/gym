import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";
import { exerciseTemplates, templateExercises } from "@/lib/schema";
import { eq } from "drizzle-orm";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const templates = db.select().from(exerciseTemplates).all();
    const exercises = db.select().from(templateExercises).all();

    const result = templates.map((t) => ({
      ...t,
      exercises: exercises
        .filter((e) => e.templateId === t.id)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    }));

    return res.json(result);
  }

  if (req.method === "POST") {
    const { name, exercises } = req.body as {
      name: string;
      exercises: { exerciseName: string; targetSets: number; targetReps: number; restSeconds?: number; intervalSeconds?: number }[];
    };

    if (!name?.trim()) return res.status(400).json({ error: "Name is required" });

    const template = db.insert(exerciseTemplates).values({ name: name.trim() }).returning().all()[0];

    if (exercises?.length) {
      db.insert(templateExercises)
        .values(
          exercises.map((e, i) => ({
            templateId: template.id,
            exerciseName: e.exerciseName,
            targetSets: e.targetSets || 3,
            targetReps: e.targetReps || 10,
            restSeconds: e.restSeconds ?? 90,
            intervalSeconds: e.intervalSeconds ?? 120,
            sortOrder: i,
          }))
        )
        .run();
    }

    const allExercises = db
      .select()
      .from(templateExercises)
      .where(eq(templateExercises.templateId, template.id))
      .all();

    return res.status(201).json({ ...template, exercises: allExercises });
  }

  res.setHeader("Allow", "GET, POST");
  res.status(405).end();
}
