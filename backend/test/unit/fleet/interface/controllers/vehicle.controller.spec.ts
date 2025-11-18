import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VehicleController } from '../../../../../src/fleet/interface/controllers/vehicle.controller';
import { VehicleService } from '../../../../../src/fleet/application/services/vehicle.service';
import { Vehicle } from '../../../../../src/fleet/domain/entities/vehicle.entity';
import { LicensePlateLastFour } from '../../../../../src/fleet/domain/value-objects/license-plate-last-four.vo';
import { PassengerCapacity } from '../../../../../src/fleet/domain/value-objects/passenger-capacity.vo';
import { CreateVehicleDto } from '../../../../../src/fleet/interface/dtos/create-vehicle.dto';
import { UpdateVehicleDto } from '../../../../../src/fleet/interface/dtos/update-vehicle.dto';

describe('VehicleController', () => {
  let controller: VehicleController;
  let mockService: VehicleService;

  beforeEach(() => {
    mockService = {
      createVehicle: vi.fn(),
      getVehicles: vi.fn(),
      getVehicleById: vi.fn(),
      updateVehicle: vi.fn(),
      deleteVehicle: vi.fn(),
    } as any;

    controller = new VehicleController(mockService);
  });

  describe('POST /vehicles', () => {
    it('should create a new vehicle', async () => {
      // Arrange
      const createDto: CreateVehicleDto = {
        lastFourDigits: '1234',
        passengerCapacity: 10,
        institutionId: 'institution-uuid-123',
      };

      const createdVehicle = new Vehicle({
        id: 'vehicle-uuid-new',
        lastFourDigits: new LicensePlateLastFour('1234'),
        passengerCapacity: new PassengerCapacity(10),
        institutionId: 'institution-uuid-123',
        currentGroupId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(mockService.createVehicle).mockResolvedValue(createdVehicle);

      // Act
      const result = await controller.create(createDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe('vehicle-uuid-new');
      expect(result.lastFourDigits).toBe('1234');
      expect(result.passengerCapacity).toBe(10);
      expect(mockService.createVehicle).toHaveBeenCalledWith({
        lastFourDigits: '1234',
        passengerCapacity: 10,
        institutionId: 'institution-uuid-123',
      });
    });
  });

  describe('GET /vehicles', () => {
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
          currentGroupId: 'group-uuid-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ];

      vi.mocked(mockService.getVehicles).mockResolvedValue(vehicles);

      // Act
      const result = await controller.findAll(institutionId);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('vehicle-1');
      expect(result[1].currentGroupId).toBe('group-uuid-1');
      expect(mockService.getVehicles).toHaveBeenCalledWith(institutionId);
    });
  });

  describe('GET /vehicles/:id', () => {
    it('should return vehicle by id', async () => {
      // Arrange
      const vehicleId = 'vehicle-uuid-123';
      const vehicle = new Vehicle({
        id: vehicleId,
        lastFourDigits: new LicensePlateLastFour('5678'),
        passengerCapacity: new PassengerCapacity(15),
        institutionId: 'institution-uuid-123',
        currentGroupId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(mockService.getVehicleById).mockResolvedValue(vehicle);

      // Act
      const result = await controller.findOne(vehicleId);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(vehicleId);
      expect(result.lastFourDigits).toBe('5678');
      expect(mockService.getVehicleById).toHaveBeenCalledWith(vehicleId);
    });
  });

  describe('PATCH /vehicles/:id', () => {
    it('should update vehicle capacity', async () => {
      // Arrange
      const vehicleId = 'vehicle-uuid-789';
      const updateDto: UpdateVehicleDto = {
        passengerCapacity: 15,
      };

      const updatedVehicle = new Vehicle({
        id: vehicleId,
        lastFourDigits: new LicensePlateLastFour('7777'),
        passengerCapacity: new PassengerCapacity(15),
        institutionId: 'institution-uuid-123',
        currentGroupId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(mockService.updateVehicle).mockResolvedValue(updatedVehicle);

      // Act
      const result = await controller.update(vehicleId, updateDto);

      // Assert
      expect(result.passengerCapacity).toBe(15);
      expect(mockService.updateVehicle).toHaveBeenCalledWith({
        id: vehicleId,
        ...updateDto,
      });
    });

    it('should update currentGroupId', async () => {
      // Arrange
      const vehicleId = 'vehicle-uuid-999';
      const updateDto: UpdateVehicleDto = {
        currentGroupId: 'new-group-uuid',
      };

      const updatedVehicle = new Vehicle({
        id: vehicleId,
        lastFourDigits: new LicensePlateLastFour('9999'),
        passengerCapacity: new PassengerCapacity(12),
        institutionId: 'institution-uuid-123',
        currentGroupId: 'new-group-uuid',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(mockService.updateVehicle).mockResolvedValue(updatedVehicle);

      // Act
      const result = await controller.update(vehicleId, updateDto);

      // Assert
      expect(result.currentGroupId).toBe('new-group-uuid');
    });
  });

  describe('DELETE /vehicles/:id', () => {
    it('should delete vehicle', async () => {
      // Arrange
      const vehicleId = 'vehicle-to-delete';
      vi.mocked(mockService.deleteVehicle).mockResolvedValue(undefined);

      // Act
      await controller.remove(vehicleId);

      // Assert
      expect(mockService.deleteVehicle).toHaveBeenCalledWith(vehicleId);
    });
  });
});
