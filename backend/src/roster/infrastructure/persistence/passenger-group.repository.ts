import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { IPassengerGroupRepository } from '../../domain/repositories/passenger-group.repository.interface';
import { PassengerGroup } from '../../domain/entities/passenger-group.entity';
import { GroupCode } from '../../domain/value-objects/group-code.vo';

/**
 * PassengerGroup Repository Implementation
 * Prisma를 사용한 구현체
 */
@Injectable()
export class PassengerGroupRepository implements IPassengerGroupRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Prisma 모델을 도메인 엔티티로 변환
   */
  private toDomain(prismaGroup: any): PassengerGroup {
    return new PassengerGroup(
      prismaGroup.id,
      prismaGroup.institutionId,
      new GroupCode(prismaGroup.groupCode),
      prismaGroup.name,
      prismaGroup.totalPassengerCount,
      prismaGroup.createdAt,
      prismaGroup.updatedAt,
    );
  }

  /**
   * 도메인 엔티티를 Prisma 모델로 변환
   */
  private toPrisma(group: Omit<PassengerGroup, 'id' | 'createdAt' | 'updatedAt'>) {
    return {
      institutionId: group.institutionId,
      groupCode: group.groupCode.value,
      name: group.name,
      totalPassengerCount: group.totalPassengerCount,
    };
  }

  async create(group: Omit<PassengerGroup, 'id' | 'createdAt' | 'updatedAt'>): Promise<PassengerGroup> {
    const data = this.toPrisma(group);

    const created = await this.prisma.passengerGroup.create({
      data,
    });

    return this.toDomain(created);
  }

  async createWithPassengers(
    group: Omit<PassengerGroup, 'id' | 'createdAt' | 'updatedAt'>,
    passengerIds: string[],
  ): Promise<PassengerGroup> {
    const data = this.toPrisma(group);

    // 트랜잭션으로 그룹 생성 및 승객 연결
    const created = await this.prisma.$transaction(async (tx) => {
      const newGroup = await tx.passengerGroup.create({
        data: {
          ...data,
          totalPassengerCount: passengerIds.length,
        },
      });

      // 승객들의 groupId 업데이트
      await tx.passenger.updateMany({
        where: {
          id: { in: passengerIds },
        },
        data: {
          groupId: newGroup.id,
        },
      });

      return newGroup;
    });

    return this.toDomain(created);
  }

  async findAll(institutionId: string): Promise<PassengerGroup[]> {
    const groups = await this.prisma.passengerGroup.findMany({
      where: { institutionId },
      orderBy: { createdAt: 'desc' },
    });

    return groups.map((g) => this.toDomain(g));
  }

  async findById(id: string): Promise<PassengerGroup | null> {
    const group = await this.prisma.passengerGroup.findUnique({
      where: { id },
      include: {
        passengers: true,
      },
    });

    if (!group) {
      return null;
    }

    return this.toDomain(group);
  }

  async findByGroupCode(institutionId: string, groupCode: string): Promise<PassengerGroup | null> {
    const group = await this.prisma.passengerGroup.findFirst({
      where: {
        institutionId,
        groupCode,
      },
    });

    if (!group) {
      return null;
    }

    return this.toDomain(group);
  }

  async update(id: string, data: Partial<Pick<PassengerGroup, 'name'>>): Promise<PassengerGroup> {
    const updated = await this.prisma.passengerGroup.update({
      where: { id },
      data: {
        name: data.name,
      },
    });

    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.passengerGroup.delete({
      where: { id },
    });
  }

  async updateTotalPassengerCount(id: string, count: number): Promise<void> {
    await this.prisma.passengerGroup.update({
      where: { id },
      data: {
        totalPassengerCount: count,
      },
    });
  }
}
