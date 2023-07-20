import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { PrismaService } from './database/prisma.service';

@Injectable()
export class PrismaHealthIndicator extends HealthIndicator {
  constructor(private prisma: PrismaService) {
    super();
  }

  async isHealthy(): Promise<HealthIndicatorResult> {
    let dbError;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (err) {
      dbError = err;
    }
    const result = this.getStatus('database', dbError ? false : true, dbError);

    if (!dbError) {
      return result;
    }
    throw new HealthCheckError('Prisma check failed', result);
  }
}
