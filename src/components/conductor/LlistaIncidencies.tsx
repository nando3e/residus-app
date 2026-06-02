"use client";

import { useState } from "react";
import { AlertCircle, Pencil, Check, X } from "lucide-react";
import { t } from "@/lib/textos";

interface Incidencia {
  id: string;
  tipus: string;
  detall?: string;
  timestamp: string;
}

interface LlistaIncidenciesProps {
  viatgeId: string;
  incidencies: Incidencia[];
  onCanvi: () => Promise<void>;
}

export default function LlistaIncidencies({ viatgeId, incidencies, onCanvi }: LlistaIncidenciesProps) {
  const [editant, setEditant] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [desant, setDesant] = useState(false);

  async function desar(incId: string) {
    setDesant(true);
    await fetch(`/api/viatges/${viatgeId}/incidencia/${incId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ detall: text }),
    });
    setDesant(false);
    setEditant(null);
    await onCanvi();
  }

  if (incidencies.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-gray-500 flex items-center gap-1">
        <AlertCircle size={13} className="text-red-500" /> Incidències ({incidencies.length})
      </p>
      {incidencies.map((inc) => (
        <div key={inc.id} className="bg-red-50 rounded-xl px-3 py-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="font-medium text-red-800">{t.incidencies[inc.tipus] || inc.tipus}</span>
            <span className="text-xs text-red-400">
              {new Date(inc.timestamp).toLocaleString("ca-ES", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>

          {editant === inc.id ? (
            <div className="mt-1 flex gap-1">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="flex-1 border border-red-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                autoFocus
              />
              <button onClick={() => desar(inc.id)} disabled={desant} className="p-1.5 bg-red-600 text-white rounded-lg">
                <Check size={14} />
              </button>
              <button onClick={() => setEditant(null)} className="p-1.5 bg-white border border-gray-300 rounded-lg text-gray-500">
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-2 mt-0.5">
              <span className="text-red-600">{inc.detall || "—"}</span>
              <button
                onClick={() => { setEditant(inc.id); setText(inc.detall || ""); }}
                className="shrink-0 text-red-400 hover:text-red-700"
                title="Editar"
              >
                <Pencil size={13} />
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
