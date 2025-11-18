import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { IPassengerRepository, PaginationOptions } from '../../domain/repositories/passenger.repository.interface';
import { Passenger } from '../../domain/entities/passenger.entity';
import { PhoneNumber } from '../../domain/value-objects/phone-number.vo';
import { Address } from '../../domain/value-objects/address.vo';
import { CreatePassengerCommand } from '../commands/create-passenger.command';
import { UpdatePassengerCommand } from '../commands/update-passenger.command';

/**
 * Passenger Application Service
 * 승객 관련 비즈니스 로직 조율
 *
 * 책임:
 * - 도메인 엔티티 생성 및 비즈니스 규칙 적용
 * - 트랜잭션 경계 관리
 * - 전화번호 중복 검사
 * - 페이지네이션 처리
 */
@Injectable()
export class PassengerService {
  constructor(
    @Inject('IPassengerRepository')
    private readonly passengerRepository: IPassengerRepository,
  ) {}

  /**
   * 새로운 승객 생성
   */
  async createPassenger(command: CreatePassengerCommand): Promise<Passenger> {
    // 전화번호 중복 검사
    const existingPassenger = await this.passengerRepository.findByPhoneNumber(
      command.institutionId,
      command.phoneNumber,
    );

    if (existingPassenger) {
      throw new BadRequestException(
        `Phone number ${command.phoneNumber} already exists in this institution`,
      );
    }

    // Value Objects 생성
    const phoneNumber = new PhoneNumber(command.phoneNumber);
    const pickupAddress = new Address(command.pickupAddress);
    const dropoffAddress = new Address(command.dropoffAddress);

    // 도메인 엔티티 생성
    const passenger = new Passenger(
      '', // ID는 repository에서 생성
      command.institutionId,
      command.name,
      phoneNumber,
      pickupAddress,
      dropoffAddress,
      command.shuttleType,
      command.groupId,
      new Date(),
      new Date(),
    );

    return this.passengerRepository.create(passenger);
  }

  /**
   * 기관의 모든 승객 조회 (페이지네이션)
   */
  async getPassengers(
    institutionId: string,
    options?: PaginationOptions,
  ): Promise<Passenger[]> {
    return this.passengerRepository.findAll(institutionId, options);
  }

  /**
   * ID로 승객 조회
   */
  async getPassengerById(id: string): Promise<Passenger> {
    const passenger = await this.passengerRepository.findById(id);

    if (!passenger) {
      throw new NotFoundException('Passenger not found');
    }

    return passenger;
  }

  /**
   * 승객 정보 업데이트
   */
  async updatePassenger(command: UpdatePassengerCommand): Promise<Passenger> {
    const existingPassenger = await this.getPassengerById(command.id);

    // 이름 변경 시 도메인 엔티티의 검증 로직 사용
    if (command.name) {
      existingPassenger.updateName(command.name);
    }

    // 전화번호 변경 시 중복 검사
    if (command.phoneNumber) {
      const duplicate = await this.passengerRepository.findByPhoneNumber(
        existingPassenger.institutionId,
        command.phoneNumber,
      );

      if (duplicate && duplicate.id !== command.id) {
        throw new BadRequestException(
          `Phone number ${command.phoneNumber} already exists in this institution`,
        );
      }

      const newPhoneNumber = new PhoneNumber(command.phoneNumber);
      existingPassenger.updatePhoneNumber(newPhoneNumber);
    }

    // 그룹 변경
    if (command.groupId !== undefined) {
      if (command.groupId === null) {
        existingPassenger.removeFromGroup();
      } else {
        existingPassenger.assignToGroup(command.groupId);
      }
    }

    return this.passengerRepository.update(command.id, {
      name: command.name,
      groupId: command.groupId,
    });
  }

  /**
   * 승객 삭제
   */
  async deletePassenger(id: string): Promise<void> {
    await this.getPassengerById(id); // 존재 여부 확인
    await this.passengerRepository.delete(id);
  }
}
