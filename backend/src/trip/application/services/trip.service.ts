/**
 * Trip Service (Phase 12)
 *
 * 운행 관리 비즈니스 로직
 */

import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import {
  ITripRepository,
  TRIP_REPOSITORY,
} from '../../domain/repositories/trip.repository.interface';
import { Trip, TripStatus } from '../../domain/entities/trip.entity';
import { StartTripCommand } from '../commands/start-trip.command';
import { EndTripCommand } from '../commands/end-trip.command';

@Injectable()
export class TripService {
  constructor(
    @Inject(TRIP_REPOSITORY)
    private readonly tripRepository: ITripRepository,
  ) {}

  /**
   * ID로 운행 조회
   */
  async findById(id: string): Promise<Trip> {
    const trip = await this.tripRepository.findById(id);
    if (!trip) {
      throw new NotFoundException(`Trip with ID ${id} not found`);
    }
    return trip;
  }

  /**
   * 기사의 오늘 운행 목록 조회
   */
  async getTodayTripsByDriver(driverId: string): Promise<Trip[]> {
    const today = new Date();
    return await this.tripRepository.findByDriverAndDate(driverId, today);
  }

  /**
   * 기사의 특정 날짜 운행 목록 조회
   */
  async getTripsByDriverAndDate(
    driverId: string,
    date: Date,
  ): Promise<Trip[]> {
    return await this.tripRepository.findByDriverAndDate(driverId, date);
  }

  /**
   * 운행 시작
   */
  async startTrip(command: StartTripCommand): Promise<Trip> {
    // 1. 운행 존재 확인
    const trip = await this.findById(command.tripId);

    // 2. 운행 소유권 확인 (기사 본인의 운행인지)
    if (trip.driverId !== command.driverId) {
      throw new ForbiddenException(
        'You are not authorized to start this trip',
      );
    }

    // 3. 이미 진행 중인 운행이 있는지 확인
    const inProgressTrip = await this.tripRepository.findInProgressByDriver(
      command.driverId,
    );
    if (inProgressTrip) {
      throw new BadRequestException(
        `You already have a trip in progress (ID: ${inProgressTrip.id}). Please end it first.`,
      );
    }

    // 4. 운행 시작 (도메인 로직)
    try {
      trip.start(command.startLocation);
    } catch (error) {
      throw new BadRequestException(error.message);
    }

    // 5. 저장
    return await this.tripRepository.update(trip.id, trip);
  }

  /**
   * 운행 종료
   */
  async endTrip(command: EndTripCommand): Promise<Trip> {
    // 1. 운행 존재 확인
    const trip = await this.findById(command.tripId);

    // 2. 운행 소유권 확인
    if (trip.driverId !== command.driverId) {
      throw new ForbiddenException('You are not authorized to end this trip');
    }

    // 3. 운행 종료 (도메인 로직)
    try {
      trip.end(command.endLocation);
    } catch (error) {
      throw new BadRequestException(error.message);
    }

    // 4. 저장
    return await this.tripRepository.update(trip.id, trip);
  }

  /**
   * 운행 취소
   */
  async cancelTrip(tripId: string, driverId: string): Promise<Trip> {
    // 1. 운행 존재 확인
    const trip = await this.findById(tripId);

    // 2. 운행 소유권 확인
    if (trip.driverId !== driverId) {
      throw new ForbiddenException(
        'You are not authorized to cancel this trip',
      );
    }

    // 3. 운행 취소 (도메인 로직)
    try {
      trip.cancel();
    } catch (error) {
      throw new BadRequestException(error.message);
    }

    // 4. 저장
    return await this.tripRepository.update(trip.id, trip);
  }

  /**
   * 회원사의 운행 목록 조회 (관리자용)
   */
  async getTripsByInstitutionAndDate(
    institutionId: string,
    date: Date,
  ): Promise<Trip[]> {
    return await this.tripRepository.findByInstitutionAndDate(
      institutionId,
      date,
    );
  }

  /**
   * 회원사의 특정 상태 운행 목록 조회
   */
  async getTripsByStatus(
    institutionId: string,
    status: TripStatus,
    limit?: number,
  ): Promise<Trip[]> {
    return await this.tripRepository.findByStatus(
      institutionId,
      status,
      limit,
    );
  }

  /**
   * 기사의 현재 진행 중인 운행 조회
   */
  async getInProgressTrip(driverId: string): Promise<Trip | null> {
    return await this.tripRepository.findInProgressByDriver(driverId);
  }
}
