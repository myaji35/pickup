import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { IInstitutionTypeRepository } from '../../domain/repositories/institution-type.repository.interface';
import { InstitutionType } from '../../domain/entities/institution-type.entity';
import { InstitutionType as PrismaInstitutionType } from '@prisma/client';

/**
 * T383: InstitutionTypeRepository Implementation
 * Prisma를 사용한 InstitutionType Repository 구현
 * Domain Entity와 Prisma Model 간의 매핑 담당
 */
@Injectable()
export class InstitutionTypeRepository implements IInstitutionTypeRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * T384: 모든 기관 유형 조회
   */
  async findAll(): Promise<InstitutionType[]> {
    const prismaTypes = await this.prisma.institutionType.findMany({
      orderBy: {
        typeCode: 'asc',
      },
    });

    return prismaTypes.map((t) => this.toDomain(t));
  }

  /**
   * T385: ID로 기관 유형 조회
   */
  async findById(id: string): Promise<InstitutionType | null> {
    const prismaType = await this.prisma.institutionType.findUnique({
      where: { id },
    });

    return prismaType ? this.toDomain(prismaType) : null;
  }

  /**
   * T386: 새 기관 유형 생성 (시스템 관리자 전용 또는 seed data)
   */
  async create(institutionType: InstitutionType): Promise<InstitutionType> {
    const prismaType = await this.prisma.institutionType.create({
      data: {
        id: institutionType.id,
        typeCode: institutionType.typeCode,
        typeName: institutionType.typeName,
        minimumCareTimeHours: institutionType.minimumCareTimeHours,
        createdAt: institutionType.createdAt,
        updatedAt: institutionType.updatedAt,
      },
    });

    return this.toDomain(prismaType);
  }

  /**
   * Prisma to Domain 매핑
   * Prisma 모델 → Domain Entity 변환
   */
  private toDomain(prismaType: PrismaInstitutionType): InstitutionType {
    return new InstitutionType({
      id: prismaType.id,
      typeCode: prismaType.typeCode,
      typeName: prismaType.typeName,
      minimumCareTimeHours: prismaType.minimumCareTimeHours,
      createdAt: prismaType.createdAt,
      updatedAt: prismaType.updatedAt,
    });
  }
}
