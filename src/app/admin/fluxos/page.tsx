"use client";

import { ArrowRight, Truck, Cpu, UserCog, Radio, Bell, FileText } from "lucide-react";

type Actor = "conductor" | "motor" | "gestor";
type Canal = "temps_real" | "avis" | "intern";

const ACTOR = {
  conductor: { nom: "Conductor", color: "#3B82F6", icon: Truck },
  motor: { nom: "Motor", color: "#475569", icon: Cpu },
  gestor: { nom: "Gestor", color: "#8B5CF6", icon: UserCog },
} as const;

const CANAL = {
  temps_real: { nom: "Temps real", desc: "Actualització a la pantalla a l'instant", color: "bg-blue-100 text-blue-700", icon: Radio },
  avis: { nom: "Avís Telegram", desc: "El Motor envia un missatge de Telegram amb enllaç directe al viatge (arriba encara que no miri la pantalla)", color: "bg-green-100 text-green-700", icon: Bell },
  intern: { nom: "Intern", desc: "Només es desa al registre, sense avisar ningú", color: "bg-gray-100 text-gray-600", icon: FileText },
};

interface Flux {
  titol: string;
  cami: Actor[];
  canal: Canal;
  ara: string;
  futur?: string;
}

const GRUPS: { seccio: string; subtitol: string; fluxos: Flux[] }[] = [
  {
    seccio: "Inicia el GESTOR",
    subtitol: "Accions de la persona que organitza i reparteix l'agenda",
    fluxos: [
      {
        titol: "Assignar viatges a un camió (borrador)",
        cami: ["gestor", "motor"],
        canal: "temps_real",
        ara: "El Motor desa l'assignació i actualitza el tauler. El conductor NO se n'assabenta (encara és borrador).",
      },
      {
        titol: "Publicar jornada",
        cami: ["gestor", "motor", "conductor"],
        canal: "avis",
        ara: "El Motor avisa cada conductor amb la seva llista del dia. És el moment en què el conductor passa a veure els viatges.",
      },
      {
        titol: "Modificar un viatge ja publicat (hora, dia o camió)",
        cami: ["gestor", "motor", "conductor"],
        canal: "avis",
        ara: "El Motor avisa el conductor afectat amb el detall exacte del canvi i actualitza el tauler.",
      },
      {
        titol: "Eliminar un viatge ja publicat",
        cami: ["gestor", "motor", "conductor"],
        canal: "avis",
        ara: "El Motor avisa el conductor que el viatge s'ha CANCEL·LAT.",
      },
      {
        titol: "Canvis en borrador (abans de publicar)",
        cami: ["gestor", "motor"],
        canal: "temps_real",
        ara: "Es reflecteix al tauler del gestor, però no s'avisa ningú fins que es publica.",
      },
    ],
  },
  {
    seccio: "Inicia el CONDUCTOR",
    subtitol: "El conductor clica botons o registra coses des de la seva app",
    fluxos: [
      {
        titol: "Canviar estat del viatge (en camí, arribada, recollit, a planta, descàrrega)",
        cami: ["conductor", "motor", "gestor"],
        canal: "temps_real",
        ara: "El Motor desa l'hora exacta del clic (queda a l'historial) i actualitza el tauler del gestor a l'instant. Ara mateix NO envia cap avís actiu.",
        futur: "Es podria enviar un avís al gestor en estats clau (ex: 'a la planta').",
      },
      {
        titol: "Recollit amb incidència (genèrica: retard, residu no apte...)",
        cami: ["conductor", "motor", "gestor"],
        canal: "temps_real",
        ara: "Apareix una alerta destacada al tauler del gestor, amb foto i ubicació.",
      },
      {
        titol: "Incidència CRÍTICA (client tancat / avaria del camió)",
        cami: ["conductor", "motor", "gestor"],
        canal: "avis",
        ara: "A més de l'alerta al tauler, el Motor envia un avís actiu al gestor.",
        futur: "Punt clau: aquí es podria fer que el Motor dispari una reorganització automàtica de l'agenda o un avís especial, sense esperar que el gestor ho vegi.",
      },
      {
        titol: "Afegir foto o nota a un viatge",
        cami: ["conductor", "motor", "gestor"],
        canal: "temps_real",
        ara: "El Motor desa la foto/nota al viatge i queda visible per al gestor (tauler i historial).",
      },
    ],
  },
  {
    seccio: "Entrada EXTERNA",
    subtitol: "Coses que arriben de fora del sistema",
    fluxos: [
      {
        titol: "Foto del client (bústia)",
        cami: ["motor", "gestor"],
        canal: "temps_real",
        ara: "El Motor rep la foto i intenta emparellar-la amb el viatge (client + data + residu). Si no ho aconsegueix, va a la bústia de pendents perquè el gestor l'assigni.",
      },
    ],
  },
];

function ActorChip({ actor }: { actor: Actor }) {
  const a = ACTOR[actor];
  const Icon = a.icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-white text-xs font-semibold"
      style={{ backgroundColor: a.color }}
    >
      <Icon size={13} /> {a.nom}
    </span>
  );
}

export default function FluxosPage() {
  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Flux d'esdeveniments</h1>
      <p className="text-sm text-gray-500 mb-6">
        Resum de què dispara cada acció i en quina direcció va. Serveix per decidir quins esdeveniments volem
        notificar de manera especial més endavant.
      </p>

      {/* Llegenda d'actors */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">Actors</p>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <ActorChip actor="conductor" />
            <span className="text-xs text-gray-500">qui fa les recollides</span>
          </div>
          <div className="flex items-center gap-2">
            <ActorChip actor="motor" />
            <span className="text-xs text-gray-500">el sistema (rep, desa, avisa)</span>
          </div>
          <div className="flex items-center gap-2">
            <ActorChip actor="gestor" />
            <span className="text-xs text-gray-500">qui organitza i reparteix l'agenda</span>
          </div>
        </div>
      </div>

      {/* Llegenda de canals */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">Tipus de canal</p>
        <div className="space-y-2">
          {Object.values(CANAL).map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.nom} className="flex items-center gap-3">
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${c.color}`}>
                  <Icon size={12} /> {c.nom}
                </span>
                <span className="text-xs text-gray-500">{c.desc}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grups de fluxos */}
      <div className="space-y-6">
        {GRUPS.map((grup) => (
          <div key={grup.seccio}>
            <h2 className="text-sm font-bold text-gray-800">{grup.seccio}</h2>
            <p className="text-xs text-gray-500 mb-3">{grup.subtitol}</p>
            <div className="space-y-3">
              {grup.fluxos.map((flux) => {
                const c = CANAL[flux.canal];
                const CanalIcon = c.icon;
                return (
                  <div key={flux.titol} className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <h3 className="text-sm font-semibold text-gray-900 flex-1 min-w-[200px]">{flux.titol}</h3>
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${c.color}`}>
                        <CanalIcon size={12} /> {c.nom}
                      </span>
                    </div>

                    {/* Camí d'actors */}
                    <div className="flex items-center gap-2 flex-wrap my-3">
                      {flux.cami.map((actor, i) => (
                        <span key={actor} className="flex items-center gap-2">
                          <ActorChip actor={actor} />
                          {i < flux.cami.length - 1 && <ArrowRight size={15} className="text-gray-400" />}
                        </span>
                      ))}
                    </div>

                    <p className="text-sm text-gray-600">{flux.ara}</p>
                    {flux.futur && (
                      <p className="text-xs text-violet-700 bg-violet-50 rounded-lg px-3 py-2 mt-2">
                        💡 <span className="font-medium">Possible millora:</span> {flux.futur}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
