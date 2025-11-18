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
import { PassengerGroupService } from '../../application/services/passenger-group.service';
import { CreatePassengerGroupDto } from '../dtos/create-passenger-group.dto';
import { UpdatePassengerGroupDto } from '../dtos/update-passenger-group.dto';
import { PassengerGroupResponseDto } from '../dtos/passenger-group-response.dto';
import { CreatePassengerGroupCommand } from '../../application/commands/create-passenger-group.command';
import { UpdatePassengerGroupCommand } from '../../application/commands/update-passenger-group.command';

/**
 * PassengerGroup REST API Controller
 * 승객 그룹 CRUD 엔드포인트
 */
@ApiTags('Passenger Groups')
@Controller('passenger-groups')
export class PassengerGroupController {
  constructor(private readonly passengerGroupService: PassengerGroupService) {}

  @Post()
  @ApiOperation({
    summary: '승객 그룹 생성',
    description: '새로운 승객 그룹을 생성합니다. 그룹 코드는 기관 내에서 고유해야 합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '그룹 생성 성공',
    type: PassengerGroupResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '중복된 그룹 코드 또는 잘못된 입력',
  })
  async createGroup(
    @Body() dto: CreatePassengerGroupDto,
  ): Promise<PassengerGroupResponseDto> {
    const command = new CreatePassengerGroupCommand(
      dto.institutionId,
      dto.groupCode,
      dto.name,
      dto.passengerIds,
    );

    const group = await this.passengerGroupService.createGroup(command);
    return PassengerGroupResponseDto.fromDomain(group);
  }

  @Get()
  @ApiOperation({
    summary: '승객 그룹 목록 조회',
    description: '기관의 모든 승객 그룹을 조회합니다.',
  })
  @ApiQuery({
    name: 'institutionId',
    description: '기관 ID',
    example: 'inst-123',
  })
  @ApiResponse({
    status: 200,
    description: '그룹 목록 조회 성공',
    type: [PassengerGroupResponseDto],
  })
  async getGroups(
    @Query('institutionId') institutionId: string,
  ): Promise<PassengerGroupResponseDto[]> {
    const groups = await this.passengerGroupService.getGroups(institutionId);
    return PassengerGroupResponseDto.fromDomainArray(groups);
  }

  @Get(':id')
  @ApiOperation({
    summary: '승객 그룹 상세 조회',
    description: 'ID로 특정 승객 그룹을 조회합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '그룹 ID',
    example: 'grp-123',
  })
  @ApiResponse({
    status: 200,
    description: '그룹 조회 성공',
    type: PassengerGroupResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '그룹을 찾을 수 없음',
  })
  async getGroupById(@Param('id') id: string): Promise<PassengerGroupResponseDto> {
    const group = await this.passengerGroupService.getGroupById(id);
    return PassengerGroupResponseDto.fromDomain(group);
  }

  @Patch(':id')
  @ApiOperation({
    summary: '승객 그룹 수정',
    description: '승객 그룹 정보를 수정합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '그룹 ID',
    example: 'grp-123',
  })
  @ApiResponse({
    status: 200,
    description: '그룹 수정 성공',
    type: PassengerGroupResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '그룹을 찾을 수 없음',
  })
  async updateGroup(
    @Param('id') id: string,
    @Body() dto: UpdatePassengerGroupDto,
  ): Promise<PassengerGroupResponseDto> {
    const command = new UpdatePassengerGroupCommand(id, dto.name);
    const group = await this.passengerGroupService.updateGroup(command);
    return PassengerGroupResponseDto.fromDomain(group);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '승객 그룹 삭제',
    description: '승객 그룹을 삭제합니다. 승객이 있는 그룹은 삭제할 수 없습니다.',
  })
  @ApiParam({
    name: 'id',
    description: '그룹 ID',
    example: 'grp-123',
  })
  @ApiResponse({
    status: 200,
    description: '그룹 삭제 성공',
  })
  @ApiResponse({
    status: 400,
    description: '승객이 있는 그룹은 삭제 불가',
  })
  @ApiResponse({
    status: 404,
    description: '그룹을 찾을 수 없음',
  })
  async deleteGroup(@Param('id') id: string): Promise<{ message: string }> {
    await this.passengerGroupService.deleteGroup(id);
    return { message: 'Passenger group deleted successfully' };
  }
}
