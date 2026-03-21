import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";
import { workouts, workoutSets } from "@/lib/schema";
import { eq, isNotNull, and } from "drizzle-orm";
import { getWeekDates, getDaysAgo, formatDate, nowLocal } from "@/lib/utils";
import { requireAuth } from "@/lib/auth";

function toLocalDate(timestamp: string): string {
  if (!timestamp.includes("T")) return timestamp;
  const d = new Date(timestamp);
  d.setHours(d.getHours() + 8);
  return formatDate(d);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const { start: weekStart, end: weekEnd } = getWeekDates();
  const allWorkouts = db.select().from(workouts).where(and(eq(workouts.userId, userId), isNotNull(workouts.completedAt))).all();
  const userWorkoutIds = new Set(allWorkouts.map((w) => w.id));
  const allSets = db.select().from(workoutSets).where(isNotNull(workoutSets.completedAt)).all().filter((s) => userWorkoutIds.has(s.workoutId));

  const weekSessions = allWorkouts.filter((w) => w.completedAt && toLocalDate(w.completedAt) >= weekStart && toLocalDate(w.completedAt) <= weekEnd).length;
  const weekWorkoutIds = new Set(allWorkouts.filter((w) => w.completedAt && toLocalDate(w.completedAt) >= weekStart && toLocalDate(w.completedAt) <= weekEnd).map((w) => w.id));
  const weekSets = allSets.filter((s) => weekWorkoutIds.has(s.workoutId));

  const topLift = allSets.reduce((max, s) => Math.max(max, s.weightKg), 0);
  const topLiftWeek = weekSets.reduce((max, s) => Math.max(max, s.weightKg), 0);
  const topLiftSet = allSets.reduce((best, s) => (s.weightKg > (best?.weightKg || 0) ? s : best), null as typeof allSets[0] | null);
  const totalVolume = allSets.reduce((sum, s) => sum + s.weightKg * s.reps, 0);

  const workoutDates = [...new Set(allWorkouts.filter((w) => w.completedAt).map((w) => toLocalDate(w.completedAt!)))].sort();
  const dateSet = new Set(workoutDates);

  let currentStreak = 0;
  for (let i = 0; i < 365; i++) { if (dateSet.has(getDaysAgo(i))) currentStreak++; else if (i > 0) break; }

  let bestStreak = workoutDates.length > 0 ? 1 : 0;
  let tempStreak = 1;
  for (let i = 1; i < workoutDates.length; i++) {
    const diff = (new Date(workoutDates[i] + "T00:00:00").getTime() - new Date(workoutDates[i - 1] + "T00:00:00").getTime()) / 86400000;
    if (diff === 1) { tempStreak++; bestStreak = Math.max(bestStreak, tempStreak); } else tempStreak = 1;
  }

  const todayDate = nowLocal();
  const firstWorkoutDate = workoutDates.length > 0 ? new Date(workoutDates[0] + "T00:00:00") : todayDate;
  const startDate = new Date(firstWorkoutDate);
  startDate.setDate(startDate.getDate() - startDate.getDay());

  const calendarDays: { date: string; hasWorkout: boolean; dayOfWeek: number }[] = [];
  const totalDays = Math.floor((todayDate.getTime() - startDate.getTime()) / 86400000) + 1;
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(startDate); d.setDate(startDate.getDate() + i);
    const dateStr = formatDate(d);
    calendarDays.push({ date: dateStr, hasWorkout: dateSet.has(dateStr), dayOfWeek: d.getDay() });
  }

  res.json({
    weekSessions, weekCompletedSets: weekSets.length, topLift, topLiftWeek,
    topLiftExercise: topLiftSet?.exerciseName || null,
    totalSessions: allWorkouts.length, totalCompletedSets: allSets.length,
    totalVolume: Math.round(totalVolume), currentStreak, bestStreak, calendarDays,
  });
}
