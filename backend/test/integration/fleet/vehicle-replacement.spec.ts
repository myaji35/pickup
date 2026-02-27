import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { PrismaService } from '../../../src/prisma/prisma.service';

/**
 * T244: Vehicle Replacement Scenario Integration Test
 * Tests the complete flow of replacing a vehicle while preserving passenger group assignments
 *
 * Scenario:
 * 1. Create vehicle A and connect to group G
 * 2. Add passengers to group G
 * 3. Delete vehicle A
 * 4. Create new vehicle B
 * 5. Connect vehicle B to group G
 * 6. Verify passengers are still in group G (not cascade deleted)
 */
describe('Vehicle Replacement Scenario (Integration)', () => {
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

  it('should preserve passenger group and passengers when replacing vehicle', async () => {
    // Step 1: Create passenger group
    const groupResponse = await request(app.getHttpServer())
      .post('/api/v1/passenger-groups')
      .send({
        institutionId,
        groupCode: 'REPLACE-001',
        name: '교체 테스트 그룹',
      })
      .expect(201);

    const groupId = groupResponse.body.data.id;

    // Step 2: Create old vehicle A with capacity 10
    const oldVehicleResponse = await request(app.getHttpServer())
      .post('/api/v1/vehicles')
      .send({
        institutionId,
        lastFourDigits: '1111',
        passengerCapacity: 10,
      })
      .expect(201);

    const oldVehicleId = oldVehicleResponse.body.data.id;

    // Step 3: Add 5 passengers to the group
    const passengerIds: string[] = [];
    for (let i = 0; i < 5; i++) {
      const passengerResponse = await request(app.getHttpServer())
        .post('/api/v1/passengers')
        .send({
          institutionId,
          name: `승객 ${i + 1}`,
          phoneNumber: `010-1234-${String(i).padStart(4, '0')}`,
          pickupAddress: `서울시 강남구 ${i + 1}번지`,
          dropoffAddress: `서울시 서초구 ${i + 1}번지`,
          shuttleType: 'MORNING',
          groupId,
        })
        .expect(201);

      passengerIds.push(passengerResponse.body.data.id);
    }

    // Verify passengers are created and assigned to group
    const passengersBeforeReplace = await prisma.passenger.findMany({
      where: { groupId },
    });
    expect(passengersBeforeReplace).toHaveLength(5);

    // Verify group passenger count
    const groupBeforeReplace = await prisma.passengerGroup.findUnique({
      where: { id: groupId },
    });
    expect(groupBeforeReplace?.totalPassengerCount).toBe(5);

    // Step 4: Connect old vehicle to group
    await request(app.getHttpServer())
      .post(`/api/v1/vehicles/${oldVehicleId}/connect-group`)
      .send({ groupId })
      .expect(200);

    // Verify connection
    const oldVehicle = await prisma.vehicle.findUnique({
      where: { id: oldVehicleId },
    });
    expect(oldVehicle?.currentGroupId).toBe(groupId);

    // Step 5: Delete old vehicle A
    await request(app.getHttpServer())
      .delete(`/api/v1/vehicles/${oldVehicleId}`)
      .expect(200);

    // Verify vehicle is deleted
    const deletedVehicle = await prisma.vehicle.findUnique({
      where: { id: oldVehicleId },
    });
    expect(deletedVehicle).toBeNull();

    // Step 6: Verify passengers and group still exist (not cascade deleted)
    const passengersAfterDelete = await prisma.passenger.findMany({
      where: { groupId },
    });
    expect(passengersAfterDelete).toHaveLength(5);

    const groupAfterDelete = await prisma.passengerGroup.findUnique({
      where: { id: groupId },
    });
    expect(groupAfterDelete).not.toBeNull();
    expect(groupAfterDelete?.totalPassengerCount).toBe(5);

    // Step 7: Create new vehicle B with capacity 12
    const newVehicleResponse = await request(app.getHttpServer())
      .post('/api/v1/vehicles')
      .send({
        institutionId,
        lastFourDigits: '2222',
        passengerCapacity: 12,
      })
      .expect(201);

    const newVehicleId = newVehicleResponse.body.data.id;

    // Step 8: Connect new vehicle B to the same group
    const reconnectResponse = await request(app.getHttpServer())
      .post(`/api/v1/vehicles/${newVehicleId}/connect-group`)
      .send({ groupId })
      .expect(200);

    expect(reconnectResponse.body.data.currentGroupId).toBe(groupId);

    // Step 9: Verify all passengers are still accessible and assigned to group
    const finalPassengers = await prisma.passenger.findMany({
      where: { groupId },
      orderBy: { name: 'asc' },
    });

    expect(finalPassengers).toHaveLength(5);
    expect(finalPassengers[0].name).toBe('승객 1');
    expect(finalPassengers[4].name).toBe('승객 5');

    // Verify new vehicle is connected to group
    const finalVehicle = await prisma.vehicle.findUnique({
      where: { id: newVehicleId },
    });
    expect(finalVehicle?.currentGroupId).toBe(groupId);

    // Verify group data is intact
    const finalGroup = await prisma.passengerGroup.findUnique({
      where: { id: groupId },
    });
    expect(finalGroup?.groupCode).toBe('REPLACE-001');
    expect(finalGroup?.name).toBe('교체 테스트 그룹');
    expect(finalGroup?.totalPassengerCount).toBe(5);
  });

  it('should fail to connect new vehicle if capacity is less than group passenger count', async () => {
    // Step 1: Create passenger group
    const groupResponse = await request(app.getHttpServer())
      .post('/api/v1/passenger-groups')
      .send({
        institutionId,
        groupCode: 'REPLACE-002',
        name: '정원 초과 테스트 그룹',
      })
      .expect(201);

    const groupId = groupResponse.body.data.id;

    // Step 2: Create old vehicle with capacity 10
    const oldVehicleResponse = await request(app.getHttpServer())
      .post('/api/v1/vehicles')
      .send({
        institutionId,
        lastFourDigits: '3333',
        passengerCapacity: 10,
      })
      .expect(201);

    const oldVehicleId = oldVehicleResponse.body.data.id;

    // Step 3: Add 8 passengers to group
    for (let i = 0; i < 8; i++) {
      await request(app.getHttpServer())
        .post('/api/v1/passengers')
        .send({
          institutionId,
          name: `승객 ${i + 1}`,
          phoneNumber: `010-2000-${String(i).padStart(4, '0')}`,
          pickupAddress: `서울시 강남구 ${i + 1}번지`,
          dropoffAddress: `서울시 서초구 ${i + 1}번지`,
          shuttleType: 'EVENING',
          groupId,
        })
        .expect(201);
    }

    // Step 4: Connect old vehicle to group (capacity 10 >= 8 passengers)
    await request(app.getHttpServer())
      .post(`/api/v1/vehicles/${oldVehicleId}/connect-group`)
      .send({ groupId })
      .expect(200);

    // Step 5: Delete old vehicle
    await request(app.getHttpServer())
      .delete(`/api/v1/vehicles/${oldVehicleId}`)
      .expect(200);

    // Step 6: Create new vehicle with insufficient capacity (only 5 seats)
    const newVehicleResponse = await request(app.getHttpServer())
      .post('/api/v1/vehicles')
      .send({
        institutionId,
        lastFourDigits: '4444',
        passengerCapacity: 5, // Less than 8 passengers
      })
      .expect(201);

    const newVehicleId = newVehicleResponse.body.data.id;

    // Step 7: Try to connect new vehicle - should fail due to capacity
    const failResponse = await request(app.getHttpServer())
      .post(`/api/v1/vehicles/${newVehicleId}/connect-group`)
      .send({ groupId })
      .expect(400);

    expect(failResponse.body.message).toContain('capacity');

    // Verify new vehicle is NOT connected
    const newVehicle = await prisma.vehicle.findUnique({
      where: { id: newVehicleId },
    });
    expect(newVehicle?.currentGroupId).toBeNull();

    // Verify passengers are still in group
    const passengers = await prisma.passenger.findMany({
      where: { groupId },
    });
    expect(passengers).toHaveLength(8);
  });

  it('should support multiple vehicle replacements for the same group', async () => {
    // Create group
    const groupResponse = await request(app.getHttpServer())
      .post('/api/v1/passenger-groups')
      .send({
        institutionId,
        groupCode: 'REPLACE-003',
        name: '다중 교체 테스트',
      })
      .expect(201);

    const groupId = groupResponse.body.data.id;

    // Add 3 passengers
    for (let i = 0; i < 3; i++) {
      await request(app.getHttpServer())
        .post('/api/v1/passengers')
        .send({
          institutionId,
          name: `승객 ${i + 1}`,
          phoneNumber: `010-3000-${String(i).padStart(4, '0')}`,
          pickupAddress: `서울시 강남구 ${i + 1}번지`,
          dropoffAddress: `서울시 서초구 ${i + 1}번지`,
          shuttleType: 'MORNING',
          groupId,
        })
        .expect(201);
    }

    // First vehicle
    const vehicle1 = await request(app.getHttpServer())
      .post('/api/v1/vehicles')
      .send({ institutionId, lastFourDigits: '5555', passengerCapacity: 8 })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/vehicles/${vehicle1.body.data.id}/connect-group`)
      .send({ groupId })
      .expect(200);

    // Replace with vehicle 2
    await request(app.getHttpServer())
      .delete(`/api/v1/vehicles/${vehicle1.body.data.id}`)
      .expect(200);

    const vehicle2 = await request(app.getHttpServer())
      .post('/api/v1/vehicles')
      .send({ institutionId, lastFourDigits: '6666', passengerCapacity: 10 })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/vehicles/${vehicle2.body.data.id}/connect-group`)
      .send({ groupId })
      .expect(200);

    // Replace with vehicle 3
    await request(app.getHttpServer())
      .delete(`/api/v1/vehicles/${vehicle2.body.data.id}`)
      .expect(200);

    const vehicle3 = await request(app.getHttpServer())
      .post('/api/v1/vehicles')
      .send({ institutionId, lastFourDigits: '7777', passengerCapacity: 12 })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/vehicles/${vehicle3.body.data.id}/connect-group`)
      .send({ groupId })
      .expect(200);

    // Verify passengers survived all replacements
    const finalPassengers = await prisma.passenger.findMany({
      where: { groupId },
    });
    expect(finalPassengers).toHaveLength(3);

    // Verify final vehicle is connected
    const finalVehicle = await prisma.vehicle.findUnique({
      where: { id: vehicle3.body.data.id },
    });
    expect(finalVehicle?.currentGroupId).toBe(groupId);
  });
});
