"use client";

import { useState, useEffect } from "react";
import { t } from "@/lib/textos";
import { Plus, Save, Pencil } from "lucide-react";

interface User { id: string; nom: string; rol: string }
interface Camio {
  id: string; nom: string; matricula: string; color: string;
  conductor?: User; conductorId?: string; actiu: boolean
}

// Sense verd ni vermell (es confonen amb l'estat del viatge)
const COLORS = ["#3B82F6", "#8B5CF6", "#92400E", "#F59E0B", "#EC4899", "#F97316", "#0891B2", "#6366F1"];

export default function CamionsPage() {
  const [camions, setCamions] = useState<Camio[]>([]);
  const [conductors, setConductors] = useState<User[]>([]);
  const [editant, setEditant] = useState<string | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [nou, setNou] = useState({ nom: "", matricula: "", color: COLORS[0], conductorId: "" });
  const [guardant, setGuardant] = useState(false);

  async function carregarDades() {
    const [c, u] = await Promise.all([
      fetch("/api/camions").then((r) => r.json()),
      fetch("/api/usuaris").then((r) => r.json()),
    ]);
    setCamions(c);
    setConductors(u.filter((u: User) => u.rol === "conductor"));
  }

  useEffect(() => { carregarDades(); }, []);

  async function handleCrear(e: React.FormEvent) {
    e.preventDefault();
    setGuardant(true);
    await fetch("/api/camions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nou),
    });
    setNou({ nom: "", matricula: "", color: COLORS[0], conductorId: "" });
    setMostrarForm(false);
    setGuardant(false);
    carregarDades();
  }

  async function handleActualitzarConductor(camioId: string, conductorId: string) {
    await fetch(`/api/camions/${camioId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conductorId: conductorId || null }),
    });
    carregarDades();
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t.camions.titol}</h1>
        <button onClick={() => setMostrarForm(!mostrarForm)}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-700 hover:bg-blue-800 text-white rounded-lg">
          <Plus size={15} /> {t.camions.nou}
        </button>
      </div>

      {mostrarForm && (
        <form onSubmit={handleCrear} className="bg-white rounded-xl border border-gray-200 p-5 mb-4 space-y-4">
          <h3 className="font-semibold text-gray-800">Nou camió</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nom *</label>
              <input value={nou.nom} onChange={(e) => setNou({ ...nou, nom: e.target.value })} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Matrícula *</label>
              <input value={nou.matricula} onChange={(e) => setNou({ ...nou, matricula: e.target.value })} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Color</label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((c) => (
                  <button key={c} type="button" onClick={() => setNou({ ...nou, color: c })}
                    className={`w-7 h-7 rounded-full border-2 ${nou.color === c ? "border-gray-800 scale-110" : "border-transparent"}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Conductor</label>
              <select value={nou.conductorId} onChange={(e) => setNou({ ...nou, conductorId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Sense conductor</option>
                {conductors.map((u) => <option key={u.id} value={u.id}>{u.nom}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setMostrarForm(false)}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Cancel·lar</button>
            <button type="submit" disabled={guardant}
              className="px-4 py-2 text-sm bg-blue-700 text-white rounded-lg disabled:opacity-50">
              {guardant ? "Guardant..." : "Crear camió"}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {["Color", "Nom", "Matrícula", "Conductor assignat", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {camions.map((camio) => (
              <tr key={camio.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <span className="w-5 h-5 rounded-full inline-block" style={{ backgroundColor: camio.color }} />
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">{camio.nom}</td>
                <td className="px-4 py-3 text-gray-600 font-mono">{camio.matricula}</td>
                <td className="px-4 py-3">
                  <select
                    value={camio.conductorId || ""}
                    onChange={(e) => handleActualitzarConductor(camio.id, e.target.value)}
                    className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sense conductor</option>
                    {conductors.map((u) => <option key={u.id} value={u.id}>{u.nom}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <Save size={14} className="text-green-500" aria-label="Canvi guardat automàticament" />
                </td>
              </tr>
            ))}
            {camions.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Cap camió registrat</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
