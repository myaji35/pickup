/**
 * Admin Statistics Controller
 * 통계 대시보드 API
 */

import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../user/application/guards/jwt-auth.guard';
import { RolesGuard } from '../../user/application/guards/roles.guard';
import { Roles } from '../../user/application/decorators/roles.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('Admin - Statistics')
@Controller('admin/stats')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
@ApiBearerAuth()
export class StatsController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 전체 통계 대시보드 데이터
   */
  @Get('dashboard')
  @ApiOperation({
    summary: '대시보드 통계 조회',
    description: '전체 시스템 통계를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '통계 조회 성공',
  })
  async getDashboardStats() {
    try {
      // 기관 통계
      const institutionStats = await this.prisma.institution.groupBy({
        by: ['status'],
        _count: true,
      });

      const totalInstitutions = institutionStats.reduce((sum, stat) => sum + stat._count, 0);
      const activeInstitutions = institutionStats.find((s) => s.status === 'ACTIVE')?._count || 0;
      const pendingInstitutions = institutionStats.find((s) => s.status === 'PENDING')?._count || 0;

      // 차량 통계
      const totalVehicles = await this.prisma.vehicle.count();
      const activeVehicles = await this.prisma.vehicle.count({
        where: { status: 'ACTIVE' },
      });

      // 승객 통계
      const totalPassengers = await this.prisma.passenger.count();

      // 운행 통계 (최근 30일)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const tripStats = await this.prisma.trip.groupBy({
        by: ['status'],
        where: {
          scheduledStartTime: {
            gte: thirtyDaysAgo,
          },
        },
        _count: true,
      });

      const totalTrips = tripStats.reduce((sum, stat) => sum + stat._count, 0);
      const completedTrips = tripStats.find((s) => s.status === 'COMPLETED')?._count || 0;
      const inProgressTrips = tripStats.find((s) => s.status === 'IN_PROGRESS')?._count || 0;
      const completionRate = totalTrips > 0 ? (completedTrips / totalTrips) * 100 : 0;

      // 체크인 통계 (최근 30일)
      const totalCheckIns = await this.prisma.checkIn.count({
        where: {
          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
      });

      const boardingCheckIns = await this.prisma.checkIn.count({
        where: {
          checkType: 'BOARDING',
          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
      });

      const alightingCheckIns = await this.prisma.checkIn.count({
        where: {
          checkType: 'ALIGHTING',
          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
      });

      // 경로 통계
      const totalRoutes = await this.prisma.route.count();
      const optimizedRoutes = await this.prisma.route.count({
        where: { status: 'OPTIMIZED' },
      });

      return {
        statusCode: 200,
        message: 'Success',
        data: {
          institutions: {
            total: totalInstitutions,
            active: activeInstitutions,
            pending: pendingInstitutions,
            byStatus: institutionStats.map((s) => ({
              status: s.status,
              count: s._count,
            })),
          },
          vehicles: {
            total: totalVehicles,
            active: activeVehicles,
          },
          passengers: {
            total: totalPassengers,
          },
          trips: {
            total: totalTrips,
            completed: completedTrips,
            inProgress: inProgressTrips,
            completionRate: Math.round(completionRate * 100) / 100,
            period: '최근 30일',
          },
          checkIns: {
            total: totalCheckIns,
            boarding: boardingCheckIns,
            alighting: alightingCheckIns,
            period: '최근 30일',
          },
          routes: {
            total: totalRoutes,
            optimized: optimizedRoutes,
          },
        },
      };
    } catch (error: any) {
      return {
        statusCode: 500,
        message: error.message || 'Failed to fetch statistics',
      };
    }
  }

  /**
   * 기관별 운행 통계
   */
  @Get('institutions')
  @ApiOperation({
    summary: '기관별 통계 조회',
    description: '각 기관의 운행 통계를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '기관별 통계 조회 성공',
  })
  async getInstitutionStats(@Query('institutionId') institutionId?: string) {
    try {
      const where = institutionId ? { institutionId } : {};

      const institutions = await this.prisma.institution.findMany({
        where: {
          ...where,
          status: 'ACTIVE',
        },
        include: {
          _count: {
            select: {
              vehicles: true,
              passengers: true,
            },
          },
        },
        take: institutionId ? undefined : 10,
        orderBy: {
          createdAt: 'desc',
        },
      });

      const institutionsWithStats = await Promise.all(
        institutions.map(async (institution) => {
          const tripCount = await this.prisma.trip.count({
            where: {
              vehicle: {
                institutionId: institution.id,
              },
            },
          });

          const completedTrips = await this.prisma.trip.count({
            where: {
              vehicle: {
                institutionId: institution.id,
              },
              status: 'COMPLETED',
            },
          });

          return {
            id: institution.id,
            name: institution.name,
            businessRegistrationNumber: institution.businessRegistrationNumber,
            vehicleCount: institution._count.vehicles,
            passengerCount: institution._count.passengers,
            totalTrips: tripCount,
            completedTrips,
            completionRate: tripCount > 0 ? Math.round((completedTrips / tripCount) * 100) : 0,
          };
        }),
      );

      return {
        statusCode: 200,
        message: 'Success',
        data: institutionsWithStats,
      };
    } catch (error: any) {
      return {
        statusCode: 500,
        message: error.message || 'Failed to fetch institution statistics',
      };
    }
  }

  /**
   * 최근 활동 로그
   */
  @Get('recent-activity')
  @ApiOperation({
    summary: '최근 활동 조회',
    description: '시스템의 최근 활동을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '최근 활동 조회 성공',
  })
  async getRecentActivity(@Query('limit') limit?: number) {
    try {
      const activityLimit = limit ? parseInt(String(limit)) : 20;

      // 최근 운행
      const recentTrips = await this.prisma.trip.findMany({
        take: activityLimit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          vehicle: {
            include: {
              institution: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      // 최근 체크인
      const recentCheckIns = await this.prisma.checkIn.findMany({
        take: activityLimit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          trip: {
            include: {
              vehicle: {
                include: {
                  institution: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
          passenger: {
            select: {
              name: true,
            },
          },
        },
      });

      return {
        statusCode: 200,
        message: 'Success',
        data: {
          trips: recentTrips.map((trip) => ({
            id: trip.id,
            institutionName: trip.vehicle.institution.name,
            vehiclePlate: trip.vehicle.licensePlate,
            status: trip.status,
            shuttleType: trip.shuttleType,
            scheduledStartTime: trip.scheduledStartTime,
            createdAt: trip.createdAt,
          })),
          checkIns: recentCheckIns.map((checkIn) => ({
            id: checkIn.id,
            passengerName: checkIn.passenger.name,
            institutionName: checkIn.trip.vehicle.institution.name,
            checkType: checkIn.checkType,
            createdAt: checkIn.createdAt,
          })),
        },
      };
    } catch (error: any) {
      return {
        statusCode: 500,
        message: error.message || 'Failed to fetch recent activity',
      };
    }
  }
}
