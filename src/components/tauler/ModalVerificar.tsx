"use client";

import { t } from "@/lib/textos";
import { X, Send, CheckCircle2 } from "lucide-react";
import { formatData } from "@/lib/utils";
import type { Viatge, Camio } from "./TaulerClient";

interface ModalVerificarProps {
  viatges: Viatge[];
  camions: Camio[];
  dia?: string;
  onPublicar: () => void;
  onTancar: () => void;
  jaPublicada: boolean;
}

export default function ModalVerificar({ viatges, camions, dia, onPublicar, onTancar, jaPublicada }: ModalVerificarProps) {
  const senseAssignar = viatges.filter((v) => !v.camioId);
  // Viatges assignats pendents de publicar (en borrador)
  const pendentsDePublicar = viatges.filter((v) => v.camioId && v.estatAssignacio === "esborrany");

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {t.tauler.verificarAssignacions}
            {dia && <span className="text-base font-normal text-gray-500 ml-2">· {formatData(dia)}</span>}
          </h2>
          <button onClick={onTancar} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {senseAssignar.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
              ⚠️ {senseAssignar.length} viatge{senseAssignar.length > 1 ? "s" : ""} sense assignar
            </div>
          )}

          {camions.map((camio) => {
            const viatgesCamio = viatges.filter((v) => v.camioId === camio.id);
            if (viatgesCamio.length === 0) return null;
            return (
              <div key={camio.id} className="rounded-xl border-2 overflow-hidden" style={{ borderColor: camio.color }}>
                <div className="px-4 py-2 flex items-center gap-2" style={{ backgroundColor: `${camio.color}20` }}>
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: camio.color }} />
                  <span className="font-semibold text-sm" style={{ color: camio.color }}>
                    {camio.nom} — {viatgesCamio.length} viatge{viatgesCamio.length > 1 ? "s" : ""}
                  </span>
                  {camio.conductor && (
                    <span className="text-xs text-gray-500 ml-auto">👤 {camio.conductor.nom}</span>
                  )}
                </div>
                <div className="divide-y divide-gray-100">
                  {viatgesCamio
                    .sort((a, b) => a.horaPrevista.localeCompare(b.horaPrevista))
                    .map((v) => (
                      <div key={v.id} className="px-4 py-2 flex items-center gap-3 text-sm">
                        <span className="font-mono text-gray-500 w-12">{v.horaPrevista}</span>
                        <span className="font-medium text-gray-800">{v.client.nom}</span>
                        <span className="text-gray-500">{v.tipusResidu}</span>
                        {v.estatAssignacio === "publicat" && (
                          <CheckCircle2 size={14} className="text-green-500 ml-auto" />
                        )}
                      </div>
                    ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button onClick={onTancar} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg border border-gray-300">
            Tancar
          </button>
          {pendentsDePublicar.length > 0 && (
            <button
              onClick={onPublicar}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
            >
              <Send size={15} />
              {jaPublicada ? "Publicar canvis" : t.tauler.publicarJornada}
              <span className="bg-white/25 rounded-full px-1.5">{pendentsDePublicar.length}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
