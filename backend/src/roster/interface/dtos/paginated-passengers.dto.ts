import { ApiProperty } from '@nestjs/swagger';
import { PassengerResponseDto } from './passenger-response.dto';

/**
 * Paginated Passengers Response DTO
 * 페이지네이션된 승객 목록 응답
 */
export class PaginatedPassengersDto {
  @ApiProperty({
    description: '승객 목록',
    type: [PassengerResponseDto],
  })
  data: PassengerResponseDto[];

  @ApiProperty({
    description: '총 개수',
    example: 100,
  })
  total: number;

  @ApiProperty({
    description: '현재 페이지',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: '페이지당 항목 수',
    example: 10,
  })
  limit: number;

  @ApiProperty({
    description: '총 페이지 수',
    example: 10,
  })
  totalPages: number;
}
