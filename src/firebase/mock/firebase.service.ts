import { FirebaseService } from '@src/firebase/firebase.service';
import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended';

beforeEach(() => {
  mockReset(FirebaseServiceMock);
});

export type FirebaseServiceMock = DeepMockProxy<FirebaseService>;

export const FirebaseServiceMock =
  mockDeep<FirebaseService>() as unknown as DeepMockProxy<FirebaseService>;
