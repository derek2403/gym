export type Sex = "male" | "female";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";
export type GoalType = "aggressive_cut" | "cut" | "maintenance" | "bulk" | "custom";

const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const GOAL_OFFSETS: Record<Exclude<GoalType, "custom">, number> = {
  aggressive_cut: -1000,
  cut: -500,
  maintenance: 0,
  bulk: 300,
};

export function calculateBMR(weightKg: number, heightCm: number, age: number, sex: Sex): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === "male" ? base + 5 : base - 161;
}

export function calculateTDEE(weightKg: number, heightCm: number, age: number, sex: Sex, activity: ActivityLevel): number {
  return Math.round(calculateBMR(weightKg, heightCm, age, sex) * ACTIVITY_FACTORS[activity]);
}

export function calculateGoalCalories(tdee: number, goalType: GoalType, customGoal?: number): number {
  if (goalType === "custom" && customGoal !== undefined) return customGoal;
  return tdee + (GOAL_OFFSETS[goalType as Exclude<GoalType, "custom">] || 0);
}

export function getMacroTargets(calories: number, goalType: GoalType) {
  const splits: Record<GoalType, [number, number, number]> = {
    aggressive_cut: [0.45, 0.25, 0.3],
    cut: [0.4, 0.3, 0.3],
    maintenance: [0.3, 0.4, 0.3],
    bulk: [0.3, 0.45, 0.25],
    custom: [0.3, 0.4, 0.3],
  };
  const [proteinPct, carbsPct, fatPct] = splits[goalType];
  return {
    proteinG: Math.round((calories * proteinPct) / 4),
    carbsG: Math.round((calories * carbsPct) / 4),
    fatG: Math.round((calories * fatPct) / 9),
  };
}

export function estimateBodyFat(
  sex: Sex,
  waistCm: number,
  neckCm: number,
  heightCm: number,
  hipCm?: number
): number | null {
  if (sex === "male") {
    const diff = waistCm - neckCm;
    if (diff <= 0) return null;
    return Math.round((86.01 * Math.log10(diff) - 70.041 * Math.log10(heightCm) + 36.76) * 10) / 10;
  } else {
    if (!hipCm) return null;
    const sum = waistCm + hipCm - neckCm;
    if (sum <= 0) return null;
    return Math.round((163.205 * Math.log10(sum) - 97.684 * Math.log10(heightCm) - 78.387) * 10) / 10;
  }
}
