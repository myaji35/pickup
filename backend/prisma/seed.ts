import { PrismaClient, ShuttleType } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/ko'; // 한국어 faker

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // 1. InstitutionType 생성
  const institutionTypes = await Promise.all([
    prisma.institutionType.upsert({
      where: { typeCode: 'DAYCARE' },
      update: {},
      create: {
        typeCode: 'DAYCARE',
        typeName: '주간보호',
        minimumCareTimeHours: 8,
      },
    }),
    prisma.institutionType.upsert({
      where: { typeCode: 'GENERAL' },
      update: {},
      create: {
        typeCode: 'GENERAL',
        typeName: '일반',
        minimumCareTimeHours: null,
      },
    }),
  ]);

  console.log('✅ InstitutionTypes created:', institutionTypes.length);

  // 2. Institution 생성
  const institutions = await Promise.all([
    prisma.institution.upsert({
      where: { businessRegistrationNo: '1234567890' },
      update: {},
      create: {
        businessRegistrationNo: '1234567890',
        name: '서울 주간보호센터',
        institutionTypeId: institutionTypes[0].id, // DAYCARE
      },
    }),
    prisma.institution.upsert({
      where: { businessRegistrationNo: '2345678901' },
      update: {},
      create: {
        businessRegistrationNo: '2345678901',
        name: '부산 재가요양센터',
        institutionTypeId: institutionTypes[0].id, // DAYCARE
      },
    }),
    prisma.institution.upsert({
      where: { businessRegistrationNo: '3456789012' },
      update: {},
      create: {
        businessRegistrationNo: '3456789012',
        name: '대전 요양원',
        institutionTypeId: institutionTypes[1].id, // GENERAL
      },
    }),
  ]);

  console.log('✅ Institutions created:', institutions.length);

  // 3. PassengerGroup 생성
  const groups: any[] = [];
  for (const institution of institutions) {
    const group1 = await prisma.passengerGroup.upsert({
      where: {
        institutionId_groupCode: {
          institutionId: institution.id,
          groupCode: `${institution.name.substring(0, 2)}-A`,
        },
      },
      update: {},
      create: {
        institutionId: institution.id,
        groupCode: `${institution.name.substring(0, 2)}-A`,
        name: '오전 A조',
        totalPassengerCount: 0,
      },
    });

    const group2 = await prisma.passengerGroup.upsert({
      where: {
        institutionId_groupCode: {
          institutionId: institution.id,
          groupCode: `${institution.name.substring(0, 2)}-B`,
        },
      },
      update: {},
      create: {
        institutionId: institution.id,
        groupCode: `${institution.name.substring(0, 2)}-B`,
        name: '오후 B조',
        totalPassengerCount: 0,
      },
    });

    groups.push(group1, group2);
  }

  console.log('✅ PassengerGroups created:', groups.length);

  // 4. Vehicle 생성 (그룹에 연결)
  const existingVehicles = await prisma.vehicle.findMany();
  if (existingVehicles.length === 0) {
    for (const institution of institutions) {
      const institutionGroups = groups.filter((g) => g.institutionId === institution.id);

      await prisma.vehicle.create({
        data: {
          lastFourDigits: faker.string.numeric(4),
          passengerCapacity: faker.number.int({ min: 5, max: 15 }),
          institutionId: institution.id,
          currentGroupId: institutionGroups[0].id,
        },
      });

      await prisma.vehicle.create({
        data: {
          lastFourDigits: faker.string.numeric(4),
          passengerCapacity: faker.number.int({ min: 5, max: 15 }),
          institutionId: institution.id,
          currentGroupId: institutionGroups[1].id,
        },
      });
    }

    console.log('✅ Vehicles created');
  } else {
    console.log('⏭️  Vehicles already exist, skipping...');
  }

  // 5. Passenger 생성 (주간보호 기관은 스케줄 포함)
  const existingPassengers = await prisma.passenger.findMany();
  if (existingPassengers.length === 0) {
    for (const institution of institutions) {
      const institutionGroups = groups.filter((g) => g.institutionId === institution.id);
      const isDaycare = institution.institutionTypeId === institutionTypes[0].id;

      for (let i = 0; i < 20; i++) {
        const group = faker.helpers.arrayElement(institutionGroups);
        const shuttleType = faker.helpers.arrayElement([
          ShuttleType.MORNING,
          ShuttleType.EVENING,
        ]);

        const passenger = await prisma.passenger.create({
          data: {
            name: faker.person.fullName(),
            phoneNumber: `010${faker.string.numeric(8)}`,
            pickupAddress: faker.location.streetAddress(),
            dropoffAddress: faker.location.streetAddress(),
            shuttleType,
            institutionId: institution.id,
            groupId: group.id,
          },
        });

        // 주간보호 기관의 50% 승객에게 스케줄 추가
        if (isDaycare && Math.random() > 0.5) {
          const pickupHour = faker.number.int({ min: 7, max: 10 });
          const dropoffHour = faker.number.int({ min: 15, max: 19 });
          const pickupTime = `${String(pickupHour).padStart(2, '0')}:00`;
          const dropoffTime = `${String(dropoffHour).padStart(2, '0')}:00`;

          const careTimeHours = dropoffHour - pickupHour;
          const isCareTimeInsufficient = careTimeHours < 8;

          await prisma.passengerSchedule.create({
            data: {
              passengerId: passenger.id,
              desiredPickupTime: pickupTime,
              desiredDropoffTime: dropoffTime,
              careTimeHours,
              isCareTimeInsufficient,
            },
          });
        }
      }

      // totalPassengerCount 업데이트
      for (const group of institutionGroups) {
        const count = await prisma.passenger.count({
          where: { groupId: group.id },
        });

        await prisma.passengerGroup.update({
          where: { id: group.id },
          data: { totalPassengerCount: count },
        });
      }
    }

    console.log('✅ Passengers and Schedules created');
  } else {
    console.log('⏭️  Passengers already exist, skipping...');
  }

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
