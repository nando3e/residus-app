"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface PopupNoRecollitProps {
  viatgeId: string;
  onTancar: () => void;
  onFet: () => Promise<void>;
}

export default function PopupNoRecollit({ viatgeId, onTancar, onFet }: PopupNoRecollitProps) {
  const [tipus, setTipus] = useState<"client_tancat" | "altra" | "">("");
  const [motiu, setMotiu] = useState("");
  const [enviant, setEnviant] = useState(false);

  async function confirmar() {
    if (!tipus) return;
    if (tipus === "altra" && !motiu.trim()) return;
    setEnviant(true);

    // GPS opcional
    let lat: number | undefined, lng: number | undefined;
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 4000 })
      );
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
    } catch {}

    // 1) registra la incidència (i, si és client_tancat, notifica el gestor)
    await fetch(`/api/viatges/${viatgeId}/incidencia`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipus, detall: tipus === "altra" ? motiu : "Client tancat / ningú", lat, lng }),
    });

    // 2) marca el viatge com a NO recollit
    await fetch(`/api/viatges/${viatgeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estatExecucio: "recollit_incidencia" }),
    });

    setEnviant(false);
    await onFet();
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center">
      <div className="bg-white rounded-t-3xl w-full max-w-lg">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">No recollit — motiu</h2>
          <button onClick={onTancar} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <button
            onClick={() => setTipus("client_tancat")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left ${
              tipus === "client_tancat" ? "border-red-500 bg-red-50" : "border-gray-200"
            }`}
          >
            <span className="text-xl">🔒</span>
            <span className="font-medium text-gray-800">Client tancat / ningú</span>
          </button>

          <button
            onClick={() => setTipus("altra")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left ${
              tipus === "altra" ? "border-red-500 bg-red-50" : "border-gray-200"
            }`}
          >
            <span className="text-xl">📝</span>
            <span className="font-medium text-gray-800">Altres (escriure motiu)</span>
          </button>

          {tipus === "altra" && (
            <textarea
              value={motiu}
              onChange={(e) => setMotiu(e.target.value)}
              rows={2}
              autoFocus
              placeholder="Escriu el motiu..."
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            />
          )}

          <button
            onClick={confirmar}
            disabled={enviant || !tipus || (tipus === "altra" && !motiu.trim())}
            className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl py-3.5 font-semibold disabled:opacity-40"
          >
            {enviant ? "Desant..." : "Confirmar no recollit"}
          </button>
        </div>
      </div>
    </div>
  );
}
