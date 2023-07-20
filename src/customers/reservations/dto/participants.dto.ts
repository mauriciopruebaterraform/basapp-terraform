import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class Participant {
  @IsString()
  @ApiProperty()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @ApiProperty()
  @IsOptional()
  userId?: string | null;

  @IsString()
  @ApiProperty()
  @IsOptional()
  authorizedUserId?: string | null;
}
