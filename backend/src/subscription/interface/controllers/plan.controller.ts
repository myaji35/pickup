import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PlanService } from '../../application/services/plan.service';
import { Public } from '../../../user/application/decorators/public.decorator';

/**
 * T461: Plan API Controller
 *
 * Phase 11: 요금제 조회 API (Public)
 */
@ApiTags('Plans')
@Controller('plans')
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  /**
   * T461: GET /plans - 요금제 목록 조회 (Public)
   */
  @Get()
  @Public()
  @ApiOperation({
    summary: '요금제 목록 조회',
    description: '모든 활성 요금제를 조회합니다. (인증 불필요)',
  })
  @ApiResponse({
    status: 200,
    description: '요금제 목록 조회 성공',
  })
  async getAllPlans() {
    const plans = await this.planService.getAllPlans(true); // 활성 요금제만

    return {
      statusCode: 200,
      message: 'Success',
      data: plans,
    };
  }
}
