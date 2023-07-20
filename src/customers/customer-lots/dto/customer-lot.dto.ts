import { IsOptional, IsUUID, IsString } from 'class-validator';

export class CustomerLotDto {
  @IsString()
  @IsOptional()
  lot?: string;

  @IsString()
  @IsOptional()
  icmLot?: string;

  @IsString()
  @IsOptional()
  icmUid?: string;

  @IsString()
  @IsUUID('4')
  @IsOptional()
  customerId?: string;
}
