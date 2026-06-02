"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Search, X, Check } from "lucide-react";
import { normalitzarText } from "@/lib/utils";

interface Client {
  id: string;
  nom: string;
}

interface SelectorClientProps {
  clients: Client[];
  value: string; // clientId seleccionat
  onChange: (clientId: string) => void;
}

export default function SelectorClient({ clients, value, onChange }: SelectorClientProps) {
  const [cerca, setCerca] = useState("");
  const [obert, setObert] = useState(false);
  const [indexActiu, setIndexActiu] = useState(0);
  const contenidorRef = useRef<HTMLDivElement>(null);

  const seleccionat = clients.find((c) => c.id === value);

  // Filtra per subcadena normalitzada (troba el terme encara que no sigui la 1a paraula)
  const resultats = useMemo(() => {
    const q = normalitzarText(cerca);
    if (!q) return clients;
    return clients
      .map((c) => ({ c, norm: normalitzarText(c.nom) }))
      .filter(({ norm }) => norm.includes(q))
      // Prioritza els que comencen pel terme
      .sort((a, b) => {
        const aStart = a.norm.startsWith(q) ? 0 : 1;
        const bStart = b.norm.startsWith(q) ? 0 : 1;
        if (aStart !== bStart) return aStart - bStart;
        return a.c.nom.localeCompare(b.c.nom);
      })
      .map(({ c }) => c);
  }, [cerca, clients]);

  // Tancar en clicar fora
  useEffect(() => {
    function fora(e: MouseEvent) {
      if (contenidorRef.current && !contenidorRef.current.contains(e.target as Node)) {
        setObert(false);
      }
    }
    document.addEventListener("mousedown", fora);
    return () => document.removeEventListener("mousedown", fora);
  }, []);

  function seleccionar(c: Client) {
    onChange(c.id);
    setCerca("");
    setObert(false);
  }

  function handleTecla(e: React.KeyboardEvent) {
    if (!obert && (e.key === "ArrowDown" || e.key === "Enter")) {
      setObert(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndexActiu((i) => Math.min(i + 1, resultats.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndexActiu((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (resultats[indexActiu]) seleccionar(resultats[indexActiu]);
    } else if (e.key === "Escape") {
      setObert(false);
    }
  }

  return (
    <div className="relative" ref={contenidorRef}>
      {seleccionat && !obert ? (
        // Estat seleccionat: mostra el client triat amb opció de canviar
        <button
          type="button"
          onClick={() => {
            setObert(true);
            setCerca("");
            setIndexActiu(0);
          }}
          className="w-full flex items-center justify-between border border-gray-300 rounded-lg px-3 py-2 text-sm text-left hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <span className="font-medium text-gray-900">{seleccionat.nom}</span>
          <span
            onClick={(ev) => {
              ev.stopPropagation();
              onChange("");
              setCerca("");
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={15} />
          </span>
        </button>
      ) : (
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={cerca}
            autoFocus={obert}
            onChange={(e) => {
              setCerca(e.target.value);
              setObert(true);
              setIndexActiu(0);
            }}
            onFocus={() => setObert(true)}
            onKeyDown={handleTecla}
            placeholder="Escriu per cercar un client (ex: noel)..."
            className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {obert && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
          {resultats.length === 0 ? (
            <p className="px-3 py-2.5 text-sm text-gray-400">Cap client coincideix</p>
          ) : (
            resultats.map((c, i) => (
              <button
                key={c.id}
                type="button"
                onClick={() => seleccionar(c)}
                onMouseEnter={() => setIndexActiu(i)}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left ${
                  i === indexActiu ? "bg-blue-50 text-blue-800" : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {c.nom}
                {c.id === value && <Check size={14} className="text-blue-600" />}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
