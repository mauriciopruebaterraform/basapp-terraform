import '../__test__/winston';
import { ConfigModule } from '@nestjs/config';
import { Role } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';
import configuration from '@src/config/configuration';

describe('AuthService', () => {
  let jwtStrategy: JwtStrategy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ load: [configuration] })],
      providers: [JwtStrategy],
    }).compile();

    jwtStrategy = module.get<JwtStrategy>(JwtStrategy);
  });

  it('should be defined', () => {
    expect(jwtStrategy).toBeDefined();
  });

  it('should return correct user data structure given a valid jwt payload', async () => {
    const tokenPayload = {
      username: 'test',
      sub: '610efd53-1858-4ff4-a41d-735b5b8cd351',
      role: Role.admin,
      active: true,
      customerId: '1',
      iat: 1635438951,
      exp: 1951014951,
    };
    const userData = await jwtStrategy.validate(tokenPayload);
    expect(userData).toHaveProperty(
      'id',
      '610efd53-1858-4ff4-a41d-735b5b8cd351',
    );
    expect(userData).toHaveProperty('username', 'test');
    expect(userData).toHaveProperty('role', 'admin');
    expect(userData).toHaveProperty('customerId', '1');
    expect(userData).toHaveProperty('active', true);
  });
});
