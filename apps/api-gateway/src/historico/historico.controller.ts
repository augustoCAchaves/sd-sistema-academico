import { Controller, Get } from '@nestjs/common';
import { Aluno, AlunoAutenticado, Cid } from '../comum/decorators';
import { RegistroGrpc } from '../grpc/grpc.module';

export interface HistoricoJson {
  matricula_aluno: string;
  nome: string;
  aprovadas: { codigo: string; nome: string }[];
}

@Controller('historico')
export class HistoricoController {
  constructor(private readonly registro: RegistroGrpc) {}

  @Get()
  async consultar(@Aluno() aluno: AlunoAutenticado, @Cid() cid: string): Promise<HistoricoJson> {
    const r = await this.registro.chamar('ConsultarAluno', { matricula_aluno: aluno.sub }, cid);
    return {
      matricula_aluno: r.matricula_aluno,
      nome: r.nome,
      aprovadas: r.aprovadas.map((d) => ({ codigo: d.codigo, nome: d.nome })),
    };
  }
}
