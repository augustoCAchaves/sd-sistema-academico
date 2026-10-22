import { ehErroGrpc, status } from '@academico/contratos-grpc';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AlunoAutenticado } from '../comum/decorators';
import { config } from '../config';
import { RegistroGrpc } from '../grpc/grpc.module';
import { LoginDto } from './login.dto';

const CREDENCIAIS_INVALIDAS = 'Usuário ou senha inválidos.';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly registro: RegistroGrpc,
  ) {}

  async login(dto: LoginDto, cid: string) {
    if (dto.senha !== config.appPassword) {
      throw new UnauthorizedException(CREDENCIAIS_INVALIDAS);
    }

    const aluno = await this.registro.chamar('ConsultarAluno', { matricula_aluno: dto.usuario }, cid).catch((err: unknown) => {
      if (ehErroGrpc(err) && err.code === status.NOT_FOUND) {
        throw new UnauthorizedException(CREDENCIAIS_INVALIDAS);
      }
      throw err;
    });

    const payload: AlunoAutenticado = { sub: aluno.matricula_aluno, nome: aluno.nome };
    return {
      access_token: await this.jwt.signAsync(payload),
      token_type: 'Bearer',
      expires_in: config.jwtExpiraEmSegundos,
      aluno: { matricula_aluno: aluno.matricula_aluno, nome: aluno.nome },
    };
  }
}
