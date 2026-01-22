import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from '../../application/services/auth.service';
import { JwtAuthGuard } from '../../application/guards/jwt-auth.guard';
import { Public } from '../../application/decorators/public.decorator';
import { CurrentUser } from '../../application/decorators/current-user.decorator';
import { RegisterDto } from '../dtos/register.dto';
import { RegisterInstitutionDto } from '../dtos/register-institution.dto';
import { LoginDto } from '../dtos/login.dto';
import { AuthTokensResponseDto, UserResponseDto } from '../dtos/auth-response.dto';
import { User } from '../../domain/entities/user.entity';

/**
 * Auth REST API Controller (Phase 11)
 * 인증/인가 엔드포인트
 */
@ApiTags('Authentication')
@Controller('auth')
@UseGuards(JwtAuthGuard) // 기본적으로 모든 엔드포인트는 인증 필요
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 회원가입
   */
  @Public() // 인증 불필요
  @Post('register')
  @ApiOperation({
    summary: '회원가입',
    description: '새로운 사용자를 등록합니다. 이메일 중복 확인 후 비밀번호를 해싱하여 저장합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '회원가입 성공',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: '이메일 중복',
  })
  async register(@Body() dto: RegisterDto): Promise<UserResponseDto> {
    const user = await this.authService.register(dto);
    return UserResponseDto.fromDomain(user);
  }

  /**
   * 기관 회원가입
   */
  @Public()
  @Post('register-institution')
  @ApiOperation({
    summary: '기관 회원가입',
    description: '새로운 기관과 관리자 계정을 생성합니다. 기관은 PENDING 상태로 생성되며 SUPER_ADMIN의 승인이 필요합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '기관 회원가입 성공',
  })
  @ApiResponse({
    status: 409,
    description: '이메일 또는 사업자등록번호 중복',
  })
  async registerInstitution(@Body() dto: RegisterInstitutionDto) {
    const result = await this.authService.registerInstitution({
      businessRegistrationNumber: dto.businessRegistrationNumber,
      institutionName: dto.institutionName,
      adminEmail: dto.adminEmail,
      adminPassword: dto.adminPassword,
      adminName: dto.adminName,
    });

    return {
      statusCode: 201,
      message: 'Institution registration successful. Please wait for admin approval.',
      data: {
        institutionId: result.institution.id,
        institutionName: result.institution.name,
        status: result.institution.status,
        adminEmail: result.user.email,
        adminName: result.user.name,
      },
    };
  }

  /**
   * 로그인
   */
  @Public() // 인증 불필요
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '로그인',
    description: '이메일/비밀번호로 로그인하고 Access Token과 Refresh Token을 발급받습니다.',
  })
  @ApiResponse({
    status: 200,
    description: '로그인 성공',
    type: AuthTokensResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패 (잘못된 이메일 또는 비밀번호)',
  })
  async login(@Body() dto: LoginDto): Promise<AuthTokensResponseDto> {
    return await this.authService.login(dto.email, dto.password);
  }

  /**
   * 토큰 갱신
   */
  @Public() // 인증 불필요 (Refresh Token 자체를 검증)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '토큰 갱신',
    description: 'Refresh Token으로 새로운 Access Token을 발급받습니다.',
  })
  @ApiResponse({
    status: 200,
    description: '토큰 갱신 성공',
    schema: {
      properties: {
        accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '유효하지 않은 Refresh Token',
  })
  async refresh(@Body('refreshToken') refreshToken: string): Promise<{ accessToken: string }> {
    return await this.authService.refreshAccessToken(refreshToken);
  }

  /**
   * 내 프로필 조회
   */
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({
    summary: '내 프로필 조회',
    description: '현재 로그인한 사용자의 정보를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '프로필 조회 성공',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
  })
  async getProfile(@CurrentUser() user: User): Promise<UserResponseDto> {
    return UserResponseDto.fromDomain(user);
  }
}
