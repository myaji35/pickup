import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IInstitutionRepository } from '../../domain/repositories/institution.repository.interface';
import { Institution } from '../../domain/entities/institution.entity';
import { UpdateInstitutionCommand } from '../commands/update-institution.command';

/**
 * T397: InstitutionService
 *
 * 기관 Application Service
 * - 기관 조회
 * - 기관 유형 업데이트
 */
@Injectable()
export class InstitutionService {
  constructor(
    @Inject('IInstitutionRepository')
    private readonly institutionRepository: IInstitutionRepository,
  ) {}

  /**
   * ID로 기관 조회 (기관 유형 포함)
   */
  async getInstitutionById(id: string): Promise<Institution> {
    const institution = await this.institutionRepository.findById(id);

    if (!institution) {
      throw new NotFoundException('Institution not found');
    }

    return institution;
  }

  /**
   * T398: 기관 유형 업데이트
   */
  async updateInstitution(command: UpdateInstitutionCommand): Promise<Institution> {
    // 기관 존재 확인
    const institution = await this.getInstitutionById(command.id);

    // 이름 업데이트
    if (command.name !== undefined) {
      institution.updateName(command.name);
    }

    // 기관 유형 업데이트
    if (command.institutionTypeId !== undefined) {
      institution.updateInstitutionType(command.institutionTypeId);
    }

    return this.institutionRepository.update(institution);
  }
}
