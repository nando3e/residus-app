"use client";

import { useState, useEffect } from "react";
import { t } from "@/lib/textos";
import { Plus, X, Check } from "lucide-react";

interface Usuari {
  id: string; nom: string; usuari: string; rol: string;
  telefon?: string; telegramChatId?: string; actiu: boolean
}

export default function UsuarisPage() {
  const [usuaris, setUsuaris] = useState<Usuari[]>([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editant, setEditant] = useState<Usuari | null>(null);
  const [form, setForm] = useState({ nom: "", usuari: "", contrasenya: "", rol: "conductor", telefon: "", telegramChatId: "" });
  const [guardant, setGuardant] = useState(false);
  const [error, setError] = useState("");

  async function carregarUsuaris() {
    const res = await fetch("/api/usuaris");
    if (res.ok) setUsuaris(await res.json());
  }

  useEffect(() => { carregarUsuaris(); }, []);

  function iniciarEdicio(u: Usuari) {
    setEditant(u);
    setForm({ nom: u.nom, usuari: u.usuari, contrasenya: "", rol: u.rol, telefon: u.telefon || "", telegramChatId: u.telegramChatId || "" });
    setMostrarForm(true);
  }

  function cancellar() {
    setMostrarForm(false);
    setEditant(null);
    setForm({ nom: "", usuari: "", contrasenya: "", rol: "conductor", telefon: "", telegramChatId: "" });
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGuardant(true);
    setError("");

    const res = editant
      ? await fetch(`/api/usuaris/${editant.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nom: form.nom, contrasenya: form.contrasenya || undefined, telefon: form.telefon, telegramChatId: form.telegramChatId, actiu: true }),
        })
      : await fetch("/api/usuaris", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });

    setGuardant(false);
    if (res.ok) {
      cancellar();
      carregarUsuaris();
    } else {
      const d = await res.json();
      setError(d.error || "Error en guardar");
    }
  }

  async function toggleActiu(id: string, actiu: boolean) {
    await fetch(`/api/usuaris/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actiu: !actiu }),
    });
    carregarUsuaris();
  }

  const rolLabel = (rol: string) => ({ superadmin: "Superadmin", gestio: "Gestió", conductor: "Conductor" }[rol] || rol);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t.usuaris.titol}</h1>
        <button onClick={() => setMostrarForm(true)} className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-700 hover:bg-blue-800 text-white rounded-lg">
          <Plus size={15} /> {t.usuaris.nou}
        </button>
      </div>

      {mostrarForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-5 mb-4 space-y-4">
          <h3 className="font-semibold text-gray-800">{editant ? "Editar usuari" : "Nou usuari"}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nom complet *</label>
              <input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nom d'usuari *</label>
              <input value={form.usuari} onChange={(e) => setForm({ ...form, usuari: e.target.value })} required disabled={!!editant}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Contrasenya {editant ? "(deixa buit per no canviar)" : "*"}
              </label>
              <input type="password" value={form.contrasenya} onChange={(e) => setForm({ ...form, contrasenya: e.target.value })} required={!editant}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Rol *</label>
              <select value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })} disabled={!!editant}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50">
                <option value="gestio">Gestió</option>
                <option value="conductor">Conductor</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Telèfon</label>
              <input value={form.telefon} onChange={(e) => setForm({ ...form, telefon: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Telegram Chat ID</label>
              <input value={form.telegramChatId} onChange={(e) => setForm({ ...form, telegramChatId: e.target.value })}
                placeholder="Per a notificacions"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={cancellar} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Cancel·lar</button>
            <button type="submit" disabled={guardant} className="px-4 py-2 text-sm bg-blue-700 text-white rounded-lg disabled:opacity-50">
              {guardant ? "Guardant..." : t.usuaris.guardar}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {["Nom", "Usuari", "Rol", "Telèfon", "Telegram", "Actiu", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {usuaris.map((u) => (
              <tr key={u.id} className={!u.actiu ? "opacity-50" : "hover:bg-gray-50"}>
                <td className="px-4 py-3 font-medium text-gray-900">{u.nom}</td>
                <td className="px-4 py-3 text-gray-600 font-mono">{u.usuari}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    u.rol === "superadmin" ? "bg-purple-100 text-purple-700"
                    : u.rol === "gestio" ? "bg-blue-100 text-blue-700"
                    : "bg-green-100 text-green-700"
                  }`}>{rolLabel(u.rol)}</span>
                </td>
                <td className="px-4 py-3 text-gray-600">{u.telefon || "—"}</td>
                <td className="px-4 py-3 text-gray-600">{u.telegramChatId || "—"}</td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleActiu(u.id, u.actiu)}
                    className={`p-1 rounded ${u.actiu ? "text-green-500 hover:bg-green-50" : "text-gray-400 hover:bg-gray-100"}`}>
                    {u.actiu ? <Check size={16} /> : <X size={16} />}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => iniciarEdicio(u)} className="text-xs text-blue-600 hover:underline">Editar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
