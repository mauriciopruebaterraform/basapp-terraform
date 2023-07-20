import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { Public } from '@src/auth/public.decorator';
import { PrismaHealthIndicator } from '@src/prisma.health';

@Controller({
  path: '/health',
  version: VERSION_NEUTRAL,
})
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prismaHealthIndicator: PrismaHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @Public()
  check() {
    return this.health.check([
      async () => this.prismaHealthIndicator.isHealthy(),
    ]);
  }
}
