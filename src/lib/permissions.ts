type Rol = "superadmin" | "gestio" | "conductor";

type Accio =
  | "veure_tauler"
  | "assignar_viatges"
  | "publicar_jornada"
  | "veure_historial"
  | "gestionar_usuaris"
  | "gestionar_camions"
  | "gestionar_clients"
  | "veure_bustia_fotos"
  | "veure_viatges_conductor"
  | "canviar_estat_viatge"
  | "crear_incidencia";

const PERMISOS: Record<Rol, Accio[]> = {
  superadmin: [
    "veure_tauler",
    "assignar_viatges",
    "publicar_jornada",
    "veure_historial",
    "gestionar_usuaris",
    "gestionar_camions",
    "gestionar_clients",
    "veure_bustia_fotos",
    "veure_viatges_conductor",
    "canviar_estat_viatge",
    "crear_incidencia",
  ],
  gestio: [
    "veure_tauler",
    "assignar_viatges",
    "publicar_jornada",
    "veure_historial",
    "gestionar_clients",
    "veure_bustia_fotos",
    "canviar_estat_viatge",
  ],
  conductor: ["veure_viatges_conductor", "canviar_estat_viatge", "crear_incidencia"],
};

export function pot(rol: Rol, accio: Accio): boolean {
  return PERMISOS[rol]?.includes(accio) ?? false;
}
