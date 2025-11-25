import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../user/application/guards/jwt-auth.guard';
import { RolesGuard } from '../../../user/application/guards/roles.guard';
import { Roles } from '../../../user/application/decorators/roles.decorator';
import { CurrentUser } from '../../../user/application/decorators/current-user.decorator';
import { User } from '../../../user/domain/entities/user.entity';
import { InstitutionRepository } from '../../infrastructure/persistence/institution.repository';

/**
 * Phase 11: Admin API Controller
 * SUPER_ADMIN 전용 회원사 관리 엔드포인트
 */
@ApiTags('Admin - Institutions')
@Controller('admin/institutions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly institutionRepository: InstitutionRepository) {}

  /**
   * 모든 회원사 조회 (상태별 필터링 지원)
   */
  @Get()
  @ApiOperation({
    summary: '회원사 목록 조회 (Admin)',
    description: 'SUPER_ADMIN이 모든 회원사를 조회합니다. 상태별 필터링 가능.',
  })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'ACTIVE', 'SUSPENDED', 'INACTIVE'] })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: '회원사 목록 조회 성공',
  })
  async getAllInstitutions(
    @Query('status') status?: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ) {
    const institutions = await this.institutionRepository.findAll({
      status,
      skip: skip ? Number(skip) : undefined,
      take: take ? Number(take) : undefined,
    });

    return {
      statusCode: 200,
      message: 'Success',
      data: institutions,
    };
  }

  /**
   * PENDING 상태 회원사 조회
   */
  @Get('pending')
  @ApiOperation({
    summary: '승인 대기 회원사 조회',
    description: 'PENDING 상태의 회원사 목록을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '승인 대기 회원사 목록',
  })
  async getPendingInstitutions() {
    const institutions = await this.institutionRepository.findByStatus('PENDING');

    return {
      statusCode: 200,
      message: 'Success',
      data: institutions,
    };
  }

  /**
   * 회원사 승인
   */
  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '회원사 승인',
    description: 'PENDING 상태의 회원사를 ACTIVE로 변경합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '회원사 승인 성공',
  })
  @ApiResponse({
    status: 400,
    description: 'PENDING 상태가 아닌 회원사는 승인 불가',
  })
  @ApiResponse({
    status: 404,
    description: '회원사를 찾을 수 없음',
  })
  async approveInstitution(@Param('id') id: string, @CurrentUser() user: User) {
    const institution = await this.institutionRepository.findById(id);

    if (!institution) {
      return {
        statusCode: 404,
        message: 'Institution not found',
      };
    }

    try {
      institution.approve(user.id);
      await this.institutionRepository.update(institution);

      return {
        statusCode: 200,
        message: 'Institution approved successfully',
        data: institution,
      };
    } catch (error: any) {
      return {
        statusCode: 400,
        message: error.message,
      };
    }
  }

  /**
   * 회원사 거부
   */
  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '회원사 거부',
    description: 'PENDING 상태의 회원사를 거부하고 INACTIVE로 변경합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '회원사 거부 성공',
  })
  @ApiResponse({
    status: 400,
    description: 'PENDING 상태가 아니거나 거부 사유가 없는 경우',
  })
  async rejectInstitution(@Param('id') id: string, @Body('reason') reason: string) {
    const institution = await this.institutionRepository.findById(id);

    if (!institution) {
      return {
        statusCode: 404,
        message: 'Institution not found',
      };
    }

    try {
      institution.reject(reason);
      await this.institutionRepository.update(institution);

      return {
        statusCode: 200,
        message: 'Institution rejected successfully',
        data: institution,
      };
    } catch (error: any) {
      return {
        statusCode: 400,
        message: error.message,
      };
    }
  }

  /**
   * 회원사 정지
   */
  @Post(':id/suspend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '회원사 정지',
    description: 'ACTIVE 상태의 회원사를 SUSPENDED로 변경합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '회원사 정지 성공',
  })
  @ApiResponse({
    status: 400,
    description: 'ACTIVE 상태가 아니거나 정지 사유가 없는 경우',
  })
  async suspendInstitution(@Param('id') id: string, @Body('reason') reason: string) {
    const institution = await this.institutionRepository.findById(id);

    if (!institution) {
      return {
        statusCode: 404,
        message: 'Institution not found',
      };
    }

    try {
      institution.suspend(reason);
      await this.institutionRepository.update(institution);

      return {
        statusCode: 200,
        message: 'Institution suspended successfully',
        data: institution,
      };
    } catch (error: any) {
      return {
        statusCode: 400,
        message: error.message,
      };
    }
  }

  /**
   * 회원사 재활성화
   */
  @Post(':id/reactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '회원사 재활성화',
    description: 'SUSPENDED 상태의 회원사를 ACTIVE로 복원합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '회원사 재활성화 성공',
  })
  @ApiResponse({
    status: 400,
    description: 'SUSPENDED 상태가 아닌 경우',
  })
  async reactivateInstitution(@Param('id') id: string) {
    const institution = await this.institutionRepository.findById(id);

    if (!institution) {
      return {
        statusCode: 404,
        message: 'Institution not found',
      };
    }

    try {
      institution.reactivate();
      await this.institutionRepository.update(institution);

      return {
        statusCode: 200,
        message: 'Institution reactivated successfully',
        data: institution,
      };
    } catch (error: any) {
      return {
        statusCode: 400,
        message: error.message,
      };
    }
  }

  /**
   * 회원사 상세 조회
   */
  @Get(':id')
  @ApiOperation({
    summary: '회원사 상세 조회 (Admin)',
    description: 'SUPER_ADMIN이 특정 회원사의 상세 정보를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '회원사 조회 성공',
  })
  @ApiResponse({
    status: 404,
    description: '회원사를 찾을 수 없음',
  })
  async getInstitutionById(@Param('id') id: string) {
    const institution = await this.institutionRepository.findById(id);

    if (!institution) {
      return {
        statusCode: 404,
        message: 'Institution not found',
      };
    }

    return {
      statusCode: 200,
      message: 'Success',
      data: institution,
    };
  }
}
