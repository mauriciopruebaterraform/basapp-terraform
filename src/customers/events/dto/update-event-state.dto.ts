import { IsNotEmpty, IsString, IsOptional, IsUUID } from 'class-validator';

export class UpdateEventStateDto {
  @IsUUID('4')
  @IsString()
  @IsNotEmpty()
  eventStateId: string;

  @IsString()
  @IsOptional()
  observations?: string;
}
