import Card from "@/components/ui/Card";
import { Dumbbell, Pencil, Trash2 } from "lucide-react";

interface TemplateCardProps {
  name: string;
  exerciseCount: number;
  exercises: string[];
  onEdit: () => void;
  onDelete: () => void;
}

export default function TemplateCard({ name, exerciseCount, exercises, onEdit, onDelete }: TemplateCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10">
            <Dumbbell size={17} className="text-emerald-400" />
          </div>
          <div>
            <h3 className="text-title-sm text-black/85">{name}</h3>
            <p className="text-caption mt-0.5">{exerciseCount} exercise{exerciseCount !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <div className="flex gap-0.5">
          <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="rounded-xl p-2.5 text-black/15 transition-colors hover:text-black/70/40">
            <Pencil size={14} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="rounded-xl p-2.5 text-black/15 transition-colors hover:text-red-400">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      {exercises.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {exercises.map((name, i) => (
            <span key={i} className="rounded-full bg-black/[0.04] px-3 py-1 text-[11px] font-medium text-black/25">
              {name}
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}
