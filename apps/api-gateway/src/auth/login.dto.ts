import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class LoginDto {
  @IsString({ message: 'usuario deve ser texto' })
  @IsNotEmpty({ message: 'usuario é obrigatório' })
  @Matches(/^\d+$/, { message: 'usuario deve conter só dígitos (a matrícula do aluno)' })
  usuario!: string;

  @IsString({ message: 'senha deve ser texto' })
  @IsNotEmpty({ message: 'senha é obrigatória' })
  senha!: string;
}
