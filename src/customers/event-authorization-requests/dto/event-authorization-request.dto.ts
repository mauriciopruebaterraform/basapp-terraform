import { IsNotEmpty, IsString } from 'class-validator';

export class CreateEventAuthorizationRequest {
  @IsString()
  @IsNotEmpty()
  lot: string;

  @IsString()
  @IsNotEmpty()
  authorized: string;
}
