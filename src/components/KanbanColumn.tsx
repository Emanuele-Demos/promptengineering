"use client";

import type { Member, Task } from "@/lib/types";
import TaskCard from "./TaskCard";

interface Column {
  id: string;
  label: string;
}

interface KanbanColumnProps {
  column: Column;
  tasks: Task[];
  members: Member[];
  draggingId: string | null;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDrop: (taskId: string) => void;
  onAdd: () => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

const columnStyles: Record<string, string> = {
  todo: "border-slate-200 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-900/40",
  in_progress: "border-indigo-200 bg-indigo-50/50 dark:border-indigo-900 dark:bg-indigo-950/30",
  done: "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/30",
};

const badgeStyles: Record<string, string> = {
  todo: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
  in_progress: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200",
  done: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200",
};

export default function KanbanColumn({
  column,
  tasks,
  members,
  draggingId,
  onDragStart,
  onDragEnd,
  onDrop,
  onAdd,
  onEdit,
  onDelete,
}: KanbanColumnProps) {
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain");
    if (taskId) onDrop(taskId);
    onDragEnd();
  }

  return (
    <section
      className={`flex min-h-[420px] flex-col rounded-2xl border p-4 ${columnStyles[column.id] ?? columnStyles.todo}`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <header className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100">{column.label}</h2>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeStyles[column.id] ?? badgeStyles.todo}`}
          >
            {tasks.length}
          </span>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="rounded-lg px-2 py-1 text-sm text-slate-500 transition hover:bg-white/60 hover:text-indigo-600 dark:hover:bg-slate-800 dark:hover:text-indigo-400"
          aria-label={`Aggiungi task in ${column.label}`}
        >
          +
        </button>
      </header>

      <div className="flex flex-1 flex-col gap-3">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            members={members}
            isDragging={draggingId === task.id}
            onDragStart={() => onDragStart(task.id)}
            onDragEnd={onDragEnd}
            onEdit={() => onEdit(task)}
            onDelete={() => onDelete(task.id)}
          />
        ))}

        {tasks.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">
            Nessun task — trascina qui o clicca +
          </p>
        )}
      </div>
    </section>
  );
}
