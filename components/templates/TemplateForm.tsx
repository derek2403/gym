import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import { Plus, Trash2, GripVertical, Timer, ArrowDownUp } from "lucide-react";

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
    setExercises((prev) =>
      prev.map((e, idx) => (idx === i ? { ...e, [field]: value } : e))
    );
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

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m${s > 0 ? ` ${s}s` : ""}` : `${s}s`;
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <Input
        label="Template name"
        placeholder="e.g., Push Day, Upper Body"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <div className="space-y-3">
        <label className="text-xs font-medium text-zinc-400">Exercises</label>
        {exercises.map((ex, i) => (
          <div key={i}>
            <Card className="flex items-start gap-3 p-3">
              <GripVertical size={16} className="mt-2.5 shrink-0 text-zinc-600" />
              <div className="flex-1 space-y-2">
                <input
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-emerald-500"
                  placeholder="Exercise name"
                  value={ex.exerciseName}
                  onChange={(e) => updateExercise(i, "exerciseName", e.target.value)}
                />
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <span className="mb-1 block text-[10px] text-zinc-500">Sets</span>
                    <input
                      type="number"
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-center text-sm text-zinc-100 outline-none focus:border-emerald-500"
                      value={ex.targetSets}
                      onChange={(e) => updateExercise(i, "targetSets", Number(e.target.value))}
                      min={1}
                    />
                  </div>
                  <div>
                    <span className="mb-1 block text-[10px] text-zinc-500">Reps</span>
                    <input
                      type="number"
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-center text-sm text-zinc-100 outline-none focus:border-emerald-500"
                      value={ex.targetReps}
                      onChange={(e) => updateExercise(i, "targetReps", Number(e.target.value))}
                      min={1}
                    />
                  </div>
                  <div>
                    <span className="mb-1 flex items-center gap-1 text-[10px] text-zinc-500">
                      <Timer size={8} />
                      Rest (s)
                    </span>
                    <input
                      type="number"
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-center text-sm text-zinc-100 outline-none focus:border-emerald-500"
                      value={ex.restSeconds}
                      onChange={(e) => updateExercise(i, "restSeconds", Number(e.target.value))}
                      min={0}
                      step={5}
                    />
                  </div>
                  <div>
                    <span className="mb-1 flex items-center gap-1 text-[10px] text-zinc-500">
                      <ArrowDownUp size={8} />
                      Next (s)
                    </span>
                    <input
                      type="number"
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-center text-sm text-zinc-100 outline-none focus:border-emerald-500"
                      value={ex.intervalSeconds}
                      onChange={(e) => updateExercise(i, "intervalSeconds", Number(e.target.value))}
                      min={0}
                      step={5}
                    />
                  </div>
                </div>
                <div className="flex gap-3 text-[10px] text-zinc-500">
                  <span>Rest between sets: {formatTime(ex.restSeconds)}</span>
                  <span>Interval to next: {formatTime(ex.intervalSeconds)}</span>
                </div>
              </div>
              <button
                onClick={() => removeExercise(i)}
                className="mt-2 p-1 text-zinc-600 transition-colors hover:text-red-400"
              >
                <Trash2 size={16} />
              </button>
            </Card>
            {i < exercises.length - 1 && (
              <div className="flex items-center justify-center py-1">
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-600">
                  <ArrowDownUp size={10} />
                  <span>{formatTime(ex.intervalSeconds)} transition</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={addExercise}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700 py-3 text-sm text-zinc-500 transition-colors hover:border-zinc-500 hover:text-zinc-300"
      >
        <Plus size={16} />
        Add exercise
      </button>

      <div className="flex gap-3 pt-2">
        <Button variant="secondary" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button onClick={handleSubmit} className="flex-1">
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}
