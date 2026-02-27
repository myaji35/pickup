import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../../src/app.module';
import { PrismaService } from '../../../src/prisma/prisma.service';
import * as request from 'supertest';

describe('Passenger API (Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let institutionId: string;
  let groupId: string;

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
    await prisma.passenger.deleteMany();
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

    // Create test group
    const group = await prisma.passengerGroup.create({
      data: {
        institutionId,
        groupCode: 'GRP001',
        name: 'Test Group',
        totalPassengerCount: 0,
      },
    });
    groupId = group.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('POST /api/v1/passengers', () => {
    it('should create a new passenger', async () => {
      const createDto = {
        institutionId,
        name: '홍길동',
        phoneNumber: '010-1234-5678',
        pickupAddress: '서울시 강남구 테헤란로 123',
        dropoffAddress: '서울시 서초구 서초대로 456',
        shuttleType: 'MORNING',
        groupId: null,
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/passengers')
        .send(createDto)
        .expect(201);

      expect(response.body).toMatchObject({
        institutionId,
        name: '홍길동',
        phoneNumber: '010-1234-5678',
        shuttleType: 'MORNING',
      });
      expect(response.body.id).toBeDefined();
    });

    it('should reject duplicate phone number in same institution', async () => {
      const createDto = {
        institutionId,
        name: '홍길동',
        phoneNumber: '010-1234-5678',
        pickupAddress: '서울시 강남구 테헤란로 123',
        dropoffAddress: '서울시 서초구 서초대로 456',
        shuttleType: 'MORNING',
        groupId: null,
      };

      await request(app.getHttpServer())
        .post('/api/v1/passengers')
        .send(createDto)
        .expect(201);

      const response = await request(app.getHttpServer())
        .post('/api/v1/passengers')
        .send(createDto)
        .expect(400);

      expect(response.body.message).toContain('already exists');
    });

    it('should reject invalid phone number format', async () => {
      const createDto = {
        institutionId,
        name: '홍길동',
        phoneNumber: '123-456-7890',
        pickupAddress: '서울시 강남구 테헤란로 123',
        dropoffAddress: '서울시 서초구 서초대로 456',
        shuttleType: 'MORNING',
        groupId: null,
      };

      await request(app.getHttpServer())
        .post('/api/v1/passengers')
        .send(createDto)
        .expect(400);
    });

    it('should assign passenger to group', async () => {
      const createDto = {
        institutionId,
        name: '홍길동',
        phoneNumber: '010-1234-5678',
        pickupAddress: '서울시 강남구 테헤란로 123',
        dropoffAddress: '서울시 서초구 서초대로 456',
        shuttleType: 'MORNING',
        groupId,
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/passengers')
        .send(createDto)
        .expect(201);

      expect(response.body.groupId).toBe(groupId);
    });
  });

  describe('GET /api/v1/passengers', () => {
    it('should return paginated passengers', async () => {
      await prisma.passenger.createMany({
        data: [
          {
            institutionId,
            name: '홍길동',
            phoneNumber: '010-1234-5678',
            pickupAddress: '서울시 강남구',
            dropoffAddress: '서울시 서초구',
            shuttleType: 'MORNING',
          },
          {
            institutionId,
            name: '김철수',
            phoneNumber: '010-9999-8888',
            pickupAddress: '서울시 강남구',
            dropoffAddress: '서울시 서초구',
            shuttleType: 'EVENING',
          },
        ],
      });

      const response = await request(app.getHttpServer())
        .get(`/api/v1/passengers?institutionId=${institutionId}`)
        .expect(200);

      expect(response.body).toHaveLength(2);
    });

    it('should filter by shuttle type', async () => {
      await prisma.passenger.createMany({
        data: [
          {
            institutionId,
            name: '홍길동',
            phoneNumber: '010-1234-5678',
            pickupAddress: '서울시 강남구',
            dropoffAddress: '서울시 서초구',
            shuttleType: 'MORNING',
          },
          {
            institutionId,
            name: '김철수',
            phoneNumber: '010-9999-8888',
            pickupAddress: '서울시 강남구',
            dropoffAddress: '서울시 서초구',
            shuttleType: 'EVENING',
          },
        ],
      });

      const response = await request(app.getHttpServer())
        .get(`/api/v1/passengers?institutionId=${institutionId}&shuttleType=MORNING`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].shuttleType).toBe('MORNING');
    });
  });

  describe('GET /api/v1/passengers/:id', () => {
    it('should return passenger by id', async () => {
      const passenger = await prisma.passenger.create({
        data: {
          institutionId,
          name: '홍길동',
          phoneNumber: '010-1234-5678',
          pickupAddress: '서울시 강남구',
          dropoffAddress: '서울시 서초구',
          shuttleType: 'MORNING',
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/api/v1/passengers/${passenger.id}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: passenger.id,
        name: '홍길동',
      });
    });

    it('should return 404 for non-existent passenger', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/passengers/non-existent-id')
        .expect(404);
    });
  });

  describe('PATCH /api/v1/passengers/:id', () => {
    it('should update passenger name', async () => {
      const passenger = await prisma.passenger.create({
        data: {
          institutionId,
          name: '홍길동',
          phoneNumber: '010-1234-5678',
          pickupAddress: '서울시 강남구',
          dropoffAddress: '서울시 서초구',
          shuttleType: 'MORNING',
        },
      });

      const updateDto = {
        name: '김철수',
      };

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/passengers/${passenger.id}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.name).toBe('김철수');
    });
  });

  describe('DELETE /api/v1/passengers/:id', () => {
    it('should delete passenger', async () => {
      const passenger = await prisma.passenger.create({
        data: {
          institutionId,
          name: '홍길동',
          phoneNumber: '010-1234-5678',
          pickupAddress: '서울시 강남구',
          dropoffAddress: '서울시 서초구',
          shuttleType: 'MORNING',
        },
      });

      await request(app.getHttpServer())
        .delete(`/api/v1/passengers/${passenger.id}`)
        .expect(200);

      const deleted = await prisma.passenger.findUnique({
        where: { id: passenger.id },
      });
      expect(deleted).toBeNull();
    });
  });
});
