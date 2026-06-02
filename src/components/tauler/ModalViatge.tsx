"use client";

import { useState, useRef } from "react";
import { t } from "@/lib/textos";
import { X, Phone, MapPin, Camera, Clock, Truck, AlertCircle, Upload, Trash2 } from "lucide-react";
import { cn, formatData } from "@/lib/utils";
import { comprimirImatge } from "@/lib/imatge";
import type { Viatge, Camio } from "./TaulerClient";

interface ModalViatgeProps {
  viatge: Viatge;
  camions: Camio[];
  onTancar: () => void;
  onActualitzar: (id: string, dades: any) => Promise<void>;
  onEliminar: (id: string) => Promise<void>;
}

export default function ModalViatge({ viatge, camions, onTancar, onActualitzar, onEliminar }: ModalViatgeProps) {
  const [camioId, setCamioId] = useState(viatge.camioId || "");
  const [horaPrevista, setHoraPrevista] = useState(viatge.horaPrevista);
  const [instruccions, setInstruccions] = useState(viatge.instruccions || "");
  const [guardant, setGuardant] = useState(false);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);
  const [eliminant, setEliminant] = useState(false);
  const [fotoAmpliada, setFotoAmpliada] = useState<string | null>(null);
  const [fotos, setFotos] = useState(viatge.fotos);
  const [pujant, setPujant] = useState(false);
  const inputFotoRef = useRef<HTMLInputElement>(null);

  async function handlePujarFotos(e: React.ChangeEvent<HTMLInputElement>) {
    const fitxers = Array.from(e.target.files || []);
    if (fitxers.length === 0) return;
    setPujant(true);
    const form = new FormData();
    for (const f of fitxers) {
      const comprimida = await comprimirImatge(f);
      form.append("foto", comprimida, (f.name.replace(/\.[^.]+$/, "") || "foto") + ".jpg");
    }
    const res = await fetch(`/api/viatges/${viatge.id}/fotos`, { method: "POST", body: form });
    if (res.ok) {
      const noves = await res.json();
      setFotos((prev) => [...prev, ...noves]);
    }
    setPujant(false);
    if (inputFotoRef.current) inputFotoRef.current.value = "";
  }

  async function esborrarFoto(fotoId: string) {
    setFotos((prev) => prev.filter((f) => f.id !== fotoId)); // optimista
    await fetch(`/api/viatges/${viatge.id}/fotos/${fotoId}`, { method: "DELETE" });
  }

  async function handleGuardar() {
    setGuardant(true);
    await onActualitzar(viatge.id, {
      camioId: camioId || null,
      horaPrevista,
      instruccions: instruccions || null,
    });
    setGuardant(false);
  }

  const camioAssignat = camions.find((c) => c.id === viatge.camioId);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Capçalera */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {camioAssignat && (
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: camioAssignat.color }}
                />
              )}
              <h2 className="text-xl font-bold text-gray-900">{viatge.client.nom}</h2>
            </div>
            <p className="text-gray-500 text-sm">{viatge.tipusResidu}</p>
          </div>
          <button onClick={onTancar} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">
            <X size={20} />
          </button>
        </div>

        {/* Cos */}
        <div className="p-6 space-y-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Dades del viatge</p>
          {/* Info bàsica */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock size={16} className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">{t.viatge.hora}</p>
                <input
                  type="time"
                  value={horaPrevista}
                  onChange={(e) => setHoraPrevista(e.target.value)}
                  className="font-medium border border-gray-300 rounded px-2 py-0.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            {(viatge.adreca || viatge.client.adreca) && (
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <MapPin size={16} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-400">{t.viatge.adreca}</p>
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(viatge.adreca || viatge.client.adreca || "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-blue-600 hover:underline"
                  >
                    {viatge.adreca || viatge.client.adreca}
                  </a>
                </div>
              </div>
            )}
            {viatge.client.telefon && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone size={16} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-400">{t.viatge.client}</p>
                  <a href={`tel:${viatge.client.telefon}`} className="font-medium text-blue-600 hover:underline">
                    {viatge.client.telefon}
                  </a>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div>
                <p className="text-xs text-gray-400">{t.viatge.estat}</p>
                <span className={cn(
                  "inline-block mt-0.5 text-xs px-2 py-0.5 rounded-full font-medium",
                  viatge.estatAssignacio === "publicat" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                )}>
                  {viatge.estatAssignacio === "publicat" ? t.tauler.publicat : t.tauler.esborrany}
                </span>
              </div>
            </div>
          </div>

          {viatge.client.instruccionsEspecials && (
            <div className="bg-amber-50 rounded-lg p-3 text-sm text-amber-800">
              ⚠️ <span className="font-medium">Client:</span> {viatge.client.instruccionsEspecials}
            </div>
          )}

          {/* Instruccions especials del viatge (editables) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              📋 {t.viatge.instruccions} (visible per al conductor)
            </label>
            <textarea
              value={instruccions}
              onChange={(e) => setInstruccions(e.target.value)}
              rows={2}
              placeholder="Ex: entrar per la porta del darrere, trucar abans d'arribar..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Assignació */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Truck size={16} className="inline mr-1" />
              {t.viatge.camio}
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setCamioId("")}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all",
                  !camioId ? "bg-gray-200 border-gray-400 text-gray-800" : "border-gray-200 text-gray-500 hover:border-gray-300"
                )}
              >
                {t.viatge.noAssignat}
              </button>
              {camions.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCamioId(c.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all",
                    camioId === c.id ? "text-white" : "text-gray-700 border-gray-200 hover:border-gray-300 bg-white"
                  )}
                  style={camioId === c.id ? { backgroundColor: c.color, borderColor: c.color } : {}}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                  {c.nom}
                </button>
              ))}
            </div>
          </div>

          {/* ===== Separador: aportacions del conductor ===== */}
          <div className="border-t border-gray-200 pt-4 flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Aportacions del conductor</p>
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-full font-medium",
              viatge.estatExecucio === "recollit_ok" ? "bg-green-100 text-green-700"
              : viatge.estatExecucio === "recollit_incidencia" ? "bg-red-100 text-red-700"
              : "bg-blue-100 text-blue-700"
            )}>
              {viatge.estatExecucio === "recollit_ok"
                ? (viatge.incidencies.length > 0 ? "Recollit amb incidència" : "Recollit")
                : viatge.estatExecucio === "recollit_incidencia"
                ? "No recollit"
                : (t.estats[viatge.estatExecucio] || viatge.estatExecucio)}
            </span>
          </div>

          {/* Fotos */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Camera size={16} />
                {t.viatge.fotos} ({fotos.length})
              </h3>
              <input
                ref={inputFotoRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handlePujarFotos}
                className="hidden"
              />
              <button
                onClick={() => inputFotoRef.current?.click()}
                disabled={pujant}
                className="flex items-center gap-1.5 text-xs bg-blue-700 hover:bg-blue-800 text-white px-3 py-1.5 rounded-lg disabled:opacity-50"
              >
                <Upload size={13} />
                {pujant ? "Pujant..." : "Afegir fotos"}
              </button>
            </div>
            {fotos.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {fotos.map((f) => (
                  <div key={f.id} className="relative shrink-0">
                    <button onClick={() => setFotoAmpliada(f.url)}>
                      <img
                        src={f.url}
                        alt="Foto"
                        loading="lazy"
                        className="w-20 h-20 object-cover rounded-lg border border-gray-200 hover:ring-2 hover:ring-blue-400"
                      />
                    </button>
                    <button
                      onClick={() => esborrarFoto(f.id)}
                      className="absolute -top-1.5 -right-1.5 bg-white rounded-full border border-gray-300 shadow p-0.5 text-gray-500 hover:text-red-600 hover:border-red-300"
                      title="Esborrar foto"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3 text-center">
                Encara no hi ha fotos. Afegeix-ne o arribaran per la bústia (Telegram/correu).
              </p>
            )}
          </div>

          {/* Incidències */}
          {viatge.incidencies.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-red-700 mb-2 flex items-center gap-1">
                <AlertCircle size={16} />
                Incidències ({viatge.incidencies.length})
              </h3>
              <div className="space-y-2">
                {viatge.incidencies.map((inc: any) => (
                  <div key={inc.id} className="bg-red-50 rounded-lg p-3 text-sm">
                    <p className="font-medium text-red-800">{t.incidencies[inc.tipus] || inc.tipus}</p>
                    {inc.detall && <p className="text-red-600 mt-0.5">{inc.detall}</p>}
                    {inc.fotoUrls?.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {inc.fotoUrls.map((url: string, i: number) => (
                          <button key={i} onClick={() => setFotoAmpliada(url)}>
                            <img src={url} alt="Foto incidència" loading="lazy" className="w-16 h-16 object-cover rounded border hover:ring-2 hover:ring-red-400" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Log de canvis */}
          {viatge.logCanvis.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">{t.viatge.historialCanvis}</h3>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {viatge.logCanvis.map((log: any) => (
                  <div key={log.id} className="text-xs text-gray-500 flex gap-2">
                    <span className="text-gray-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString("ca-ES", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span>{log.detall}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Peu */}
        <div className="flex items-center justify-between gap-3 p-6 border-t border-gray-200">
          {/* Eliminar (amb confirmació) */}
          {confirmarEliminar ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-red-700">Segur?</span>
              <button
                onClick={async () => {
                  setEliminant(true);
                  await onEliminar(viatge.id);
                }}
                disabled={eliminant}
                className="px-3 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {eliminant ? "Eliminant..." : "Sí, eliminar"}
              </button>
              <button
                onClick={() => setConfirmarEliminar(false)}
                className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmarEliminar(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
            >
              <Trash2 size={15} /> Eliminar viatge
            </button>
          )}

          <div className="flex gap-3">
            <button
              onClick={onTancar}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg border border-gray-300"
            >
              {t.viatge.tancar}
            </button>
            <button
              onClick={handleGuardar}
              disabled={guardant}
              className="px-4 py-2 text-sm bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-medium disabled:opacity-50"
            >
              {guardant ? "Guardant..." : t.viatge.guardar}
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox foto ampliada */}
      {fotoAmpliada && (
        <div
          className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4"
          onClick={() => setFotoAmpliada(null)}
        >
          <button
            onClick={() => setFotoAmpliada(null)}
            className="absolute top-4 right-4 text-white/80 hover:text-white"
          >
            <X size={28} />
          </button>
          <img
            src={fotoAmpliada}
            alt="Foto ampliada"
            className="max-w-full max-h-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
