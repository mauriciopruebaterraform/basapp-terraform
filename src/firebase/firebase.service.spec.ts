import '../__test__/winston';
import { Test, TestingModule } from '@nestjs/testing';
import { EventType, Role } from '@prisma/client';
import { Alert } from '@src/alerts/entities/alert.entity';
import { mockDeep } from 'jest-mock-extended';
import { FirebaseService } from './firebase.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from '../config/configuration';

const token = 'random.token.basapp';

jest.mock('firebase-admin', () => {
  return {
    database: () => ({
      ref: () => ({
        child: () => ({
          push: () => null,
          set: async () => null,
        }),
      }),
    }),
    auth: () => ({
      createCustomToken: () => token,
    }),
  };
});

describe('FirebaseService', () => {
  let service: FirebaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FirebaseService, ConfigService],
      imports: [
        ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
      ],
    }).compile();

    service = module.get<FirebaseService>(FirebaseService);
    module.init();
  });

  it('execute pushEventFirebase', async () => {
    const eventType = mockDeep<EventType>({
      title: 'QR DNI largo',
    });
    const result = await service.pushEventFirebase({
      eventType: eventType,
      customerId: 'd8376f3a-68f2-474d-b4ca-40a5f00abd35',
      id: '2c0b232e-cdb3-4f1d-91fa-85f2fa92c0ec',
      eventStateId: '2c0b232e-cdb3-4f1d-91fa-85f2fa92c0ec',
      createdAt: new Date(),
      updatedAt: new Date(),
      user: {
        fullName: 'Mauricio Gallego',
        id: '1111ee9a-401c-4cb0-8f0a-4a9ef4811e21',
      },
    });

    expect(result).toBe(true);
  });

  it('execute pushAlertFirebase', async () => {
    const mockAlert = mockDeep<Alert>({
      alertType: {
        name: 'Mala compañia',
      },
      createdAt: new Date(),
      user: {
        fullName: 'Mauricio Gallego',
      },
    });
    const result = await service.pushAlertFirebase(mockAlert);

    expect(result).toBe(true);
  });

  it('create custom token', async () => {
    const result = await service.createCustomToken(
      '6672a03b-fb66-40de-b031-58740462958a',
      {
        username: 'mauriciog@gmail.com',
        role: Role.statesman,
        active: true,
        customerIds: [],
        customerId: 'a889214f-c1f0-4fd1-9312-e6e7d1ed3137',
      },
    );

    expect(result).toBe(token);
  });
});
