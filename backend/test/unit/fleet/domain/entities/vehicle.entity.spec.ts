import { describe, it, expect } from 'vitest';
import { Vehicle } from '../../../../../src/fleet/domain/entities/vehicle.entity';
import { LicensePlateLastFour } from '../../../../../src/fleet/domain/value-objects/license-plate-last-four.vo';
import { PassengerCapacity } from '../../../../../src/fleet/domain/value-objects/passenger-capacity.vo';

describe('Vehicle Entity', () => {
  describe('creation', () => {
    it('should create a valid vehicle with all required fields', () => {
      // Arrange
      const lastFourDigits = new LicensePlateLastFour('1234');
      const passengerCapacity = new PassengerCapacity(10);
      const institutionId = 'institution-uuid-123';

      // Act
      const vehicle = new Vehicle({
        id: 'vehicle-uuid-456',
        lastFourDigits,
        passengerCapacity,
        institutionId,
        currentGroupId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Assert
      expect(vehicle).toBeDefined();
      expect(vehicle.id).toBe('vehicle-uuid-456');
      expect(vehicle.lastFourDigits.value).toBe('1234');
      expect(vehicle.passengerCapacity.value).toBe(10);
      expect(vehicle.institutionId).toBe('institution-uuid-123');
      expect(vehicle.currentGroupId).toBeNull();
    });

    it('should create a vehicle with currentGroupId', () => {
      // Arrange
      const lastFourDigits = new LicensePlateLastFour('5678');
      const passengerCapacity = new PassengerCapacity(15);
      const institutionId = 'institution-uuid-123';
      const currentGroupId = 'group-uuid-789';

      // Act
      const vehicle = new Vehicle({
        id: 'vehicle-uuid-999',
        lastFourDigits,
        passengerCapacity,
        institutionId,
        currentGroupId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Assert
      expect(vehicle.currentGroupId).toBe('group-uuid-789');
    });
  });

  describe('assignToGroup', () => {
    it('should assign vehicle to a passenger group', () => {
      // Arrange
      const vehicle = new Vehicle({
        id: 'vehicle-uuid-1',
        lastFourDigits: new LicensePlateLastFour('1111'),
        passengerCapacity: new PassengerCapacity(12),
        institutionId: 'institution-uuid-1',
        currentGroupId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      vehicle.assignToGroup('new-group-uuid');

      // Assert
      expect(vehicle.currentGroupId).toBe('new-group-uuid');
    });

    it('should reassign vehicle to a different group', () => {
      // Arrange
      const vehicle = new Vehicle({
        id: 'vehicle-uuid-2',
        lastFourDigits: new LicensePlateLastFour('2222'),
        passengerCapacity: new PassengerCapacity(8),
        institutionId: 'institution-uuid-1',
        currentGroupId: 'old-group-uuid',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      vehicle.assignToGroup('new-group-uuid');

      // Assert
      expect(vehicle.currentGroupId).toBe('new-group-uuid');
    });
  });

  describe('unassignFromGroup', () => {
    it('should unassign vehicle from current group', () => {
      // Arrange
      const vehicle = new Vehicle({
        id: 'vehicle-uuid-3',
        lastFourDigits: new LicensePlateLastFour('3333'),
        passengerCapacity: new PassengerCapacity(7),
        institutionId: 'institution-uuid-1',
        currentGroupId: 'group-uuid-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      vehicle.unassignFromGroup();

      // Assert
      expect(vehicle.currentGroupId).toBeNull();
    });
  });

  describe('updateCapacity', () => {
    it('should update passenger capacity', () => {
      // Arrange
      const vehicle = new Vehicle({
        id: 'vehicle-uuid-4',
        lastFourDigits: new LicensePlateLastFour('4444'),
        passengerCapacity: new PassengerCapacity(10),
        institutionId: 'institution-uuid-1',
        currentGroupId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      const newCapacity = new PassengerCapacity(12);
      vehicle.updateCapacity(newCapacity);

      // Assert
      expect(vehicle.passengerCapacity.value).toBe(12);
    });
  });
});
