"use client";

import { useCallback, useEffect, useState } from "react";
import type { Member, Task } from "@/lib/types";
import KanbanBoard from "@/components/KanbanBoard";
import TeamPanel from "@/components/TeamPanel";

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [tasksRes, membersRes] = await Promise.all([
      fetch("/api/tasks"),
      fetch("/api/members"),
    ]);
    setTasks(await tasksRes.json());
    setMembers(await membersRes.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const stats = {
    total: tasks.length,
    inProgress: tasks.filter((t) => t.status === "in_progress").length,
    done: tasks.filter((t) => t.status === "done").length,
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white">
              T
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">TeamFlow</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gestione task del team
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-6 sm:flex">
            <Stat label="Task totali" value={stats.total} />
            <Stat label="In corso" value={stats.inProgress} accent />
            <Stat label="Completati" value={stats.done} success />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4 sm:p-6 lg:flex-row">
        <div className="flex flex-col gap-6 lg:w-80 shrink-0">
          <TeamPanel members={members} onRefresh={refresh} />
          <RecurrenceCalendar tasks={tasks} />
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          {loading ? (
            <div className="flex flex-1 items-center justify-center">
               <p className="text-slate-400">Caricamento...</p>
            </div>
          ) : (
            <KanbanBoard tasks={tasks} members={members} onRefresh={refresh} />
          )}
        </div>
      </main>
    </div>
  );
}

const WEEKDAYS = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];

interface FutureOccurrence {
  taskId: string;
  taskTitle: string;
  date: Date;
  stopped: boolean;
}

function getFutureOccurrences(tasks: Task[], limitDays = 30): FutureOccurrence[] {
  const occurrences: FutureOccurrence[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Consider recurring tasks
  const recurringTasks = tasks.filter((t) => t.isRecurring && t.recurrenceDays && t.recurrenceDays.length > 0);

  for (const task of recurringTasks) {
    const daysOfWeek = task.recurrenceDays || [];
    const maxRepetitions = task.maxRecurrences;
    const isStopped = !!task.recurrenceStopped;

    // Start generating from the task's due date, or from today if no due date
    let startDate = task.dueDate ? new Date(task.dueDate) : new Date(task.createdAt);
    startDate.setHours(0, 0, 0, 0);

    // If start date is in the past compared to today, we still generate occurrences starting from start date
    // to match occurrences count, but we will filter or display based on current date.
    let current = new Date(startDate);
    let count = 0;
    let occurrencesFound = 0;

    // Let's generate up to 100 occurrences to find matching days, capping at maxRepetitions or limitDays
    const maxIterations = 365; // safety guard
    for (let i = 0; i < maxIterations; i++) {
      if (maxRepetitions !== undefined && count >= maxRepetitions) {
        break;
      }

      const dayVal = current.getDay();
      if (daysOfWeek.includes(dayVal)) {
        // This is a matching weekday.
        count++;

        // Only show future occurrences (starting from today)
        if (current >= today) {
          occurrences.push({
            taskId: task.id,
            taskTitle: task.title,
            date: new Date(current),
            stopped: isStopped,
          });
          occurrencesFound++;
        }
      }

      // Move to next day
      current.setDate(current.getDate() + 1);

      // Stop if we went too far into the future (e.g. limitDays)
      const diffTime = Math.abs(current.getTime() - today.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > limitDays) {
        break;
      }
    }
  }

  // Sort by date ascending
  return occurrences.sort((a, b) => a.date.getTime() - b.date.getTime());
}

function RecurrenceCalendar({ tasks }: { tasks: Task[] }) {
  const occurrences = getFutureOccurrences(tasks);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Calendario Occorrenze
        </h2>
        <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
          Prossimi 30gg
        </span>
      </div>

      {occurrences.length === 0 ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Nessuna ricorrenza futura programmata.
        </p>
      ) : (
        <div className="max-h-[300px] overflow-y-auto space-y-3 pr-1">
          {occurrences.map((occ, idx) => (
            <div
              key={`${occ.taskId}-${idx}`}
              className={`flex items-start gap-2.5 rounded-lg border p-2.5 text-xs transition ${
                occ.stopped
                  ? "border-rose-100 bg-rose-50/50 text-slate-400 line-through dark:border-rose-950/30 dark:bg-rose-950/10"
                  : "border-slate-100 bg-slate-50/50 text-slate-800 dark:border-slate-800/60 dark:bg-slate-900/40 dark:text-slate-200"
              }`}
            >
              <div className="flex flex-col items-center justify-center rounded bg-white px-2 py-1 shadow-sm font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300 min-w-[40px]">
                <span className="text-[10px] uppercase font-semibold text-indigo-500">
                  {WEEKDAYS[occ.date.getDay()].slice(0, 3)}
                </span>
                <span className="text-sm">
                  {occ.date.getDate()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{occ.taskTitle}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {occ.date.toLocaleDateString("it-IT", { month: "long", year: "numeric" })}
                  {occ.stopped && <span className="ml-1.5 text-rose-600 dark:text-rose-400 font-bold">(Interrotta)</span>}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
  success,
}: {
  label: string;
  value: number;
  accent?: boolean;
  success?: boolean;
}) {
  return (
    <div className="text-center">
      <p
        className={`text-2xl font-bold ${
          success
            ? "text-emerald-600 dark:text-emerald-400"
            : accent
              ? "text-indigo-600 dark:text-indigo-400"
              : "text-slate-800 dark:text-slate-100"
        }`}
      >
        {value}
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}
