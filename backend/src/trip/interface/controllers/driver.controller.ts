/**
 * Driver Controller (Phase 12)
 *
 * 기사용 운행 관리 API
 * Role: DRIVER만 접근 가능
 */

import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../user/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../../user/infrastructure/guards/roles.guard';
import { Roles } from '../../../user/infrastructure/decorators/roles.decorator';

// JWT User payload interface
interface JwtRequest extends Request {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}
import { TripService } from '../../application/services/trip.service';
import { CheckInService } from '../../application/services/checkin.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { StartTripDto } from '../dto/start-trip.dto';
import { EndTripDto } from '../dto/end-trip.dto';
import { CreateCheckInDto } from '../dto/create-checkin.dto';
import { StartTripCommand } from '../../application/commands/start-trip.command';
import { EndTripCommand } from '../../application/commands/end-trip.command';
import { CreateCheckInCommand } from '../../application/commands/create-checkin.command';

@Controller('driver')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('DRIVER')
export class DriverController {
  constructor(
    private readonly tripService: TripService,
    private readonly checkInService: CheckInService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * 운행 시작
   * POST /driver/trips/:id/start
   */
  @Post('trips/:id/start')
  @HttpCode(HttpStatus.OK)
  async startTrip(
    @Param('id') tripId: string,
    @Body() dto: StartTripDto,
    @Request() req: JwtRequest,
  ) {
    const driverId = req.user.userId;

    const command = new StartTripCommand(
      tripId,
      driverId,
      dto.startLocation,
    );

    const trip = await this.tripService.startTrip(command);

    return {
      success: true,
      data: {
        id: trip.id,
        status: trip.status,
        actualStart: trip.actualStart,
        startLocation: trip.startLocation,
      },
      message: 'Trip started successfully',
    };
  }

  /**
   * 운행 종료
   * POST /driver/trips/:id/end
   */
  @Post('trips/:id/end')
  @HttpCode(HttpStatus.OK)
  async endTrip(
    @Param('id') tripId: string,
    @Body() dto: EndTripDto,
    @Request() req: JwtRequest,
  ) {
    const driverId = req.user.userId;

    const command = new EndTripCommand(tripId, driverId, dto.endLocation);

    const trip = await this.tripService.endTrip(command);

    return {
      success: true,
      data: {
        id: trip.id,
        status: trip.status,
        actualEnd: trip.actualEnd,
        endLocation: trip.endLocation,
        durationMinutes: trip.getDurationMinutes(),
      },
      message: 'Trip ended successfully',
    };
  }

  /**
   * 오늘의 운행 목록 조회
   * GET /driver/trips/today
   */
  @Get('trips/today')
  async getTodayTrips(@Request() req: JwtRequest) {
    const driverId = req.user.userId;

    const trips = await this.tripService.getTodayTripsByDriver(driverId);

    return {
      success: true,
      data: trips.map((trip) => ({
        id: trip.id,
        type: trip.type,
        status: trip.status,
        scheduledStart: trip.scheduledStart,
        actualStart: trip.actualStart,
        actualEnd: trip.actualEnd,
        vehicleId: trip.vehicleId,
        routeId: trip.routeId,
      })),
    };
  }

  /**
   * 운행 상세 조회
   * GET /driver/trips/:id
   */
  @Get('trips/:id')
  async getTripDetail(@Param('id') tripId: string, @Request() req: JwtRequest) {
    const driverId = req.user.userId;

    const trip = await this.tripService.findById(tripId);

    // 기사 본인의 운행인지 확인
    if (trip.driverId !== driverId) {
      return {
        success: false,
        message: 'You are not authorized to view this trip',
      };
    }

    // 체크인 정보도 함께 조회
    const checkIns = await this.checkInService.getCheckInsByTrip(tripId);
    const checkInStats = await this.checkInService.getTripCheckInStats(tripId);

    // Route와 승객 정보 조회
    let passengers = [];
    if (trip.routeId) {
      const route = await this.prisma.route.findUnique({
        where: { id: trip.routeId },
      });

      if (route && route.optimizedSequence) {
        // optimizedSequence에서 passengerId 추출
        const sequence = route.optimizedSequence as any[];
        const passengerIds = sequence
          .map((s) => s.passengerId)
          .filter((id) => id != null);

        // 승객 정보 조회
        if (passengerIds.length > 0) {
          const passengerRecords = await this.prisma.passenger.findMany({
            where: {
              id: {
                in: passengerIds,
              },
            },
          });

          // sequence 순서대로 정렬하여 승객 정보 매핑
          passengers = sequence
            .filter((s) => s.passengerId != null)
            .map((s) => {
              const passenger = passengerRecords.find(
                (p) => p.id === s.passengerId,
              );
              return {
                id: passenger?.id || s.passengerId,
                name: passenger?.name || '알 수 없음',
                sequence: s.sequence,
                address: s.address || passenger?.pickupAddress || '',
                lat: s.lat,
                lng: s.lng,
              };
            });
        }
      }
    }

    return {
      success: true,
      data: {
        trip: {
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
        },
        passengers, // 승객 목록 추가
        checkIns: checkIns.map((c) => ({
          id: c.id,
          passengerId: c.passengerId,
          type: c.type,
          timestamp: c.timestamp,
          location: c.location,
        })),
        stats: checkInStats,
      },
    };
  }

  /**
   * 체크인 생성 (탑승/하차)
   * POST /driver/checkin
   */
  @Post('checkin')
  @HttpCode(HttpStatus.CREATED)
  async createCheckIn(@Body() dto: CreateCheckInDto, @Request() req: JwtRequest) {
    const driverId = req.user.userId;

    const command = new CreateCheckInCommand(
      dto.tripId,
      dto.passengerId,
      dto.type,
      new Date(dto.timestamp),
      dto.location,
      driverId,
    );

    const checkIn = await this.checkInService.createCheckIn(command);

    return {
      success: true,
      data: {
        id: checkIn.id,
        tripId: checkIn.tripId,
        passengerId: checkIn.passengerId,
        type: checkIn.type,
        timestamp: checkIn.timestamp,
        location: checkIn.location,
      },
      message: `Passenger checked in successfully (${checkIn.type})`,
    };
  }

  /**
   * 운행의 체크인 목록 조회
   * GET /driver/trips/:id/checkins
   */
  @Get('trips/:id/checkins')
  async getTripCheckIns(@Param('id') tripId: string, @Request() req: JwtRequest) {
    const driverId = req.user.userId;

    // 운행 소유권 확인
    const trip = await this.tripService.findById(tripId);
    if (trip.driverId !== driverId) {
      return {
        success: false,
        message: 'You are not authorized to view check-ins for this trip',
      };
    }

    const checkIns = await this.checkInService.getCheckInsByTrip(tripId);
    const stats = await this.checkInService.getTripCheckInStats(tripId);

    return {
      success: true,
      data: {
        checkIns: checkIns.map((c) => ({
          id: c.id,
          passengerId: c.passengerId,
          type: c.type,
          timestamp: c.timestamp,
          location: c.location,
        })),
        stats,
      },
    };
  }

  /**
   * 현재 진행 중인 운행 조회
   * GET /driver/trips/in-progress
   */
  @Get('trips/in-progress')
  async getInProgressTrip(@Request() req: JwtRequest) {
    const driverId = req.user.userId;

    const trip = await this.tripService.getInProgressTrip(driverId);

    if (!trip) {
      return {
        success: true,
        data: null,
        message: 'No trip in progress',
      };
    }

    const checkIns = await this.checkInService.getCheckInsByTrip(trip.id);
    const stats = await this.checkInService.getTripCheckInStats(trip.id);

    return {
      success: true,
      data: {
        trip: {
          id: trip.id,
          type: trip.type,
          status: trip.status,
          scheduledStart: trip.scheduledStart,
          actualStart: trip.actualStart,
          startLocation: trip.startLocation,
          vehicleId: trip.vehicleId,
          routeId: trip.routeId,
        },
        checkIns: checkIns.map((c) => ({
          id: c.id,
          passengerId: c.passengerId,
          type: c.type,
          timestamp: c.timestamp,
        })),
        stats,
      },
    };
  }
}
