-- CreateTable
CREATE TABLE "alunos" (
    "matricula" TEXT NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "alunos_pkey" PRIMARY KEY ("matricula")
);

-- CreateTable
CREATE TABLE "disciplinas" (
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "disciplinas_pkey" PRIMARY KEY ("codigo")
);

-- CreateTable
CREATE TABLE "turmas" (
    "codigo" TEXT NOT NULL,
    "codigo_disciplina" TEXT NOT NULL,
    "vagas_totais" INTEGER NOT NULL,
    "vagas_ocupadas" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "turmas_pkey" PRIMARY KEY ("codigo")
);

-- CreateTable
CREATE TABLE "pre_requisitos" (
    "codigo_disciplina" TEXT NOT NULL,
    "codigo_pre_requisito" TEXT NOT NULL,

    CONSTRAINT "pre_requisitos_pkey" PRIMARY KEY ("codigo_disciplina","codigo_pre_requisito")
);

-- CreateTable
CREATE TABLE "aprovacoes" (
    "matricula_aluno" TEXT NOT NULL,
    "codigo_disciplina" TEXT NOT NULL,

    CONSTRAINT "aprovacoes_pkey" PRIMARY KEY ("matricula_aluno","codigo_disciplina")
);

-- AddForeignKey
ALTER TABLE "turmas" ADD CONSTRAINT "turmas_codigo_disciplina_fkey" FOREIGN KEY ("codigo_disciplina") REFERENCES "disciplinas"("codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pre_requisitos" ADD CONSTRAINT "pre_requisitos_codigo_disciplina_fkey" FOREIGN KEY ("codigo_disciplina") REFERENCES "disciplinas"("codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pre_requisitos" ADD CONSTRAINT "pre_requisitos_codigo_pre_requisito_fkey" FOREIGN KEY ("codigo_pre_requisito") REFERENCES "disciplinas"("codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aprovacoes" ADD CONSTRAINT "aprovacoes_matricula_aluno_fkey" FOREIGN KEY ("matricula_aluno") REFERENCES "alunos"("matricula") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aprovacoes" ADD CONSTRAINT "aprovacoes_codigo_disciplina_fkey" FOREIGN KEY ("codigo_disciplina") REFERENCES "disciplinas"("codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Manual: o Prisma não declara CHECK no schema.
ALTER TABLE "turmas" ADD CONSTRAINT "turmas_vagas_check" CHECK ("vagas_ocupadas" >= 0 AND "vagas_ocupadas" <= "vagas_totais");
