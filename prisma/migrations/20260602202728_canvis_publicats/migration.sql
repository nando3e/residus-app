-- AlterTable
ALTER TABLE "Viatge" ADD COLUMN     "camioPublicatId" TEXT,
ADD COLUMN     "dataPublicada" DATE,
ADD COLUMN     "horaPublicada" TEXT,
ADD COLUMN     "pendentEliminar" BOOLEAN NOT NULL DEFAULT false;
