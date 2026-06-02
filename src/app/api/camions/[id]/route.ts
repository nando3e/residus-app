import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autoritzat" }, { status: 401 });

  const rol = (session.user as any).rol;
  if (rol !== "superadmin") return NextResponse.json({ error: "Sense permís" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();

  const camio = await prisma.camio.update({
    where: { id },
    data: body,
    include: { conductor: true },
  });

  return NextResponse.json(camio);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autoritzat" }, { status: 401 });

  const rol = (session.user as any).rol;
  if (rol !== "superadmin") return NextResponse.json({ error: "Sense permís" }, { status: 403 });

  const { id } = await params;
  await prisma.camio.update({ where: { id }, data: { actiu: false } });

  return NextResponse.json({ ok: true });
}
