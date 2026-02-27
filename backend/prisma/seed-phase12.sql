-- Phase 12 Additional Seed Data
-- Driver, Vehicles, Trips, CheckIns

-- Get institutionId for Seoul institution
DO $$
DECLARE
  inst_id UUID;
  driver_id UUID := gen_random_uuid();
  vehicle_id UUID := gen_random_uuid();
  route_id UUID := gen_random_uuid();
  trip_morning_id UUID := gen_random_uuid();
  trip_evening_id UUID := gen_random_uuid();
  trip_yesterday_id UUID := gen_random_uuid();
  passenger1_id UUID;
  passenger2_id UUID;
  hashed_pw TEXT := '$2b$10$rGfCkPYBvJZL45WFMU7w0.qZxHGK1O/7mFx/9xHZC0Y7pF4P3aK9W'; -- password123
BEGIN
  -- Get institution ID
  SELECT id INTO inst_id FROM institutions WHERE name LIKE '%서울%' LIMIT 1;

  -- Get some passenger IDs
  SELECT id INTO passenger1_id FROM passengers WHERE "institutionId" = inst_id LIMIT 1 OFFSET 0;
  SELECT id INTO passenger2_id FROM passengers WHERE "institutionId" = inst_id LIMIT 1 OFFSET 1;

  -- Create Driver user
  INSERT INTO users (id, email, password, name, role, "institutionId", "isActive", "createdAt", "updatedAt")
  VALUES (
    driver_id,
    'driver@example.com',
    hashed_pw,
    '김기사',
    'DRIVER',
    inst_id,
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (email) DO UPDATE SET "updatedAt" = NOW();

  RAISE NOTICE 'Driver created: driver@example.com';

  -- Create Vehicle
  INSERT INTO vehicles (id, "institutionId", "licensePlate", model, capacity, status, "createdAt", "updatedAt")
  VALUES (
    vehicle_id,
    inst_id,
    '12가3456',
    '스타렉스',
    10,
    'ACTIVE',
    NOW(),
    NOW()
  )
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Vehicle created: 12가3456';

  -- Create Route
  INSERT INTO routes (id, "institutionId", name, type, waypoints, "estimatedDuration", status, "createdAt", "updatedAt")
  VALUES (
    route_id,
    inst_id,
    '등원 노선 A',
    'MORNING',
    '[{"lat": 37.5, "lng": 127.0}, {"lat": 37.505, "lng": 127.01}]'::jsonb,
    30,
    'ACTIVE',
    NOW(),
    NOW()
  )
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Route created: 등원 노선 A';

  -- Create Today Morning Trip (SCHEDULED)
  INSERT INTO trips (id, "institutionId", "vehicleId", "driverId", "routeId", type, status, "scheduledStart", "createdAt", "updatedAt")
  VALUES (
    trip_morning_id,
    inst_id,
    vehicle_id,
    driver_id,
    route_id,
    'MORNING',
    'SCHEDULED',
    CURRENT_DATE + TIME '08:00:00',
    NOW(),
    NOW()
  )
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Trip created: Morning (SCHEDULED)';

  -- Create Today Evening Trip (SCHEDULED)
  INSERT INTO trips (id, "institutionId", "vehicleId", "driverId", "routeId", type, status, "scheduledStart", "createdAt", "updatedAt")
  VALUES (
    trip_evening_id,
    inst_id,
    vehicle_id,
    driver_id,
    route_id,
    'EVENING',
    'SCHEDULED',
    CURRENT_DATE + TIME '17:00:00',
    NOW(),
    NOW()
  )
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Trip created: Evening (SCHEDULED)';

  -- Create Yesterday Trip (COMPLETED)
  INSERT INTO trips (id, "institutionId", "vehicleId", "driverId", "routeId", type, status, "scheduledStart", "actualStart", "actualEnd", "startLocation", "endLocation", "createdAt", "updatedAt")
  VALUES (
    trip_yesterday_id,
    inst_id,
    vehicle_id,
    driver_id,
    route_id,
    'MORNING',
    'COMPLETED',
    (CURRENT_DATE - INTERVAL '1 day') + TIME '08:00:00',
    (CURRENT_DATE - INTERVAL '1 day') + TIME '08:00:00',
    (CURRENT_DATE - INTERVAL '1 day') + TIME '08:30:00',
    '{"lat": 37.5, "lng": 127.0}'::jsonb,
    '{"lat": 37.51, "lng": 127.02}'::jsonb,
    NOW(),
    NOW()
  )
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Trip created: Yesterday (COMPLETED)';

  -- Create CheckIns for yesterday's trip (if passengers exist)
  IF passenger1_id IS NOT NULL THEN
    INSERT INTO checkins (id, "tripId", "passengerId", type, timestamp, location, "createdAt")
    VALUES (
      gen_random_uuid(),
      trip_yesterday_id,
      passenger1_id,
      'BOARDING',
      (CURRENT_DATE - INTERVAL '1 day') + TIME '08:05:00',
      '{"lat": 37.5, "lng": 127.0}'::jsonb,
      NOW()
    )
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'CheckIn created for passenger 1';
  END IF;

  IF passenger2_id IS NOT NULL THEN
    INSERT INTO checkins (id, "tripId", "passengerId", type, timestamp, location, "createdAt")
    VALUES (
      gen_random_uuid(),
      trip_yesterday_id,
      passenger2_id,
      'BOARDING',
      (CURRENT_DATE - INTERVAL '1 day') + TIME '08:10:00',
      '{"lat": 37.505, "lng": 127.01}'::jsonb,
      NOW()
    )
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'CheckIn created for passenger 2';
  END IF;

  RAISE NOTICE '✅ Phase 12 seed data created successfully!';
  RAISE NOTICE 'Test Account: driver@example.com / password123';
END $$;
