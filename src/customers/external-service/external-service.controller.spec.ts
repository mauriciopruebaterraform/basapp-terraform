import '../../__test__/winston';
import { ExternalService } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { ExternalServiceController } from './external-service.controller';
import { ExternalServiceModule } from './external-service.module';
import { ExternalServiceService } from './external-service.service';
import { PrismaService } from '@src/database/prisma.service';
import { PrismaServiceMock } from '@src/database/mocks/prisma.service';
import { mockDeep } from 'jest-mock-extended';
import { ExternalServiceServiceMock } from './mocks/external-service.service';

describe('ExternalServiceController', () => {
  let controller: ExternalServiceController;
  let service: ExternalServiceServiceMock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ExternalServiceModule],
      controllers: [ExternalServiceController],
    })
      .overrideProvider(PrismaService)
      .useValue(PrismaServiceMock)
      .overrideProvider(ExternalServiceService)
      .useValue(ExternalServiceServiceMock)
      .compile();

    controller = module.get<ExternalServiceController>(
      ExternalServiceController,
    );
    service = module.get(ExternalServiceService);
  });

  it('should return a list of services', async () => {
    const customersEventType: ExternalService[] = mockDeep<ExternalService[]>([
      {
        id: '4e3f8f9b-4b5f-b8e9-f8c1b5f8e9f8',
        alertId: 'f8c1-b8e9-4b5f-b8e9-f8c1b5f8e9f8',
      },
      {
        id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f9',
        alertId: 'b8e9-dd-f8c1-4b5f-b8e9-asd',
      },
      {
        id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f10',
        alertId: 'b8e9-f8c1b5f8e9f8-sdf-4b5f-sdf-sdf',
      },
      {
        id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f11',
        alertId: 'b8e9-dfsdfsd-f8c1-4b5f-b8e9-f8c1b5f8e9f8',
      },
    ]);

    service.findAll.mockResolvedValueOnce({
      results: customersEventType,
      pagination: {
        total: 4,
        size: 4,
        skip: 0,
        take: 10,
      },
    });

    const { results, pagination } = await controller.findAll({});
    expect(results).toBeDefined();
    expect(results).toBeInstanceOf(Array);
    expect(results.length).toBe(4);

    expect(pagination).toBeDefined();
    expect(pagination).toBeInstanceOf(Object);
    expect(pagination).toEqual({
      size: 4,
      total: 4,
      take: 10,
      skip: 0,
    });
  });
});
