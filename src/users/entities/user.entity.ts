import { Prisma, Role, User as PrismaUser, CustomerType } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

export class User implements PrismaUser {
  @ApiProperty({ example: '5e9f8f8f-8f8f-8f8f-8f8f-8f8f8f8f8f8f' })
  id: string;
  @ApiProperty()
  username: string;
  @ApiProperty()
  firstName: string;
  @ApiProperty()
  lastName: string;
  @ApiProperty()
  fullName: string;
  @ApiProperty({ enum: Role })
  role: Role;
  @ApiProperty()
  active: boolean;
  @ApiProperty()
  customerId: string | null;
  @ApiProperty()
  createdAt: Date;
  @ApiProperty()
  updatedAt: Date;
  @ApiProperty()
  lot: string | null;
  @ApiProperty()
  image: Prisma.JsonValue;
  @ApiProperty()
  updatedById: string | null;
  @Exclude()
  password: string;
  @ApiProperty()
  pushId: string | null;
  @ApiProperty()
  emergencyNumber: string | null;
  @ApiProperty()
  alarmNumber: string | null;
  @ApiProperty()
  lastAccessToMenu: Date | null;
  @ApiProperty()
  status: string | null;
  @ApiProperty()
  homeAddress: Prisma.JsonValue;
  @ApiProperty()
  workAddress: Prisma.JsonValue;
  @ApiProperty()
  idCard: string | null;
  @ApiProperty()
  verificationCode: string | null;
  @ApiProperty()
  lastStateUpdatedTime: Date | null;
  @ApiProperty()
  stateUpdatedUserId: string | null;
  @ApiProperty()
  comment: string | null;
  @ApiProperty()
  authorizedUserId: string | null;

  removed: boolean;
  removedAt: Date | null;
  customerType: CustomerType | null;

  constructor(partial?: Partial<User>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}

export class UserWithoutPassword implements Omit<User, 'password'> {
  removed: boolean;
  removedAt: Date | null;
  pushId: string | null;
  emergencyNumber: string | null;
  alarmNumber: string | null;
  lastAccessToMenu: Date | null;
  status: string | null;
  homeAddress: Prisma.JsonValue;
  workAddress: Prisma.JsonValue;
  idCard: string | null;
  verificationCode: string | null;
  lastStateUpdatedTime: Date | null;
  stateUpdatedUserId: string | null;
  comment: string | null;
  authorizedUserId: string | null;
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: Role;
  active: boolean;
  customerId: string | null;
  createdAt: Date;
  updatedAt: Date;
  lot: string | null;
  image: Prisma.JsonValue;
  updatedById: string | null;
  access_token?: string;
  customerType: CustomerType | null;
}
