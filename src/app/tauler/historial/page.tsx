"use client";

import { useState, useEffect } from "react";
import { t } from "@/lib/textos";
import { Download, Filter } from "lucide-react";
import ModalViatge from "@/components/tauler/ModalViatge";
import SelectorClient from "@/components/tauler/SelectorClient";
import type { Viatge, Camio } from "@/components/tauler/TaulerClient";

interface Client { id: string; nom: string }

export default function HistorialPage() {
  const [viatges, setViatges] = useState<Viatge[]>([]);
  const [camions, setCamions] = useState<Camio[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [viatgeModal, setViatgeModal] = useState<Viatge | null>(null);
  const [dataInici, setDataInici] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [dataFi, setDataFi] = useState(new Date().toISOString().split("T")[0]);
  const [camioFiltrat, setCamioFiltrat] = useState("");
  const [clientFiltrat, setClientFiltrat] = useState("");
  const [carregant, setCarregant] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/camions").then((r) => r.json()),
      fetch("/api/clients").then((r) => r.json()),
    ]).then(([c, cl]) => { setCamions(c); setClients(cl); });
  }, []);

  async function cercar(clientId: string = clientFiltrat) {
    setCarregant(true);
    const params = new URLSearchParams({ historial: "true", data: dataInici, dataFi });
    if (camioFiltrat) params.set("camioId", camioFiltrat);
    if (clientId) params.set("clientId", clientId);
    const res = await fetch(`/api/viatges?${params}`);
    setViatges(await res.json());
    setCarregant(false);
  }

  useEffect(() => { cercar(); }, []);

  function exportarCSV() {
    const caps = ["Data", "Hora", "Client", "Residu", "Camió", "Conductor", "Estat", "Pes (kg)", "Observacions", "Incidències"];
    const files = viatges.map((v) => [
      new Date(v.data).toLocaleDateString("ca-ES"),
      v.horaPrevista,
      v.client.nom,
      v.tipusResidu,
      v.camio?.nom || "",
      v.conductorSnapshot || "",
      t.estats[v.estatExecucio] || v.estatExecucio,
      v.pesReal || "",
      v.observacions || "",
      v.incidencies.map((i) => i.tipus).join("; "),
    ]);
    const csv = [caps, ...files].map((f) => f.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `historial-${dataInici}-${dataFi}.csv`;
    a.click();
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t.historial.titol}</h1>
        <button onClick={exportarCSV} className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg">
          <Download size={15} /> {t.historial.exportarCSV}
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{t.historial.filtrarData}</label>
          <div className="flex gap-2">
            <input type="date" value={dataInici} onChange={(e) => setDataInici(e.target.value)}
              className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <span className="self-center text-gray-400">→</span>
            <input type="date" value={dataFi} onChange={(e) => setDataFi(e.target.value)}
              className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{t.historial.filtrarCamio}</label>
          <select value={camioFiltrat} onChange={(e) => setCamioFiltrat(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Tots els camions</option>
            {camions.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
        </div>
        <div className="w-56">
          <label className="block text-xs font-medium text-gray-600 mb-1">{t.historial.filtrarClient}</label>
          <SelectorClient
            clients={clients}
            value={clientFiltrat}
            onChange={(id) => {
              setClientFiltrat(id);
              cercar(id);
            }}
          />
        </div>
        <button onClick={() => cercar()} className="flex items-center gap-2 px-4 py-1.5 text-sm bg-blue-700 hover:bg-blue-800 text-white rounded-lg">
          <Filter size={14} /> Filtrar
        </button>
      </div>

      {/* Taula */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {carregant ? (
          <div className="p-8 text-center text-gray-400">Carregant...</div>
        ) : viatges.length === 0 ? (
          <div className="p-8 text-center text-gray-400">{t.historial.noResultats}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {["Data", "Hora", "Client", "Residu", "Camió", "Conductor", "Pes (kg)", "Incidències"].map((cap) => (
                    <th key={cap} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600">{cap}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {viatges.map((v) => (
                  <tr key={v.id} onClick={() => setViatgeModal(v)} className="hover:bg-blue-50 cursor-pointer">
                    <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">
                      {new Date(v.data).toLocaleDateString("ca-ES")}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-gray-700">{v.horaPrevista}</td>
                    <td className="px-4 py-2.5 font-medium text-gray-900">{v.client.nom}</td>
                    <td className="px-4 py-2.5 text-gray-600">{v.tipusResidu}</td>
                    <td className="px-4 py-2.5">
                      {v.camio && (
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: v.camio.color }} />
                          {v.camio.nom}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">{v.conductorSnapshot || "—"}</td>
                    <td className="px-4 py-2.5 text-gray-600">{v.pesReal || "—"}</td>
                    <td className="px-4 py-2.5">
                      {v.incidencies.length > 0 && (
                        <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">
                          {v.incidencies.length} incidència{v.incidencies.length > 1 ? "s" : ""}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-2.5 bg-gray-50 text-xs text-gray-500 border-t border-gray-200">
              {viatges.length} resultat{viatges.length !== 1 ? "s" : ""} · clica una fila per veure el detall
            </div>
          </div>
        )}
      </div>

      {viatgeModal && (
        <ModalViatge
          viatge={viatgeModal}
          camions={camions}
          onTancar={() => setViatgeModal(null)}
          onActualitzar={async (id, dades) => {
            await fetch(`/api/viatges/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(dades),
            });
            setViatgeModal(null);
            await cercar();
          }}
          onEliminar={async (id) => {
            await fetch(`/api/viatges/${id}`, { method: "DELETE" });
            setViatgeModal(null);
            await cercar();
          }}
        />
      )}
    </div>
  );
}
