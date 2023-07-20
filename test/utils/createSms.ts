import { pattern } from '@src/alerts/alerts.constants';
import config from '../../src/config/configuration';
import twist from '../../src/utils/sms-crypt';

type Hash = {
  accessToken: string;
  type: string;
  geolocation?: {
    battery: {
      level: number;
    };
    coords: {
      accuracy: number;
      latitude: number;
      longitude: number;
    };
  };
};
export function createSms(hash: Hash) {
  const { sms } = config();
  const tim = new Date();

  let message = hash.accessToken + ',';
  message += hash.type + ',';
  message += tim.getTime() + ',';
  message += hash.geolocation?.coords.latitude + ',';
  message += hash.geolocation?.coords.longitude + ',';
  message += hash.geolocation?.battery.level + ',';
  message += hash.geolocation?.coords.accuracy;

  const messageEncrypted = twist.encrypt(pattern, message, sms.cryptKey, false);
  return `${sms.smsMasivos.keyword}${messageEncrypted}`;
}
