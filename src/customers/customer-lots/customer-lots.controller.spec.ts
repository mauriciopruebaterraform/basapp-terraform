import '../../__test__/winston';
import { CustomerLot } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { CustomerLotsController } from './customer-lots.controller';
import { CustomerLotsModule } from './customer-lots.module';
import { CustomerLotsService } from './customer-lots.service';
import { PrismaService } from '@src/database/prisma.service';
import { PrismaServiceMock } from '@src/database/mocks/prisma.service';
import { mock, mockDeep } from 'jest-mock-extended';
import { CustomerLotsServiceMock } from './mocks/customer-lots.service';

describe('CustomerLotsController', () => {
  let controller: CustomerLotsController;
  let service: CustomerLotsServiceMock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CustomerLotsModule],
      controllers: [CustomerLotsController],
    })
      .overrideProvider(PrismaService)
      .useValue(PrismaServiceMock)
      .overrideProvider(CustomerLotsService)
      .useValue(CustomerLotsServiceMock)
      .compile();

    controller = module.get<CustomerLotsController>(CustomerLotsController);
    service = module.get(CustomerLotsService);
  });

  it('should return a list of customers customer lots', async () => {
    const customerCustomerLots: CustomerLot[] = mockDeep<CustomerLot[]>([
      {
        id: '4e3f8f9b-4b5f-b8e9-f8c1b5f8e9f8',
        customerId: 'f8c1-b8e9-4b5f-b8e9-f8c1b5f8e9f8',
        icmLot: 'SI100',
      },
      {
        id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f9',
        icmLot: 'SI200',
        customerId: 'b8e9-dd-f8c1-4b5f-b8e9-asd',
      },
      {
        icmLot: 'SI300',
        id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f10',
        customerId: 'b8e9-f8c1b5f8e9f8-sdf-4b5f-sdf-sdf',
      },
      {
        icmLot: 'SI400',
        id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f11',
        customerId: 'b8e9-dfsdfsd-f8c1-4b5f-b8e9-f8c1b5f8e9f8',
      },
    ]);

    service.findAll.mockResolvedValueOnce({
      results: customerCustomerLots,
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

    results.forEach((item) => {
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('lot');
      expect(item).toHaveProperty('icmLot');
      expect(item).toHaveProperty('icmUid');
      expect(item).toHaveProperty('customerId');
      expect(item).toHaveProperty('createdAt');
      expect(item).toHaveProperty('updatedAt');
    });

    expect(pagination).toBeDefined();
    expect(pagination).toBeInstanceOf(Object);
    expect(pagination).toEqual({
      size: customerCustomerLots.length,
      total: customerCustomerLots.length,
      take: 10,
      skip: 0,
    });
  });

  it('should create customer lot', async () => {
    expect(controller.create).toBeDefined();

    const customerLotMock = mockDeep<CustomerLot>({
      id: '4e3f8f9b-4b5f-b8e9-f8c1b5f8e9f8',
      customerId: 'f8c1-b8e9-4b5f-b8e9-f8c1b5f8e9f8',
      icmLot: 'SI100',
    });

    service.create.mockResolvedValueOnce(customerLotMock);

    const result = await controller.create({
      customerId: 'f8c1-b8e9-4b5f-b8e9-f8c1b5f8e9f8',
      icmLot: 'SI100',
    });

    expect(result).toMatchObject(customerLotMock);
  });

  it('should update customer lot', async () => {
    expect(controller.update).toBeDefined();

    const customerLotMock = mockDeep<CustomerLot>({
      id: '4e3f8f9b-4b5f-b8e9-f8c1b5f8e9f8',
      customerId: 'f8c1-b8e9-4b5f-b8e9-f8c1b5f8e9f8',
      icmLot: 'SI100',
    });

    service.update.mockResolvedValueOnce(customerLotMock);

    const result = await controller.update('4e3f8f9b-4b5f-b8e9-f8c1b5f8e9f8', {
      customerId: 'f8c1-b8e9-4b5f-b8e9-f8c1b5f8e9f8',
      icmLot: 'SI100',
    });

    expect(result).toMatchObject(customerLotMock);
  });

  it('should create many customer lots', async () => {
    const file = mock<Express.Multer.File>({
      buffer: Buffer.from('file.csv'),
    });

    service.loadCsv.mockResolvedValueOnce({ count: 1 });
    const result = await controller.importLots(
      {
        user: {
          id: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
          customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        },
      },
      file,
      {
        customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      },
    );

    expect(result).toEqual({ count: 1 });
  });
});
