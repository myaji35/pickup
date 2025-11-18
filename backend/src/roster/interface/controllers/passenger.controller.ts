import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { PassengerService } from '../../application/services/passenger.service';
import { CreatePassengerDto } from '../dtos/create-passenger.dto';
import { UpdatePassengerDto } from '../dtos/update-passenger.dto';
import { PassengerResponseDto } from '../dtos/passenger-response.dto';
import { CreatePassengerCommand } from '../../application/commands/create-passenger.command';
import { UpdatePassengerCommand } from '../../application/commands/update-passenger.command';

/**
 * Passenger REST API Controller
 * 승객 CRUD 엔드포인트
 */
@ApiTags('Passengers')
@Controller('passengers')
export class PassengerController {
  constructor(private readonly passengerService: PassengerService) {}

  @Post()
  @ApiOperation({
    summary: '승객 생성',
    description: '새로운 승객을 생성합니다. 전화번호는 기관 내에서 고유해야 합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '승객 생성 성공',
    type: PassengerResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '중복된 전화번호 또는 잘못된 입력',
  })
  async createPassenger(
    @Body() dto: CreatePassengerDto,
  ): Promise<PassengerResponseDto> {
    const command = new CreatePassengerCommand(
      dto.institutionId,
      dto.name,
      dto.phoneNumber,
      dto.pickupAddress,
      dto.dropoffAddress,
      dto.shuttleType,
      dto.groupId || null,
    );

    const passenger = await this.passengerService.createPassenger(command);
    return PassengerResponseDto.fromDomain(passenger);
  }

  @Get()
  @ApiOperation({
    summary: '승객 목록 조회',
    description: '기관의 모든 승객을 조회합니다. 페이지네이션, 필터링, 검색을 지원합니다.',
  })
  @ApiQuery({
    name: 'institutionId',
    description: '기관 ID',
    example: 'inst-123',
  })
  @ApiQuery({
    name: 'page',
    description: '페이지 번호',
    example: 1,
    required: false,
  })
  @ApiQuery({
    name: 'limit',
    description: '페이지당 항목 수',
    example: 10,
    required: false,
  })
  @ApiQuery({
    name: 'shuttleType',
    description: '셔틀 타입 필터',
    enum: ['MORNING', 'EVENING', 'TEMPORARY'],
    required: false,
  })
  @ApiQuery({
    name: 'search',
    description: '검색어 (이름 또는 전화번호)',
    required: false,
  })
  @ApiQuery({
    name: 'groupId',
    description: '그룹 ID 필터',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: '승객 목록 조회 성공',
    type: [PassengerResponseDto],
  })
  async getPassengers(
    @Query('institutionId') institutionId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('shuttleType') shuttleType?: string,
    @Query('search') search?: string,
    @Query('groupId') groupId?: string,
  ): Promise<PassengerResponseDto[]> {
    const passengers = await this.passengerService.getPassengers(institutionId, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      shuttleType,
      search,
      groupId,
    });

    return PassengerResponseDto.fromDomainArray(passengers);
  }

  @Get(':id')
  @ApiOperation({
    summary: '승객 상세 조회',
    description: 'ID로 특정 승객을 조회합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '승객 ID',
    example: 'passenger-123',
  })
  @ApiResponse({
    status: 200,
    description: '승객 조회 성공',
    type: PassengerResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '승객을 찾을 수 없음',
  })
  async getPassengerById(@Param('id') id: string): Promise<PassengerResponseDto> {
    const passenger = await this.passengerService.getPassengerById(id);
    return PassengerResponseDto.fromDomain(passenger);
  }

  @Patch(':id')
  @ApiOperation({
    summary: '승객 수정',
    description: '승객 정보를 수정합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '승객 ID',
    example: 'passenger-123',
  })
  @ApiResponse({
    status: 200,
    description: '승객 수정 성공',
    type: PassengerResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '승객을 찾을 수 없음',
  })
  async updatePassenger(
    @Param('id') id: string,
    @Body() dto: UpdatePassengerDto,
  ): Promise<PassengerResponseDto> {
    const command = new UpdatePassengerCommand(
      id,
      dto.name,
      dto.phoneNumber,
      dto.groupId,
    );

    const passenger = await this.passengerService.updatePassenger(command);
    return PassengerResponseDto.fromDomain(passenger);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '승객 삭제',
    description: '승객을 삭제합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '승객 ID',
    example: 'passenger-123',
  })
  @ApiResponse({
    status: 200,
    description: '승객 삭제 성공',
  })
  @ApiResponse({
    status: 404,
    description: '승객을 찾을 수 없음',
  })
  async deletePassenger(@Param('id') id: string): Promise<{ message: string }> {
    await this.passengerService.deletePassenger(id);
    return { message: 'Passenger deleted successfully' };
  }
}
