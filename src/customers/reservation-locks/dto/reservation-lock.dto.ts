import {
  IsArray,
  IsString,
  IsOptional,
  IsBoolean,
  IsDateString,
  ValidateNested,
  IsUUID,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TimeDto } from '@src/common/dto/time.dto';
import { Type } from 'class-transformer';

export class ReservationLockDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsBoolean()
  @IsOptional()
  ignoreIfHoliday?: boolean;

  @IsDateString()
  @IsOptional()
  @ApiProperty()
  date?: Date;

  @ValidateNested()
  @IsOptional()
  @IsArray()
  @Type(() => TimeDto)
  mon?: TimeDto[];

  @ValidateNested()
  @IsOptional()
  @IsArray()
  @Type(() => TimeDto)
  tue?: TimeDto[];

  @ValidateNested()
  @IsOptional()
  @IsArray()
  @Type(() => TimeDto)
  wed?: TimeDto[];

  @ValidateNested()
  @IsOptional()
  @IsArray()
  @Type(() => TimeDto)
  thu?: TimeDto[];

  @ValidateNested()
  @IsOptional()
  @IsArray()
  @Type(() => TimeDto)
  fri?: TimeDto[];

  @ValidateNested()
  @IsOptional()
  @IsArray()
  @Type(() => TimeDto)
  sat?: TimeDto[];

  @ValidateNested()
  @IsOptional()
  @IsArray()
  @Type(() => TimeDto)
  sun?: TimeDto[];

  @ValidateNested()
  @IsOptional()
  @IsArray()
  @Type(() => TimeDto)
  holiday?: TimeDto[];

  @ValidateNested()
  @IsOptional()
  @IsArray()
  @Type(() => TimeDto)
  holidayEve?: TimeDto[];

  @IsUUID()
  @IsString()
  @IsNotEmpty()
  reservationTypeId: string;

  @IsUUID()
  @IsString()
  @IsNotEmpty()
  reservationSpaceId: string;
}
