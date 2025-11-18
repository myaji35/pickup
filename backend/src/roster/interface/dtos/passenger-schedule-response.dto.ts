import { ApiProperty } from '@nestjs/swagger';
import { PassengerSchedule } from '../../domain/entities/passenger-schedule.entity';

/**
 * T352: PassengerScheduleResponseDto
 * 승객 스케줄 응답용 DTO
 */
export class PassengerScheduleResponseDto {
  @ApiProperty({ description: '스케줄 ID', example: 'schedule-uuid-123' })
  id: string;

  @ApiProperty({ description: '승객 ID', example: 'passenger-uuid-123' })
  passengerId: string;

  @ApiProperty({ description: '탑승 시간 (HH:MM)', example: '08:00' })
  pickupTime: string;

  @ApiProperty({ description: '하차 시간 (HH:MM)', example: '17:00' })
  dropoffTime: string;

  @ApiProperty({ description: '케어 시간 (시간 단위)', example: 9 })
  careTimeHours: number;

  @ApiProperty({ description: '케어 시간 부족 여부 (< 8시간)', example: false })
  isCareTimeInsufficient: boolean;

  @ApiProperty({
    description: '경고 메시지 (케어 시간이 8시간 미만일 때)',
    example: 'Care time is less than 8 hours (7 hours)',
    required: false,
  })
  warning?: string;

  @ApiProperty({ description: '생성 시각' })
  createdAt: Date;

  @ApiProperty({ description: '수정 시각' })
  updatedAt: Date;

  /**
   * Domain Entity로부터 DTO 생성
   */
  static fromDomain(schedule: PassengerSchedule, warning?: string): PassengerScheduleResponseDto {
    const dto = new PassengerScheduleResponseDto();
    dto.id = schedule.id;
    dto.passengerId = schedule.passengerId;
    dto.pickupTime = schedule.pickupTime;
    dto.dropoffTime = schedule.dropoffTime;
    dto.careTimeHours = schedule.careTimeHours;
    dto.isCareTimeInsufficient = schedule.isCareTimeInsufficient;
    dto.createdAt = schedule.createdAt;
    dto.updatedAt = schedule.updatedAt;
    dto.warning = warning;
    return dto;
  }
}
