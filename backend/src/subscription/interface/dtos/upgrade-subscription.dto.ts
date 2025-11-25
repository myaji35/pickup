import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Phase 11: UpgradeSubscriptionDto
 *
 * 요금제 업그레이드 요청 DTO
 */
export class UpgradeSubscriptionDto {
  @ApiProperty({
    description: '새 요금제 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsNotEmpty()
  @IsString()
  newPlanId: string;
}
