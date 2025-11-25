import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../user/application/guards/jwt-auth.guard';
import { RolesGuard } from '../../../user/application/guards/roles.guard';
import { Roles } from '../../../user/application/decorators/roles.decorator';
import { CurrentUser } from '../../../user/application/decorators/current-user.decorator';
import { User } from '../../../user/domain/entities/user.entity';
import { InstitutionService } from '../../application/services/institution.service';
import { InstitutionRepository } from '../../infrastructure/persistence/institution.repository';
import { UpdateInstitutionCommand } from '../../application/commands/update-institution.command';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * T491-T495: Institution Self-Service API
 *
 * Phase 11: INSTITUTION_ADMIN 전용 자사 관리 API
 */
@ApiTags('Institutions - Self Service')
@Controller('institutions/me')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('INSTITUTION_ADMIN')
@ApiBearerAuth()
export class InstitutionSelfServiceController {
  constructor(
    private readonly institutionService: InstitutionService,
    private readonly institutionRepository: InstitutionRepository,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * T491: GET /institutions/me - 내 회원사 정보
   */
  @Get()
  @ApiOperation({
    summary: '내 회원사 정보 조회',
    description: 'INSTITUTION_ADMIN이 자신의 회원사 정보를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '회원사 정보 조회 성공',
  })
  @ApiResponse({
    status: 404,
    description: '회원사를 찾을 수 없음',
  })
  async getMyInstitution(@CurrentUser() user: User) {
    if (!user.institutionId) {
      return {
        statusCode: 400,
        message: 'User is not associated with any institution',
      };
    }

    try {
      const institution = await this.institutionService.getInstitutionById(user.institutionId);

      return {
        statusCode: 200,
        message: 'Success',
        data: institution,
      };
    } catch (error: any) {
      return {
        statusCode: 404,
        message: error.message,
      };
    }
  }

  /**
   * T492: PATCH /institutions/me - 내 회원사 정보 수정
   */
  @Patch()
  @ApiOperation({
    summary: '내 회원사 정보 수정',
    description: 'INSTITUTION_ADMIN이 자신의 회원사 정보를 수정합니다. (이름, 기관 유형)',
  })
  @ApiResponse({
    status: 200,
    description: '회원사 정보 수정 성공',
  })
  async updateMyInstitution(
    @CurrentUser() user: User,
    @Body() body: { name?: string; institutionTypeId?: string },
  ) {
    if (!user.institutionId) {
      return {
        statusCode: 400,
        message: 'User is not associated with any institution',
      };
    }

    try {
      const command = new UpdateInstitutionCommand(
        user.institutionId,
        body.name,
        body.institutionTypeId,
      );
      const institution = await this.institutionService.updateInstitution(command);

      return {
        statusCode: 200,
        message: 'Institution updated successfully',
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
   * T493: GET /institutions/me/users - 내 회원사 사용자 목록
   */
  @Get('users')
  @ApiOperation({
    summary: '내 회원사 사용자 목록',
    description: 'INSTITUTION_ADMIN이 자신의 회원사 소속 사용자 목록을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '사용자 목록 조회 성공',
  })
  async getMyInstitutionUsers(@CurrentUser() user: User) {
    if (!user.institutionId) {
      return {
        statusCode: 400,
        message: 'User is not associated with any institution',
      };
    }

    const users = await this.prisma.user.findMany({
      where: {
        institutionId: user.institutionId,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    return {
      statusCode: 200,
      message: 'Success',
      data: users,
    };
  }

  /**
   * T494: POST /institutions/me/users - 사용자 초대 (INSTITUTION_ADMIN만)
   */
  @Post('users')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '사용자 초대',
    description: 'INSTITUTION_ADMIN이 자신의 회원사에 새 사용자를 초대합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '사용자 초대 성공',
  })
  @ApiResponse({
    status: 409,
    description: '이메일이 이미 존재함',
  })
  async inviteUser(
    @CurrentUser() user: User,
    @Body() body: { email: string; name: string; role: string; password: string },
  ) {
    if (!user.institutionId) {
      return {
        statusCode: 400,
        message: 'User is not associated with any institution',
      };
    }

    // 이메일 중복 확인
    const existing = await this.prisma.user.findUnique({
      where: { email: body.email },
    });

    if (existing) {
      return {
        statusCode: 409,
        message: 'Email already exists',
      };
    }

    // INSTITUTION_ADMIN과 DRIVER만 초대 가능
    if (body.role !== 'INSTITUTION_ADMIN' && body.role !== 'DRIVER') {
      return {
        statusCode: 400,
        message: 'Can only invite INSTITUTION_ADMIN or DRIVER',
      };
    }

    const newUser = await this.prisma.user.create({
      data: {
        email: body.email,
        password: body.password, // TODO: Hash password
        name: body.name,
        role: body.role as any,
        institutionId: user.institutionId,
        isActive: true,
      },
    });

    return {
      statusCode: 201,
      message: 'User invited successfully',
      data: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
    };
  }

  /**
   * T495: GET /institutions/me/stats - 내 회원사 통계
   */
  @Get('stats')
  @ApiOperation({
    summary: '내 회원사 통계',
    description: 'INSTITUTION_ADMIN이 자신의 회원사 통계를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '통계 조회 성공',
  })
  async getMyInstitutionStats(@CurrentUser() user: User) {
    if (!user.institutionId) {
      return {
        statusCode: 400,
        message: 'User is not associated with any institution',
      };
    }

    const vehicleCount = await this.prisma.vehicle.count({
      where: { institutionId: user.institutionId },
    });

    const passengerCount = await this.prisma.passenger.count({
      where: { institutionId: user.institutionId },
    });

    const passengerGroupCount = await this.prisma.passengerGroup.count({
      where: { institutionId: user.institutionId },
    });

    const userCount = await this.prisma.user.count({
      where: {
        institutionId: user.institutionId,
        isActive: true,
      },
    });

    return {
      statusCode: 200,
      message: 'Success',
      data: {
        vehicles: vehicleCount,
        passengers: passengerCount,
        passengerGroups: passengerGroupCount,
        users: userCount,
      },
    };
  }
}
