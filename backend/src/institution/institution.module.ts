import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { InstitutionTypeController } from './interface/controllers/institution-type.controller';
import { InstitutionTypeService } from './application/services/institution-type.service';
import { InstitutionTypeRepository } from './infrastructure/persistence/institution-type.repository';

/**
 * T391-T393: Institution Context Module
 * 기관 및 기관 유형 관리
 * - InstitutionType: 기관 유형 (주간보호, 일반 등)
 * - Institution: 기관 정보 (B2B 고객)
 */
@Module({
  imports: [PrismaModule],
  controllers: [InstitutionTypeController],
  providers: [
    // T392: InstitutionTypeService
    InstitutionTypeService,
    // T393: InstitutionTypeRepository
    {
      provide: 'IInstitutionTypeRepository',
      useClass: InstitutionTypeRepository,
    },
    InstitutionTypeRepository,
  ],
  exports: [InstitutionTypeService],
})
export class InstitutionModule {}
