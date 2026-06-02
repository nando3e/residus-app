"use client";

import { useRef } from "react";
import { cn, nomDia, diaMes } from "@/lib/utils";
import { Send, AlertCircle, Camera, Truck } from "lucide-react";
import type { Viatge, Camio } from "./TaulerClient";

const HORA_INICI = 6;
const HORA_FI = 21;
const PX_HORA = 80;
const ALCADA = (HORA_FI - HORA_INICI) * PX_HORA;
const DURADA_NOMINAL = 30; // minuts (per càlcul de solapaments)

function minuts(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

function diaDe(viatge: Viatge): string {
  return viatge.data.slice(0, 10);
}

// Les 3 lletres de la matrícula (ex. "1234-ABC" → "ABC")
function matriculaCurta(matricula?: string): string {
  if (!matricula) return "";
  const lletres = matricula.replace(/[^A-Za-z]/g, "");
  return (lletres.slice(-3) || matricula.slice(-3)).toUpperCase();
}

// Assigna columnes (lanes) als viatges que es solapen visualment
function calcularLanes(viatges: Viatge[]): Record<string, { lane: number; total: number }> {
  const res: Record<string, { lane: number; total: number }> = {};
  const ordenats = [...viatges].sort((a, b) => minuts(a.horaPrevista) - minuts(b.horaPrevista));

  let cluster: Viatge[] = [];
  let clusterFi = -1;
  let lanesFi: number[] = [];

  const tancarCluster = () => {
    const total = Math.max(...cluster.map((c) => res[c.id].lane)) + 1;
    cluster.forEach((c) => (res[c.id].total = total));
    cluster = [];
    lanesFi = [];
  };

  for (const v of ordenats) {
    const ini = minuts(v.horaPrevista);
    const fi = ini + DURADA_NOMINAL;
    if (cluster.length && ini >= clusterFi) tancarCluster();

    let lane = lanesFi.findIndex((le) => le <= ini);
    if (lane === -1) lane = lanesFi.length;
    lanesFi[lane] = fi;

    res[v.id] = { lane, total: 1 };
    cluster.push(v);
    clusterFi = cluster.length === 1 ? fi : Math.max(clusterFi, fi);
  }
  if (cluster.length) tancarCluster();
  return res;
}

interface VistaSetmanaProps {
  dies: string[];
  viatges: Viatge[];
  camions: Camio[];
  modeAssignacio: boolean;
  camioActiu: Camio | null;
  viatgesSeleccionats: Set<string>;
  onClickViatge: (viatge: Viatge) => void;
  onPublicarDia: (dia: string) => void;
  onCrearViatge: (dia: string, hora: string) => void;
  onMoureViatge: (id: string, dia: string, hora: string) => void;
  avui: string;
}

export default function VistaSetmana({
  dies,
  viatges,
  camions,
  modeAssignacio,
  camioActiu,
  viatgesSeleccionats,
  onClickViatge,
  onPublicarDia,
  onCrearViatge,
  onMoureViatge,
  avui,
}: VistaSetmanaProps) {
  const hores = Array.from({ length: HORA_FI - HORA_INICI + 1 }, (_, i) => HORA_INICI + i);

  // Estat d'arrossegament (drag & drop)
  const arrossegant = useRef<{ id: string; offsetY: number } | null>(null);

  function yAHora(y: number): string {
    let min = HORA_INICI * 60 + Math.round((y / PX_HORA) * 60 / 15) * 15;
    min = Math.max(HORA_INICI * 60, Math.min(HORA_FI * 60 - 30, min));
    const h = String(Math.floor(min / 60)).padStart(2, "0");
    const m = String(min % 60).padStart(2, "0");
    return `${h}:${m}`;
  }

  function handleClickColumna(e: React.MouseEvent<HTMLDivElement>, dia: string) {
    const rect = e.currentTarget.getBoundingClientRect();
    onCrearViatge(dia, yAHora(e.clientY - rect.top));
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>, dia: string) {
    e.preventDefault();
    const drag = arrossegant.current;
    if (!drag) return;
    const rect = e.currentTarget.getBoundingClientRect();
    // Posició del TOP del bloc = cursor menys l'offset on s'ha agafat
    const yTop = e.clientY - rect.top - drag.offsetY;
    onMoureViatge(drag.id, dia, yAHora(yTop));
    arrossegant.current = null;
  }

  return (
    <div>
      <div className="min-w-[760px]">
        {/* Capçalera de dies */}
        <div className="flex border-b border-gray-200 bg-white sticky top-0 z-20">
          <div className="w-14 shrink-0" />
          <div className="flex-1 grid grid-cols-5">
            {dies.map((dia, i) => {
              const viatgesDia = viatges.filter((v) => diaDe(v) === dia);
              const borradorsAssignats = viatgesDia.filter((v) => v.camioId && v.estatAssignacio === "esborrany");
              const senseAssignar = viatgesDia.filter((v) => !v.camioId);
              const publicats = viatgesDia.filter((v) => v.estatAssignacio === "publicat");
              const esAvui = dia === avui;
              return (
                <div key={dia} className={cn("px-2 py-2 text-center border-r border-gray-100", esAvui && "bg-blue-50")}>
                  <div className="flex items-center justify-center gap-1.5">
                    <span className={cn("text-sm font-semibold", esAvui ? "text-blue-700" : "text-gray-700")}>{nomDia(i)}</span>
                    <span className="text-xs text-gray-400">{diaMes(dia)}</span>
                  </div>
                  <div className="flex items-center justify-center gap-1.5 mt-1 flex-wrap">
                    <span className="text-xs text-gray-400">{viatgesDia.length} viatges</span>
                    {publicats.length > 0 && borradorsAssignats.length === 0 && (
                      <span className="text-xs text-green-600">✓ publicat</span>
                    )}
                    {senseAssignar.length > 0 && (
                      <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
                        {senseAssignar.length} sense assignar
                      </span>
                    )}
                    {borradorsAssignats.length > 0 && (
                      <button
                        onClick={() => onPublicarDia(dia)}
                        className="flex items-center gap-1 text-xs bg-green-600 hover:bg-green-700 text-white px-1.5 py-0.5 rounded-full"
                      >
                        <Send size={10} /> {publicats.length > 0 ? "Publicar canvis" : "Publicar"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Graella amb posicionament per minut */}
        <div className="flex">
          {/* Gutter d'hores */}
          <div className="w-14 shrink-0 relative" style={{ height: ALCADA }}>
            {hores.map((h) => (
              <div
                key={h}
                className="absolute right-2 -translate-y-1/2 text-xs text-gray-400 font-mono"
                style={{ top: (h - HORA_INICI) * PX_HORA }}
              >
                {h > HORA_INICI ? `${String(h).padStart(2, "0")}:00` : ""}
              </div>
            ))}
          </div>

          {/* Columnes de dies */}
          <div className="flex-1 grid grid-cols-5">
            {dies.map((dia) => {
              const viatgesDia = viatges.filter((v) => diaDe(v) === dia);
              const lanes = calcularLanes(viatgesDia);
              const esAvui = dia === avui;
              return (
                <div
                  key={dia}
                  onClick={(e) => !modeAssignacio && handleClickColumna(e, dia)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, dia)}
                  className={cn(
                    "relative border-r border-gray-100 cursor-pointer",
                    esAvui && "bg-blue-50/40"
                  )}
                  style={{
                    height: ALCADA,
                    backgroundImage: `repeating-linear-gradient(to bottom, #f1f5f9 0, #f1f5f9 1px, transparent 1px, transparent ${PX_HORA}px)`,
                  }}
                >
                  {viatgesDia.map((v) => {
                    const ini = minuts(v.horaPrevista);
                    const top = ((ini - HORA_INICI * 60) / 60) * PX_HORA;
                    const { lane, total } = lanes[v.id];
                    const ample = 100 / total;
                    const esBorrador = v.estatAssignacio === "esborrany";
                    const seleccionat = viatgesSeleccionats.has(v.id);
                    const preview = seleccionat && !!camioActiu;
                    const camioMostrar = preview ? camioActiu : camions.find((c) => c.id === v.camioId);
                    const hihaIncidencia = v.incidencies.length > 0;

                    // Color = estat: planificat (gris) / assignat (vermell) / realitzat (verd)
                    const completat = v.estatExecucio === "descarrega_completada";
                    const assignat = !!v.camioId || preview;
                    const estatClass = completat
                      ? "bg-green-100 hover:bg-green-200"
                      : assignat
                      ? "bg-red-100 hover:bg-red-200"
                      : "bg-gray-100 hover:bg-gray-200";
                    const textClass = completat ? "text-green-900" : assignat ? "text-red-900" : "text-gray-700";

                    return (
                      <button
                        key={v.id}
                        draggable={!modeAssignacio}
                        onDragStart={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          arrossegant.current = { id: v.id, offsetY: e.clientY - rect.top };
                          e.dataTransfer.effectAllowed = "move";
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onClickViatge(v);
                        }}
                        className={cn(
                          "absolute rounded-md px-1.5 py-1 text-left overflow-hidden transition-all hover:shadow-md hover:z-10 flex items-start gap-1",
                          estatClass,
                          esBorrador ? "border-2 border-dashed border-gray-400" : "border border-gray-300",
                          seleccionat && "ring-2 ring-blue-500 z-10",
                          hihaIncidencia && "ring-1 ring-red-500"
                        )}
                        style={{
                          top: top + 1,
                          height: Math.max(PX_HORA / 2 - 3, 36),
                          left: `calc(${lane * ample}% + 2px)`,
                          width: `calc(${ample}% - 4px)`,
                        }}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1 leading-tight">
                            <span className={cn("text-[11px] font-semibold truncate", textClass)}>{v.client.nom}</span>
                            {hihaIncidencia && <AlertCircle size={10} className="text-red-600 shrink-0" />}
                            {v.fotos.length > 0 && <Camera size={10} className="text-gray-500 shrink-0" />}
                          </div>
                          <div className="flex items-center gap-1 leading-tight">
                            <span className="text-[10px] font-mono text-gray-500 shrink-0">{v.horaPrevista}</span>
                            <span className="text-[10px] text-gray-500 truncate">· {v.tipusResidu}</span>
                          </div>
                        </div>
                        {camioMostrar && (
                          <span
                            className="shrink-0 self-center rounded-md pl-1 pr-1.5 py-0.5 flex items-center gap-1 text-white"
                            style={{ backgroundColor: camioMostrar.color }}
                            title={`${camioMostrar.nom} · ${camioMostrar.matricula}`}
                          >
                            <Truck size={12} />
                            <span className="text-[9px] font-bold leading-none">{matriculaCurta(camioMostrar.matricula)}</span>
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
