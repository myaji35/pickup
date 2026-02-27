/**
 * Admin Subscription Controller
 * SUPER_ADMIN 전용 구독 관리 API
 */

import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../user/application/guards/jwt-auth.guard';
import { RolesGuard } from '../../../user/application/guards/roles.guard';
import { Roles } from '../../../user/application/decorators/roles.decorator';
import { SubscriptionService } from '../../application/services/subscription.service';

@ApiTags('Admin - Subscriptions')
@Controller('admin/subscriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
@ApiBearerAuth()
export class AdminSubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  /**
   * 전체 구독 목록 조회
   */
  @Get()
  @ApiOperation({
    summary: '전체 구독 목록 조회',
    description: 'SUPER_ADMIN이 모든 구독을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '구독 목록 조회 성공',
  })
  async getAllSubscriptions(@Query('status') status?: string) {
    try {
      const subscriptions = await this.subscriptionService.getAllSubscriptions(status);

      return {
        statusCode: 200,
        message: 'Success',
        data: subscriptions,
      };
    } catch (error: any) {
      return {
        statusCode: 500,
        message: error.message,
      };
    }
  }

  /**
   * 기관의 구독 정보 조회
   */
  @Get('institution/:institutionId')
  @ApiOperation({
    summary: '기관의 구독 정보 조회',
    description: '특정 기관의 활성 구독을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '구독 조회 성공',
  })
  @ApiResponse({
    status: 404,
    description: '활성 구독이 없음',
  })
  async getInstitutionSubscription(@Param('institutionId') institutionId: string) {
    try {
      const subscription = await this.subscriptionService.getActiveSubscription(institutionId);

      return {
        statusCode: 200,
        message: 'Success',
        data: subscription,
      };
    } catch (error: any) {
      return {
        statusCode: 404,
        message: error.message,
      };
    }
  }

  /**
   * 구독 생성 (기관에 구독 할당)
   */
  @Post()
  @ApiOperation({
    summary: '구독 생성',
    description: 'SUPER_ADMIN이 기관에 구독을 생성합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '구독 생성 성공',
  })
  async createSubscription(
    @Body() dto: { institutionId: string; planId: string; autoRenew?: boolean },
  ) {
    try {
      const subscription = await this.subscriptionService.createSubscription(
        dto.institutionId,
        dto.planId,
        dto.autoRenew,
      );

      return {
        statusCode: 201,
        message: 'Subscription created successfully',
        data: subscription,
      };
    } catch (error: any) {
      return {
        statusCode: 400,
        message: error.message,
      };
    }
  }

  /**
   * 구독 강제 취소
   */
  @Post(':id/force-cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '구독 강제 취소',
    description: 'SUPER_ADMIN이 구독을 강제로 취소합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '구독 취소 성공',
  })
  async forceCancelSubscription(@Param('id') id: string) {
    try {
      // Get subscription to find institutionId
      const subscription = await this.subscriptionService.getSubscriptionById(id);
      const cancelledSubscription = await this.subscriptionService.cancelSubscription(
        subscription.institutionId,
      );

      return {
        statusCode: 200,
        message: 'Subscription cancelled successfully',
        data: cancelledSubscription,
      };
    } catch (error: any) {
      return {
        statusCode: 404,
        message: error.message,
      };
    }
  }
}
