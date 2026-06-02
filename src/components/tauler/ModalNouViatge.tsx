"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import SelectorClient from "./SelectorClient";

interface Client {
  id: string;
  nom: string;
  adreca?: string;
  telefon?: string;
}

interface ModalNouViatgeProps {
  onTancar: () => void;
  onCreat: () => void;
  dataInicial: string;
  horaInicial?: string;
}

const RESIDUS_COMUNS = ["Cartró", "Paper", "Plàstic", "Vidre", "Metalls", "Orgànic", "Perillós", "Voluminosos", "Altres"];

export default function ModalNouViatge({ onTancar, onCreat, dataInicial, horaInicial = "09:00" }: ModalNouViatgeProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState("");
  const [tipusResidu, setTipusResidu] = useState("Cartró");
  const [data, setData] = useState(dataInicial);
  const [horaPrevista, setHoraPrevista] = useState(horaInicial);
  const [adreca, setAdreca] = useState("");
  const [instruccions, setInstruccions] = useState("");
  const [guardant, setGuardant] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/clients").then((r) => r.json()).then(setClients);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId) { setError("Cal seleccionar un client"); return; }
    setGuardant(true);
    setError("");

    const res = await fetch("/api/viatges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, tipusResidu, data, horaPrevista, adreca, instruccions }),
    });

    setGuardant(false);
    if (res.ok) {
      onCreat();
      onTancar();
    } else {
      setError("Error en crear el viatge");
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Nou viatge</h2>
          <button onClick={onTancar} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
            <SelectorClient clients={clients} value={clientId} onChange={setClientId} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipus de residu *</label>
            <select
              value={tipusResidu}
              onChange={(e) => setTipusResidu(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {RESIDUS_COMUNS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data *</label>
              <input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hora *</label>
              <input
                type="time"
                value={horaPrevista}
                onChange={(e) => setHoraPrevista(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Adreça (opcional)</label>
            <input
              type="text"
              value={adreca}
              onChange={(e) => setAdreca(e.target.value)}
              placeholder="Deixa buit per usar l'adreça del client"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instruccions especials</label>
            <textarea
              value={instruccions}
              onChange={(e) => setInstruccions(e.target.value)}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onTancar} className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancel·lar
            </button>
            <button type="submit" disabled={guardant} className="px-4 py-2 text-sm bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-medium disabled:opacity-50">
              {guardant ? "Creant..." : "Crear viatge"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
