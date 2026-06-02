"use client";

import { useState, useRef } from "react";
import { Camera, StickyNote, Check } from "lucide-react";

interface AfegirFotoNotaProps {
  viatgeId: string;
  onCanvi: () => Promise<void>;
}

export default function AfegirFotoNota({ viatgeId, onCanvi }: AfegirFotoNotaProps) {
  const [nota, setNota] = useState("");
  const [pujant, setPujant] = useState(false);
  const [desant, setDesant] = useState(false);
  const [desada, setDesada] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFotos(e: React.ChangeEvent<HTMLInputElement>) {
    const fitxers = Array.from(e.target.files || []);
    if (fitxers.length === 0) return;
    setPujant(true);
    const form = new FormData();
    fitxers.forEach((f) => form.append("foto", f));
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
    </div>
  );
}
