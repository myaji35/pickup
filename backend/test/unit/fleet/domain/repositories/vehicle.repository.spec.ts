import { describe, it, expect, beforeEach, vi } from 'vitest';
import { IVehicleRepository } from '../../../../../src/fleet/domain/repositories/vehicle.repository.interface';
import { Vehicle } from '../../../../../src/fleet/domain/entities/vehicle.entity';
import { LicensePlateLastFour } from '../../../../../src/fleet/domain/value-objects/license-plate-last-four.vo';
import { PassengerCapacity } from '../../../../../src/fleet/domain/value-objects/passenger-capacity.vo';

/**
 * Mock VehicleRepository for testing interface contract
 */
class MockVehicleRepository implements IVehicleRepository {
  private vehicles: Vehicle[] = [];

  async create(vehicle: Vehicle): Promise<Vehicle> {
    this.vehicles.push(vehicle);
    return vehicle;
  }

  async findAll(institutionId: string): Promise<Vehicle[]> {
    return this.vehicles.filter((v) => v.institutionId === institutionId);
  }

  async findById(id: string): Promise<Vehicle | null> {
    return this.vehicles.find((v) => v.id === id) || null;
  }

  async findByLastFourDigits(
    institutionId: string,
    lastFourDigits: string,
  ): Promise<Vehicle | null> {
    return (
      this.vehicles.find(
        (v) =>
          v.institutionId === institutionId &&
          v.lastFourDigits.value === lastFourDigits,
      ) || null
    );
  }

  async update(vehicle: Vehicle): Promise<Vehicle> {
    const index = this.vehicles.findIndex((v) => v.id === vehicle.id);
    if (index !== -1) {
      this.vehicles[index] = vehicle;
    }
    return vehicle;
  }

  async delete(id: string): Promise<void> {
    this.vehicles = this.vehicles.filter((v) => v.id !== id);
  }
}

describe('IVehicleRepository Interface', () => {
  let repository: IVehicleRepository;
  const institutionId = 'institution-uuid-123';

  beforeEach(() => {
    repository = new MockVehicleRepository();
  });

  describe('create', () => {
    it('should create and return a vehicle', async () => {
      // Arrange
      const vehicle = new Vehicle({
        id: 'vehicle-uuid-1',
        lastFourDigits: new LicensePlateLastFour('1234'),
        passengerCapacity: new PassengerCapacity(10),
        institutionId,
        currentGroupId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      const result = await repository.create(vehicle);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe('vehicle-uuid-1');
    });
  });

  describe('findAll', () => {
    it('should return all vehicles for a specific institution', async () => {
      // Arrange
      const vehicle1 = new Vehicle({
        id: 'vehicle-uuid-1',
        lastFourDigits: new LicensePlateLastFour('1111'),
        passengerCapacity: new PassengerCapacity(10),
        institutionId,
        currentGroupId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const vehicle2 = new Vehicle({
        id: 'vehicle-uuid-2',
        lastFourDigits: new LicensePlateLastFour('2222'),
        passengerCapacity: new PassengerCapacity(12),
        institutionId,
        currentGroupId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await repository.create(vehicle1);
      await repository.create(vehicle2);

      // Act
      const vehicles = await repository.findAll(institutionId);

      // Assert
      expect(vehicles).toHaveLength(2);
      expect(vehicles[0].id).toBe('vehicle-uuid-1');
      expect(vehicles[1].id).toBe('vehicle-uuid-2');
    });

    it('should return empty array when no vehicles exist for institution', async () => {
      // Act
      const vehicles = await repository.findAll('nonexistent-institution');

      // Assert
      expect(vehicles).toHaveLength(0);
    });
  });

  describe('findById', () => {
    it('should return vehicle by id', async () => {
      // Arrange
      const vehicle = new Vehicle({
        id: 'vehicle-uuid-123',
        lastFourDigits: new LicensePlateLastFour('5678'),
        passengerCapacity: new PassengerCapacity(8),
        institutionId,
        currentGroupId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await repository.create(vehicle);

      // Act
      const found = await repository.findById('vehicle-uuid-123');

      // Assert
      expect(found).toBeDefined();
      expect(found?.id).toBe('vehicle-uuid-123');
    });

    it('should return null when vehicle not found', async () => {
      // Act
      const found = await repository.findById('nonexistent-uuid');

      // Assert
      expect(found).toBeNull();
    });
  });

  describe('findByLastFourDigits', () => {
    it('should return vehicle by lastFourDigits within institution', async () => {
      // Arrange
      const vehicle = new Vehicle({
        id: 'vehicle-uuid-456',
        lastFourDigits: new LicensePlateLastFour('9999'),
        passengerCapacity: new PassengerCapacity(15),
        institutionId,
        currentGroupId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await repository.create(vehicle);

      // Act
      const found = await repository.findByLastFourDigits(institutionId, '9999');

      // Assert
      expect(found).toBeDefined();
      expect(found?.lastFourDigits.value).toBe('9999');
    });

    it('should return null when lastFourDigits not found in institution', async () => {
      // Act
      const found = await repository.findByLastFourDigits(institutionId, '0000');

      // Assert
      expect(found).toBeNull();
    });
  });

  describe('update', () => {
    it('should update and return vehicle', async () => {
      // Arrange
      const vehicle = new Vehicle({
        id: 'vehicle-uuid-789',
        lastFourDigits: new LicensePlateLastFour('7777'),
        passengerCapacity: new PassengerCapacity(10),
        institutionId,
        currentGroupId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await repository.create(vehicle);

      // Act
      vehicle.assignToGroup('group-uuid-123');
      const updated = await repository.update(vehicle);

      // Assert
      expect(updated.currentGroupId).toBe('group-uuid-123');
    });
  });

  describe('delete', () => {
    it('should delete vehicle by id', async () => {
      // Arrange
      const vehicle = new Vehicle({
        id: 'vehicle-to-delete',
        lastFourDigits: new LicensePlateLastFour('8888'),
        passengerCapacity: new PassengerCapacity(12),
        institutionId,
        currentGroupId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await repository.create(vehicle);

      // Act
      await repository.delete('vehicle-to-delete');
      const found = await repository.findById('vehicle-to-delete');

      // Assert
      expect(found).toBeNull();
    });
  });
});
