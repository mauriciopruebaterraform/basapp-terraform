import { Customer, CustomerType, Prisma } from '@prisma/client';
import { Mock, MockFactory } from 'mockingbird-ts';

export class FakeCustomer implements Customer {
  verifyBySms: boolean;
  id: string;
  @Mock({ enum: CustomerType })
  type: CustomerType;
  @Mock()
  name: string;
  @Mock()
  active: boolean;
  @Mock()
  district: string;
  @Mock()
  state: string;
  @Mock()
  country: string;
  @Mock((faker) => faker.random.alphaNumeric(7))
  secretKey: string;
  @Mock()
  trialPeriod: boolean;
  @Mock()
  countryCode: string;
  @Mock()
  phoneLength: number;
  @Mock((faker) => faker.internet.url())
  url: string;
  @Mock((faker) => faker.datatype.number({ min: 1, max: 100 }).toString())
  speed: string;
  @Mock((faker) => faker.lorem.sentence(5))
  notes: string;
  @Mock()
  timezone: string;
  @Mock()
  image: Prisma.JsonValue;
  @Mock()
  isClient: boolean | null;

  createdAt: Date;
  updatedAt: Date;
  parentId: string | null;
  updatedById: string;

  getMockFactory() {
    return MockFactory<FakeCustomer>(FakeCustomer);
  }
}
