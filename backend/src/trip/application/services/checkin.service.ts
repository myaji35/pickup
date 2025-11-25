/**
 * CheckIn Service (Phase 12)
 *
 * 체크인 관리 비즈니스 로직
 */

import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import {
  ICheckInRepository,
  CHECKIN_REPOSITORY,
} from '../../domain/repositories/checkin.repository.interface';
import {
  ITripRepository,
  TRIP_REPOSITORY,
} from '../../domain/repositories/trip.repository.interface';
import { CheckIn, CheckInType } from '../../domain/entities/checkin.entity';
import { CreateCheckInCommand } from '../commands/create-checkin.command';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CheckInService {
  constructor(
    @Inject(CHECKIN_REPOSITORY)
    private readonly checkInRepository: ICheckInRepository,
    @Inject(TRIP_REPOSITORY)
    private readonly tripRepository: ITripRepository,
  ) {}

  /**
   * 체크인 생성 (탑승/하차)
   */
  async createCheckIn(command: CreateCheckInCommand): Promise<CheckIn> {
    // 1. 운행 존재 확인
    const trip = await this.tripRepository.findById(command.tripId);
    if (!trip) {
      throw new NotFoundException(`Trip with ID ${command.tripId} not found`);
    }

    // 2. 운행 소유권 확인 (기사 본인의 운행인지)
    if (trip.driverId !== command.driverId) {
      throw new ForbiddenException(
        'You are not authorized to check in passengers for this trip',
      );
    }

    // 3. 운행이 진행 중인지 확인
    if (!trip.isInProgress()) {
      throw new BadRequestException(
        `Cannot check in passengers. Trip status is ${trip.status}. Trip must be IN_PROGRESS.`,
      );
    }

    // 4. 중복 체크인 확인
    const alreadyCheckedIn = await this.checkInRepository.exists(
      command.tripId,
      command.passengerId,
      command.type,
    );

    if (alreadyCheckedIn) {
      throw new BadRequestException(
        `Passenger has already checked in as ${command.type} for this trip`,
      );
    }

    // 5. 체크인 생성
    const checkIn = new CheckIn(
      uuidv4(),
      command.tripId,
      command.passengerId,
      command.type,
      command.timestamp,
      command.location,
      new Date(),
    );

    return await this.checkInRepository.create(checkIn);
  }

  /**
   * 운행의 모든 체크인 조회
   */
  async getCheckInsByTrip(tripId: string): Promise<CheckIn[]> {
    return await this.checkInRepository.findByTrip(tripId);
  }

  /**
   * 운행의 특정 타입 체크인 조회
   */
  async getCheckInsByTripAndType(
    tripId: string,
    type: CheckInType,
  ): Promise<CheckIn[]> {
    return await this.checkInRepository.findByTripAndType(tripId, type);
  }

  /**
   * 승객의 체크인 기록 조회
   */
  async getCheckInsByPassenger(
    passengerId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<CheckIn[]> {
    return await this.checkInRepository.findByPassenger(
      passengerId,
      startDate,
      endDate,
    );
  }

  /**
   * 운행의 체크인 통계
   */
  async getTripCheckInStats(tripId: string): Promise<{
    totalCheckIns: number;
    boardingCount: number;
    alightingCount: number;
  }> {
    const totalCheckIns = await this.checkInRepository.countByTrip(tripId);
    const boardingCount = await this.checkInRepository.countBoardingByTrip(
      tripId,
    );
    const alightingCount = totalCheckIns - boardingCount;

    return {
      totalCheckIns,
      boardingCount,
      alightingCount,
    };
  }

  /**
   * 특정 승객의 특정 운행 체크인 조회
   */
  async getPassengerCheckInsForTrip(
    tripId: string,
    passengerId: string,
  ): Promise<CheckIn[]> {
    return await this.checkInRepository.findByTripAndPassenger(
      tripId,
      passengerId,
    );
  }

  /**
   * ID로 체크인 조회
   */
  async findById(id: string): Promise<CheckIn> {
    const checkIn = await this.checkInRepository.findById(id);
    if (!checkIn) {
      throw new NotFoundException(`CheckIn with ID ${id} not found`);
    }
    return checkIn;
  }
}
