import { IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * T351: PassengerScheduleDto
 * 승객 스케줄 생성/수정용 DTO
 */
export class PassengerScheduleDto {
  @ApiProperty({
    description: '탑승 시간 (HH:MM 형식)',
    example: '08:00',
    pattern: '^([0-1]\\d|2[0-3]):([0-5]\\d)$',
  })
  @IsString()
  @Matches(/^([0-1]\d|2[0-3]):([0-5]\d)$/, {
    message: 'pickupTime must be in HH:MM format (00:00-23:59)',
  })
  pickupTime: string;

  @ApiProperty({
    description: '하차 시간 (HH:MM 형식)',
    example: '17:00',
    pattern: '^([0-1]\\d|2[0-3]):([0-5]\\d)$',
  })
  @IsString()
  @Matches(/^([0-1]\d|2[0-3]):([0-5]\d)$/, {
    message: 'dropoffTime must be in HH:MM format (00:00-23:59)',
  })
  dropoffTime: string;
}
