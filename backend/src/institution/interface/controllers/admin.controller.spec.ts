import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { InstitutionService } from '../../application/services/institution.service';
import { InstitutionRepository } from '../../infrastructure/persistence/institution.repository';
import { PrismaService } from '../../../prisma/prisma.service';
import { Institution } from '../../domain/entities/institution.entity';

/**
 * T499: Admin API Integration Tests
 *
 * Admin Controller 엔드포인트 통합 테스트:
 * - GET /admin/institutions - 회원사 목록
 * - POST /admin/institutions/:id/approve - 회원사 승인
 * - POST /admin/institutions/:id/reject - 회원사 거부
 * - POST /admin/institutions/:id/suspend - 회원사 정지
 * - POST /admin/institutions/:id/reactivate - 회원사 재활성화
 */
describe('AdminController (Integration)', () => {
  let controller: AdminController;
  let institutionService: InstitutionService;
  let institutionRepository: InstitutionRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        {
          provide: InstitutionService,
          useValue: {
            getAllInstitutions: vi.fn(),
            getPendingInstitutions: vi.fn(),
            getInstitutionsByStatus: vi.fn(),
            approveInstitution: vi.fn(),
            rejectInstitution: vi.fn(),
            suspendInstitution: vi.fn(),
            reactivateInstitution: vi.fn(),
            updateInstitution: vi.fn(),
          },
        },
        {
          provide: InstitutionRepository,
          useValue: {
            findAll: vi.fn(),
            findByStatus: vi.fn(),
            findPendingInstitutions: vi.fn(),
            count: vi.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<AdminController>(AdminController);
    institutionService = module.get<InstitutionService>(InstitutionService);
    institutionRepository = module.get<InstitutionRepository>(InstitutionRepository);
  });

  describe('GET /admin/institutions', () => {
    it('should return all institutions', async () => {
      // Arrange
      const mockInstitutions = [
        new Institution(
          'inst-1',
          '1234567890',
          '서울 주간보호센터',
          'ACTIVE' as any,
          null,
          new Date(),
          'admin-1',
          null,
          null,
          null,
          new Date(),
          new Date(),
        ),
        new Institution(
          'inst-2',
          '2345678901',
          '부산 재가요양센터',
          'PENDING' as any,
          null,
          null,
          null,
          null,
          null,
          null,
          new Date(),
          new Date(),
        ),
      ];

      vi.spyOn(institutionRepository, 'findAll').mockResolvedValue(mockInstitutions);

      // Act
      const result = await controller.getAllInstitutions();

      // Assert
      expect(result.statusCode).toBe(200);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].name).toBe('서울 주간보호센터');
      expect(result.data[1].name).toBe('부산 재가요양센터');
    });
  });

  describe('GET /admin/institutions/pending', () => {
    it('should return only pending institutions', async () => {
      // Arrange
      const mockPendingInstitutions = [
        new Institution(
          'inst-2',
          '2345678901',
          '부산 재가요양센터',
          'PENDING' as any,
          null,
          null,
          null,
          null,
          null,
          null,
          new Date(),
          new Date(),
        ),
      ];

      vi.spyOn(institutionRepository, 'findPendingInstitutions').mockResolvedValue(
        mockPendingInstitutions,
      );

      // Act
      const result = await controller.getPendingInstitutions();

      // Assert
      expect(result.statusCode).toBe(200);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].status).toBe('PENDING');
    });
  });

  describe('POST /admin/institutions/:id/approve', () => {
    it('should approve a pending institution', async () => {
      // Arrange
      const approvedInstitution = new Institution(
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

      vi.spyOn(institutionService, 'approveInstitution').mockResolvedValue(approvedInstitution);

      const mockUser = { id: 'admin-1', role: 'SUPER_ADMIN' } as any;

      // Act
      const result = await controller.approveInstitution('inst-1', mockUser);

      // Assert
      expect(result.statusCode).toBe(200);
      expect(result.message).toBe('Institution approved successfully');
      expect(result.data.status).toBe('ACTIVE');
    });

    it('should return error when institution not found', async () => {
      // Arrange
      vi.spyOn(institutionService, 'approveInstitution').mockRejectedValue(
        new Error('Institution not found'),
      );

      const mockUser = { id: 'admin-1', role: 'SUPER_ADMIN' } as any;

      // Act
      const result = await controller.approveInstitution('nonexistent', mockUser);

      // Assert
      expect(result.statusCode).toBe(400);
      expect(result.message).toContain('Institution not found');
    });
  });

  describe('POST /admin/institutions/:id/reject', () => {
    it('should reject a pending institution with reason', async () => {
      // Arrange
      const rejectedInstitution = new Institution(
        'inst-1',
        '1234567890',
        '테스트 기관',
        'INACTIVE' as any,
        '서류 불충분',
        null,
        null,
        null,
        null,
        null,
        new Date(),
        new Date(),
      );

      vi.spyOn(institutionService, 'rejectInstitution').mockResolvedValue(rejectedInstitution);

      // Act
      const result = await controller.rejectInstitution('inst-1', {
        rejectionReason: '서류 불충분',
      });

      // Assert
      expect(result.statusCode).toBe(200);
      expect(result.message).toBe('Institution rejected successfully');
      expect(result.data.status).toBe('INACTIVE');
      expect(result.data.rejectionReason).toBe('서류 불충분');
    });
  });

  describe('POST /admin/institutions/:id/suspend', () => {
    it('should suspend an active institution', async () => {
      // Arrange
      const suspendedInstitution = new Institution(
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

      vi.spyOn(institutionService, 'suspendInstitution').mockResolvedValue(suspendedInstitution);

      // Act
      const result = await controller.suspendInstitution('inst-1', {
        suspensionReason: '요금 미납',
      });

      // Assert
      expect(result.statusCode).toBe(200);
      expect(result.message).toBe('Institution suspended successfully');
      expect(result.data.status).toBe('SUSPENDED');
      expect(result.data.suspensionReason).toBe('요금 미납');
    });
  });

  describe('POST /admin/institutions/:id/reactivate', () => {
    it('should reactivate a suspended institution', async () => {
      // Arrange
      const reactivatedInstitution = new Institution(
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

      vi.spyOn(institutionService, 'reactivateInstitution').mockResolvedValue(
        reactivatedInstitution,
      );

      // Act
      const result = await controller.reactivateInstitution('inst-1');

      // Assert
      expect(result.statusCode).toBe(200);
      expect(result.message).toBe('Institution reactivated successfully');
      expect(result.data.status).toBe('ACTIVE');
    });
  });

  describe('GET /admin/institutions/stats', () => {
    it('should return institution statistics by status', async () => {
      // Arrange
      vi.spyOn(institutionRepository, 'count').mockImplementation((status?: any) => {
        if (status === 'PENDING') return Promise.resolve(2);
        if (status === 'ACTIVE') return Promise.resolve(5);
        if (status === 'SUSPENDED') return Promise.resolve(1);
        if (status === 'INACTIVE') return Promise.resolve(1);
        return Promise.resolve(9); // total
      });

      // Act
      const result = await controller.getInstitutionStats();

      // Assert
      expect(result.statusCode).toBe(200);
      expect(result.data.total).toBe(9);
      expect(result.data.pending).toBe(2);
      expect(result.data.active).toBe(5);
      expect(result.data.suspended).toBe(1);
      expect(result.data.inactive).toBe(1);
    });
  });
});
