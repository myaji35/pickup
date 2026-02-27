import { describe, it, expect } from 'vitest';
import { PhoneNumber } from '../../../../../src/roster/domain/value-objects/phone-number.vo';

describe('PhoneNumber Value Object', () => {
  describe('creation', () => {
    it('should create valid Korean phone numbers', () => {
      const validNumbers = [
        '010-1234-5678',
        '010-9999-0000',
        '011-123-4567',
        '016-1234-5678',
        '017-123-4567',
        '018-1234-5678',
        '019-123-4567',
      ];

      validNumbers.forEach((number) => {
        const phoneNumber = new PhoneNumber(number);
        expect(phoneNumber.value).toBe(number);
      });
    });

    it('should accept phone numbers without hyphens', () => {
      const phoneNumber = new PhoneNumber('01012345678');
      expect(phoneNumber.value).toBe('010-1234-5678');
    });

    it('should reject empty phone number', () => {
      expect(() => {
        new PhoneNumber('');
      }).toThrow('Phone number cannot be empty');
    });

    it('should reject invalid format', () => {
      const invalidNumbers = [
        '123-4567-8901',  // wrong prefix
        '020-1234-5678',  // invalid prefix (not 010-019)
        'abc-defg-hijk',  // not a number
        '010-12-345',     // too short
      ];

      invalidNumbers.forEach((number) => {
        expect(() => {
          new PhoneNumber(number);
        }).toThrow('Invalid Korean phone number format');
      });
    });

    it('should reject phone numbers that are too short', () => {
      expect(() => {
        new PhoneNumber('010-123-456');
      }).toThrow('Invalid Korean phone number format');
    });

    it('should reject phone numbers that are too long', () => {
      expect(() => {
        new PhoneNumber('010-12345-67890');
      }).toThrow('Invalid Korean phone number format');
    });

    it('should trim whitespace', () => {
      const phoneNumber = new PhoneNumber('  010-1234-5678  ');
      expect(phoneNumber.value).toBe('010-1234-5678');
    });
  });

  describe('equality', () => {
    it('should consider two phone numbers with same value as equal', () => {
      const phone1 = new PhoneNumber('010-1234-5678');
      const phone2 = new PhoneNumber('010-1234-5678');

      expect(phone1.equals(phone2)).toBe(true);
    });

    it('should consider two phone numbers with different values as not equal', () => {
      const phone1 = new PhoneNumber('010-1234-5678');
      const phone2 = new PhoneNumber('010-9999-8888');

      expect(phone1.equals(phone2)).toBe(false);
    });

    it('should normalize format before comparison', () => {
      const phone1 = new PhoneNumber('01012345678');
      const phone2 = new PhoneNumber('010-1234-5678');

      expect(phone1.equals(phone2)).toBe(true);
    });
  });

  describe('formatting', () => {
    it('should format raw number with hyphens', () => {
      const phoneNumber = new PhoneNumber('01012345678');
      expect(phoneNumber.value).toBe('010-1234-5678');
    });

    it('should preserve existing hyphens', () => {
      const phoneNumber = new PhoneNumber('010-1234-5678');
      expect(phoneNumber.value).toBe('010-1234-5678');
    });
  });
});
