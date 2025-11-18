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
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Response } from 'express';
import { PassengerService } from '../../application/services/passenger.service';
import { CsvParserService } from '../../application/services/csv-parser.service';
import { CreatePassengerDto } from '../dtos/create-passenger.dto';
import { UpdatePassengerDto } from '../dtos/update-passenger.dto';
import { PassengerResponseDto } from '../dtos/passenger-response.dto';
import { BulkUploadResultDto } from '../dtos/bulk-upload-result.dto';
import { CreatePassengerCommand } from '../../application/commands/create-passenger.command';
import { UpdatePassengerCommand } from '../../application/commands/update-passenger.command';
import { BulkCreatePassengersCommand } from '../../application/commands/bulk-create-passengers.command';
import { Readable } from 'stream';

/**
 * Passenger REST API Controller
 * 승객 CRUD 엔드포인트
 */
@ApiTags('Passengers')
@Controller('passengers')
export class PassengerController {
  constructor(
    private readonly passengerService: PassengerService,
    private readonly csvParserService: CsvParserService,
  ) {}

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

  /**
   * T288-T292: CSV 일괄 업로드
   */
  @Post('bulk-upload')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'CSV 파일 일괄 업로드',
    description: 'CSV 파일로 승객을 일괄 등록합니다. 최대 1000행, 5MB 제한.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        institutionId: {
          type: 'string',
        },
        skipDuplicates: {
          type: 'boolean',
          default: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'CSV 업로드 완료',
    type: BulkUploadResultDto,
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 파일 형식 또는 크기 초과',
  })
  async bulkUpload(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // T290: 5MB max
          new FileTypeValidator({ fileType: 'text/csv' }), // T291: CSV only
        ],
      }),
    )
    file: Express.Multer.File,
    @Body('institutionId') institutionId: string,
    @Body('skipDuplicates') skipDuplicates?: boolean,
  ): Promise<BulkUploadResultDto> {
    // CSV 파일 파싱
    const fileStream = Readable.from(file.buffer);
    const parseResult = await this.csvParserService.parsePassengerFile(fileStream, institutionId);

    // T292: 최대 1000행 검증
    if (parseResult.validRows.length > 1000) {
      throw new Error('Maximum 1000 rows allowed');
    }

    // T281: 파싱 에러가 있으면 즉시 반환 (일괄 업로드 중지)
    if (parseResult.errors.length > 0) {
      return {
        created: 0,
        skipped: 0,
        errors: parseResult.errors,
        totalProcessed: parseResult.validRows.length + parseResult.errors.length,
      };
    }

    // 일괄 생성
    const command = new BulkCreatePassengersCommand(
      institutionId,
      parseResult.validRows,
      skipDuplicates !== false, // Default true
    );

    const result = await this.passengerService.bulkCreatePassengers(command);

    return {
      created: result.created,
      skipped: result.skipped,
      errors: result.errors.map((e) => ({
        row: 0, // Row number not available from service
        field: 'phoneNumber',
        message: e.message,
        value: e.phoneNumber,
      })),
      totalProcessed: parseResult.validRows.length,
    };
  }

  /**
   * T289: CSV 템플릿 다운로드
   */
  @Get('template/csv')
  @ApiOperation({
    summary: 'CSV 템플릿 다운로드',
    description: '승객 일괄 업로드용 CSV 템플릿 파일을 다운로드합니다.',
  })
  @ApiResponse({
    status: 200,
    description: 'CSV 템플릿 파일',
    content: {
      'text/csv': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async downloadTemplate(@Res() res: Response): Promise<void> {
    const template = this.csvParserService.generateTemplate();

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="passenger-template.csv"');
    res.send('\uFEFF' + template); // Add BOM for Excel UTF-8 support
  }
}
