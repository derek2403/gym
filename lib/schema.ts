import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// ===== AUTH =====

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: text("created_at").notNull().default("(datetime('now'))"),
});

// ===== APP TABLES (all have userId) =====

export const profiles = sqliteTable("profiles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  age: integer("age"),
  sex: text("sex"),
  heightCm: real("height_cm"),
  weightKg: real("weight_kg"),
  activityLevel: text("activity_level"),
  calorieGoal: integer("calorie_goal"),
  goalType: text("goal_type"),
  neckCm: real("neck_cm"),
  hipCm: real("hip_cm"),
  createdAt: text("created_at").notNull().default("(datetime('now'))"),
  updatedAt: text("updated_at").notNull().default("(datetime('now'))"),
});

export const exerciseTemplates = sqliteTable("exercise_templates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: text("created_at").notNull().default("(datetime('now'))"),
});

export const templateExercises = sqliteTable("template_exercises", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  templateId: integer("template_id")
    .notNull()
    .references(() => exerciseTemplates.id, { onDelete: "cascade" }),
  exerciseName: text("exercise_name").notNull(),
  targetSets: integer("target_sets").notNull().default(3),
  targetReps: integer("target_reps").notNull().default(10),
  restSeconds: integer("rest_seconds").notNull().default(90),
  intervalSeconds: integer("interval_seconds").notNull().default(120),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const workouts = sqliteTable("workouts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  templateId: integer("template_id").references(() => exerciseTemplates.id),
  startedAt: text("started_at").notNull().default("(datetime('now'))"),
  completedAt: text("completed_at"),
});

export const workoutSets = sqliteTable("workout_sets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  workoutId: integer("workout_id")
    .notNull()
    .references(() => workouts.id, { onDelete: "cascade" }),
  exerciseName: text("exercise_name").notNull(),
  setNumber: integer("set_number").notNull(),
  weightKg: real("weight_kg").notNull().default(0),
  reps: integer("reps").notNull().default(0),
  completedAt: text("completed_at"),
});

export const foodEntries = sqliteTable("food_entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  mealType: text("meal_type").notNull(),
  description: text("description").notNull(),
  calories: real("calories").notNull().default(0),
  proteinG: real("protein_g").notNull().default(0),
  carbsG: real("carbs_g").notNull().default(0),
  fatG: real("fat_g").notNull().default(0),
  createdAt: text("created_at").notNull().default("(datetime('now'))"),
});

export const bodyMetrics = sqliteTable("body_metrics", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  metricType: text("metric_type").notNull(),
  value: real("value").notNull(),
  date: text("date").notNull(),
  createdAt: text("created_at").notNull().default("(datetime('now'))"),
});
