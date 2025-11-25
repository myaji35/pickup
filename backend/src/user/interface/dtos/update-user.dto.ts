import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Phase 11: UpdateUserDto
 *
 * 사용자 정보 수정 요청 DTO
 */
export class UpdateUserDto {
  @ApiPropertyOptional({
    description: '이름',
    example: '홍길동',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: '활성 상태',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
