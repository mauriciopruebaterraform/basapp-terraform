import { IsNotEmpty, IsString } from 'class-validator';

export class CreateEventState {
  @IsString()
  @IsNotEmpty()
  name: string;
}
