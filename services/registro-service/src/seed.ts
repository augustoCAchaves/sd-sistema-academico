import { PrismaClient } from './generated/prisma/client';
import { log } from './log';
import { criarAdapter } from './prisma.service';

const disciplinas = [
  { codigo: 'PROG-1', nome: 'Programação I' },
  { codigo: 'PROG-2', nome: 'Programação II' },
  { codigo: 'REDES-1', nome: 'Redes de Computadores' },
  { codigo: 'BD-1', nome: 'Banco de Dados I' },
  { codigo: 'BD-2', nome: 'Banco de Dados II' },
  { codigo: 'SD', nome: 'Sistemas Distribuídos' },
  { codigo: 'SO', nome: 'Sistemas Operacionais' },
];

const preRequisitos = [
  { codigo_disciplina: 'SD', codigo_pre_requisito: 'REDES-1' },
  { codigo_disciplina: 'SD', codigo_pre_requisito: 'PROG-2' },
  { codigo_disciplina: 'BD-2', codigo_pre_requisito: 'BD-1' },
  { codigo_disciplina: 'SO', codigo_pre_requisito: 'PROG-1' },
];

const turmas = [
  { codigo: 'SD-2026-1', codigo_disciplina: 'SD', vagas_totais: 40, vagas_ocupadas: 12 },
  { codigo: 'BD-2026-1', codigo_disciplina: 'BD-2', vagas_totais: 30, vagas_ocupadas: 30 },
  { codigo: 'REDES-2026-1', codigo_disciplina: 'REDES-1', vagas_totais: 45, vagas_ocupadas: 20 },
  { codigo: 'SO-2026-1', codigo_disciplina: 'SO', vagas_totais: 30, vagas_ocupadas: 29 },
];

const alunosDeCarga = Array.from({ length: 10 }, (_, i) => {
  const numero = String(i + 4).padStart(2, '0');
  return { matricula: `20210${numero}`, nome: `Aluno de Carga ${numero}`, aprovadas: ['PROG-1'] };
});

const alunos = [
  { matricula: '2021001', nome: 'Ana Souza', aprovadas: ['REDES-1', 'PROG-1', 'PROG-2', 'BD-1'] },
  { matricula: '2021002', nome: 'Bruno Lima', aprovadas: ['PROG-1', 'PROG-2'] },
  { matricula: '2021003', nome: 'Carla Dias', aprovadas: ['PROG-1'] },
  ...alunosDeCarga,
];

async function main(): Promise<void> {
  const prisma = new PrismaClient({ adapter: criarAdapter() });

  await prisma.$transaction(async (tx) => {
    for (const d of disciplinas) {
      await tx.disciplina.upsert({ where: { codigo: d.codigo }, create: d, update: { nome: d.nome } });
    }
    await tx.preRequisito.deleteMany();
    await tx.preRequisito.createMany({ data: preRequisitos });

    for (const t of turmas) {
      await tx.turma.upsert({ where: { codigo: t.codigo }, create: t, update: t });
    }

    for (const a of alunos) {
      await tx.aluno.upsert({
        where: { matricula: a.matricula },
        create: { matricula: a.matricula, nome: a.nome },
        update: { nome: a.nome },
      });
    }
    await tx.aprovacao.deleteMany();
    await tx.aprovacao.createMany({
      data: alunos.flatMap((a) => a.aprovadas.map((codigo) => ({ matricula_aluno: a.matricula, codigo_disciplina: codigo }))),
    });
  });

  log(`Seed aplicado: ${disciplinas.length} disciplinas, ${turmas.length} turmas, ${alunos.length} alunos (vagas resetadas)`);
  await prisma.$disconnect();
}

void main();
