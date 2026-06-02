import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatHora(hora: string): string {
  return hora;
}

export function formatData(data: Date | string): string {
  const d = typeof data === "string" ? new Date(data) : data;
  return d.toLocaleDateString("ca-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// Retorna els 5 dies (Dilluns–Divendres) de la setmana que conté dataStr (YYYY-MM-DD)
export function setmanaDe(dataStr: string): { dies: string[]; inici: string; fi: string } {
  const d = new Date(dataStr + "T12:00:00Z");
  const dow = d.getUTCDay(); // 0=diumenge .. 6=dissabte
  const offsetDilluns = dow === 0 ? -6 : 1 - dow;
  const dilluns = new Date(d);
  dilluns.setUTCDate(d.getUTCDate() + offsetDilluns);

  const dies: string[] = [];
  for (let i = 0; i < 5; i++) {
    const x = new Date(dilluns);
    x.setUTCDate(dilluns.getUTCDate() + i);
    dies.push(x.toISOString().split("T")[0]);
  }
  return { dies, inici: dies[0], fi: dies[4] };
}

const NOMS_DIES = ["Dilluns", "Dimarts", "Dimecres", "Dijous", "Divendres"];

export function nomDia(index: number): string {
  return NOMS_DIES[index] || "";
}

export function diaMes(dataStr: string): string {
  const d = new Date(dataStr + "T12:00:00Z");
  return `${d.getUTCDate()}/${d.getUTCMonth() + 1}`;
}

export function normalitzarText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}
