import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IInstitutionTypeRepository } from '../../domain/repositories/institution-type.repository.interface';
import { InstitutionType } from '../../domain/entities/institution-type.entity';
import { GetInstitutionTypesQuery } from '../queries/get-institution-types.query';

/**
 * T380: InstitutionTypeService
 *
 * 기관 유형 Application Service
 * - 기관 유형 조회 (모든 유형, 특정 ID)
 */
@Injectable()
export class InstitutionTypeService {
  constructor(
    @Inject('IInstitutionTypeRepository')
    private readonly institutionTypeRepository: IInstitutionTypeRepository,
  ) {}

  /**
   * T381: 모든 기관 유형 조회
   */
  async getInstitutionTypes(query: GetInstitutionTypesQuery): Promise<InstitutionType[]> {
    return this.institutionTypeRepository.findAll();
  }

  /**
   * ID로 기관 유형 조회
   */
  async getInstitutionTypeById(id: string): Promise<InstitutionType> {
    const institutionType = await this.institutionTypeRepository.findById(id);

    if (!institutionType) {
      throw new NotFoundException('Institution type not found');
    }

    return institutionType;
  }
}
