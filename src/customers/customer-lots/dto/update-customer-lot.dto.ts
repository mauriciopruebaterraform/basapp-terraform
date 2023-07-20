import { PartialType } from '@nestjs/mapped-types';
import { CustomerLotDto } from './customer-lot.dto';

export class UpdateCustomerLotDto extends PartialType(CustomerLotDto) {}
