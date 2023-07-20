import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsUUID('4')
  @IsOptional()
  customerId: string;
}
