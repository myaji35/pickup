import { Controller, Get, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../user/application/guards/jwt-auth.guard';
import { RolesGuard } from '../../../user/application/guards/roles.guard';
import { Roles } from '../../../user/application/decorators/roles.decorator';
import { CurrentUser } from '../../../user/application/decorators/current-user.decorator';
import { User } from '../../../user/domain/entities/user.entity';
import { SubscriptionService } from '../../application/services/subscription.service';
import { UpgradeSubscriptionDto } from '../dtos/upgrade-subscription.dto';

/**
 * T462-T463: Subscription API Controller
 *
 * Phase 11: 회원사 구독 관리 API
 */
@ApiTags('Subscriptions')
@Controller('institutions/me/subscription')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('INSTITUTION_ADMIN')
@ApiBearerAuth()
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  /**
   * T462: GET /institutions/me/subscription - 내 구독 정보 조회
   */
  @Get()
  @ApiOperation({
    summary: '내 구독 정보 조회',
    description: '현재 로그인한 회원사의 활성 구독 정보를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '구독 정보 조회 성공',
  })
  @ApiResponse({
    status: 404,
    description: '활성 구독이 없음',
  })
  async getMySubscription(@CurrentUser() user: User) {
    if (!user.institutionId) {
      return {
        statusCode: 400,
        message: 'User is not associated with any institution',
      };
    }

    try {
      const subscription = await this.subscriptionService.getActiveSubscription(
        user.institutionId,
      );

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
   * T463: POST /institutions/me/subscription/upgrade - 요금제 업그레이드
   */
  @Post('upgrade')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '요금제 업그레이드',
    description: '현재 구독의 요금제를 변경합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '요금제 변경 성공',
  })
  @ApiResponse({
    status: 404,
    description: '활성 구독이 없거나 요금제를 찾을 수 없음',
  })
  async upgradeSubscription(
    @CurrentUser() user: User,
    @Body() dto: UpgradeSubscriptionDto,
  ) {
    if (!user.institutionId) {
      return {
        statusCode: 400,
        message: 'User is not associated with any institution',
      };
    }

    try {
      const subscription = await this.subscriptionService.upgradeSubscription(
        user.institutionId,
        dto.newPlanId,
      );

      return {
        statusCode: 200,
        message: 'Subscription upgraded successfully',
        data: subscription,
      };
    } catch (error: any) {
      return {
        statusCode: error.message.includes('not found') ? 404 : 400,
        message: error.message,
      };
    }
  }

  /**
   * Phase 11: 구독 취소
   */
  @Post('cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '구독 취소',
    description: '현재 활성 구독을 취소합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '구독 취소 성공',
  })
  async cancelSubscription(@CurrentUser() user: User) {
    if (!user.institutionId) {
      return {
        statusCode: 400,
        message: 'User is not associated with any institution',
      };
    }

    try {
      const subscription = await this.subscriptionService.cancelSubscription(
        user.institutionId,
      );

      return {
        statusCode: 200,
        message: 'Subscription cancelled successfully',
        data: subscription,
      };
    } catch (error: any) {
      return {
        statusCode: 404,
        message: error.message,
      };
    }
  }
}
