/**
 * Phase 12 Driver Seed Script
 *
 * Driver App 테스트용 데이터 생성
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Phase 12: Creating Driver test data...');

  // Get existing institution
  const institution = await prisma.institution.findFirst({
    where: { name: { contains: '서울' } },
  });

  if (!institution) {
    console.error('❌ No institution found. Please run main seed first.');
    return;
  }

  console.log(`✅ Found institution: ${institution.name}`);

  // Create Driver user
  const hashedPassword = await bcrypt.hash('password123', 10);

  const driver = await prisma.user.upsert({
    where: { email: 'driver@example.com' },
    update: {
      password: hashedPassword,
      name: '김기사',
      role: 'DRIVER',
      institutionId: institution.id,
      isActive: true,
    },
    create: {
      email: 'driver@example.com',
      password: hashedPassword,
      name: '김기사',
      role: 'DRIVER',
      institutionId: institution.id,
      isActive: true,
    },
  });

  console.log(`✅ Driver created: ${driver.email}`);

  // Create Vehicle
  const vehicle = await prisma.vehicle.upsert({
    where: {
      institutionId_lastFourDigits: {
        institutionId: institution.id,
        lastFourDigits: '3456',
      },
    },
    update: {},
    create: {
      institutionId: institution.id,
      lastFourDigits: '3456',
      passengerCapacity: 10,
    },
  });

  console.log(`✅ Vehicle created: ${vehicle.lastFourDigits}`);

  // Get passengers for route
  const passengers = await prisma.passenger.findMany({
    where: { institutionId: institution.id },
    take: 3,
    orderBy: { name: 'asc' },
  });

  console.log(`✅ Found ${passengers.length} passengers for route`);

  // Create Passenger user (for Passenger App testing)
  // Note: 이 User는 실제 Passenger 레코드(갈채아)와 동일한 이름을 사용하여 연결됩니다
  const passengerUser = await prisma.user.upsert({
    where: { email: 'passenger@example.com' },
    update: {
      password: hashedPassword,
      name: passengers.length > 0 ? passengers[0].name : '갈채아', // 첫 번째 승객과 같은 이름 사용
      role: 'PASSENGER',
      institutionId: institution.id,
      isActive: true,
    },
    create: {
      email: 'passenger@example.com',
      password: hashedPassword,
      name: passengers.length > 0 ? passengers[0].name : '갈채아', // 첫 번째 승객과 같은 이름 사용
      role: 'PASSENGER',
      institutionId: institution.id,
      isActive: true,
    },
  });

  console.log(`✅ Passenger user created: ${passengerUser.email} (${passengerUser.name})`);

  // Create Route with real passenger IDs
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  const route = await prisma.route.upsert({
    where: { id: 'route-morning-a' },
    update: {},
    create: {
      id: 'route-morning-a',
      institutionId: institution.id,
      vehicleId: vehicle.id,
      routeDate: todayDate,
      shuttleType: 'MORNING',
      optimizedSequence: passengers.length > 0 ? [
        {
          passengerId: passengers[0]?.id || null,
          sequence: 1,
          lat: 37.5,
          lng: 127.0,
          address: passengers[0]?.pickupAddress || '탑승지 1'
        },
        {
          passengerId: passengers[1]?.id || null,
          sequence: 2,
          lat: 37.505,
          lng: 127.01,
          address: passengers[1]?.pickupAddress || '탑승지 2'
        },
        ...(passengers.length > 2 ? [{
          passengerId: passengers[2]?.id || null,
          sequence: 3,
          lat: 37.51,
          lng: 127.02,
          address: passengers[2]?.pickupAddress || '탑승지 3'
        }] : []),
      ] : [
        { passengerId: null, sequence: 1, lat: 37.5, lng: 127.0, address: '탑승지 1' },
        { passengerId: null, sequence: 2, lat: 37.505, lng: 127.01, address: '탑승지 2' },
      ],
      totalDistance: 5.2,
      estimatedDuration: 30,
      status: 'OPTIMIZED',
    },
  });

  console.log(`✅ Route created: ${route.id} with ${passengers.length} passengers`);

  // Create Today Morning Trip
  const todayMorning = new Date();
  todayMorning.setHours(8, 0, 0, 0);

  const tripMorning = await prisma.trip.upsert({
    where: { id: 'trip-morning-today' },
    update: {},
    create: {
      id: 'trip-morning-today',
      institutionId: institution.id,
      vehicleId: vehicle.id,
      driverId: driver.id,
      routeId: route.id,
      type: 'MORNING',
      status: 'SCHEDULED',
      scheduledStart: todayMorning,
    },
  });

  console.log(`✅ Trip created: Morning (SCHEDULED)`);

  // Create Today Evening Trip
  const todayEvening = new Date();
  todayEvening.setHours(17, 0, 0, 0);

  const tripEvening = await prisma.trip.upsert({
    where: { id: 'trip-evening-today' },
    update: {},
    create: {
      id: 'trip-evening-today',
      institutionId: institution.id,
      vehicleId: vehicle.id,
      driverId: driver.id,
      routeId: route.id,
      type: 'EVENING',
      status: 'SCHEDULED',
      scheduledStart: todayEvening,
    },
  });

  console.log(`✅ Trip created: Evening (SCHEDULED)`);

  // Create Yesterday Trip (COMPLETED)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(8, 0, 0, 0);

  const yesterdayEnd = new Date(yesterday);
  yesterdayEnd.setHours(8, 30, 0, 0);

  const tripYesterday = await prisma.trip.upsert({
    where: { id: 'trip-yesterday' },
    update: {},
    create: {
      id: 'trip-yesterday',
      institutionId: institution.id,
      vehicleId: vehicle.id,
      driverId: driver.id,
      routeId: route.id,
      type: 'MORNING',
      status: 'COMPLETED',
      scheduledStart: yesterday,
      actualStart: yesterday,
      actualEnd: yesterdayEnd,
      startLocation: { lat: 37.5, lng: 127.0 },
      endLocation: { lat: 37.51, lng: 127.02 },
    },
  });

  console.log(`✅ Trip created: Yesterday (COMPLETED)`);

  // Create CheckIns using passengers from route
  if (passengers.length > 0) {
    // Create CheckIns for yesterday's trip
    const checkIn1Time = new Date(yesterday);
    checkIn1Time.setHours(8, 5, 0, 0);

    await prisma.checkIn.upsert({
      where: { id: 'checkin-passenger-1' },
      update: {},
      create: {
        id: 'checkin-passenger-1',
        tripId: tripYesterday.id,
        passengerId: passengers[0].id,
        type: 'BOARDING',
        timestamp: checkIn1Time,
        location: { lat: 37.5, lng: 127.0 },
      },
    });

    console.log(`✅ CheckIn created for ${passengers[0].name}`);

    if (passengers.length > 1) {
      const checkIn2Time = new Date(yesterday);
      checkIn2Time.setHours(8, 10, 0, 0);

      await prisma.checkIn.upsert({
        where: { id: 'checkin-passenger-2' },
        update: {},
        create: {
          id: 'checkin-passenger-2',
          tripId: tripYesterday.id,
          passengerId: passengers[1].id,
          type: 'BOARDING',
          timestamp: checkIn2Time,
          location: { lat: 37.505, lng: 127.01 },
        },
      });

      console.log(`✅ CheckIn created for ${passengers[1].name}`);
    }
  }

  console.log('\n🎉 Phase 12 seed completed!');
  console.log('\n📊 Summary:');
  console.log('- Driver: driver@example.com / password123');
  console.log('- Passenger: passenger@example.com / password123');
  console.log('- Vehicle: 3456 (10인승)');
  console.log('- Route: route-morning-a (OPTIMIZED)');
  console.log('- Trips: 3 (오늘 아침/저녁 SCHEDULED, 어제 COMPLETED)');
  console.log(`- CheckIns: ${Math.min(passengers.length, 2)} (어제 운행)`);
  console.log('\n🚀 Ready to test Driver App and Passenger App!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
