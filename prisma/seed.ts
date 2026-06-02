import { PrismaClient } from "@prisma/client";
import { setmanaDe } from "../src/lib/utils";
const Rol = { superadmin: "superadmin", gestio: "gestio", conductor: "conductor" } as const;
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Netejant dades anteriors...");
  await prisma.logCanvi.deleteMany();
  await prisma.incidencia.deleteMany();
  await prisma.foto.deleteMany();
  await prisma.fotoPendent.deleteMany();
  await prisma.viatge.deleteMany();
  await prisma.camio.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();

  console.log("Creant usuaris...");
  const hashGestio = await bcrypt.hash("gestio123", 12);
  const hashCondutor1 = await bcrypt.hash("conductor1", 12);
  const hashCondutor2 = await bcrypt.hash("conductor2", 12);
  const hashCondutor3 = await bcrypt.hash("conductor3", 12);

  const gestio = await prisma.user.create({
    data: {
      nom: "Maria García",
      usuari: "gestio",
      passwordHash: hashGestio,
      rol: Rol.gestio,
      telefon: "612345678",
    },
  });

  const conductor1 = await prisma.user.create({
    data: {
      nom: "Joan Martínez",
      usuari: "conductor1",
      passwordHash: hashCondutor1,
      rol: Rol.conductor,
      telefon: "623456789",
    },
  });

  const conductor2 = await prisma.user.create({
    data: {
      nom: "Pere Sánchez",
      usuari: "conductor2",
      passwordHash: hashCondutor2,
      rol: Rol.conductor,
      telefon: "634567890",
    },
  });

  const conductor3 = await prisma.user.create({
    data: {
      nom: "Carles López",
      usuari: "conductor3",
      passwordHash: hashCondutor3,
      rol: Rol.conductor,
      telefon: "645678901",
    },
  });

  console.log("Creant camions...");
  const camio1 = await prisma.camio.create({
    data: { nom: "Camió 1", matricula: "1234-ABC", color: "#3B82F6", conductorId: conductor1.id },
  });
  const camio2 = await prisma.camio.create({
    data: { nom: "Camió 2", matricula: "5678-DEF", color: "#8B5CF6", conductorId: conductor2.id },
  });
  const camio3 = await prisma.camio.create({
    data: { nom: "Camió 3", matricula: "9012-GHI", color: "#92400E", conductorId: conductor3.id },
  });
  const camio4 = await prisma.camio.create({
    data: { nom: "Camió 4", matricula: "3456-JKL", color: "#F59E0B" },
  });

  console.log("Creant clients...");
  const clients = await Promise.all([
    prisma.client.create({ data: { nom: "Noel Alimentació", telefon: "932345678", adreca: "Carrer Major, 15, Barcelona", email: "noel@noel.cat" } }),
    prisma.client.create({ data: { nom: "Cartroneria Montjuïc", telefon: "933456789", adreca: "Avinguda Paral·lel, 78, Barcelona", instruccionsEspecials: "Entrar per la porta posterior" } }),
    prisma.client.create({ data: { nom: "Metalls Badalona SL", telefon: "934567890", adreca: "Polígon Industrial Serramar, Nave 12, Badalona" } }),
    prisma.client.create({ data: { nom: "Supermercats Bonpreu", telefon: "935678901", adreca: "Gran Via, 234, L\'Hospitalet" } }),
    prisma.client.create({ data: { nom: "Vidres Ponent SA", telefon: "936789012", adreca: "Carrer Provença, 45, Cornellà" } }),
    prisma.client.create({ data: { nom: "Recicla Vallès", telefon: "937890123", adreca: "Polígon Can Salvatella, Barberà del Vallès", instruccionsEspecials: "Trucar 30min abans d\'arribar" } }),
    prisma.client.create({ data: { nom: "Indústries Plàstic Nord", telefon: "938901234", adreca: "Carrer Indústria, 67, Terrassa" } }),
    prisma.client.create({ data: { nom: "Fàbrica Paper Ripoll", telefon: "939012345", adreca: "Rambla Sant Jordi, 12, Ripoll" } }),
  ]);

  // UTC midnight per evitar problemes de timezone amb @db.Date
  const avuiStr = new Date().toISOString().split("T")[0];
  const avui = new Date(avuiStr + "T00:00:00.000Z");
  const dataUTC = (s: string) => new Date(s + "T00:00:00.000Z");
  const { dies: diesSetmana } = setmanaDe(avuiStr);

  const conductorPerCamio: Record<string, string> = {
    [camio1.id]: conductor1.nom,
    [camio2.id]: conductor2.nom,
    [camio3.id]: conductor3.nom,
  };

  // 1) Viatges operatius d'AVUI (per a la vista conductor i, si és laborable, columna d'avui)
  console.log("Creant viatges d'avui (operativa conductor)...");
  const todaySet = [
    { clientId: clients[0].id, tipusResidu: "Cartró", horaPrevista: "08:00", camioId: camio1.id, estatExecucio: "recollit_incidencia" as const },
    { clientId: clients[1].id, tipusResidu: "Cartró", horaPrevista: "08:30", camioId: camio1.id, estatExecucio: "en_cami" as const },
    { clientId: clients[3].id, tipusResidu: "Paper", horaPrevista: "09:30", camioId: camio1.id, estatExecucio: "pendent" as const },
    { clientId: clients[2].id, tipusResidu: "Metalls", horaPrevista: "09:00", camioId: camio2.id, estatExecucio: "arribat" as const },
    { clientId: clients[4].id, tipusResidu: "Vidre", horaPrevista: "10:00", camioId: camio2.id, estatExecucio: "pendent" as const },
    { clientId: clients[5].id, tipusResidu: "Plàstic", horaPrevista: "10:30", camioId: camio3.id, estatExecucio: "pendent" as const },
    { clientId: clients[6].id, tipusResidu: "Plàstic", horaPrevista: "11:00", camioId: camio3.id, estatExecucio: "pendent" as const },
  ];
  let primerViatgeAvui = "";
  for (const v of todaySet) {
    const viatge = await prisma.viatge.create({
      data: {
        clientId: v.clientId,
        tipusResidu: v.tipusResidu,
        horaPrevista: v.horaPrevista,
        camioId: v.camioId,
        data: avui,
        estatAssignacio: "publicat",
        estatExecucio: v.estatExecucio,
        conductorSnapshot: conductorPerCamio[v.camioId],
      },
    });
    if (!primerViatgeAvui) primerViatgeAvui = viatge.id;
  }
  // Incidència d'exemple al primer viatge
  await prisma.incidencia.create({
    data: {
      viatgeId: primerViatgeAvui,
      tipus: "retard",
      detall: "Trànsit dens a la B-23",
      estimacioTemps: 20,
    },
  });

  // 2) Resta de dies laborables de la setmana (per omplir la vista calendari)
  //    Estats per posició: completats / en curs / borrador (amb sense assignar)
  console.log("Creant la resta de la setmana...");
  const plantilla = [
    { c: 0, r: "Cartró", h: "08:00", camio: camio1 },
    { c: 1, r: "Cartró", h: "08:30", camio: camio2 },
    { c: 2, r: "Metalls", h: "09:00", camio: camio3 },
    { c: 3, r: "Paper", h: "09:30", camio: camio1 },
    { c: 4, r: "Vidre", h: "10:00", camio: camio2 },
    { c: 5, r: "Plàstic", h: "10:30", camio: camio3 },
    { c: 6, r: "Paper", h: "11:30", camio: camio4 },
  ];

  for (let i = 0; i < diesSetmana.length; i++) {
    const dia = diesSetmana[i];
    if (dia === avuiStr) continue; // avui ja té la seva operativa

    const completat = i <= 1;
    const enCurs = i === 2 || i === 3;
    const borrador = i >= 4;

    for (let j = 0; j < plantilla.length; j++) {
      const p = plantilla[j];
      // En dia borrador, deixar els 2 últims sense assignar
      const senseAssignar = borrador && j >= plantilla.length - 2;
      const camioId = senseAssignar ? null : p.camio.id;

      await prisma.viatge.create({
        data: {
          clientId: clients[p.c].id,
          tipusResidu: p.r,
          horaPrevista: p.h,
          data: dataUTC(dia),
          camioId,
          estatAssignacio: borrador ? "esborrany" : "publicat",
          estatExecucio: completat ? "descarrega_completada" : enCurs && j < 3 ? "recollit_ok" : "pendent",
          conductorSnapshot: !borrador && camioId ? conductorPerCamio[camioId] : null,
          pesReal: completat ? Math.round(Math.random() * 600 + 150) : null,
        },
      });
    }
  }

  // 3) Historial dels últims 30 dies (per la pàgina d'historial)
  console.log("Creant historial...");
  for (let d = 1; d <= 30; d++) {
    const data = new Date(avui);
    data.setUTCDate(data.getUTCDate() - d);
    if (data.getUTCDay() === 0 || data.getUTCDay() === 6) continue;
    const diaStr = data.toISOString().split("T")[0];
    if (diesSetmana.includes(diaStr)) continue; // ja creat a la setmana actual

    const viatgesHistorial = [
      { clientId: clients[Math.floor(Math.random() * clients.length)].id, tipusResidu: "Cartró", horaPrevista: "08:00", camioId: camio1.id, estatAssignacio: "publicat" as const, estatExecucio: "descarrega_completada" as const, conductorSnapshot: conductor1.nom, pesReal: Math.round(Math.random() * 500 + 200) },
      { clientId: clients[Math.floor(Math.random() * clients.length)].id, tipusResidu: "Paper", horaPrevista: "09:30", camioId: camio2.id, estatAssignacio: "publicat" as const, estatExecucio: "descarrega_completada" as const, conductorSnapshot: conductor2.nom, pesReal: Math.round(Math.random() * 300 + 100) },
      { clientId: clients[Math.floor(Math.random() * clients.length)].id, tipusResidu: "Metalls", horaPrevista: "11:00", camioId: camio3.id, estatAssignacio: "publicat" as const, estatExecucio: "descarrega_completada" as const, conductorSnapshot: conductor3.nom, pesReal: Math.round(Math.random() * 800 + 300) },
    ];

    for (const v of viatgesHistorial) {
      await prisma.viatge.create({ data: { ...v, data } });
    }
  }

  // Fotos pendents d'exemple
  await prisma.fotoPendent.create({
    data: { url: "https://placehold.co/400x300/e2e8f0/64748b?text=Foto+pendent", origen: "correu", metadades: "De: client@exemple.com" },
  });
  await prisma.fotoPendent.create({
    data: { url: "https://placehold.co/400x300/fef3c7/d97706?text=Foto+WhatsApp", origen: "telegram", metadades: "Rebuda per Telegram" },
  });

  console.log("✅ Seed completat!");
  console.log("");
  console.log("Usuaris de prova:");
  console.log("  Superadmin: adminsole / adminsoler123");
  console.log("  Gestió: gestio / gestio123");
  console.log("  Conductor 1: conductor1 / conductor1");
  console.log("  Conductor 2: conductor2 / conductor2");
  console.log("  Conductor 3: conductor3 / conductor3");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
