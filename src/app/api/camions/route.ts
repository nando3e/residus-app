import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autoritzat" }, { status: 401 });

  const camions = await prisma.camio.findMany({
    where: { actiu: true },
    include: { conductor: true },
    orderBy: { nom: "asc" },
  });

  return NextResponse.json(camions);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autoritzat" }, { status: 401 });

  const rol = (session.user as any).rol;
  if (rol !== "superadmin") return NextResponse.json({ error: "Sense permís" }, { status: 403 });

  const body = await req.json();
  const camio = await prisma.camio.create({
    data: {
      nom: body.nom,
      matricula: body.matricula,
      color: body.color || "#3B82F6",
      conductorId: body.conductorId || null,
    },
    include: { conductor: true },
  });

  return NextResponse.json(camio, { status: 201 });
}
