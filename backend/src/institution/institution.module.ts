import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { InstitutionTypeController } from './interface/controllers/institution-type.controller';
import { InstitutionController } from './interface/controllers/institution.controller';
import { InstitutionTypeService } from './application/services/institution-type.service';
import { InstitutionTypeRepository } from './infrastructure/persistence/institution-type.repository';
import { InstitutionService } from './application/services/institution.service';
import { InstitutionRepository } from './infrastructure/persistence/institution.repository';

/**
 * T391-T393: Institution Context Module
 * 기관 및 기관 유형 관리
 * - InstitutionType: 기관 유형 (주간보호, 일반 등)
 * - Institution: 기관 정보 (B2B 고객)
 */
@Module({
  imports: [PrismaModule],
  controllers: [
    InstitutionTypeController,
    InstitutionController, // T403-T405
  ],
  providers: [
    // T392: InstitutionTypeService
    InstitutionTypeService,
    // T393: InstitutionTypeRepository
    {
      provide: 'IInstitutionTypeRepository',
      useClass: InstitutionTypeRepository,
    },
    InstitutionTypeRepository,
    // T397-T398: InstitutionService
    InstitutionService,
    // T399-T400: InstitutionRepository
    {
      provide: 'IInstitutionRepository',
      useClass: InstitutionRepository,
    },
    InstitutionRepository,
  ],
  exports: [InstitutionTypeService, InstitutionService],
})
export class InstitutionModule {}
