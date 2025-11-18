import { describe, it, expect } from 'vitest';
import { PassengerSchedule } from '../../../../../src/roster/domain/entities/passenger-schedule.entity';

/**
 * T328: PassengerSchedule Entity Unit Tests
 *
 * 목적: PassengerSchedule 엔티티 생성 및 비즈니스 규칙 검증
 */
describe('PassengerSchedule Entity', () => {
  describe('constructor', () => {
    it('should create a PassengerSchedule with valid data', () => {
      // Given
      const data = {
        id: 'schedule-1',
        passengerId: 'passenger-1',
        pickupTime: '08:00',
        dropoffTime: '17:00',
        careTimeHours: 9,
        isCareTimeInsufficient: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // When
      const schedule = new PassengerSchedule(data);

      // Then
      expect(schedule.id).toBe('schedule-1');
      expect(schedule.passengerId).toBe('passenger-1');
      expect(schedule.pickupTime).toBe('08:00');
      expect(schedule.dropoffTime).toBe('17:00');
      expect(schedule.careTimeHours).toBe(9);
      expect(schedule.isCareTimeInsufficient).toBe(false);
    });

    it('should create a PassengerSchedule with insufficient care time', () => {
      // Given
      const data = {
        id: 'schedule-2',
        passengerId: 'passenger-2',
        pickupTime: '08:00',
        dropoffTime: '15:00',
        careTimeHours: 7,
        isCareTimeInsufficient: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // When
      const schedule = new PassengerSchedule(data);

      // Then
      expect(schedule.careTimeHours).toBe(7);
      expect(schedule.isCareTimeInsufficient).toBe(true);
    });
  });

  describe('updateTimes', () => {
    it('should update pickup and dropoff times', () => {
      // Given
      const schedule = new PassengerSchedule({
        id: 'schedule-1',
        passengerId: 'passenger-1',
        pickupTime: '08:00',
        dropoffTime: '17:00',
        careTimeHours: 9,
        isCareTimeInsufficient: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // When
      schedule.updateTimes('09:00', '18:00', 9, false);

      // Then
      expect(schedule.pickupTime).toBe('09:00');
      expect(schedule.dropoffTime).toBe('18:00');
      expect(schedule.careTimeHours).toBe(9);
      expect(schedule.isCareTimeInsufficient).toBe(false);
    });

    it('should update care time and insufficient flag', () => {
      // Given
      const schedule = new PassengerSchedule({
        id: 'schedule-1',
        passengerId: 'passenger-1',
        pickupTime: '08:00',
        dropoffTime: '17:00',
        careTimeHours: 9,
        isCareTimeInsufficient: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // When
      schedule.updateTimes('10:00', '16:00', 6, true);

      // Then
      expect(schedule.pickupTime).toBe('10:00');
      expect(schedule.dropoffTime).toBe('16:00');
      expect(schedule.careTimeHours).toBe(6);
      expect(schedule.isCareTimeInsufficient).toBe(true);
    });
  });

  describe('business rules', () => {
    it('should validate HH:MM format for pickup time', () => {
      // Given & When & Then
      expect(() => {
        new PassengerSchedule({
          id: 'schedule-1',
          passengerId: 'passenger-1',
          pickupTime: '25:00', // Invalid hour
          dropoffTime: '17:00',
          careTimeHours: 9,
          isCareTimeInsufficient: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }).toThrow('Invalid time format');
    });

    it('should validate HH:MM format for dropoff time', () => {
      // Given & When & Then
      expect(() => {
        new PassengerSchedule({
          id: 'schedule-1',
          passengerId: 'passenger-1',
          pickupTime: '08:00',
          dropoffTime: '17:70', // Invalid minute
          careTimeHours: 9,
          isCareTimeInsufficient: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }).toThrow('Invalid time format');
    });

    it('should ensure pickup time is before dropoff time', () => {
      // Given & When & Then
      expect(() => {
        new PassengerSchedule({
          id: 'schedule-1',
          passengerId: 'passenger-1',
          pickupTime: '17:00',
          dropoffTime: '08:00', // Before pickup
          careTimeHours: 9,
          isCareTimeInsufficient: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }).toThrow('Pickup time must be before dropoff time');
    });

    it('should validate careTimeHours is non-negative', () => {
      // Given & When & Then
      expect(() => {
        new PassengerSchedule({
          id: 'schedule-1',
          passengerId: 'passenger-1',
          pickupTime: '08:00',
          dropoffTime: '17:00',
          careTimeHours: -1, // Negative hours
          isCareTimeInsufficient: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }).toThrow('Care time hours must be non-negative');
    });
  });
});
