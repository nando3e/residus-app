import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autoritzat" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const data = searchParams.get("data");
  const camioId = searchParams.get("camioId");
  const conductorId = searchParams.get("conductorId");
  const historial = searchParams.get("historial") === "true";
  const clientId = searchParams.get("clientId");
  const tipusIncidencia = searchParams.get("tipusIncidencia");
  const dataFi = searchParams.get("dataFi");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: any = {};

  if (historial) {
    // Historial = tots els viatges del rang (sense filtre d'estat)
    if (data) where.data = { gte: new Date(data) };
    if (dataFi) {
      where.data = { ...(where.data || {}), lte: new Date(dataFi) };
    }
    if (camioId) where.camioId = camioId;
    if (clientId) where.clientId = clientId;
    if (tipusIncidencia) {
      where.incidencies = { some: { tipus: tipusIncidencia } };
    }
  } else if (from && to) {
    // Rang de dates (vista setmana): [from, to] inclusiu
    const dInici = new Date(from + "T00:00:00.000Z");
    const dFi = new Date(to + "T00:00:00.000Z");
    dFi.setUTCDate(dFi.getUTCDate() + 1);
    where.data = { gte: dInici, lt: dFi };
  } else if (data) {
    const d = new Date(data + "T00:00:00.000Z");
    const dFi = new Date(data + "T00:00:00.000Z");
    dFi.setUTCDate(dFi.getUTCDate() + 1);
    where.data = { gte: d, lt: dFi };
  }

  if (conductorId) {
    const camio = await prisma.camio.findFirst({ where: { conductorId } });
    if (camio) where.camioId = camio.id;
    else where.camioId = "none"; // cap viatge si no té camió assignat
    where.estatAssignacio = "publicat";
    // Filtrar per avui si no s'ha especificat data
    if (!data) {
      const avuiStr = new Date().toISOString().split("T")[0];
      const avui = new Date(avuiStr + "T00:00:00.000Z");
      const dema = new Date(avuiStr + "T00:00:00.000Z");
      dema.setDate(dema.getDate() + 1);
      where.data = { gte: avui, lt: dema };
    }
  }

  const viatges = await prisma.viatge.findMany({
    where,
    include: {
      client: true,
      camio: true,
      fotos: true,
      incidencies: true,
      logCanvis: { include: { autor: true }, orderBy: { timestamp: "desc" } },
    },
    orderBy: [{ data: "asc" }, { horaPrevista: "asc" }],
  });

  return NextResponse.json(viatges);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autoritzat" }, { status: 401 });

  const body = await req.json();

  const baseDada = {
    clientId: body.clientId,
    tipusResidu: body.tipusResidu,
    horaPrevista: body.horaPrevista,
    adreca: body.adreca || null,
    instruccions: body.instruccions || null,
  };

  // Repetició (sèrie): genera un viatge independent per cada data fins a dataFi
  const rep = body.repeticio;
  if (rep && (rep.frequencia === "diaria" || rep.frequencia === "setmanal") && rep.dataFi) {
    const inici = new Date(body.data + "T00:00:00.000Z");
    const fi = new Date(rep.dataFi + "T00:00:00.000Z");
    if (isNaN(inici.getTime()) || isNaN(fi.getTime()) || fi < inici) {
      return NextResponse.json({ error: "Rang de dates no vàlid" }, { status: 400 });
    }
    const pas = rep.frequencia === "diaria" ? 1 : 7;
    const serieId = crypto.randomUUID();
    const MAX = 366; // límit de seguretat
    const dades = [];
    const cursor = new Date(inici);
    while (cursor <= fi && dades.length < MAX) {
      dades.push({ ...baseDada, serieId, data: new Date(cursor) });
      cursor.setUTCDate(cursor.getUTCDate() + pas);
    }
    await prisma.viatge.createMany({ data: dades });
    return NextResponse.json({ serieId, total: dades.length }, { status: 201 });
  }

  const viatge = await prisma.viatge.create({
    data: { ...baseDada, data: new Date(body.data) },
    include: { client: true, camio: true },
  });

  return NextResponse.json(viatge, { status: 201 });
}
