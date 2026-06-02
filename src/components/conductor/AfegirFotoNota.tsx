"use client";

import { useState, useRef } from "react";
import { Camera, StickyNote, Check, ChevronDown, ChevronUp } from "lucide-react";
import { comprimirImatge } from "@/lib/imatge";

interface NotaDesada {
  id: string;
  detall: string;
  timestamp: string | Date;
}

interface AfegirFotoNotaProps {
  viatgeId: string;
  onCanvi: () => Promise<void>;
  notes?: NotaDesada[];
}

export default function AfegirFotoNota({ viatgeId, onCanvi, notes = [] }: AfegirFotoNotaProps) {
  const [nota, setNota] = useState("");
  const [pujant, setPujant] = useState(false);
  const [desant, setDesant] = useState(false);
  const [desada, setDesada] = useState(false);
  const [historialObert, setHistorialObert] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFotos(e: React.ChangeEvent<HTMLInputElement>) {
    const fitxers = Array.from(e.target.files || []);
    if (fitxers.length === 0) return;
    setPujant(true);
    const form = new FormData();
    for (const f of fitxers) {
      const comprimida = await comprimirImatge(f);
      form.append("foto", comprimida, (f.name.replace(/\.[^.]+$/, "") || "foto") + ".jpg");
    }
    await fetch(`/api/viatges/${viatgeId}/fotos`, { method: "POST", body: form });
    setPujant(false);
    if (inputRef.current) inputRef.current.value = "";
    await onCanvi();
  }

  async function handleDesarNota() {
    if (!nota.trim()) return;
    setDesant(true);
    await fetch(`/api/viatges/${viatgeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nota }),
    });
    setNota("");
    setDesant(false);
    setDesada(true);
    setTimeout(() => setDesada(false), 2000);
    await onCanvi();
  }

  return (
    <div className="bg-gray-50 rounded-xl p-3 space-y-2">
      <p className="text-xs font-medium text-gray-500">Afegir foto o nota</p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        onChange={handleFotos}
        className="hidden"
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={pujant}
        className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-xl py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
      >
        <Camera size={16} />
        {pujant ? "Pujant..." : "Fer foto / adjuntar"}
      </button>

      <div className="flex gap-2">
        <textarea
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          rows={2}
          placeholder="Escriu una nota (opcional)..."
          className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        <button
          onClick={handleDesarNota}
          disabled={desant || !nota.trim()}
          className="shrink-0 self-stretch flex items-center gap-1 bg-blue-700 hover:bg-blue-800 text-white rounded-xl px-3 text-sm font-medium disabled:opacity-40"
        >
          {desada ? <Check size={16} /> : <StickyNote size={16} />}
        </button>
      </div>
      {desada && <p className="text-xs text-green-600">Nota desada ✓</p>}

      {notes.length > 0 && (
        <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
          <button
            type="button"
            onClick={() => setHistorialObert((v) => !v)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            <span className="flex items-center gap-1.5">
              <StickyNote size={14} className="text-gray-500" />
              Notes desades ({notes.length})
            </span>
            {historialObert ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {historialObert && (
            <div className="max-h-32 overflow-y-auto border-t border-gray-100 divide-y divide-gray-100">
              {notes.map((n) => (
                <div key={n.id} className="px-3 py-2 text-xs text-gray-700 flex gap-2">
                  <span className="text-gray-400 whitespace-nowrap tabular-nums">
                    {new Date(n.timestamp).toLocaleTimeString("ca-ES", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="break-words">{n.detall}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
