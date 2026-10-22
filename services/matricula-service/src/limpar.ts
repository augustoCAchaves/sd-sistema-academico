import { PrismaClient } from './generated/prisma/client';
import { log } from './log';
import { criarAdapter } from './prisma.service';

async function main(): Promise<void> {
  const prisma = new PrismaClient({ adapter: criarAdapter() });
  const { count } = await prisma.matricula.deleteMany();
  log(`Matriculas apagadas: ${count}`);
  await prisma.$disconnect();
}

void main();
