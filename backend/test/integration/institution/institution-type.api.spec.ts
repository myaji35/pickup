import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import * as request from 'supertest';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { InstitutionModule } from '../../../src/institution/institution.module';

/**
 * T374: InstitutionType API Integration Tests
 *
 * 목적: InstitutionType API 엔드포인트 통합 테스트
 */
describe('InstitutionType API (Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [InstitutionModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
  });

  beforeEach(async () => {
    // Clean up database
    await prisma.institution.deleteMany({});
    await prisma.institutionType.deleteMany({});

    // Seed institution types
    await prisma.institutionType.createMany({
      data: [
        {
          typeCode: 'DAYCARE',
          typeName: '주간보호',
          minimumCareTimeHours: 8,
        },
        {
          typeCode: 'GENERAL',
          typeName: '일반',
          minimumCareTimeHours: null,
        },
      ],
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('GET /institution-types', () => {
    it('should return all institution types', async () => {
      // When
      const response = await request(app.getHttpServer())
        .get('/institution-types')
        .expect(200);

      // Then
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toMatchObject({
        typeCode: 'DAYCARE',
        typeName: '주간보호',
        minimumCareTimeHours: 8,
      });
      expect(response.body[1]).toMatchObject({
        typeCode: 'GENERAL',
        typeName: '일반',
        minimumCareTimeHours: null,
      });
    });

    it('should include id and timestamps in response', async () => {
      // When
      const response = await request(app.getHttpServer())
        .get('/institution-types')
        .expect(200);

      // Then
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('createdAt');
      expect(response.body[0]).toHaveProperty('updatedAt');
    });
  });

  describe('GET /institution-types/:id', () => {
    it('should return specific institution type by id', async () => {
      // Given
      const types = await prisma.institutionType.findMany();
      const daycareType = types.find((t) => t.typeCode === 'DAYCARE');

      // When
      const response = await request(app.getHttpServer())
        .get(`/institution-types/${daycareType!.id}`)
        .expect(200);

      // Then
      expect(response.body).toMatchObject({
        id: daycareType!.id,
        typeCode: 'DAYCARE',
        typeName: '주간보호',
        minimumCareTimeHours: 8,
      });
    });

    it('should return 404 for non-existent id', async () => {
      // When & Then
      await request(app.getHttpServer())
        .get('/institution-types/non-existent-id')
        .expect(404);
    });
  });
});
