import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GetQueryReservationDetailDto {
  @IsString()
  @IsOptional()
  utcOffset?: string;

  @IsString()
  @IsNotEmpty()
  id: string;
}
