/**
 * Notification Entity
 * 사용자 알림 엔티티
 */

export type NotificationType =
  | 'TRIP_STARTED'
  | 'APPROACHING'
  | 'ARRIVED'
  | 'BOARDING_CONFIRMED'
  | 'ALIGHTING_CONFIRMED'
  | 'SCHEDULE_CHANGED'
  | 'ROUTE_OPTIMIZED'
  | 'TRIP_CANCELLED';

export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED' | 'READ';

export class Notification {
  readonly id: string;
  readonly recipientId: string; // User or Passenger ID
  readonly type: NotificationType;
  title: string;
  body: string;
  status: NotificationStatus;
  data: any | null;
  sentAt: Date | null;
  readAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: {
    id: string;
    recipientId: string;
    type: NotificationType;
    title: string;
    body: string;
    status?: NotificationStatus;
    data?: any;
    sentAt?: Date | null;
    readAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = props.id;
    this.recipientId = props.recipientId;
    this.type = props.type;
    this.title = props.title;
    this.body = props.body;
    this.status = props.status || 'PENDING';
    this.data = props.data || null;
    this.sentAt = props.sentAt || null;
    this.readAt = props.readAt || null;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  markAsRead(): void {
    if (this.status !== 'READ') {
      this.status = 'READ';
      this.readAt = new Date();
    }
  }

  markAsSent(): void {
    if (this.status === 'PENDING') {
      this.status = 'SENT';
      this.sentAt = new Date();
    }
  }
}
