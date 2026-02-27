import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CheckInService } from './checkin.service';
import { ICheckInRepository } from '../../domain/repositories/checkin.repository.interface';
import { ITripRepository } from '../../domain/repositories/trip.repository.interface';
import { CheckIn, CheckInType } from '../../domain/entities/checkin.entity';
import { Trip, TripStatus, TripType } from '../../domain/entities/trip.entity';
import { CreateCheckInCommand } from '../commands/create-checkin.command';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';

/**
 * CheckInService Unit Tests (Phase 12)
 *
 * 체크인 서비스 핵심 비즈니스 로직 검증:
 * - 체크인 생성 및 검증
 * - 중복 체크인 방지
 * - 운행 상태 검증
 * - 소유권 검증
 * - 통계 조회
 */
describe('CheckInService', () => {
  let checkInService: CheckInService;
  let checkInRepository: ICheckInRepository;
  let tripRepository: ITripRepository;

  // Test fixtures
  const mockDriverId = 'driver-1';
  const mockOtherDriverId = 'driver-2';
  const mockTripId = 'trip-1';
  const mockPassengerId = 'passenger-1';
  const mockCheckInId = 'checkin-1';
  const mockInstitutionId = 'inst-1';
  const mockVehicleId = 'vehicle-1';
  const mockRouteId = 'route-1';

  const mockGpsLocation = { lat: 37.123456, lng: 127.123456 };
  const mockTimestamp = new Date('2025-01-15T08:30:00Z');

  beforeEach(() => {
    // Mock repositories
    checkInRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findByTrip: vi.fn(),
      findByTripAndType: vi.fn(),
      findByPassenger: vi.fn(),
      findByTripAndPassenger: vi.fn(),
      exists: vi.fn(),
      countByTrip: vi.fn(),
      countBoardingByTrip: vi.fn(),
    } as any;

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

    checkInService = new CheckInService(checkInRepository, tripRepository);
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
      status: TripStatus.IN_PROGRESS,
      scheduledStart: new Date('2025-01-15T08:00:00Z'),
      actualStart: new Date('2025-01-15T08:00:00Z'),
      actualEnd: null,
      startLocation: mockGpsLocation,
      endLocation: null,
      createdAt: new Date('2025-01-14T10:00:00Z'),
      updatedAt: new Date('2025-01-15T08:00:00Z'),
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

  /**
   * Helper function to create mock CheckIn entity
   */
  const createMockCheckIn = (
    overrides?: Partial<{
      id: string;
      tripId: string;
      passengerId: string;
      type: CheckInType;
      timestamp: Date;
      location: any;
      createdAt: Date;
    }>,
  ): CheckIn => {
    const defaults = {
      id: mockCheckInId,
      tripId: mockTripId,
      passengerId: mockPassengerId,
      type: CheckInType.BOARDING,
      timestamp: mockTimestamp,
      location: mockGpsLocation,
      createdAt: new Date(),
    };

    const merged = { ...defaults, ...overrides };

    return new CheckIn(
      merged.id,
      merged.tripId,
      merged.passengerId,
      merged.type,
      merged.timestamp,
      merged.location,
      merged.createdAt,
    );
  };

  describe('createCheckIn', () => {
    it('should create a BOARDING check-in successfully', async () => {
      // Arrange
      const mockTrip = createMockTrip();
      const command = new CreateCheckInCommand(
        mockTripId,
        mockPassengerId,
        CheckInType.BOARDING,
        mockTimestamp,
        mockGpsLocation,
        mockDriverId,
      );

      vi.spyOn(tripRepository, 'findById').mockResolvedValue(mockTrip);
      vi.spyOn(checkInRepository, 'exists').mockResolvedValue(false);
      vi.spyOn(checkInRepository, 'create').mockResolvedValue(
        createMockCheckIn(),
      );

      // Act
      const result = await checkInService.createCheckIn(command);

      // Assert
      expect(result).toBeDefined();
      expect(result.tripId).toBe(mockTripId);
      expect(result.passengerId).toBe(mockPassengerId);
      expect(result.type).toBe(CheckInType.BOARDING);
      expect(checkInRepository.create).toHaveBeenCalled();
    });

    it('should create an ALIGHTING check-in successfully', async () => {
      // Arrange
      const mockTrip = createMockTrip();
      const command = new CreateCheckInCommand(
        mockTripId,
        mockPassengerId,
        CheckInType.ALIGHTING,
        mockTimestamp,
        mockGpsLocation,
        mockDriverId,
      );

      vi.spyOn(tripRepository, 'findById').mockResolvedValue(mockTrip);
      vi.spyOn(checkInRepository, 'exists').mockResolvedValue(false);
      vi.spyOn(checkInRepository, 'create').mockResolvedValue(
        createMockCheckIn({ type: CheckInType.ALIGHTING }),
      );

      // Act
      const result = await checkInService.createCheckIn(command);

      // Assert
      expect(result.type).toBe(CheckInType.ALIGHTING);
    });

    it('should throw NotFoundException when trip does not exist', async () => {
      // Arrange
      const command = new CreateCheckInCommand(
        'nonexistent-trip',
        mockPassengerId,
        CheckInType.BOARDING,
        mockTimestamp,
        mockGpsLocation,
        mockDriverId,
      );

      vi.spyOn(tripRepository, 'findById').mockResolvedValue(null);

      // Act & Assert
      await expect(checkInService.createCheckIn(command)).rejects.toThrow(
        NotFoundException,
      );
      await expect(checkInService.createCheckIn(command)).rejects.toThrow(
        'Trip with ID nonexistent-trip not found',
      );
    });

    it('should throw ForbiddenException when driver does not own the trip', async () => {
      // Arrange
      const mockTrip = createMockTrip();
      const command = new CreateCheckInCommand(
        mockTripId,
        mockPassengerId,
        CheckInType.BOARDING,
        mockTimestamp,
        mockGpsLocation,
        mockOtherDriverId, // Different driver
      );

      vi.spyOn(tripRepository, 'findById').mockResolvedValue(mockTrip);

      // Act & Assert
      await expect(checkInService.createCheckIn(command)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(checkInService.createCheckIn(command)).rejects.toThrow(
        'You are not authorized to check in passengers for this trip',
      );
    });

    it('should throw BadRequestException when trip is not IN_PROGRESS', async () => {
      // Arrange
      const mockTrip = createMockTrip({
        status: TripStatus.SCHEDULED,
      });
      const command = new CreateCheckInCommand(
        mockTripId,
        mockPassengerId,
        CheckInType.BOARDING,
        mockTimestamp,
        mockGpsLocation,
        mockDriverId,
      );

      vi.spyOn(tripRepository, 'findById').mockResolvedValue(mockTrip);

      // Act & Assert
      await expect(checkInService.createCheckIn(command)).rejects.toThrow(
        BadRequestException,
      );
      await expect(checkInService.createCheckIn(command)).rejects.toThrow(
        'Cannot check in passengers. Trip status is SCHEDULED',
      );
    });

    it('should throw BadRequestException when passenger already checked in with same type', async () => {
      // Arrange
      const mockTrip = createMockTrip();
      const command = new CreateCheckInCommand(
        mockTripId,
        mockPassengerId,
        CheckInType.BOARDING,
        mockTimestamp,
        mockGpsLocation,
        mockDriverId,
      );

      vi.spyOn(tripRepository, 'findById').mockResolvedValue(mockTrip);
      vi.spyOn(checkInRepository, 'exists').mockResolvedValue(true); // Already exists

      // Act & Assert
      await expect(checkInService.createCheckIn(command)).rejects.toThrow(
        BadRequestException,
      );
      await expect(checkInService.createCheckIn(command)).rejects.toThrow(
        'Passenger has already checked in as BOARDING for this trip',
      );
    });

    it('should allow same passenger to check in with different type (BOARDING then ALIGHTING)', async () => {
      // Arrange
      const mockTrip = createMockTrip();
      const command = new CreateCheckInCommand(
        mockTripId,
        mockPassengerId,
        CheckInType.ALIGHTING, // Different type
        mockTimestamp,
        mockGpsLocation,
        mockDriverId,
      );

      vi.spyOn(tripRepository, 'findById').mockResolvedValue(mockTrip);
      vi.spyOn(checkInRepository, 'exists').mockResolvedValue(false); // No ALIGHTING yet
      vi.spyOn(checkInRepository, 'create').mockResolvedValue(
        createMockCheckIn({ type: CheckInType.ALIGHTING }),
      );

      // Act
      const result = await checkInService.createCheckIn(command);

      // Assert
      expect(result.type).toBe(CheckInType.ALIGHTING);
      expect(checkInRepository.exists).toHaveBeenCalledWith(
        mockTripId,
        mockPassengerId,
        CheckInType.ALIGHTING,
      );
    });
  });

  describe('getCheckInsByTrip', () => {
    it('should return all check-ins for a trip', async () => {
      // Arrange
      const mockCheckIns = [
        createMockCheckIn({ id: 'checkin-1', type: CheckInType.BOARDING }),
        createMockCheckIn({ id: 'checkin-2', type: CheckInType.BOARDING }),
        createMockCheckIn({ id: 'checkin-3', type: CheckInType.ALIGHTING }),
      ];

      vi.spyOn(checkInRepository, 'findByTrip').mockResolvedValue(mockCheckIns);

      // Act
      const result = await checkInService.getCheckInsByTrip(mockTripId);

      // Assert
      expect(result).toEqual(mockCheckIns);
      expect(result.length).toBe(3);
      expect(checkInRepository.findByTrip).toHaveBeenCalledWith(mockTripId);
    });

    it('should return empty array when no check-ins found', async () => {
      // Arrange
      vi.spyOn(checkInRepository, 'findByTrip').mockResolvedValue([]);

      // Act
      const result = await checkInService.getCheckInsByTrip(mockTripId);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('getCheckInsByTripAndType', () => {
    it('should return only BOARDING check-ins', async () => {
      // Arrange
      const mockCheckIns = [
        createMockCheckIn({ id: 'checkin-1', type: CheckInType.BOARDING }),
        createMockCheckIn({ id: 'checkin-2', type: CheckInType.BOARDING }),
      ];

      vi.spyOn(checkInRepository, 'findByTripAndType').mockResolvedValue(
        mockCheckIns,
      );

      // Act
      const result = await checkInService.getCheckInsByTripAndType(
        mockTripId,
        CheckInType.BOARDING,
      );

      // Assert
      expect(result).toEqual(mockCheckIns);
      expect(result.every((c) => c.type === CheckInType.BOARDING)).toBe(true);
      expect(checkInRepository.findByTripAndType).toHaveBeenCalledWith(
        mockTripId,
        CheckInType.BOARDING,
      );
    });

    it('should return only ALIGHTING check-ins', async () => {
      // Arrange
      const mockCheckIns = [
        createMockCheckIn({ id: 'checkin-1', type: CheckInType.ALIGHTING }),
        createMockCheckIn({ id: 'checkin-2', type: CheckInType.ALIGHTING }),
      ];

      vi.spyOn(checkInRepository, 'findByTripAndType').mockResolvedValue(
        mockCheckIns,
      );

      // Act
      const result = await checkInService.getCheckInsByTripAndType(
        mockTripId,
        CheckInType.ALIGHTING,
      );

      // Assert
      expect(result).toEqual(mockCheckIns);
      expect(result.every((c) => c.type === CheckInType.ALIGHTING)).toBe(true);
    });
  });

  describe('getCheckInsByPassenger', () => {
    it('should return check-ins for passenger without date filter', async () => {
      // Arrange
      const mockCheckIns = [
        createMockCheckIn({ id: 'checkin-1' }),
        createMockCheckIn({ id: 'checkin-2' }),
      ];

      vi.spyOn(checkInRepository, 'findByPassenger').mockResolvedValue(
        mockCheckIns,
      );

      // Act
      const result = await checkInService.getCheckInsByPassenger(
        mockPassengerId,
      );

      // Assert
      expect(result).toEqual(mockCheckIns);
      expect(checkInRepository.findByPassenger).toHaveBeenCalledWith(
        mockPassengerId,
        undefined,
        undefined,
      );
    });

    it('should return check-ins for passenger with date filter', async () => {
      // Arrange
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');
      const mockCheckIns = [createMockCheckIn()];

      vi.spyOn(checkInRepository, 'findByPassenger').mockResolvedValue(
        mockCheckIns,
      );

      // Act
      const result = await checkInService.getCheckInsByPassenger(
        mockPassengerId,
        startDate,
        endDate,
      );

      // Assert
      expect(result).toEqual(mockCheckIns);
      expect(checkInRepository.findByPassenger).toHaveBeenCalledWith(
        mockPassengerId,
        startDate,
        endDate,
      );
    });
  });

  describe('getTripCheckInStats', () => {
    it('should return correct statistics for trip check-ins', async () => {
      // Arrange
      vi.spyOn(checkInRepository, 'countByTrip').mockResolvedValue(10);
      vi.spyOn(checkInRepository, 'countBoardingByTrip').mockResolvedValue(6);

      // Act
      const result = await checkInService.getTripCheckInStats(mockTripId);

      // Assert
      expect(result.totalCheckIns).toBe(10);
      expect(result.boardingCount).toBe(6);
      expect(result.alightingCount).toBe(4); // 10 - 6 = 4
      expect(checkInRepository.countByTrip).toHaveBeenCalledWith(mockTripId);
      expect(checkInRepository.countBoardingByTrip).toHaveBeenCalledWith(
        mockTripId,
      );
    });

    it('should return zero statistics when no check-ins exist', async () => {
      // Arrange
      vi.spyOn(checkInRepository, 'countByTrip').mockResolvedValue(0);
      vi.spyOn(checkInRepository, 'countBoardingByTrip').mockResolvedValue(0);

      // Act
      const result = await checkInService.getTripCheckInStats(mockTripId);

      // Assert
      expect(result.totalCheckIns).toBe(0);
      expect(result.boardingCount).toBe(0);
      expect(result.alightingCount).toBe(0);
    });
  });

  describe('getPassengerCheckInsForTrip', () => {
    it('should return check-ins for specific passenger in trip', async () => {
      // Arrange
      const mockCheckIns = [
        createMockCheckIn({ type: CheckInType.BOARDING }),
        createMockCheckIn({ type: CheckInType.ALIGHTING }),
      ];

      vi.spyOn(checkInRepository, 'findByTripAndPassenger').mockResolvedValue(
        mockCheckIns,
      );

      // Act
      const result = await checkInService.getPassengerCheckInsForTrip(
        mockTripId,
        mockPassengerId,
      );

      // Assert
      expect(result).toEqual(mockCheckIns);
      expect(checkInRepository.findByTripAndPassenger).toHaveBeenCalledWith(
        mockTripId,
        mockPassengerId,
      );
    });

    it('should return empty array when passenger has no check-ins for trip', async () => {
      // Arrange
      vi.spyOn(checkInRepository, 'findByTripAndPassenger').mockResolvedValue(
        [],
      );

      // Act
      const result = await checkInService.getPassengerCheckInsForTrip(
        mockTripId,
        mockPassengerId,
      );

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should return check-in when found', async () => {
      // Arrange
      const mockCheckIn = createMockCheckIn();
      vi.spyOn(checkInRepository, 'findById').mockResolvedValue(mockCheckIn);

      // Act
      const result = await checkInService.findById(mockCheckInId);

      // Assert
      expect(result).toBe(mockCheckIn);
      expect(checkInRepository.findById).toHaveBeenCalledWith(mockCheckInId);
    });

    it('should throw NotFoundException when check-in does not exist', async () => {
      // Arrange
      vi.spyOn(checkInRepository, 'findById').mockResolvedValue(null);

      // Act & Assert
      await expect(
        checkInService.findById('nonexistent-id'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        checkInService.findById('nonexistent-id'),
      ).rejects.toThrow('CheckIn with ID nonexistent-id not found');
    });
  });
});
