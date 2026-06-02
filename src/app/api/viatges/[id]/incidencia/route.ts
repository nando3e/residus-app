import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { emitreEsdeveniment } from "@/lib/sse";
import { enviarNotificacio, construirDeeplink, origenDeSessio } from "@/lib/notificacions";
import { t } from "@/lib/textos";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autoritzat" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const incidencia = await prisma.incidencia.create({
    data: {
      viatgeId: id,
      tipus: body.tipus,
      detall: body.detall,
      estimacioTemps: body.estimacioTemps,
      fotoUrls: body.fotoUrls || [],
      lat: body.lat,
      lng: body.lng,
    },
  });

  // Registrar al historial (l'estat del viatge el controlen els botons, no la incidència)
  const userId = (session.user as any).id;
  await prisma.logCanvi.create({
    data: {
      viatgeId: id,
      tipus: "incidencia",
      detall: `Incidència afegida: ${t.incidencies[body.tipus] || body.tipus}${body.detall ? ` — ${body.detall}` : ""}`,
      autorId: userId !== "superadmin" ? userId : undefined,
    },
  });

  const viatge = await prisma.viatge.findUnique({
    where: { id },
    include: { client: true, camio: { include: { conductor: true } } },
  });

  // Emetre SSE
  emitreEsdeveniment("incidencia_nova", { incidencia, viatge });

  // Notificar si incidència crítica
  const critica = ["client_tancat", "problema_camio"].includes(body.tipus);
  if (critica) {
    // Notificar al gestor (superadmin)
    const gestors = await prisma.user.findMany({
      where: { rol: { in: ["gestio", "superadmin"] }, actiu: true },
    });
    const tipusLlegible = t.incidencies[body.tipus] || body.tipus;
    for (const gestor of gestors.slice(0, 1)) {
      await enviarNotificacio({
        esdeveniment: "incidencia.critica",
        versio: "1",
        prioritat: "alta",
        origen: origenDeSessio(session),
        destinatari: {
          rol: "gestor",
          id: gestor.id,
          nom: gestor.nom,
          telegram_chat_id: gestor.telegramChatId || undefined,
          telefon: gestor.telefon || undefined,
        },
        viatge: {
          id,
          client: viatge?.client.nom,
          residu: viatge?.tipusResidu,
          data: viatge?.data.toISOString().slice(0, 10),
          hora: viatge?.horaPrevista,
          camio: viatge?.camio?.nom,
          matricula: viatge?.camio?.matricula,
        },
        incidencia: { tipus: body.tipus, detall: body.detall || undefined },
        missatge: `Incidència (${tipusLlegible}) a ${viatge?.client.nom}`,
        enllac: construirDeeplink(id),
        timestamp: new Date().toISOString(),
      });
    }
  }

  return NextResponse.json(incidencia, { status: 201 });
}
