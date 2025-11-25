import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

/**
 * T500: E2E Tests - Institution Approval Flow
 *
 * 회원사 승인 플로우 전체 시나리오 테스트:
 * 1. SUPER_ADMIN 로그인
 * 2. PENDING 회원사 목록 조회
 * 3. 회원사 승인
 * 4. 승인된 회원사가 ACTIVE 목록에 나타나는지 확인
 * 5. 회원사 정지
 * 6. 회원사 재활성화
 * 7. 회원사 거부
 */
describe('Institution Approval Flow (E2E)', () => {
  let app: INestApplication;
  let accessToken: string;
  let testInstitutionId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Authentication', () => {
    it('should login as SUPER_ADMIN', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin@pickup.com',
          password: 'admin123!@#',
        })
        .expect(201);

      expect(response.body.access_token).toBeDefined();
      expect(response.body.user.role).toBe('SUPER_ADMIN');

      accessToken = response.body.access_token;
    });

    it('should reject login with invalid credentials', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin@pickup.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });
  });

  describe('Institution Management', () => {
    it('should get pending institutions', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/institutions/pending')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);

      if (response.body.data.length > 0) {
        testInstitutionId = response.body.data[0].id;
        expect(response.body.data[0].status).toBe('PENDING');
      }
    });

    it('should approve a pending institution', async () => {
      if (!testInstitutionId) {
        console.log('⏭️  No pending institutions to approve, skipping test');
        return;
      }

      const response = await request(app.getHttpServer())
        .post(`/admin/institutions/${testInstitutionId}/approve`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.status).toBe('ACTIVE');
      expect(response.body.data.approvedBy).toBeDefined();
      expect(response.body.data.approvedAt).toBeDefined();
    });

    it('should find approved institution in active list', async () => {
      if (!testInstitutionId) {
        console.log('⏭️  No test institution to verify, skipping test');
        return;
      }

      const response = await request(app.getHttpServer())
        .get('/admin/institutions')
        .query({ status: 'ACTIVE' })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const activeInstitution = response.body.data.find(
        (inst: any) => inst.id === testInstitutionId,
      );

      expect(activeInstitution).toBeDefined();
      expect(activeInstitution.status).toBe('ACTIVE');
    });

    it('should suspend an active institution', async () => {
      if (!testInstitutionId) {
        console.log('⏭️  No test institution to suspend, skipping test');
        return;
      }

      const response = await request(app.getHttpServer())
        .post(`/admin/institutions/${testInstitutionId}/suspend`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          suspensionReason: '테스트 목적 정지',
        })
        .expect(200);

      expect(response.body.data.status).toBe('SUSPENDED');
      expect(response.body.data.suspensionReason).toBe('테스트 목적 정지');
      expect(response.body.data.suspendedAt).toBeDefined();
    });

    it('should reactivate a suspended institution', async () => {
      if (!testInstitutionId) {
        console.log('⏭️  No test institution to reactivate, skipping test');
        return;
      }

      const response = await request(app.getHttpServer())
        .post(`/admin/institutions/${testInstitutionId}/reactivate`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.status).toBe('ACTIVE');
      expect(response.body.data.suspensionReason).toBeNull();
      expect(response.body.data.suspendedAt).toBeNull();
    });

    it('should reject a pending institution', async () => {
      // Create a new pending institution for rejection test
      const pendingResponse = await request(app.getHttpServer())
        .get('/admin/institutions/pending')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      if (pendingResponse.body.data.length === 0) {
        console.log('⏭️  No pending institutions to reject, skipping test');
        return;
      }

      const pendingInstId = pendingResponse.body.data[0].id;

      const response = await request(app.getHttpServer())
        .post(`/admin/institutions/${pendingInstId}/reject`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          rejectionReason: '서류 불충분',
        })
        .expect(200);

      expect(response.body.data.status).toBe('INACTIVE');
      expect(response.body.data.rejectionReason).toBe('서류 불충분');
    });
  });

  describe('Statistics', () => {
    it('should get institution statistics', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/institutions/stats')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.total).toBeGreaterThanOrEqual(0);
      expect(response.body.data.pending).toBeGreaterThanOrEqual(0);
      expect(response.body.data.active).toBeGreaterThanOrEqual(0);
      expect(response.body.data.suspended).toBeGreaterThanOrEqual(0);
      expect(response.body.data.inactive).toBeGreaterThanOrEqual(0);

      // Total should equal sum of all statuses
      const sum =
        response.body.data.pending +
        response.body.data.active +
        response.body.data.suspended +
        response.body.data.inactive;

      expect(response.body.data.total).toBe(sum);
    });
  });

  describe('Authorization', () => {
    it('should reject requests without token', async () => {
      await request(app.getHttpServer()).get('/admin/institutions').expect(401);
    });

    it('should reject requests with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/admin/institutions')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);
    });

    it('should reject non-SUPER_ADMIN users', async () => {
      // Login as INSTITUTION_ADMIN
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin@seoul.com',
          password: 'test1234',
        })
        .expect(201);

      const institutionAdminToken = loginResponse.body.access_token;

      // Try to access admin endpoint
      await request(app.getHttpServer())
        .get('/admin/institutions')
        .set('Authorization', `Bearer ${institutionAdminToken}`)
        .expect(403); // Forbidden
    });
  });
});
