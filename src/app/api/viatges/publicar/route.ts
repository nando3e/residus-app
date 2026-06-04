import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { emitreEsdeveniment } from "@/lib/sse";
import { enviarNotificacio, enllacConductor, construirDeeplink, origenDeSessio } from "@/lib/notificacions";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autoritzat" }, { status: 401 });

  const { data } = await req.json();

  if (!data) return NextResponse.json({ error: "Cal indicar la data" }, { status: 400 });

  const d = new Date(data);
  const dFi = new Date(data);
  dFi.setDate(dFi.getDate() + 1);

  // Viatges pendents de publicar el dia: assignats en esborrany + marcats per eliminar
  const viatges = await prisma.viatge.findMany({
    where: {
      data: { gte: d, lt: dFi },
      OR: [
        { camioId: { not: null }, estatAssignacio: "esborrany" },
        { pendentEliminar: true },
      ],
    },
    include: {
      camio: { include: { conductor: true } },
      client: true,
    },
  });

  const eliminats = viatges.filter((v) => v.pendentEliminar);
  const aPublicar = viatges.filter(
    (v) => !v.pendentEliminar && v.camioId && v.estatAssignacio === "esborrany"
  );
  const origen = origenDeSessio(session);

  // 1) Cancel·lacions: notificar la baixa al conductor i esborrar de debò
  for (const v of eliminats) {
    const conductor = v.camio?.conductor;
    if (!conductor) continue;
    await enviarNotificacio({
      esdeveniment: "viatge.cancellat",
      versio: "1",
      prioritat: "alta",
      origen,
      destinatari: {
        rol: "conductor",
        id: conductor.id,
        nom: conductor.nom,
        telegram_chat_id: conductor.telegramChatId || undefined,
        telefon: conductor.telefon || undefined,
      },
      viatge: {
        id: v.id,
        client: v.clientOcasional || v.client?.nom,
        residu: v.tipusResidu,
        data: v.data.toISOString().slice(0, 10),
        hora: v.horaPrevista,
        camio: v.camio?.nom,
        matricula: v.camio?.matricula,
      },
      canvi: { tipus: "cancellacio" },
      missatge: `El viatge a ${v.clientOcasional || v.client?.nom} (${v.tipusResidu}) s'ha cancel·lat`,
      enllac: enllacConductor(),
      timestamp: new Date().toISOString(),
    });
  }
  if (eliminats.length) {
    const idsEliminar = eliminats.map((v) => v.id);
    await prisma.$transaction([
      prisma.incidencia.deleteMany({ where: { viatgeId: { in: idsEliminar } } }),
      prisma.foto.deleteMany({ where: { viatgeId: { in: idsEliminar } } }),
      prisma.logCanvi.deleteMany({ where: { viatgeId: { in: idsEliminar } } }),
      prisma.viatge.deleteMany({ where: { id: { in: idsEliminar } } }),
    ]);
    for (const delId of idsEliminar) emitreEsdeveniment("viatge_eliminat", { id: delId });
  }

  // 2) Detectar modificacions de viatges que JA estaven publicats (diff vs baseline)
  // Pre-carregar els camions antics (per als canvis de camió) en una sola consulta
  const camioPublicatIds = aPublicar
    .filter((v) => v.horaPublicada !== null && v.camioPublicatId !== null && v.camioPublicatId !== v.camioId)
    .map((v) => v.camioPublicatId as string);
  const camionsAntics = camioPublicatIds.length
    ? await prisma.camio.findMany({
        where: { id: { in: camioPublicatIds } },
        include: { conductor: true },
      })
    : [];
  const camioAnticPerId = Object.fromEntries(camionsAntics.map((c) => [c.id, c]));

  type Modificacio = {
    viatge: typeof aPublicar[0];
    conductor: NonNullable<NonNullable<typeof aPublicar[0]["camio"]>["conductor"]>;
    canvi: { tipus: "hora" | "dia" | "camio"; abans?: string; despres?: string; conductorAntic?: { id: string; nom: string; telegram_chat_id?: string; telefon?: string }; conductorNou?: { id: string; nom: string; telegram_chat_id?: string; telefon?: string } };
    missatge: string;
    diaActual: string;
  };
  const modificats: Modificacio[] = [];
  for (const v of aPublicar) {
    if (v.horaPublicada === null) continue; // viatge nou (mai publicat)
    const diaPublicat = v.dataPublicada ? v.dataPublicada.toISOString().slice(0, 10) : null;
    const diaActual = v.data.toISOString().slice(0, 10);
    const horaCanviada = v.horaPublicada !== v.horaPrevista;
    const diaCanviat = diaPublicat !== null && diaPublicat !== diaActual;
    const camioCanviat = v.camioPublicatId !== v.camioId;
    if (!horaCanviada && !diaCanviat && !camioCanviat) continue;

    const canvis: string[] = [];
    if (camioCanviat) canvis.push(`Camió canviat`);
    if (horaCanviada) canvis.push(`Hora: ${v.horaPublicada} → ${v.horaPrevista}`);
    if (diaCanviat) canvis.push(`Data: ${diaPublicat} → ${diaActual}`);

    const conductor = v.camio?.conductor;
    if (!conductor) continue;

    let canvi: Modificacio["canvi"] = horaCanviada
      ? { tipus: "hora", abans: v.horaPublicada || undefined, despres: v.horaPrevista }
      : diaCanviat
      ? { tipus: "dia", abans: diaPublicat || undefined, despres: diaActual }
      : { tipus: "camio", despres: v.camio?.nom };

    // Canvi de camió: afegir conductor antic i nou al payload perquè el Motor pugui avisar els dos
    if (camioCanviat) {
      const antic = v.camioPublicatId ? camioAnticPerId[v.camioPublicatId] : null;
      canvi = {
        ...canvi,
        conductorAntic: antic?.conductor
          ? { id: antic.conductor.id, nom: antic.conductor.nom, telegram_chat_id: antic.conductor.telegramChatId || undefined, telefon: antic.conductor.telefon || undefined }
          : undefined,
        conductorNou: { id: conductor.id, nom: conductor.nom, telegram_chat_id: conductor.telegramChatId || undefined, telefon: conductor.telefon || undefined },
      };
    }

    modificats.push({ viatge: v, conductor, canvi, missatge: canvis.join(" · "), diaActual });
  }

  // Publicar i congelar el baseline (estat publicat) per al pròxim diff
  for (const viatge of aPublicar) {
    await prisma.viatge.update({
      where: { id: viatge.id },
      data: {
        estatAssignacio: "publicat",
        conductorSnapshot: viatge.camio?.conductor?.nom || null,
        dataPublicada: viatge.data,
        horaPublicada: viatge.horaPrevista,
        camioPublicatId: viatge.camioId,
      },
    });
  }

  // 3) Notificar els canvis concrets (viatges ja publicats que s'han modificat)
  for (const m of modificats) {
    await enviarNotificacio({
      esdeveniment: "viatge.modificat",
      versio: "1",
      prioritat: "normal",
      origen,
      destinatari: {
        rol: "conductor",
        id: m.conductor.id,
        nom: m.conductor.nom,
        telegram_chat_id: m.conductor.telegramChatId || undefined,
        telefon: m.conductor.telefon || undefined,
      },
      viatge: {
        id: m.viatge.id,
        client: m.viatge.clientOcasional || m.viatge.client?.nom,
        residu: m.viatge.tipusResidu,
        data: m.diaActual,
        hora: m.viatge.horaPrevista,
        camio: m.viatge.camio?.nom,
        matricula: m.viatge.camio?.matricula,
      },
      canvi: m.canvi,
      missatge: m.missatge,
      enllac: construirDeeplink(m.viatge.id),
      timestamp: new Date().toISOString(),
    });
  }

  // 4) "Tens N viatges per avui": només a conductors amb viatges NOUS (mai publicats)
  const nous = aPublicar.filter((v) => v.horaPublicada === null);
  const conductorsNotificats = new Set<string>();
  for (const viatge of nous) {
    const conductor = viatge.camio?.conductor;
    if (!conductor || conductorsNotificats.has(conductor.id)) continue;
    conductorsNotificats.add(conductor.id);

    const n = aPublicar.filter((v) => v.camio?.conductorId === conductor.id).length;
    await enviarNotificacio({
      esdeveniment: "jornada.publicada",
      versio: "1",
      prioritat: "normal",
      origen,
      destinatari: {
        rol: "conductor",
        id: conductor.id,
        nom: conductor.nom,
        telegram_chat_id: conductor.telegramChatId || undefined,
        telefon: conductor.telefon || undefined,
      },
      missatge: `Tens ${n} viatge${n > 1 ? "s" : ""} per avui`,
      enllac: enllacConductor(),
      timestamp: new Date().toISOString(),
    });
  }

  emitreEsdeveniment("jornada_publicada", { data });

  return NextResponse.json({
    publicats: aPublicar.length,
    modificats: modificats.length,
    eliminats: eliminats.length,
  });
}
