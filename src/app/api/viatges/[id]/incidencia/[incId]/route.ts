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
