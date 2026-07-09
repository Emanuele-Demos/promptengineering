"use client";

import { useState } from "react";
import type { Member, Task, TaskStatus } from "@/lib/types";
import { COLUMNS } from "@/lib/types";
import KanbanColumn from "./KanbanColumn";
import TaskModal from "./TaskModal";

interface KanbanBoardProps {
  tasks: Task[];
  members: Member[];
  onRefresh: () => void;
}

export default function KanbanBoard({ tasks, members, onRefresh }: KanbanBoardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>("todo");
  const [draggingId, setDraggingId] = useState<string | null>(null);

  function openCreate(status: TaskStatus) {
    setEditingTask(null);
    setDefaultStatus(status);
    setModalOpen(true);
  }

  function openEdit(task: Task) {
    setEditingTask(task);
    setDefaultStatus(task.status);
    setModalOpen(true);
  }

  async function handleMove(taskId: string, status: TaskStatus) {
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    onRefresh();
  }

  async function handleDelete(taskId: string) {
    if (!confirm("Eliminare questo task?")) return;
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    onRefresh();
  }

  return (
    <>
      <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-3">
        {COLUMNS.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            tasks={tasks.filter((t) => t.status === column.id)}
            members={members}
            draggingId={draggingId}
            onDragStart={setDraggingId}
            onDragEnd={() => setDraggingId(null)}
            onDrop={(taskId) => handleMove(taskId, column.id)}
            onAdd={() => openCreate(column.id)}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {modalOpen && (
        <TaskModal
          task={editingTask}
          defaultStatus={defaultStatus}
          members={members}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            onRefresh();
          }}
        />
      )}
    </>
  );
}
