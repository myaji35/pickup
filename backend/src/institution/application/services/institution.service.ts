import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IInstitutionRepository } from '../../domain/repositories/institution.repository.interface';
import { Institution } from '../../domain/entities/institution.entity';
import { UpdateInstitutionCommand } from '../commands/update-institution.command';
import { ApproveInstitutionCommand } from '../commands/approve-institution.command';
import { RejectInstitutionCommand } from '../commands/reject-institution.command';
import { SuspendInstitutionCommand } from '../commands/suspend-institution.command';
import { ReactivateInstitutionCommand } from '../commands/reactivate-institution.command';

/**
 * T397: InstitutionService
 *
 * 기관 Application Service
 * - 기관 조회
 * - 기관 유형 업데이트
 * - Phase 11: 회원사 상태 관리 (승인/거부/정지/재활성화)
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

  /**
   * T439: 회원사 승인
   * Phase 11: PENDING → ACTIVE
   */
  async approveInstitution(command: ApproveInstitutionCommand): Promise<Institution> {
    // 기관 존재 확인
    const institution = await this.getInstitutionById(command.institutionId);

    // 도메인 로직 실행 (상태 검증 포함)
    institution.approve(command.approvedBy);

    // 변경사항 저장
    return this.institutionRepository.update(institution);
  }

  /**
   * T440: 회원사 거부
   * Phase 11: PENDING → INACTIVE
   */
  async rejectInstitution(command: RejectInstitutionCommand): Promise<Institution> {
    // 기관 존재 확인
    const institution = await this.getInstitutionById(command.institutionId);

    // 도메인 로직 실행 (상태 검증 포함)
    institution.reject(command.reason);

    // 변경사항 저장
    return this.institutionRepository.update(institution);
  }

  /**
   * T440: 회원사 정지
   * Phase 11: ACTIVE → SUSPENDED
   */
  async suspendInstitution(command: SuspendInstitutionCommand): Promise<Institution> {
    // 기관 존재 확인
    const institution = await this.getInstitutionById(command.institutionId);

    // 도메인 로직 실행 (상태 검증 포함)
    institution.suspend(command.reason);

    // 변경사항 저장
    return this.institutionRepository.update(institution);
  }

  /**
   * Phase 11: 회원사 재활성화
   * SUSPENDED → ACTIVE
   */
  async reactivateInstitution(command: ReactivateInstitutionCommand): Promise<Institution> {
    // 기관 존재 확인
    const institution = await this.getInstitutionById(command.institutionId);

    // 도메인 로직 실행 (상태 검증 포함)
    institution.reactivate();

    // 변경사항 저장
    return this.institutionRepository.update(institution);
  }
}
