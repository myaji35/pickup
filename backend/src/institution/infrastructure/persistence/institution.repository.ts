import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { IInstitutionRepository } from '../../domain/repositories/institution.repository.interface';
import { Institution } from '../../domain/entities/institution.entity';
import { Institution as PrismaInstitution } from '@prisma/client';

/**
 * T399: InstitutionRepository Implementation
 * Prisma를 사용한 Institution Repository 구현
 * Domain Entity와 Prisma Model 간의 매핑 담당
 */
@Injectable()
export class InstitutionRepository implements IInstitutionRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * T400: ID로 기관 조회 (기관 유형 포함)
   */
  async findById(id: string): Promise<Institution | null> {
    const prismaInstitution = await this.prisma.institution.findUnique({
      where: { id },
      include: {
        institutionType: true,
      },
    });

    return prismaInstitution ? this.toDomain(prismaInstitution) : null;
  }

  /**
   * 사업자등록번호로 기관 조회
   */
  async findByBusinessRegistrationNo(businessRegistrationNo: string): Promise<Institution | null> {
    const prismaInstitution = await this.prisma.institution.findUnique({
      where: { businessRegistrationNo },
      include: {
        institutionType: true,
      },
    });

    return prismaInstitution ? this.toDomain(prismaInstitution) : null;
  }

  /**
   * 기관 생성
   */
  async create(institution: Institution): Promise<Institution> {
    const prismaInstitution = await this.prisma.institution.create({
      data: {
        id: institution.id,
        businessRegistrationNo: institution.businessRegistrationNo,
        name: institution.name,
        institutionTypeId: institution.institutionTypeId,
        createdAt: institution.createdAt,
        updatedAt: institution.updatedAt,
      },
      include: {
        institutionType: true,
      },
    });

    return this.toDomain(prismaInstitution);
  }

  /**
   * 기관 업데이트 (유형 변경 포함, Phase 11: 상태 관리 포함)
   */
  async update(institution: Institution): Promise<Institution> {
    const prismaInstitution = await this.prisma.institution.update({
      where: { id: institution.id },
      data: {
        name: institution.name,
        institutionTypeId: institution.institutionTypeId,
        status: institution.status,
        rejectionReason: institution.rejectionReason,
        approvedAt: institution.approvedAt,
        approvedBy: institution.approvedBy,
        suspendedAt: institution.suspendedAt,
        suspensionReason: institution.suspensionReason,
        updatedAt: institution.updatedAt,
      },
      include: {
        institutionType: true,
      },
    });

    return this.toDomain(prismaInstitution);
  }

  /**
   * Phase 11: 상태별 기관 조회
   */
  async findByStatus(status: string): Promise<Institution[]> {
    const institutions = await this.prisma.institution.findMany({
      where: { status: status as any },
      include: {
        institutionType: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return institutions.map((inst) => this.toDomain(inst));
  }

  /**
   * Phase 11: 모든 기관 조회 (페이지네이션 지원)
   */
  async findAll(options?: { skip?: number; take?: number; status?: string }): Promise<Institution[]> {
    const institutions = await this.prisma.institution.findMany({
      where: options?.status ? { status: options.status as any } : undefined,
      skip: options?.skip,
      take: options?.take,
      include: {
        institutionType: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return institutions.map((inst) => this.toDomain(inst));
  }

  /**
   * 기관 삭제
   */
  async delete(id: string): Promise<void> {
    await this.prisma.institution.delete({
      where: { id },
    });
  }

  /**
   * T442: 승인 대기 회원사 조회
   */
  async findPendingInstitutions(): Promise<Institution[]> {
    return this.findByStatus('PENDING');
  }

  /**
   * Phase 11: 기관 수 카운트 (상태별 필터 지원)
   */
  async count(status?: string): Promise<number> {
    return this.prisma.institution.count({
      where: status ? { status: status as any } : undefined,
    });
  }

  /**
   * Prisma to Domain 매핑
   * Prisma 모델 → Domain Entity 변환
   */
  private toDomain(prismaInstitution: PrismaInstitution): Institution {
    return new Institution({
      id: prismaInstitution.id,
      businessRegistrationNo: prismaInstitution.businessRegistrationNo,
      name: prismaInstitution.name,
      institutionTypeId: prismaInstitution.institutionTypeId,
      status: prismaInstitution.status as any,
      rejectionReason: prismaInstitution.rejectionReason,
      approvedAt: prismaInstitution.approvedAt,
      approvedBy: prismaInstitution.approvedBy,
      suspendedAt: prismaInstitution.suspendedAt,
      suspensionReason: prismaInstitution.suspensionReason,
      createdAt: prismaInstitution.createdAt,
      updatedAt: prismaInstitution.updatedAt,
    });
  }
}
