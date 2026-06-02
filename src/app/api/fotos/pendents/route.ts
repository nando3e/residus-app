import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pujarFoto, s3Configurat } from "@/lib/s3";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autoritzat" }, { status: 401 });

  const pendents = await prisma.fotoPendent.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(pendents);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autoritzat" }, { status: 401 });

  const formData = await req.formData();
  const fitxer = formData.get("foto") as File;
  const origen = (formData.get("origen") as string) || "app";
  const metadades = formData.get("metadades") as string | null;

  if (!fitxer) return NextResponse.json({ error: "Cal una foto" }, { status: 400 });

  const buffer = Buffer.from(await fitxer.arrayBuffer());
  const nomFitxer = `pendents/${Date.now()}-${fitxer.name}`;

  let url: string;
  if (s3Configurat()) {
    try {
      url = await pujarFoto(buffer, nomFitxer, fitxer.type);
    } catch {
      url = `data:${fitxer.type};base64,${buffer.toString("base64")}`;
    }
  } else {
    url = `data:${fitxer.type};base64,${buffer.toString("base64")}`;
  }

  const pendent = await prisma.fotoPendent.create({
    data: { url, origen: origen as any, metadades },
  });

  return NextResponse.json(pendent, { status: 201 });
}
