import '../../__test__/winston';
import { Customer, Location } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { LocationsController } from './locations.controller';
import { LocationsModule } from './locations.module';
import { LocationsService } from './locations.service';
import { LocationsServiceMock } from './mocks/locations.service';
import { PrismaService } from '@src/database/prisma.service';
import { PrismaServiceMock } from '@src/database/mocks/prisma.service';
import { mockDeep } from 'jest-mock-extended';

describe('LocationsController', () => {
  let controller: LocationsController;
  let locationsService: LocationsServiceMock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [LocationsModule],
      controllers: [LocationsController],
    })
      .overrideProvider(PrismaService)
      .useValue(PrismaServiceMock)
      .overrideProvider(LocationsService)
      .useValue(LocationsServiceMock)
      .compile();

    controller = module.get<LocationsController>(LocationsController);
    locationsService = module.get(LocationsService);
  });

  it('should return a list of customers locations', async () => {
    const customerLocations: Location[] = mockDeep<Location[]>([
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

    locationsService.findAll.mockResolvedValueOnce({
      results: customerLocations,
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
      size: customerLocations.length,
      total: customerLocations.length,
      take: 10,
      skip: 0,
    });
  });

  it('should create location', async () => {
    expect(controller.create).toBeDefined();

    const locationMock = mockDeep<
      Location & {
        customer: Customer;
      }
    >({
      id: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      name: '123123123',
      type: 'locality',
      updatedById: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      active: true,
      customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
    });

    locationsService.create.mockResolvedValueOnce(locationMock);

    const result = await controller.create(
      {
        user: {
          id: '234-234-234-234',
          customerId: '123-123-123-123',
        },
      },
      '123-123-123-123',
      {
        name: '123123123',
        type: 'locality',
      },
    );

    expect(result).toMatchObject(locationMock);
  });

  it('should update location', async () => {
    expect(controller.update).toBeDefined();

    const eventTypeMock = mockDeep<Location>({
      id: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      name: 'test updated',
      updatedById: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      active: false,
      customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
    });

    locationsService.update.mockResolvedValueOnce(eventTypeMock);

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
        name: 'test updated',
      },
    );

    expect(result).toMatchObject(eventTypeMock);
  });
});
