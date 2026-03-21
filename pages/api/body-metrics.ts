import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";
import { bodyMetrics, profiles } from "@/lib/schema";
import { eq, desc, and } from "drizzle-orm";
import { calculateTDEE, calculateGoalCalories, type Sex, type ActivityLevel, type GoalType } from "@/lib/formulas";
import { nowISO } from "@/lib/utils";
import { requireAuth } from "@/lib/auth";

function recalculateProfile(userId: number, newWeight?: number, newHeight?: number) {
  const profile = db.select().from(profiles).where(eq(profiles.userId, userId)).get();
  if (!profile) return;
  const weightKg = newWeight ?? profile.weightKg;
  const heightCm = newHeight ?? profile.heightCm;
  if (!weightKg || !heightCm || !profile.age || !profile.sex || !profile.activityLevel || !profile.goalType) return;
  const tdee = calculateTDEE(weightKg, heightCm, profile.age, profile.sex as Sex, profile.activityLevel as ActivityLevel);
  const calorieGoal = calculateGoalCalories(tdee, profile.goalType as GoalType);
  db.update(profiles).set({ weightKg, heightCm, calorieGoal, updatedAt: nowISO() }).where(eq(profiles.id, profile.id)).run();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = requireAuth(req, res);
  if (!userId) return;

  if (req.method === "GET") {
    const type = req.query.type as string | undefined;
    if (type) return res.json(db.select().from(bodyMetrics).where(and(eq(bodyMetrics.userId, userId), eq(bodyMetrics.metricType, type))).orderBy(desc(bodyMetrics.date)).all());
    return res.json(db.select().from(bodyMetrics).where(eq(bodyMetrics.userId, userId)).orderBy(desc(bodyMetrics.date)).all());
  }

  if (req.method === "POST") {
    const { metricType, value, date } = req.body;
    if (!metricType || value === undefined || !date) return res.status(400).json({ error: "metricType, value, and date are required" });
    const result = db.insert(bodyMetrics).values({ userId, metricType, value: Number(value), date }).returning().all();
    if (metricType === "weight") recalculateProfile(userId, Number(value), undefined);
    else if (metricType === "height") recalculateProfile(userId, undefined, Number(value));
    return res.status(201).json(result[0]);
  }

  if (req.method === "DELETE") {
    const id = Number(req.query.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
    const metric = db.select().from(bodyMetrics).where(and(eq(bodyMetrics.id, id), eq(bodyMetrics.userId, userId))).get();
    db.delete(bodyMetrics).where(and(eq(bodyMetrics.id, id), eq(bodyMetrics.userId, userId))).run();
    if (metric && (metric.metricType === "weight" || metric.metricType === "height")) {
      const latest = db.select().from(bodyMetrics).where(and(eq(bodyMetrics.userId, userId), eq(bodyMetrics.metricType, metric.metricType))).orderBy(desc(bodyMetrics.date)).get();
      if (latest) { if (metric.metricType === "weight") recalculateProfile(userId, latest.value, undefined); else recalculateProfile(userId, undefined, latest.value); }
    }
    return res.status(204).end();
  }

  res.setHeader("Allow", "GET, POST, DELETE");
  res.status(405).end();
}
