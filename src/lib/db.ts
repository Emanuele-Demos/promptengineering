import { randomUUID } from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import type { Database, Member, Task, TaskStatus } from "./types";
import { MEMBER_COLORS } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "teamflow.json");

function seedDatabase(): Database {
  const now = new Date().toISOString();
  const members: Member[] = [
    {
      id: randomUUID(),
      name: "Marco Rossi",
      email: "marco@team.it",
      color: MEMBER_COLORS[0],
      createdAt: now,
    },
    {
      id: randomUUID(),
      name: "Laura Bianchi",
      email: "laura@team.it",
      color: MEMBER_COLORS[1],
      createdAt: now,
    },
    {
      id: randomUUID(),
      name: "Giuseppe Verdi",
      email: "giuseppe@team.it",
      color: MEMBER_COLORS[2],
      createdAt: now,
    },
  ];

  const tasks: Task[] = [
    {
      id: randomUUID(),
      title: "Definire roadmap Q3",
      description: "Pianificare obiettivi e milestone per il terzo trimestre.",
      status: "todo",
      priority: "high",
      assigneeId: members[0].id,
      dueDate: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: randomUUID(),
      title: "Revisione design homepage",
      description: "Feedback sul nuovo mockup e approvazione finale.",
      status: "in_progress",
      priority: "medium",
      assigneeId: members[1].id,
      dueDate: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: randomUUID(),
      title: "Setup ambiente staging",
      description: "Configurare CI/CD e deploy automatico.",
      status: "done",
      priority: "low",
      assigneeId: members[2].id,
      dueDate: null,
      createdAt: now,
      updatedAt: now,
    },
  ];

  return { members, tasks };
}

function readDatabase(): Database {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!existsSync(DB_PATH)) {
    const seeded = seedDatabase();
    writeFileSync(DB_PATH, JSON.stringify(seeded, null, 2), "utf-8");
    return seeded;
  }

  const raw = readFileSync(DB_PATH, "utf-8");
  return JSON.parse(raw) as Database;
}

function writeDatabase(data: Database): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
  writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
}

export function getAll(): Database {
  return readDatabase();
}

export function createMember(input: Pick<Member, "name" | "email">): Member {
  const db = readDatabase();
  const member: Member = {
    id: randomUUID(),
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    color: MEMBER_COLORS[db.members.length % MEMBER_COLORS.length],
    createdAt: new Date().toISOString(),
  };
  db.members.push(member);
  writeDatabase(db);
  return member;
}

export function deleteMember(id: string): boolean {
  const db = readDatabase();
  const index = db.members.findIndex((m) => m.id === id);
  if (index === -1) return false;

  db.members.splice(index, 1);
  db.tasks.forEach((task) => {
    if (task.assigneeId === id) {
      task.assigneeId = null;
      task.updatedAt = new Date().toISOString();
    }
  });
  writeDatabase(db);
  return true;
}

export function createTask(
  input: Pick<Task, "title" | "description" | "priority" | "assigneeId" | "dueDate" | "status" | "isRecurring" | "recurrenceDays" | "maxRecurrences" | "recurrenceStopped">,
): Task {
  const db = readDatabase();
  const now = new Date().toISOString();
  const task: Task = {
    id: randomUUID(),
    title: input.title.trim(),
    description: input.description.trim(),
    status: input.status,
    priority: input.priority,
    assigneeId: input.assigneeId,
    dueDate: input.dueDate,
    isRecurring: input.isRecurring,
    recurrenceDays: input.recurrenceDays,
    maxRecurrences: input.maxRecurrences,
    recurrenceStopped: input.recurrenceStopped,
    createdAt: now,
    updatedAt: now,
  };
  db.tasks.push(task);
  writeDatabase(db);
  return task;
}

export function updateTask(
  id: string,
  input: Partial<Pick<Task, "title" | "description" | "priority" | "assigneeId" | "dueDate" | "status" | "isRecurring" | "recurrenceDays" | "maxRecurrences" | "recurrenceStopped">>,
): Task | null {
  const db = readDatabase();
  const task = db.tasks.find((t) => t.id === id);
  if (!task) return null;

  if (input.title !== undefined) task.title = input.title.trim();
  if (input.description !== undefined) task.description = input.description.trim();
  if (input.priority !== undefined) task.priority = input.priority;
  if (input.assigneeId !== undefined) task.assigneeId = input.assigneeId;
  if (input.dueDate !== undefined) task.dueDate = input.dueDate;
  if (input.status !== undefined) task.status = input.status;
  if (input.isRecurring !== undefined) task.isRecurring = input.isRecurring;
  if (input.recurrenceDays !== undefined) task.recurrenceDays = input.recurrenceDays;
  if (input.maxRecurrences !== undefined) task.maxRecurrences = input.maxRecurrences;
  if (input.recurrenceStopped !== undefined) task.recurrenceStopped = input.recurrenceStopped;
  task.updatedAt = new Date().toISOString();

  writeDatabase(db);
  return task;
}

export function deleteTask(id: string): boolean {
  const db = readDatabase();
  const index = db.tasks.findIndex((t) => t.id === id);
  if (index === -1) return false;
  db.tasks.splice(index, 1);
  writeDatabase(db);
  return true;
}

export function moveTask(id: string, status: TaskStatus): Task | null {
  return updateTask(id, { status });
}
