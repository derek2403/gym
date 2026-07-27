import Card from "@/components/ui/Card";
import { Dumbbell, Pencil, Trash2 } from "lucide-react";
import { formatRepRange } from "@/lib/utils";

interface TemplateCardExercise {
  exerciseName: string;
  targetSets: number;
  targetRepsMin: number;
  targetRepsMax: number;
}

interface TemplateCardProps {
  name: string;
  exerciseCount: number;
  exercises: TemplateCardExercise[];
  onEdit: () => void;
  /** Omitted where the row itself provides deletion (swipe). */
  onDelete?: () => void;
}

export default function TemplateCard({ name, exerciseCount, exercises, onEdit, onDelete }: TemplateCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="flex min-w-0 items-center gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15">
            <Dumbbell size={17} className="text-emerald-600" />
          </div>
          <div className="min-w-0">
            <h3 className="text-title-sm on-material truncate">{name}</h3>
            <p className="text-caption mt-0.5">{exerciseCount} exercise{exerciseCount !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <div className="flex shrink-0 gap-0.5">
          <button aria-label={`Edit ${name}`} onClick={(e) => { e.stopPropagation(); onEdit(); }} className="pressable rounded-full p-2.5 text-[color:var(--ink-tertiary)] transition-colors hover:bg-[rgba(120,120,128,0.09)] hover:text-[color:var(--ink)]">
            <Pencil size={14} />
          </button>
          {onDelete && (
            <button aria-label={`Delete ${name}`} onClick={(e) => { e.stopPropagation(); onDelete(); }} className="pressable rounded-full p-2.5 text-[color:var(--ink-tertiary)] transition-colors hover:bg-red-500/10 hover:text-red-500">
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
      {exercises.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {exercises.map((ex, i) => (
            <span key={i} className="rounded-full bg-[rgba(120,120,128,0.09)] px-3 py-1 text-[0.6875rem] font-medium text-[color:var(--ink-secondary)]">
              {ex.exerciseName}
              <span className="ml-1.5 tabular-nums text-[color:var(--ink-quaternary)]">
                {ex.targetSets}×{formatRepRange(ex.targetRepsMin, ex.targetRepsMax)}
              </span>
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}
