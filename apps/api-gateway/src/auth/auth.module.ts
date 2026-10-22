import { Body, Controller, HttpCode, Module, Post } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { Cid, Public } from '../comum/decorators';
import { config } from '../config';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LoginDto } from './login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto, @Cid() cid: string) {
    return this.auth.login(dto, cid);
  }
}

@Module({
  imports: [
    JwtModule.register({
      secret: config.jwtSecret,
      signOptions: { algorithm: 'HS256', expiresIn: config.jwtExpiraEmSegundos },
      verifyOptions: { algorithms: ['HS256'] },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, { provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AuthModule {}
