export const errorCodes = {
  ALERT_NOT_FOUND: 'ALERT_NOT_FOUND',
  ALERT_STATE_NOT_FOUND: 'ALERT_STATE_NOT_FOUND',
  ALERT_TYPE_NOT_FOUND: 'ALERT_TYPE_NOT_FOUND',
  CUSTOMER_NOT_FOUND: 'CUSTOMER_NOT_FOUND',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  AUTHORIZATION_REQUIRED: 'AUTHORIZATION_REQUIRED',
  CUSTOMERS_NOT_FOUND: 'CUSTOMERS_NOT_FOUND',
  CUSTOMER_NOT_ALLOWED: 'CUSTOMER_NOT_ALLOWED',
  CUSTOMER_NOT_INCLUDED_PARAMS: 'CUSTOMER_NOT_INCLUDED_PARAMS',
};

export const propertyNameAlert = {
  'perimeter-violation': 'perimeterViolationNumbers',
  'alarm-activated': 'alarmActivatedNumbers',
  fire: 'fireNumbers',
  'health-emergency': 'healthEmergencyNumbers',
  'gender-violence': 'genderViolenceNumbers',
  'bad-company': 'badCompanyNumbers',
  robbery: 'robberyNumbers',
};

export const deviceTypes = {
  'Acoplado%20Amarillo': 'default',
  'Acoplado%20Azul': 'default',
  'Acoplado%20Celeste': 'default',
  'Acoplado%20Rojo': 'default',
  'Acoplado%20Verde': 'default',
  Ambulancia: 'van',
  Auto: 'car',
  'Auto%20Amarillo': 'car',
  'Auto%20Azul': 'car',
  'Auto%20Naranja': 'car',
  'Auto%20Rojo': 'car',
  'Auto%20Verde': 'car',
  AutoBomba: 'van',
  'Cajero%20Automático': 'default',
  Camión: 'truck',
  'Camión%20Amarillo': 'truck',
  'Camión%20Azul': 'truck',
  'Camión%20Celeste': 'truck',
  'Camion de bomberos': 'van',
  'Camión%20Rojo': 'truck',
  'Camión%20Verde': 'truck',
  'Camioneta%20Amarilla': 'pickup',
  'Camioneta%20Azul': 'pickup',
  'Camioneta%20Naranja': 'pickup',
  'Camioneta%20Roja': 'pickup',
  'Camioneta%20Verde': 'pickup',
  Colectivo: 'bus',
  Cuatriclo: 'default',
  Esquiador: 'default',
  Flecha: 'default',
  Fumigadora: 'default',
  'Furgón%20Térmico': 'default',
  Lancha: 'ship',
  Micro: 'bus',
  'Moto%20Amarilla': 'motorcycle',
  'Moto%20Azul': 'motorcycle',
  'Moto%20Gris': 'motorcycle',
  'Moto%20Roja': 'motorcycle',
  'Moto%20Verde': 'motorcycle',
  'OBD-II': 'default',
  Patrullero: 'car',
  Persona: 'person',
  Taxi: 'car',
  Teléfono: 'default',
  Tractor: 'tractor',
  'Tractor%20azul': 'tractor',
  Utilitario: 'offroad',
};

export const typeAddressComponents = {
  CITY: 'locality',
  DISTRICT: 'administrative_area_level_2',
  STATE: 'administrative_area_level_1',
  COUNTRY: 'country',
};

export const trackingTypes = ['kidnapping', 'bad-company'];

export const pattern = /^[A-Za-z0-9\.,-]+$/;

export const maxDistance = 0.3;
