import { ApiProperty } from '@nestjs/swagger';
import { IsJSON, IsOptional } from 'class-validator';

export class StatsArgsDto {
  @IsJSON()
  @IsOptional()
  @ApiProperty({ type: String })
  where?: Record<string, any>;
}
