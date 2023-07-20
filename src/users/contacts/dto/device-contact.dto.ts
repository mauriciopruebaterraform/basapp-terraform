import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

class PhoneNumbers {
  @IsString()
  @IsOptional()
  id?: string | null;

  @IsBoolean()
  @IsOptional()
  pref?: boolean | null;

  @IsString()
  @IsOptional()
  value?: string | null;

  @IsString()
  @IsOptional()
  type?: string | null;

  @IsString()
  @IsOptional()
  countryCode?: string | null;

  @IsString()
  @IsOptional()
  digits?: string | null;

  @IsString()
  @IsOptional()
  label?: string | null;

  @IsString()
  @IsOptional()
  number?: string | null;
}
class NameDeviceContact {
  @IsString()
  @IsOptional()
  familyName?: string | null;

  @IsString()
  @IsOptional()
  givenName?: string | null;

  @IsString()
  @IsOptional()
  formatted?: string | null;
}

export class DeviceContactDto {
  @IsString()
  @IsOptional()
  id?: string | null;

  @IsString()
  @IsOptional()
  rawId?: string | null;

  @IsString()
  @IsOptional()
  displayName?: string | null;

  @IsOptional()
  @Type(({ object }: any) => {
    if (typeof object.name !== 'string') return NameDeviceContact;
    else return String;
    // Handle edge case where the previous ifs are not fullfiled
  })
  name?: string | NameDeviceContact | null;
  @IsOptional()
  @IsString()
  firstName?: string | null;
  @IsOptional()
  @IsString()
  LastName?: string | null;
  @IsOptional()
  phoneNumbers?: PhoneNumbers[] | null;
  @IsString()
  @IsOptional()
  nickname?: string | null;

  @IsString()
  @IsOptional()
  emails?: string | null;

  @IsString()
  @IsOptional()
  addresses?: string | null;

  @IsString()
  @IsOptional()
  ims?: string | null;

  @IsString()
  @IsOptional()
  organizations?: string | null;

  @IsString()
  @IsOptional()
  birthday?: string | null;

  @IsString()
  @IsOptional()
  note?: string | null;

  @IsString()
  @IsOptional()
  photos?: string | null;

  @IsString()
  @IsOptional()
  categories?: string | null;

  @IsString()
  @IsOptional()
  urls?: string | null;
}
