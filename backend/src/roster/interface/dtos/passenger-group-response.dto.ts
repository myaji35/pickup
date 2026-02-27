import { ApiProperty } from '@nestjs/swagger';
import { PassengerGroup } from '../../domain/entities/passenger-group.entity';

/**
 * Passenger Group Response DTO
 * 도메인 엔티티를 HTTP 응답으로 변환
 */
export class PassengerGroupResponseDto {
  @ApiProperty({
    description: '그룹 ID',
    example: 'grp-123',
  })
  id: string;

  @ApiProperty({
    description: '기관 ID',
    example: 'inst-123',
  })
  institutionId: string;

  @ApiProperty({
    description: '그룹 코드',
    example: 'GRP001',
  })
  groupCode: string;

  @ApiProperty({
    description: '그룹 이름',
    example: 'Morning Group A',
  })
  name: string;

  @ApiProperty({
    description: '총 승객 수',
    example: 5,
  })
  totalPassengerCount: number;

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
  static fromDomain(group: PassengerGroup): PassengerGroupResponseDto {
    return {
      id: group.id,
      institutionId: group.institutionId,
      groupCode: group.groupCode.value,
      name: group.name,
      totalPassengerCount: group.totalPassengerCount,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    };
  }

  /**
   * 도메인 엔티티 배열을 DTO 배열로 변환
   */
  static fromDomainArray(groups: PassengerGroup[]): PassengerGroupResponseDto[] {
    return groups.map((g) => PassengerGroupResponseDto.fromDomain(g));
  }
}
