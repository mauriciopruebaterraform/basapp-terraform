import '../../__test__/winston';
import { Holidays } from './entities/holidays.entity';
import { Test, TestingModule } from '@nestjs/testing';
import { HolidaysController } from './holidays.controller';
import { HolidaysModule } from './holidays.module';
import { HolidaysService } from './holidays.service';
import { HolidaysServiceMock } from './mocks/holidays.service';
import { PrismaService } from '@src/database/prisma.service';
import { PrismaServiceMock } from '@src/database/mocks/prisma.service';
import { mockDeep } from 'jest-mock-extended';

describe('HolidaysController', () => {
  let controller: HolidaysController;
  let holidaysService: HolidaysServiceMock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HolidaysModule],
      controllers: [HolidaysController],
    })
      .overrideProvider(PrismaService)
      .useValue(PrismaServiceMock)
      .overrideProvider(HolidaysService)
      .useValue(HolidaysServiceMock)
      .compile();

    controller = module.get<HolidaysController>(HolidaysController);
    holidaysService = module.get(HolidaysService);
  });

  it('should return a list of customers holidays', async () => {
    const customerHolidays: Holidays[] = mockDeep<Holidays[]>([
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

    holidaysService.findAll.mockResolvedValueOnce({
      results: customerHolidays,
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
      size: customerHolidays.length,
      total: customerHolidays.length,
      take: 10,
      skip: 0,
    });
  });

  it('should create holiday', async () => {
    expect(controller.create).toBeDefined();

    const holidayMock = mockDeep<Holidays>({
      id: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      active: true,
      customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
    });

    holidaysService.create.mockResolvedValueOnce(holidayMock);

    const result = await controller.create(
      {
        user: {
          id: '234-234-234-234',
          customerId: '123-123-123-123',
        },
      },
      '123-123-123-123',
      {
        date: new Date(),
      },
    );

    expect(result).toMatchObject(holidayMock);
  });

  it('should update holiday', async () => {
    expect(controller.update).toBeDefined();

    const mock = mockDeep<Holidays>({
      id: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      active: false,
      customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
    });

    holidaysService.update.mockResolvedValueOnce(mock);

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

    expect(result).toMatchObject(mock);
  });
});
