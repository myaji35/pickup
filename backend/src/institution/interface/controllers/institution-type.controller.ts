import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { InstitutionTypeService } from '../../application/services/institution-type.service';
import { InstitutionTypeResponseDto } from '../dtos/institution-type-response.dto';
import { GetInstitutionTypesQuery } from '../../application/queries/get-institution-types.query';

/**
 * T388: InstitutionTypeController
 * 기관 유형 REST API
 */
@ApiTags('Institution Types')
@Controller('institution-types')
export class InstitutionTypeController {
  constructor(private readonly institutionTypeService: InstitutionTypeService) {}

  /**
   * T389-T390: GET /institution-types - 모든 기관 유형 조회
   */
  @Get()
  @ApiOperation({
    summary: '기관 유형 목록 조회',
    description: '모든 기관 유형을 조회합니다. (DAYCARE: 8시간 검증, GENERAL: 검증 없음)',
  })
  @ApiResponse({
    status: 200,
    description: '기관 유형 목록',
    type: [InstitutionTypeResponseDto],
  })
  async findAll(): Promise<InstitutionTypeResponseDto[]> {
    const query = new GetInstitutionTypesQuery();
    const institutionTypes = await this.institutionTypeService.getInstitutionTypes(query);
    return InstitutionTypeResponseDto.fromDomainArray(institutionTypes);
  }

  /**
   * GET /institution-types/:id - 특정 기관 유형 조회
   */
  @Get(':id')
  @ApiOperation({
    summary: '기관 유형 상세 조회',
    description: 'ID로 특정 기관 유형을 조회합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '기관 유형 ID',
    example: 'type-uuid-123',
  })
  @ApiResponse({
    status: 200,
    description: '기관 유형 상세 정보',
    type: InstitutionTypeResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '기관 유형을 찾을 수 없음',
  })
  async findOne(@Param('id') id: string): Promise<InstitutionTypeResponseDto> {
    const institutionType = await this.institutionTypeService.getInstitutionTypeById(id);
    return InstitutionTypeResponseDto.fromDomain(institutionType);
  }
}
