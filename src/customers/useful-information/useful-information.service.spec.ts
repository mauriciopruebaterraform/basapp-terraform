import '../../__test__/winston';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@src/database/prisma.service';
import { UsefulInformationService } from './useful-information.service';
import { PrismaServiceMock } from '@src/database/mocks/prisma.service';
import { mockDeep } from 'jest-mock-extended';
import { UsefulInformation } from './entities/useful-information.entity';

describe('UsefulInformationService', () => {
  let service: UsefulInformationService;
  let prisma: PrismaServiceMock;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsefulInformationService,
        {
          provide: PrismaService,
          useValue: PrismaServiceMock,
        },
      ],
    }).compile();

    service = module.get<UsefulInformationService>(UsefulInformationService);
    prisma = module.get(PrismaService);
  });

  it('find all useful information that customers get it', async () => {
    const usefulInformationMock = mockDeep<UsefulInformation>({
      id: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      updatedById: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      active: true,
      customerId: '0589141d-ef1c-4c39-a8c7-30aef555003f',
    });

    prisma.usefulInformation.findMany.mockResolvedValueOnce([
      usefulInformationMock,
    ]);
    prisma.usefulInformation.count.mockResolvedValueOnce(1);
    const { results, pagination } = await service.findAll({});
    expect(results).toEqual([usefulInformationMock]);
    expect(pagination).toEqual({
      total: 1,
      take: 100,
      skip: 0,
      hasMore: false,
      size: 1,
    });
  });

  it('should create useful Information', async () => {
    const Mock = mockDeep<UsefulInformation>({
      id: '37b1b635-3591-4414-9964-87cb32dcab0b',
      title: 'Novedad',
      code: 'A0001',
      updatedById: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      customerId: '0589141d-ef1c-4c39-a8c7-30aef555003f',
    });

    prisma.usefulInformation.create.mockResolvedValueOnce(Mock);
    prisma.usefulInformation.count.mockResolvedValueOnce(0);

    const result = await service.create({
      title: 'Novedad',
      code: 'A0001',
      userId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      customerId: '0589141d-ef1c-4c39-a8c7-30aef555003f',
    });

    expect(result).toStrictEqual(Mock);
  });

  it('should update useful Information', async () => {
    const mock = mockDeep<UsefulInformation>({
      id: 'e2afa0ab-95d8-4b2a-bc00-6afbe0024145',
      updatedById: '70df3d00-b373-4fe8-bbcc-aa98ade885dd',
      active: false,
      title: 'Novedad',
      code: 'Novedad',
      customerId: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
    });

    prisma.usefulInformation.count.mockResolvedValueOnce(1);
    prisma.usefulInformation.findUnique.mockResolvedValueOnce(mock);
    prisma.usefulInformation.update.mockResolvedValueOnce(mock);

    const result = await service.update(
      'e2afa0ab-95d8-4b2a-bc00-6afbe0024145',
      {
        active: false,
        userId: '70df3d00-b373-4fe8-bbcc-aa98ade885dd',
      },
    );

    expect(result).toMatchObject(mock);
  });
});
