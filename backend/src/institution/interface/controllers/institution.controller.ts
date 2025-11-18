import { Controller, Get, Patch, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { InstitutionService } from '../../application/services/institution.service';
import { InstitutionResponseDto } from '../dtos/institution-response.dto';
import { UpdateInstitutionDto } from '../dtos/update-institution.dto';
import { UpdateInstitutionCommand } from '../../application/commands/update-institution.command';

/**
 * T403: InstitutionController
 * 기관 REST API
 */
@ApiTags('Institutions')
@Controller('institutions')
export class InstitutionController {
  constructor(private readonly institutionService: InstitutionService) {}

  /**
   * T404: GET /institutions/:id - 기관 상세 조회
   */
  @Get(':id')
  @ApiOperation({
    summary: '기관 상세 조회',
    description: 'ID로 특정 기관을 조회합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '기관 ID',
    example: 'institution-uuid-123',
  })
  @ApiResponse({
    status: 200,
    description: '기관 상세 정보',
    type: InstitutionResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '기관을 찾을 수 없음',
  })
  async findOne(@Param('id') id: string): Promise<InstitutionResponseDto> {
    const institution = await this.institutionService.getInstitutionById(id);
    return InstitutionResponseDto.fromDomain(institution);
  }

  /**
   * T405: PATCH /institutions/:id - 기관 정보 업데이트 (이름, 유형 변경)
   */
  @Patch(':id')
  @ApiOperation({
    summary: '기관 정보 업데이트',
    description: '기관의 이름이나 유형을 변경합니다. 유형 변경 시 케어 시간 검증 규칙이 적용됩니다.',
  })
  @ApiParam({
    name: 'id',
    description: '기관 ID',
    example: 'institution-uuid-123',
  })
  @ApiBody({ type: UpdateInstitutionDto })
  @ApiResponse({
    status: 200,
    description: '업데이트된 기관 정보',
    type: InstitutionResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '기관을 찾을 수 없음',
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateInstitutionDto,
  ): Promise<InstitutionResponseDto> {
    const command = new UpdateInstitutionCommand(
      id,
      dto.name,
      dto.institutionTypeId,
    );

    const institution = await this.institutionService.updateInstitution(command);
    return InstitutionResponseDto.fromDomain(institution);
  }
}
