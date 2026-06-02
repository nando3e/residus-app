"use client";

import { useState, useEffect } from "react";
import { t } from "@/lib/textos";
import { Upload, CheckCircle, Trash2 } from "lucide-react";

interface FotoPendent {
  id: string;
  url: string;
  origen: string;
  metadades?: string;
  createdAt: string;
}

interface Viatge {
  id: string;
  client: { nom: string };
  tipusResidu: string;
  horaPrevista: string;
  data: string;
}

export default function BustiaPage() {
  const [fotos, setFotos] = useState<FotoPendent[]>([]);
  const [viatges, setViatges] = useState<Viatge[]>([]);
  const [assignant, setAssignant] = useState<string | null>(null);
  const [viatgeSeleccionat, setViatgeSeleccionat] = useState("");
  const [pujant, setPujant] = useState(false);

  const avui = new Date().toISOString().split("T")[0];

  async function carregarDades() {
    const [f, v] = await Promise.all([
      fetch("/api/fotos/pendents").then((r) => r.json()),
      fetch(`/api/viatges?data=${avui}`).then((r) => r.json()),
    ]);
    setFotos(f);
    setViatges(v);
  }

  useEffect(() => { carregarDades(); }, []);

  async function handleAssignar(fotoId: string) {
    if (!viatgeSeleccionat) return;
    await fetch(`/api/fotos/pendents/${fotoId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ viatgeId: viatgeSeleccionat }),
    });
    setAssignant(null);
    setViatgeSeleccionat("");
    carregarDades();
  }

  async function handleDescartar(fotoId: string) {
    await fetch(`/api/fotos/pendents/${fotoId}`, { method: "DELETE" });
    carregarDades();
  }

  async function handlePujarFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const fitxer = e.target.files?.[0];
    if (!fitxer) return;
    setPujant(true);
    const form = new FormData();
    form.append("foto", fitxer);
    form.append("origen", "app");
    await fetch("/api/fotos/pendents", { method: "POST", body: form });
    setPujant(false);
    carregarDades();
    e.target.value = "";
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t.bustia.titol}</h1>
        <label className={`flex items-center gap-2 px-4 py-2 text-sm bg-blue-700 hover:bg-blue-800 text-white rounded-lg cursor-pointer ${pujant ? "opacity-50" : ""}`}>
          <Upload size={15} />
          {pujant ? "Pujant..." : "Afegir foto manual"}
          <input type="file" accept="image/*" onChange={handlePujarFoto} className="hidden" disabled={pujant} />
        </label>
      </div>

      {fotos.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <CheckCircle size={48} className="text-green-400 mx-auto mb-3" />
          <p className="text-gray-500">Cap foto pendent d'assignar</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {fotos.map((foto) => (
            <div key={foto.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <img src={foto.url} alt="Foto pendent" className="w-full h-40 object-cover" />
              <div className="p-3">
                <div className="flex items-center gap-1 mb-2">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{foto.origen}</span>
                  <span className="text-xs text-gray-400 ml-auto">
                    {new Date(foto.createdAt).toLocaleString("ca-ES", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>

                {assignant === foto.id ? (
                  <div className="space-y-2">
                    <select
                      value={viatgeSeleccionat}
                      onChange={(e) => setViatgeSeleccionat(e.target.value)}
                      className="w-full border border-gray-300 rounded text-xs px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Selecciona viatge</option>
                      {viatges.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.horaPrevista} — {v.client.nom} ({v.tipusResidu})
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleAssignar(foto.id)}
                        disabled={!viatgeSeleccionat}
                        className="flex-1 text-xs bg-blue-700 hover:bg-blue-800 text-white py-1.5 rounded disabled:opacity-50"
                      >
                        Assignar
                      </button>
                      <button
                        onClick={() => { setAssignant(null); setViatgeSeleccionat(""); }}
                        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1.5 rounded"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setAssignant(foto.id)}
                      className="flex-1 text-xs bg-blue-700 hover:bg-blue-800 text-white py-1.5 rounded"
                    >
                      Assignar al viatge
                    </button>
                    <button
                      onClick={() => handleDescartar(foto.id)}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
