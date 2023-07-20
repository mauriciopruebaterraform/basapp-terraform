import { SetMetadata } from '@nestjs/common';

export const POLICIES_KEY = 'policies-exclude';
export const PoliciesExclude = (...policies: string[]) =>
  SetMetadata(POLICIES_KEY, policies);
