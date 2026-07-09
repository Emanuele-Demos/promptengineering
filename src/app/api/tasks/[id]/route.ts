import { NextResponse } from "next/server";
import { deleteTask, updateTask } from "@/lib/db";
import type { Priority, TaskStatus } from "@/lib/types";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();

  const task = updateTask(id, {
    title: body.title,
    description: body.description,
    priority: body.priority as Priority | undefined,
    assigneeId: body.assigneeId,
    dueDate: body.dueDate,
    status: body.status as TaskStatus | undefined,
    isRecurring: body.isRecurring !== undefined ? !!body.isRecurring : undefined,
    recurrenceDays: Array.isArray(body.recurrenceDays) ? body.recurrenceDays.map(Number) : undefined,
    maxRecurrences: body.maxRecurrences !== undefined ? (body.maxRecurrences === null ? undefined : Number(body.maxRecurrences)) : undefined,
    recurrenceStopped: body.recurrenceStopped !== undefined ? !!body.recurrenceStopped : undefined,
  });

  if (!task) {
    return NextResponse.json({ error: "Task non trovato" }, { status: 404 });
  }

  return NextResponse.json(task);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const deleted = deleteTask(id);

  if (!deleted) {
    return NextResponse.json({ error: "Task non trovato" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
