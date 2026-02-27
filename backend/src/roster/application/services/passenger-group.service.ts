import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { IPassengerGroupRepository } from '../../domain/repositories/passenger-group.repository.interface';
import { PassengerGroup } from '../../domain/entities/passenger-group.entity';
import { GroupCode } from '../../domain/value-objects/group-code.vo';
import { CreatePassengerGroupCommand } from '../commands/create-passenger-group.command';
import { UpdatePassengerGroupCommand } from '../commands/update-passenger-group.command';

/**
 * PassengerGroup Application Service
 * 승객 그룹 관련 비즈니스 로직 조율
 *
 * 책임:
 * - 도메인 엔티티 생성 및 비즈니스 규칙 적용
 * - 트랜잭션 경계 관리
 * - 도메인 이벤트 발행 (향후 확장)
 */
@Injectable()
export class PassengerGroupService {
  constructor(
    @Inject('IPassengerGroupRepository')
    private readonly passengerGroupRepository: IPassengerGroupRepository,
  ) {}

  /**
   * 새로운 승객 그룹 생성
   */
  async createGroup(command: CreatePassengerGroupCommand): Promise<PassengerGroup> {
    // 그룹 코드 중복 검사
    const existingGroup = await this.passengerGroupRepository.findByGroupCode(
      command.institutionId,
      command.groupCode,
    );

    if (existingGroup) {
      throw new BadRequestException(
        `Group code ${command.groupCode} already exists in this institution`,
      );
    }

    // 도메인 엔티티 생성
    const groupCode = new GroupCode(command.groupCode);
    const group = new PassengerGroup(
      '', // ID는 repository에서 생성
      command.institutionId,
      groupCode,
      command.name,
      0, // 초기 승객 수
      new Date(),
      new Date(),
    );

    // 승객 ID가 제공된 경우 함께 생성
    if (command.passengerIds && command.passengerIds.length > 0) {
      return this.passengerGroupRepository.createWithPassengers(
        group,
        command.passengerIds,
      );
    }

    return this.passengerGroupRepository.create(group);
  }

  /**
   * 기관의 모든 그룹 조회
   */
  async getGroups(institutionId: string): Promise<PassengerGroup[]> {
    return this.passengerGroupRepository.findAll(institutionId);
  }

  /**
   * ID로 그룹 조회
   */
  async getGroupById(id: string): Promise<PassengerGroup> {
    const group = await this.passengerGroupRepository.findById(id);

    if (!group) {
      throw new NotFoundException('Passenger group not found');
    }

    return group;
  }

  /**
   * 그룹 정보 업데이트
   */
  async updateGroup(command: UpdatePassengerGroupCommand): Promise<PassengerGroup> {
    const existingGroup = await this.getGroupById(command.id);

    // 이름 변경 시 도메인 엔티티의 검증 로직 사용
    if (command.name) {
      existingGroup.updateName(command.name);
    }

    return this.passengerGroupRepository.update(command.id, {
      name: command.name,
    });
  }

  /**
   * 그룹 삭제
   */
  async deleteGroup(id: string): Promise<void> {
    const group = await this.getGroupById(id);

    // 승객이 있는 그룹은 삭제 불가
    if (!group.canDelete()) {
      throw new BadRequestException(
        'Cannot delete group with passengers. Remove all passengers first.',
      );
    }

    await this.passengerGroupRepository.delete(id);
  }

  /**
   * 그룹에 승객 추가
   */
  async addPassengersToGroup(groupId: string, passengerIds: string[]): Promise<void> {
    const group = await this.getGroupById(groupId);
    const newCount = group.totalPassengerCount + passengerIds.length;

    await this.passengerGroupRepository.updateTotalPassengerCount(groupId, newCount);
  }

  /**
   * 그룹에서 승객 제거
   */
  async removePassengersFromGroup(groupId: string, count: number): Promise<void> {
    const group = await this.getGroupById(groupId);
    const newCount = group.totalPassengerCount - count;

    if (newCount < 0) {
      throw new BadRequestException('Cannot remove more passengers than exist in group');
    }

    await this.passengerGroupRepository.updateTotalPassengerCount(groupId, newCount);
  }
}
