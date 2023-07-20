import '../__test__/winston';
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { IUserWithCustomer } from '@src/interfaces/types';
import { mockDeep } from 'jest-mock-extended';
import { compareObjects, getMailLinksFromUser } from '.';

describe('Utils', () => {
  describe('getMailLinksFromUser', () => {
    it('should return valid mail links for a user without a customer', () => {
      const user = mockDeep<IUserWithCustomer>();
      user.customer = null;

      const result = getMailLinksFromUser(user);

      expect(result).toEqual({
        iosLink: 'https://apps.apple.com/us/app/basapp/id1234725969',
        androidLink:
          'https://play.google.com/store/apps/details?id=com.basapp.app&hl=es_419',
      });
    });

    it('should return valid mail links for a user with a government customer', () => {
      const user = mockDeep<IUserWithCustomer>();
      // @ts-ignore
      user.customer = {
        type: 'government',
      };

      const result = getMailLinksFromUser(user);

      expect(result).toEqual({
        iosLink: 'https://apps.apple.com/us/app/basapp/id1234725969',
        androidLink:
          'https://play.google.com/store/apps/details?id=com.basapp.app&hl=es_419',
      });
    });

    it('should return valid mail links for a user with a business customer', () => {
      const user = mockDeep<IUserWithCustomer>();
      // @ts-ignore
      user.customer = {
        type: 'business',
      };

      const result = getMailLinksFromUser(user);

      expect(result).toEqual({
        iosLink: 'https://apps.apple.com/us/app/basapp-cyb/id1184620134',
        androidLink:
          'https://play.google.com/store/apps/details?id=com.basapp.countries.app&hl=es_419',
      });
    });
  });

  describe('compareOject', () => {
    it('when active goes to true', () => {
      const oldObject = {
        active: false,
      };

      const newObject = {
        active: true,
      };
      const result = compareObjects(oldObject, newObject, 'active');

      expect(result).toBe(true);
    });

    it('when active goes to false', () => {
      const oldObject = {
        active: true,
      };

      const newObject = {
        active: false,
      };
      const result = compareObjects(oldObject, newObject, 'active');

      expect(result).toBe(true);
    });

    it('when active goes to false being null', () => {
      const oldObject = {};

      const newObject = {
        active: false,
      };
      const result = compareObjects(oldObject, newObject, 'active');

      expect(result).toBe(true);
    });
  });
});
