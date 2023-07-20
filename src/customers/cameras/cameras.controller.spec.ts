import '../../__test__/winston';
import { Customer, Camera } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { CamerasController } from './cameras.controller';
import { CamerasModule } from './cameras.module';
import { CamerasService } from './cameras.service';
import { PrismaService } from '@src/database/prisma.service';
import { PrismaServiceMock } from '@src/database/mocks/prisma.service';
import { mockDeep } from 'jest-mock-extended';
import { CamerasServiceMock } from './mocks/cameras.service';

describe('CamerasController', () => {
  let controller: CamerasController;
  let service: CamerasServiceMock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CamerasModule],
      controllers: [CamerasController],
    })
      .overrideProvider(PrismaService)
      .useValue(PrismaServiceMock)
      .overrideProvider(CamerasService)
      .useValue(CamerasServiceMock)
      .compile();

    controller = module.get<CamerasController>(CamerasController);
    service = module.get(CamerasService);
  });

  it('should return a list of customers cameras', async () => {
    const customerCameras: Camera[] = mockDeep<Camera[]>([
      {
        id: '4e3f8f9b-4b5f-b8e9-f8c1b5f8e9f8',
        geolocation: JSON.stringify({
          lat: '-34.473163',
          lng: '-58.513503',
        }),
        customerId: 'f8c1-b8e9-4b5f-b8e9-f8c1b5f8e9f8',
        code: 'SI100',
      },
      {
        id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f9',
        geolocation: JSON.stringify({
          lat: '-34.473163',
          lng: '-58.513503',
        }),
        customerId: 'b8e9-dd-f8c1-4b5f-b8e9-asd',
      },
      {
        id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f10',
        geolocation: JSON.stringify({
          lat: '-34.473163',
          lng: '-58.513503',
        }),
        customerId: 'b8e9-f8c1b5f8e9f8-sdf-4b5f-sdf-sdf',
      },
      {
        id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f11',
        geolocation: JSON.stringify({
          lat: '-34.473163',
          lng: '-58.513503',
        }),
        customerId: 'b8e9-dfsdfsd-f8c1-4b5f-b8e9-f8c1b5f8e9f8',
      },
    ]);

    service.findAll.mockResolvedValueOnce({
      results: customerCameras,
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
      expect(item).toHaveProperty('active');
      expect(item).toHaveProperty('code');
      expect(item).toHaveProperty('url');
      expect(item).toHaveProperty('description');
      expect(item).toHaveProperty('geolocation');
      expect(item).toHaveProperty('createdAt');
      expect(item).toHaveProperty('updatedAt');
      expect(item).toHaveProperty('updatedById');
      expect(item).toHaveProperty('customerId');
    });

    expect(pagination).toBeDefined();
    expect(pagination).toBeInstanceOf(Object);
    expect(pagination).toEqual({
      size: customerCameras.length,
      total: customerCameras.length,
      take: 10,
      skip: 0,
    });
  });

  it('should create camera', async () => {
    expect(controller.create).toBeDefined();

    const eventTypeMock = mockDeep<
      Camera & {
        customer: Customer;
      }
    >({
      id: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      code: 'test',
      updatedById: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      active: true,
      customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
    });

    service.create.mockResolvedValueOnce(eventTypeMock);

    const result = await controller.create(
      {
        user: {
          id: '234-234-234-234',
          customerId: '123-123-123-123',
        },
      },
      '123-123-123-123',
      {
        description: '123123123',
        geolocation: {
          lat: '32',
          lng: '54',
        },
        code: '123123123',
      },
    );

    expect(result).toMatchObject(eventTypeMock);
  });

  it('should update camera', async () => {
    expect(controller.update).toBeDefined();

    const eventTypeMock = mockDeep<Camera>({
      id: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      code: 'test',
      updatedById: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      active: false,
      customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
    });

    service.update.mockResolvedValueOnce(eventTypeMock);

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
      },
    );

    expect(result).toMatchObject(eventTypeMock);
  });
});
