import { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import Sheet from "@/components/ui/Sheet";
import SwipeRow from "@/components/ui/SwipeRow";
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
        subtitle="Swipe a template to delete it."
        action={
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus size={16} />
            New
          </Button>
        }
      />

      <div className="space-y-3">
        {templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="glass-subtle mb-4 flex h-16 w-16 items-center justify-center rounded-full">
              <Dumbbell size={28} className="text-[color:var(--ink-quaternary)]" />
            </div>
            <p className="text-caption max-w-[15rem]">
              No templates yet. Create one to start workouts quickly.
            </p>
          </div>
        ) : (
          templates.map((t) => (
            <SwipeRow key={t.id} label={t.name} onDelete={() => handleDelete(t.id)}>
              <TemplateCard
                name={t.name}
                exerciseCount={t.exercises.length}
                exercises={t.exercises}
                onEdit={() => setEditingId(t.id)}
              />
            </SwipeRow>
          ))
        )}
      </div>

      {/* Create and edit both arrive as a sheet you can throw back down —
          the same path in and out. */}
      <Sheet open={showForm} title="New template" onClose={() => setShowForm(false)}>
        <TemplateForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
      </Sheet>

      <Sheet
        open={editingId !== null}
        title={editingTemplate ? `Edit ${editingTemplate.name}` : "Edit template"}
        onClose={() => setEditingId(null)}
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
            submitLabel="Save changes"
          />
        )}
      </Sheet>
    </div>
  );
}
