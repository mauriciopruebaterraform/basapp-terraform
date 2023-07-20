import { EventCategory, Prisma } from '@prisma/client';
import { Mock, MockFactory } from 'mockingbird-ts';

export class FakeEventCategory implements EventCategory {
  id: string;
  @Mock()
  title: string;
  @Mock(true)
  active: boolean;
  @Mock({
    url: 'https://s3.amazonaws.com/uploads.demo.countries.basapp.com.ar/customer/d2966fb1-a30f-4e37-9110-46af19750b77.png',
    name: 'd2966fb1-a30f-4e37-9110-46af19750b77.png',
    thumbnailUrl:
      'https://s3.amazonaws.com/uploads.demo.countries.basapp.com.ar/customer/d2966fb1-a30f-4e37-9110-46af19750b77-thumbnail.png',
  })
  image: Prisma.JsonValue;

  getMockFactory() {
    return MockFactory<FakeEventCategory>(FakeEventCategory);
  }
}
