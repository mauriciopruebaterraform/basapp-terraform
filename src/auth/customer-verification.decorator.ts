import { SetMetadata } from '@nestjs/common';

export const KEY = 'customer-verification';
export const CustomerVerification = () => SetMetadata(KEY, 1);
