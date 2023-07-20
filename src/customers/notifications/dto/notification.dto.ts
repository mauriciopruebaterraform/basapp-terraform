import { NotificationType } from '@prisma/client';
import { File } from '@src/common/dto/file.dto';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  ValidateNested,
  IsBoolean,
  IsArray,
  IsUUID,
  IsEnum,
} from 'class-validator';

export class NotificationDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsBoolean()
  emergency?: boolean;

  @IsOptional()
  @IsString()
  fromLot?: string;

  @IsOptional()
  @IsString()
  toLot?: string;

  @ValidateNested()
  @IsOptional()
  @Type(() => File) // necessary to trigger the nested validation
  image?: File | null;

  @IsUUID('4', { each: true })
  @IsArray()
  @IsOptional()
  additionalNotifications?: string[] | undefined;

  @IsUUID('4')
  @IsString()
  @IsOptional()
  locationId?: string;

  @IsString()
  @IsOptional()
  @IsEnum(NotificationType)
  notificationType?: NotificationType;
}
