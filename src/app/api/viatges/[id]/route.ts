import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { emitreEsdeveniment } from "@/lib/sse";
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

  // Detecció de canvis (cal calcular-ho ABANS d'actualitzar)
  const diaAntic = viatgeAntic.data.toISOString().slice(0, 10);
  const diaNou = body.data ? new Date(body.data).toISOString().slice(0, 10) : diaAntic;
  const horaCanviada = !!body.horaPrevista && body.horaPrevista !== viatgeAntic.horaPrevista;
  const diaCanviat = diaNou !== diaAntic;
  const camioCanviat = body.camioId !== undefined && body.camioId !== viatgeAntic.camioId;

  // Si es modifica un viatge ja publicat (hora/dia/camió), torna a esborrany:
  // el canvi queda pendent de publicar i no es notifica fins llavors.
  if (viatgeAntic.estatAssignacio === "publicat" && (camioCanviat || horaCanviada || diaCanviat)) {
    dades.estatAssignacio = "esborrany";
  }

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

  // Nota: els canvis sobre viatges publicats NO es notifiquen aquí.
  // El viatge torna a "esborrany" (més amunt) i la notificació al conductor
  // (viatge.modificat) s'envia quan es publica el dia (/api/viatges/publicar).

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
              // Si estava publicat, torna a esborrany perquè el canvi es pugui publicar.
              ...(g.estatAssignacio === "publicat" ? { estatAssignacio: "esborrany" as const } : {}),
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

  // Un viatge que ja s'ha publicat alguna vegada (el conductor el coneix) no s'esborra
  // de seguida: es marca per eliminar i la baixa es notifica quan es publica el dia.
  // Un viatge mai publicat s'esborra directament (el conductor no l'ha vist mai).
  const jaPublicat = (v: { horaPublicada: string | null }) => v.horaPublicada !== null;
  const perMarcar = objectiu.filter(jaPublicat);
  const perEsborrar = objectiu.filter((v) => !jaPublicat(v));

  // Marcar per eliminar (borrat suau)
  if (perMarcar.length) {
    const idsMarcar = perMarcar.map((v) => v.id);
    await prisma.viatge.updateMany({
      where: { id: { in: idsMarcar } },
      data: { pendentEliminar: true },
    });
    await prisma.logCanvi.createMany({
      data: idsMarcar.map((vid) => ({
        viatgeId: vid,
        tipus: "actualitzacio",
        detall: "Marcat per eliminar (pendent de publicar)",
        autorId: (session.user as any).id !== "superadmin" ? (session.user as any).id : undefined,
      })),
    });
    for (const v of perMarcar) emitreEsdeveniment("viatge_actualitzat", { id: v.id });
  }

  // Esborrar de debò els no publicats (fills inclosos, sense onDelete cascade a l'esquema)
  if (perEsborrar.length) {
    const idsEsborrar = perEsborrar.map((v) => v.id);
    await prisma.$transaction([
      prisma.incidencia.deleteMany({ where: { viatgeId: { in: idsEsborrar } } }),
      prisma.foto.deleteMany({ where: { viatgeId: { in: idsEsborrar } } }),
      prisma.logCanvi.deleteMany({ where: { viatgeId: { in: idsEsborrar } } }),
      prisma.viatge.deleteMany({ where: { id: { in: idsEsborrar } } }),
    ]);
    for (const delId of idsEsborrar) emitreEsdeveniment("viatge_eliminat", { id: delId });
  }

  return NextResponse.json({ ok: true, marcats: perMarcar.length, eliminats: perEsborrar.length });
}
