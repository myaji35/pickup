import { ApiProperty } from '@nestjs/swagger';
import { InstitutionType } from '../../domain/entities/institution-type.entity';

/**
 * T387: InstitutionTypeResponseDto
 * 기관 유형 응답용 DTO
 */
export class InstitutionTypeResponseDto {
  @ApiProperty({ description: '기관 유형 ID', example: 'type-uuid-123' })
  id: string;

  @ApiProperty({ description: '기관 유형 코드', example: 'DAYCARE' })
  typeCode: string;

  @ApiProperty({ description: '기관 유형 이름', example: '주간보호' })
  typeName: string;

  @ApiProperty({
    description: '최소 케어 시간 (시간 단위, null이면 검증 없음)',
    example: 8,
    required: false,
    nullable: true,
  })
  minimumCareTimeHours: number | null;

  @ApiProperty({ description: '생성 시각' })
  createdAt: Date;

  @ApiProperty({ description: '수정 시각' })
  updatedAt: Date;

  /**
   * Domain Entity로부터 DTO 생성
   */
  static fromDomain(institutionType: InstitutionType): InstitutionTypeResponseDto {
    const dto = new InstitutionTypeResponseDto();
    dto.id = institutionType.id;
    dto.typeCode = institutionType.typeCode;
    dto.typeName = institutionType.typeName;
    dto.minimumCareTimeHours = institutionType.minimumCareTimeHours;
    dto.createdAt = institutionType.createdAt;
    dto.updatedAt = institutionType.updatedAt;
    return dto;
  }

  /**
   * Domain Entity 배열로부터 DTO 배열 생성
   */
  static fromDomainArray(institutionTypes: InstitutionType[]): InstitutionTypeResponseDto[] {
    return institutionTypes.map((type) => InstitutionTypeResponseDto.fromDomain(type));
  }
}
