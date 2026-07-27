import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/router";
import NavBar, { NavAction } from "@/components/ui/NavBar";
import Sheet from "@/components/ui/Sheet";
import SwipeRow from "@/components/ui/SwipeRow";
import TemplateCard from "@/components/templates/TemplateCard";
import TemplateForm from "@/components/templates/TemplateForm";
import { Plus, Dumbbell, ChevronLeft } from "lucide-react";

interface Exercise {
  id: number;
  exerciseName: string;
  targetSets: number;
  targetRepsMin: number;
  targetRepsMax: number;
  restSeconds: number;
  intervalSeconds: number;
  sortOrder: number;
}

type ExerciseInput = Omit<Exercise, "id" | "sortOrder">;

interface Template {
  id: number;
  name: string;
  exercises: Exercise[];
}

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const createRef = useRef<(() => void) | null>(null);
  const editRef = useRef<(() => void) | null>(null);

  const fetchTemplates = useCallback(async () => {
    const res = await fetch("/api/templates");
    setTemplates(await res.json());
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleCreate = async (name: string, exercises: ExerciseInput[]) => {
    await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, exercises }),
    });
    setShowForm(false);
    fetchTemplates();
  };

  const handleUpdate = async (name: string, exercises: ExerciseInput[]) => {
    await fetch(`/api/templates/${editingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, exercises }),
    });
    setEditingId(null);
    fetchTemplates();
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/templates/${id}`, { method: "DELETE" });
    fetchTemplates();
  };

  const editingTemplate = templates.find((t) => t.id === editingId);

  return (
    <div>
      <NavBar
        title="Templates"
        leading={
          <NavAction onClick={() => router.push("/workout")}>
            <ChevronLeft size={18} strokeWidth={2.6} className="-ml-1" />
            Workout
          </NavAction>
        }
        trailing={
          <NavAction onClick={() => setShowForm(true)} label="New template" prominent>
            <Plus size={20} strokeWidth={2.5} />
          </NavAction>
        }
      />

      <div className="mt-5 space-y-3">
        {templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-8 py-24 text-center">
            <div className="glass-subtle mb-4 flex h-16 w-16 items-center justify-center rounded-full">
              <Dumbbell size={28} className="text-[color:var(--ink-quaternary)]" />
            </div>
            <h2 className="text-title-sm">No templates</h2>
            <p className="text-caption mt-1.5 max-w-[16rem]">
              A template is a workout you repeat — its exercises, sets and rep ranges.
            </p>
          </div>
        ) : (
          <>
            {templates.map((t) => (
              <SwipeRow key={t.id} label={t.name} onDelete={() => handleDelete(t.id)}>
                <TemplateCard
                  name={t.name}
                  exerciseCount={t.exercises.length}
                  exercises={t.exercises}
                  onEdit={() => setEditingId(t.id)}
                />
              </SwipeRow>
            ))}
            <p className="text-caption px-4 pt-1">Swipe a template left to delete it.</p>
          </>
        )}
      </div>

      <Sheet
        open={showForm}
        title="New template"
        onClose={() => setShowForm(false)}
        confirm={{ label: "Add", onConfirm: () => createRef.current?.() }}
      >
        <TemplateForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} hideActions submitRef={createRef} />
      </Sheet>

      <Sheet
        open={editingId !== null}
        title="Edit template"
        onClose={() => setEditingId(null)}
        confirm={{ label: "Done", onConfirm: () => editRef.current?.() }}
      >
        {editingTemplate && (
          <TemplateForm
            initialName={editingTemplate.name}
            initialExercises={editingTemplate.exercises.map((e) => ({
              exerciseName: e.exerciseName,
              targetSets: e.targetSets,
              targetRepsMin: e.targetRepsMin,
              targetRepsMax: e.targetRepsMax,
              restSeconds: e.restSeconds,
              intervalSeconds: e.intervalSeconds,
            }))}
            onSubmit={handleUpdate}
            onCancel={() => setEditingId(null)}
            hideActions
            submitRef={editRef}
          />
        )}
      </Sheet>
    </div>
  );
}
