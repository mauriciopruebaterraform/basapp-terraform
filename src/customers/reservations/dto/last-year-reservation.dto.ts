import { IsNotEmpty, IsString, ValidateIf } from 'class-validator';

export class LastYearReservationDto {
  @IsString()
  @ValidateIf((o) => !o.userId && !o.authorizedUserId)
  authorizedUserId?: string;

  @IsString()
  @ValidateIf((o) => !o.authorizedUserId && !o.userId)
  userId?: string;

  @IsString()
  @IsNotEmpty()
  reservationTypeId: string;
}
