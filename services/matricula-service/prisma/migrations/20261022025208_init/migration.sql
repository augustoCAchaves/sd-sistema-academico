-- CreateEnum
CREATE TYPE "status_matricula" AS ENUM ('DEFERIDA', 'INDEFERIDA_SEM_VAGA', 'INDEFERIDA_PRE_REQUISITO');

-- CreateTable
CREATE TABLE "matriculas" (
    "protocolo" UUID NOT NULL,
    "request_id" TEXT NOT NULL,
    "matricula_aluno" TEXT NOT NULL,
    "codigo_turma" TEXT NOT NULL,
    "status" "status_matricula" NOT NULL,
    "mensagem" TEXT NOT NULL,
    "pendencias" TEXT[],
    "solicitada_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "matriculas_pkey" PRIMARY KEY ("protocolo")
);

-- CreateIndex
CREATE UNIQUE INDEX "matriculas_request_id_key" ON "matriculas"("request_id");

-- CreateIndex
CREATE INDEX "matriculas_matricula_aluno_idx" ON "matriculas"("matricula_aluno");

-- Manual: índice parcial (o schema do Prisma não declara WHERE em índice).
-- No máximo uma matrícula DEFERIDA por aluno e turma; indeferidas podem repetir.
CREATE UNIQUE INDEX "matriculas_deferida_unica" ON "matriculas" ("matricula_aluno", "codigo_turma") WHERE "status" = 'DEFERIDA';
