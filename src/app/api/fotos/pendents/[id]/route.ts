import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autoritzat" }, { status: 401 });

  const { id } = await params;
  const { viatgeId } = await req.json();

  const pendent = await prisma.fotoPendent.findUnique({ where: { id } });
  if (!pendent) return NextResponse.json({ error: "No trobat" }, { status: 404 });

  const foto = await prisma.foto.create({
    data: { viatgeId, url: pendent.url, origen: pendent.origen },
  });

  await prisma.fotoPendent.delete({ where: { id } });

  return NextResponse.json(foto);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autoritzat" }, { status: 401 });

  const { id } = await params;
  await prisma.fotoPendent.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
