import { AlertStateService } from '@src/alert-states/alert-states.service';
import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended';

beforeEach(() => {
  mockReset(AlertStateServiceMock);
});

export type AlertStateServiceMock = DeepMockProxy<AlertStateService>;

export const AlertStateServiceMock =
  mockDeep<AlertStateService>() as unknown as DeepMockProxy<AlertStateService>;
