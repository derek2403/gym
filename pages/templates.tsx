import { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import TemplateCard from "@/components/templates/TemplateCard";
import TemplateForm from "@/components/templates/TemplateForm";
import { Plus, Dumbbell } from "lucide-react";

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
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

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
      <PageHeader
        title="Templates"
        subtitle="Build workouts from real exercises."
        action={
          !showForm && !editingId ? (
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus size={16} />
              New
            </Button>
          ) : undefined
        }
      />

      {showForm && (
        <TemplateForm
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
        />
      )}

      {editingId && editingTemplate && (
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
          submitLabel="Save changes"
        />
      )}

      {!showForm && !editingId && (
        <div className="space-y-3">
          {templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-900">
                <Dumbbell size={28} className="text-zinc-600" />
              </div>
              <p className="text-sm text-zinc-500">
                No exercise templates yet. Create one to start workouts quickly.
              </p>
            </div>
          ) : (
            templates.map((t) => (
              <TemplateCard
                key={t.id}
                name={t.name}
                exerciseCount={t.exercises.length}
                exercises={t.exercises}
                onEdit={() => setEditingId(t.id)}
                onDelete={() => handleDelete(t.id)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
