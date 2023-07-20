import { ApiProperty } from '@nestjs/swagger';
import {
  IsJSON,
  IsNumberString,
  IsOptional,
  IsBooleanString,
} from 'class-validator';

export class ListQueryArgsDto {
  @IsJSON()
  @IsOptional()
  @ApiProperty({ type: String })
  select?: Record<string, any>;

  @IsJSON()
  @IsOptional()
  @ApiProperty({ type: String })
  include?: Record<string, boolean>;

  @IsJSON()
  @IsOptional()
  @ApiProperty({ type: String })
  orderBy?: Record<string, boolean>;

  @IsJSON()
  @IsOptional()
  @ApiProperty({ type: String })
  where?: Record<string, any>;

  @IsNumberString()
  @IsOptional()
  skip?: number;

  @IsNumberString()
  @IsOptional()
  take?: number;

  @IsBooleanString()
  @IsOptional()
  includeCount?: boolean;
}
