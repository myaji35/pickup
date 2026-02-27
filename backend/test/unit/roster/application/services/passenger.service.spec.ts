import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PassengerService } from '../../../../../src/roster/application/services/passenger.service';
import { IPassengerRepository } from '../../../../../src/roster/domain/repositories/passenger.repository.interface';
import { Passenger } from '../../../../../src/roster/domain/entities/passenger.entity';
import { PhoneNumber } from '../../../../../src/roster/domain/value-objects/phone-number.vo';
import { Address } from '../../../../../src/roster/domain/value-objects/address.vo';

describe('PassengerService', () => {
  let service: PassengerService;
  let mockRepository: IPassengerRepository;

  beforeEach(() => {
    mockRepository = {
      create: vi.fn(),
      findAll: vi.fn(),
      findById: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findByPhoneNumber: vi.fn(),
      createMany: vi.fn(),
    } as any;

    service = new PassengerService(mockRepository);
  });

  describe('createPassenger', () => {
    it('should create a new passenger', async () => {
      const createCommand = {
        institutionId: 'inst-1',
        name: '홍길동',
        phoneNumber: '010-1234-5678',
        pickupAddress: '서울시 강남구 테헤란로 123',
        dropoffAddress: '서울시 서초구 서초대로 456',
        shuttleType: 'MORNING' as const,
        groupId: null,
      };

      const phone = new PhoneNumber('010-1234-5678');
      const pickupAddr = new Address('서울시 강남구 테헤란로 123');
      const dropoffAddr = new Address('서울시 서초구 서초대로 456');

      const createdPassenger = new Passenger(
        '1',
        'inst-1',
        '홍길동',
        phone,
        pickupAddr,
        dropoffAddr,
        'MORNING',
        null,
        new Date(),
        new Date(),
      );

      vi.mocked(mockRepository.findByPhoneNumber).mockResolvedValue(null);
      vi.mocked(mockRepository.create).mockResolvedValue(createdPassenger);

      const result = await service.createPassenger(createCommand);

      expect(result).toBe(createdPassenger);
      expect(mockRepository.findByPhoneNumber).toHaveBeenCalledWith('inst-1', '010-1234-5678');
      expect(mockRepository.create).toHaveBeenCalled();
    });

    it('should throw error if phone number already exists', async () => {
      const createCommand = {
        institutionId: 'inst-1',
        name: '홍길동',
        phoneNumber: '010-1234-5678',
        pickupAddress: '서울시 강남구 테헤란로 123',
        dropoffAddress: '서울시 서초구 서초대로 456',
        shuttleType: 'MORNING' as const,
        groupId: null,
      };

      const existingPassenger = new Passenger(
        '1',
        'inst-1',
        '김철수',
        new PhoneNumber('010-1234-5678'),
        new Address('서울시 강남구'),
        new Address('서울시 서초구'),
        'MORNING',
        null,
        new Date(),
        new Date(),
      );

      vi.mocked(mockRepository.findByPhoneNumber).mockResolvedValue(existingPassenger);

      await expect(service.createPassenger(createCommand)).rejects.toThrow(
        'Phone number 010-1234-5678 already exists in this institution',
      );
    });
  });

  describe('getPassengers', () => {
    it('should return paginated passengers', async () => {
      const passengers = [
        new Passenger(
          '1',
          'inst-1',
          '홍길동',
          new PhoneNumber('010-1234-5678'),
          new Address('서울시 강남구'),
          new Address('서울시 서초구'),
          'MORNING',
          null,
          new Date(),
          new Date(),
        ),
      ];

      vi.mocked(mockRepository.findAll).mockResolvedValue(passengers);

      const result = await service.getPassengers('inst-1', { page: 1, limit: 10 });

      expect(result).toEqual(passengers);
      expect(mockRepository.findAll).toHaveBeenCalledWith('inst-1', { page: 1, limit: 10 });
    });
  });

  describe('getPassengerById', () => {
    it('should return passenger by id', async () => {
      const passenger = new Passenger(
        '1',
        'inst-1',
        '홍길동',
        new PhoneNumber('010-1234-5678'),
        new Address('서울시 강남구'),
        new Address('서울시 서초구'),
        'MORNING',
        null,
        new Date(),
        new Date(),
      );

      vi.mocked(mockRepository.findById).mockResolvedValue(passenger);

      const result = await service.getPassengerById('1');

      expect(result).toBe(passenger);
      expect(mockRepository.findById).toHaveBeenCalledWith('1');
    });

    it('should throw error if passenger not found', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(null);

      await expect(service.getPassengerById('999')).rejects.toThrow('Passenger not found');
    });
  });

  describe('updatePassenger', () => {
    it('should update passenger name', async () => {
      const existingPassenger = new Passenger(
        '1',
        'inst-1',
        '홍길동',
        new PhoneNumber('010-1234-5678'),
        new Address('서울시 강남구'),
        new Address('서울시 서초구'),
        'MORNING',
        null,
        new Date(),
        new Date(),
      );

      const updateCommand = {
        id: '1',
        name: '김철수',
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(existingPassenger);
      vi.mocked(mockRepository.update).mockResolvedValue({
        ...existingPassenger,
        name: '김철수',
      } as Passenger);

      const result = await service.updatePassenger(updateCommand);

      expect(result.name).toBe('김철수');
      expect(mockRepository.update).toHaveBeenCalled();
    });
  });

  describe('deletePassenger', () => {
    it('should delete passenger', async () => {
      const passenger = new Passenger(
        '1',
        'inst-1',
        '홍길동',
        new PhoneNumber('010-1234-5678'),
        new Address('서울시 강남구'),
        new Address('서울시 서초구'),
        'MORNING',
        null,
        new Date(),
        new Date(),
      );

      vi.mocked(mockRepository.findById).mockResolvedValue(passenger);
      vi.mocked(mockRepository.delete).mockResolvedValue(undefined);

      await service.deletePassenger('1');

      expect(mockRepository.delete).toHaveBeenCalledWith('1');
    });
  });
});
