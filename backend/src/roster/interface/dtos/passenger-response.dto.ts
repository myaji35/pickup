import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Passenger } from '../../domain/entities/passenger.entity';

/**
 * Passenger Response DTO
 * 도메인 엔티티를 HTTP 응답으로 변환
 */
export class PassengerResponseDto {
  @ApiProperty({
    description: '승객 ID',
    example: 'passenger-123',
  })
  id: string;

  @ApiProperty({
    description: '기관 ID',
    example: 'inst-123',
  })
  institutionId: string;

  @ApiProperty({
    description: '승객 이름',
    example: '홍길동',
  })
  name: string;

  @ApiProperty({
    description: '전화번호',
    example: '010-1234-5678',
  })
  phoneNumber: string;

  @ApiProperty({
    description: '픽업 주소',
    example: '서울시 강남구 테헤란로 123',
  })
  pickupAddress: string;

  @ApiProperty({
    description: '드랍오프 주소',
    example: '서울시 서초구 서초대로 456',
  })
  dropoffAddress: string;

  @ApiProperty({
    description: '셔틀 타입',
    enum: ['MORNING', 'EVENING', 'TEMPORARY'],
    example: 'MORNING',
  })
  shuttleType: string;

  @ApiPropertyOptional({
    description: '배정된 그룹 ID',
    example: 'group-123',
    nullable: true,
  })
  groupId: string | null;

  @ApiProperty({
    description: '생성 일시',
    example: '2025-11-18T05:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: '수정 일시',
    example: '2025-11-18T05:00:00.000Z',
  })
  updatedAt: Date;

  /**
   * 도메인 엔티티를 DTO로 변환
   */
  static fromDomain(passenger: Passenger): PassengerResponseDto {
    return {
      id: passenger.id,
      institutionId: passenger.institutionId,
      name: passenger.name,
      phoneNumber: passenger.phoneNumber.value,
      pickupAddress: passenger.pickupAddress.value,
      dropoffAddress: passenger.dropoffAddress.value,
      shuttleType: passenger.shuttleType,
      groupId: passenger.groupId,
      createdAt: passenger.createdAt,
      updatedAt: passenger.updatedAt,
    };
  }

  /**
   * 도메인 엔티티 배열을 DTO 배열로 변환
   */
  static fromDomainArray(passengers: Passenger[]): PassengerResponseDto[] {
    return passengers.map((p) => PassengerResponseDto.fromDomain(p));
  }
}
