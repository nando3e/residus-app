-- AlterTable
ALTER TABLE "Viatge" ADD COLUMN "serieId" TEXT;

-- CreateIndex
CREATE INDEX "Viatge_serieId_idx" ON "Viatge"("serieId");
