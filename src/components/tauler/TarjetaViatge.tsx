"use client";

import { cn } from "@/lib/utils";
import { t } from "@/lib/textos";
import { AlertCircle, Clock, Camera, Repeat } from "lucide-react";
import type { Viatge, Camio } from "./TaulerClient";

interface TarjetaViatgeProps {
  viatge: Viatge;
  camioColor?: string;
  modeAssignacio?: boolean;
  camioActiu?: Camio | null;
  seleccionat?: boolean;
  onClick: () => void;
  compact?: boolean;
}

export default function TarjetaViatge({
  viatge,
  camioColor,
  modeAssignacio,
  camioActiu,
  seleccionat,
  onClick,
  compact = false,
}: TarjetaViatgeProps) {
  const hihaIncidencia = viatge.incidencies.length > 0;
  const esBorrador = viatge.estatAssignacio === "esborrany";
  const perEliminar = viatge.pendentEliminar;
  const color = seleccionat && camioActiu ? camioActiu.color : (camioColor || "#9CA3AF");
  const tensFotos = viatge.fotos.length > 0;

  const completat = ["recollit_ok", "descarrega_completada"].includes(viatge.estatExecucio);
  const noRecollit = viatge.estatExecucio === "recollit_incidencia";
  const assignat = !!viatge.camioId;
  const bgClass = perEliminar
    ? "bg-red-300"
    : completat
    ? "bg-green-50"
    : assignat || noRecollit
    ? "bg-orange-50"
    : "bg-red-100";

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-lg p-2.5 transition-all border-2 hover:shadow-md",
        bgClass,
        modeAssignacio && "cursor-pointer",
        seleccionat ? "shadow-lg scale-[1.02] ring-2 ring-offset-1" : "shadow-sm",
        esBorrador ? "border-dashed" : "border-solid",
        hihaIncidencia && "ring-1 ring-red-400",
        perEliminar && "ring-2 ring-red-600"
      )}
      style={{
        borderColor: color,
        ...(seleccionat ? { ringColor: color } : {}),
      }}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 mb-0.5">
            <span className={cn("text-xs font-semibold text-gray-700 truncate", perEliminar && "line-through")}>
              {viatge.clientOcasional || viatge.client?.nom}
            </span>
            {perEliminar && <span className="text-[8px] font-bold text-red-700 bg-red-200 rounded px-1 shrink-0">ELIMINAR</span>}
          </div>
          {!compact && (
            <p className="text-xs text-gray-500 truncate">{viatge.tipusResidu}</p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {viatge.serieId && <Repeat size={11} className="text-blue-500" />}
          {tensFotos && <Camera size={11} className="text-blue-400" />}
          {hihaIncidencia && <AlertCircle size={12} className="text-red-500" />}
          <div className="flex items-center gap-0.5 text-xs text-gray-500">
            <Clock size={11} />
            <span>{viatge.horaPrevista}</span>
          </div>
        </div>
      </div>

      {!compact && (
        <div className="mt-1 flex items-center gap-2">
          <span className={cn(
            "text-xs px-1.5 py-0.5 rounded-full",
            viatge.estatExecucio === "descarrega_completada"
              ? "bg-green-100 text-green-700"
              : viatge.estatExecucio === "pendent"
              ? "bg-gray-100 text-gray-600"
              : "bg-blue-100 text-blue-700"
          )}>
            {t.estats[viatge.estatExecucio] || viatge.estatExecucio}
          </span>
          {esBorrador && (
            <span className="text-xs text-amber-600 font-medium">{t.tauler.esborrany}</span>
          )}
        </div>
      )}
    </button>
  );
}
