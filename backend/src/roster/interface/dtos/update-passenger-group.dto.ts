import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

/**
 * Update Passenger Group DTO
 */
export class UpdatePassengerGroupDto {
  @ApiProperty({
    description: '그룹 이름',
    example: 'Evening Group B',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;
}
