import '../__test__/winston';
import { Test, TestingModule } from '@nestjs/testing';
import { AlertState } from '@prisma/client';
import { PrismaServiceMock } from '@src/database/mocks/prisma.service';
import { PrismaService } from '@src/database/prisma.service';
import { mockDeep } from 'jest-mock-extended';
import { AlertStatesController } from './alert-states.controller';
import { AlertStatesModule } from './alert-states.module';
import { AlertStateService } from './alert-states.service';
import { CreateAlertState } from './dto/create-alert-state.dto';
import { AlertStateServiceMock } from './mocks/alert-state.service';

describe('AlertStateController', () => {
  let controller: AlertStatesController;
  let service: AlertStateServiceMock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AlertStatesModule],
      providers: [AlertStateService],
      controllers: [AlertStatesController],
    })
      .overrideProvider(PrismaService)
      .useValue(PrismaServiceMock)
      .overrideProvider(AlertStateService)
      .useValue(AlertStateServiceMock)
      .compile();

    controller = module.get<AlertStatesController>(AlertStatesController);
    service = module.get(AlertStateService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return a list of alert states', async () => {
    const alertStatesList = [
      {
        id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f8',
        name: 'Test',
      },
      {
        id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f9',
        name: 'Test2',
      },
      {
        id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f10',
        name: 'Test3',
      },
      {
        id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f11',
        name: 'Test4',
      },
    ];

    service.findAll.mockResolvedValue({
      results: alertStatesList,
      pagination: {
        total: alertStatesList.length,
        size: alertStatesList.length,
        skip: 0,
        take: 10,
      },
    });

    const { results, pagination } = await controller.findAll(
      {
        user: {
          role: 'admin',
        },
        customerId: null,
      },
      {},
    );
    expect(results).toBeDefined();
    expect(results).toBeInstanceOf(Array);
    expect(results.length).toBe(alertStatesList.length);

    results.forEach((item) => {
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('name');
    });

    expect(pagination).toBeDefined();
    expect(pagination).toBeInstanceOf(Object);
    expect(pagination).toEqual({
      size: 4,
      total: 4,
      take: 10,
      skip: 0,
    });
  });

  it('should create an alert states', async () => {
    expect(controller.create).toBeDefined();

    const data = {
      name: 'a name',
    };

    const alertStateInput = mockDeep<CreateAlertState>(data);
    const responseCreate = mockDeep<AlertState>({
      id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f8',
      customerId: '12d1f3-f8c1-4b5f-b8e9-f8c1b5f8e9f8',
      active: true,
      ...data,
    });
    service.create.mockResolvedValueOnce(responseCreate);
    const result = await controller.create(
      { user: { customerId: '12d1f3-f8c1-4b5f-b8e9-f8c1b5f8e9f8' } },
      alertStateInput,
    );

    expect(result).toMatchObject({
      id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f8',
      active: true,
      name: 'a name',
      customerId: '12d1f3-f8c1-4b5f-b8e9-f8c1b5f8e9f8',
    });
  });
  it('should update an alert states', async () => {
    expect(controller.update).toBeDefined();

    const mock = mockDeep<AlertState>({
      id: '4053ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      name: 'testing name',
      active: true,
      customerId: '12d1f3-f8c1-4b5f-b8e9-f8c1b5f8e9f8',
    });
    service.update.mockResolvedValue(mock);

    const result = await controller.update(
      {
        user: {
          role: 'admin',
          customerId: '12d1f3-f8c1-4b5f-b8e9-f8c1b5f8e9f8',
        },
      },
      '4053ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      {
        name: 'testing name',
      },
    );

    expect(result).toMatchObject(mock);
  });
});
