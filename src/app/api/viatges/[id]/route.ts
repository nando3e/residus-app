import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { emitreEsdeveniment } from "@/lib/sse";
import { enviarNotificacio, construirDeeplink, enllacConductor, origenDeSessio } from "@/lib/notificacions";
import { t } from "@/lib/textos";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autoritzat" }, { status: 401 });

  const { id } = await params;
  const viatge = await prisma.viatge.findUnique({
    where: { id },
    include: {
      client: true,
      camio: { include: { conductor: true } },
      fotos: true,
      incidencies: true,
      logCanvis: { include: { autor: true }, orderBy: { timestamp: "desc" } },
    },
  });

  if (!viatge) return NextResponse.json({ error: "No trobat" }, { status: 404 });
  return NextResponse.json(viatge);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autoritzat" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const userId = (session.user as any).id;

  // La "nota" no és una columna: es registra com a entrada de l'historial
  const { nota, ...dades } = body;

  const viatgeAntic = await prisma.viatge.findUnique({
    where: { id },
    include: { camio: { include: { conductor: true } }, client: true },
  });

  if (!viatgeAntic) return NextResponse.json({ error: "No trobat" }, { status: 404 });

  const incloure = {
    client: true,
    camio: { include: { conductor: true } },
    fotos: true,
    incidencies: true,
    logCanvis: { include: { autor: true }, orderBy: { timestamp: "desc" as const } },
  };

  const viatge = Object.keys(dades).length
    ? await prisma.viatge.update({ where: { id }, data: dades, include: incloure })
    : await prisma.viatge.findUniqueOrThrow({ where: { id }, include: incloure });

  // Nota lliure del conductor → historial
  if (nota && String(nota).trim()) {
    await prisma.logCanvi.create({
      data: {
        viatgeId: id,
        tipus: "nota",
        detall: String(nota).trim(),
        autorId: userId !== "superadmin" ? userId : undefined,
      },
    });
  }

  // Detecció de canvis
  const diaAntic = viatgeAntic.data.toISOString().slice(0, 10);
  const diaNou = body.data ? new Date(body.data).toISOString().slice(0, 10) : diaAntic;
  const horaCanviada = !!body.horaPrevista && body.horaPrevista !== viatgeAntic.horaPrevista;
  const diaCanviat = diaNou !== diaAntic;
  const camioCanviat = body.camioId !== undefined && body.camioId !== viatgeAntic.camioId;

  // Log del canvi
  const canvis = [];
  if (camioCanviat) canvis.push(`Camió canviat`);
  if (horaCanviada) canvis.push(`Hora: ${viatgeAntic.horaPrevista} → ${body.horaPrevista}`);
  if (diaCanviat) canvis.push(`Data: ${diaAntic} → ${diaNou}`);
  if (body.estatExecucio && body.estatExecucio !== viatgeAntic.estatExecucio) {
    const abans = t.estats[viatgeAntic.estatExecucio] || viatgeAntic.estatExecucio;
    const despres = t.estats[body.estatExecucio] || body.estatExecucio;
    canvis.push(`Estat: ${abans} → ${despres}`);
  }

  if (canvis.length > 0) {
    await prisma.logCanvi.create({
      data: {
        viatgeId: id,
        tipus: "actualitzacio",
        detall: canvis.join(", "),
        autorId: userId !== "superadmin" ? userId : undefined,
      },
    });
  }

  // Emetre SSE
  emitreEsdeveniment("viatge_actualitzat", viatge);

  // Notificar si canvi post-publicació important (hora, dia o camió)
  if (
    viatgeAntic.estatAssignacio === "publicat" &&
    (camioCanviat || horaCanviada || diaCanviat) &&
    viatge.camio?.conductor
  ) {
    const conductor = viatge.camio.conductor;
    const canvi: { tipus: "hora" | "dia" | "camio"; abans?: string; despres?: string } = horaCanviada
      ? { tipus: "hora", abans: viatgeAntic.horaPrevista, despres: viatge.horaPrevista }
      : diaCanviat
      ? { tipus: "dia", abans: diaAntic, despres: diaNou }
      : { tipus: "camio", despres: viatge.camio?.nom };

    await enviarNotificacio({
      esdeveniment: "viatge.modificat",
      versio: "1",
      prioritat: "normal",
      origen: origenDeSessio(session),
      destinatari: {
        rol: "conductor",
        id: conductor.id,
        nom: conductor.nom,
        telegram_chat_id: conductor.telegramChatId || undefined,
        telefon: conductor.telefon || undefined,
      },
      viatge: {
        id,
        client: viatge.client.nom,
        residu: viatge.tipusResidu,
        data: diaNou,
        hora: viatge.horaPrevista,
        camio: viatge.camio?.nom,
        matricula: viatge.camio?.matricula,
      },
      canvi,
      missatge: canvis.join(" · "),
      enllac: construirDeeplink(id),
      timestamp: new Date().toISOString(),
    });
  }

  return NextResponse.json(viatge);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autoritzat" }, { status: 401 });

  const { id } = await params;

  const viatge = await prisma.viatge.findUnique({
    where: { id },
    include: { camio: { include: { conductor: true } }, client: true },
  });
  if (!viatge) return NextResponse.json({ error: "No trobat" }, { status: 404 });

  // Si estava publicat, notificar la cancel·lació al conductor
  if (viatge.estatAssignacio === "publicat" && viatge.camio?.conductor) {
    const conductor = viatge.camio.conductor;
    await enviarNotificacio({
      esdeveniment: "viatge.cancellat",
      versio: "1",
      prioritat: "alta",
      origen: origenDeSessio(session),
      destinatari: {
        rol: "conductor",
        id: conductor.id,
        nom: conductor.nom,
        telegram_chat_id: conductor.telegramChatId || undefined,
        telefon: conductor.telefon || undefined,
      },
      viatge: {
        id,
        client: viatge.client.nom,
        residu: viatge.tipusResidu,
        data: viatge.data.toISOString().slice(0, 10),
        hora: viatge.horaPrevista,
        camio: viatge.camio?.nom,
        matricula: viatge.camio?.matricula,
      },
      canvi: { tipus: "cancellacio" },
      missatge: `El viatge a ${viatge.client.nom} (${viatge.tipusResidu}) s'ha cancel·lat`,
      enllac: enllacConductor(),
      timestamp: new Date().toISOString(),
    });
  }

  // Esborrar fills i el viatge (sense onDelete cascade a l'esquema)
  await prisma.$transaction([
    prisma.incidencia.deleteMany({ where: { viatgeId: id } }),
    prisma.foto.deleteMany({ where: { viatgeId: id } }),
    prisma.logCanvi.deleteMany({ where: { viatgeId: id } }),
    prisma.viatge.delete({ where: { id } }),
  ]);

  emitreEsdeveniment("viatge_eliminat", { id });

  return NextResponse.json({ ok: true });
}
