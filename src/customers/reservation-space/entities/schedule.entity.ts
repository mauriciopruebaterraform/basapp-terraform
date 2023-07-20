import { ApiProperty } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { IsNotEmpty, IsString } from 'class-validator';

class Time {
  @IsNotEmpty()
  @ApiProperty()
  @IsString()
  from: string;

  @IsNotEmpty()
  @ApiProperty()
  @IsString()
  to: string;
}

export class Schedule {
  @IsNotEmpty()
  @ApiProperty({ type: Time, required: true })
  mon: Prisma.JsonValue;

  @IsNotEmpty()
  @ApiProperty({ type: Time, required: true })
  tue: Prisma.JsonValue;

  @IsNotEmpty()
  @ApiProperty({ type: Time, required: true })
  wed: Prisma.JsonValue;

  @IsNotEmpty()
  @ApiProperty({ type: Time, required: true })
  thu: Prisma.JsonValue;

  @IsNotEmpty()
  @ApiProperty({ type: Time, required: true })
  fri: Prisma.JsonValue;

  @IsNotEmpty()
  @ApiProperty({ type: Time, required: true })
  sat: Prisma.JsonValue;

  @IsNotEmpty()
  @ApiProperty({ type: Time, required: true })
  sun: Prisma.JsonValue;
}
