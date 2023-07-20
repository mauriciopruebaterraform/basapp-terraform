import '../__test__/winston';
import { Test, TestingModule } from '@nestjs/testing';
import { AlertTypesController } from './alert-types.controller';
import { AlertTypesModule } from './alert-types.module';
import { AlertTypesService } from './alert-types.service';
import { AlertTypesServiceMock } from './mocks/alert-types.service';
import { PrismaService } from '@src/database/prisma.service';
import { PrismaServiceMock } from '@src/database/mocks/prisma.service';

describe('AlertTypesController', () => {
  let controller: AlertTypesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AlertTypesModule],
      controllers: [AlertTypesController],
    })
      .overrideProvider(PrismaService)
      .useValue(PrismaServiceMock)
      .overrideProvider(AlertTypesService)
      .useValue(AlertTypesServiceMock)
      .compile();

    controller = module.get<AlertTypesController>(AlertTypesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return the alert types', async () => {
    expect(controller.findAll).toBeDefined();
    const result = await controller.findAll();
    expect(result).toBeInstanceOf(Array);
    result.forEach((item) => {
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('type');
    });
  });
});
