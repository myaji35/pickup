import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { IPassengerRepository, PaginationOptions } from '../../domain/repositories/passenger.repository.interface';
import { Passenger } from '../../domain/entities/passenger.entity';
import { PhoneNumber } from '../../domain/value-objects/phone-number.vo';
import { Address } from '../../domain/value-objects/address.vo';

/**
 * Passenger Repository Implementation
 * Prisma를 사용한 구현체
 */
@Injectable()
export class PassengerRepository implements IPassengerRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Prisma 모델을 도메인 엔티티로 변환
   */
  private toDomain(prismaPassenger: any): Passenger {
    return new Passenger(
      prismaPassenger.id,
      prismaPassenger.institutionId,
      prismaPassenger.name,
      new PhoneNumber(prismaPassenger.phoneNumber),
      new Address(prismaPassenger.pickupAddress),
      new Address(prismaPassenger.dropoffAddress),
      prismaPassenger.shuttleType,
      prismaPassenger.groupId,
      prismaPassenger.createdAt,
      prismaPassenger.updatedAt,
    );
  }

  /**
   * 도메인 엔티티를 Prisma 모델로 변환
   */
  private toPrisma(passenger: Omit<Passenger, 'id' | 'createdAt' | 'updatedAt'>) {
    return {
      institutionId: passenger.institutionId,
      name: passenger.name,
      phoneNumber: passenger.phoneNumber.value,
      pickupAddress: passenger.pickupAddress.value,
      dropoffAddress: passenger.dropoffAddress.value,
      shuttleType: passenger.shuttleType,
      groupId: passenger.groupId,
    };
  }

  async create(passenger: Omit<Passenger, 'id' | 'createdAt' | 'updatedAt'>): Promise<Passenger> {
    const data = this.toPrisma(passenger);

    const created = await this.prisma.passenger.create({
      data,
    });

    return this.toDomain(created);
  }

  async createMany(passengers: Omit<Passenger, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<Passenger[]> {
    const data = passengers.map((p) => this.toPrisma(p));

    // Prisma createMany는 생성된 레코드를 반환하지 않으므로 개별 생성 사용
    const created = await Promise.all(
      data.map((d) => this.prisma.passenger.create({ data: d })),
    );

    return created.map((p) => this.toDomain(p));
  }

  async findAll(institutionId: string, options?: PaginationOptions): Promise<Passenger[]> {
    const where: any = { institutionId };

    // 필터 적용
    if (options?.shuttleType) {
      where.shuttleType = options.shuttleType;
    }

    if (options?.groupId) {
      where.groupId = options.groupId;
    }

    // T309: Assignment status filter
    if (options?.assignmentStatus) {
      if (options.assignmentStatus === 'assigned') {
        where.groupId = { not: null };
      } else if (options.assignmentStatus === 'unassigned') {
        where.groupId = null;
      }
    }

    if (options?.search) {
      where.OR = [
        { name: { contains: options.search, mode: 'insensitive' } },
        { phoneNumber: { contains: options.search } },
      ];
    }

    // 페이지네이션
    const skip = options?.page && options?.limit ? (options.page - 1) * options.limit : undefined;
    const take = options?.limit;

    const passengers = await this.prisma.passenger.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        group: true,
      },
    });

    return passengers.map((p) => this.toDomain(p));
  }

  async findById(id: string): Promise<Passenger | null> {
    const passenger = await this.prisma.passenger.findUnique({
      where: { id },
      include: {
        group: true,
        schedule: true,
      },
    });

    if (!passenger) {
      return null;
    }

    return this.toDomain(passenger);
  }

  async findByPhoneNumber(institutionId: string, phoneNumber: string): Promise<Passenger | null> {
    // 전화번호 정규화 (하이픈 제거 후 검색)
    const normalizedPhone = new PhoneNumber(phoneNumber).value;

    const passenger = await this.prisma.passenger.findFirst({
      where: {
        institutionId,
        phoneNumber: normalizedPhone,
      },
    });

    if (!passenger) {
      return null;
    }

    return this.toDomain(passenger);
  }

  async update(id: string, data: Partial<Pick<Passenger, 'name' | 'groupId'>>): Promise<Passenger> {
    const updated = await this.prisma.passenger.update({
      where: { id },
      data: {
        name: data.name,
        groupId: data.groupId,
      },
    });

    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.passenger.delete({
      where: { id },
    });
  }
}
