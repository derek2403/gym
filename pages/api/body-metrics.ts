import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";
import { bodyMetrics, profiles } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { calculateTDEE, calculateGoalCalories, type Sex, type ActivityLevel, type GoalType } from "@/lib/formulas";
import { nowISO } from "@/lib/utils";

function recalculateProfile(newWeight?: number, newHeight?: number) {
  const profile = db.select().from(profiles).get();
  if (!profile) return;

  const weightKg = newWeight ?? profile.weightKg;
  const heightCm = newHeight ?? profile.heightCm;

  if (!weightKg || !heightCm || !profile.age || !profile.sex || !profile.activityLevel || !profile.goalType) return;

  const tdee = calculateTDEE(
    weightKg,
    heightCm,
    profile.age,
    profile.sex as Sex,
    profile.activityLevel as ActivityLevel
  );
  const calorieGoal = calculateGoalCalories(tdee, profile.goalType as GoalType);

  db.update(profiles)
    .set({
      weightKg,
      heightCm,
      calorieGoal,
      updatedAt: nowISO(),
    })
    .where(eq(profiles.id, profile.id))
    .run();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const type = req.query.type as string | undefined;

    if (type) {
      const metrics = db
        .select()
        .from(bodyMetrics)
        .where(eq(bodyMetrics.metricType, type))
        .orderBy(desc(bodyMetrics.date))
        .all();
      return res.json(metrics);
    }

    const all = db.select().from(bodyMetrics).orderBy(desc(bodyMetrics.date)).all();
    return res.json(all);
  }

  if (req.method === "POST") {
    const { metricType, value, date } = req.body;
    if (!metricType || value === undefined || !date) {
      return res.status(400).json({ error: "metricType, value, and date are required" });
    }

    const result = db
      .insert(bodyMetrics)
      .values({ metricType, value: Number(value), date })
      .returning()
      .all();

    // Auto-recalibrate TDEE when weight or height changes
    if (metricType === "weight") {
      recalculateProfile(Number(value), undefined);
    } else if (metricType === "height") {
      recalculateProfile(undefined, Number(value));
    }

    return res.status(201).json(result[0]);
  }

  if (req.method === "DELETE") {
    const id = Number(req.query.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    // Check what's being deleted to potentially recalibrate
    const metric = db.select().from(bodyMetrics).where(eq(bodyMetrics.id, id)).get();
    db.delete(bodyMetrics).where(eq(bodyMetrics.id, id)).run();

    // After deletion, recalibrate with the latest remaining value
    if (metric && (metric.metricType === "weight" || metric.metricType === "height")) {
      const latest = db
        .select()
        .from(bodyMetrics)
        .where(eq(bodyMetrics.metricType, metric.metricType))
        .orderBy(desc(bodyMetrics.date))
        .get();

      if (latest) {
        if (metric.metricType === "weight") recalculateProfile(latest.value, undefined);
        else recalculateProfile(undefined, latest.value);
      }
    }

    return res.status(204).end();
  }

  res.setHeader("Allow", "GET, POST, DELETE");
  res.status(405).end();
}
