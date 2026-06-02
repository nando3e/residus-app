import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autoritzat" }, { status: 401 });

  const clients = await prisma.client.findMany({
    where: { actiu: true },
    orderBy: { nom: "asc" },
  });

  return NextResponse.json(clients);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autoritzat" }, { status: 401 });

  const body = await req.json();
  const client = await prisma.client.create({
    data: {
      nom: body.nom,
      telefon: body.telefon,
      adreca: body.adreca,
      email: body.email,
      instruccionsEspecials: body.instruccionsEspecials,
    },
  });

  return NextResponse.json(client, { status: 201 });
}
