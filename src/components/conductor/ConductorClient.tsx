"use client";

import { useState, useEffect } from "react";
import { t } from "@/lib/textos";
import { MapPin, Phone, Package, Clock, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import FormulariIncidencia from "./FormulariIncidencia";
import AfegirFotoNota from "./AfegirFotoNota";
import PopupNoRecollit from "./PopupNoRecollit";
import LlistaIncidencies from "./LlistaIncidencies";

interface Viatge {
  id: string;
  client: { nom: string; telefon?: string; adreca?: string; instruccionsEspecials?: string };
  tipusResidu: string;
  horaPrevista: string;
  adreca?: string;
  instruccions?: string;
  estatExecucio: string;
  estatAssignacio: string;
  fotos: { id: string; url: string }[];
  incidencies: any[];
}

// Nivell de progrés de cada estat (per saber què ja s'ha fet i què toca)
const NIVELL: Record<string, number> = {
  pendent: 0,
  en_cami: 1,
  arribat: 2,
  recollit_ok: 3,
  recollit_incidencia: 3,
  a_planta: 3,
  descarrega_completada: 3,
};

// Botons del flux, en ordre cronològic
type AccioBoto = {
  nivell: number;
  label: string;
  estat?: string; // canvi directe d'estat
  noRecollit?: boolean; // obre popup motiu de no recollida
  to: "blue" | "green" | "red";
};
const BOTONS: AccioBoto[] = [
  { nivell: 1, label: "En camí", estat: "en_cami", to: "blue" },
  { nivell: 2, label: "Arribada a client", estat: "arribat", to: "blue" },
  { nivell: 3, label: "Recollit", estat: "recollit_ok", to: "green" },
  { nivell: 3, label: "No recollit", noRecollit: true, to: "red" },
];

interface ConductorClientProps {
  userId: string;
}

export default function ConductorClient({ userId }: ConductorClientProps) {
  const [viatges, setViatges] = useState<Viatge[]>([]);
  const [carregant, setCarregant] = useState(true);
  const [expandit, setExpandit] = useState<string | null>(null);
  const [mostrarIncidencia, setMostrarIncidencia] = useState<string | null>(null);
  const [mostrarNoRecollit, setMostrarNoRecollit] = useState<string | null>(null);

  async function carregarViatges() {
    setCarregant(true);
    try {
      const res = await fetch(`/api/viatges?conductorId=${userId}`);
      const dades = await res.json();
      setViatges(dades);
    } catch {
      // silenci
    } finally {
      setCarregant(false);
    }
  }

  useEffect(() => {
    carregarViatges();
    // SSE per actualitzacions en temps real
    const es = new EventSource("/api/sse");
    es.onmessage = (e) => {
      const { tipus } = JSON.parse(e.data);
      if (["viatge_actualitzat", "jornada_publicada", "viatge_eliminat"].includes(tipus)) carregarViatges();
    };
    return () => es.close();
  }, [userId]);

  async function canviarEstat(viatgeId: string, nouEstat: string) {
    await fetch(`/api/viatges/${viatgeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estatExecucio: nouEstat }),
    });
    await carregarViatges();
  }

  if (carregant) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center text-gray-400">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm">Carregant viatges...</p>
        </div>
      </div>
    );
  }

  if (viatges.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center text-gray-400 p-8">
          <Package size={48} className="mx-auto mb-3 opacity-50" />
          <p className="text-lg font-medium">{t.conductor.senViatges}</p>
          <p className="text-sm mt-1">Consulta més tard o avisa al gestor</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
      <h2 className="text-lg font-bold text-gray-900">{t.conductor.titol}</h2>
      <p className="text-sm text-gray-500">{viatges.length} viatge{viatges.length > 1 ? "s" : ""} avui</p>

      {viatges.map((viatge) => {
        const recollit = viatge.estatExecucio === "recollit_ok";
        const noRecollit = viatge.estatExecucio === "recollit_incidencia";
        const finalitzat = recollit || noRecollit;
        const esExpandit = expandit === viatge.id;
        const adreca = viatge.adreca || viatge.client.adreca;

        return (
          <div key={viatge.id} className={cn(
            "bg-white rounded-2xl shadow-sm border-2 overflow-hidden",
            recollit ? "border-green-300" : noRecollit ? "border-red-300" : "border-gray-200"
          )}>
            {/* Capçalera */}
            <button
              className="w-full px-4 py-4 flex items-start justify-between text-left"
              onClick={() => setExpandit(esExpandit ? null : viatge.id)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Clock size={14} className="text-gray-400 shrink-0" />
                  <span className="text-sm font-mono font-semibold text-gray-700">{viatge.horaPrevista}</span>
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full font-medium",
                    recollit ? "bg-green-100 text-green-700" : noRecollit ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                  )}>
                    {t.estats[viatge.estatExecucio] || viatge.estatExecucio}
                  </span>
                </div>
                <h3 className="text-base font-bold text-gray-900 truncate">{viatge.client.nom}</h3>
                <p className="text-sm text-gray-500">{viatge.tipusResidu}</p>
              </div>
              {esExpandit ? <ChevronUp size={18} className="text-gray-400 mt-1 shrink-0" /> : <ChevronDown size={18} className="text-gray-400 mt-1 shrink-0" />}
            </button>

            {/* Detall expandit */}
            {esExpandit && (
              <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
                {/* Adreça + telèfon */}
                <div className="flex gap-3">
                  {adreca && (
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(adreca)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 flex-1 bg-blue-50 text-blue-700 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-blue-100"
                    >
                      <MapPin size={16} />
                      <span className="truncate">{t.conductor.navegar}</span>
                    </a>
                  )}
                  {viatge.client.telefon && (
                    <a
                      href={`tel:${viatge.client.telefon}`}
                      className="flex items-center gap-2 bg-green-50 text-green-700 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-green-100"
                    >
                      <Phone size={16} />
                      {t.conductor.telefon}
                    </a>
                  )}
                </div>

                {/* Instruccions (del viatge i/o del client) */}
                {(viatge.instruccions || viatge.client.instruccionsEspecials) && (
                  <div className="bg-amber-50 rounded-xl px-3 py-2.5 text-sm text-amber-800 space-y-1">
                    {viatge.instruccions && <p>📋 {viatge.instruccions}</p>}
                    {viatge.client.instruccionsEspecials && <p>⚠️ {viatge.client.instruccionsEspecials}</p>}
                  </div>
                )}

                {/* Fotos (client + afegides pel conductor) */}
                {viatge.fotos.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2">Fotos ({viatge.fotos.length})</p>
                    <div className="flex gap-2 overflow-x-auto">
                      {viatge.fotos.map((f) => (
                        <a key={f.id} href={f.url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                          <img src={f.url} alt="Foto" className="w-20 h-20 object-cover rounded-xl border border-gray-200" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Botons del flux: En camí → Arribada → Recollit / No recollit */}
                <div className="space-y-2 pt-1">
                  {finalitzat && (
                    <div className={cn(
                      "flex items-center gap-2 text-sm font-medium mb-1",
                      recollit ? "text-green-600" : "text-red-600"
                    )}>
                      {recollit ? "✅ Recollit" : "⚠️ No recollit"}
                    </div>
                  )}
                  {BOTONS.map((boto, idx) => {
                    const nivellActual = NIVELL[viatge.estatExecucio] ?? 0;
                    const fet = boto.estat ? (NIVELL[boto.estat] ?? 99) <= nivellActual && !boto.noRecollit : false;
                    const seguent = boto.nivell === nivellActual + 1;

                    const onClick = () => {
                      if (boto.noRecollit) setMostrarNoRecollit(viatge.id);
                      else if (boto.estat) canviarEstat(viatge.id, boto.estat);
                    };

                    const colorSeguent =
                      boto.to === "green"
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : boto.to === "red"
                        ? "bg-red-500 hover:bg-red-600 text-white"
                        : "bg-blue-700 hover:bg-blue-800 text-white";

                    return (
                      <button
                        key={idx}
                        onClick={onClick}
                        className={cn(
                          "w-full rounded-xl flex items-center justify-center gap-2 transition-all",
                          seguent
                            ? `${colorSeguent} py-3.5 text-base font-bold shadow-md ring-2 ring-offset-1 ring-blue-300`
                            : fet
                            ? "py-2 text-sm font-medium bg-gray-50 text-gray-400 border border-gray-200"
                            : "py-2.5 text-sm font-medium bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
                        )}
                      >
                        {fet && <span className="text-green-500">✓</span>}
                        {boto.label}
                      </button>
                    );
                  })}
                </div>

                {/* Separador: aportacions del conductor */}
                <div className="border-t border-gray-100 pt-3 space-y-3">
                  <LlistaIncidencies viatgeId={viatge.id} incidencies={viatge.incidencies} onCanvi={carregarViatges} />

                  <button
                    onClick={() => setMostrarIncidencia(viatge.id)}
                    className="w-full flex items-center justify-center gap-2 border border-red-300 text-red-600 rounded-xl py-2.5 text-sm font-medium hover:bg-red-50"
                  >
                    <AlertCircle size={16} /> Afegir incidència
                  </button>

                  {/* Afegir foto (càmera) o nota */}
                  <AfegirFotoNota viatgeId={viatge.id} onCanvi={carregarViatges} />
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Modals */}
      {mostrarIncidencia && (
        <FormulariIncidencia
          viatgeId={mostrarIncidencia}
          onTancar={() => setMostrarIncidencia(null)}
          onEnviat={async () => {
            setMostrarIncidencia(null);
            await carregarViatges();
          }}
        />
      )}

      {mostrarNoRecollit && (
        <PopupNoRecollit
          viatgeId={mostrarNoRecollit}
          onTancar={() => setMostrarNoRecollit(null)}
          onFet={async () => {
            setMostrarNoRecollit(null);
            await carregarViatges();
          }}
        />
      )}
    </div>
  );
}
