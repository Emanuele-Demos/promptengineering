"use client";

import { useState } from "react";
import type { Member } from "@/lib/types";
import MemberModal from "./MemberModal";

interface TeamPanelProps {
  members: Member[];
  onRefresh: () => void;
}

export default function TeamPanel({ members, onRefresh }: TeamPanelProps) {
  const [modalOpen, setModalOpen] = useState(false);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Rimuovere ${name} dal team?`)) return;
    await fetch(`/api/members/${id}`, { method: "DELETE" });
    onRefresh();
  }

  return (
    <aside className="w-full shrink-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 lg:w-72">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold text-slate-800 dark:text-slate-100">Team</h2>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-600 transition hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-400 dark:hover:bg-indigo-900"
        >
          + Aggiungi
        </button>
      </div>

      <ul className="space-y-2">
        {members.map((member) => (
          <li
            key={member.id}
            className="group flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: member.color }}
            >
              {member.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                {member.name}
              </p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                {member.email}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleDelete(member.id, member.name)}
              className="rounded p-1 text-slate-300 opacity-0 transition group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950"
              aria-label={`Rimuovi ${member.name}`}
            >
              ×
            </button>
          </li>
        ))}

        {members.length === 0 && (
          <p className="py-4 text-center text-sm text-slate-400">
            Nessun membro — aggiungi il tuo team
          </p>
        )}
      </ul>

      {modalOpen && (
        <MemberModal
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            onRefresh();
          }}
        />
      )}
    </aside>
  );
}
