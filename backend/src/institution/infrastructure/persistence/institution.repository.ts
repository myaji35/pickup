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
   * 기관 업데이트 (유형 변경 포함)
   */
  async update(institution: Institution): Promise<Institution> {
    const prismaInstitution = await this.prisma.institution.update({
      where: { id: institution.id },
      data: {
        name: institution.name,
        institutionTypeId: institution.institutionTypeId,
        updatedAt: institution.updatedAt,
      },
      include: {
        institutionType: true,
      },
    });

    return this.toDomain(prismaInstitution);
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
   * Prisma to Domain 매핑
   * Prisma 모델 → Domain Entity 변환
   */
  private toDomain(prismaInstitution: PrismaInstitution): Institution {
    return new Institution({
      id: prismaInstitution.id,
      businessRegistrationNo: prismaInstitution.businessRegistrationNo,
      name: prismaInstitution.name,
      institutionTypeId: prismaInstitution.institutionTypeId,
      createdAt: prismaInstitution.createdAt,
      updatedAt: prismaInstitution.updatedAt,
    });
  }
}
