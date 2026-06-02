import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autoritzat" }, { status: 401 });

  const rol = (session.user as any).rol;
  if (rol !== "superadmin") return NextResponse.json({ error: "Sense permís" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();

  const data: any = {
    nom: body.nom,
    telefon: body.telefon || null,
    telegramChatId: body.telegramChatId || null,
    actiu: body.actiu,
  };

  if (body.contrasenya) {
    data.passwordHash = await bcrypt.hash(body.contrasenya, 12);
  }

  const usuari = await prisma.user.update({
    where: { id },
    data,
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

  return NextResponse.json(usuari);
}
