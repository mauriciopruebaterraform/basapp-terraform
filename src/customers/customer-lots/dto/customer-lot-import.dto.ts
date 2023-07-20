import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CustomerLotImportDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  customerId: string;
}
