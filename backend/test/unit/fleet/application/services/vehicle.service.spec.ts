import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VehicleService } from '../../../../../src/fleet/application/services/vehicle.service';
import { IVehicleRepository } from '../../../../../src/fleet/domain/repositories/vehicle.repository.interface';
import { Vehicle } from '../../../../../src/fleet/domain/entities/vehicle.entity';
import { LicensePlateLastFour } from '../../../../../src/fleet/domain/value-objects/license-plate-last-four.vo';
import { PassengerCapacity } from '../../../../../src/fleet/domain/value-objects/passenger-capacity.vo';
import { CreateVehicleCommand } from '../../../../../src/fleet/application/commands/create-vehicle.command';
import { UpdateVehicleCommand } from '../../../../../src/fleet/application/commands/update-vehicle.command';

describe('VehicleService', () => {
  let service: VehicleService;
  let mockRepository: IVehicleRepository;

  beforeEach(() => {
    mockRepository = {
      create: vi.fn(),
      findAll: vi.fn(),
      findById: vi.fn(),
      findByLastFourDigits: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    service = new VehicleService(mockRepository);
  });

  describe('createVehicle', () => {
    it('should create a new vehicle', async () => {
      // Arrange
      const command: CreateVehicleCommand = {
        lastFourDigits: '1234',
        passengerCapacity: 10,
        institutionId: 'institution-uuid-123',
      };

      const expectedVehicle = new Vehicle({
        id: 'new-vehicle-uuid',
        lastFourDigits: new LicensePlateLastFour('1234'),
        passengerCapacity: new PassengerCapacity(10),
        institutionId: 'institution-uuid-123',
        currentGroupId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(mockRepository.findByLastFourDigits).mockResolvedValue(null);
      vi.mocked(mockRepository.create).mockResolvedValue(expectedVehicle);

      // Act
      const result = await service.createVehicle(command);

      // Assert
      expect(result).toBeDefined();
      expect(result.lastFourDigits.value).toBe('1234');
      expect(result.passengerCapacity.value).toBe(10);
      expect(mockRepository.create).toHaveBeenCalledOnce();
    });

    it('should throw error if lastFourDigits already exists in institution', async () => {
      // Arrange
      const command: CreateVehicleCommand = {
        lastFourDigits: '1234',
        passengerCapacity: 10,
        institutionId: 'institution-uuid-123',
      };

      const existingVehicle = new Vehicle({
        id: 'existing-uuid',
        lastFourDigits: new LicensePlateLastFour('1234'),
        passengerCapacity: new PassengerCapacity(12),
        institutionId: 'institution-uuid-123',
        currentGroupId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(mockRepository.findByLastFourDigits).mockResolvedValue(
        existingVehicle,
      );

      // Act & Assert
      await expect(service.createVehicle(command)).rejects.toThrow(
        '해당 기관에 이미 동일한 차량번호 뒤 4자리가 존재합니다',
      );
    });
  });

  describe('getVehicles', () => {
    it('should return all vehicles for institution', async () => {
      // Arrange
      const institutionId = 'institution-uuid-123';
      const vehicles = [
        new Vehicle({
          id: 'vehicle-1',
          lastFourDigits: new LicensePlateLastFour('1111'),
          passengerCapacity: new PassengerCapacity(10),
          institutionId,
          currentGroupId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        new Vehicle({
          id: 'vehicle-2',
          lastFourDigits: new LicensePlateLastFour('2222'),
          passengerCapacity: new PassengerCapacity(12),
          institutionId,
          currentGroupId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ];

      vi.mocked(mockRepository.findAll).mockResolvedValue(vehicles);

      // Act
      const result = await service.getVehicles(institutionId);

      // Assert
      expect(result).toHaveLength(2);
      expect(mockRepository.findAll).toHaveBeenCalledWith(institutionId);
    });
  });

  describe('getVehicleById', () => {
    it('should return vehicle by id', async () => {
      // Arrange
      const vehicleId = 'vehicle-uuid-123';
      const vehicle = new Vehicle({
        id: vehicleId,
        lastFourDigits: new LicensePlateLastFour('5678'),
        passengerCapacity: new PassengerCapacity(8),
        institutionId: 'institution-uuid-123',
        currentGroupId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(vehicle);

      // Act
      const result = await service.getVehicleById(vehicleId);

      // Assert
      expect(result).toBeDefined();
      expect(result?.id).toBe(vehicleId);
      expect(mockRepository.findById).toHaveBeenCalledWith(vehicleId);
    });

    it('should throw error if vehicle not found', async () => {
      // Arrange
      vi.mocked(mockRepository.findById).mockResolvedValue(null);

      // Act & Assert
      await expect(service.getVehicleById('nonexistent-id')).rejects.toThrow(
        '차량을 찾을 수 없습니다',
      );
    });
  });

  describe('updateVehicle', () => {
    it('should update vehicle capacity', async () => {
      // Arrange
      const vehicleId = 'vehicle-uuid-789';
      const command: UpdateVehicleCommand = {
        id: vehicleId,
        passengerCapacity: 15,
      };

      const existingVehicle = new Vehicle({
        id: vehicleId,
        lastFourDigits: new LicensePlateLastFour('7777'),
        passengerCapacity: new PassengerCapacity(10),
        institutionId: 'institution-uuid-123',
        currentGroupId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(existingVehicle);
      vi.mocked(mockRepository.update).mockResolvedValue({
        ...existingVehicle,
        passengerCapacity: new PassengerCapacity(15),
      });

      // Act
      const result = await service.updateVehicle(command);

      // Assert
      expect(result.passengerCapacity.value).toBe(15);
      expect(mockRepository.update).toHaveBeenCalledOnce();
    });

    it('should update currentGroupId', async () => {
      // Arrange
      const vehicleId = 'vehicle-uuid-999';
      const command: UpdateVehicleCommand = {
        id: vehicleId,
        currentGroupId: 'new-group-uuid',
      };

      const existingVehicle = new Vehicle({
        id: vehicleId,
        lastFourDigits: new LicensePlateLastFour('9999'),
        passengerCapacity: new PassengerCapacity(12),
        institutionId: 'institution-uuid-123',
        currentGroupId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(existingVehicle);
      vi.mocked(mockRepository.update).mockResolvedValue({
        ...existingVehicle,
        currentGroupId: 'new-group-uuid',
      });

      // Act
      const result = await service.updateVehicle(command);

      // Assert
      expect(result.currentGroupId).toBe('new-group-uuid');
    });
  });

  describe('deleteVehicle', () => {
    it('should delete vehicle', async () => {
      // Arrange
      const vehicleId = 'vehicle-to-delete';
      const vehicle = new Vehicle({
        id: vehicleId,
        lastFourDigits: new LicensePlateLastFour('8888'),
        passengerCapacity: new PassengerCapacity(10),
        institutionId: 'institution-uuid-123',
        currentGroupId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(vehicle);
      vi.mocked(mockRepository.delete).mockResolvedValue(undefined);

      // Act
      await service.deleteVehicle(vehicleId);

      // Assert
      expect(mockRepository.delete).toHaveBeenCalledWith(vehicleId);
    });

    it('should throw error if vehicle not found', async () => {
      // Arrange
      vi.mocked(mockRepository.findById).mockResolvedValue(null);

      // Act & Assert
      await expect(service.deleteVehicle('nonexistent-id')).rejects.toThrow(
        '차량을 찾을 수 없습니다',
      );
    });
  });
});
