import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InstitutionService } from './institution.service';
import { IInstitutionRepository } from '../../domain/repositories/institution.repository.interface';
import { Institution } from '../../domain/entities/institution.entity';
import { ApproveInstitutionCommand } from '../commands/approve-institution.command';
import { RejectInstitutionCommand } from '../commands/reject-institution.command';
import { SuspendInstitutionCommand } from '../commands/suspend-institution.command';
import { ReactivateInstitutionCommand } from '../commands/reactivate-institution.command';

/**
 * T498: InstitutionService Unit Tests
 *
 * 회원사 관리 핵심 비즈니스 로직 검증:
 * - 회원사 상태 관리 (승인/거부/정지/재활성화)
 * - 비즈니스 규칙 검증
 * - 도메인 이벤트 처리
 */
describe('InstitutionService', () => {
  let institutionService: InstitutionService;
  let institutionRepository: IInstitutionRepository;

  beforeEach(() => {
    // Mock repository
    institutionRepository = {
      findById: vi.fn(),
      findByBusinessRegistrationNo: vi.fn(),
      findByStatus: vi.fn(),
      findPendingInstitutions: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    } as any;

    institutionService = new InstitutionService(institutionRepository);
  });

  describe('approveInstitution', () => {
    it('should approve a PENDING institution', async () => {
      // Arrange
      const mockInstitution = new Institution(
        'inst-1',
        '1234567890',
        '테스트 기관',
        'PENDING' as any,
        null,
        null,
        null,
        null,
        null,
        null,
        new Date(),
        new Date(),
      );

      vi.spyOn(institutionRepository, 'findById').mockResolvedValue(mockInstitution);
      vi.spyOn(institutionRepository, 'update').mockResolvedValue(mockInstitution);

      const command = new ApproveInstitutionCommand('inst-1', 'admin-1');

      // Act
      const result = await institutionService.approveInstitution(command);

      // Assert
      expect(result.status).toBe('ACTIVE');
      expect(result.approvedBy).toBe('admin-1');
      expect(result.approvedAt).toBeDefined();
      expect(institutionRepository.update).toHaveBeenCalledWith(mockInstitution);
    });

    it('should throw error when institution not found', async () => {
      // Arrange
      vi.spyOn(institutionRepository, 'findById').mockResolvedValue(null);
      const command = new ApproveInstitutionCommand('nonexistent-id', 'admin-1');

      // Act & Assert
      await expect(institutionService.approveInstitution(command)).rejects.toThrow(
        'Institution not found',
      );
    });
  });

  describe('rejectInstitution', () => {
    it('should reject a PENDING institution with reason', async () => {
      // Arrange
      const mockInstitution = new Institution(
        'inst-1',
        '1234567890',
        '테스트 기관',
        'PENDING' as any,
        null,
        null,
        null,
        null,
        null,
        null,
        new Date(),
        new Date(),
      );

      vi.spyOn(institutionRepository, 'findById').mockResolvedValue(mockInstitution);
      vi.spyOn(institutionRepository, 'update').mockResolvedValue(mockInstitution);

      const command = new RejectInstitutionCommand('inst-1', '서류 불충분');

      // Act
      const result = await institutionService.rejectInstitution(command);

      // Assert
      expect(result.status).toBe('INACTIVE');
      expect(result.rejectionReason).toBe('서류 불충분');
      expect(institutionRepository.update).toHaveBeenCalledWith(mockInstitution);
    });
  });

  describe('suspendInstitution', () => {
    it('should suspend an ACTIVE institution', async () => {
      // Arrange
      const mockInstitution = new Institution(
        'inst-1',
        '1234567890',
        '테스트 기관',
        'ACTIVE' as any,
        null,
        new Date(),
        'admin-1',
        null,
        null,
        null,
        new Date(),
        new Date(),
      );

      vi.spyOn(institutionRepository, 'findById').mockResolvedValue(mockInstitution);
      vi.spyOn(institutionRepository, 'update').mockResolvedValue(mockInstitution);

      const command = new SuspendInstitutionCommand('inst-1', '요금 미납');

      // Act
      const result = await institutionService.suspendInstitution(command);

      // Assert
      expect(result.status).toBe('SUSPENDED');
      expect(result.suspensionReason).toBe('요금 미납');
      expect(result.suspendedAt).toBeDefined();
      expect(institutionRepository.update).toHaveBeenCalledWith(mockInstitution);
    });
  });

  describe('reactivateInstitution', () => {
    it('should reactivate a SUSPENDED institution', async () => {
      // Arrange
      const mockInstitution = new Institution(
        'inst-1',
        '1234567890',
        '테스트 기관',
        'SUSPENDED' as any,
        null,
        new Date(),
        'admin-1',
        new Date(),
        '요금 미납',
        null,
        new Date(),
        new Date(),
      );

      vi.spyOn(institutionRepository, 'findById').mockResolvedValue(mockInstitution);
      vi.spyOn(institutionRepository, 'update').mockResolvedValue(mockInstitution);

      const command = new ReactivateInstitutionCommand('inst-1');

      // Act
      const result = await institutionService.reactivateInstitution(command);

      // Assert
      expect(result.status).toBe('ACTIVE');
      expect(result.suspensionReason).toBeNull();
      expect(result.suspendedAt).toBeNull();
      expect(institutionRepository.update).toHaveBeenCalledWith(mockInstitution);
    });
  });

  describe('getInstitutionById', () => {
    it('should return institution when found', async () => {
      // Arrange
      const mockInstitution = new Institution(
        'inst-1',
        '1234567890',
        '테스트 기관',
        'ACTIVE' as any,
        null,
        new Date(),
        'admin-1',
        null,
        null,
        null,
        new Date(),
        new Date(),
      );

      vi.spyOn(institutionRepository, 'findById').mockResolvedValue(mockInstitution);

      // Act
      const result = await institutionService.getInstitutionById('inst-1');

      // Assert
      expect(result).toBe(mockInstitution);
      expect(institutionRepository.findById).toHaveBeenCalledWith('inst-1');
    });

    it('should throw error when institution not found', async () => {
      // Arrange
      vi.spyOn(institutionRepository, 'findById').mockResolvedValue(null);

      // Act & Assert
      await expect(institutionService.getInstitutionById('nonexistent')).rejects.toThrow(
        'Institution not found',
      );
    });
  });
});
