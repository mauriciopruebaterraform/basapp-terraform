import { IsNotEmpty, IsUUID } from 'class-validator';

export class SmsDto {
  @IsNotEmpty()
  @IsUUID()
  id: string;
}
