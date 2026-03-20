import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import { Plus, Trash2, Timer, ArrowDownUp } from "lucide-react";

interface Exercise {
  exerciseName: string;
  targetSets: number;
  targetReps: number;
  restSeconds: number;
  intervalSeconds: number;
}

interface TemplateFormProps {
  initialName?: string;
  initialExercises?: Exercise[];
  onSubmit: (name: string, exercises: Exercise[]) => void;
  onCancel: () => void;
  submitLabel?: string;
}

export default function TemplateForm({
  initialName = "",
  initialExercises = [{ exerciseName: "", targetSets: 3, targetReps: 10, restSeconds: 90, intervalSeconds: 120 }],
  onSubmit,
  onCancel,
  submitLabel = "Create template",
}: TemplateFormProps) {
  const [name, setName] = useState(initialName);
  const [exercises, setExercises] = useState<Exercise[]>(initialExercises);

  const updateExercise = (i: number, field: keyof Exercise, value: string | number) => {
    setExercises((prev) => prev.map((e, idx) => (idx === i ? { ...e, [field]: value } : e)));
  };

  const addExercise = () => {
    setExercises((prev) => [...prev, { exerciseName: "", targetSets: 3, targetReps: 10, restSeconds: 90, intervalSeconds: 120 }]);
  };

  const removeExercise = (i: number) => {
    if (exercises.length <= 1) return;
    setExercises((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    const valid = exercises.filter((e) => e.exerciseName.trim());
    if (!valid.length) return;
    onSubmit(name, valid);
  };

  return (
    <div className="animate-fade-in space-y-4">
      <Input label="Template name" placeholder="e.g., Push Day" value={name} onChange={(e) => setName(e.target.value)} />

      <div className="space-y-3">
        <span className="text-overline">Exercises</span>
        {exercises.map((ex, i) => (
          <Card key={i} variant="subtle" className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-1 space-y-3">
                <input
                  className="w-full rounded-xl bg-white/[0.06] px-3.5 py-3 text-[15px] text-white/90 placeholder:text-white/20 outline-none focus:bg-white/[0.1]"
                  placeholder="Exercise name"
                  value={ex.exerciseName}
                  onChange={(e) => updateExercise(i, "exerciseName", e.target.value)}
                />
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: "Sets", field: "targetSets" as const, val: ex.targetSets },
                    { label: "Reps", field: "targetReps" as const, val: ex.targetReps },
                    { label: "Rest", field: "restSeconds" as const, val: ex.restSeconds },
                    { label: "Next", field: "intervalSeconds" as const, val: ex.intervalSeconds },
                  ].map(({ label, field, val }) => (
                    <div key={field}>
                      <span className="mb-1 flex items-center gap-1 text-[10px] text-white/25">
                        {field === "restSeconds" && <Timer size={8} />}
                        {field === "intervalSeconds" && <ArrowDownUp size={8} />}
                        {label}
                      </span>
                      <input
                        type="number"
                        className="w-full rounded-lg bg-white/[0.06] px-2 py-2 text-center text-[13px] text-white/80 outline-none focus:bg-white/[0.1]"
                        value={val}
                        onChange={(e) => updateExercise(i, field, Number(e.target.value))}
                        min={field === "targetSets" || field === "targetReps" ? 1 : 0}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={() => removeExercise(i)} className="mt-2 p-1.5 text-white/15 transition-colors hover:text-red-400">
                <Trash2 size={15} />
              </button>
            </div>
          </Card>
        ))}
      </div>

      <button
        onClick={addExercise}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/10 py-4 text-[13px] text-white/25 transition-colors hover:border-white/20 hover:text-white/40"
      >
        <Plus size={15} />
        Add exercise
      </button>

      <div className="flex gap-3 pt-2">
        <Button variant="glass" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button onClick={handleSubmit} className="flex-1">{submitLabel}</Button>
      </div>
    </div>
  );
}
