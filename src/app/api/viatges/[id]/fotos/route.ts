import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pujarFoto } from "@/lib/s3";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autoritzat" }, { status: 401 });

  const { id } = await params;

  const formData = await req.formData();
  const fitxers = formData.getAll("foto") as File[];

  if (fitxers.length === 0) {
    return NextResponse.json({ error: "Cal adjuntar almenys una foto" }, { status: 400 });
  }

  const fotosCreades = [];

  for (const fitxer of fitxers) {
    const buffer = Buffer.from(await fitxer.arrayBuffer());
    const nomFitxer = `viatges/${id}/${Date.now()}-${fitxer.name}`;

    let url: string;
    try {
      url = await pujarFoto(buffer, nomFitxer, fitxer.type);
    } catch {
      // En dev sense S3, usar data URL com a fallback
      url = `data:${fitxer.type};base64,${buffer.toString("base64")}`;
    }

    const foto = await prisma.foto.create({
      data: { viatgeId: id, url, origen: "app" },
    });
    fotosCreades.push(foto);
  }

  return NextResponse.json(fotosCreades, { status: 201 });
}
