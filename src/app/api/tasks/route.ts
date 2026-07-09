import { NextResponse } from "next/server";
import { createTask, getAll } from "@/lib/db";
import type { Priority, TaskStatus } from "@/lib/types";

export async function GET() {
  const { tasks } = getAll();
  return NextResponse.json(tasks);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { title, description, priority, assigneeId, dueDate, status, isRecurring, recurrenceDays, maxRecurrences, recurrenceStopped } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: "Il titolo è obbligatorio" }, { status: 400 });
  }

  const task = createTask({
    title,
    description: description ?? "",
    priority: (priority as Priority) ?? "medium",
    assigneeId: assigneeId ?? null,
    dueDate: dueDate ?? null,
    status: (status as TaskStatus) ?? "todo",
    isRecurring: !!isRecurring,
    recurrenceDays: Array.isArray(recurrenceDays) ? recurrenceDays.map(Number) : [],
    maxRecurrences: maxRecurrences ? Number(maxRecurrences) : undefined,
    recurrenceStopped: !!recurrenceStopped,
  });

  return NextResponse.json(task, { status: 201 });
}
