import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

/**
 * T402: UpdateInstitutionDto
 * 기관 정보 업데이트용 DTO
 */
export class UpdateInstitutionDto {
  @ApiProperty({
    description: '기관명',
    example: '서울 행복요양센터',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Name must not be empty' })
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  name?: string;

  @ApiProperty({
    description: '기관 유형 ID (null로 설정하면 유형 제거)',
    example: 'type-uuid-123',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  institutionTypeId?: string | null;
}
