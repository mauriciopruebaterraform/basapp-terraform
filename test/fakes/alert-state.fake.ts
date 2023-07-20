import { AlertState } from '@prisma/client';
import { Mock, MockFactory } from 'mockingbird-ts';

export class FakeAlertState implements AlertState {
  id: string;
  @Mock()
  name: string;
  @Mock()
  active: boolean;
  @Mock()
  customerId: string | null;

  getMockFactory() {
    return MockFactory<FakeAlertState>(FakeAlertState);
  }
}
