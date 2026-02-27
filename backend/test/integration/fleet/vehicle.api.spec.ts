import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { PrismaService } from '../../../src/prisma/prisma.service';

describe('Vehicle API (Integration)', () => {
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

  describe('POST /api/v1/vehicles', () => {
    it('should create a new vehicle', async () => {
      // Arrange
      const createDto = {
        lastFourDigits: '1234',
        passengerCapacity: 10,
        institutionId,
      };

      // Act
      const response = await request(app.getHttpServer())
        .post('/api/v1/vehicles')
        .send(createDto)
        .expect(201);

      // Assert
      expect(response.body.data).toBeDefined();
      expect(response.body.data.lastFourDigits).toBe('1234');
      expect(response.body.data.passengerCapacity).toBe(10);
      expect(response.body.data.institutionId).toBe(institutionId);
    });

    it('should return 400 if lastFourDigits is not 4 digits', async () => {
      // Arrange
      const createDto = {
        lastFourDigits: '123',
        passengerCapacity: 10,
        institutionId,
      };

      // Act & Assert
      await request(app.getHttpServer())
        .post('/api/v1/vehicles')
        .send(createDto)
        .expect(400);
    });

    it('should return 400 if passengerCapacity is out of range', async () => {
      // Arrange
      const createDto = {
        lastFourDigits: '1234',
        passengerCapacity: 20, // over 15
        institutionId,
      };

      // Act & Assert
      await request(app.getHttpServer())
        .post('/api/v1/vehicles')
        .send(createDto)
        .expect(400);
    });

    it('should return 409 if lastFourDigits already exists in institution', async () => {
      // Arrange
      const createDto = {
        lastFourDigits: '5678',
        passengerCapacity: 10,
        institutionId,
      };

      await request(app.getHttpServer())
        .post('/api/v1/vehicles')
        .send(createDto)
        .expect(201);

      // Act & Assert - Try to create duplicate
      await request(app.getHttpServer())
        .post('/api/v1/vehicles')
        .send(createDto)
        .expect(409);
    });
  });

  describe('GET /api/v1/vehicles', () => {
    it('should return all vehicles for institution', async () => {
      // Arrange
      await prisma.vehicle.createMany({
        data: [
          {
            lastFourDigits: '1111',
            passengerCapacity: 10,
            institutionId,
          },
          {
            lastFourDigits: '2222',
            passengerCapacity: 12,
            institutionId,
          },
        ],
      });

      // Act
      const response = await request(app.getHttpServer())
        .get('/api/v1/vehicles')
        .query({ institutionId })
        .expect(200);

      // Assert
      expect(response.body.data).toHaveLength(2);
    });

    it('should return empty array if no vehicles exist', async () => {
      // Act
      const response = await request(app.getHttpServer())
        .get('/api/v1/vehicles')
        .query({ institutionId })
        .expect(200);

      // Assert
      expect(response.body.data).toHaveLength(0);
    });
  });

  describe('GET /api/v1/vehicles/:id', () => {
    it('should return vehicle by id', async () => {
      // Arrange
      const vehicle = await prisma.vehicle.create({
        data: {
          lastFourDigits: '5678',
          passengerCapacity: 15,
          institutionId,
        },
      });

      // Act
      const response = await request(app.getHttpServer())
        .get(`/api/v1/vehicles/${vehicle.id}`)
        .expect(200);

      // Assert
      expect(response.body.data.id).toBe(vehicle.id);
      expect(response.body.data.lastFourDigits).toBe('5678');
    });

    it('should return 404 if vehicle not found', async () => {
      // Act & Assert
      await request(app.getHttpServer())
        .get('/api/v1/vehicles/nonexistent-uuid')
        .expect(404);
    });
  });

  describe('PATCH /api/v1/vehicles/:id', () => {
    it('should update vehicle capacity', async () => {
      // Arrange
      const vehicle = await prisma.vehicle.create({
        data: {
          lastFourDigits: '7777',
          passengerCapacity: 10,
          institutionId,
        },
      });

      const updateDto = {
        passengerCapacity: 15,
      };

      // Act
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/vehicles/${vehicle.id}`)
        .send(updateDto)
        .expect(200);

      // Assert
      expect(response.body.data.passengerCapacity).toBe(15);
    });

    it('should update currentGroupId', async () => {
      // Arrange
      const group = await prisma.passengerGroup.create({
        data: {
          institutionId,
          groupCode: 'GRP-001',
          name: '테스트 그룹',
          totalPassengerCount: 0,
        },
      });

      const vehicle = await prisma.vehicle.create({
        data: {
          lastFourDigits: '8888',
          passengerCapacity: 12,
          institutionId,
        },
      });

      const updateDto = {
        currentGroupId: group.id,
      };

      // Act
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/vehicles/${vehicle.id}`)
        .send(updateDto)
        .expect(200);

      // Assert
      expect(response.body.data.currentGroupId).toBe(group.id);
    });
  });

  describe('DELETE /api/v1/vehicles/:id', () => {
    it('should delete vehicle', async () => {
      // Arrange
      const vehicle = await prisma.vehicle.create({
        data: {
          lastFourDigits: '9999',
          passengerCapacity: 8,
          institutionId,
        },
      });

      // Act
      await request(app.getHttpServer())
        .delete(`/api/v1/vehicles/${vehicle.id}`)
        .expect(200);

      // Assert - Verify deletion
      const deleted = await prisma.vehicle.findUnique({
        where: { id: vehicle.id },
      });
      expect(deleted).toBeNull();
    });

    it('should return 404 if vehicle not found', async () => {
      // Act & Assert
      await request(app.getHttpServer())
        .delete('/api/v1/vehicles/nonexistent-uuid')
        .expect(404);
    });
  });
});
