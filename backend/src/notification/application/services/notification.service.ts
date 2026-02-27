import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Notification, NotificationType } from '../../domain/entities/notification.entity';

/**
 * Notification Service
 * 알림 생성, 조회, 읽음 처리
 */
@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 알림 생성
   */
  async createNotification(
    recipientId: string,
    type: NotificationType,
    title: string,
    body: string,
    data?: any,
  ): Promise<Notification> {
    const notification = await this.prisma.notification.create({
      data: {
        recipientId,
        type,
        title,
        body,
        data: data || null,
        status: 'SENT', // 즉시 발송으로 처리
        sentAt: new Date(),
      },
    });

    return new Notification({
      id: notification.id,
      recipientId: notification.recipientId,
      type: notification.type as NotificationType,
      title: notification.title,
      body: notification.body,
      status: notification.status as any,
      data: notification.data,
      sentAt: notification.sentAt,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    });
  }

  /**
   * 사용자의 모든 알림 조회
   */
  async getUserNotifications(recipientId: string, limit: number = 50): Promise<Notification[]> {
    const notifications = await this.prisma.notification.findMany({
      where: { recipientId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return notifications.map(
      (n) =>
        new Notification({
          id: n.id,
          recipientId: n.recipientId,
          type: n.type as NotificationType,
          title: n.title,
          body: n.body,
          status: n.status as any,
          data: n.data,
          sentAt: n.sentAt,
          readAt: n.readAt,
          createdAt: n.createdAt,
          updatedAt: n.updatedAt,
        }),
    );
  }

  /**
   * 읽지 않은 알림 개수
   */
  async getUnreadCount(recipientId: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        recipientId,
        status: { not: 'READ' },
      },
    });
  }

  /**
   * 알림 읽음 처리
   */
  async markAsRead(notificationId: string, recipientId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: {
        id: notificationId,
        recipientId, // 본인 알림만 수정 가능
      },
      data: {
        status: 'READ',
        readAt: new Date(),
      },
    });
  }

  /**
   * 모든 알림 읽음 처리
   */
  async markAllAsRead(recipientId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: {
        recipientId,
        status: { not: 'READ' },
      },
      data: {
        status: 'READ',
        readAt: new Date(),
      },
    });
  }

  /**
   * 알림 삭제
   */
  async deleteNotification(notificationId: string, recipientId: string): Promise<void> {
    await this.prisma.notification.deleteMany({
      where: {
        id: notificationId,
        recipientId, // 본인 알림만 삭제 가능
      },
    });
  }
}
