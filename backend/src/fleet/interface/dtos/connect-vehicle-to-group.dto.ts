import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty } from 'class-validator';

/**
 * T255: ConnectVehicleToGroupDto
 * 차량을 그룹에 연결하기 위한 요청 DTO
 */
export class ConnectVehicleToGroupDto {
  @ApiProperty({
    description: '연결할 승객 그룹 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID('4', { message: 'Group ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Group ID is required' })
  groupId: string;
}
