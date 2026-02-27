/**
 * Admin Route Controller
 * 경로 최적화 및 관리 API
 */

import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RouteService } from '../../application/services/route.service';
import { OptimizeRouteDto } from '../../application/dto/optimize-route.dto';
import { OptimizeRouteCommand } from '../../application/commands/optimize-route.command';

@ApiTags('Admin - Routes')
@Controller('admin/routes')
export class AdminRouteController {
  constructor(private readonly routeService: RouteService) {}

  /**
   * 경로 최적화 실행
   */
  @Post('optimize')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '경로 최적화 실행' })
  @ApiResponse({
    status: 200,
    description: '경로 최적화 성공',
  })
  @ApiResponse({
    status: 404,
    description: '기관 또는 차량을 찾을 수 없음',
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 (승객 없음, 차량 용량 초과 등)',
  })
  async optimizeRoute(@Body() dto: OptimizeRouteDto) {
    const command = new OptimizeRouteCommand(
      dto.institutionId,
      dto.vehicleId,
      new Date(dto.routeDate),
      dto.shuttleType,
      dto.averageSpeed,
    );

    const route = await this.routeService.optimizeRoute(command);

    return {
      success: true,
      data: {
        id: route.id,
        institutionId: route.institutionId,
        vehicleId: route.vehicleId,
        routeDate: route.routeDate,
        shuttleType: route.shuttleType,
        optimizedSequence: route.optimizedSequence.map((w) => ({
          passengerId: w.passengerId,
          sequence: w.sequence,
          coordinates: {
            lat: w.coordinates.lat,
            lng: w.coordinates.lng,
          },
          address: w.address,
          eta: w.eta,
        })),
        totalDistance: route.totalDistance,
        estimatedDuration: route.estimatedDuration,
        status: route.status,
        optimizationTime: route.optimizationTime,
        solverVersion: route.solverVersion,
        createdAt: route.createdAt,
        updatedAt: route.updatedAt,
      },
      message: `경로 최적화 완료: ${route.optimizedSequence.length}명의 승객, 총 ${route.totalDistance}km, 예상 소요 시간 ${route.estimatedDuration}분`,
    };
  }

  /**
   * 경로 조회 (ID)
   */
  @Get(':id')
  @ApiOperation({ summary: '경로 조회' })
  @ApiResponse({
    status: 200,
    description: '경로 조회 성공',
  })
  @ApiResponse({
    status: 404,
    description: '경로를 찾을 수 없음',
  })
  async getRoute(@Param('id') id: string) {
    const route = await this.routeService.getRouteById(id);

    return {
      success: true,
      data: {
        id: route.id,
        institutionId: route.institutionId,
        vehicleId: route.vehicleId,
        routeDate: route.routeDate,
        shuttleType: route.shuttleType,
        optimizedSequence: route.optimizedSequence.map((w) => ({
          passengerId: w.passengerId,
          sequence: w.sequence,
          coordinates: {
            lat: w.coordinates.lat,
            lng: w.coordinates.lng,
          },
          address: w.address,
          eta: w.eta,
        })),
        totalDistance: route.totalDistance,
        estimatedDuration: route.estimatedDuration,
        status: route.status,
        optimizationTime: route.optimizationTime,
        solverVersion: route.solverVersion,
        passengerCount: route.getPassengerCount(),
        averageSpeed: route.getAverageSpeed(),
        createdAt: route.createdAt,
        updatedAt: route.updatedAt,
      },
    };
  }

  /**
   * 기관의 경로 목록 조회
   */
  @Get('institution/:institutionId')
  @ApiOperation({ summary: '기관의 경로 목록 조회' })
  @ApiResponse({
    status: 200,
    description: '경로 목록 조회 성공',
  })
  async getRoutesByInstitution(@Param('institutionId') institutionId: string) {
    const routes = await this.routeService.getRoutesByInstitution(
      institutionId,
    );

    return {
      success: true,
      data: routes.map((route) => ({
        id: route.id,
        institutionId: route.institutionId,
        vehicleId: route.vehicleId,
        routeDate: route.routeDate,
        shuttleType: route.shuttleType,
        totalDistance: route.totalDistance,
        estimatedDuration: route.estimatedDuration,
        status: route.status,
        passengerCount: route.getPassengerCount(),
        createdAt: route.createdAt,
      })),
      count: routes.length,
    };
  }

  /**
   * 차량의 경로 목록 조회
   */
  @Get('vehicle/:vehicleId')
  @ApiOperation({ summary: '차량의 경로 목록 조회' })
  @ApiResponse({
    status: 200,
    description: '경로 목록 조회 성공',
  })
  async getRoutesByVehicle(@Param('vehicleId') vehicleId: string) {
    const routes = await this.routeService.getRoutesByVehicle(vehicleId);

    return {
      success: true,
      data: routes.map((route) => ({
        id: route.id,
        institutionId: route.institutionId,
        vehicleId: route.vehicleId,
        routeDate: route.routeDate,
        shuttleType: route.shuttleType,
        totalDistance: route.totalDistance,
        estimatedDuration: route.estimatedDuration,
        status: route.status,
        passengerCount: route.getPassengerCount(),
        createdAt: route.createdAt,
      })),
      count: routes.length,
    };
  }

  /**
   * 운행 시작
   */
  @Post(':id/start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '운행 시작' })
  @ApiResponse({
    status: 200,
    description: '운행 시작 성공',
  })
  @ApiResponse({
    status: 404,
    description: '경로를 찾을 수 없음',
  })
  @ApiResponse({
    status: 400,
    description: '경로가 최적화되지 않음',
  })
  async startRoute(@Param('id') id: string) {
    const route = await this.routeService.startRoute(id);

    return {
      success: true,
      data: {
        id: route.id,
        status: route.status,
      },
      message: '운행이 시작되었습니다.',
    };
  }

  /**
   * 운행 완료
   */
  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '운행 완료' })
  @ApiResponse({
    status: 200,
    description: '운행 완료 성공',
  })
  @ApiResponse({
    status: 404,
    description: '경로를 찾을 수 없음',
  })
  @ApiResponse({
    status: 400,
    description: '운행 중이 아님',
  })
  async completeRoute(@Param('id') id: string) {
    const route = await this.routeService.completeRoute(id);

    return {
      success: true,
      data: {
        id: route.id,
        status: route.status,
      },
      message: '운행이 완료되었습니다.',
    };
  }
}
