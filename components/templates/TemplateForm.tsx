import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import { Plus, Trash2, Timer, ArrowDownUp } from "lucide-react";
import { normalizeRepRange } from "@/lib/utils";

const NUM_FIELD = "w-full min-w-0 rounded-lg bg-[rgba(120,120,128,0.09)] px-2 py-2 text-center text-[13px] text-[color:var(--ink)] outline-none focus:bg-[rgba(120,120,128,0.13)]";

interface Exercise {
  exerciseName: string;
  targetSets: number;
  targetRepsMin: number;
  targetRepsMax: number;
  restSeconds: number;
  intervalSeconds: number;
}

const BLANK_EXERCISE: Exercise = { exerciseName: "", targetSets: 3, targetRepsMin: 8, targetRepsMax: 12, restSeconds: 90, intervalSeconds: 120 };

interface TemplateFormProps {
  initialName?: string;
  initialExercises?: Exercise[];
  onSubmit: (name: string, exercises: Exercise[]) => void;
  onCancel: () => void;
  submitLabel?: string;
}

export default function TemplateForm({
  initialName = "",
  initialExercises = [BLANK_EXERCISE],
  onSubmit,
  onCancel,
  submitLabel = "Create template",
}: TemplateFormProps) {
  const [name, setName] = useState(initialName);
  const [exercises, setExercises] = useState<Exercise[]>(initialExercises);
  // Only surface "required" hints once the user has tried to submit.
  const [attempted, setAttempted] = useState(false);

  const updateExercise = (i: number, field: keyof Exercise, value: string | number) => {
    setExercises((prev) => prev.map((e, idx) => (idx === i ? { ...e, [field]: value } : e)));
  };

  const addExercise = () => {
    setExercises((prev) => [...prev, BLANK_EXERCISE]);
  };

  const removeExercise = (i: number) => {
    if (exercises.length <= 1) return;
    setExercises((prev) => prev.filter((_, idx) => idx !== i));
  };

  // Keep the range coherent once the user leaves the field, so a max below the
  // min never reaches the API.
  const clampRange = (i: number) => {
    setExercises((prev) => prev.map((e, idx) => (idx === i ? { ...e, ...normalizeRepRange(e) } : e)));
  };

  const nameMissing = !name.trim();
  const exerciseMissing = !exercises.some((e) => e.exerciseName.trim());

  const handleSubmit = () => {
    setAttempted(true);
    if (nameMissing || exerciseMissing) return;
    const valid = exercises.filter((e) => e.exerciseName.trim()).map((e) => ({ ...e, ...normalizeRepRange(e) }));
    onSubmit(name, valid);
  };

  return (
    <div className="animate-fade-in space-y-4">
      <div>
        <Input
          label="Template name"
          placeholder="e.g., Push Day"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={attempted && nameMissing ? "ring-2 ring-red-500/30" : undefined}
        />
        {attempted && nameMissing && <p className="mt-2 text-[12px] text-red-500">Give the template a name.</p>}
      </div>

      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <span className="text-overline">Exercises</span>
          {attempted && exerciseMissing && <span className="text-[12px] text-red-500">Name at least one exercise.</span>}
        </div>
        {exercises.map((ex, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-1 space-y-3">
                <input
                  className={`w-full rounded-xl bg-[rgba(120,120,128,0.09)] px-3.5 py-3 text-[15px] text-[color:var(--ink)] placeholder:text-[color:var(--ink-quaternary)] outline-none focus:bg-[rgba(120,120,128,0.13)] ${attempted && exerciseMissing ? "ring-2 ring-red-500/30" : ""}`}
                  placeholder="Exercise name"
                  value={ex.exerciseName}
                  onChange={(e) => updateExercise(i, "exerciseName", e.target.value)}
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="mb-1.5 flex items-center gap-1 text-[0.6875rem] font-medium text-[color:var(--ink-tertiary)]">Sets</span>
                    <input
                      type="number"
                      className={NUM_FIELD}
                      value={ex.targetSets}
                      onChange={(e) => updateExercise(i, "targetSets", Number(e.target.value))}
                      min={1}
                    />
                  </div>
                  <div>
                    <span className="mb-1.5 flex items-center gap-1 text-[0.6875rem] font-medium text-[color:var(--ink-tertiary)]">Rep range</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        className={NUM_FIELD}
                        value={ex.targetRepsMin}
                        onChange={(e) => updateExercise(i, "targetRepsMin", Number(e.target.value))}
                        onBlur={() => clampRange(i)}
                        min={1}
                      />
                      <span className="text-[12px] text-[color:var(--ink-quaternary)]">–</span>
                      <input
                        type="number"
                        className={NUM_FIELD}
                        value={ex.targetRepsMax}
                        onChange={(e) => updateExercise(i, "targetRepsMax", Number(e.target.value))}
                        onBlur={() => clampRange(i)}
                        min={ex.targetRepsMin}
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Rest", field: "restSeconds" as const, val: ex.restSeconds, icon: <Timer size={8} /> },
                    { label: "Next", field: "intervalSeconds" as const, val: ex.intervalSeconds, icon: <ArrowDownUp size={8} /> },
                  ].map(({ label, field, val, icon }) => (
                    <div key={field}>
                      <span className="mb-1.5 flex items-center gap-1 text-[0.6875rem] font-medium text-[color:var(--ink-tertiary)]">
                        {icon}
                        {label}
                      </span>
                      <input
                        type="number"
                        className={NUM_FIELD}
                        value={val}
                        onChange={(e) => updateExercise(i, field, Number(e.target.value))}
                        min={0}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={() => removeExercise(i)} className="mt-2 p-1.5 text-[color:var(--ink-quaternary)] transition-colors hover:text-red-400">
                <Trash2 size={15} />
              </button>
            </div>
          </Card>
        ))}
      </div>

      <button
        onClick={addExercise}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-black/8 py-4 text-[13px] text-[color:var(--ink-quaternary)] transition-colors hover:border-black/10 hover:text-[color:var(--ink-secondary)]"
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
