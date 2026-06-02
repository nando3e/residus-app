"use client";

import { cn } from "@/lib/utils";
import TarjetaViatge from "./TarjetaViatge";
import type { Viatge, Camio } from "./TaulerClient";

interface VistaCalendariProps {
  viatges: Viatge[];
  camions: Camio[];
  modeAssignacio: boolean;
  camioActiu: Camio | null;
  viatgesSeleccionats: Set<string>;
  onClickViatge: (viatge: Viatge) => void;
}

// Franges horàries de 7h a 20h
const HORES = Array.from({ length: 14 }, (_, i) => `${String(i + 7).padStart(2, "0")}:00`);

function horaAMinuts(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

export default function VistaCalendari({
  viatges,
  camions,
  modeAssignacio,
  camioActiu,
  viatgesSeleccionats,
  onClickViatge,
}: VistaCalendariProps) {
  const senseAssignar = viatges.filter((v) => !v.camioId);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Capçalera de columnes */}
        <div className="flex border-b border-gray-200 bg-white sticky top-0 z-10">
          <div className="w-16 shrink-0" />
          <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${camions.length + 1}, 1fr)` }}>
            <div className="px-2 py-2 text-xs font-semibold text-gray-500 text-center border-r border-gray-100">
              Sense assignar ({senseAssignar.length})
            </div>
            {camions.map((camio) => {
              const count = viatges.filter((v) => v.camioId === camio.id).length;
              return (
                <div key={camio.id} className="px-2 py-2 text-xs font-semibold text-center border-r border-gray-100">
                  <span className="flex items-center justify-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: camio.color }} />
                    <span style={{ color: camio.color }}>{camio.nom}</span>
                    <span className="text-gray-400">({count})</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Graella de hores */}
        <div className="relative">
          {HORES.map((hora) => {
            const minutsHora = horaAMinuts(hora);
            return (
              <div key={hora} className="flex min-h-[80px] border-b border-gray-100">
                <div className="w-16 shrink-0 text-xs text-gray-400 pt-1 px-2 font-mono">{hora}</div>
                <div className="flex-1 grid border-l border-gray-100" style={{ gridTemplateColumns: `repeat(${camions.length + 1}, 1fr)` }}>
                  {/* Columna sense assignar */}
                  <div className="border-r border-gray-100 p-1 space-y-1">
                    {senseAssignar
                      .filter((v) => {
                        const m = horaAMinuts(v.horaPrevista);
                        return m >= minutsHora && m < minutsHora + 60;
                      })
                      .map((v) => (
                        <TarjetaViatge
                          key={v.id}
                          viatge={v}
                          modeAssignacio={modeAssignacio}
                          camioActiu={camioActiu}
                          seleccionat={viatgesSeleccionats.has(v.id)}
                          onClick={() => onClickViatge(v)}
                          compact
                        />
                      ))}
                  </div>
                  {/* Columnes per camió */}
                  {camions.map((camio) => (
                    <div key={camio.id} className="border-r border-gray-100 p-1 space-y-1">
                      {viatges
                        .filter((v) => {
                          if (v.camioId !== camio.id) return false;
                          const m = horaAMinuts(v.horaPrevista);
                          return m >= minutsHora && m < minutsHora + 60;
                        })
                        .map((v) => (
                          <TarjetaViatge
                            key={v.id}
                            viatge={v}
                            camioColor={camio.color}
                            modeAssignacio={modeAssignacio}
                            camioActiu={camioActiu}
                            seleccionat={viatgesSeleccionats.has(v.id)}
                            onClick={() => onClickViatge(v)}
                            compact
                          />
                        ))}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Viatges fora de rang horari */}
          {viatges.filter((v) => {
            const m = horaAMinuts(v.horaPrevista);
            return m < 7 * 60 || m >= 20 * 60;
          }).length > 0 && (
            <div className="flex border-b border-gray-100 bg-yellow-50">
              <div className="w-16 shrink-0 text-xs text-gray-400 pt-1 px-2">Altres</div>
              <div className="flex-1 p-2 flex flex-wrap gap-2">
                {viatges
                  .filter((v) => {
                    const m = horaAMinuts(v.horaPrevista);
                    return m < 7 * 60 || m >= 20 * 60;
                  })
                  .map((v) => {
                    const camio = camions.find((c) => c.id === v.camioId);
                    return (
                      <TarjetaViatge
                        key={v.id}
                        viatge={v}
                        camioColor={camio?.color}
                        modeAssignacio={modeAssignacio}
                        camioActiu={camioActiu}
                        seleccionat={viatgesSeleccionats.has(v.id)}
                        onClick={() => onClickViatge(v)}
                      />
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
