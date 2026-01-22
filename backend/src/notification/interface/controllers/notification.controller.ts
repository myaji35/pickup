import { Controller, Get, Post, Patch, Delete, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../user/application/guards/jwt-auth.guard';
import { CurrentUser } from '../../../user/application/decorators/current-user.decorator';
import { User } from '../../../user/domain/entities/user.entity';
import { NotificationService } from '../../application/services/notification.service';

/**
 * Notification Controller
 * 알림 REST API
 */
@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  /**
   * 내 알림 목록 조회
   */
  @Get()
  @ApiOperation({
    summary: '내 알림 목록',
    description: '현재 로그인한 사용자의 알림 목록을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '알림 목록 조회 성공',
  })
  async getMyNotifications(@CurrentUser() user: User, @Query('limit') limit?: number) {
    try {
      const notifications = await this.notificationService.getUserNotifications(
        user.id,
        limit ? parseInt(limit.toString()) : 50,
      );

      return {
        statusCode: 200,
        message: 'Success',
        data: notifications,
      };
    } catch (error: any) {
      return {
        statusCode: 500,
        message: error.message,
      };
    }
  }

  /**
   * 읽지 않은 알림 개수
   */
  @Get('unread-count')
  @ApiOperation({
    summary: '읽지 않은 알림 개수',
    description: '현재 로그인한 사용자의 읽지 않은 알림 개수를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '개수 조회 성공',
  })
  async getUnreadCount(@CurrentUser() user: User) {
    try {
      const count = await this.notificationService.getUnreadCount(user.id);

      return {
        statusCode: 200,
        message: 'Success',
        data: { count },
      };
    } catch (error: any) {
      return {
        statusCode: 500,
        message: error.message,
      };
    }
  }

  /**
   * 알림 읽음 처리
   */
  @Patch(':id/read')
  @ApiOperation({
    summary: '알림 읽음 처리',
    description: '특정 알림을 읽음으로 표시합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '읽음 처리 성공',
  })
  async markAsRead(@Param('id') id: string, @CurrentUser() user: User) {
    try {
      await this.notificationService.markAsRead(id, user.id);

      return {
        statusCode: 200,
        message: 'Notification marked as read',
      };
    } catch (error: any) {
      return {
        statusCode: 500,
        message: error.message,
      };
    }
  }

  /**
   * 모든 알림 읽음 처리
   */
  @Post('mark-all-read')
  @ApiOperation({
    summary: '모든 알림 읽음 처리',
    description: '사용자의 모든 알림을 읽음으로 표시합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '모든 알림 읽음 처리 성공',
  })
  async markAllAsRead(@CurrentUser() user: User) {
    try {
      await this.notificationService.markAllAsRead(user.id);

      return {
        statusCode: 200,
        message: 'All notifications marked as read',
      };
    } catch (error: any) {
      return {
        statusCode: 500,
        message: error.message,
      };
    }
  }

  /**
   * 알림 삭제
   */
  @Delete(':id')
  @ApiOperation({
    summary: '알림 삭제',
    description: '특정 알림을 삭제합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '삭제 성공',
  })
  async deleteNotification(@Param('id') id: string, @CurrentUser() user: User) {
    try {
      await this.notificationService.deleteNotification(id, user.id);

      return {
        statusCode: 200,
        message: 'Notification deleted',
      };
    } catch (error: any) {
      return {
        statusCode: 500,
        message: error.message,
      };
    }
  }
}
