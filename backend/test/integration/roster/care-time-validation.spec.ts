import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import * as request from 'supertest';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { RosterModule } from '../../../src/roster/roster.module';

/**
 * T329: Care Time Validation Integration Tests
 *
 * 목적: PassengerSchedule API의 8시간 케어 타임 검증 통합 테스트
 */
describe('Care Time Validation (Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const institutionId = 'test-institution-id';
  let passengerId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [RosterModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
  });

  beforeEach(async () => {
    // Clean up database
    await prisma.passengerSchedule.deleteMany({});
    await prisma.passenger.deleteMany({});

    // Create test passenger
    const passenger = await prisma.passenger.create({
      data: {
        institutionId,
        name: 'Test Passenger',
        phoneNumber: '010-1234-5678',
        pickupAddress: 'Pickup Address',
        dropoffAddress: 'Dropoff Address',
        shuttleType: 'MORNING',
      },
    });

    passengerId = passenger.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('PUT /passengers/:id/schedule', () => {
    it('should create schedule with sufficient care time (9 hours)', async () => {
      // Given
      const scheduleDto = {
        pickupTime: '08:00',
        dropoffTime: '17:00', // 9 hours
      };

      // When
      const response = await request(app.getHttpServer())
        .put(`/passengers/${passengerId}/schedule`)
        .send(scheduleDto)
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        passengerId,
        pickupTime: '08:00',
        dropoffTime: '17:00',
        careTimeHours: 9,
        isCareTimeInsufficient: false,
      });
      expect(response.body.warning).toBeUndefined();
    });

    it('should create schedule with exactly 8 hours (no warning)', async () => {
      // Given
      const scheduleDto = {
        pickupTime: '09:00',
        dropoffTime: '17:00', // 8 hours
      };

      // When
      const response = await request(app.getHttpServer())
        .put(`/passengers/${passengerId}/schedule`)
        .send(scheduleDto)
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        passengerId,
        pickupTime: '09:00',
        dropoffTime: '17:00',
        careTimeHours: 8,
        isCareTimeInsufficient: false,
      });
      expect(response.body.warning).toBeUndefined();
    });

    it('should create schedule with insufficient care time (7 hours) and show warning', async () => {
      // Given
      const scheduleDto = {
        pickupTime: '08:00',
        dropoffTime: '15:00', // 7 hours
      };

      // When
      const response = await request(app.getHttpServer())
        .put(`/passengers/${passengerId}/schedule`)
        .send(scheduleDto)
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        passengerId,
        pickupTime: '08:00',
        dropoffTime: '15:00',
        careTimeHours: 7,
        isCareTimeInsufficient: true,
      });
      expect(response.body.warning).toBe('Care time is less than 8 hours (7 hours)');
    });

    it('should update existing schedule', async () => {
      // Given: Create initial schedule
      await request(app.getHttpServer())
        .put(`/passengers/${passengerId}/schedule`)
        .send({
          pickupTime: '08:00',
          dropoffTime: '17:00',
        });

      // When: Update schedule
      const response = await request(app.getHttpServer())
        .put(`/passengers/${passengerId}/schedule`)
        .send({
          pickupTime: '09:00',
          dropoffTime: '18:00', // 9 hours
        })
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        passengerId,
        pickupTime: '09:00',
        dropoffTime: '18:00',
        careTimeHours: 9,
        isCareTimeInsufficient: false,
      });
    });

    it('should return 400 for invalid HH:MM format', async () => {
      // Given
      const scheduleDto = {
        pickupTime: '25:00', // Invalid hour
        dropoffTime: '17:00',
      };

      // When & Then
      await request(app.getHttpServer())
        .put(`/passengers/${passengerId}/schedule`)
        .send(scheduleDto)
        .expect(400);
    });

    it('should return 400 when pickup time is after dropoff time', async () => {
      // Given
      const scheduleDto = {
        pickupTime: '17:00',
        dropoffTime: '08:00', // Before pickup
      };

      // When & Then
      await request(app.getHttpServer())
        .put(`/passengers/${passengerId}/schedule`)
        .send(scheduleDto)
        .expect(400);
    });

    it('should return 404 for non-existent passenger', async () => {
      // Given
      const scheduleDto = {
        pickupTime: '08:00',
        dropoffTime: '17:00',
      };

      // When & Then
      await request(app.getHttpServer())
        .put('/passengers/non-existent-id/schedule')
        .send(scheduleDto)
        .expect(404);
    });
  });

  describe('DELETE /passengers/:id/schedule', () => {
    it('should delete existing schedule', async () => {
      // Given: Create schedule first
      await request(app.getHttpServer())
        .put(`/passengers/${passengerId}/schedule`)
        .send({
          pickupTime: '08:00',
          dropoffTime: '17:00',
        });

      // When
      await request(app.getHttpServer())
        .delete(`/passengers/${passengerId}/schedule`)
        .expect(200);

      // Then: Verify schedule is deleted
      const schedule = await prisma.passengerSchedule.findUnique({
        where: { passengerId },
      });
      expect(schedule).toBeNull();
    });

    it('should return 404 when deleting non-existent schedule', async () => {
      // When & Then
      await request(app.getHttpServer())
        .delete(`/passengers/${passengerId}/schedule`)
        .expect(404);
    });
  });
});
