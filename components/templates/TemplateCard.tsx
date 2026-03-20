import Card from "@/components/ui/Card";
import { Dumbbell, Pencil, Trash2 } from "lucide-react";

interface TemplateCardProps {
  name: string;
  exerciseCount: number;
  exercises: string[];
  onEdit: () => void;
  onDelete: () => void;
}

export default function TemplateCard({
  name,
  exerciseCount,
  exercises,
  onEdit,
  onDelete,
}: TemplateCardProps) {
  return (
    <Card className="space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800">
            <Dumbbell size={18} className="text-emerald-500" />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-100">{name}</h3>
            <p className="text-xs text-zinc-500">{exerciseCount} exercises</p>
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {exercises.map((name, i) => (
          <span
            key={i}
            className="rounded-lg bg-zinc-800 px-2.5 py-1 text-xs text-zinc-400"
          >
            {name}
          </span>
        ))}
      </div>
    </Card>
  );
}
