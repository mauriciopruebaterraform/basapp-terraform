import '../../__test__/winston';
import { Customer, Protocol } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@src/database/prisma.service';
import { PrismaServiceMock } from '@src/database/mocks/prisma.service';
import { mockDeep } from 'jest-mock-extended';
import { ProtocolsServiceMock } from './mocks/protocols.service';
import { ProtocolsController } from './protocols.controller';
import { ProtocolsService } from './protocols.service';
import { ProtocolsModule } from './protocols.module';

describe('ProtocolsController', () => {
  let controller: ProtocolsController;
  let service: ProtocolsServiceMock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ProtocolsModule],
      controllers: [ProtocolsController],
    })
      .overrideProvider(PrismaService)
      .useValue(PrismaServiceMock)
      .overrideProvider(ProtocolsService)
      .useValue(ProtocolsServiceMock)
      .compile();

    controller = module.get<ProtocolsController>(ProtocolsController);
    service = module.get(ProtocolsService);
  });

  it('should return a list of customers protocols', async () => {
    const customerProtocols: Protocol[] = mockDeep<Protocol[]>([
      {
        id: '4e3f8f9b-4b5f-b8e9-f8c1b5f8e9f8',
        customerId: 'f8c1-b8e9-4b5f-b8e9-f8c1b5f8e9f8',
      },
      {
        id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f9',
        customerId: 'b8e9-dd-f8c1-4b5f-b8e9-asd',
      },
      {
        id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f10',
        customerId: 'b8e9-f8c1b5f8e9f8-sdf-4b5f-sdf-sdf',
      },
      {
        id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f11',
        customerId: 'b8e9-dfsdfsd-f8c1-4b5f-b8e9-f8c1b5f8e9f8',
      },
    ]);

    service.findAll.mockResolvedValueOnce({
      results: customerProtocols,
      pagination: {
        total: 4,
        size: 4,
        skip: 0,
        take: 10,
      },
    });

    const { results, pagination } = await controller.findAll(
      {
        user: {
          id: 'b0273fda-1977-469e-b376-6b49cceb0a6f',
          customerId: 'b0273fda-1977-469e-b376-sdf123sgd',
          role: 'admin',
        },
      },
      'b0273fda-1977-469e-b376-sdf123sgd',
      {},
    );
    expect(results).toBeDefined();
    expect(results).toBeInstanceOf(Array);
    expect(results.length).toBe(4);

    results.forEach((item) => {
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('type');
      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('customerId');
    });

    expect(pagination).toBeDefined();
    expect(pagination).toBeInstanceOf(Object);
    expect(pagination).toEqual({
      size: customerProtocols.length,
      total: customerProtocols.length,
      take: 10,
      skip: 0,
    });
  });

  it('should create protocol', async () => {
    expect(controller.create).toBeDefined();

    const Mock = mockDeep<
      Protocol & {
        customer: Customer;
      }
    >({
      id: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      title: 'Incendio',
      code: 'AA0001',
      updatedById: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      active: true,
      customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
    });

    service.create.mockResolvedValueOnce(Mock);

    const result = await controller.create(
      {
        user: {
          id: '234-234-234-234',
          customerId: '123-123-123-123',
        },
      },
      '123-123-123-123',
      {
        title: 'Incendio',
        code: 'AA0001',
      },
    );

    expect(result).toStrictEqual(Mock);
  });

  it('should update protocol', async () => {
    expect(controller.update).toBeDefined();

    const mock = mockDeep<Protocol>({
      id: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      title: 'Incendio',
      updatedById: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      active: false,
      customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
    });

    service.update.mockResolvedValueOnce(mock);

    const result = await controller.update(
      {
        user: {
          id: '234-234-234-234',
          customerId: 'e2afa0ab-95d8-4b2a-bc00-6afbe0024145',
        },
      },
      '86218e15-d405-4e1b-9955-947922474b1c',
      'e2afa0ab-95d8-4b2a-bc00-6afbe0024145',
      {
        active: false,
        title: 'Incendio',
      },
    );

    expect(result).toMatchObject(mock);
  });
});
