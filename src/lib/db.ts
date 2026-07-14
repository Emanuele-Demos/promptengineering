import { randomUUID } from "crypto";
import { existsSync, mkdirSync } from "fs";
import path from "path";
import Database from "better-sqlite3";
import type { Database as DatabaseShape, Member, Task, TaskStatus } from "./types";
import { MEMBER_COLORS } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "teamflow.sqlite");

let sqliteDb: Database.Database | null = null;

function getDatabase(): Database.Database {
  if (sqliteDb) {
    return sqliteDb;
  }

  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }

  sqliteDb = new Database(DB_PATH);
  sqliteDb.pragma("journal_mode = WAL");
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS members (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      color TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT NOT NULL,
      priority TEXT NOT NULL,
      assigneeId TEXT,
      dueDate TEXT,
      isRecurring INTEGER NOT NULL DEFAULT 0,
      recurrenceDays TEXT,
      maxRecurrences INTEGER,
      recurrenceStopped INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (assigneeId) REFERENCES members(id) ON DELETE SET NULL
    );
  `);

  const memberCount = sqliteDb.prepare("SELECT COUNT(*) as count FROM members").get() as { count: number };
  const taskCount = sqliteDb.prepare("SELECT COUNT(*) as count FROM tasks").get() as { count: number };

  if (memberCount.count === 0 && taskCount.count === 0) {
    seedDatabase();
  }

  return sqliteDb;
}

function seedDatabase(): void {
  const now = new Date().toISOString();
  const db = getDatabase();

  const insertMember = db.prepare(`
    INSERT INTO members (id, name, email, color, createdAt)
    VALUES (@id, @name, @email, @color, @createdAt)
  `);

  const insertTask = db.prepare(`
    INSERT INTO tasks (
      id,
      title,
      description,
      status,
      priority,
      assigneeId,
      dueDate,
      isRecurring,
      recurrenceDays,
      maxRecurrences,
      recurrenceStopped,
      createdAt,
      updatedAt
    ) VALUES (
      @id,
      @title,
      @description,
      @status,
      @priority,
      @assigneeId,
      @dueDate,
      @isRecurring,
      @recurrenceDays,
      @maxRecurrences,
      @recurrenceStopped,
      @createdAt,
      @updatedAt
    )
  `);

  const members = [
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

  const tasks = [
    {
      id: randomUUID(),
      title: "Definire roadmap Q3",
      description: "Pianificare obiettivi e milestone per il terzo trimestre.",
      status: "todo",
      priority: "high",
      assigneeId: members[0].id,
      dueDate: null,
      isRecurring: 0,
      recurrenceDays: null,
      maxRecurrences: null,
      recurrenceStopped: 0,
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
      isRecurring: 0,
      recurrenceDays: null,
      maxRecurrences: null,
      recurrenceStopped: 0,
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
      isRecurring: 0,
      recurrenceDays: null,
      maxRecurrences: null,
      recurrenceStopped: 0,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const insertManyMembers = db.transaction((records: typeof members) => {
    for (const member of records) {
      insertMember.run(member);
    }
  });

  const insertManyTasks = db.transaction((records: typeof tasks) => {
    for (const task of records) {
      insertTask.run(task);
    }
  });

  insertManyMembers(members);
  insertManyTasks(tasks);
}

function toTask(row: Record<string, unknown>): Task {
  const recurrenceDaysValue = typeof row.recurrenceDays === "string" ? JSON.parse(row.recurrenceDays) : [];
  return {
    id: String(row.id),
    title: String(row.title),
    description: String(row.description),
    status: row.status as TaskStatus,
    priority: row.priority as Task["priority"],
    assigneeId: typeof row.assigneeId === "string" ? row.assigneeId : null,
    dueDate: typeof row.dueDate === "string" ? row.dueDate : null,
    isRecurring: Boolean(row.isRecurring),
    recurrenceDays: Array.isArray(recurrenceDaysValue) ? recurrenceDaysValue : [],
    maxRecurrences: row.maxRecurrences === null || row.maxRecurrences === undefined ? undefined : Number(row.maxRecurrences),
    recurrenceStopped: Boolean(row.recurrenceStopped),
    createdAt: String(row.createdAt),
    updatedAt: String(row.updatedAt),
  };
}

function toMember(row: Record<string, unknown>): Member {
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    color: String(row.color),
    createdAt: String(row.createdAt),
  };
}

export function getAll(): DatabaseShape {
  const db = getDatabase();
  const members = db
    .prepare("SELECT id, name, email, color, createdAt FROM members ORDER BY createdAt ASC")
    .all()
    .map((row) => toMember(row as Record<string, unknown>));

  const tasks = db
    .prepare("SELECT id, title, description, status, priority, assigneeId, dueDate, isRecurring, recurrenceDays, maxRecurrences, recurrenceStopped, createdAt, updatedAt FROM tasks ORDER BY createdAt ASC")
    .all()
    .map((row) => toTask(row as Record<string, unknown>));

  return { members, tasks };
}

export function createMember(input: Pick<Member, "name" | "email">): Member {
  const db = getDatabase();
  const now = new Date().toISOString();
  const member: Member = {
    id: randomUUID(),
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    color: MEMBER_COLORS[0],
    createdAt: now,
  };

  db.prepare(`
    INSERT INTO members (id, name, email, color, createdAt)
    VALUES (@id, @name, @email, @color, @createdAt)
  `).run(member);

  return member;
}

export function deleteMember(id: string): boolean {
  const db = getDatabase();
  const result = db.prepare("DELETE FROM members WHERE id = ?").run(id);
  if (result.changes === 0) {
    return false;
  }

  db.prepare("UPDATE tasks SET assigneeId = NULL, updatedAt = ? WHERE assigneeId = ?").run(new Date().toISOString(), id);
  return true;
}

export function createTask(
  input: Pick<Task, "title" | "description" | "priority" | "assigneeId" | "dueDate" | "status" | "isRecurring" | "recurrenceDays" | "maxRecurrences" | "recurrenceStopped">,
): Task {
  const db = getDatabase();
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

  db.prepare(`
    INSERT INTO tasks (
      id,
      title,
      description,
      status,
      priority,
      assigneeId,
      dueDate,
      isRecurring,
      recurrenceDays,
      maxRecurrences,
      recurrenceStopped,
      createdAt,
      updatedAt
    ) VALUES (
      @id,
      @title,
      @description,
      @status,
      @priority,
      @assigneeId,
      @dueDate,
      @isRecurring,
      @recurrenceDays,
      @maxRecurrences,
      @recurrenceStopped,
      @createdAt,
      @updatedAt
    )
  `).run({
    ...task,
    isRecurring: task.isRecurring ? 1 : 0,
    recurrenceDays: task.recurrenceDays ? JSON.stringify(task.recurrenceDays) : null,
    recurrenceStopped: task.recurrenceStopped ? 1 : 0,
  });

  return task;
}

export function updateTask(
  id: string,
  input: Partial<Pick<Task, "title" | "description" | "priority" | "assigneeId" | "dueDate" | "status" | "isRecurring" | "recurrenceDays" | "maxRecurrences" | "recurrenceStopped">>,
): Task | null {
  const db = getDatabase();
  const existing = db.prepare("SELECT id FROM tasks WHERE id = ?").get(id);
  if (!existing) return null;

  const updates: string[] = [];
  const params: Record<string, unknown> = { id, updatedAt: new Date().toISOString() };

  if (input.title !== undefined) {
    updates.push("title = @title");
    params.title = input.title.trim();
  }
  if (input.description !== undefined) {
    updates.push("description = @description");
    params.description = input.description.trim();
  }
  if (input.priority !== undefined) {
    updates.push("priority = @priority");
    params.priority = input.priority;
  }
  if (input.assigneeId !== undefined) {
    updates.push("assigneeId = @assigneeId");
    params.assigneeId = input.assigneeId;
  }
  if (input.dueDate !== undefined) {
    updates.push("dueDate = @dueDate");
    params.dueDate = input.dueDate;
  }
  if (input.status !== undefined) {
    updates.push("status = @status");
    params.status = input.status;
  }
  if (input.isRecurring !== undefined) {
    updates.push("isRecurring = @isRecurring");
    params.isRecurring = input.isRecurring ? 1 : 0;
  }
  if (input.recurrenceDays !== undefined) {
    updates.push("recurrenceDays = @recurrenceDays");
    params.recurrenceDays = Array.isArray(input.recurrenceDays) ? JSON.stringify(input.recurrenceDays) : null;
  }
  if (input.maxRecurrences !== undefined) {
    updates.push("maxRecurrences = @maxRecurrences");
    params.maxRecurrences = input.maxRecurrences;
  }
  if (input.recurrenceStopped !== undefined) {
    updates.push("recurrenceStopped = @recurrenceStopped");
    params.recurrenceStopped = input.recurrenceStopped ? 1 : 0;
  }

  updates.push("updatedAt = @updatedAt");

  db.prepare(`UPDATE tasks SET ${updates.join(", ")} WHERE id = @id`).run(params);
  return getAll().tasks.find((task) => task.id === id) ?? null;
}

export function deleteTask(id: string): boolean {
  const db = getDatabase();
  const result = db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
  return result.changes > 0;
}

export function moveTask(id: string, status: TaskStatus): Task | null {
  return updateTask(id, { status });
}
