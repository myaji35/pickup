import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../../src/app.module';
import { PrismaService } from '../../../src/prisma/prisma.service';
import * as request from 'supertest';

describe('PassengerGroup API (Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let institutionId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
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
    await prisma.passengerGroup.deleteMany();
    await prisma.institution.deleteMany();

    // Create test institution
    const institution = await prisma.institution.create({
      data: {
        businessRegistrationNumber: '123-45-67890',
        name: 'Test Institution',
      },
    });
    institutionId = institution.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('POST /api/v1/passenger-groups', () => {
    it('should create a new passenger group', async () => {
      const createDto = {
        institutionId,
        groupCode: 'GRP001',
        name: 'Morning Group A',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/passenger-groups')
        .send(createDto)
        .expect(201);

      expect(response.body).toMatchObject({
        institutionId,
        groupCode: 'GRP001',
        name: 'Morning Group A',
        totalPassengerCount: 0,
      });
      expect(response.body.id).toBeDefined();
    });

    it('should reject duplicate group code in same institution', async () => {
      const createDto = {
        institutionId,
        groupCode: 'GRP001',
        name: 'Morning Group A',
      };

      await request(app.getHttpServer())
        .post('/api/v1/passenger-groups')
        .send(createDto)
        .expect(201);

      const response = await request(app.getHttpServer())
        .post('/api/v1/passenger-groups')
        .send(createDto)
        .expect(400);

      expect(response.body.message).toContain('already exists');
    });

    it('should reject invalid group code', async () => {
      const createDto = {
        institutionId,
        groupCode: '',
        name: 'Morning Group A',
      };

      await request(app.getHttpServer())
        .post('/api/v1/passenger-groups')
        .send(createDto)
        .expect(400);
    });
  });

  describe('GET /api/v1/passenger-groups', () => {
    it('should return all groups for institution', async () => {
      await prisma.passengerGroup.createMany({
        data: [
          {
            institutionId,
            groupCode: 'GRP001',
            name: 'Group 1',
            totalPassengerCount: 5,
          },
          {
            institutionId,
            groupCode: 'GRP002',
            name: 'Group 2',
            totalPassengerCount: 3,
          },
        ],
      });

      const response = await request(app.getHttpServer())
        .get(`/api/v1/passenger-groups?institutionId=${institutionId}`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0].groupCode).toBe('GRP001');
      expect(response.body[1].groupCode).toBe('GRP002');
    });

    it('should return empty array for institution with no groups', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/passenger-groups?institutionId=${institutionId}`)
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('GET /api/v1/passenger-groups/:id', () => {
    it('should return group by id', async () => {
      const group = await prisma.passengerGroup.create({
        data: {
          institutionId,
          groupCode: 'GRP001',
          name: 'Morning Group A',
          totalPassengerCount: 5,
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/api/v1/passenger-groups/${group.id}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: group.id,
        groupCode: 'GRP001',
        name: 'Morning Group A',
      });
    });

    it('should return 404 for non-existent group', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/passenger-groups/non-existent-id')
        .expect(404);
    });
  });

  describe('PATCH /api/v1/passenger-groups/:id', () => {
    it('should update group name', async () => {
      const group = await prisma.passengerGroup.create({
        data: {
          institutionId,
          groupCode: 'GRP001',
          name: 'Old Name',
          totalPassengerCount: 0,
        },
      });

      const updateDto = {
        name: 'New Name',
      };

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/passenger-groups/${group.id}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.name).toBe('New Name');
    });
  });

  describe('DELETE /api/v1/passenger-groups/:id', () => {
    it('should delete group with no passengers', async () => {
      const group = await prisma.passengerGroup.create({
        data: {
          institutionId,
          groupCode: 'GRP001',
          name: 'Test Group',
          totalPassengerCount: 0,
        },
      });

      await request(app.getHttpServer())
        .delete(`/api/v1/passenger-groups/${group.id}`)
        .expect(200);

      const deleted = await prisma.passengerGroup.findUnique({
        where: { id: group.id },
      });
      expect(deleted).toBeNull();
    });

    it('should reject deletion if group has passengers', async () => {
      const group = await prisma.passengerGroup.create({
        data: {
          institutionId,
          groupCode: 'GRP001',
          name: 'Test Group',
          totalPassengerCount: 5,
        },
      });

      await request(app.getHttpServer())
        .delete(`/api/v1/passenger-groups/${group.id}`)
        .expect(400);
    });
  });
});
