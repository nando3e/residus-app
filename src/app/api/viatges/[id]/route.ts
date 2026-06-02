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

  // La "nota" no és una columna: es registra com a entrada de l'historial.
  // "scope" indica si un canvi de data/hora s'aplica a tota la sèrie ("serie") o només a aquest viatge.
  const { nota, scope, ...dades } = body;

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

  // Propagació a la sèrie: només canvis de data/hora, només viatges pendents d'avui en endavant.
  // Els viatges passats o ja recollits/tancats es respecten.
  if (scope === "serie" && viatgeAntic.serieId && (horaCanviada || diaCanviat)) {
    const avui = new Date(new Date().toISOString().split("T")[0] + "T00:00:00.000Z");
    const germans = await prisma.viatge.findMany({
      where: {
        serieId: viatgeAntic.serieId,
        id: { not: id },
        data: { gte: avui },
        estatExecucio: "pendent",
      },
    });
    const deltaDies = diaCanviat
      ? Math.round(
          (new Date(diaNou + "T00:00:00.000Z").getTime() -
            new Date(diaAntic + "T00:00:00.000Z").getTime()) /
            86_400_000
        )
      : 0;
    if (germans.length) {
      await prisma.$transaction(
        germans.map((g) => {
          const novaData = new Date(g.data);
          if (deltaDies) novaData.setUTCDate(novaData.getUTCDate() + deltaDies);
          return prisma.viatge.update({
            where: { id: g.id },
            data: {
              ...(horaCanviada ? { horaPrevista: body.horaPrevista } : {}),
              ...(diaCanviat ? { data: novaData } : {}),
            },
          });
        })
      );
      // Un sol esdeveniment basta perquè el client recarregui tota la vista
      emitreEsdeveniment("viatge_actualitzat", viatge);
    }
  }

  return NextResponse.json(viatge);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autoritzat" }, { status: 401 });

  const { id } = await params;
  const scope = new URL(req.url).searchParams.get("scope"); // "serie" | null

  const viatge = await prisma.viatge.findUnique({
    where: { id },
    include: { camio: { include: { conductor: true } }, client: true },
  });
  if (!viatge) return NextResponse.json({ error: "No trobat" }, { status: 404 });

  // Determinar quins viatges s'eliminen.
  // Sèrie: el viatge clicat + els germans pendents d'avui en endavant (es respecten passats/tancats).
  let objectiu = [viatge];
  if (scope === "serie" && viatge.serieId) {
    const avui = new Date(new Date().toISOString().split("T")[0] + "T00:00:00.000Z");
    const germans = await prisma.viatge.findMany({
      where: {
        serieId: viatge.serieId,
        id: { not: id },
        data: { gte: avui },
        estatExecucio: "pendent",
      },
      include: { camio: { include: { conductor: true } }, client: true },
    });
    objectiu = [viatge, ...germans];
  }

  // Notificar la cancel·lació al conductor de cada viatge publicat
  for (const v of objectiu) {
    if (v.estatAssignacio === "publicat" && v.camio?.conductor) {
      const conductor = v.camio.conductor;
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
          id: v.id,
          client: v.client.nom,
          residu: v.tipusResidu,
          data: v.data.toISOString().slice(0, 10),
          hora: v.horaPrevista,
          camio: v.camio?.nom,
          matricula: v.camio?.matricula,
        },
        canvi: { tipus: "cancellacio" },
        missatge: `El viatge a ${v.client.nom} (${v.tipusResidu}) s'ha cancel·lat`,
        enllac: enllacConductor(),
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Esborrar fills i els viatges (sense onDelete cascade a l'esquema)
  const ids = objectiu.map((v) => v.id);
  await prisma.$transaction([
    prisma.incidencia.deleteMany({ where: { viatgeId: { in: ids } } }),
    prisma.foto.deleteMany({ where: { viatgeId: { in: ids } } }),
    prisma.logCanvi.deleteMany({ where: { viatgeId: { in: ids } } }),
    prisma.viatge.deleteMany({ where: { id: { in: ids } } }),
  ]);

  for (const delId of ids) emitreEsdeveniment("viatge_eliminat", { id: delId });

  return NextResponse.json({ ok: true, eliminats: ids.length });
}
