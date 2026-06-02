"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { t } from "@/lib/textos";

export default function LoginPage() {
  const [usuari, setUsuari] = useState("");
  const [contrasenya, setContrasenya] = useState("");
  const [error, setError] = useState("");
  const [carregant, setCarregant] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCarregant(true);

    const res = await signIn("credentials", {
      usuari,
      password: contrasenya,
      redirect: false,
    });

    setCarregant(false);

    if (res?.error) {
      setError(t.auth.errorCredencials);
    } else {
      // El middleware redirigeix conductors a /conductor
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-blue-700 px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/images/logo-empresa.png"
            alt="Logo"
            width={72}
            height={72}
            className="rounded-xl mb-3"
          />
          <h1 className="text-2xl font-bold text-gray-900">{t.app.nom}</h1>
          <p className="text-sm text-gray-500 mt-1">{t.app.slogan}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.auth.usuari}
            </label>
            <input
              type="text"
              value={usuari}
              onChange={(e) => setUsuari(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoComplete="username"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.auth.contrasenya}
            </label>
            <input
              type="password"
              value={contrasenya}
              onChange={(e) => setContrasenya(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={carregant}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {carregant ? "Entrant..." : t.auth.entrar}
          </button>
        </form>
      </div>
    </div>
  );
}
