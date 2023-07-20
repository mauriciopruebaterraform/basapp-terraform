import { Controller, Request, Post, UseGuards, Get } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { AuthService } from './auth.service';
import { Login } from './entities/login';
import { Roles } from '@src/auth/roles.decorator';
import { UserPasswordInput } from './entities/user-password-input.entity';
import { LocalAuthGuard } from './local-auth.guard';
import { Public } from './public.decorator';
import { IRequestUser } from '@src/interfaces/types';

@ApiTags('auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'Login with email and password',
    description: 'Login with email and password',
  })
  @ApiBody({
    type: UserPasswordInput,
  })
  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req): Promise<Login> {
    return this.authService.login(req.user);
  }

  @ApiOperation({
    servers: [{ url: '/v1' }],
    summary: 'get firebase token',
  })
  @Roles(Role.monitoring, Role.statesman)
  @Get('firebase')
  async firebaseToken(@Request() req) {
    return this.authService.firebaseToken(req.user as IRequestUser);
  }
}
