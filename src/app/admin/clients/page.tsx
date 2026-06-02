"use client";

import { useState, useEffect } from "react";
import { Plus, X } from "lucide-react";

interface Client {
  id: string; nom: string; telefon?: string; adreca?: string;
  email?: string; instruccionsEspecials?: string; actiu: boolean
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editant, setEditant] = useState<Client | null>(null);
  const [form, setForm] = useState({ nom: "", telefon: "", adreca: "", email: "", instruccionsEspecials: "" });
  const [guardant, setGuardant] = useState(false);

  async function carregar() {
    const res = await fetch("/api/clients");
    setClients(await res.json());
  }

  useEffect(() => { carregar(); }, []);

  function iniciar(c?: Client) {
    if (c) {
      setEditant(c);
      setForm({ nom: c.nom, telefon: c.telefon || "", adreca: c.adreca || "", email: c.email || "", instruccionsEspecials: c.instruccionsEspecials || "" });
    } else {
      setEditant(null);
      setForm({ nom: "", telefon: "", adreca: "", email: "", instruccionsEspecials: "" });
    }
    setMostrarForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGuardant(true);
    const res = editant
      ? await fetch(`/api/clients/${editant.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      : await fetch("/api/clients", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setGuardant(false);
    if (res.ok) { setMostrarForm(false); setEditant(null); carregar(); }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestió de clients</h1>
        <button onClick={() => iniciar()} className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-700 hover:bg-blue-800 text-white rounded-lg">
          <Plus size={15} /> Nou client
        </button>
      </div>

      {mostrarForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-5 mb-4 space-y-4">
          <h3 className="font-semibold text-gray-800">{editant ? "Editar client" : "Nou client"}</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Nom *", key: "nom", required: true },
              { label: "Telèfon", key: "telefon" },
              { label: "Adreça", key: "adreca" },
              { label: "Email", key: "email" },
            ].map(({ label, key, required }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                <input
                  value={(form as any)[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  required={required}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Instruccions especials</label>
            <textarea
              value={form.instruccionsEspecials}
              onChange={(e) => setForm({ ...form, instruccionsEspecials: e.target.value })}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setMostrarForm(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Cancel·lar</button>
            <button type="submit" disabled={guardant} className="px-4 py-2 text-sm bg-blue-700 text-white rounded-lg disabled:opacity-50">
              {guardant ? "Guardant..." : "Guardar"}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {["Nom", "Telèfon", "Adreça", "Instruccions especials", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {clients.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{c.nom}</td>
                <td className="px-4 py-3 text-gray-600">{c.telefon || "—"}</td>
                <td className="px-4 py-3 text-gray-600">{c.adreca || "—"}</td>
                <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">{c.instruccionsEspecials || "—"}</td>
                <td className="px-4 py-3">
                  <button onClick={() => iniciar(c)} className="text-xs text-blue-600 hover:underline">Editar</button>
                </td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Cap client registrat</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
