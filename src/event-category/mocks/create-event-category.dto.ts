import { CreateEventCategoryDto } from '../dto/create-event-categor.dto';

const EventCategoryInput: CreateEventCategoryDto = {
  title: 'un evento',
  active: true,
  image: {
    url: 'https://s3.amazonaws.com/uploads.demo.countries.basapp.com.ar/customer/d2966fb1-a30f-4e37-9110-46af19750b77.png',
    name: 'd2966fb1-a30f-4e37-9110-46af19750b77.png',
    thumbnailUrl:
      'https://s3.amazonaws.com/uploads.demo.countries.basapp.com.ar/customer/d2966fb1-a30f-4e37-9110-46af19750b77-thumbnail.png',
  },
};

export default EventCategoryInput;
