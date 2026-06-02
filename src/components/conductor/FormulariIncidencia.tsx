"use client";

import { useState, useRef } from "react";
import { t } from "@/lib/textos";
import { X, Camera } from "lucide-react";
import { comprimirImatge } from "@/lib/imatge";

interface FormulariIncidenciaProps {
  viatgeId: string;
  onTancar: () => void;
  onEnviat: () => Promise<void>;
}

const TIPUS = [
  { id: "retard", label: t.incidencies.retard, emoji: "⏰" },
  { id: "client_tancat", label: t.incidencies.client_tancat, emoji: "🔒" },
  { id: "residu_no_apte", label: t.incidencies.residu_no_apte, emoji: "🚫" },
  { id: "problema_camio", label: t.incidencies.problema_camio, emoji: "🔧" },
  { id: "altra", label: t.incidencies.altra, emoji: "📝" },
];

export default function FormulariIncidencia({ viatgeId, onTancar, onEnviat }: FormulariIncidenciaProps) {
  const [tipus, setTipus] = useState("");
  const [detall, setDetall] = useState("");
  const [estimacioTemps, setEstimacioTemps] = useState("");
  const [fotos, setFotos] = useState<File[]>([]);
  const [previsualitzacio, setPrevisualitzacio] = useState<string[]>([]);
  const [enviant, setEnviant] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFotos(e: React.ChangeEvent<HTMLInputElement>) {
    const fitxers = Array.from(e.target.files || []);
    setFotos((prev) => [...prev, ...fitxers]);
    fitxers.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (ev) => setPrevisualitzacio((prev) => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(f);
    });
  }

  async function handleEnviar(e: React.FormEvent) {
    e.preventDefault();
    if (!tipus) { setError("Cal seleccionar el tipus d'incidència"); return; }
    if (tipus === "residu_no_apte" && fotos.length === 0) {
      setError(t.incidencies.fotoObligatoria);
      return;
    }

    setEnviant(true);
    setError("");

    // Pujar fotos primer
    const fotoUrls: string[] = [];
    for (const foto of fotos) {
      const form = new FormData();
      const comprimida = await comprimirImatge(foto);
      form.append("foto", comprimida, (foto.name.replace(/\.[^.]+$/, "") || "foto") + ".jpg");
      const res = await fetch(`/api/viatges/${viatgeId}/fotos`, { method: "POST", body: form });
      if (res.ok) {
        const creades = await res.json();
        fotoUrls.push(...creades.map((f: any) => f.url));
      }
    }

    await fetch(`/api/viatges/${viatgeId}/incidencia`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipus,
        detall,
        estimacioTemps: estimacioTemps ? parseInt(estimacioTemps) : undefined,
        fotoUrls,
      }),
    });

    setEnviant(false);
    await onEnviat();
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center">
      <div className="bg-white rounded-t-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-lg font-bold text-gray-900">{t.incidencies.titol}</h2>
          <button onClick={onTancar} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleEnviar} className="p-5 space-y-5">
          {/* Tipus */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">{t.incidencies.tipus} *</label>
            <div className="space-y-2">
              {TIPUS.map((op) => (
                <button
                  key={op.id}
                  type="button"
                  onClick={() => setTipus(op.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                    tipus === op.id ? "border-blue-600 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="text-xl">{op.emoji}</span>
                  <span className="font-medium text-gray-800">{op.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Estimació temps (retard) */}
          {tipus === "retard" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.incidencies.estimacioTemps}</label>
              <input
                type="number"
                min="1"
                value={estimacioTemps}
                onChange={(e) => setEstimacioTemps(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: 30"
              />
            </div>
          )}

          {/* Detall */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.incidencies.detall}</label>
            <textarea
              value={detall}
              onChange={(e) => setDetall(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Fotos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.incidencies.afegirFoto}
              {tipus === "residu_no_apte" && " *"}
            </label>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              onChange={handleFotos}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-400 hover:text-blue-600 w-full justify-center"
            >
              <Camera size={18} />
              Fer foto o seleccionar
            </button>
            {previsualitzacio.length > 0 && (
              <div className="flex gap-2 mt-2 overflow-x-auto">
                {previsualitzacio.map((url, i) => (
                  <img key={i} src={url} alt="Preview" className="w-20 h-20 object-cover rounded-lg shrink-0" />
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <button
            type="submit"
            disabled={enviant}
            className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl py-3.5 font-semibold text-base disabled:opacity-50"
          >
            {enviant ? "Enviant..." : t.incidencies.enviar}
          </button>
        </form>
      </div>
    </div>
  );
}
