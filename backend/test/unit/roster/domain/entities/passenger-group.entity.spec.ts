import { describe, it, expect } from 'vitest';
import { PassengerGroup } from '../../../../../src/roster/domain/entities/passenger-group.entity';
import { GroupCode } from '../../../../../src/roster/domain/value-objects/group-code.vo';

describe('PassengerGroup Entity', () => {
  describe('creation', () => {
    it('should create a valid passenger group with all required fields', () => {
      // Arrange
      const groupCode = new GroupCode('GRP-001');
      const institutionId = 'institution-uuid-123';

      // Act
      const group = new PassengerGroup({
        id: 'group-uuid-456',
        groupCode,
        name: '오전 A조',
        institutionId,
        totalPassengerCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Assert
      expect(group).toBeDefined();
      expect(group.id).toBe('group-uuid-456');
      expect(group.groupCode.value).toBe('GRP-001');
      expect(group.name).toBe('오전 A조');
      expect(group.institutionId).toBe('institution-uuid-123');
      expect(group.totalPassengerCount).toBe(0);
    });

    it('should create a group with initial passenger count', () => {
      // Arrange
      const groupCode = new GroupCode('GRP-002');

      // Act
      const group = new PassengerGroup({
        id: 'group-uuid-789',
        groupCode,
        name: '오후 B조',
        institutionId: 'institution-uuid-123',
        totalPassengerCount: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Assert
      expect(group.totalPassengerCount).toBe(10);
    });
  });

  describe('updateName', () => {
    it('should update group name', () => {
      // Arrange
      const group = new PassengerGroup({
        id: 'group-uuid-1',
        groupCode: new GroupCode('GRP-001'),
        name: '오전 A조',
        institutionId: 'institution-uuid-1',
        totalPassengerCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      group.updateName('오전 특별조');

      // Assert
      expect(group.name).toBe('오전 특별조');
    });

    it('should throw error if name is empty', () => {
      // Arrange
      const group = new PassengerGroup({
        id: 'group-uuid-2',
        groupCode: new GroupCode('GRP-002'),
        name: '오후 B조',
        institutionId: 'institution-uuid-1',
        totalPassengerCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act & Assert
      expect(() => group.updateName('')).toThrow('그룹명은 필수입니다');
    });
  });

  describe('incrementPassengerCount', () => {
    it('should increment passenger count by 1', () => {
      // Arrange
      const group = new PassengerGroup({
        id: 'group-uuid-3',
        groupCode: new GroupCode('GRP-003'),
        name: '임시 그룹',
        institutionId: 'institution-uuid-1',
        totalPassengerCount: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      group.incrementPassengerCount();

      // Assert
      expect(group.totalPassengerCount).toBe(6);
    });

    it('should increment passenger count multiple times', () => {
      // Arrange
      const group = new PassengerGroup({
        id: 'group-uuid-4',
        groupCode: new GroupCode('GRP-004'),
        name: '테스트 그룹',
        institutionId: 'institution-uuid-1',
        totalPassengerCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      group.incrementPassengerCount();
      group.incrementPassengerCount();
      group.incrementPassengerCount();

      // Assert
      expect(group.totalPassengerCount).toBe(3);
    });
  });

  describe('decrementPassengerCount', () => {
    it('should decrement passenger count by 1', () => {
      // Arrange
      const group = new PassengerGroup({
        id: 'group-uuid-5',
        groupCode: new GroupCode('GRP-005'),
        name: '테스트 그룹',
        institutionId: 'institution-uuid-1',
        totalPassengerCount: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      group.decrementPassengerCount();

      // Assert
      expect(group.totalPassengerCount).toBe(4);
    });

    it('should not decrement below 0', () => {
      // Arrange
      const group = new PassengerGroup({
        id: 'group-uuid-6',
        groupCode: new GroupCode('GRP-006'),
        name: '빈 그룹',
        institutionId: 'institution-uuid-1',
        totalPassengerCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act & Assert
      expect(() => group.decrementPassengerCount()).toThrow(
        '승객 수는 0보다 작을 수 없습니다',
      );
    });
  });

  describe('setPassengerCount', () => {
    it('should set passenger count to specific value', () => {
      // Arrange
      const group = new PassengerGroup({
        id: 'group-uuid-7',
        groupCode: new GroupCode('GRP-007'),
        name: '업데이트 그룹',
        institutionId: 'institution-uuid-1',
        totalPassengerCount: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      group.setPassengerCount(15);

      // Assert
      expect(group.totalPassengerCount).toBe(15);
    });

    it('should throw error if count is negative', () => {
      // Arrange
      const group = new PassengerGroup({
        id: 'group-uuid-8',
        groupCode: new GroupCode('GRP-008'),
        name: '검증 그룹',
        institutionId: 'institution-uuid-1',
        totalPassengerCount: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act & Assert
      expect(() => group.setPassengerCount(-5)).toThrow(
        '승객 수는 0보다 작을 수 없습니다',
      );
    });
  });

  describe('isEmpty', () => {
    it('should return true if passenger count is 0', () => {
      // Arrange
      const group = new PassengerGroup({
        id: 'group-uuid-9',
        groupCode: new GroupCode('GRP-009'),
        name: '빈 그룹',
        institutionId: 'institution-uuid-1',
        totalPassengerCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act & Assert
      expect(group.isEmpty()).toBe(true);
    });

    it('should return false if passenger count is greater than 0', () => {
      // Arrange
      const group = new PassengerGroup({
        id: 'group-uuid-10',
        groupCode: new GroupCode('GRP-010'),
        name: '승객 있는 그룹',
        institutionId: 'institution-uuid-1',
        totalPassengerCount: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act & Assert
      expect(group.isEmpty()).toBe(false);
    });
  });
});
