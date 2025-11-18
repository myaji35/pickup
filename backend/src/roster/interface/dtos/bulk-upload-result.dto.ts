import { ApiProperty } from '@nestjs/swagger';

/**
 * T285: BulkUploadResultDto
 * CSV 일괄 업로드 결과 응답 DTO
 */

export class BulkUploadRowErrorDto {
  @ApiProperty({ description: '오류가 발생한 행 번호' })
  row: number;

  @ApiProperty({ description: '오류가 발생한 필드명' })
  field: string;

  @ApiProperty({ description: '오류 메시지' })
  message: string;

  @ApiProperty({ description: '오류가 발생한 값', required: false })
  value?: string;
}

export class BulkUploadResultDto {
  @ApiProperty({ description: '성공적으로 생성된 승객 수' })
  created: number;

  @ApiProperty({ description: '중복으로 건너뛴 승객 수' })
  skipped: number;

  @ApiProperty({ description: '처리 중 발생한 오류 목록', type: [BulkUploadRowErrorDto] })
  errors: BulkUploadRowErrorDto[];

  @ApiProperty({ description: '총 처리된 행 수' })
  totalProcessed: number;
}
