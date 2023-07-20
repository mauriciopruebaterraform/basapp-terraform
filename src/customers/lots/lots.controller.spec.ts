import '../../__test__/winston';
import { Lot } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { LotsController } from './lots.controller';
import { LotsService } from './lots.service';
import { LotModule } from './lots.module';
import { LotsServiceMock } from './mocks/lots.service';
import { PrismaService } from '@src/database/prisma.service';
import { PrismaServiceMock } from '@src/database/mocks/prisma.service';
import { mock, mockDeep } from 'jest-mock-extended';
import { BadRequestException } from '@nestjs/common';
import { errorCodes } from './lots.constants';

describe('LotsController', () => {
  let controller: LotsController;
  let lotsService: LotsServiceMock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [LotModule],
      controllers: [LotsController],
    })
      .overrideProvider(PrismaService)
      .useValue(PrismaServiceMock)
      .overrideProvider(LotsService)
      .useValue(LotsServiceMock)
      .compile();

    controller = module.get<LotsController>(LotsController);
    lotsService = module.get(LotsService);
  });

  it('should return a list of lots of customers', async () => {
    const mockList: Lot[] = mockDeep<Lot[]>([
      {
        id: '4e3f8f9b-4b5f-b8e9-f8c1b5f8e9f8',
        customerId: 'f8c1-b8e9-4b5f-b8e9-f8c1b5f8e9f8',
      },
      {
        id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f9',
        customerId: 'f8c1-b8e9-4b5f-b8e9-f8c1b5f8e9f8',
      },
      {
        id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f10',
        customerId: 'f8c1-b8e9-4b5f-b8e9-f8c1b5f8e9f8',
      },
      {
        id: '4e3f8f9b-f8c1-4b5f-b8e9-f8c1b5f8e9f11',
        customerId: 'f8c1-b8e9-4b5f-b8e9-f8c1b5f8e9f8',
      },
    ]);

    lotsService.findAll.mockResolvedValueOnce({
      results: mockList,
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
          customerId: 'f8c1-b8e9-4b5f-b8e9-f8c1b5f8e9f8',
          role: 'statesman',
        },
      },
      'f8c1-b8e9-4b5f-b8e9-f8c1b5f8e9f8',
      {},
    );
    expect(results).toBeDefined();
    expect(results).toBeInstanceOf(Array);
    expect(results.length).toBe(4);

    results.forEach((item) => {
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('lot');
      expect(item).toHaveProperty('latitude');
      expect(item).toHaveProperty('active');
      expect(item).toHaveProperty('isArea');
      expect(item).toHaveProperty('longitude');
      expect(item).toHaveProperty('createdAt');
      expect(item).toHaveProperty('updatedAt');
      expect(item).toHaveProperty('customerId');
      expect(item).toHaveProperty('updatedById');
    });

    expect(pagination).toBeDefined();
    expect(pagination).toBeInstanceOf(Object);
    expect(pagination).toEqual({
      size: mockList.length,
      total: mockList.length,
      take: 10,
      skip: 0,
    });
  });

  it('should create lot', async () => {
    expect(controller.create).toBeDefined();

    const Mock = mockDeep<Lot>({
      id: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      updatedById: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      lot: 'Golf House',
      latitude: '-34.406696',
      longitude: '-58.825858',
      active: true,
      customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
    });

    lotsService.create.mockResolvedValueOnce(Mock);

    const result = await controller.create(
      {
        user: {
          id: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
          customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        },
      },
      '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      {
        lot: 'Golf House',
        latitude: '-34.406696',
        longitude: '-58.825858',
      },
    );

    expect(result).toStrictEqual(Mock);
  });

  it('should update lot', async () => {
    expect(controller.update).toBeDefined();

    const mock = mockDeep<Lot>({
      id: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      updatedById: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      lot: 'Golf House',
      latitude: '-34.406696',
      longitude: '-58.825858',
      active: false,
      customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
    });

    lotsService.update.mockResolvedValueOnce(mock);

    const result = await controller.update(
      {
        user: {
          id: 'a3d4ge9a-401c-4cb0-8f0a-4a9ef4811ed1',
          customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        },
      },
      '86218e15-d405-4e1b-9955-947922474b1c',
      '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      {
        active: false,
        lot: 'Golf House',
        latitude: '-34.406696',
        longitude: '-58.825858',
      },
    );

    expect(result).toMatchObject(mock);
  });

  it('should create many lots', async () => {
    const file = mock<Express.Multer.File>({
      buffer: Buffer.from('file.csv'),
    });

    lotsService.loadCsv.mockResolvedValueOnce({ count: 1 });
    const result = await controller.importLots(
      {
        user: {
          id: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
          customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        },
      },
      '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      file,
    );

    expect(result).toEqual({ count: 1 });
  });

  it('should throw error to create many lots', async () => {
    expect(controller.importLots).toBeDefined();

    const file = mock<Express.Multer.File>({
      buffer: Buffer.from('file.csv'),
    });

    return await expect(
      controller.importLots(
        {
          fileValidationError: true,
          user: {
            id: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
            customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
          },
        },
        '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        file,
      ),
    ).rejects.toThrowError(
      new BadRequestException(errorCodes.INVALID_FILE_EXTENSION),
    );
  });
});
