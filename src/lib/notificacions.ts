// Envelope estàndard d'esdeveniments.
// L'app SEMPRE fa POST d'aquest objecte al webhook (Motor / n8n).
// El Motor decideix el canal (correu, WhatsApp, Telegram...) i filtra per
// esdeveniment / prioritat / destinatari.rol / origen.actor.

type Actor = "gestor" | "conductor" | "motor";
type Prioritat = "alta" | "normal" | "baixa";

interface Origen {
  actor: Actor;
  id?: string;
  nom?: string;
}

interface Destinatari {
  rol: "conductor" | "gestor";
  id?: string;
  nom: string;
  telegram_chat_id?: string;
  telefon?: string;
  email?: string;
}

interface ContextViatge {
  id?: string;
  client?: string;
  residu?: string;
  data?: string;
  hora?: string;
  camio?: string;
  matricula?: string;
}

interface Canvi {
  tipus: "hora" | "dia" | "camio" | "cancellacio";
  abans?: string;
  despres?: string;
}

interface IncidenciaInfo {
  tipus: string;
  detall?: string;
}

export interface Esdeveniment {
  esdeveniment: string; // ex. "viatge.modificat", "incidencia.critica" (namespaced → fàcil de filtrar)
  versio: "1";
  prioritat: Prioritat;
  origen: Origen; // DE ON VE
  destinatari: Destinatari; // PER A QUI
  viatge?: ContextViatge;
  canvi?: Canvi;
  incidencia?: IncidenciaInfo;
  missatge?: string; // text llegible ja muntat (opcional, per enviar tal qual)
  enllac?: string;
  timestamp: string;
}

export async function enviarNotificacio(ev: Esdeveniment): Promise<boolean> {
  const url = process.env.N8N_WEBHOOK_URL;
  const secret = process.env.N8N_WEBHOOK_SECRET;

  if (!url) {
    console.log(`[notificacions] sense webhook configurat, saltant esdeveniment '${ev.esdeveniment}'`);
    return true;
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(secret ? { "x-webhook-secret": secret } : {}),
      },
      body: JSON.stringify(ev),
    });
    return res.ok;
  } catch (err) {
    console.error("[notificacions] error enviant esdeveniment:", err);
    return false;
  }
}

// Origen a partir de la sessió (qui dispara l'acció)
export function origenDeSessio(session: any): Origen {
  const rol = session?.user?.rol;
  return {
    actor: rol === "conductor" ? "conductor" : "gestor",
    id: session?.user?.id,
    nom: session?.user?.name || undefined,
  };
}

export function construirDeeplink(viatgeId: string): string {
  const base = process.env.APP_BASE_URL || "http://localhost:3000";
  return `${base}/tauler/viatge/${viatgeId}`;
}

// Enllaç a l'app del conductor (la seva llista de viatges del dia)
export function enllacConductor(): string {
  const base = process.env.APP_BASE_URL || "http://localhost:3000";
  return `${base}/conductor`;
}
