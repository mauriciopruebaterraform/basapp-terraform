import '../../__test__/winston';
import { Test, TestingModule } from '@nestjs/testing';
import { UsefulInformationModule } from './useful-information.module';
import { UsefulInformationService } from './useful-information.service';
import { PrismaService } from '@src/database/prisma.service';
import { PrismaServiceMock } from '@src/database/mocks/prisma.service';
import { mockDeep } from 'jest-mock-extended';
import { errorCodes } from './useful-information.constants';
import { UsefulInformation } from './entities/useful-information.entity';
import { UsefulInformationController } from './useful-information.controller';
import { UsefulInformationServiceMock } from './mocks/useful-information.service';

describe('UsefulInformationController', () => {
  let controller: UsefulInformationController;
  let service: UsefulInformationServiceMock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [UsefulInformationModule],
      controllers: [UsefulInformationController],
    })
      .overrideProvider(PrismaService)
      .useValue(PrismaServiceMock)
      .overrideProvider(UsefulInformationService)
      .useValue(UsefulInformationServiceMock)
      .compile();

    controller = module.get<UsefulInformationController>(
      UsefulInformationController,
    );
    service = module.get(UsefulInformationService);
  });

  it('should return a list of useful information of customers', async () => {
    const mockList: UsefulInformation[] = mockDeep<UsefulInformation[]>([
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

    service.findAll.mockResolvedValueOnce({
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
      expect(item).toHaveProperty('code');
      expect(item).toHaveProperty('title');
      expect(item).toHaveProperty('active');
      expect(item).toHaveProperty('attachment');
      expect(item).toHaveProperty('isCategory');
      expect(item).toHaveProperty('categoryId');
      expect(item).toHaveProperty('link');
      expect(item).toHaveProperty('description');
      expect(item).toHaveProperty('createdAt');
      expect(item).toHaveProperty('updatedAt');
      expect(item).toHaveProperty('customerId');
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

  it('should create useful information', async () => {
    expect(controller.create).toBeDefined();

    const Mock = mockDeep<UsefulInformation>({
      id: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      title: 'Novedad',
      code: 'A0001',
      updatedById: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      active: true,
      customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
    });

    service.create.mockResolvedValueOnce(Mock);

    const result = await controller.create(
      {
        user: {
          id: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
          customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        },
      },
      '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      {
        title: 'Novedad',
        code: 'A0001',
      },
    );

    expect(result).toStrictEqual(Mock);
  });

  it('should update useful information', async () => {
    expect(controller.update).toBeDefined();

    const mock = mockDeep<UsefulInformation>({
      id: '86218e15-d405-4e1b-9955-947922474b1c',
      title: 'Novedad',
      updatedById: 'a3d4ge9a-401c-4cb0-8f0a-4a9ef4811ed1',
      active: false,
      customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
    });

    service.update.mockResolvedValueOnce(mock);

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
        title: 'Novedad',
      },
    );

    expect(result).toMatchObject(mock);
  });

  it('should throw error useful information, same id', async () => {
    expect(controller.update).toBeDefined();
    return await expect(
      controller.update(
        {
          user: {
            role: 'statesman',
            id: 'a3d4ge9a-401c-4cb0-8f0a-4a9ef4811ed1',
            customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
          },
        },
        '86218e15-d405-4e1b-9955-947922474b1c',
        '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
        {
          active: false,
          title: 'Novedad',
          categoryId: '86218e15-d405-4e1b-9955-947922474b1c',
        },
      ),
    ).rejects.toThrowError(errorCodes.INVALID_SAME_CATEGORY_USEFUL_INFORMATION);
  });
});
