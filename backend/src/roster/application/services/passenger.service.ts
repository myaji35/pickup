import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { IPassengerRepository, PaginationOptions } from '../../domain/repositories/passenger.repository.interface';
import { IPassengerScheduleRepository } from '../../domain/repositories/passenger-schedule.repository.interface';
import { Passenger } from '../../domain/entities/passenger.entity';
import { PassengerSchedule } from '../../domain/entities/passenger-schedule.entity';
import { PhoneNumber } from '../../domain/value-objects/phone-number.vo';
import { Address } from '../../domain/value-objects/address.vo';
import { CreatePassengerCommand } from '../commands/create-passenger.command';
import { UpdatePassengerCommand } from '../commands/update-passenger.command';
import { BulkCreatePassengersCommand } from '../commands/bulk-create-passengers.command';
import { UpsertPassengerScheduleCommand } from '../commands/upsert-passenger-schedule.command';
import { DeletePassengerScheduleCommand } from '../commands/delete-passenger-schedule.command';
import { CareTimeValidatorService } from './care-time-validator.service';
import { randomUUID } from 'crypto';

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
    @Inject('IPassengerScheduleRepository')
    private readonly passengerScheduleRepository: IPassengerScheduleRepository,
    private readonly careTimeValidatorService: CareTimeValidatorService,
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

  /**
   * T279-T281: CSV 일괄 업로드
   * 트랜잭션으로 여러 승객 동시 생성
   */
  async bulkCreatePassengers(command: BulkCreatePassengersCommand): Promise<{
    created: number;
    skipped: number;
    errors: Array<{ phoneNumber: string; message: string }>;
  }> {
    let created = 0;
    let skipped = 0;
    const errors: Array<{ phoneNumber: string; message: string }> = [];

    // T281: 에러 집계 - 각 행별로 처리하여 가능한 것만 생성
    const passengersToCreate: Passenger[] = [];

    for (const passengerData of command.passengers) {
      try {
        // 전화번호 중복 검사 (기존 DB)
        const existingPassenger = await this.passengerRepository.findByPhoneNumber(
          passengerData.institutionId,
          passengerData.phoneNumber,
        );

        if (existingPassenger) {
          if (command.skipDuplicates) {
            skipped++;
            continue; // Skip this passenger
          } else {
            errors.push({
              phoneNumber: passengerData.phoneNumber,
              message: 'Phone number already exists in database',
            });
            continue;
          }
        }

        // Value Objects 생성
        const phoneNumber = new PhoneNumber(passengerData.phoneNumber);
        const pickupAddress = new Address(passengerData.pickupAddress);
        const dropoffAddress = new Address(passengerData.dropoffAddress);

        // 도메인 엔티티 생성
        const passenger = new Passenger(
          randomUUID(),
          passengerData.institutionId,
          passengerData.name,
          phoneNumber,
          pickupAddress,
          dropoffAddress,
          passengerData.shuttleType,
          passengerData.groupId,
          new Date(),
          new Date(),
        );

        passengersToCreate.push(passenger);
      } catch (error) {
        errors.push({
          phoneNumber: passengerData.phoneNumber,
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // T280: 트랜잭션으로 일괄 생성
    if (passengersToCreate.length > 0) {
      try {
        await this.passengerRepository.createMany(passengersToCreate);
        created = passengersToCreate.length;
      } catch (error) {
        // 트랜잭션 실패 시 모든 승객 에러 처리
        passengersToCreate.forEach((p) => {
          errors.push({
            phoneNumber: p.phoneNumber.value,
            message: 'Bulk creation transaction failed',
          });
        });
      }
    }

    return { created, skipped, errors };
  }

  /**
   * T344: 승객 스케줄 생성/수정
   * - 자동 케어 시간 계산 (T342)
   * - 자동 부족 여부 플래그 설정 (T343)
   */
  async upsertSchedule(
    command: UpsertPassengerScheduleCommand,
  ): Promise<{ schedule: PassengerSchedule; warning?: string }> {
    // 승객 존재 여부 확인
    const passenger = await this.getPassengerById(command.passengerId);

    // T346: 기관 유형 체크 (주간보호 시설인지 확인)
    // TODO: Institution type check when Institution entity is implemented

    // T341-T343: 케어 시간 검증 및 계산
    const validation = this.careTimeValidatorService.validateAndCalculate(
      command.pickupTime,
      command.dropoffTime,
    );

    // 기존 스케줄 조회
    const existingSchedule = await this.passengerScheduleRepository.findByPassengerId(passenger.id);

    let schedule: PassengerSchedule;

    if (existingSchedule) {
      // 업데이트
      existingSchedule.updateTimes(
        command.pickupTime,
        command.dropoffTime,
        validation.careTimeHours,
        validation.isCareTimeInsufficient,
      );
      schedule = await this.passengerScheduleRepository.upsert(existingSchedule);
    } else {
      // 생성
      schedule = new PassengerSchedule({
        id: randomUUID(),
        passengerId: passenger.id,
        pickupTime: command.pickupTime,
        dropoffTime: command.dropoffTime,
        careTimeHours: validation.careTimeHours,
        isCareTimeInsufficient: validation.isCareTimeInsufficient,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      schedule = await this.passengerScheduleRepository.upsert(schedule);
    }

    return {
      schedule,
      warning: validation.warning,
    };
  }

  /**
   * T345: 승객 스케줄 삭제
   */
  async deleteSchedule(command: DeletePassengerScheduleCommand): Promise<void> {
    // 승객 존재 여부 확인
    await this.getPassengerById(command.passengerId);

    // 스케줄 존재 여부 확인
    const existingSchedule = await this.passengerScheduleRepository.findByPassengerId(
      command.passengerId,
    );

    if (!existingSchedule) {
      throw new NotFoundException('Schedule not found for this passenger');
    }

    await this.passengerScheduleRepository.delete(command.passengerId);
  }
}
