import { describe, it, expect, beforeEach } from 'vitest';
import { Passenger } from '../../../../../src/roster/domain/entities/passenger.entity';
import { PhoneNumber } from '../../../../../src/roster/domain/value-objects/phone-number.vo';
import { Address } from '../../../../../src/roster/domain/value-objects/address.vo';

describe('Passenger Entity', () => {
  describe('creation', () => {
    it('should create a valid passenger', () => {
      const phone = new PhoneNumber('010-1234-5678');
      const pickupAddress = new Address('서울시 강남구 테헤란로 123');
      const dropoffAddress = new Address('서울시 서초구 서초대로 456');

      const passenger = new Passenger(
        '1',
        'inst-1',
        '홍길동',
        phone,
        pickupAddress,
        dropoffAddress,
        'MORNING',
        null,
        new Date(),
        new Date(),
      );

      expect(passenger.id).toBe('1');
      expect(passenger.institutionId).toBe('inst-1');
      expect(passenger.name).toBe('홍길동');
      expect(passenger.phoneNumber.value).toBe('010-1234-5678');
      expect(passenger.pickupAddress.value).toBe('서울시 강남구 테헤란로 123');
      expect(passenger.dropoffAddress.value).toBe('서울시 서초구 서초대로 456');
      expect(passenger.shuttleType).toBe('MORNING');
    });

    it('should accept valid shuttle types', () => {
      const phone = new PhoneNumber('010-1234-5678');
      const pickupAddress = new Address('서울시 강남구 테헤란로 123');
      const dropoffAddress = new Address('서울시 서초구 서초대로 456');

      const validTypes = ['MORNING', 'EVENING', 'TEMPORARY'];

      validTypes.forEach((type) => {
        const passenger = new Passenger(
          '1',
          'inst-1',
          '홍길동',
          phone,
          pickupAddress,
          dropoffAddress,
          type as any,
          null,
          new Date(),
          new Date(),
        );

        expect(passenger.shuttleType).toBe(type);
      });
    });

    it('should reject empty name', () => {
      const phone = new PhoneNumber('010-1234-5678');
      const pickupAddress = new Address('서울시 강남구 테헤란로 123');
      const dropoffAddress = new Address('서울시 서초구 서초대로 456');

      expect(() => {
        new Passenger(
          '1',
          'inst-1',
          '',
          phone,
          pickupAddress,
          dropoffAddress,
          'MORNING',
          null,
          new Date(),
          new Date(),
        );
      }).toThrow('Passenger name cannot be empty');
    });

    it('should reject same pickup and dropoff address', () => {
      const phone = new PhoneNumber('010-1234-5678');
      const sameAddress = new Address('서울시 강남구 테헤란로 123');

      expect(() => {
        new Passenger(
          '1',
          'inst-1',
          '홍길동',
          phone,
          sameAddress,
          sameAddress,
          'MORNING',
          null,
          new Date(),
          new Date(),
        );
      }).toThrow('Pickup and dropoff addresses must be different');
    });
  });

  describe('business logic', () => {
    let passenger: Passenger;

    beforeEach(() => {
      const phone = new PhoneNumber('010-1234-5678');
      const pickupAddress = new Address('서울시 강남구 테헤란로 123');
      const dropoffAddress = new Address('서울시 서초구 서초대로 456');

      passenger = new Passenger(
        '1',
        'inst-1',
        '홍길동',
        phone,
        pickupAddress,
        dropoffAddress,
        'MORNING',
        null,
        new Date(),
        new Date(),
      );
    });

    it('should update passenger name', () => {
      passenger.updateName('김철수');
      expect(passenger.name).toBe('김철수');
    });

    it('should reject empty name when updating', () => {
      expect(() => {
        passenger.updateName('');
      }).toThrow('Passenger name cannot be empty');
    });

    it('should update phone number', () => {
      const newPhone = new PhoneNumber('010-9999-8888');
      passenger.updatePhoneNumber(newPhone);
      expect(passenger.phoneNumber.value).toBe('010-9999-8888');
    });

    it('should assign to group', () => {
      passenger.assignToGroup('group-123');
      expect(passenger.groupId).toBe('group-123');
    });

    it('should remove from group', () => {
      passenger.assignToGroup('group-123');
      passenger.removeFromGroup();
      expect(passenger.groupId).toBeNull();
    });

    it('should check if passenger is assigned to group', () => {
      expect(passenger.isAssignedToGroup()).toBe(false);

      passenger.assignToGroup('group-123');
      expect(passenger.isAssignedToGroup()).toBe(true);
    });
  });
});
