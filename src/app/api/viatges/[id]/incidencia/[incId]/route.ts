import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { emitreEsdeveniment } from "@/lib/sse";
import { t } from "@/lib/textos";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; incId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autoritzat" }, { status: 401 });

  const { id, incId } = await params;
  const body = await req.json();
  const userId = (session.user as any).id;

  const incidencia = await prisma.incidencia.update({
    where: { id: incId },
    data: {
      ...(body.detall !== undefined ? { detall: body.detall } : {}),
      ...(body.tipus ? { tipus: body.tipus } : {}),
      ...(body.estimacioTemps !== undefined ? { estimacioTemps: body.estimacioTemps } : {}),
    },
  });

  await prisma.logCanvi.create({
    data: {
      viatgeId: id,
      tipus: "incidencia",
      detall: `Incidència editada: ${t.incidencies[incidencia.tipus] || incidencia.tipus}${incidencia.detall ? ` — ${incidencia.detall}` : ""}`,
      autorId: userId !== "superadmin" ? userId : undefined,
    },
  });

  emitreEsdeveniment("viatge_actualitzat", { id });

  return NextResponse.json(incidencia);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; incId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autoritzat" }, { status: 401 });

  const { id, incId } = await params;
  const userId = (session.user as any).id;

  const inc = await prisma.incidencia.findUnique({ where: { id: incId } });
  await prisma.incidencia.delete({ where: { id: incId } });

  await prisma.logCanvi.create({
    data: {
      viatgeId: id,
      tipus: "incidencia",
      detall: `Incidència eliminada${inc ? `: ${t.incidencies[inc.tipus] || inc.tipus}` : ""}`,
      autorId: userId !== "superadmin" ? userId : undefined,
    },
  });

  emitreEsdeveniment("viatge_actualitzat", { id });

  return NextResponse.json({ ok: true });
}
