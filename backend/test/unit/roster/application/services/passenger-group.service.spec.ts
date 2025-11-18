import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PassengerGroupService } from '../../../../../src/roster/application/services/passenger-group.service';
import { IPassengerGroupRepository } from '../../../../../src/roster/domain/repositories/passenger-group.repository.interface';
import { PassengerGroup } from '../../../../../src/roster/domain/entities/passenger-group.entity';
import { GroupCode } from '../../../../../src/roster/domain/value-objects/group-code.vo';

describe('PassengerGroupService', () => {
  let service: PassengerGroupService;
  let mockRepository: IPassengerGroupRepository;

  beforeEach(() => {
    mockRepository = {
      create: vi.fn(),
      createWithPassengers: vi.fn(),
      findAll: vi.fn(),
      findById: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      updateTotalPassengerCount: vi.fn(),
      findByGroupCode: vi.fn(),
    } as any;

    service = new PassengerGroupService(mockRepository);
  });

  describe('createGroup', () => {
    it('should create a new passenger group', async () => {
      const createCommand = {
        institutionId: 'inst-1',
        groupCode: 'GRP001',
        name: 'Morning Group A',
      };

      const groupCode = new GroupCode('GRP001');
      const createdGroup = new PassengerGroup(
        '1',
        'inst-1',
        groupCode,
        'Morning Group A',
        0,
        new Date(),
        new Date(),
      );

      vi.mocked(mockRepository.findByGroupCode).mockResolvedValue(null);
      vi.mocked(mockRepository.create).mockResolvedValue(createdGroup);

      const result = await service.createGroup(createCommand);

      expect(result).toBe(createdGroup);
      expect(mockRepository.findByGroupCode).toHaveBeenCalledWith(
        'inst-1',
        'GRP001',
      );
      expect(mockRepository.create).toHaveBeenCalled();
    });

    it('should throw error if group code already exists', async () => {
      const createCommand = {
        institutionId: 'inst-1',
        groupCode: 'GRP001',
        name: 'Morning Group A',
      };

      const existingGroup = new PassengerGroup(
        '1',
        'inst-1',
        new GroupCode('GRP001'),
        'Existing Group',
        0,
        new Date(),
        new Date(),
      );

      vi.mocked(mockRepository.findByGroupCode).mockResolvedValue(
        existingGroup,
      );

      await expect(service.createGroup(createCommand)).rejects.toThrow(
        'Group code GRP001 already exists in this institution',
      );
    });
  });

  describe('getGroups', () => {
    it('should return all groups for institution', async () => {
      const groups = [
        new PassengerGroup(
          '1',
          'inst-1',
          new GroupCode('GRP001'),
          'Group 1',
          5,
          new Date(),
          new Date(),
        ),
        new PassengerGroup(
          '2',
          'inst-1',
          new GroupCode('GRP002'),
          'Group 2',
          3,
          new Date(),
          new Date(),
        ),
      ];

      vi.mocked(mockRepository.findAll).mockResolvedValue(groups);

      const result = await service.getGroups('inst-1');

      expect(result).toEqual(groups);
      expect(mockRepository.findAll).toHaveBeenCalledWith('inst-1');
    });
  });

  describe('getGroupById', () => {
    it('should return group by id', async () => {
      const group = new PassengerGroup(
        '1',
        'inst-1',
        new GroupCode('GRP001'),
        'Group 1',
        5,
        new Date(),
        new Date(),
      );

      vi.mocked(mockRepository.findById).mockResolvedValue(group);

      const result = await service.getGroupById('1');

      expect(result).toBe(group);
      expect(mockRepository.findById).toHaveBeenCalledWith('1');
    });

    it('should throw error if group not found', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(null);

      await expect(service.getGroupById('999')).rejects.toThrow(
        'Passenger group not found',
      );
    });
  });

  describe('updateGroup', () => {
    it('should update group name', async () => {
      const existingGroup = new PassengerGroup(
        '1',
        'inst-1',
        new GroupCode('GRP001'),
        'Old Name',
        5,
        new Date(),
        new Date(),
      );

      const updateCommand = {
        id: '1',
        name: 'New Name',
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(existingGroup);
      vi.mocked(mockRepository.update).mockResolvedValue({
        ...existingGroup,
        name: 'New Name',
      });

      const result = await service.updateGroup(updateCommand);

      expect(result.name).toBe('New Name');
      expect(mockRepository.update).toHaveBeenCalled();
    });
  });

  describe('deleteGroup', () => {
    it('should delete group', async () => {
      const group = new PassengerGroup(
        '1',
        'inst-1',
        new GroupCode('GRP001'),
        'Group 1',
        0,
        new Date(),
        new Date(),
      );

      vi.mocked(mockRepository.findById).mockResolvedValue(group);
      vi.mocked(mockRepository.delete).mockResolvedValue(undefined);

      await service.deleteGroup('1');

      expect(mockRepository.delete).toHaveBeenCalledWith('1');
    });

    it('should throw error if group has passengers', async () => {
      const group = new PassengerGroup(
        '1',
        'inst-1',
        new GroupCode('GRP001'),
        'Group 1',
        5,
        new Date(),
        new Date(),
      );

      vi.mocked(mockRepository.findById).mockResolvedValue(group);

      await expect(service.deleteGroup('1')).rejects.toThrow(
        'Cannot delete group with passengers',
      );
    });
  });
});
