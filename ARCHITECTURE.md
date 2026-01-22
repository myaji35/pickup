# Pickup MaaS - 기술 아키텍처 (2025 Q1-Q4)

> **Last Updated**: 2025-01-15
> **Architecture Version**: 2.0

---

## 📐 시스템 아키텍처 Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Client Layer                                 │
├─────────────────┬─────────────────┬────────────────┬────────────────┤
│  Admin Portal   │   Driver App    │ Passenger App  │  Guardian App  │
│   (Next.js)     │ (React Native)  │(React Native)  │(React Native)  │
│                 │                 │                │                │
│  - Institution  │  - Daily Trips  │  - Schedule    │  - Track Child │
│  - Fleet Mgmt   │  - Navigation   │  - Tracking    │  - Alerts      │
│  - BI Dashboard │  - Check-in     │  - Request     │  - History     │
└────────┬────────┴────────┬────────┴────────┬───────┴────────┬───────┘
         │                 │                 │                │
         └─────────────────┴─────────────────┴────────────────┘
                                  │
                         HTTPS / WebSocket
                                  │
┌─────────────────────────────────┼─────────────────────────────────┐
│                          API Gateway Layer                          │
│                     (NestJS + JWT Auth)                             │
├─────────────────────────────────────────────────────────────────────┤
│  - Rate Limiting                                                    │
│  - Authentication & Authorization (JWT)                             │
│  - Request Validation                                               │
│  - CORS                                                             │
└─────────────────────────────────┬─────────────────────────────────┘
                                  │
         ┌────────────────────────┼────────────────────────┐
         │                        │                        │
         v                        v                        v
┌────────────────┐      ┌────────────────┐      ┌────────────────┐
│ Core Services  │      │ Optimization   │      │ Real-time      │
│                │      │ Services       │      │ Services       │
├────────────────┤      ├────────────────┤      ├────────────────┤
│ • Institution  │      │ • Route        │      │ • Notification │
│ • Fleet        │      │   Optimizer    │      │ • GPS Tracking │
│ • Roster       │      │   (OR-Tools)   │      │ • WebSocket    │
│ • User/Auth    │      │ • AI/ML        │      │ • Push (FCM)   │
│ • Subscription │      │   Engine       │      │ • Event Bus    │
└────────┬───────┘      └────────┬───────┘      └────────┬───────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    v                         v
          ┌──────────────────┐      ┌──────────────────┐
          │  PostgreSQL 15+  │      │   Redis 7.x      │
          │                  │      │                  │
          │  • Core Data     │      │  • Session       │
          │  • Transactions  │      │  • Cache         │
          │  • Analytics     │      │  • Job Queue     │
          │    (Materialized │      │  • Pub/Sub       │
          │     Views)       │      │  • Rate Limit    │
          └──────────────────┘      └──────────────────┘
                    │
                    v
          ┌──────────────────┐
          │  External APIs   │
          ├──────────────────┤
          │ • Google Maps    │
          │   - Geocoding    │
          │   - Roads API    │
          │   - Distance     │
          │     Matrix       │
          │ • Kakao Maps     │
          │ • Naver Maps     │
          │ • Firebase FCM   │
          │ • SMS Gateway    │
          │ • OCR Service    │
          └──────────────────┘
```

---

## 🏗️ 백엔드 아키텍처 (NestJS)

### 모듈 구조 (DDD - Domain-Driven Design)

```
backend/src/
├── main.ts
├── app.module.ts
│
├── common/                          # 공통 모듈
│   ├── auth/
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   ├── strategies/
│   │   │   ├── jwt.strategy.ts
│   │   │   └── local.strategy.ts
│   │   └── decorators/
│   │       ├── current-user.decorator.ts
│   │       └── roles.decorator.ts
│   ├── database/
│   │   ├── prisma.service.ts
│   │   └── prisma.module.ts
│   ├── geocoding/
│   │   ├── geocoding.service.ts      # Kakao/Naver Maps
│   │   └── geocoding.module.ts
│   ├── exceptions/
│   │   └── custom-exceptions.ts
│   └── interceptors/
│       ├── logging.interceptor.ts
│       └── transform.interceptor.ts
│
├── institution/                     # Institution Context
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── institution.entity.ts
│   │   │   └── institution-type.entity.ts
│   │   ├── value-objects/
│   │   │   └── business-registration-no.vo.ts
│   │   └── repositories/
│   │       └── institution.repository.interface.ts
│   ├── application/
│   │   ├── use-cases/
│   │   │   ├── create-institution.use-case.ts
│   │   │   ├── approve-institution.use-case.ts
│   │   │   └── suspend-institution.use-case.ts
│   │   └── dto/
│   │       ├── create-institution.dto.ts
│   │       └── institution-response.dto.ts
│   ├── infrastructure/
│   │   ├── persistence/
│   │   │   └── institution.repository.ts
│   │   └── config/
│   ├── interface/
│   │   └── controllers/
│   │       ├── institution.controller.ts
│   │       └── admin.controller.ts
│   └── institution.module.ts
│
├── fleet/                           # Fleet Context
│   ├── domain/
│   │   ├── entities/
│   │   │   └── vehicle.entity.ts
│   │   └── repositories/
│   │       └── vehicle.repository.interface.ts
│   ├── application/
│   │   ├── use-cases/
│   │   │   ├── register-vehicle.use-case.ts
│   │   │   └── assign-vehicle-to-group.use-case.ts
│   │   └── dto/
│   ├── infrastructure/
│   │   └── persistence/
│   │       └── vehicle.repository.ts
│   ├── interface/
│   │   └── controllers/
│   │       └── vehicle.controller.ts
│   └── fleet.module.ts
│
├── roster/                          # Roster Context
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── passenger.entity.ts
│   │   │   ├── passenger-group.entity.ts
│   │   │   └── passenger-schedule.entity.ts
│   │   └── services/
│   │       └── care-time-validator.service.ts
│   ├── application/
│   │   ├── use-cases/
│   │   │   ├── create-passenger.use-case.ts
│   │   │   ├── upload-passengers-excel.use-case.ts
│   │   │   └── validate-8hour-care.use-case.ts
│   │   └── dto/
│   ├── infrastructure/
│   │   └── persistence/
│   │       ├── passenger.repository.ts
│   │       └── passenger-group.repository.ts
│   ├── interface/
│   │   └── controllers/
│   │       └── passenger.controller.ts
│   └── roster.module.ts
│
├── route/                           # Route Optimization (Q1)
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── route.entity.ts
│   │   │   └── waypoint.entity.ts
│   │   ├── value-objects/
│   │   │   ├── coordinates.vo.ts
│   │   │   └── optimization-config.vo.ts
│   │   └── services/
│   │       └── route-optimizer.service.ts
│   ├── application/
│   │   ├── use-cases/
│   │   │   ├── optimize-route.use-case.ts
│   │   │   ├── recalculate-eta.use-case.ts
│   │   │   └── get-route-details.use-case.ts
│   │   └── dto/
│   ├── infrastructure/
│   │   ├── persistence/
│   │   │   └── route.repository.ts
│   │   ├── external/
│   │   │   ├── or-tools-solver.service.ts
│   │   │   └── google-maps-distance.service.ts
│   │   └── config/
│   ├── interface/
│   │   └── controllers/
│   │       └── route.controller.ts
│   └── route.module.ts
│
├── notification/                    # Notification System (Q1)
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── notification.entity.ts
│   │   │   └── device-token.entity.ts
│   │   └── services/
│   │       └── notification.service.ts
│   ├── application/
│   │   ├── use-cases/
│   │   │   ├── send-push-notification.use-case.ts
│   │   │   ├── register-device-token.use-case.ts
│   │   │   └── send-sms.use-case.ts
│   │   └── dto/
│   ├── infrastructure/
│   │   ├── persistence/
│   │   │   └── notification.repository.ts
│   │   ├── external/
│   │   │   ├── fcm.service.ts
│   │   │   └── sms.service.ts
│   │   └── jobs/
│   │       ├── approaching-alert.processor.ts
│   │       └── geofence-checker.processor.ts
│   ├── interface/
│   │   ├── controllers/
│   │   │   └── notification.controller.ts
│   │   └── gateways/
│   │       └── notification.gateway.ts (WebSocket)
│   └── notification.module.ts
│
├── driver/                          # Driver App API (Q2)
│   ├── domain/
│   │   └── services/
│   │       └── driver.service.ts
│   ├── application/
│   │   ├── use-cases/
│   │   │   ├── get-today-trips.use-case.ts
│   │   │   ├── check-in-passenger.use-case.ts
│   │   │   └── upload-receipt.use-case.ts
│   │   └── dto/
│   ├── interface/
│   │   └── controllers/
│   │       └── driver.controller.ts
│   └── driver.module.ts
│
├── trip/                            # GPS Tracking (Q3)
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── trip.entity.ts
│   │   │   ├── gps-log.entity.ts
│   │   │   └── passenger-check-in.entity.ts
│   │   └── services/
│   │       ├── gps-tracking.service.ts
│   │       └── distance-calculator.service.ts
│   ├── application/
│   │   ├── use-cases/
│   │   │   ├── start-trip.use-case.ts
│   │   │   ├── log-gps.use-case.ts
│   │   │   ├── complete-trip.use-case.ts
│   │   │   └── calculate-distance.use-case.ts
│   │   └── dto/
│   ├── infrastructure/
│   │   ├── persistence/
│   │   │   ├── trip.repository.ts
│   │   │   └── gps-log.repository.ts
│   │   └── external/
│   │       └── roads-api.service.ts (Snap to Roads)
│   ├── interface/
│   │   ├── controllers/
│   │   │   └── trip.controller.ts
│   │   └── gateways/
│   │       └── trip-tracking.gateway.ts (WebSocket)
│   └── trip.module.ts
│
├── analytics/                       # BI Dashboard (Q3)
│   ├── domain/
│   │   ├── entities/
│   │   │   └── analytics-daily-summary.entity.ts
│   │   └── services/
│   │       └── analytics.service.ts
│   ├── application/
│   │   ├── use-cases/
│   │   │   ├── get-dashboard-summary.use-case.ts
│   │   │   ├── get-trends.use-case.ts
│   │   │   └── generate-report.use-case.ts
│   │   └── dto/
│   ├── infrastructure/
│   │   ├── persistence/
│   │   │   └── analytics.repository.ts
│   │   └── jobs/
│   │       └── daily-aggregation.processor.ts
│   ├── interface/
│   │   └── controllers/
│   │       └── analytics.controller.ts
│   └── analytics.module.ts
│
├── passenger/                       # Passenger App API (Q4)
│   ├── domain/
│   │   └── services/
│   │       └── passenger.service.ts
│   ├── application/
│   │   ├── use-cases/
│   │   │   ├── get-my-schedules.use-case.ts
│   │   │   ├── track-vehicle.use-case.ts
│   │   │   └── get-history.use-case.ts
│   │   └── dto/
│   ├── interface/
│   │   └── controllers/
│   │       └── passenger.controller.ts
│   └── passenger.module.ts
│
└── shuttle-request/                 # Temporary Shuttle (Q4)
    ├── domain/
    │   ├── entities/
    │   │   └── shuttle-request.entity.ts
    │   └── services/
    │       └── shuttle-request.service.ts
    ├── application/
    │   ├── use-cases/
    │   │   ├── create-shuttle-request.use-case.ts
    │   │   ├── approve-request.use-case.ts
    │   │   └── assign-vehicle.use-case.ts
    │   └── dto/
    ├── infrastructure/
    │   └── persistence/
    │       └── shuttle-request.repository.ts
    ├── interface/
    │   └── controllers/
    │       └── shuttle-request.controller.ts
    └── shuttle-request.module.ts
```

---

## 🗄️ 데이터베이스 아키텍처

### PostgreSQL Schema Design

```sql
-- ============================================================================
-- Core Tables (현재 구현됨)
-- ============================================================================

users
├── id (PK)
├── email (UNIQUE)
├── password (bcrypt)
├── role (ENUM: SUPER_ADMIN, INSTITUTION_ADMIN, DRIVER)
├── institutionId (FK → institutions.id)
└── Indexes: email, institutionId, role

institutions
├── id (PK)
├── businessRegistrationNo (UNIQUE, 10자리)
├── name
├── institutionTypeId (FK → institution_types.id)
├── status (ENUM: PENDING, ACTIVE, SUSPENDED, INACTIVE)
└── Indexes: businessRegistrationNo, institutionTypeId, status

institution_types
├── id (PK)
├── typeCode (UNIQUE: DAYCARE, GENERAL)
├── typeName
└── minimumCareTimeHours (nullable)

vehicles
├── id (PK)
├── lastFourDigits (4자리)
├── passengerCapacity (5-15)
├── institutionId (FK → institutions.id)
├── currentGroupId (FK → passenger_groups.id, nullable)
└── Indexes: (institutionId, lastFourDigits) UNIQUE, lastFourDigits

passenger_groups
├── id (PK)
├── institutionId (FK → institutions.id)
├── groupCode (기관 내 UNIQUE)
├── name
├── totalPassengerCount
└── Indexes: (institutionId, groupCode) UNIQUE

passengers
├── id (PK)
├── name
├── phoneNumber (기관 내 UNIQUE)
├── pickupAddress, dropoffAddress
├── pickupLat, pickupLng (Q2부터 추가)
├── dropoffLat, dropoffLng (Q2부터 추가)
├── shuttleType (ENUM: MORNING, EVENING, TEMPORARY)
├── institutionId (FK → institutions.id)
├── groupId (FK → passenger_groups.id, nullable)
└── Indexes: (institutionId, phoneNumber) UNIQUE, (institutionId, shuttleType), groupId

passenger_schedules
├── id (PK)
├── passengerId (FK → passengers.id, UNIQUE - 1:1)
├── pickupTime, dropoffTime (HH:MM)
├── careTimeHours (계산 값)
├── isCareTimeInsufficient (boolean)
└── Indexes: passengerId, isCareTimeInsufficient

-- ============================================================================
-- Q1: Route Optimization + Notification
-- ============================================================================

routes
├── id (PK)
├── institutionId (FK → institutions.id)
├── vehicleId (FK → vehicles.id)
├── routeDate (DATE)
├── shuttleType (ENUM)
├── optimizedSequence (JSONB - 승차 순서 배열)
├── totalDistance (Float - km)
├── estimatedDuration (Int - minutes)
├── status (ENUM: DRAFT, OPTIMIZED, IN_PROGRESS, COMPLETED)
├── optimizationTime (Int - ms)
└── Indexes: (institutionId, routeDate, shuttleType), (vehicleId, routeDate)

device_tokens
├── id (PK)
├── userId (nullable)
├── token (UNIQUE - FCM token)
├── platform (ENUM: IOS, ANDROID, WEB)
├── isActive (boolean)
└── Indexes: userId

notifications
├── id (PK)
├── recipientId (User or Passenger ID)
├── title, body
├── type (ENUM: TRIP_STARTED, APPROACHING, ARRIVED, BOARDING_CONFIRMED, ...)
├── data (JSONB - 추가 페이로드)
├── status (ENUM: PENDING, SENT, FAILED, READ)
├── sentAt, readAt
└── Indexes: (recipientId, status), (type, createdAt)

-- ============================================================================
-- Q3: GPS Tracking + Analytics
-- ============================================================================

trips
├── id (PK)
├── routeId (FK → routes.id)
├── driverId (FK → users.id)
├── startTime, endTime
├── status (ENUM: SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED)
├── totalDistanceKm (계산 값)
├── totalDurationMinutes (계산 값)
└── Indexes: routeId, (driverId, startTime)

gps_logs
├── id (PK)
├── tripId (FK → trips.id)
├── latitude, longitude
├── accuracy, speed, heading
├── timestamp
└── Indexes: (tripId, timestamp)
└── Partitioning: 월별 파티셔닝 (성능 최적화)

passenger_check_ins
├── id (PK)
├── tripId, passengerId
├── type (ENUM: BOARDING, ALIGHTING)
├── latitude, longitude (체크인 위치)
├── timestamp
└── Indexes: (tripId, passengerId)

analytics_daily_summary (Materialized View)
├── id (PK)
├── institutionId
├── date (DATE)
├── totalTrips, completedTrips, cancelledTrips
├── totalPassengers, actualBoarding, noShowCount
├── totalDistanceKm, totalDurationMin
├── onTimeTrips, lateTrips, earlyTrips
├── avgOccupancyRate (%)
└── Indexes: (institutionId, date) UNIQUE

-- ============================================================================
-- Q4: Passenger App + Temporary Shuttle
-- ============================================================================

shuttle_requests
├── id (PK)
├── passengerId (FK → passengers.id)
├── institutionId (FK → institutions.id)
├── requestDate (DATE)
├── pickupAddress, dropoffAddress
├── pickupLat, pickupLng
├── dropoffLat, dropoffLng
├── desiredTime (HH:MM)
├── status (ENUM: PENDING, APPROVED, ASSIGNED, COMPLETED, REJECTED, CANCELLED)
├── rejectionReason (nullable)
├── assignedVehicleId, assignedTripId (nullable)
└── Indexes: (institutionId, status), (passengerId, requestDate)

-- ============================================================================
-- Subscription & Billing (Phase 11 - 향후)
-- ============================================================================

plans
├── id (PK)
├── name, code (UNIQUE)
├── maxVehicles, maxPassengers (nullable = unlimited)
├── monthlyPrice
├── features (JSONB)
├── isActive
└── Indexes: code, isActive

subscriptions
├── id (PK)
├── institutionId (FK → institutions.id)
├── planId (FK → plans.id)
├── status (ENUM: TRIAL, ACTIVE, EXPIRED, CANCELLED)
├── startDate, endDate, trialEndsAt
├── autoRenew
└── Indexes: institutionId, planId, status
```

### Materialized View (Q3 Analytics)

```sql
-- 매일 새벽 1시 자동 갱신
CREATE MATERIALIZED VIEW analytics_daily_summary AS
SELECT
  t.institution_id,
  DATE(t.start_time) AS date,
  COUNT(*) AS total_trips,
  COUNT(*) FILTER (WHERE t.status = 'COMPLETED') AS completed_trips,
  COUNT(*) FILTER (WHERE t.status = 'CANCELLED') AS cancelled_trips,
  SUM(t.total_distance_km) AS total_distance_km,
  SUM(t.total_duration_minutes) AS total_duration_min,
  -- 정시 도착률 계산 (±5분 이내)
  COUNT(*) FILTER (WHERE ABS(EXTRACT(EPOCH FROM (t.end_time - r.estimated_arrival)) / 60) <= 5) AS on_time_trips,
  -- 평균 탑승률 계산
  AVG(pc.boarding_count * 100.0 / v.passenger_capacity) AS avg_occupancy_rate
FROM trips t
JOIN routes r ON t.route_id = r.id
JOIN vehicles v ON r.vehicle_id = v.id
LEFT JOIN (
  SELECT trip_id, COUNT(*) AS boarding_count
  FROM passenger_check_ins
  WHERE type = 'BOARDING'
  GROUP BY trip_id
) pc ON t.id = pc.trip_id
GROUP BY t.institution_id, DATE(t.start_time);

-- 자동 갱신 (Cron Job)
CREATE INDEX ON analytics_daily_summary (institution_id, date);
REFRESH MATERIALIZED VIEW CONCURRENTLY analytics_daily_summary;
```

---

## 🔧 기술 스택 상세

### Backend

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Framework | NestJS | 10.x | API 서버, DI 컨테이너 |
| Runtime | Node.js | 20 LTS | JavaScript 런타임 |
| Language | TypeScript | 5.x | 타입 안전성 |
| ORM | Prisma | 5.x | DB 접근, 마이그레이션 |
| Database | PostgreSQL | 15+ | 관계형 데이터베이스 |
| Cache | Redis | 7.x | 세션, 큐, Pub/Sub |
| Queue | Bull | 4.x | 백그라운드 작업 |
| Validation | class-validator | 0.14 | DTO 검증 |
| Auth | JWT (@nestjs/jwt) | 11.x | 인증/인가 |
| Testing | Vitest | 1.x | 단위/통합 테스트 |

### Frontend (Admin Portal)

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Framework | Next.js | 14.x | React 프레임워크 |
| UI Library | shadcn/ui | latest | 컴포넌트 라이브러리 |
| Styling | TailwindCSS | 3.x | CSS 프레임워크 |
| State | Zustand | 4.x | 경량 상태 관리 |
| Data Fetching | TanStack Query | 5.x | 서버 상태 관리 |
| Forms | React Hook Form | 7.x | 폼 관리 |
| Validation | Zod | 3.x | 스키마 검증 |
| Charts | Chart.js / Recharts | latest | 데이터 시각화 |

### Mobile (Driver/Passenger App)

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Framework | React Native | 0.73 | 크로스 플랫폼 |
| Build | Expo | 50.x | 개발 환경 |
| Navigation | React Navigation | 6.x | 화면 라우팅 |
| State | Zustand | 4.x | 상태 관리 |
| Data Fetching | TanStack Query | 5.x | API 통신 |
| Maps | React Native Maps | 1.10 | 지도 표시 |
| Location | expo-location | 17.x | GPS 추적 |
| Camera | expo-camera | 14.x | QR 스캔 |
| Storage | AsyncStorage | 1.21 | 로컬 저장소 |

### External Services

| Service | Provider | Purpose | Cost |
|---------|----------|---------|------|
| VRP Solver | Google OR-Tools | 경로 최적화 | Free (Self-hosted) |
| Push Notification | Firebase FCM | 모바일 알림 | Free (up to 10M/month) |
| Geocoding | Kakao Maps API | 주소 → 좌표 변환 | ₩0.5/call |
| Roads API | Google Maps | GPS → 도로 스냅 | $5/1,000 calls |
| Distance Matrix | Google Maps | 거리 계산 | $5/1,000 elements |
| SMS | NHN Cloud (optional) | 긴급 알림 | ₩8/건 |
| OCR | NAVER CLOVA | 영수증 처리 (Q2+) | ₩10/건 |

---

## 🔐 보안 아키텍처

### Authentication & Authorization

```typescript
// JWT 기반 인증
// 1. Login → Access Token (15분) + Refresh Token (7일)
// 2. Access Token 만료 → Refresh Token으로 재발급
// 3. Refresh Token 만료 → 재로그인

// Role-Based Access Control (RBAC)
enum UserRole {
  SUPER_ADMIN,        // 전체 시스템 관리
  INSTITUTION_ADMIN,  // 기관 관리자 (자기 기관만)
  DRIVER,             // 운전기사 (읽기 전용)
}

// Route Guards
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles('SUPER_ADMIN')
async approveInstitution() { ... }

@UseGuards(JwtAuthGuard, RoleGuard)
@Roles('INSTITUTION_ADMIN', 'SUPER_ADMIN')
async getMyInstitution() { ... }
```

### Data Isolation (Multi-tenancy)

```typescript
// 모든 쿼리에 institutionId 필터 자동 적용
// Prisma Middleware를 통한 Row-Level Security

prisma.$use(async (params, next) => {
  if (params.model === 'Passenger') {
    if (params.action === 'findMany') {
      params.args.where = {
        ...params.args.where,
        institutionId: currentUser.institutionId,
      };
    }
  }
  return next(params);
});
```

### API Security

```typescript
// Rate Limiting (Redis)
@Throttle(100, 60) // 60초당 100 요청
@Controller('api/routes')

// Input Validation (class-validator)
export class CreatePassengerDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @Matches(/^01[0-9]{8,9}$/)
  phoneNumber: string;
}

// CORS
app.enableCors({
  origin: [
    'https://admin.pickup-maas.com',
    'http://localhost:3012', // dev only
  ],
  credentials: true,
});
```

---

## 📊 성능 최적화 전략

### Database Optimization

```sql
-- 1. Proper Indexing
CREATE INDEX idx_passengers_institution_shuttle ON passengers(institution_id, shuttle_type);
CREATE INDEX idx_gps_logs_trip_timestamp ON gps_logs(trip_id, timestamp);

-- 2. Partitioning (GPS Logs - 월별)
CREATE TABLE gps_logs_2025_01 PARTITION OF gps_logs
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

-- 3. Materialized Views (Analytics)
REFRESH MATERIALIZED VIEW CONCURRENTLY analytics_daily_summary;

-- 4. Connection Pooling
DATABASE_URL="postgresql://user:pass@host:5432/db?pool_timeout=30&pool_size=20"
```

### Caching Strategy

```typescript
// Redis Cache Pattern
// 1. Read-Through Cache
async getInstitution(id: string) {
  const cached = await redis.get(`institution:${id}`);
  if (cached) return JSON.parse(cached);

  const institution = await prisma.institution.findUnique({ where: { id } });
  await redis.set(`institution:${id}`, JSON.stringify(institution), 'EX', 3600); // 1시간
  return institution;
}

// 2. Cache Invalidation
async updateInstitution(id: string, data: any) {
  const updated = await prisma.institution.update({ where: { id }, data });
  await redis.del(`institution:${id}`); // 캐시 무효화
  return updated;
}
```

### API Optimization

```typescript
// 1. Pagination
@Get('passengers')
async getPassengers(
  @Query('page') page = 1,
  @Query('limit') limit = 20
) {
  const skip = (page - 1) * limit;
  return prisma.passenger.findMany({ skip, take: limit });
}

// 2. Field Selection (GraphQL-like)
@Get('passengers/:id')
async getPassenger(
  @Param('id') id: string,
  @Query('fields') fields?: string // "name,phoneNumber,pickupAddress"
) {
  const select = fields ? fields.split(',').reduce((acc, f) => ({ ...acc, [f]: true }), {}) : undefined;
  return prisma.passenger.findUnique({ where: { id }, select });
}

// 3. Batch Loading (DataLoader pattern)
const passengerLoader = new DataLoader(async (ids: string[]) => {
  const passengers = await prisma.passenger.findMany({
    where: { id: { in: ids } },
  });
  return ids.map(id => passengers.find(p => p.id === id));
});
```

---

## 🚀 배포 아키텍처 (향후)

### Cloud Infrastructure (AWS 예시)

```
┌─────────────────────────────────────────────────────────────┐
│                        Route 53 (DNS)                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         v
┌─────────────────────────────────────────────────────────────┐
│           CloudFront (CDN) + WAF (DDoS Protection)          │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
         v                               v
┌──────────────────┐          ┌──────────────────┐
│  S3 (Static)     │          │  ALB (API)       │
│  - Next.js Build │          │  - Health Check  │
│  - Assets        │          │  - SSL Termination│
└──────────────────┘          └────────┬─────────┘
                                       │
                 ┌─────────────────────┴─────────────────────┐
                 │                                           │
                 v                                           v
       ┌───────────────────┐                      ┌───────────────────┐
       │  ECS Fargate      │                      │  ECS Fargate      │
       │  (NestJS API)     │                      │  (Worker)         │
       │  - Auto Scaling   │                      │  - Bull Queue     │
       │  - Multi-AZ       │                      │  - Notification   │
       └─────────┬─────────┘                      └─────────┬─────────┘
                 │                                           │
         ┌───────┴───────┬───────────────┬──────────────────┘
         │               │               │
         v               v               v
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  RDS         │ │  ElastiCache │ │  S3          │
│  PostgreSQL  │ │  Redis       │ │  (Uploads)   │
│  - Multi-AZ  │ │  - Cluster   │ └──────────────┘
│  - Read      │ │  - Sentinel  │
│    Replica   │ └──────────────┘
└──────────────┘
```

### Docker Compose (개발 환경)

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: pickup_maas
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: secret
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://admin:secret@postgres:5432/pickup_maas
      REDIS_URL: redis://redis:6379
      JWT_SECRET: dev_secret
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis
    volumes:
      - ./backend:/app
      - /app/node_modules

  frontend:
    build: ./frontend
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3000
    ports:
      - "3012:3012"
    volumes:
      - ./frontend:/app
      - /app/node_modules

volumes:
  postgres_data:
```

---

## 📈 모니터링 & 로깅

### Application Monitoring

```typescript
// OpenTelemetry / Prometheus 통합 (향후)
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

@Module({
  imports: [
    PrometheusModule.register({
      defaultMetrics: { enabled: true },
      path: '/metrics',
    }),
  ],
})

// Custom Metrics
const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
});
```

### Logging Strategy

```typescript
// Winston Logger
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

const logger = WinstonModule.createLogger({
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
    }),
  ],
});

// Structured Logging
logger.log({
  level: 'info',
  message: 'Route optimized',
  context: {
    routeId: 'route-123',
    vehicleId: 'vehicle-456',
    optimizationTime: 3245, // ms
    passengerCount: 12,
  },
});
```

---

## 🔄 CI/CD Pipeline (향후)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Tests
        run: |
          npm install
          npm run test
          npm run test:e2e

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Build Docker Image
        run: docker build -t pickup-backend:${{ github.sha }} .
      - name: Push to ECR
        run: |
          aws ecr get-login-password | docker login ...
          docker push pickup-backend:${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Update ECS Service
        run: |
          aws ecs update-service \
            --cluster pickup-prod \
            --service backend \
            --force-new-deployment
```

---

**문서 버전**: 2.0
**최종 업데이트**: 2025-01-15
**담당자**: Architecture Team
