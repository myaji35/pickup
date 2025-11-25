import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TripService } from './trip.service';
import { ITripRepository } from '../../domain/repositories/trip.repository.interface';
import { Trip, TripStatus, TripType } from '../../domain/entities/trip.entity';
import { StartTripCommand } from '../commands/start-trip.command';
import { EndTripCommand } from '../commands/end-trip.command';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';

/**
 * TripService Unit Tests (Phase 12)
 *
 * 운행 서비스 핵심 비즈니스 로직 검증:
 * - 운행 시작/종료/취소
 * - 소유권 검증
 * - 중복 운행 방지
 * - 상태 전환 검증
 */
describe('TripService', () => {
  let tripService: TripService;
  let tripRepository: ITripRepository;

  // Test fixtures
  const mockDriverId = 'driver-1';
  const mockOtherDriverId = 'driver-2';
  const mockTripId = 'trip-1';
  const mockInstitutionId = 'inst-1';
  const mockVehicleId = 'vehicle-1';
  const mockRouteId = 'route-1';

  const mockGpsLocation = { lat: 37.123456, lng: 127.123456 };
  const mockEndLocation = { lat: 37.234567, lng: 127.234567 };

  beforeEach(() => {
    // Mock repository
    tripRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findByDriverAndDate: vi.fn(),
      findByInstitutionAndDate: vi.fn(),
      findByVehicleAndDate: vi.fn(),
      findInProgressByDriver: vi.fn(),
      findByStatus: vi.fn(),
      exists: vi.fn(),
    } as any;

    tripService = new TripService(tripRepository);
  });

  /**
   * Helper function to create mock Trip entity
   */
  const createMockTrip = (
    overrides?: Partial<{
      id: string;
      institutionId: string;
      vehicleId: string;
      driverId: string;
      routeId: string | null;
      type: TripType;
      status: TripStatus;
      scheduledStart: Date;
      actualStart: Date | null;
      actualEnd: Date | null;
      startLocation: any;
      endLocation: any;
      createdAt: Date;
      updatedAt: Date;
    }>,
  ): Trip => {
    const defaults = {
      id: mockTripId,
      institutionId: mockInstitutionId,
      vehicleId: mockVehicleId,
      driverId: mockDriverId,
      routeId: mockRouteId,
      type: TripType.MORNING,
      status: TripStatus.SCHEDULED,
      scheduledStart: new Date('2025-01-15T08:00:00Z'),
      actualStart: null,
      actualEnd: null,
      startLocation: null,
      endLocation: null,
      createdAt: new Date('2025-01-14T10:00:00Z'),
      updatedAt: new Date('2025-01-14T10:00:00Z'),
    };

    const merged = { ...defaults, ...overrides };

    return new Trip(
      merged.id,
      merged.institutionId,
      merged.vehicleId,
      merged.driverId,
      merged.routeId,
      merged.type,
      merged.status,
      merged.scheduledStart,
      merged.actualStart,
      merged.actualEnd,
      merged.startLocation,
      merged.endLocation,
      merged.createdAt,
      merged.updatedAt,
    );
  };

  describe('findById', () => {
    it('should return trip when found', async () => {
      // Arrange
      const mockTrip = createMockTrip();
      vi.spyOn(tripRepository, 'findById').mockResolvedValue(mockTrip);

      // Act
      const result = await tripService.findById(mockTripId);

      // Assert
      expect(result).toBe(mockTrip);
      expect(tripRepository.findById).toHaveBeenCalledWith(mockTripId);
    });

    it('should throw NotFoundException when trip does not exist', async () => {
      // Arrange
      vi.spyOn(tripRepository, 'findById').mockResolvedValue(null);

      // Act & Assert
      await expect(tripService.findById('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(tripService.findById('nonexistent-id')).rejects.toThrow(
        'Trip with ID nonexistent-id not found',
      );
    });
  });

  describe('getTodayTripsByDriver', () => {
    it('should return trips for today', async () => {
      // Arrange
      const mockTrips = [
        createMockTrip({ id: 'trip-1' }),
        createMockTrip({ id: 'trip-2' }),
      ];
      vi.spyOn(tripRepository, 'findByDriverAndDate').mockResolvedValue(
        mockTrips,
      );

      // Act
      const result = await tripService.getTodayTripsByDriver(mockDriverId);

      // Assert
      expect(result).toEqual(mockTrips);
      expect(tripRepository.findByDriverAndDate).toHaveBeenCalledWith(
        mockDriverId,
        expect.any(Date),
      );
    });

    it('should return empty array when no trips found', async () => {
      // Arrange
      vi.spyOn(tripRepository, 'findByDriverAndDate').mockResolvedValue([]);

      // Act
      const result = await tripService.getTodayTripsByDriver(mockDriverId);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('startTrip', () => {
    it('should start a SCHEDULED trip successfully', async () => {
      // Arrange
      const mockTrip = createMockTrip();
      const command = new StartTripCommand(
        mockTripId,
        mockDriverId,
        mockGpsLocation,
      );

      vi.spyOn(tripRepository, 'findById').mockResolvedValue(mockTrip);
      vi.spyOn(tripRepository, 'findInProgressByDriver').mockResolvedValue(null);
      vi.spyOn(tripRepository, 'update').mockResolvedValue(mockTrip);

      // Act
      const result = await tripService.startTrip(command);

      // Assert
      expect(result.status).toBe(TripStatus.IN_PROGRESS);
      expect(result.actualStart).toBeDefined();
      expect(result.startLocation).toEqual(mockGpsLocation);
      expect(tripRepository.update).toHaveBeenCalledWith(
        mockTripId,
        expect.any(Trip),
      );
    });

    it('should throw NotFoundException when trip does not exist', async () => {
      // Arrange
      const command = new StartTripCommand(
        'nonexistent-id',
        mockDriverId,
        mockGpsLocation,
      );
      vi.spyOn(tripRepository, 'findById').mockResolvedValue(null);

      // Act & Assert
      await expect(tripService.startTrip(command)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when driver does not own the trip', async () => {
      // Arrange
      const mockTrip = createMockTrip();
      const command = new StartTripCommand(
        mockTripId,
        mockOtherDriverId, // Different driver
        mockGpsLocation,
      );

      vi.spyOn(tripRepository, 'findById').mockResolvedValue(mockTrip);

      // Act & Assert
      await expect(tripService.startTrip(command)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(tripService.startTrip(command)).rejects.toThrow(
        'You are not authorized to start this trip',
      );
    });

    it('should throw BadRequestException when driver already has a trip in progress', async () => {
      // Arrange
      const mockTrip = createMockTrip();
      const inProgressTrip = createMockTrip({
        id: 'trip-in-progress',
        status: TripStatus.IN_PROGRESS,
      });
      const command = new StartTripCommand(
        mockTripId,
        mockDriverId,
        mockGpsLocation,
      );

      vi.spyOn(tripRepository, 'findById').mockResolvedValue(mockTrip);
      vi.spyOn(tripRepository, 'findInProgressByDriver').mockResolvedValue(
        inProgressTrip,
      );

      // Act & Assert
      await expect(tripService.startTrip(command)).rejects.toThrow(
        BadRequestException,
      );
      await expect(tripService.startTrip(command)).rejects.toThrow(
        'You already have a trip in progress',
      );
    });

    it('should throw BadRequestException when trip is not in SCHEDULED status', async () => {
      // Arrange
      const mockTrip = createMockTrip({
        status: TripStatus.COMPLETED,
      });
      const command = new StartTripCommand(
        mockTripId,
        mockDriverId,
        mockGpsLocation,
      );

      vi.spyOn(tripRepository, 'findById').mockResolvedValue(mockTrip);
      vi.spyOn(tripRepository, 'findInProgressByDriver').mockResolvedValue(null);

      // Act & Assert
      await expect(tripService.startTrip(command)).rejects.toThrow(
        BadRequestException,
      );
      await expect(tripService.startTrip(command)).rejects.toThrow(
        'Cannot start trip in COMPLETED status',
      );
    });
  });

  describe('endTrip', () => {
    it('should end an IN_PROGRESS trip successfully', async () => {
      // Arrange
      const mockTrip = createMockTrip({
        status: TripStatus.IN_PROGRESS,
        actualStart: new Date('2025-01-15T08:00:00Z'),
      });
      const command = new EndTripCommand(
        mockTripId,
        mockDriverId,
        mockEndLocation,
      );

      vi.spyOn(tripRepository, 'findById').mockResolvedValue(mockTrip);
      vi.spyOn(tripRepository, 'update').mockResolvedValue(mockTrip);

      // Act
      const result = await tripService.endTrip(command);

      // Assert
      expect(result.status).toBe(TripStatus.COMPLETED);
      expect(result.actualEnd).toBeDefined();
      expect(result.endLocation).toEqual(mockEndLocation);
      expect(tripRepository.update).toHaveBeenCalledWith(
        mockTripId,
        expect.any(Trip),
      );
    });

    it('should throw NotFoundException when trip does not exist', async () => {
      // Arrange
      const command = new EndTripCommand(
        'nonexistent-id',
        mockDriverId,
        mockEndLocation,
      );
      vi.spyOn(tripRepository, 'findById').mockResolvedValue(null);

      // Act & Assert
      await expect(tripService.endTrip(command)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when driver does not own the trip', async () => {
      // Arrange
      const mockTrip = createMockTrip({
        status: TripStatus.IN_PROGRESS,
      });
      const command = new EndTripCommand(
        mockTripId,
        mockOtherDriverId, // Different driver
        mockEndLocation,
      );

      vi.spyOn(tripRepository, 'findById').mockResolvedValue(mockTrip);

      // Act & Assert
      await expect(tripService.endTrip(command)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(tripService.endTrip(command)).rejects.toThrow(
        'You are not authorized to end this trip',
      );
    });

    it('should throw BadRequestException when trip is not IN_PROGRESS', async () => {
      // Arrange
      const mockTrip = createMockTrip({
        status: TripStatus.SCHEDULED,
      });
      const command = new EndTripCommand(
        mockTripId,
        mockDriverId,
        mockEndLocation,
      );

      vi.spyOn(tripRepository, 'findById').mockResolvedValue(mockTrip);

      // Act & Assert
      await expect(tripService.endTrip(command)).rejects.toThrow(
        BadRequestException,
      );
      await expect(tripService.endTrip(command)).rejects.toThrow(
        'Cannot end trip in SCHEDULED status',
      );
    });
  });

  describe('cancelTrip', () => {
    it('should cancel a SCHEDULED trip successfully', async () => {
      // Arrange
      const mockTrip = createMockTrip({
        status: TripStatus.SCHEDULED,
      });

      vi.spyOn(tripRepository, 'findById').mockResolvedValue(mockTrip);
      vi.spyOn(tripRepository, 'update').mockResolvedValue(mockTrip);

      // Act
      const result = await tripService.cancelTrip(mockTripId, mockDriverId);

      // Assert
      expect(result.status).toBe(TripStatus.CANCELLED);
      expect(tripRepository.update).toHaveBeenCalledWith(
        mockTripId,
        expect.any(Trip),
      );
    });

    it('should cancel an IN_PROGRESS trip successfully', async () => {
      // Arrange
      const mockTrip = createMockTrip({
        status: TripStatus.IN_PROGRESS,
      });

      vi.spyOn(tripRepository, 'findById').mockResolvedValue(mockTrip);
      vi.spyOn(tripRepository, 'update').mockResolvedValue(mockTrip);

      // Act
      const result = await tripService.cancelTrip(mockTripId, mockDriverId);

      // Assert
      expect(result.status).toBe(TripStatus.CANCELLED);
    });

    it('should throw NotFoundException when trip does not exist', async () => {
      // Arrange
      vi.spyOn(tripRepository, 'findById').mockResolvedValue(null);

      // Act & Assert
      await expect(
        tripService.cancelTrip('nonexistent-id', mockDriverId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when driver does not own the trip', async () => {
      // Arrange
      const mockTrip = createMockTrip();

      vi.spyOn(tripRepository, 'findById').mockResolvedValue(mockTrip);

      // Act & Assert
      await expect(
        tripService.cancelTrip(mockTripId, mockOtherDriverId),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        tripService.cancelTrip(mockTripId, mockOtherDriverId),
      ).rejects.toThrow('You are not authorized to cancel this trip');
    });

    it('should throw BadRequestException when trying to cancel a COMPLETED trip', async () => {
      // Arrange
      const mockTrip = createMockTrip({
        status: TripStatus.COMPLETED,
      });

      vi.spyOn(tripRepository, 'findById').mockResolvedValue(mockTrip);

      // Act & Assert
      await expect(
        tripService.cancelTrip(mockTripId, mockDriverId),
      ).rejects.toThrow(BadRequestException);
      await expect(
        tripService.cancelTrip(mockTripId, mockDriverId),
      ).rejects.toThrow('Cannot cancel a completed trip');
    });
  });

  describe('getTripsByInstitutionAndDate', () => {
    it('should return trips for institution and date', async () => {
      // Arrange
      const mockTrips = [
        createMockTrip({ id: 'trip-1' }),
        createMockTrip({ id: 'trip-2' }),
      ];
      const date = new Date('2025-01-15');

      vi.spyOn(tripRepository, 'findByInstitutionAndDate').mockResolvedValue(
        mockTrips,
      );

      // Act
      const result = await tripService.getTripsByInstitutionAndDate(
        mockInstitutionId,
        date,
      );

      // Assert
      expect(result).toEqual(mockTrips);
      expect(tripRepository.findByInstitutionAndDate).toHaveBeenCalledWith(
        mockInstitutionId,
        date,
      );
    });
  });

  describe('getTripsByStatus', () => {
    it('should return trips with specific status', async () => {
      // Arrange
      const mockTrips = [
        createMockTrip({
          id: 'trip-1',
          status: TripStatus.IN_PROGRESS,
        }),
        createMockTrip({
          id: 'trip-2',
          status: TripStatus.IN_PROGRESS,
        }),
      ];

      vi.spyOn(tripRepository, 'findByStatus').mockResolvedValue(mockTrips);

      // Act
      const result = await tripService.getTripsByStatus(
        mockInstitutionId,
        TripStatus.IN_PROGRESS,
        10,
      );

      // Assert
      expect(result).toEqual(mockTrips);
      expect(tripRepository.findByStatus).toHaveBeenCalledWith(
        mockInstitutionId,
        TripStatus.IN_PROGRESS,
        10,
      );
    });
  });

  describe('getInProgressTrip', () => {
    it('should return in-progress trip when exists', async () => {
      // Arrange
      const mockTrip = createMockTrip({
        status: TripStatus.IN_PROGRESS,
      });

      vi.spyOn(tripRepository, 'findInProgressByDriver').mockResolvedValue(
        mockTrip,
      );

      // Act
      const result = await tripService.getInProgressTrip(mockDriverId);

      // Assert
      expect(result).toBe(mockTrip);
      expect(tripRepository.findInProgressByDriver).toHaveBeenCalledWith(
        mockDriverId,
      );
    });

    it('should return null when no in-progress trip exists', async () => {
      // Arrange
      vi.spyOn(tripRepository, 'findInProgressByDriver').mockResolvedValue(null);

      // Act
      const result = await tripService.getInProgressTrip(mockDriverId);

      // Assert
      expect(result).toBeNull();
    });
  });
});
