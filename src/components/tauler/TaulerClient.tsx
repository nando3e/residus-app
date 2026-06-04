"use client";

import { useState, useEffect, useCallback } from "react";
import { t } from "@/lib/textos";
import { cn, setmanaDe } from "@/lib/utils";
import { LayoutGrid, Calendar, Send, Plus, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import VistaKanban from "./VistaKanban";
import VistaSetmana from "./VistaSetmana";
import ModalViatge from "./ModalViatge";
import BannerAssignacio from "./BannerAssignacio";
import ModalVerificar from "./ModalVerificar";
import ModalNouViatge from "./ModalNouViatge";
import ModalAbastSerie from "./ModalAbastSerie";

export type Viatge = {
  id: string;
  client: { id: string; nom: string; telefon?: string; adreca?: string; instruccionsEspecials?: string } | null;
  clientId: string | null;
  clientOcasional?: string | null;
  tipusResidu: string;
  data: string;
  horaPrevista: string;
  serieId?: string | null;
  adreca?: string;
  telefon?: string;
  instruccions?: string;
  camioId?: string;
  camio?: { id: string; nom: string; color: string; matricula: string };
  estatAssignacio: "esborrany" | "publicat";
  estatExecucio: string;
  pendentEliminar?: boolean;
  pesReal?: number;
  conductorSnapshot?: string;
  observacions?: string;
  fotos: { id: string; url: string }[];
  incidencies: any[];
  logCanvis: any[];
};

export type Camio = {
  id: string;
  nom: string;
  matricula: string;
  color: string;
  conductor?: { id: string; nom: string };
};

interface TaulerClientProps {
  rol: string;
}

export default function TaulerClient({ rol }: TaulerClientProps) {
  const [vista, setVista] = useState<"setmana" | "kanban">("setmana");
  const [dataSeleccionada, setDataSeleccionada] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [viatges, setViatges] = useState<Viatge[]>([]);
  const [camions, setCamions] = useState<Camio[]>([]);
  const [carregant, setCarregant] = useState(true);

  // Mode assignació
  const [modeAssignacio, setModeAssignacio] = useState(false);
  const [camioActiu, setCamioActiu] = useState<Camio | null>(null);
  const [viatgesSeleccionats, setViatgesSeleccionats] = useState<Set<string>>(new Set());

  // Modals
  const [viatgeModal, setViatgeModal] = useState<Viatge | null>(null);
  const [diaVerificar, setDiaVerificar] = useState<string | null>(null);
  const [mostrarNouViatge, setMostrarNouViatge] = useState(false);
  const [prefillNouViatge, setPrefillNouViatge] = useState<{ data: string; hora: string } | null>(null);
  // Acció pendent d'escollir abast (només aquest viatge / tota la sèrie)
  const [accioSerie, setAccioSerie] = useState<
    | { tipus: "eliminar"; viatge: Viatge }
    | { tipus: "moure"; viatge: Viatge; dades: { dia: string; hora: string } }
    | { tipus: "editar"; viatge: Viatge; dades: any }
    | null
  >(null);

  const avui = new Date().toISOString().split("T")[0];
  const setmana = setmanaDe(dataSeleccionada);

  const carregarDades = useCallback(async () => {
    setCarregant(true);
    try {
      const urlViatges =
        vista === "setmana"
          ? `/api/viatges?from=${setmana.inici}&to=${setmana.fi}`
          : `/api/viatges?data=${dataSeleccionada}`;
      const [vRes, cRes] = await Promise.all([
        fetch(urlViatges),
        fetch("/api/camions"),
      ]);
      const [v, c] = await Promise.all([vRes.json(), cRes.json()]);
      setViatges(v);
      setCamions(c);
    } catch {
      // silenci
    } finally {
      setCarregant(false);
    }
  }, [dataSeleccionada, vista, setmana.inici, setmana.fi]);

  useEffect(() => {
    carregarDades();
  }, [carregarDades]);

  // SSE per temps real
  useEffect(() => {
    const es = new EventSource("/api/sse");
    es.onmessage = (e) => {
      const { tipus } = JSON.parse(e.data);
      if (["viatge_actualitzat", "viatges_assignats", "jornada_publicada", "incidencia_nova", "viatge_eliminat"].includes(tipus)) {
        carregarDades();
      }
    };
    return () => es.close();
  }, [carregarDades]);

  function handleClickViatge(viatge: Viatge) {
    if (modeAssignacio && camioActiu) {
      setViatgesSeleccionats((prev) => {
        const next = new Set(prev);
        if (next.has(viatge.id)) next.delete(viatge.id);
        else next.add(viatge.id);
        return next;
      });
    } else {
      setViatgeModal(viatge);
    }
  }

  async function handleOkAssignacio() {
    if (!camioActiu || viatgesSeleccionats.size === 0) return;
    await fetch("/api/viatges/assignar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        viatgeIds: Array.from(viatgesSeleccionats),
        camioId: camioActiu.id,
      }),
    });
    setViatgesSeleccionats(new Set());
    setCamioActiu(null);
    setModeAssignacio(false);
    await carregarDades();
  }

  async function patchViatge(id: string, dades: any) {
    await fetch(`/api/viatges/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dades),
    });
  }

  async function handleMoure(id: string, dia: string, hora: string) {
    const v = viatges.find((x) => x.id === id);
    // Si forma part d'una sèrie, preguntar abast abans d'aplicar el canvi de data/hora
    if (v?.serieId) {
      setAccioSerie({ tipus: "moure", viatge: v, dades: { dia, hora } });
      return;
    }
    await patchViatge(id, {
      data: new Date(dia + "T00:00:00.000Z").toISOString(),
      horaPrevista: hora,
    });
    await carregarDades();
  }

  async function handleActualitzar(id: string, dades: any) {
    const v = viatges.find((x) => x.id === id);
    const horaCanviada = !!dades.horaPrevista && !!v && dades.horaPrevista !== v.horaPrevista;
    // Canvi d'hora en un viatge de sèrie → preguntar abast
    if (v?.serieId && horaCanviada) {
      setViatgeModal(null);
      setAccioSerie({ tipus: "editar", viatge: v, dades });
      return;
    }
    await patchViatge(id, dades);
    setViatgeModal(null);
    await carregarDades();
  }

  async function handleEliminar(id: string) {
    const v = viatges.find((x) => x.id === id);
    if (v?.serieId) {
      setViatgeModal(null);
      setAccioSerie({ tipus: "eliminar", viatge: v });
      return;
    }
    await fetch(`/api/viatges/${id}`, { method: "DELETE" });
    setViatgeModal(null);
    await carregarDades();
  }

  async function executarAccioSerie(scope: "un" | "serie") {
    if (!accioSerie) return;
    const ac = accioSerie;
    setAccioSerie(null);
    if (ac.tipus === "eliminar") {
      await fetch(`/api/viatges/${ac.viatge.id}?scope=${scope}`, { method: "DELETE" });
    } else if (ac.tipus === "moure") {
      await patchViatge(ac.viatge.id, {
        data: new Date(ac.dades.dia + "T00:00:00.000Z").toISOString(),
        horaPrevista: ac.dades.hora,
        scope,
      });
    } else {
      await patchViatge(ac.viatge.id, { ...ac.dades, scope });
    }
    await carregarDades();
  }

  async function handlePublicar(dia: string) {
    await fetch("/api/viatges/publicar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: dia }),
    });
    setDiaVerificar(null);
    await carregarDades();
  }

  function canviarSetmana(direccio: number) {
    const d = new Date(dataSeleccionada + "T12:00:00Z");
    d.setUTCDate(d.getUTCDate() + direccio * 7);
    setDataSeleccionada(d.toISOString().split("T")[0]);
  }

  // Per la vista kanban (un sol dia)
  const viatgesDiaKanban = viatges.filter((v) => v.data.slice(0, 10) === dataSeleccionada);
  const jaPublicadaDia = viatgesDiaKanban.some((v) => v.estatAssignacio === "publicat");
  const teAssignacionsPendents = viatgesDiaKanban.some(
    (v) => (v.camioId && v.estatAssignacio === "esborrany") || v.pendentEliminar
  );

  // Viatges del dia que es verifica (modal)
  const viatgesVerificar = diaVerificar
    ? viatges.filter((v) => v.data.slice(0, 10) === diaVerificar)
    : [];
  const jaPublicadaVerificar = viatgesVerificar.some((v) => v.estatAssignacio === "publicat");

  return (
    <div className="flex flex-col h-full">
      {/* Capçalera */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between gap-4 shrink-0 flex-wrap">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-gray-900">{t.tauler.titol}</h1>
          {vista === "setmana" ? (
            <div className="flex items-center gap-1">
              <button onClick={() => canviarSetmana(-1)} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                <ChevronLeft size={16} />
              </button>
              <input
                type="date"
                value={dataSeleccionada}
                onChange={(e) => setDataSeleccionada(e.target.value)}
                className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button onClick={() => canviarSetmana(1)} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                <ChevronRight size={16} />
              </button>
            </div>
          ) : (
            <input
              type="date"
              value={dataSeleccionada}
              onChange={(e) => setDataSeleccionada(e.target.value)}
              className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
          <button
            onClick={carregarDades}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <RefreshCw size={16} className={carregant ? "animate-spin" : ""} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle vista */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => setVista("setmana")}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 text-sm", vista === "setmana" ? "bg-blue-700 text-white" : "text-gray-600 hover:bg-gray-50")}
            >
              <Calendar size={15} /> Setmana
            </button>
            <button
              onClick={() => setVista("kanban")}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 text-sm", vista === "kanban" ? "bg-blue-700 text-white" : "text-gray-600 hover:bg-gray-50")}
            >
              <LayoutGrid size={15} /> {t.tauler.vistaKanban}
            </button>
          </div>

          <button
            onClick={() => {
              setPrefillNouViatge({ data: dataSeleccionada, hora: "09:00" });
              setMostrarNouViatge(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg"
          >
            <Plus size={15} /> Nou viatge
          </button>

          {!modeAssignacio && (
            <button
              onClick={() => setModeAssignacio(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium"
            >
              {t.tauler.assignar}
            </button>
          )}

          {/* En Kanban, publicar el dia seleccionat des de dalt */}
          {vista === "kanban" && teAssignacionsPendents && (
            <button
              onClick={() => setDiaVerificar(dataSeleccionada)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
            >
              <Send size={15} /> {jaPublicadaDia ? "Publicar canvis" : "Publicar jornada"}
            </button>
          )}
          {vista === "kanban" && jaPublicadaDia && !teAssignacionsPendents && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg font-medium">
              <Send size={15} /> Publicada ✓
            </span>
          )}
        </div>
      </header>

      {/* Banner assignació activa */}
      {modeAssignacio && (
        <BannerAssignacio
          camions={camions}
          camioActiu={camioActiu}
          onSeleccionarCamio={setCamioActiu}
          viatgesSeleccionats={viatgesSeleccionats.size}
          onOk={handleOkAssignacio}
          onCancelar={() => {
            setModeAssignacio(false);
            setCamioActiu(null);
            setViatgesSeleccionats(new Set());
          }}
        />
      )}

      {/* Contingut principal */}
      <div className="flex-1 min-h-0 overflow-auto p-4">
        {vista === "setmana" ? (
          <VistaSetmana
            dies={setmana.dies}
            viatges={viatges}
            camions={camions}
            modeAssignacio={modeAssignacio}
            camioActiu={camioActiu}
            viatgesSeleccionats={viatgesSeleccionats}
            onClickViatge={handleClickViatge}
            onPublicarDia={(dia) => setDiaVerificar(dia)}
            onCrearViatge={(dia, hora) => {
              setPrefillNouViatge({ data: dia, hora });
              setMostrarNouViatge(true);
            }}
            onMoureViatge={handleMoure}
            avui={avui}
          />
        ) : (
          <VistaKanban
            viatges={viatgesDiaKanban}
            camions={camions}
            modeAssignacio={modeAssignacio}
            camioActiu={camioActiu}
            viatgesSeleccionats={viatgesSeleccionats}
            onClickViatge={handleClickViatge}
          />
        )}
      </div>

      {/* Modals */}
      {viatgeModal && (
        <ModalViatge
          viatge={viatgeModal}
          camions={camions}
          onTancar={() => setViatgeModal(null)}
          onActualitzar={handleActualitzar}
          onEliminar={handleEliminar}
        />
      )}

      {accioSerie && (
        <ModalAbastSerie
          accio={accioSerie.tipus === "eliminar" ? "eliminar" : "modificar"}
          onTriar={executarAccioSerie}
          onCancelar={() => setAccioSerie(null)}
        />
      )}

      {diaVerificar && (
        <ModalVerificar
          viatges={viatgesVerificar}
          camions={camions}
          dia={diaVerificar}
          onPublicar={() => handlePublicar(diaVerificar)}
          onTancar={() => setDiaVerificar(null)}
          jaPublicada={jaPublicadaVerificar}
        />
      )}

      {mostrarNouViatge && (
        <ModalNouViatge
          onTancar={() => {
            setMostrarNouViatge(false);
            setPrefillNouViatge(null);
          }}
          onCreat={carregarDades}
          dataInicial={prefillNouViatge?.data || dataSeleccionada}
          horaInicial={prefillNouViatge?.hora || "09:00"}
        />
      )}
    </div>
  );
}
