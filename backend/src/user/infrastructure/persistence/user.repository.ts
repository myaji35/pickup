import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { User, UserRole } from '../../domain/entities/user.entity';

/**
 * User Repository Implementation
 * Prisma를 사용한 구현체
 */
@Injectable()
export class UserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Prisma 모델을 도메인 엔티티로 변환
   */
  private toDomain(prismaUser: any): User {
    return new User(
      prismaUser.id,
      prismaUser.email,
      prismaUser.password,
      prismaUser.role as UserRole,
      prismaUser.name,
      prismaUser.isActive,
      prismaUser.institutionId,
      prismaUser.lastLoginAt,
      prismaUser.createdAt,
      prismaUser.updatedAt,
    );
  }

  /**
   * 도메인 엔티티를 Prisma 모델로 변환
   */
  private toPrisma(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) {
    return {
      email: user.email,
      password: user.password,
      role: user.role,
      name: user.name,
      isActive: user.isActive,
      institutionId: user.institutionId,
      lastLoginAt: user.lastLoginAt,
    };
  }

  async create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const data = this.toPrisma(user);

    const created = await this.prisma.user.create({
      data,
    });

    return this.toDomain(created);
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    return user ? this.toDomain(user) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    return user ? this.toDomain(user) : null;
  }

  async findAll(): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return users.map((u) => this.toDomain(u));
  }

  async findByInstitutionId(institutionId: string): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      where: { institutionId },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((u) => this.toDomain(u));
  }

  async findByRole(role: UserRole): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      where: { role },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((u) => this.toDomain(u));
  }

  async update(
    id: string,
    data: Partial<Pick<User, 'name' | 'isActive' | 'lastLoginAt'>>,
  ): Promise<User> {
    const updated = await this.prisma.user.update({
      where: { id },
      data,
    });

    return this.toDomain(updated);
  }

  async updatePassword(id: string, hashedPassword: string): Promise<User> {
    const updated = await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id },
    });
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { email },
    });

    return count > 0;
  }
}
