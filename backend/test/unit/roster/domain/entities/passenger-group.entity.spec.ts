import { describe, it, expect, beforeEach } from 'vitest';
import { PassengerGroup } from '../../../../../src/roster/domain/entities/passenger-group.entity';
import { GroupCode } from '../../../../../src/roster/domain/value-objects/group-code.vo';

describe('PassengerGroup Entity', () => {
  describe('creation', () => {
    it('should create a valid passenger group', () => {
      const groupCode = new GroupCode('GRP001');
      const group = new PassengerGroup(
        '1',
        'inst-1',
        groupCode,
        'Morning Group A',
        0,
        new Date(),
        new Date(),
      );

      expect(group.id).toBe('1');
      expect(group.institutionId).toBe('inst-1');
      expect(group.groupCode.value).toBe('GRP001');
      expect(group.name).toBe('Morning Group A');
      expect(group.totalPassengerCount).toBe(0);
    });

    it('should accept valid passenger count', () => {
      const groupCode = new GroupCode('GRP001');
      const group = new PassengerGroup(
        '1',
        'inst-1',
        groupCode,
        'Morning Group A',
        10,
        new Date(),
        new Date(),
      );

      expect(group.totalPassengerCount).toBe(10);
    });

    it('should reject negative passenger count', () => {
      const groupCode = new GroupCode('GRP001');

      expect(() => {
        new PassengerGroup(
          '1',
          'inst-1',
          groupCode,
          'Morning Group A',
          -1,
          new Date(),
          new Date(),
        );
      }).toThrow('Total passenger count cannot be negative');
    });
  });

  describe('business logic', () => {
    let group: PassengerGroup;

    beforeEach(() => {
      const groupCode = new GroupCode('GRP001');
      group = new PassengerGroup(
        '1',
        'inst-1',
        groupCode,
        'Morning Group A',
        5,
        new Date(),
        new Date(),
      );
    });

    it('should check if has capacity for vehicle', () => {
      expect(group.hasCapacityForVehicle(10)).toBe(true);
      expect(group.hasCapacityForVehicle(5)).toBe(true);
      expect(group.hasCapacityForVehicle(4)).toBe(false);
    });

    it('should update passenger count', () => {
      group.updatePassengerCount(8);
      expect(group.totalPassengerCount).toBe(8);
    });

    it('should reject negative count when updating', () => {
      expect(() => {
        group.updatePassengerCount(-1);
      }).toThrow('Total passenger count cannot be negative');
    });

    it('should update group name', () => {
      group.updateName('Evening Group B');
      expect(group.name).toBe('Evening Group B');
    });

    it('should reject empty name', () => {
      expect(() => {
        group.updateName('');
      }).toThrow('Group name cannot be empty');
    });
  });
});
