import { describe, it, expect } from 'vitest';
import { InstitutionType } from '../../../../../src/institution/domain/entities/institution-type.entity';

/**
 * T373: InstitutionType Entity Unit Tests
 *
 * 목적: InstitutionType 엔티티 생성 및 비즈니스 규칙 검증
 */
describe('InstitutionType Entity', () => {
  describe('constructor', () => {
    it('should create an InstitutionType with minimum care time (DAYCARE)', () => {
      // Given
      const data = {
        id: 'type-1',
        typeCode: 'DAYCARE',
        typeName: '주간보호',
        minimumCareTimeHours: 8,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // When
      const institutionType = new InstitutionType(data);

      // Then
      expect(institutionType.id).toBe('type-1');
      expect(institutionType.typeCode).toBe('DAYCARE');
      expect(institutionType.typeName).toBe('주간보호');
      expect(institutionType.minimumCareTimeHours).toBe(8);
    });

    it('should create an InstitutionType without minimum care time (GENERAL)', () => {
      // Given
      const data = {
        id: 'type-2',
        typeCode: 'GENERAL',
        typeName: '일반',
        minimumCareTimeHours: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // When
      const institutionType = new InstitutionType(data);

      // Then
      expect(institutionType.typeCode).toBe('GENERAL');
      expect(institutionType.typeName).toBe('일반');
      expect(institutionType.minimumCareTimeHours).toBeNull();
    });
  });

  describe('requiresCareTimeValidation', () => {
    it('should return true if minimum care time is set', () => {
      // Given
      const institutionType = new InstitutionType({
        id: 'type-1',
        typeCode: 'DAYCARE',
        typeName: '주간보호',
        minimumCareTimeHours: 8,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // When
      const requires = institutionType.requiresCareTimeValidation();

      // Then
      expect(requires).toBe(true);
    });

    it('should return false if minimum care time is not set', () => {
      // Given
      const institutionType = new InstitutionType({
        id: 'type-2',
        typeCode: 'GENERAL',
        typeName: '일반',
        minimumCareTimeHours: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // When
      const requires = institutionType.requiresCareTimeValidation();

      // Then
      expect(requires).toBe(false);
    });
  });

  describe('business rules', () => {
    it('should validate typeCode is not empty', () => {
      // Given & When & Then
      expect(() => {
        new InstitutionType({
          id: 'type-1',
          typeCode: '',
          typeName: '주간보호',
          minimumCareTimeHours: 8,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }).toThrow('typeCode cannot be empty');
    });

    it('should validate typeName is not empty', () => {
      // Given & When & Then
      expect(() => {
        new InstitutionType({
          id: 'type-1',
          typeCode: 'DAYCARE',
          typeName: '',
          minimumCareTimeHours: 8,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }).toThrow('typeName cannot be empty');
    });

    it('should validate minimumCareTimeHours is non-negative', () => {
      // Given & When & Then
      expect(() => {
        new InstitutionType({
          id: 'type-1',
          typeCode: 'DAYCARE',
          typeName: '주간보호',
          minimumCareTimeHours: -1,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }).toThrow('minimumCareTimeHours must be non-negative');
    });

    it('should allow null minimumCareTimeHours', () => {
      // Given & When
      const institutionType = new InstitutionType({
        id: 'type-2',
        typeCode: 'GENERAL',
        typeName: '일반',
        minimumCareTimeHours: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Then
      expect(institutionType.minimumCareTimeHours).toBeNull();
    });
  });
});
