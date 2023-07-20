import { ApiProperty } from '@nestjs/swagger';
import { File } from '@src/common/dto/file.dto';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Participant } from './participants.dto';

export class ReservationDto {
  @IsString()
  @ValidateIf((o) => !o.userId && !o.authorizedUserId && !o.noUser)
  authorizedUserId?: string;

  @IsString()
  @ValidateIf((o) => !o.userId && !o.authorizedUserId && !o.noUser)
  userId?: string;

  @IsBoolean()
  @ValidateIf((o) => !o.userId && !o.authorizedUserId && !o.noUser)
  noUser?: boolean;

  @Type(() => Participant)
  @IsOptional()
  @IsArray()
  participants?: Participant[];

  @ValidateNested()
  @IsOptional()
  @Type(() => File) // necessary to trigger the nested validation
  file?: File | null;

  @IsDateString()
  @IsNotEmpty()
  @ApiProperty()
  toDate: Date;

  @IsDateString()
  @ApiProperty()
  @IsNotEmpty()
  fromDate: Date;

  @IsString()
  @IsNotEmpty()
  reservationModeId: string;

  @IsString()
  @IsNotEmpty()
  reservationSpaceId: string;

  @IsString()
  @IsNotEmpty()
  reservationTypeId: string;
}
