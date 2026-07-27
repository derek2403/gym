import { useState, useEffect, type MutableRefObject } from "react";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

interface ProfileData {
  age: number; sex: string; heightCm: number; weightKg: number; activityLevel: string; goalType: string;
}

interface ProfileSetupProps {
  initial?: Partial<ProfileData>;
  onSave: (data: ProfileData) => void;
  /** Receives the submit handler so the sheet's Save button can drive it while
   *  validation stays here with the fields it validates. */
  submitRef?: MutableRefObject<(() => void) | null>;
}

export default function ProfileSetup({ initial, onSave, submitRef }: ProfileSetupProps) {
  const [age, setAge] = useState(initial?.age?.toString() || "");
  const [sex, setSex] = useState(initial?.sex || "male");
  const [height, setHeight] = useState(initial?.heightCm?.toString() || "");
  const [weight, setWeight] = useState(initial?.weightKg?.toString() || "");
  const [activity, setActivity] = useState(initial?.activityLevel || "moderate");
  const [goal, setGoal] = useState(initial?.goalType || "cut");
  // Only surface "required" hints once the user has tried to submit.
  const [attempted, setAttempted] = useState(false);

  const missing = !age || !height || !weight;

  const handleSubmit = () => {
    setAttempted(true);
    if (missing) return;
    onSave({ age: Number(age), sex, heightCm: Number(height), weightKg: Number(weight), activityLevel: activity, goalType: goal });
  };

  // Keep the exposed handler pointing at the current state, not the first render.
  useEffect(() => {
    if (!submitRef) return;
    submitRef.current = handleSubmit;
    return () => {
      submitRef.current = null;
    };
  });

  return (
    <div className="space-y-5">
      <p className="text-caption">
        These numbers set your daily calorie target. It recalculates automatically when your logged weight changes.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Age" type="number" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} placeholder="25" invalid={attempted && !age} aria-describedby={attempted && missing ? "profile-errors" : undefined} />
        <Select label="Sex" value={sex} onChange={(e) => setSex(e.target.value)} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
        <Input label="Height (cm)" type="number" inputMode="decimal" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="175" invalid={attempted && !height} aria-describedby={attempted && missing ? "profile-errors" : undefined} />
        <Input label="Weight (kg)" type="number" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="80" invalid={attempted && !weight} aria-describedby={attempted && missing ? "profile-errors" : undefined} />
      </div>
      {/* role=alert so a failed Save from the sheet's nav bar is announced,
          not silently swallowed. */}
      {attempted && missing && <p id="profile-errors" role="alert" className="text-[0.8125rem] text-red-500">Age, height and weight are needed to calculate your target.</p>}
      <Select label="Activity" value={activity} onChange={(e) => setActivity(e.target.value)} options={[
        { value: "sedentary", label: "Sedentary (desk job)" }, { value: "light", label: "Light (1-2x/week)" },
        { value: "moderate", label: "Moderate (3-5x/week)" }, { value: "active", label: "Active (6-7x/week)" },
        { value: "very_active", label: "Very Active (2x/day)" },
      ]} />
      <Select label="Goal" value={goal} onChange={(e) => setGoal(e.target.value)} options={[
        { value: "aggressive_cut", label: "Aggressive Cut (-1000 cal)" }, { value: "cut", label: "Cut (-500 cal)" },
        { value: "maintenance", label: "Maintenance" }, { value: "bulk", label: "Bulk (+300 cal)" },
      ]} />
    </div>
  );
}
