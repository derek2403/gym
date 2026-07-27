import { useState, useEffect, useCallback, useRef } from "react";
import NavBar, { NavAction } from "@/components/ui/NavBar";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import CalorieRing from "@/components/calories/CalorieRing";
import MacroBar from "@/components/calories/MacroBar";
import ProfileSetup from "@/components/calories/ProfileSetup";
import { Settings, ChevronLeft, ChevronRight, Loader2, Sparkles, Camera, PenLine } from "lucide-react";
import SwipeRow from "@/components/ui/SwipeRow";
import { todayStr, formatDateDisplay, formatDate, formatDateShort } from "@/lib/utils";
import { calculateTDEE, calculateGoalCalories, getMacroTargets, type Sex, type ActivityLevel, type GoalType } from "@/lib/formulas";

interface Profile {
  age: number;
  sex: string;
  heightCm: number;
  weightKg: number;
  activityLevel: string;
  calorieGoal: number;
  goalType: string;
}

interface FoodEntry {
  id: number;
  date: string;
  mealType: string;
  description: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

interface WeeklyData {
  byDate: Record<string, { calories: number; proteinG: number; carbsG: number; fatG: number }>;
  totals: { calories: number; proteinG: number; carbsG: number; fatG: number };
  entryCount: number;
}

type InputMode = "ai" | "camera" | "manual";
type ViewMode = "daily" | "weekly";

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
const MEAL_LABELS: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snacks",
};

function addDays(dateStr: string, days: number): string {
  const parts = dateStr.split("-").map(Number);
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  d.setDate(d.getDate() + days);
  return formatDate(d);
}

function getWeekRange(dateStr: string): { start: string; end: string } {
  const parts = dateStr.split("-").map(Number);
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  const day = d.getDay(); // Sun=0
  const sunday = new Date(d);
  sunday.setDate(d.getDate() - day); // back to Sunday
  const saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6);
  return { start: formatDate(sunday), end: formatDate(saturday) };
}

export default function CaloriesPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [date, setDate] = useState(todayStr());
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [foodInput, setFoodInput] = useState("");
  const [selectedMeal, setSelectedMeal] = useState<string>("lunch");
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [inputMode, setInputMode] = useState<InputMode>("ai");
  const [viewMode, setViewMode] = useState<ViewMode>("daily");
  const [weeklyData, setWeeklyData] = useState<WeeklyData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual entry fields
  const [manualDesc, setManualDesc] = useState("");
  const [manualCal, setManualCal] = useState("");
  const [manualProtein, setManualProtein] = useState("");
  const [manualCarbs, setManualCarbs] = useState("");
  const [manualFat, setManualFat] = useState("");

  const fetchProfile = useCallback(async () => {
    const res = await fetch("/api/profile");
    const data = await res.json();
    setProfile(data);
    setProfileLoaded(true);
    if (!data) setShowSetup(true);
  }, []);

  const fetchEntries = useCallback(async () => {
    const res = await fetch(`/api/food?date=${date}`);
    setEntries(await res.json());
  }, [date]);

  const weekRange = getWeekRange(date);

  const fetchWeekly = useCallback(async () => {
    const { start, end } = getWeekRange(date);
    const res = await fetch(`/api/food/weekly?start=${start}&end=${end}`);
    setWeeklyData(await res.json());
  }, [date]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (viewMode === "daily") fetchEntries();
    else fetchWeekly();
  }, [viewMode, fetchEntries, fetchWeekly]);

  const saveProfile = async (data: {
    age: number;
    sex: string;
    heightCm: number;
    weightKg: number;
    activityLevel: string;
    goalType: string;
  }) => {
    const tdee = calculateTDEE(
      data.weightKg,
      data.heightCm,
      data.age,
      data.sex as Sex,
      data.activityLevel as ActivityLevel
    );
    const calorieGoal = calculateGoalCalories(tdee, data.goalType as GoalType);

    await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, calorieGoal }),
    });
    setShowSetup(false);
    fetchProfile();
  };

  const analyzeAndAdd = async () => {
    if (!foodInput.trim()) return;
    setAnalyzing(true);
    setError("");

    try {
      const res = await fetch("/api/food/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: foodInput }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Analysis failed");
      }

      const analysis = await res.json();

      await fetch("/api/food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          mealType: selectedMeal,
          description: analysis.description,
          calories: analysis.calories,
          proteinG: analysis.protein_g,
          carbsG: analysis.carbs_g,
          fatG: analysis.fat_g,
        }),
      });

      setFoodInput("");
      fetchEntries();
      fetchWeekly();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleImageCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAnalyzing(true);
    setError("");

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch("/api/food/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Analysis failed");
      }

      const analysis = await res.json();

      await fetch("/api/food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          mealType: selectedMeal,
          description: analysis.description,
          calories: analysis.calories,
          proteinG: analysis.protein_g,
          carbsG: analysis.carbs_g,
          fatG: analysis.fat_g,
        }),
      });

      fetchEntries();
      fetchWeekly();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAnalyzing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleManualAdd = async () => {
    if (!manualDesc.trim() || !manualCal) return;

    await fetch("/api/food", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        mealType: selectedMeal,
        description: manualDesc.trim(),
        calories: Number(manualCal),
        proteinG: Number(manualProtein) || 0,
        carbsG: Number(manualCarbs) || 0,
        fatG: Number(manualFat) || 0,
      }),
    });

    setManualDesc("");
    setManualCal("");
    setManualProtein("");
    setManualCarbs("");
    setManualFat("");
    fetchEntries();
    fetchWeekly();
  };

  const deleteEntry = async (id: number) => {
    await fetch(`/api/food?id=${id}`, { method: "DELETE" });
    fetchEntries();
    fetchWeekly();
  };

  const navigateDate = (offset: number) => {
    if (viewMode === "weekly") {
      setDate(addDays(date, offset * 7));
    } else {
      setDate(addDays(date, offset));
    }
  };

  // Daily totals
  const totals = entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      protein: acc.protein + e.proteinG,
      carbs: acc.carbs + e.carbsG,
      fat: acc.fat + e.fatG,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const calorieTarget = profile?.calorieGoal || 2000;
  const weeklyCalorieTarget = calorieTarget * 7;
  const macroTargets = profile
    ? getMacroTargets(calorieTarget, (profile.goalType || "maintenance") as GoalType)
    : { proteinG: 150, carbsG: 200, fatG: 67 };

  if (!profileLoaded) {
    return <div className="flex h-64 items-center justify-center text-[color:var(--ink-quaternary)]">Loading...</div>;
  }

  if (showSetup) {
    return (
      <div>
        <NavBar title="Calories" subtitle="Set up your profile to get started." />
        <ProfileSetup
          initial={profile ? { ...profile, sex: profile.sex || "male" } : undefined}
          onSave={saveProfile}
          onCancel={profile ? () => setShowSetup(false) : undefined}
        />
      </div>
    );
  }

  return (
    <div>
      <NavBar
        title="Calories"
        subtitle="Estimates run high on purpose — log a quantity for the tightest numbers."
        trailing={
          <NavAction onClick={() => setShowSetup(true)} label="Calorie settings" prominent>
            <Settings size={18} />
          </NavAction>
        }
      />

      {/* View mode toggle */}
      <div className="mb-4 mt-5 flex gap-1 rounded-2xl bg-[rgba(120,120,128,0.09)] p-0.5">
        {(["daily", "weekly"] as ViewMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`flex-1 rounded-xl py-1.5 text-[13px] font-medium capitalize transition-colors ${
              viewMode === mode ? "bg-[rgba(120,120,128,0.13)] text-[color:var(--ink)]" : "text-[color:var(--ink-quaternary)] hover:text-[color:var(--ink-secondary)]"
            }`}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* Date navigation */}
      <div className="mb-4 flex items-center justify-between">
        <button onClick={() => navigateDate(-1)} className="rounded-2xl p-2 text-[color:var(--ink-quaternary)] hover:bg-[rgba(120,120,128,0.09)] hover:text-[color:var(--ink-secondary)]">
          <ChevronLeft size={18} />
        </button>
        <span className="text-[15px] font-medium text-[color:var(--ink-secondary)]">
          {viewMode === "daily"
            ? date === todayStr() ? "Today" : formatDateDisplay(date)
            : `${formatDateShort(weekRange.start)} - ${formatDateShort(weekRange.end)}`
          }
        </span>
        <button onClick={() => navigateDate(1)} className="rounded-2xl p-2 text-[color:var(--ink-quaternary)] hover:bg-[rgba(120,120,128,0.09)] hover:text-[color:var(--ink-secondary)]">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* ===== WEEKLY VIEW ===== */}
      {viewMode === "weekly" && weeklyData && (
        <>
          <Card className="mb-4">
            <div className="relative flex justify-center py-2">
              <CalorieRing consumed={Math.round(weeklyData.totals.calories)} target={weeklyCalorieTarget} />
            </div>
            <div className="mt-4 space-y-3">
              <MacroBar label="Protein" current={weeklyData.totals.proteinG} target={macroTargets.proteinG * 7} color="#10b981" />
              <MacroBar label="Carbs" current={weeklyData.totals.carbsG} target={macroTargets.carbsG * 7} color="#3b82f6" />
              <MacroBar label="Fat" current={weeklyData.totals.fatG} target={macroTargets.fatG * 7} color="#f59e0b" />
            </div>
          </Card>

          {/* Weekly deficit/surplus */}
          <Card className="mb-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-[color:var(--ink)]">Weekly summary</h3>
              <span className="tabular-nums text-[13px] text-[color:var(--ink-quaternary)]">
                {weeklyData.entryCount} entries
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-[rgba(120,120,128,0.09)]/50 p-3 text-center">
                <p className="tabular-nums text-lg font-bold text-[color:var(--ink)]">
                  {Math.round(weeklyData.totals.calories / 7)}
                </p>
                <p className="text-[10px] text-[color:var(--ink-quaternary)]">avg kcal/day</p>
              </div>
              <div className="rounded-xl bg-[rgba(120,120,128,0.09)]/50 p-3 text-center">
                {(() => {
                  const diff = weeklyData.totals.calories - weeklyCalorieTarget;
                  const over = diff > 0;
                  return (
                    <>
                      <p className={`tabular-nums text-lg font-bold ${over ? "text-red-400" : "text-emerald-500"}`}>
                        {over ? "+" : ""}{Math.round(diff)}
                      </p>
                      <p className="text-[10px] text-[color:var(--ink-quaternary)]">
                        {over ? "surplus" : "deficit"} kcal
                      </p>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Daily breakdown */}
            <div className="mt-3 space-y-1.5">
              {Array.from({ length: 7 }).map((_, i) => {
                const dayDate = addDays(weekRange.start, i);
                const dayData = weeklyData.byDate[dayDate];
                const cals = dayData ? Math.round(dayData.calories) : 0;
                const pct = calorieTarget > 0 ? Math.min((cals / calorieTarget) * 100, 100) : 0;
                const dayLabel = new Date(dayDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" });
                const isToday = dayDate === todayStr();

                return (
                  <div key={dayDate} className={`flex items-center gap-2 rounded-2xl px-2 py-1.5 ${isToday ? "bg-[rgba(120,120,128,0.09)]/50" : ""}`}>
                    <span className={`w-8 text-[10px] font-medium ${isToday ? "text-emerald-500" : "text-[color:var(--ink-quaternary)]"}`}>
                      {dayLabel}
                    </span>
                    <div className="flex-1">
                      <div className="h-1.5 overflow-hidden rounded-full bg-[rgba(120,120,128,0.09)]">
                        <div
                          className={`h-full rounded-full transition-all ${cals > calorieTarget ? "bg-red-400" : "bg-emerald-500"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <span className="w-14 text-right tabular-nums text-[10px] text-[color:var(--ink-tertiary)]">
                      {cals} kcal
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        </>
      )}

      {/* ===== DAILY VIEW ===== */}
      {viewMode === "daily" && (
        <>
          {/* Calorie ring + macros */}
          <Card className="mb-4">
            <div className="relative flex justify-center py-2">
              <CalorieRing consumed={Math.round(totals.calories)} target={calorieTarget} />
            </div>
            <div className="mt-4 space-y-3">
              <MacroBar label="Protein" current={totals.protein} target={macroTargets.proteinG} color="#10b981" />
              <MacroBar label="Carbs" current={totals.carbs} target={macroTargets.carbsG} color="#3b82f6" />
              <MacroBar label="Fat" current={totals.fat} target={macroTargets.fatG} color="#f59e0b" />
            </div>
          </Card>

          {/* Food input */}
          <Card className="mb-4">
            <div className="mb-3 flex gap-2">
              {MEAL_TYPES.map((meal) => (
                <button
                  key={meal}
                  onClick={() => setSelectedMeal(meal)}
                  aria-pressed={selectedMeal === meal}
                  className={`pressable rounded-full px-3.5 py-1.5 text-[0.8125rem] font-medium transition-colors duration-[var(--response-fast)] ${
                    selectedMeal === meal
                      ? "bg-emerald-500 text-white"
                      : "bg-[rgba(120,120,128,0.09)] text-[color:var(--ink-tertiary)]"
                  }`}
                >
                  {MEAL_LABELS[meal]}
                </button>
              ))}
            </div>

            <div className="mb-3 flex gap-1 rounded-2xl bg-[rgba(120,120,128,0.09)] p-0.5">
              {([
                { mode: "ai" as InputMode, label: "Type", icon: Sparkles },
                { mode: "camera" as InputMode, label: "Scan", icon: Camera },
                { mode: "manual" as InputMode, label: "Manual", icon: PenLine },
              ]).map(({ mode, label, icon: Icon }) => (
                <button
                  key={mode}
                  onClick={() => setInputMode(mode)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-1.5 text-[13px] font-medium transition-colors ${
                    inputMode === mode
                      ? "bg-[rgba(120,120,128,0.13)] text-[color:var(--ink)]"
                      : "text-[color:var(--ink-quaternary)] hover:text-[color:var(--ink-secondary)]"
                  }`}
                >
                  <Icon size={13} />
                  {label}
                </button>
              ))}
            </div>

            {inputMode === "ai" && (
              <div>
                <div className="flex gap-2">
                  <input
                    className="flex-1 rounded-xl border border-black/[0.06] bg-[rgba(120,120,128,0.09)] px-3.5 py-2.5 text-[15px] text-[color:var(--ink)] placeholder:text-[color:var(--ink-quaternary)] outline-none focus:ring-1 focus:ring-black/[0.08]"
                    placeholder="e.g., chicken breast 200g with rice"
                    value={foodInput}
                    onChange={(e) => setFoodInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !analyzing && analyzeAndAdd()}
                    disabled={analyzing}
                  />
                  <Button onClick={analyzeAndAdd} disabled={analyzing || !foodInput.trim()} size="md">
                    {analyzing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  </Button>
                </div>
                <p className="mt-1.5 text-[10px] text-[color:var(--ink-quaternary)]">AI estimates on the higher end for safety</p>
              </div>
            )}

            {inputMode === "camera" && (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageCapture}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={analyzing}
                  className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-black/[0.06] py-6 text-[color:var(--ink-quaternary)] transition-colors hover:border-zinc-500 hover:text-[color:var(--ink-secondary)]"
                >
                  {analyzing ? (
                    <>
                      <Loader2 size={24} className="animate-spin text-emerald-500" />
                      <span className="text-[15px]">Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Camera size={24} />
                      <span className="text-[15px]">Take photo or choose from gallery</span>
                    </>
                  )}
                </button>
                <p className="mt-1.5 text-[10px] text-[color:var(--ink-quaternary)]">AI will estimate calories from the photo</p>
              </div>
            )}

            {inputMode === "manual" && (
              <div className="space-y-3">
                <Input
                  placeholder="Food description"
                  value={manualDesc}
                  onChange={(e) => setManualDesc(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input label="Calories" type="number" placeholder="kcal" value={manualCal} onChange={(e) => setManualCal(e.target.value)} />
                  <Input label="Protein (g)" type="number" placeholder="0" value={manualProtein} onChange={(e) => setManualProtein(e.target.value)} />
                  <Input label="Carbs (g)" type="number" placeholder="0" value={manualCarbs} onChange={(e) => setManualCarbs(e.target.value)} />
                  <Input label="Fat (g)" type="number" placeholder="0" value={manualFat} onChange={(e) => setManualFat(e.target.value)} />
                </div>
                <Button onClick={handleManualAdd} disabled={!manualDesc.trim() || !manualCal} size="sm">
                  Add entry
                </Button>
              </div>
            )}

            {error && <p className="mt-2 text-[13px] text-red-400">{error}</p>}
          </Card>

          {/* Meal sections */}
          {MEAL_TYPES.map((meal) => {
            const mealEntries = entries.filter((e) => e.mealType === meal);
            if (mealEntries.length === 0) return null;

            const mealCals = mealEntries.reduce((sum, e) => sum + e.calories, 0);

            return (
              <Card key={meal} className="mb-3">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-[15px] font-semibold text-[color:var(--ink)]">{MEAL_LABELS[meal]}</h3>
                  <span className="tabular-nums text-[13px] text-[color:var(--ink-quaternary)]">{Math.round(mealCals)} kcal</span>
                </div>
                <div className="space-y-1.5">
                  {mealEntries.map((entry) => (
                    <SwipeRow key={entry.id} label={entry.description} onDelete={() => deleteEntry(entry.id)}>
                      <div className="flex items-center justify-between rounded-[0.875rem] bg-[rgba(120,120,128,0.08)] px-3.5 py-2.5">
                        <div className="min-w-0 flex-1">
                          <p className="text-[0.9375rem] text-[color:var(--ink)]">{entry.description}</p>
                          <p className="mt-0.5 tabular-nums text-[0.6875rem] text-[color:var(--ink-quaternary)]">
                            {Math.round(entry.calories)} kcal · {entry.proteinG}p · {entry.carbsG}c · {entry.fatG}f
                          </p>
                        </div>
                      </div>
                    </SwipeRow>
                  ))}
                </div>
              </Card>
            );
          })}

          {entries.length === 0 && (
            <Card>
              <p className="text-center text-[15px] text-[color:var(--ink-quaternary)]">
                No food logged for this day. Type what you ate above.
              </p>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
