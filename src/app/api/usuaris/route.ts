import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autoritzat" }, { status: 401 });

  const rol = (session.user as any).rol;
  if (rol !== "superadmin") return NextResponse.json({ error: "Sense permís" }, { status: 403 });

  const usuaris = await prisma.user.findMany({
    select: {
      id: true,
      nom: true,
      usuari: true,
      rol: true,
      telefon: true,
      telegramChatId: true,
      actiu: true,
      createdAt: true,
    },
    orderBy: { nom: "asc" },
  });

  return NextResponse.json(usuaris);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autoritzat" }, { status: 401 });

  const rol = (session.user as any).rol;
  if (rol !== "superadmin") return NextResponse.json({ error: "Sense permís" }, { status: 403 });

  const body = await req.json();
  const hash = await bcrypt.hash(body.contrasenya, 12);

  const usuari = await prisma.user.create({
    data: {
      nom: body.nom,
      usuari: body.usuari,
      passwordHash: hash,
      rol: body.rol,
      telefon: body.telefon || null,
      telegramChatId: body.telegramChatId || null,
    },
    select: {
      id: true,
      nom: true,
      usuari: true,
      rol: true,
      telefon: true,
      telegramChatId: true,
      actiu: true,
    },
  });

  return NextResponse.json(usuari, { status: 201 });
}
