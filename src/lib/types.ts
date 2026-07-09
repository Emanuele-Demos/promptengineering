export type TaskStatus = "todo" | "in_progress" | "done";
export type Priority = "low" | "medium" | "high";

export interface Member {
  id: string;
  name: string;
  email: string;
  color: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  assigneeId: string | null;
  dueDate: string | null;
  isRecurring?: boolean;
  recurrenceDays?: number[]; // 0 = Domenica, 1 = Lunedì, ecc.
  maxRecurrences?: number;
  recurrenceStopped?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Database {
  members: Member[];
  tasks: Task[];
}

export const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: "todo", label: "Da fare" },
  { id: "in_progress", label: "In corso" },
  { id: "done", label: "Completato" },
];

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: "Bassa",
  medium: "Media",
  high: "Alta",
};

export const MEMBER_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f97316",
  "#14b8a6",
  "#3b82f6",
  "#eab308",
  "#ef4444",
];
