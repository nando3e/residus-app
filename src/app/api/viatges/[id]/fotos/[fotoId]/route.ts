import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { emitreEsdeveniment } from "@/lib/sse";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; fotoId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autoritzat" }, { status: 401 });

  const { id, fotoId } = await params;
  await prisma.foto.delete({ where: { id: fotoId } });
  emitreEsdeveniment("viatge_actualitzat", { id });
  return NextResponse.json({ ok: true });
}
