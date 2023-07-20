import { CustomerType } from '@prisma/client';
import { CreateCustomerDto } from '../dto/create-customer.dto';

const customerInput: CreateCustomerDto = {
  type: CustomerType.business,
  alertTypes: ['34d5d8f2-f8f4-4f0f-b8c8-f8f8f8f8f8f8'],
  eventCategories: ['e7808f72-b682-4992-b449-e9adcb5d286f'],
  name: 'Test Country',
  active: true,
  district: 'San Fernando',
  state: 'Buenos Aires',
  country: 'Argentina',
  secretKey: '1234567',
  trialPeriod: false,
  countryCode: '54',
  phoneLength: 10,
  url: 'test-country',
  speed: '20',
  notes: 'Respete las señales de transito y estacionamiento. Evite multas',
  timezone: '-180',
  parent: null,
  image: {
    name: '4053ee9a-401c-4cb0-8f0a-4a9ef4811e21.png',
    url: 'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/customers/image/4053ee9a-401c-4cb0-8f0a-4a9ef4811e21.png',
    thumbnailUrl:
      'https://s3.amazonaws.com/uploads.countries.basapp.com.ar/customers/image/4053ee9a-401c-4cb0-8f0a-4a9ef4811e21-thumbnail.png',
  },
};

export default customerInput;
