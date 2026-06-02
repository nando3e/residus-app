"use client";

import { t } from "@/lib/textos";
import TarjetaViatge from "./TarjetaViatge";
import type { Viatge, Camio } from "./TaulerClient";

interface VistaKanbanProps {
  viatges: Viatge[];
  camions: Camio[];
  modeAssignacio: boolean;
  camioActiu: Camio | null;
  viatgesSeleccionats: Set<string>;
  onClickViatge: (viatge: Viatge) => void;
}

export default function VistaKanban({
  viatges,
  camions,
  modeAssignacio,
  camioActiu,
  viatgesSeleccionats,
  onClickViatge,
}: VistaKanbanProps) {
  const senseAssignar = viatges.filter((v) => !v.camioId);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {/* Columna sense assignar */}
      <div className="w-64 shrink-0">
        <div className="bg-gray-100 rounded-xl p-3">
          <h3 className="text-sm font-semibold text-gray-600 mb-3 flex items-center justify-between">
            {t.tauler.senseAssignar}
            <span className="bg-gray-300 text-gray-700 text-xs px-2 py-0.5 rounded-full">
              {senseAssignar.length}
            </span>
          </h3>
          <div className="space-y-2">
            {senseAssignar.map((v) => (
              <TarjetaViatge
                key={v.id}
                viatge={v}
                modeAssignacio={modeAssignacio}
                camioActiu={camioActiu}
                seleccionat={viatgesSeleccionats.has(v.id)}
                onClick={() => onClickViatge(v)}
              />
            ))}
            {senseAssignar.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">Cap viatge pendent</p>
            )}
          </div>
        </div>
      </div>

      {/* Columna per cada camió */}
      {camions.map((camio) => {
        const viatgesCamio = viatges.filter((v) => v.camioId === camio.id);
        return (
          <div key={camio.id} className="w-64 shrink-0">
            <div className="rounded-xl p-3 border-2" style={{ borderColor: camio.color, backgroundColor: `${camio.color}10` }}>
              <h3 className="text-sm font-semibold mb-3 flex items-center justify-between" style={{ color: camio.color }}>
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: camio.color }} />
                  {camio.nom}
                  <span className="text-xs text-gray-500 font-normal">({camio.matricula})</span>
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: camio.color }}>
                  {viatgesCamio.length}
                </span>
              </h3>
              {camio.conductor && (
                <p className="text-xs text-gray-500 mb-2">👤 {camio.conductor.nom}</p>
              )}
              <div className="space-y-2">
                {viatgesCamio
                  .sort((a, b) => a.horaPrevista.localeCompare(b.horaPrevista))
                  .map((v) => (
                    <TarjetaViatge
                      key={v.id}
                      viatge={v}
                      camioColor={camio.color}
                      modeAssignacio={modeAssignacio}
                      camioActiu={camioActiu}
                      seleccionat={viatgesSeleccionats.has(v.id)}
                      onClick={() => onClickViatge(v)}
                    />
                  ))}
                {viatgesCamio.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-4">Sense viatges</p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
