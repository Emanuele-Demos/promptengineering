"use client";

import type { Member, Task } from "@/lib/types";
import { PRIORITY_LABELS } from "@/lib/types";

interface TaskCardProps {
  task: Task;
  members: Member[];
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const priorityStyles = {
  low: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
  high: "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300",
};

function formatDueDate(date: string): string {
  return new Date(date).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "short",
  });
}

function isOverdue(date: string): boolean {
  const due = new Date(date);
  due.setHours(23, 59, 59, 999);
  return due < new Date();
}

export default function TaskCard({
  task,
  members,
  isDragging,
  onDragStart,
  onDragEnd,
  onEdit,
  onDelete,
}: TaskCardProps) {
  const assignee = members.find((m) => m.id === task.assigneeId);
  const overdue = task.dueDate && task.status !== "done" && isOverdue(task.dueDate);

  return (
    <article
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", task.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      className={`group cursor-grab rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition active:cursor-grabbing dark:border-slate-700 dark:bg-slate-800 ${
        isDragging ? "opacity-40" : "hover:border-indigo-300 hover:shadow-md dark:hover:border-indigo-700"
      }`}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="text-left font-medium text-slate-800 hover:text-indigo-600 dark:text-slate-100 dark:hover:text-indigo-400"
        >
          {task.title}
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="shrink-0 rounded p-1 text-slate-300 opacity-0 transition group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950"
          aria-label="Elimina task"
        >
          ×
        </button>
      </div>

      {task.description && (
        <p className="mb-3 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
          {task.description}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-md px-2 py-0.5 text-xs font-medium ${priorityStyles[task.priority]}`}
        >
          {PRIORITY_LABELS[task.priority]}
        </span>

        {task.dueDate && (
          <span
            className={`rounded-md px-2 py-0.5 text-xs font-medium ${
              overdue
                ? "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300"
                : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
            }`}
          >
            {overdue ? "Scaduto · " : ""}
            {formatDueDate(task.dueDate)}
          </span>
        )}

        {assignee && (
          <span className="ml-auto flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
              style={{ backgroundColor: assignee.color }}
            >
              {assignee.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </span>
            {assignee.name.split(" ")[0]}
          </span>
        )}
      </div>
    </article>
  );
}
