import { ApiProperty } from '@nestjs/swagger';
import { Institution } from '../../domain/entities/institution.entity';

/**
 * T401: InstitutionResponseDto
 * 기관 정보 응답용 DTO
 */
export class InstitutionResponseDto {
  @ApiProperty({ description: '기관 ID', example: 'institution-uuid-123' })
  id: string;

  @ApiProperty({ description: '사업자등록번호', example: '1234567890' })
  businessRegistrationNo: string;

  @ApiProperty({ description: '기관명', example: '서울 행복요양센터' })
  name: string;

  @ApiProperty({
    description: '기관 유형 ID (null이면 미지정)',
    example: 'type-uuid-123',
    required: false,
    nullable: true,
  })
  institutionTypeId: string | null;

  @ApiProperty({ description: '생성 시각' })
  createdAt: Date;

  @ApiProperty({ description: '수정 시각' })
  updatedAt: Date;

  /**
   * Domain Entity로부터 DTO 생성
   */
  static fromDomain(institution: Institution): InstitutionResponseDto {
    const dto = new InstitutionResponseDto();
    dto.id = institution.id;
    dto.businessRegistrationNo = institution.businessRegistrationNo;
    dto.name = institution.name;
    dto.institutionTypeId = institution.institutionTypeId;
    dto.createdAt = institution.createdAt;
    dto.updatedAt = institution.updatedAt;
    return dto;
  }

  /**
   * Domain Entity 배열로부터 DTO 배열 생성
   */
  static fromDomainArray(institutions: Institution[]): InstitutionResponseDto[] {
    return institutions.map((inst) => InstitutionResponseDto.fromDomain(inst));
  }
}
