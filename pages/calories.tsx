import { useState, useEffect, useCallback, useRef } from "react";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import CalorieRing from "@/components/calories/CalorieRing";
import MacroBar from "@/components/calories/MacroBar";
import ProfileSetup from "@/components/calories/ProfileSetup";
import { Settings, ChevronLeft, ChevronRight, Trash2, Loader2, Sparkles, Camera, PenLine } from "lucide-react";
import { todayStr, formatDateDisplay } from "@/lib/utils";
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

type InputMode = "ai" | "camera" | "manual";

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
const MEAL_LABELS: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snacks",
};

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

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

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
  };

  const deleteEntry = async (id: number) => {
    await fetch(`/api/food?id=${id}`, { method: "DELETE" });
    fetchEntries();
  };

  const navigateDate = (offset: number) => {
    const d = new Date(date + "T00:00:00");
    d.setDate(d.getDate() + offset);
    setDate(d.toISOString().split("T")[0]);
  };

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
  const macroTargets = profile
    ? getMacroTargets(calorieTarget, (profile.goalType || "maintenance") as GoalType)
    : { proteinG: 150, carbsG: 200, fatG: 67 };

  if (!profileLoaded) {
    return <div className="flex h-64 items-center justify-center text-zinc-500">Loading...</div>;
  }

  if (showSetup) {
    return (
      <div>
        <PageHeader title="Calories" subtitle="Set up your profile to get started." />
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
      <PageHeader
        title="Calories"
        subtitle="AI-powered nutrition tracking."
        action={
          <button
            onClick={() => setShowSetup(true)}
            className="rounded-xl p-2 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
          >
            <Settings size={18} />
          </button>
        }
      />

      {/* Date navigation */}
      <div className="mb-4 flex items-center justify-between">
        <button onClick={() => navigateDate(-1)} className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300">
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-medium text-zinc-300">
          {date === todayStr() ? "Today" : formatDateDisplay(date)}
        </span>
        <button onClick={() => navigateDate(1)} className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300">
          <ChevronRight size={18} />
        </button>
      </div>

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
        {/* Meal type selector */}
        <div className="mb-3 flex gap-2">
          {MEAL_TYPES.map((meal) => (
            <button
              key={meal}
              onClick={() => setSelectedMeal(meal)}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                selectedMeal === meal
                  ? "bg-emerald-500 text-zinc-950"
                  : "bg-zinc-800 text-zinc-400"
              }`}
            >
              {MEAL_LABELS[meal]}
            </button>
          ))}
        </div>

        {/* Input mode tabs */}
        <div className="mb-3 flex gap-1 rounded-lg bg-zinc-800 p-0.5">
          {([
            { mode: "ai" as InputMode, label: "Type", icon: Sparkles },
            { mode: "camera" as InputMode, label: "Scan", icon: Camera },
            { mode: "manual" as InputMode, label: "Manual", icon: PenLine },
          ]).map(({ mode, label, icon: Icon }) => (
            <button
              key={mode}
              onClick={() => setInputMode(mode)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors ${
                inputMode === mode
                  ? "bg-zinc-700 text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>

        {/* AI text input */}
        {inputMode === "ai" && (
          <div>
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800 px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-emerald-500"
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
            <p className="mt-1.5 text-[10px] text-zinc-600">AI estimates on the higher end for safety</p>
          </div>
        )}

        {/* Camera / photo input */}
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
              className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700 py-6 text-zinc-500 transition-colors hover:border-zinc-500 hover:text-zinc-300"
            >
              {analyzing ? (
                <>
                  <Loader2 size={24} className="animate-spin text-emerald-500" />
                  <span className="text-sm">Analyzing...</span>
                </>
              ) : (
                <>
                  <Camera size={24} />
                  <span className="text-sm">Take photo or choose from gallery</span>
                </>
              )}
            </button>
            <p className="mt-1.5 text-[10px] text-zinc-600">AI will estimate calories from the photo</p>
          </div>
        )}

        {/* Manual input */}
        {inputMode === "manual" && (
          <div className="space-y-3">
            <Input
              placeholder="Food description"
              value={manualDesc}
              onChange={(e) => setManualDesc(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Calories"
                type="number"
                placeholder="kcal"
                value={manualCal}
                onChange={(e) => setManualCal(e.target.value)}
              />
              <Input
                label="Protein (g)"
                type="number"
                placeholder="0"
                value={manualProtein}
                onChange={(e) => setManualProtein(e.target.value)}
              />
              <Input
                label="Carbs (g)"
                type="number"
                placeholder="0"
                value={manualCarbs}
                onChange={(e) => setManualCarbs(e.target.value)}
              />
              <Input
                label="Fat (g)"
                type="number"
                placeholder="0"
                value={manualFat}
                onChange={(e) => setManualFat(e.target.value)}
              />
            </div>
            <Button onClick={handleManualAdd} disabled={!manualDesc.trim() || !manualCal} size="sm">
              Add entry
            </Button>
          </div>
        )}

        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      </Card>

      {/* Meal sections */}
      {MEAL_TYPES.map((meal) => {
        const mealEntries = entries.filter((e) => e.mealType === meal);
        if (mealEntries.length === 0) return null;

        const mealCals = mealEntries.reduce((sum, e) => sum + e.calories, 0);

        return (
          <Card key={meal} className="mb-3">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-200">{MEAL_LABELS[meal]}</h3>
              <span className="font-mono text-xs text-zinc-500">{Math.round(mealCals)} kcal</span>
            </div>
            <div className="space-y-1.5">
              {mealEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between rounded-lg bg-zinc-800/50 px-3 py-2"
                >
                  <div className="flex-1">
                    <p className="text-sm text-zinc-200">{entry.description}</p>
                    <p className="font-mono text-[10px] text-zinc-500">
                      {Math.round(entry.calories)} kcal · {entry.proteinG}p · {entry.carbsG}c · {entry.fatG}f
                    </p>
                  </div>
                  <button
                    onClick={() => deleteEntry(entry.id)}
                    className="ml-2 p-1 text-zinc-600 transition-colors hover:text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        );
      })}

      {entries.length === 0 && (
        <Card>
          <p className="text-center text-sm text-zinc-500">
            No food logged for this day. Type what you ate above.
          </p>
        </Card>
      )}
    </div>
  );
}
