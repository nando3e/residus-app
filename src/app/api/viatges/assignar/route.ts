import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { emitreEsdeveniment } from "@/lib/sse";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autoritzat" }, { status: 401 });

  const { viatgeIds, camioId } = await req.json();

  if (!Array.isArray(viatgeIds) || viatgeIds.length === 0) {
    return NextResponse.json({ error: "Cal indicar almenys un viatge" }, { status: 400 });
  }

  const userId = (session.user as any).id;

  await prisma.viatge.updateMany({
    where: { id: { in: viatgeIds } },
    data: { camioId: camioId || null, estatAssignacio: "esborrany" },
  });

  // Log
  for (const viatgeId of viatgeIds) {
    await prisma.logCanvi.create({
      data: {
        viatgeId,
        tipus: "assignacio",
        detall: camioId ? `Assignat a camió` : "Desassignat",
        autorId: userId !== "superadmin" ? userId : undefined,
      },
    });
  }

  const viatges = await prisma.viatge.findMany({
    where: { id: { in: viatgeIds } },
    include: { client: true, camio: true },
  });

  emitreEsdeveniment("viatges_assignats", viatges);

  return NextResponse.json(viatges);
}
