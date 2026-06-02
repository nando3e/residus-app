"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface FormulariDescàrregaProps {
  viatgeId: string;
  onTancar: () => void;
  onEnviat: () => Promise<void>;
}

export default function FormulariDescàrrega({ viatgeId, onTancar, onEnviat }: FormulariDescàrregaProps) {
  const [pesReal, setPesReal] = useState("");
  const [observacions, setObservacions] = useState("");
  const [enviant, setEnviant] = useState(false);

  async function handleEnviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviant(true);

    await fetch(`/api/viatges/${viatgeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        estatExecucio: "descarrega_completada",
        pesReal: pesReal ? parseFloat(pesReal) : undefined,
        observacions: observacions || undefined,
      }),
    });

    setEnviant(false);
    await onEnviat();
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center">
      <div className="bg-white rounded-t-3xl w-full max-w-lg">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">🏭 Descàrrega completada</h2>
          <button onClick={onTancar} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleEnviar} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pes real (kg) — opcional</label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={pesReal}
              onChange={(e) => setPesReal(e.target.value)}
              placeholder="Ex: 450.5"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observacions — opcional</label>
            <textarea
              value={observacions}
              onChange={(e) => setObservacions(e.target.value)}
              rows={3}
              placeholder="Ex: Cartró molt humit, pes el doble de l'habitual"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onTancar} className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50">
              Cancel·lar
            </button>
            <button type="submit" disabled={enviant} className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold disabled:opacity-50">
              {enviant ? "Tancant..." : "Tancar viatge"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
