import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { emitreEsdeveniment } from "@/lib/sse";
import { enviarNotificacio, enllacConductor, origenDeSessio } from "@/lib/notificacions";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autoritzat" }, { status: 401 });

  const { data } = await req.json();

  if (!data) return NextResponse.json({ error: "Cal indicar la data" }, { status: 400 });

  const d = new Date(data);
  const dFi = new Date(data);
  dFi.setDate(dFi.getDate() + 1);

  // Agafar viatges amb camió assignat
  const viatges = await prisma.viatge.findMany({
    where: {
      data: { gte: d, lt: dFi },
      camioId: { not: null },
      estatAssignacio: "esborrany",
    },
    include: {
      camio: { include: { conductor: true } },
      client: true,
    },
  });

  // Congelar el conductor snapshot i publicar
  for (const viatge of viatges) {
    const conductorSnapshot = viatge.camio?.conductor?.nom || null;
    await prisma.viatge.update({
      where: { id: viatge.id },
      data: {
        estatAssignacio: "publicat",
        conductorSnapshot,
      },
    });
  }

  // Notificar conductors
  const conductorsNotificats = new Set<string>();
  for (const viatge of viatges) {
    const conductor = viatge.camio?.conductor;
    if (!conductor || conductorsNotificats.has(conductor.id)) continue;
    conductorsNotificats.add(conductor.id);

    const viatgesConductor = viatges.filter(
      (v: typeof viatges[0]) => v.camio?.conductorId === conductor.id
    );

    const n = viatgesConductor.length;
    await enviarNotificacio({
      esdeveniment: "jornada.publicada",
      versio: "1",
      prioritat: "normal",
      origen: origenDeSessio(session),
      destinatari: {
        rol: "conductor",
        id: conductor.id,
        nom: conductor.nom,
        telegram_chat_id: conductor.telegramChatId || undefined,
        telefon: conductor.telefon || undefined,
      },
      missatge: `Tens ${n} viatge${n > 1 ? "s" : ""} per avui`,
      enllac: enllacConductor(),
      timestamp: new Date().toISOString(),
    });
  }

  emitreEsdeveniment("jornada_publicada", { data });

  return NextResponse.json({ publicats: viatges.length });
}
