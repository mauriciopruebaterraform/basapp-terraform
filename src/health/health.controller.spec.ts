import '../__test__/winston';
import { PrismaServiceMock } from '../database/mocks/prisma.service';
import { HealthCheckService } from '@nestjs/terminus';
import { HealthCheckExecutor } from '@nestjs/terminus/dist/health-check/health-check-executor.service';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@src/database/prisma.service';
import { PrismaHealthIndicator } from '../prisma.health';
import { HealthController } from './health.controller';
import { HealthCheckServiceMock } from './mocks/health-check.service';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        HealthCheckExecutor,
        PrismaHealthIndicator,
        {
          provide: PrismaService,
          useValue: PrismaServiceMock,
        },
        {
          provide: HealthCheckService,
          useValue: HealthCheckServiceMock,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
