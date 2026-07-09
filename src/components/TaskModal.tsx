"use client";

import { useState } from "react";
import type { Member, Priority, Task, TaskStatus } from "@/lib/types";
import { COLUMNS, PRIORITY_LABELS } from "@/lib/types";

interface TaskModalProps {
  task: Task | null;
  defaultStatus: TaskStatus;
  members: Member[];
  onClose: () => void;
  onSaved: () => void;
}

export default function TaskModal({
  task,
  defaultStatus,
  members,
  onClose,
  onSaved,
}: TaskModalProps) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [priority, setPriority] = useState<Priority>(task?.priority ?? "medium");
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? defaultStatus);
  const [assigneeId, setAssigneeId] = useState(task?.assigneeId ?? "");
  const [dueDate, setDueDate] = useState(task?.dueDate?.slice(0, 10) ?? "");
  const [isRecurring, setIsRecurring] = useState(task?.isRecurring ?? false);
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>(task?.recurrenceDays ?? []);
  const [maxRecurrences, setMaxRecurrences] = useState<string>(task?.maxRecurrences?.toString() ?? "");
  const [recurrenceStopped, setRecurrenceStopped] = useState(task?.recurrenceStopped ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Il titolo è obbligatorio");
      return;
    }
    if (isRecurring && recurrenceDays.length === 0) {
      setError("Seleziona almeno un giorno della settimana per la ricorrenza");
      return;
    }

    setSaving(true);
    setError("");

    const payload = {
      title,
      description,
      priority,
      status,
      assigneeId: assigneeId || null,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      isRecurring,
      recurrenceDays,
      maxRecurrences: maxRecurrences ? parseInt(maxRecurrences, 10) : null,
      recurrenceStopped,
    };

    const res = task
      ? await fetch(`/api/tasks/${task.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Errore durante il salvataggio");
      return;
    }

    onSaved();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-5 text-xl font-semibold text-slate-900 dark:text-white">
          {task ? "Modifica task" : "Nuovo task"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Titolo *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              placeholder="Es. Preparare presentazione cliente"
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Descrizione
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              placeholder="Dettagli aggiuntivi..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Stato
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              >
                {COLUMNS.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Priorità
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              >
                {(Object.keys(PRIORITY_LABELS) as Priority[]).map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_LABELS[p]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Assegnato a
              </label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              >
                <option value="">Nessuno</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Scadenza / Inizio Ricorrenza
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isRecurring"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="isRecurring" className="text-sm font-semibold text-slate-900 dark:text-white">
                Rendi questo task ricorrente
              </label>
            </div>

            {isRecurring && (
              <div className="mt-3 space-y-3 border-t border-slate-200 pt-3 dark:border-slate-800">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Seleziona i giorni della settimana *
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {[
                      { label: "Dom", value: 0 },
                      { label: "Lun", value: 1 },
                      { label: "Mar", value: 2 },
                      { label: "Mer", value: 3 },
                      { label: "Gio", value: 4 },
                      { label: "Ven", value: 5 },
                      { label: "Sab", value: 6 },
                    ].map((day) => {
                      const selected = recurrenceDays.includes(day.value);
                      return (
                        <button
                          type="button"
                          key={day.value}
                          onClick={() => {
                            if (selected) {
                              setRecurrenceDays(recurrenceDays.filter((d) => d !== day.value));
                            } else {
                              setRecurrenceDays([...recurrenceDays, day.value].sort());
                            }
                          }}
                          className={`rounded-lg px-2.5 py-1 text-xs font-medium border transition ${
                            selected
                              ? "bg-indigo-600 border-indigo-600 text-white"
                              : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Ripetizioni max (opzionale)
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="Nessun limite"
                      value={maxRecurrences}
                      onChange={(e) => setMaxRecurrences(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  {task && (
                    <div className="flex flex-col justify-end">
                      <div className="flex items-center gap-2 pb-2">
                        <input
                          type="checkbox"
                          id="recurrenceStopped"
                          checked={recurrenceStopped}
                          onChange={(e) => setRecurrenceStopped(e.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                        />
                        <label htmlFor="recurrenceStopped" className="text-xs font-semibold text-rose-700 dark:text-rose-400">
                          Interrompi ricorrenza
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? "Salvataggio..." : task ? "Salva" : "Crea task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
