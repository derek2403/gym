import { useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

interface ProfileData {
  age: number; sex: string; heightCm: number; weightKg: number; activityLevel: string; goalType: string;
}

interface ProfileSetupProps {
  initial?: Partial<ProfileData>;
  onSave: (data: ProfileData) => void;
  onCancel?: () => void;
}

export default function ProfileSetup({ initial, onSave, onCancel }: ProfileSetupProps) {
  const [age, setAge] = useState(initial?.age?.toString() || "");
  const [sex, setSex] = useState(initial?.sex || "male");
  const [height, setHeight] = useState(initial?.heightCm?.toString() || "");
  const [weight, setWeight] = useState(initial?.weightKg?.toString() || "");
  const [activity, setActivity] = useState(initial?.activityLevel || "moderate");
  const [goal, setGoal] = useState(initial?.goalType || "cut");

  const handleSubmit = () => {
    if (!age || !height || !weight) return;
    onSave({ age: Number(age), sex, heightCm: Number(height), weightKg: Number(weight), activityLevel: activity, goalType: goal });
  };

  return (
    <Card className="animate-fade-in space-y-5">
      <div>
        <h3 className="text-title-sm text-black">Profile setup</h3>
        <p className="text-caption mt-1">We need a few details to calculate your daily target.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Age" type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="25" />
        <Select label="Sex" value={sex} onChange={(e) => setSex(e.target.value)} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
        <Input label="Height (cm)" type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="175" />
        <Input label="Weight (kg)" type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="80" />
      </div>
      <Select label="Activity" value={activity} onChange={(e) => setActivity(e.target.value)} options={[
        { value: "sedentary", label: "Sedentary (desk job)" }, { value: "light", label: "Light (1-2x/week)" },
        { value: "moderate", label: "Moderate (3-5x/week)" }, { value: "active", label: "Active (6-7x/week)" },
        { value: "very_active", label: "Very Active (2x/day)" },
      ]} />
      <Select label="Goal" value={goal} onChange={(e) => setGoal(e.target.value)} options={[
        { value: "aggressive_cut", label: "Aggressive Cut (-1000 cal)" }, { value: "cut", label: "Cut (-500 cal)" },
        { value: "maintenance", label: "Maintenance" }, { value: "bulk", label: "Bulk (+300 cal)" },
      ]} />
      <div className="flex gap-3 pt-1">
        {onCancel && <Button variant="glass" onClick={onCancel} className="flex-1">Cancel</Button>}
        <Button onClick={handleSubmit} className="flex-1">Save profile</Button>
      </div>
    </Card>
  );
}
