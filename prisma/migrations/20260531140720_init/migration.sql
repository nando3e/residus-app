-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('superadmin', 'gestio', 'conductor');

-- CreateEnum
CREATE TYPE "EstatAssignacio" AS ENUM ('esborrany', 'publicat');

-- CreateEnum
CREATE TYPE "EstatExecucio" AS ENUM ('pendent', 'en_cami', 'arribat', 'recollit_ok', 'recollit_incidencia', 'a_planta', 'descarrega_completada');

-- CreateEnum
CREATE TYPE "TipusIncidencia" AS ENUM ('retard', 'client_tancat', 'residu_no_apte', 'problema_camio', 'altra');

-- CreateEnum
CREATE TYPE "OrigenFoto" AS ENUM ('telegram', 'correu', 'app');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "usuari" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "rol" "Rol" NOT NULL,
    "telefon" TEXT,
    "telegramChatId" TEXT,
    "actiu" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Camio" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "matricula" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#3B82F6',
    "conductorId" TEXT,
    "actiu" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Camio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "telefon" TEXT,
    "adreca" TEXT,
    "email" TEXT,
    "instruccionsEspecials" TEXT,
    "actiu" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Viatge" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "tipusResidu" TEXT NOT NULL,
    "data" DATE NOT NULL,
    "horaPrevista" TEXT NOT NULL,
    "adreca" TEXT,
    "instruccions" TEXT,
    "camioId" TEXT,
    "estatAssignacio" "EstatAssignacio" NOT NULL DEFAULT 'esborrany',
    "estatExecucio" "EstatExecucio" NOT NULL DEFAULT 'pendent',
    "pesReal" DOUBLE PRECISION,
    "observacions" TEXT,
    "conductorSnapshot" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Viatge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incidencia" (
    "id" TEXT NOT NULL,
    "viatgeId" TEXT NOT NULL,
    "tipus" "TipusIncidencia" NOT NULL,
    "detall" TEXT,
    "estimacioTemps" INTEGER,
    "fotoUrls" TEXT[],
    "notaVeuUrl" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Incidencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Foto" (
    "id" TEXT NOT NULL,
    "viatgeId" TEXT,
    "url" TEXT NOT NULL,
    "origen" "OrigenFoto" NOT NULL DEFAULT 'app',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Foto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FotoPendent" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "origen" "OrigenFoto" NOT NULL,
    "metadades" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FotoPendent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogCanvi" (
    "id" TEXT NOT NULL,
    "viatgeId" TEXT NOT NULL,
    "tipus" TEXT NOT NULL,
    "detall" TEXT NOT NULL,
    "autorId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LogCanvi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_usuari_key" ON "User"("usuari");

-- CreateIndex
CREATE UNIQUE INDEX "Camio_matricula_key" ON "Camio"("matricula");

-- CreateIndex
CREATE UNIQUE INDEX "Camio_conductorId_key" ON "Camio"("conductorId");

-- AddForeignKey
ALTER TABLE "Camio" ADD CONSTRAINT "Camio_conductorId_fkey" FOREIGN KEY ("conductorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Viatge" ADD CONSTRAINT "Viatge_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Viatge" ADD CONSTRAINT "Viatge_camioId_fkey" FOREIGN KEY ("camioId") REFERENCES "Camio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incidencia" ADD CONSTRAINT "Incidencia_viatgeId_fkey" FOREIGN KEY ("viatgeId") REFERENCES "Viatge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Foto" ADD CONSTRAINT "Foto_viatgeId_fkey" FOREIGN KEY ("viatgeId") REFERENCES "Viatge"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogCanvi" ADD CONSTRAINT "LogCanvi_viatgeId_fkey" FOREIGN KEY ("viatgeId") REFERENCES "Viatge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogCanvi" ADD CONSTRAINT "LogCanvi_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
