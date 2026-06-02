"use client";

import { t } from "@/lib/textos";
import { cn } from "@/lib/utils";
import type { Camio } from "./TaulerClient";

interface BannerAssignacioProps {
  camions: Camio[];
  camioActiu: Camio | null;
  onSeleccionarCamio: (camio: Camio) => void;
  viatgesSeleccionats: number;
  onOk: () => void;
  onCancelar: () => void;
}

export default function BannerAssignacio({
  camions,
  camioActiu,
  onSeleccionarCamio,
  viatgesSeleccionats,
  onOk,
  onCancelar,
}: BannerAssignacioProps) {
  return (
    <div className="bg-amber-50 border-b border-amber-300 px-6 py-3 flex items-center gap-4 flex-wrap shrink-0">
      <span className="text-sm font-medium text-amber-800">
        {t.tauler.assignar}:
      </span>

      <div className="flex gap-2 flex-wrap">
        {camions.map((camio) => (
          <button
            key={camio.id}
            onClick={() => onSeleccionarCamio(camio)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all",
              camioActiu?.id === camio.id
                ? "text-white border-transparent scale-105 shadow-md"
                : "border-gray-300 text-gray-700 hover:border-gray-400 bg-white"
            )}
            style={camioActiu?.id === camio.id ? { backgroundColor: camio.color, borderColor: camio.color } : {}}
          >
            <span
              className="w-3 h-3 rounded-full inline-block"
              style={{ backgroundColor: camio.color }}
            />
            {camio.nom}
          </button>
        ))}
      </div>

      {camioActiu && (
        <span className="ml-2 text-sm font-semibold text-amber-900 bg-amber-100 px-3 py-1 rounded-full">
          {t.tauler.assignantA}: {camioActiu.nom} — {viatgesSeleccionats} {t.tauler.viatgesSeleccionats}
        </span>
      )}

      <div className="ml-auto flex gap-2">
        {camioActiu && viatgesSeleccionats > 0 && (
          <button
            onClick={onOk}
            className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium rounded-lg"
          >
            {t.tauler.ok}
          </button>
        )}
        <button
          onClick={onCancelar}
          className="px-4 py-1.5 bg-white hover:bg-gray-100 text-gray-700 text-sm font-medium rounded-lg border border-gray-300"
        >
          {t.tauler.cancellarAssignacio}
        </button>
      </div>
    </div>
  );
}
