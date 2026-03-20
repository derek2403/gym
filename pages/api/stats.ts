import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";
import { workouts, workoutSets } from "@/lib/schema";
import { eq, isNotNull, sql, gte, and } from "drizzle-orm";
import { getWeekDates, getDaysAgo, formatDate } from "@/lib/utils";

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  const { start: weekStart, end: weekEnd } = getWeekDates();

  const allWorkouts = db
    .select()
    .from(workouts)
    .where(isNotNull(workouts.completedAt))
    .all();

  const allSets = db.select().from(workoutSets).where(isNotNull(workoutSets.completedAt)).all();

  // Week sessions
  const weekSessions = allWorkouts.filter(
    (w) => w.completedAt && w.completedAt >= weekStart && w.completedAt <= weekEnd + "T23:59:59"
  ).length;

  // Week sets
  const weekWorkoutIds = new Set(
    allWorkouts
      .filter((w) => w.completedAt && w.completedAt >= weekStart && w.completedAt <= weekEnd + "T23:59:59")
      .map((w) => w.id)
  );
  const weekSets = allSets.filter((s) => weekWorkoutIds.has(s.workoutId));
  const weekCompletedSets = weekSets.length;

  // Top lift (all time)
  const topLift = allSets.reduce((max, s) => Math.max(max, s.weightKg), 0);

  // Top lift this week
  const topLiftWeek = weekSets.reduce((max, s) => Math.max(max, s.weightKg), 0);

  // Top lift exercise name
  const topLiftSet = allSets.reduce(
    (best, s) => (s.weightKg > (best?.weightKg || 0) ? s : best),
    null as typeof allSets[0] | null
  );

  // Total volume
  const totalVolume = allSets.reduce((sum, s) => sum + s.weightKg * s.reps, 0);

  // Streaks
  const workoutDates = [...new Set(
    allWorkouts
      .filter((w) => w.completedAt)
      .map((w) => w.completedAt!.split("T")[0])
  )].sort();

  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;

  // Calculate streaks by day
  const today = formatDate(new Date());
  for (let i = workoutDates.length - 1; i >= 0; i--) {
    const d = new Date(workoutDates[i] + "T00:00:00");
    const expected = new Date();
    expected.setDate(expected.getDate() - (workoutDates.length - 1 - i));
  }

  // Simple streak: consecutive days from today backwards
  const dateSet = new Set(workoutDates);
  for (let i = 0; i < 365; i++) {
    const d = getDaysAgo(i);
    if (dateSet.has(d)) {
      currentStreak++;
    } else if (i > 0) {
      break;
    }
  }

  // Best streak
  tempStreak = 1;
  bestStreak = workoutDates.length > 0 ? 1 : 0;
  for (let i = 1; i < workoutDates.length; i++) {
    const prev = new Date(workoutDates[i - 1] + "T00:00:00");
    const curr = new Date(workoutDates[i] + "T00:00:00");
    const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays === 1) {
      tempStreak++;
      bestStreak = Math.max(bestStreak, tempStreak);
    } else {
      tempStreak = 1;
    }
  }

  // 17-week calendar data
  const calendarDays: { date: string; hasWorkout: boolean }[] = [];
  for (let i = 17 * 7 - 1; i >= 0; i--) {
    const d = getDaysAgo(i);
    calendarDays.push({ date: d, hasWorkout: dateSet.has(d) });
  }

  res.json({
    weekSessions,
    weekCompletedSets,
    topLift,
    topLiftWeek,
    topLiftExercise: topLiftSet?.exerciseName || null,
    totalSessions: allWorkouts.length,
    totalCompletedSets: allSets.length,
    totalVolume: Math.round(totalVolume),
    currentStreak,
    bestStreak,
    calendarDays,
  });
}
