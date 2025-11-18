import { describe, it, expect } from 'vitest';
import { CareTimeCalculator } from '../../../../../src/roster/domain/services/care-time-calculator.domain-service';

/**
 * T327: CareTimeCalculator Domain Service Unit Tests
 *
 * 목적: 탑승/하차 시간으로부터 케어 시간을 계산하고 8시간 검증
 */
describe('CareTimeCalculator', () => {
  const calculator = new CareTimeCalculator();

  describe('calculateCareTimeHours', () => {
    it('should calculate 9 hours for 08:00 to 17:00', () => {
      // Given
      const pickupTime = '08:00';
      const dropoffTime = '17:00';

      // When
      const hours = calculator.calculateCareTimeHours(pickupTime, dropoffTime);

      // Then
      expect(hours).toBe(9);
    });

    it('should calculate 7 hours for 08:00 to 15:00', () => {
      // Given
      const pickupTime = '08:00';
      const dropoffTime = '15:00';

      // When
      const hours = calculator.calculateCareTimeHours(pickupTime, dropoffTime);

      // Then
      expect(hours).toBe(7);
    });

    it('should calculate 8 hours for 09:00 to 17:00', () => {
      // Given
      const pickupTime = '09:00';
      const dropoffTime = '17:00';

      // When
      const hours = calculator.calculateCareTimeHours(pickupTime, dropoffTime);

      // Then
      expect(hours).toBe(8);
    });

    it('should calculate 0.5 hours for 30 minute duration', () => {
      // Given
      const pickupTime = '08:00';
      const dropoffTime = '08:30';

      // When
      const hours = calculator.calculateCareTimeHours(pickupTime, dropoffTime);

      // Then
      expect(hours).toBe(0.5);
    });

    it('should throw error if pickup time is after dropoff time', () => {
      // Given
      const pickupTime = '17:00';
      const dropoffTime = '08:00';

      // When & Then
      expect(() => {
        calculator.calculateCareTimeHours(pickupTime, dropoffTime);
      }).toThrow('Pickup time must be before dropoff time');
    });

    it('should throw error for invalid HH:MM format (pickup)', () => {
      // Given
      const pickupTime = '25:00'; // Invalid hour
      const dropoffTime = '17:00';

      // When & Then
      expect(() => {
        calculator.calculateCareTimeHours(pickupTime, dropoffTime);
      }).toThrow('Invalid time format');
    });

    it('should throw error for invalid HH:MM format (dropoff)', () => {
      // Given
      const pickupTime = '08:00';
      const dropoffTime = '17:70'; // Invalid minute

      // When & Then
      expect(() => {
        calculator.calculateCareTimeHours(pickupTime, dropoffTime);
      }).toThrow('Invalid time format');
    });
  });

  describe('isCareTimeSufficient', () => {
    it('should return true for 8 hours (exactly 8)', () => {
      // Given
      const careTimeHours = 8;

      // When
      const isSufficient = calculator.isCareTimeSufficient(careTimeHours);

      // Then
      expect(isSufficient).toBe(true);
    });

    it('should return true for 9 hours (more than 8)', () => {
      // Given
      const careTimeHours = 9;

      // When
      const isSufficient = calculator.isCareTimeSufficient(careTimeHours);

      // Then
      expect(isSufficient).toBe(true);
    });

    it('should return false for 7 hours (less than 8)', () => {
      // Given
      const careTimeHours = 7;

      // When
      const isSufficient = calculator.isCareTimeSufficient(careTimeHours);

      // Then
      expect(isSufficient).toBe(false);
    });

    it('should return false for 7.5 hours', () => {
      // Given
      const careTimeHours = 7.5;

      // When
      const isSufficient = calculator.isCareTimeSufficient(careTimeHours);

      // Then
      expect(isSufficient).toBe(false);
    });

    it('should return true for 8.5 hours', () => {
      // Given
      const careTimeHours = 8.5;

      // When
      const isSufficient = calculator.isCareTimeSufficient(careTimeHours);

      // Then
      expect(isSufficient).toBe(true);
    });
  });
});
