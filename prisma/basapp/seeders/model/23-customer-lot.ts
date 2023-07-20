import { Prisma, PrismaClient } from '@prisma/client';
import { Model } from '../seed';
import { constants } from '../utils/constants';

const { TEST_COUNTRY_ID, SAN_FERNANDO_ID } = constants;

const model: Model & { data: Prisma.CustomerLotCreateManyInput[] } = {
  data: [
    {
      lot: 'HOUSE',
      icmLot: '15_HOUSE',
      icmUid: '5111C2E9-07AC-410B-AB3C-914DDD823E29',
      customerId: TEST_COUNTRY_ID,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      lot: 'INTENDENCIA',
      icmLot: '15_INTENDENCIA',
      icmUid: '00D47DDA-E64C-4912-9698-1CF735B4B1F7',
      customerId: TEST_COUNTRY_ID,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      lot: '000',
      icmLot: 'AL000000',
      icmUid: '32575744-63BC-45B5-81F1-FFB80EF98FA5',
      customerId: TEST_COUNTRY_ID,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      lot: '001',
      icmLot: 'AL000001',
      icmUid: '69ADAFCE-E6CB-480E-A8A8-AA40775DEC2F',
      customerId: TEST_COUNTRY_ID,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      lot: '002',
      icmLot: 'AL000002',
      icmUid: '31F48DF7-DA50-4F9E-B835-E388370B86F3',
      customerId: SAN_FERNANDO_ID,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      lot: '003',
      icmLot: 'AL000003',
      icmUid: '1AB3D974-AFB9-4CE1-A1FC-3869FBFFB8BA',
      customerId: SAN_FERNANDO_ID,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      lot: '004',
      icmLot: 'AL000004',
      icmUid: '2CB4FAA2-0877-48E8-AB96-06258227DE8A',
      customerId: TEST_COUNTRY_ID,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      lot: '005',
      icmLot: 'AL000005',
      icmUid: '09E3D4DD-E547-4944-B0C6-A3200ECEF428',
      customerId: TEST_COUNTRY_ID,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      lot: '006',
      icmLot: 'AL000006',
      icmUid: '21ADE670-FD6C-4065-8A56-413A4DA9CA5E',
      customerId: TEST_COUNTRY_ID,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      lot: '008',
      icmLot: 'AL000008',
      icmUid: '241E0317-E23B-4085-B5E3-1F8B32F29DF4',
      customerId: TEST_COUNTRY_ID,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      lot: '009',
      icmLot: 'AL000009',
      icmUid: '85AD1EC2-84AC-41C1-9B80-589BF6116D6A',
      customerId: SAN_FERNANDO_ID,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      lot: '010',
      icmLot: 'AL000010',
      icmUid: 'F687C59C-5EFF-4B2D-9AD5-9FFA7D12596E',
      customerId: SAN_FERNANDO_ID,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  async run(prisma: PrismaClient) {
    return prisma.customerLot.createMany({
      data: this.data,
      skipDuplicates: true,
    });
  },
};

export default model;
