import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class UpdateEventState {
  @IsString()
  @IsOptional()
  name: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
