import { describe, it, expect } from 'vitest';
import { Address } from '../../../../../src/roster/domain/value-objects/address.vo';

describe('Address Value Object', () => {
  describe('creation', () => {
    it('should create valid address', () => {
      const validAddresses = [
        '서울시 강남구 테헤란로 123',
        '경기도 성남시 분당구 판교역로 166',
        '부산시 해운대구 우동 1234',
      ];

      validAddresses.forEach((addr) => {
        const address = new Address(addr);
        expect(address.value).toBe(addr);
      });
    });

    it('should reject empty address', () => {
      expect(() => {
        new Address('');
      }).toThrow('Address cannot be empty');
    });

    it('should reject address with only whitespace', () => {
      expect(() => {
        new Address('   ');
      }).toThrow('Address cannot be empty');
    });

    it('should reject address longer than 200 characters', () => {
      const longAddress = 'A'.repeat(201);
      expect(() => {
        new Address(longAddress);
      }).toThrow('Address must be 200 characters or less');
    });

    it('should trim whitespace', () => {
      const address = new Address('  서울시 강남구 테헤란로 123  ');
      expect(address.value).toBe('서울시 강남구 테헤란로 123');
    });

    it('should accept addresses with special characters', () => {
      const addressWithSpecialChars = '서울시 강남구 테헤란로 123 (삼성동)';
      const address = new Address(addressWithSpecialChars);
      expect(address.value).toBe(addressWithSpecialChars);
    });
  });

  describe('equality', () => {
    it('should consider two addresses with same value as equal', () => {
      const addr1 = new Address('서울시 강남구 테헤란로 123');
      const addr2 = new Address('서울시 강남구 테헤란로 123');

      expect(addr1.equals(addr2)).toBe(true);
    });

    it('should consider two addresses with different values as not equal', () => {
      const addr1 = new Address('서울시 강남구 테헤란로 123');
      const addr2 = new Address('서울시 서초구 서초대로 456');

      expect(addr1.equals(addr2)).toBe(false);
    });

    it('should be case-sensitive', () => {
      const addr1 = new Address('서울시 강남구 테헤란로 123');
      const addr2 = new Address('서울시 강남구 테헤란로 123');

      expect(addr1.equals(addr2)).toBe(true);
    });
  });
});
