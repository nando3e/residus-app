"use client";

import { Repeat, X } from "lucide-react";

interface ModalAbastSerieProps {
  accio: "eliminar" | "modificar";
  onTriar: (scope: "un" | "serie") => void;
  onCancelar: () => void;
}

// Pregunta, per a un viatge que forma part d'una sèrie, si l'acció afecta
// només aquest viatge o tota la sèrie (els pendents d'avui en endavant).
export default function ModalAbastSerie({ accio, onTriar, onCancelar }: ModalAbastSerieProps) {
  const verb = accio === "eliminar" ? "eliminar" : "modificar";
  return (
    <div className="fixed inset-0 bg-black/50 z-[55] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
            <Repeat size={18} className="text-blue-700" />
            Viatge repetit
          </h2>
          <button onClick={onCancelar} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-600">
            Aquest viatge forma part d&apos;una sèrie. Què vols {verb}?
          </p>

          <div className="space-y-2">
            <button
              onClick={() => onTriar("un")}
              className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-sm font-medium text-gray-800"
            >
              Només aquest viatge
            </button>
            <button
              onClick={() => onTriar("serie")}
              className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-sm font-medium text-gray-800"
            >
              Tota la sèrie
              <span className="block text-xs font-normal text-gray-500 mt-0.5">
                Afecta els viatges pendents d&apos;avui en endavant
              </span>
            </button>
          </div>

          <div className="flex justify-end pt-1">
            <button
              onClick={onCancelar}
              className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel·lar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
