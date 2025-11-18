import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Vehicle } from '../../../domain/entities/vehicle.entity';

/**
 * VehicleResponseDto
 * 차량 조회 응답 DTO
 */
export class VehicleResponseDto {
  @ApiProperty({
    description: '차량 ID',
    example: 'uuid-123',
  })
  id: string;

  @ApiProperty({
    description: '차량번호 뒤 4자리',
    example: '1234',
  })
  lastFourDigits: string;

  @ApiProperty({
    description: '승객 정원',
    example: 10,
  })
  passengerCapacity: number;

  @ApiProperty({
    description: '기관 ID',
    example: 'institution-uuid-456',
  })
  institutionId: string;

  @ApiPropertyOptional({
    description: '현재 배정된 승객 그룹 ID',
    example: 'group-uuid-789',
    nullable: true,
  })
  currentGroupId: string | null;

  @ApiProperty({
    description: '생성일시',
    example: '2025-01-18T12:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: '수정일시',
    example: '2025-01-18T12:30:00Z',
  })
  updatedAt: Date;

  /**
   * Domain Entity를 DTO로 변환
   */
  static fromDomain(vehicle: Vehicle): VehicleResponseDto {
    const dto = new VehicleResponseDto();
    dto.id = vehicle.id;
    dto.lastFourDigits = vehicle.lastFourDigits.value;
    dto.passengerCapacity = vehicle.passengerCapacity.value;
    dto.institutionId = vehicle.institutionId;
    dto.currentGroupId = vehicle.currentGroupId;
    dto.createdAt = vehicle.createdAt;
    dto.updatedAt = vehicle.updatedAt;
    return dto;
  }
}
