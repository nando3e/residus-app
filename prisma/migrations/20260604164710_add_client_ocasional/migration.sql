-- DropForeignKey
ALTER TABLE "Viatge" DROP CONSTRAINT "Viatge_clientId_fkey";

-- AlterTable
ALTER TABLE "Viatge" ADD COLUMN     "clientOcasional" TEXT,
ALTER COLUMN "clientId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Viatge" ADD CONSTRAINT "Viatge_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
