import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { PrismaService } from '../../../src/prisma/prisma.service';

/**
 * T243: Vehicle-Group Connection API Integration Tests
 * Tests for connecting/disconnecting vehicles to passenger groups with capacity validation
 */
describe('Vehicle-Group Connection API (Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let institutionId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply same global pipes as main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
  });

  beforeEach(async () => {
    // Clean database
    await prisma.passengerSchedule.deleteMany();
    await prisma.passenger.deleteMany();
    await prisma.vehicle.deleteMany();
    await prisma.passengerGroup.deleteMany();
    await prisma.institution.deleteMany();
    await prisma.institutionType.deleteMany();

    // Create test institution
    const institutionType = await prisma.institutionType.create({
      data: {
        typeCode: 'GENERAL',
        typeName: '일반',
        minimumCareTimeHours: null,
      },
    });

    const institution = await prisma.institution.create({
      data: {
        businessRegistrationNo: '1234567890',
        name: '테스트 기관',
        institutionTypeId: institutionType.id,
      },
    });

    institutionId = institution.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('POST /api/v1/vehicles/:id/connect-group', () => {
    it('should connect vehicle to group when capacity is sufficient', async () => {
      // Arrange - Create vehicle with capacity 10
      const vehicle = await prisma.vehicle.create({
        data: {
          lastFourDigits: '1234',
          passengerCapacity: 10,
          institutionId,
        },
      });

      // Create group with 8 passengers
      const group = await prisma.passengerGroup.create({
        data: {
          institutionId,
          groupCode: 'GRP-001',
          name: '테스트 그룹',
          totalPassengerCount: 8,
        },
      });

      const connectDto = {
        groupId: group.id,
      };

      // Act
      const response = await request(app.getHttpServer())
        .post(`/api/v1/vehicles/${vehicle.id}/connect-group`)
        .send(connectDto)
        .expect(200);

      // Assert
      expect(response.body.data.currentGroupId).toBe(group.id);

      // Verify database update
      const updatedVehicle = await prisma.vehicle.findUnique({
        where: { id: vehicle.id },
      });
      expect(updatedVehicle?.currentGroupId).toBe(group.id);
    });

    it('should return 400 when vehicle capacity is less than group passenger count', async () => {
      // Arrange - Create vehicle with capacity 5
      const vehicle = await prisma.vehicle.create({
        data: {
          lastFourDigits: '5678',
          passengerCapacity: 5,
          institutionId,
        },
      });

      // Create group with 8 passengers (exceeds vehicle capacity)
      const group = await prisma.passengerGroup.create({
        data: {
          institutionId,
          groupCode: 'GRP-002',
          name: '대형 그룹',
          totalPassengerCount: 8,
        },
      });

      const connectDto = {
        groupId: group.id,
      };

      // Act & Assert
      const response = await request(app.getHttpServer())
        .post(`/api/v1/vehicles/${vehicle.id}/connect-group`)
        .send(connectDto)
        .expect(400);

      // Verify error message mentions capacity
      expect(response.body.message).toContain('capacity');
    });

    it('should return 404 when vehicle does not exist', async () => {
      // Arrange
      const group = await prisma.passengerGroup.create({
        data: {
          institutionId,
          groupCode: 'GRP-003',
          name: '테스트 그룹',
          totalPassengerCount: 5,
        },
      });

      const connectDto = {
        groupId: group.id,
      };

      // Act & Assert
      await request(app.getHttpServer())
        .post('/api/v1/vehicles/nonexistent-uuid/connect-group')
        .send(connectDto)
        .expect(404);
    });

    it('should return 404 when group does not exist', async () => {
      // Arrange
      const vehicle = await prisma.vehicle.create({
        data: {
          lastFourDigits: '9999',
          passengerCapacity: 10,
          institutionId,
        },
      });

      const connectDto = {
        groupId: 'nonexistent-group-uuid',
      };

      // Act & Assert
      await request(app.getHttpServer())
        .post(`/api/v1/vehicles/${vehicle.id}/connect-group`)
        .send(connectDto)
        .expect(404);
    });

    it('should allow connecting vehicle already connected to same group (idempotent)', async () => {
      // Arrange
      const group = await prisma.passengerGroup.create({
        data: {
          institutionId,
          groupCode: 'GRP-004',
          name: '테스트 그룹',
          totalPassengerCount: 5,
        },
      });

      const vehicle = await prisma.vehicle.create({
        data: {
          lastFourDigits: '7777',
          passengerCapacity: 10,
          institutionId,
          currentGroupId: group.id, // Already connected
        },
      });

      const connectDto = {
        groupId: group.id,
      };

      // Act
      const response = await request(app.getHttpServer())
        .post(`/api/v1/vehicles/${vehicle.id}/connect-group`)
        .send(connectDto)
        .expect(200);

      // Assert
      expect(response.body.data.currentGroupId).toBe(group.id);
    });

    it('should reconnect vehicle from one group to another', async () => {
      // Arrange
      const group1 = await prisma.passengerGroup.create({
        data: {
          institutionId,
          groupCode: 'GRP-005',
          name: '그룹 1',
          totalPassengerCount: 5,
        },
      });

      const group2 = await prisma.passengerGroup.create({
        data: {
          institutionId,
          groupCode: 'GRP-006',
          name: '그룹 2',
          totalPassengerCount: 7,
        },
      });

      const vehicle = await prisma.vehicle.create({
        data: {
          lastFourDigits: '6666',
          passengerCapacity: 10,
          institutionId,
          currentGroupId: group1.id, // Connected to group1
        },
      });

      const connectDto = {
        groupId: group2.id,
      };

      // Act
      const response = await request(app.getHttpServer())
        .post(`/api/v1/vehicles/${vehicle.id}/connect-group`)
        .send(connectDto)
        .expect(200);

      // Assert
      expect(response.body.data.currentGroupId).toBe(group2.id);

      // Verify database update
      const updatedVehicle = await prisma.vehicle.findUnique({
        where: { id: vehicle.id },
      });
      expect(updatedVehicle?.currentGroupId).toBe(group2.id);
    });
  });

  describe('POST /api/v1/vehicles/:id/disconnect-group', () => {
    it('should disconnect vehicle from group', async () => {
      // Arrange
      const group = await prisma.passengerGroup.create({
        data: {
          institutionId,
          groupCode: 'GRP-007',
          name: '테스트 그룹',
          totalPassengerCount: 5,
        },
      });

      const vehicle = await prisma.vehicle.create({
        data: {
          lastFourDigits: '4444',
          passengerCapacity: 10,
          institutionId,
          currentGroupId: group.id,
        },
      });

      // Act
      const response = await request(app.getHttpServer())
        .post(`/api/v1/vehicles/${vehicle.id}/disconnect-group`)
        .expect(200);

      // Assert
      expect(response.body.data.currentGroupId).toBeNull();

      // Verify database update
      const updatedVehicle = await prisma.vehicle.findUnique({
        where: { id: vehicle.id },
      });
      expect(updatedVehicle?.currentGroupId).toBeNull();
    });

    it('should return 404 when vehicle does not exist', async () => {
      // Act & Assert
      await request(app.getHttpServer())
        .post('/api/v1/vehicles/nonexistent-uuid/disconnect-group')
        .expect(404);
    });

    it('should allow disconnecting vehicle that has no group (idempotent)', async () => {
      // Arrange
      const vehicle = await prisma.vehicle.create({
        data: {
          lastFourDigits: '3333',
          passengerCapacity: 10,
          institutionId,
          currentGroupId: null, // Not connected
        },
      });

      // Act
      const response = await request(app.getHttpServer())
        .post(`/api/v1/vehicles/${vehicle.id}/disconnect-group`)
        .expect(200);

      // Assert
      expect(response.body.data.currentGroupId).toBeNull();
    });
  });
});
