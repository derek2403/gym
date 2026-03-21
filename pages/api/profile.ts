import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";
import { profiles } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { nowISO } from "@/lib/utils";
import { requireAuth } from "@/lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = requireAuth(req, res);
  if (!userId) return;

  if (req.method === "GET") {
    const profile = db.select().from(profiles).where(eq(profiles.userId, userId)).get();
    return res.json(profile || null);
  }

  if (req.method === "POST") {
    const { age, sex, heightCm, weightKg, activityLevel, calorieGoal, goalType, neckCm, hipCm } = req.body;
    const existing = db.select().from(profiles).where(eq(profiles.userId, userId)).get();

    if (existing) {
      db.update(profiles).set({ age, sex, heightCm, weightKg, activityLevel, calorieGoal, goalType, neckCm, hipCm, updatedAt: nowISO() }).where(eq(profiles.id, existing.id)).run();
      return res.json(db.select().from(profiles).where(eq(profiles.id, existing.id)).get());
    }

    const result = db.insert(profiles).values({ userId, age, sex, heightCm, weightKg, activityLevel, calorieGoal, goalType, neckCm, hipCm }).returning().all();
    return res.status(201).json(result[0]);
  }

  res.setHeader("Allow", "GET, POST");
  res.status(405).end();
}
