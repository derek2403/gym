import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";
import { profiles } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { nowISO } from "@/lib/utils";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const profile = db.select().from(profiles).get();
    return res.json(profile || null);
  }

  if (req.method === "POST") {
    const { age, sex, heightCm, weightKg, activityLevel, calorieGoal, goalType, neckCm, hipCm } = req.body;

    const existing = db.select().from(profiles).get();

    if (existing) {
      db.update(profiles)
        .set({
          age,
          sex,
          heightCm,
          weightKg,
          activityLevel,
          calorieGoal,
          goalType,
          neckCm,
          hipCm,
          updatedAt: nowISO(),
        })
        .where(eq(profiles.id, existing.id))
        .run();
      const updated = db.select().from(profiles).where(eq(profiles.id, existing.id)).get();
      return res.json(updated);
    }

    const result = db
      .insert(profiles)
      .values({ age, sex, heightCm, weightKg, activityLevel, calorieGoal, goalType, neckCm, hipCm })
      .returning()
      .all();

    return res.status(201).json(result[0]);
  }

  res.setHeader("Allow", "GET, POST");
  res.status(405).end();
}
