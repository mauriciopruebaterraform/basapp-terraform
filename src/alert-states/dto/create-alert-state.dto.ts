import { IsNotEmpty, IsString } from 'class-validator';

export class CreateAlertState {
  @IsString()
  @IsNotEmpty()
  name: string;
}
