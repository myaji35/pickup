/**
 * Passenger Controller (Phase 12)
 *
 * 승객용 운행 조회 API
 * Role: PASSENGER만 접근 가능
 */

import {
  Controller,
  Get,
  Param,
  UseGuards,
  Request,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../user/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../../user/infrastructure/guards/roles.guard';
import { Roles } from '../../../user/infrastructure/decorators/roles.decorator';
import { TripService } from '../../application/services/trip.service';
import { CheckInService } from '../../application/services/checkin.service';

// JWT User payload interface
interface JwtRequest extends Request {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

@Controller('passenger')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PASSENGER')
export class PassengerController {
  constructor(
    private readonly tripService: TripService,
    private readonly checkInService: CheckInService,
  ) {}

  /**
   * 나의 운행 스케줄 조회
   * GET /passenger/trips
   */
  @Get('trips')
  async getMyTrips(@Request() req: JwtRequest) {
    const passengerId = req.user.userId;

    try {
      const trips = await this.tripService.getTripsByPassenger(passengerId);

      return trips.map((trip) => ({
        id: trip.id,
        type: trip.type,
        status: trip.status,
        scheduledStart: trip.scheduledStart,
        actualStart: trip.actualStart,
        actualEnd: trip.actualEnd,
        vehicleId: trip.vehicleId,
        driverId: trip.driverId,
        routeId: trip.routeId,
      }));
    } catch (error) {
      throw new HttpException(
        'Failed to fetch trips',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 운행 상세 조회
   * GET /passenger/trips/:id
   */
  @Get('trips/:id')
  async getTripDetail(@Param('id') tripId: string, @Request() req: JwtRequest) {
    const passengerId = req.user.userId;

    try {
      const trip = await this.tripService.findById(tripId);

      // TODO: 승객이 해당 운행에 포함되어 있는지 확인
      // 현재는 간단하게 모든 승객이 조회 가능하도록 설정
      // 추후 Route의 optimizedSequence에서 passengerId 확인 로직 추가 필요

      // 체크인 정보도 함께 조회
      const checkIns = await this.checkInService.getCheckInsByTrip(tripId);
      const myCheckIns = checkIns.filter((c) => c.passengerId === passengerId);

      return {
        id: trip.id,
        type: trip.type,
        status: trip.status,
        scheduledStart: trip.scheduledStart,
        actualStart: trip.actualStart,
        actualEnd: trip.actualEnd,
        startLocation: trip.startLocation,
        endLocation: trip.endLocation,
        vehicleId: trip.vehicleId,
        routeId: trip.routeId,
        durationMinutes: trip.getDurationMinutes(),
        myCheckIns: myCheckIns.map((c) => ({
          id: c.id,
          type: c.type,
          timestamp: c.timestamp,
          location: c.location,
        })),
      };
    } catch (error) {
      throw new HttpException(
        'Failed to fetch trip details',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 오늘의 운행 조회
   * GET /passenger/trips/today
   */
  @Get('trips/today')
  async getTodayTrips(@Request() req: JwtRequest) {
    const passengerId = req.user.userId;

    try {
      const trips = await this.tripService.getTodayTripsByPassenger(passengerId);

      return trips.map((trip) => ({
        id: trip.id,
        type: trip.type,
        status: trip.status,
        scheduledStart: trip.scheduledStart,
        actualStart: trip.actualStart,
        actualEnd: trip.actualEnd,
        vehicleId: trip.vehicleId,
        routeId: trip.routeId,
      }));
    } catch (error) {
      throw new HttpException(
        "Failed to fetch today's trips",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
