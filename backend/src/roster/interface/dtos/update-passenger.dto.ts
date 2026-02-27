import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, Matches } from 'class-validator';

/**
 * Update Passenger DTO
 */
export class UpdatePassengerDto {
  @ApiPropertyOptional({
    description: '승객 이름',
    example: '김철수',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: '전화번호 (한국 형식)',
    example: '010-9999-8888',
  })
  @IsOptional()
  @IsString()
  @Matches(/^01[016789]-?\d{3,4}-?\d{4}$/, {
    message: 'Invalid Korean phone number format',
  })
  phoneNumber?: string;

  @ApiPropertyOptional({
    description: '그룹 ID (null이면 그룹 해제)',
    example: 'group-123',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  groupId?: string | null;
}
