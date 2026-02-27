import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../user/application/guards/jwt-auth.guard';
import { RolesGuard } from '../../../user/application/guards/roles.guard';
import { Roles } from '../../../user/application/decorators/roles.decorator';
import { InstitutionRepository } from '../../infrastructure/persistence/institution.repository';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * T486-T490: Admin Statistics API
 *
 * Phase 11: SUPER_ADMIN 전용 통계 API
 */
@ApiTags('Admin - Statistics')
@Controller('admin/stats')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
@ApiBearerAuth()
export class AdminStatsController {
  constructor(
    private readonly institutionRepository: InstitutionRepository,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * T486: GET /admin/stats/overview - 전체 통계
   */
  @Get('overview')
  @ApiOperation({
    summary: '전체 통계 조회',
    description: 'SUPER_ADMIN이 시스템 전체 통계를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '전체 통계 조회 성공',
  })
  async getOverview() {
    // 회원사 수 (상태별)
    const institutionTotal = await this.institutionRepository.count();
    const institutionPending = await this.institutionRepository.count('PENDING');
    const institutionActive = await this.institutionRepository.count('ACTIVE');
    const institutionSuspended = await this.institutionRepository.count('SUSPENDED');
    const institutionInactive = await this.institutionRepository.count('INACTIVE');

    // 총 차량 수
    const totalVehicles = await this.prisma.vehicle.count();

    // 총 승객 수
    const totalPassengers = await this.prisma.passenger.count();

    // 이번 달 신규 가입
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const newInstitutionsThisMonth = await this.prisma.institution.count({
      where: {
        createdAt: {
          gte: firstDayOfMonth,
        },
      },
    });

    return {
      statusCode: 200,
      message: 'Success',
      data: {
        institutions: {
          total: institutionTotal,
          pending: institutionPending,
          active: institutionActive,
          suspended: institutionSuspended,
          inactive: institutionInactive,
        },
        vehicles: {
          total: totalVehicles,
        },
        passengers: {
          total: totalPassengers,
        },
        newInstitutionsThisMonth,
      },
    };
  }

  /**
   * T487: GET /admin/stats/institutions - 회원사별 사용 현황
   */
  @Get('institutions')
  @ApiOperation({
    summary: '회원사별 사용 현황',
    description: 'SUPER_ADMIN이 모든 회원사의 사용 현황을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '회원사별 사용 현황 조회 성공',
  })
  async getInstitutionUsage() {
    const institutions = await this.institutionRepository.findAll();

    const usageData = await Promise.all(
      institutions.map(async (institution) => {
        const vehicleCount = await this.prisma.vehicle.count({
          where: { institutionId: institution.id },
        });

        const passengerCount = await this.prisma.passenger.count({
          where: { institutionId: institution.id },
        });

        const subscription = await this.prisma.subscription.findFirst({
          where: {
            institutionId: institution.id,
            status: {
              in: ['ACTIVE', 'TRIAL'],
            },
          },
          include: {
            plan: true,
          },
        });

        return {
          institutionId: institution.id,
          institutionName: institution.name,
          status: institution.status,
          vehicleCount,
          passengerCount,
          plan: subscription?.plan
            ? {
                name: subscription.plan.name,
                maxVehicles: subscription.plan.maxVehicles,
                maxPassengers: subscription.plan.maxPassengers,
              }
            : null,
          subscription: subscription
            ? {
                status: subscription.status,
                startDate: subscription.startDate,
              }
            : null,
        };
      }),
    );

    return {
      statusCode: 200,
      message: 'Success',
      data: usageData,
    };
  }

  /**
   * T488: GET /admin/stats/revenue - 매출 통계 (구독 기반)
   */
  @Get('revenue')
  @ApiOperation({
    summary: '매출 통계',
    description: 'SUPER_ADMIN이 구독 기반 매출 통계를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '매출 통계 조회 성공',
  })
  async getRevenue() {
    // 활성 구독 조회
    const activeSubscriptions = await this.prisma.subscription.findMany({
      where: {
        status: {
          in: ['ACTIVE', 'TRIAL'],
        },
      },
      include: {
        plan: true,
      },
    });

    // 요금제별 매출 계산
    const totalRevenue = activeSubscriptions.reduce((sum, sub) => {
      if (sub.status === 'ACTIVE') {
        return sum + sub.plan.monthlyPrice;
      }
      return sum; // TRIAL은 제외
    }, 0);

    // 요금제별 구독 수
    const planBreakdown = await this.prisma.subscription.groupBy({
      by: ['planId', 'status'],
      where: {
        status: {
          in: ['ACTIVE', 'TRIAL'],
        },
      },
      _count: true,
    });

    const planDetails = await Promise.all(
      planBreakdown.map(async (item) => {
        const plan = await this.prisma.plan.findUnique({
          where: { id: item.planId },
        });

        return {
          planName: plan?.name || 'Unknown',
          planCode: plan?.code || 'UNKNOWN',
          monthlyPrice: plan?.monthlyPrice || 0,
          subscriptionCount: item._count,
          status: item.status,
          revenue: item.status === 'ACTIVE' ? (plan?.monthlyPrice || 0) * item._count : 0,
        };
      }),
    );

    return {
      statusCode: 200,
      message: 'Success',
      data: {
        totalMonthlyRevenue: totalRevenue,
        activeSubscriptions: activeSubscriptions.filter((s) => s.status === 'ACTIVE').length,
        trialSubscriptions: activeSubscriptions.filter((s) => s.status === 'TRIAL').length,
        planBreakdown: planDetails,
      },
    };
  }

  /**
   * T489: GET /admin/institutions/:id/stats - 특정 회원사 통계
   */
  @Get('institutions/:id')
  @ApiOperation({
    summary: '특정 회원사 통계',
    description: 'SUPER_ADMIN이 특정 회원사의 상세 통계를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '회원사 통계 조회 성공',
  })
  @ApiResponse({
    status: 404,
    description: '회원사를 찾을 수 없음',
  })
  async getInstitutionStats(@Param('id') id: string) {
    const institution = await this.institutionRepository.findById(id);
    if (!institution) {
      return {
        statusCode: 404,
        message: 'Institution not found',
      };
    }

    const vehicleCount = await this.prisma.vehicle.count({
      where: { institutionId: id },
    });

    const passengerCount = await this.prisma.passenger.count({
      where: { institutionId: id },
    });

    const passengerGroupCount = await this.prisma.passengerGroup.count({
      where: { institutionId: id },
    });

    const subscription = await this.prisma.subscription.findFirst({
      where: {
        institutionId: id,
        status: {
          in: ['ACTIVE', 'TRIAL'],
        },
      },
      include: {
        plan: true,
      },
    });

    return {
      statusCode: 200,
      message: 'Success',
      data: {
        institution: {
          id: institution.id,
          name: institution.name,
          status: institution.status,
          createdAt: institution.createdAt,
        },
        usage: {
          vehicles: vehicleCount,
          passengers: passengerCount,
          passengerGroups: passengerGroupCount,
        },
        subscription: subscription
          ? {
              status: subscription.status,
              planName: subscription.plan.name,
              monthlyPrice: subscription.plan.monthlyPrice,
              maxVehicles: subscription.plan.maxVehicles,
              maxPassengers: subscription.plan.maxPassengers,
              startDate: subscription.startDate,
              trialEndsAt: subscription.trialEndsAt,
            }
          : null,
      },
    };
  }
}
