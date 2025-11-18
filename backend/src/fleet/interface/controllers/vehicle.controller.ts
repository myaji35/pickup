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
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { VehicleService } from '../../application/services/vehicle.service';
import { CreateVehicleDto } from '../dtos/create-vehicle.dto';
import { UpdateVehicleDto } from '../dtos/update-vehicle.dto';
import { VehicleResponseDto } from '../dtos/vehicle-response.dto';

/**
 * VehicleController
 * 차량 관리 REST API
 */
@ApiTags('Vehicles')
@Controller('vehicles')
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {}

  /**
   * T093: POST /vehicles - 차량 등록
   */
  @Post()
  @ApiOperation({ summary: '새 차량 등록' })
  @ApiResponse({
    status: 201,
    description: '차량이 성공적으로 등록되었습니다',
    type: VehicleResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: '동일한 차량번호 뒤 4자리가 이미 존재합니다',
  })
  async create(@Body() createDto: CreateVehicleDto): Promise<VehicleResponseDto> {
    const vehicle = await this.vehicleService.createVehicle(createDto);
    return VehicleResponseDto.fromDomain(vehicle);
  }

  /**
   * T094: GET /vehicles - 차량 목록 조회
   */
  @Get()
  @ApiOperation({ summary: '기관 내 차량 목록 조회' })
  @ApiQuery({
    name: 'institutionId',
    description: '기관 ID',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: '차량 목록',
    type: [VehicleResponseDto],
  })
  async findAll(
    @Query('institutionId') institutionId: string,
  ): Promise<VehicleResponseDto[]> {
    const vehicles = await this.vehicleService.getVehicles(institutionId);
    return vehicles.map((v) => VehicleResponseDto.fromDomain(v));
  }

  /**
   * T095: GET /vehicles/:id - 차량 상세 조회
   */
  @Get(':id')
  @ApiOperation({ summary: '차량 상세 조회' })
  @ApiResponse({
    status: 200,
    description: '차량 상세 정보',
    type: VehicleResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '차량을 찾을 수 없습니다',
  })
  async findOne(@Param('id') id: string): Promise<VehicleResponseDto> {
    const vehicle = await this.vehicleService.getVehicleById(id);
    return VehicleResponseDto.fromDomain(vehicle);
  }

  /**
   * T096: PATCH /vehicles/:id - 차량 정보 수정
   */
  @Patch(':id')
  @ApiOperation({ summary: '차량 정보 수정' })
  @ApiResponse({
    status: 200,
    description: '차량 정보가 수정되었습니다',
    type: VehicleResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '차량을 찾을 수 없습니다',
  })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateVehicleDto,
  ): Promise<VehicleResponseDto> {
    const vehicle = await this.vehicleService.updateVehicle({
      id,
      ...updateDto,
    });
    return VehicleResponseDto.fromDomain(vehicle);
  }

  /**
   * T097: DELETE /vehicles/:id - 차량 삭제
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '차량 삭제' })
  @ApiResponse({
    status: 200,
    description: '차량이 삭제되었습니다',
  })
  @ApiResponse({
    status: 404,
    description: '차량을 찾을 수 없습니다',
  })
  async remove(@Param('id') id: string): Promise<void> {
    await this.vehicleService.deleteVehicle(id);
  }
}
