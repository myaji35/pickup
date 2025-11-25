import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../user/application/guards/jwt-auth.guard';
import { RolesGuard } from '../../../user/application/guards/roles.guard';
import { Roles } from '../../../user/application/decorators/roles.decorator';
import { PlanService } from '../../application/services/plan.service';
import { CreatePlanDto } from '../dtos/create-plan.dto';
import { UpdatePlanDto } from '../dtos/update-plan.dto';

/**
 * T481-T485: Admin Plan Management API
 *
 * Phase 11: SUPER_ADMIN 전용 요금제 관리 엔드포인트
 */
@ApiTags('Admin - Plans')
@Controller('admin/plans')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
@ApiBearerAuth()
export class AdminPlanController {
  constructor(private readonly planService: PlanService) {}

  /**
   * T481: GET /admin/plans - 요금제 목록 (비활성 포함)
   */
  @Get()
  @ApiOperation({
    summary: '요금제 목록 조회 (Admin)',
    description: 'SUPER_ADMIN이 모든 요금제를 조회합니다. (비활성 요금제 포함)',
  })
  @ApiResponse({
    status: 200,
    description: '요금제 목록 조회 성공',
  })
  async getAllPlans() {
    const plans = await this.planService.getAllPlans(false); // 비활성 포함

    return {
      statusCode: 200,
      message: 'Success',
      data: plans,
    };
  }

  /**
   * T482: POST /admin/plans - 요금제 생성
   */
  @Post()
  @ApiOperation({
    summary: '요금제 생성',
    description: 'SUPER_ADMIN이 새 요금제를 생성합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '요금제 생성 성공',
  })
  @ApiResponse({
    status: 409,
    description: '요금제 코드가 이미 존재함',
  })
  async createPlan(@Body() dto: CreatePlanDto) {
    try {
      const plan = await this.planService.createPlan(
        dto.name,
        dto.code,
        dto.maxVehicles,
        dto.maxPassengers,
        dto.monthlyPrice,
        dto.features,
      );

      return {
        statusCode: 201,
        message: 'Plan created successfully',
        data: plan,
      };
    } catch (error: any) {
      return {
        statusCode: error.message.includes('already exists') ? 409 : 400,
        message: error.message,
      };
    }
  }

  /**
   * T483: PATCH /admin/plans/:id - 요금제 수정
   */
  @Patch(':id')
  @ApiOperation({
    summary: '요금제 수정',
    description: 'SUPER_ADMIN이 요금제 정보를 수정합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '요금제 수정 성공',
  })
  @ApiResponse({
    status: 404,
    description: '요금제를 찾을 수 없음',
  })
  async updatePlan(@Param('id') id: string, @Body() dto: UpdatePlanDto) {
    try {
      const plan = await this.planService.updatePlan(id, dto);

      return {
        statusCode: 200,
        message: 'Plan updated successfully',
        data: plan,
      };
    } catch (error: any) {
      return {
        statusCode: error.message.includes('not found') ? 404 : 400,
        message: error.message,
      };
    }
  }

  /**
   * T484: DELETE /admin/plans/:id - 요금제 삭제 (Soft Delete)
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '요금제 삭제',
    description: 'SUPER_ADMIN이 요금제를 비활성화합니다. (Soft Delete)',
  })
  @ApiResponse({
    status: 200,
    description: '요금제 삭제 성공',
  })
  @ApiResponse({
    status: 404,
    description: '요금제를 찾을 수 없음',
  })
  async deletePlan(@Param('id') id: string) {
    try {
      await this.planService.deactivatePlan(id);

      return {
        statusCode: 200,
        message: 'Plan deactivated successfully',
      };
    } catch (error: any) {
      return {
        statusCode: error.message.includes('not found') ? 404 : 400,
        message: error.message,
      };
    }
  }
}
