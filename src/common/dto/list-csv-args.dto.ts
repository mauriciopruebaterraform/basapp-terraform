import { ApiProperty } from '@nestjs/swagger';
import { IsJSON, IsOptional } from 'class-validator';

export class ListCsvArgsDto {
  @IsJSON()
  @IsOptional()
  @ApiProperty({ type: String })
  orderBy?: Record<string, boolean>;

  @IsJSON()
  @IsOptional()
  @ApiProperty({ type: String })
  where?: Record<string, string>;
}
