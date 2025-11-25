import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { UserModule } from '../user/user.module';
import { InstitutionTypeController } from './interface/controllers/institution-type.controller';
import { InstitutionController } from './interface/controllers/institution.controller';
import { AdminController } from './interface/controllers/admin.controller';
import { InstitutionTypeService } from './application/services/institution-type.service';
import { InstitutionTypeRepository } from './infrastructure/persistence/institution-type.repository';
import { InstitutionService } from './application/services/institution.service';
import { InstitutionRepository } from './infrastructure/persistence/institution.repository';

/**
 * T391-T393: Institution Context Module
 * 기관 및 기관 유형 관리
 * - InstitutionType: 기관 유형 (주간보호, 일반 등)
 * - Institution: 기관 정보 (B2B 고객)
 * - Phase 11: Admin Controller (SUPER_ADMIN 전용)
 */
@Module({
  imports: [PrismaModule, UserModule],
  controllers: [
    InstitutionTypeController,
    InstitutionController, // T403-T405
    AdminController, // Phase 11: Admin API
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
