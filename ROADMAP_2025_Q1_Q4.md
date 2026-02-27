# Pickup MaaS 고도화 로드맵 (2025 Q1-Q4)

> **프로젝트 목표**: MVP에서 시장 차별화 가능한 B2B MaaS 플랫폼으로 진화
> **기술 스택**: NestJS + Next.js 14 + PostgreSQL + Prisma + TanStack Query

---

## 📊 Executive Summary

| Quarter | 핵심 목표 | 비즈니스 가치 | 예상 소요 시간 |
|---------|----------|-------------|------------|
| **Q1** | AI 경로 최적화 + 실시간 알림 | 운영 효율 20% 향상, 고객 만족도 증대 | 10-12주 |
| **Q2** | Driver App + Excel 고도화 | 기사 업무 자동화, 데이터 품질 향상 | 10-12주 |
| **Q3** | GPS 트래킹 + BI 대시보드 | 데이터 기반 의사결정, 투명한 비용 관리 | 10-12주 |
| **Q4** | Passenger App + 임시 셔틀 | 서비스 차별화, 신규 수익원 확보 | 10-12주 |

**총 예상 기간**: 40-48주 (약 10-12개월)

---

## 🎯 Q1: AI 경로 최적화 + 실시간 알림 (Week 1-12)

### 비즈니스 목표
- 수동 배차에서 AI 기반 자동 배차로 전환
- 승객/보호자에게 실시간 운행 상태 알림 제공
- **핵심 가치**: 운행 시간 15-20% 단축, 연료비 절감, 고객 이탈률 감소

### Phase 1.1: Google OR-Tools 경로 최적화 엔진 (Week 1-6)

#### 기술 스택
```typescript
// 신규 의존성
- @google-cloud/optimization: ^1.0.0  // Cloud Fleet Routing API
- or-tools: ^9.7.0                    // Local VRP solver (optional)
- @turf/turf: ^6.5.0                  // 지리 계산 (거리, 중심점)
```

#### 데이터 모델 확장 (Prisma Schema)
```prisma
// 새 모듈: Route Context
model Route {
  id            String   @id @default(uuid())
  institutionId String
  institution   Institution @relation(fields: [institutionId], references: [id], onDelete: Cascade)

  vehicleId     String
  vehicle       Vehicle @relation(fields: [vehicleId], references: [id], onDelete: Cascade)

  routeDate     DateTime // 경로 생성 날짜
  shuttleType   ShuttleType // MORNING, EVENING, TEMPORARY

  // OR-Tools 최적화 결과
  optimizedSequence Json    // [{ passengerId, sequence, eta, lat, lng }]
  totalDistance     Float   // km
  estimatedDuration Int     // minutes
  status            RouteStatus // DRAFT, OPTIMIZED, IN_PROGRESS, COMPLETED

  // 최적화 메타데이터
  optimizationTime  Int?    // ms (알고리즘 실행 시간)
  solverVersion     String? @db.VarChar(20)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([institutionId, routeDate, shuttleType])
  @@index([vehicleId, routeDate])
  @@map("routes")
}

enum RouteStatus {
  DRAFT          // 초안
  OPTIMIZED      // 최적화 완료
  IN_PROGRESS    // 운행 중
  COMPLETED      // 완료

  @@map("route_status")
}

// Passenger에 위도/경도 추가
model Passenger {
  // ... existing fields
  pickupLat      Float? // 탑승지 위도
  pickupLng      Float? // 탑승지 경도
  dropoffLat     Float? // 하차지 위도
  dropoffLng     Float? // 하차지 경도
}
```

#### 백엔드 아키텍처

```
backend/src/
├── route/                           # 신규 모듈
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
│   │       ├── optimize-route.dto.ts
│   │       └── route-response.dto.ts
│   ├── infrastructure/
│   │   ├── persistence/
│   │   │   └── route.repository.ts
│   │   ├── external/
│   │   │   ├── or-tools-solver.service.ts
│   │   │   └── geocoding.service.ts (Kakao/Naver Maps)
│   │   └── config/
│   │       └── solver.config.ts
│   ├── interface/
│   │   └── controllers/
│   │       └── route.controller.ts
│   └── route.module.ts
```

#### 핵심 API 엔드포인트

```typescript
// POST /api/routes/optimize
// 특정 날짜/차량/셔틀 유형의 경로 최적화
interface OptimizeRouteRequest {
  institutionId: string;
  vehicleId: string;
  routeDate: string; // ISO 8601
  shuttleType: 'MORNING' | 'EVENING';
  passengerIds: string[]; // 대상 승객 목록
}

interface OptimizeRouteResponse {
  routeId: string;
  optimizedSequence: Array<{
    sequence: number;        // 승차 순서 (1부터 시작)
    passengerId: string;
    passengerName: string;
    address: string;
    coordinates: { lat: number; lng: number };
    eta: string;             // ISO 8601 timestamp
    distanceFromPrevious: number; // km
  }>;
  totalDistance: number;     // km
  estimatedDuration: number; // minutes
  optimizationTime: number;  // ms
}

// GET /api/routes/:routeId
// 경로 상세 조회 (실시간 ETA 재계산 포함)

// PATCH /api/routes/:routeId/recalculate
// 교통 상황 반영하여 ETA 재계산
```

#### VRP 알고리즘 구현 예시

```typescript
// route/infrastructure/external/or-tools-solver.service.ts

import { Injectable } from '@nestjs/common';
import { Solver, RoutingIndexManager, RoutingModel } from 'or-tools';

@Injectable()
export class ORToolsSolverService {
  async solveVRP(input: {
    vehicleCapacity: number;
    depot: { lat: number; lng: number }; // 기관 위치
    pickups: Array<{
      id: string;
      lat: number;
      lng: number;
      timeWindow?: { start: string; end: string };
    }>;
  }): Promise<{
    sequence: Array<{ id: string; sequence: number; eta: Date }>;
    totalDistance: number;
    duration: number;
  }> {
    // 1. 거리 행렬 생성 (Haversine or Google Maps Distance Matrix API)
    const distanceMatrix = await this.buildDistanceMatrix(
      input.depot,
      input.pickups
    );

    // 2. OR-Tools 모델 설정
    const numVehicles = 1;
    const numLocations = input.pickups.length + 1; // depot 포함
    const manager = new RoutingIndexManager(numLocations, numVehicles, 0);
    const routing = new RoutingModel(manager);

    // 3. 거리 콜백 등록
    const transitCallbackIndex = routing.RegisterTransitCallback((fromIndex, toIndex) => {
      const fromNode = manager.IndexToNode(fromIndex);
      const toNode = manager.IndexToNode(toIndex);
      return distanceMatrix[fromNode][toNode];
    });
    routing.SetArcCostEvaluatorOfAllVehicles(transitCallbackIndex);

    // 4. 차량 용량 제약
    const demandCallbackIndex = routing.RegisterUnaryTransitCallback((fromIndex) => {
      return 1; // 각 승객 = demand 1
    });
    routing.AddDimensionWithVehicleCapacity(
      demandCallbackIndex,
      0, // slack
      [input.vehicleCapacity], // 차량별 용량
      true, // start cumul to zero
      'Capacity'
    );

    // 5. 시간 제약 (Optional)
    if (input.pickups.some(p => p.timeWindow)) {
      // Time window constraint 추가
    }

    // 6. 솔버 실행
    const searchParameters = routing.DefaultSearchParameters();
    searchParameters.firstSolutionStrategy = 'PATH_CHEAPEST_ARC';
    searchParameters.localSearchMetaheuristic = 'GUIDED_LOCAL_SEARCH';
    searchParameters.timeLimit = { seconds: 30 };

    const solution = routing.SolveWithParameters(searchParameters);

    // 7. 결과 파싱
    return this.parseSolution(routing, manager, solution, input.pickups);
  }

  private async buildDistanceMatrix(
    depot: { lat: number; lng: number },
    pickups: Array<{ lat: number; lng: number }>
  ): Promise<number[][]> {
    // Haversine 거리 계산 또는 Google Maps API 호출
    const locations = [depot, ...pickups];
    const matrix: number[][] = [];

    for (let i = 0; i < locations.length; i++) {
      matrix[i] = [];
      for (let j = 0; j < locations.length; j++) {
        if (i === j) {
          matrix[i][j] = 0;
        } else {
          matrix[i][j] = this.haversineDistance(locations[i], locations[j]);
        }
      }
    }
    return matrix;
  }

  private haversineDistance(
    a: { lat: number; lng: number },
    b: { lat: number; lng: number }
  ): number {
    // Haversine formula implementation
    const R = 6371; // Earth radius in km
    const dLat = this.toRad(b.lat - a.lat);
    const dLng = this.toRad(b.lng - a.lng);
    const lat1 = this.toRad(a.lat);
    const lat2 = this.toRad(b.lat);

    const x =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
```

#### 프론트엔드 UI

```typescript
// frontend/app/routes/optimize/page.tsx

'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Select } from '@/components/ui/select';

export default function RouteOptimizationPage() {
  const [date, setDate] = useState<Date>(new Date());
  const [vehicleId, setVehicleId] = useState<string>('');
  const [shuttleType, setShuttleType] = useState<'MORNING' | 'EVENING'>('MORNING');

  const optimizeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/routes/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId,
          routeDate: date.toISOString(),
          shuttleType,
        }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      // 최적화된 경로 표시
      console.log('Optimized route:', data);
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">경로 최적화</h1>

      <div className="grid gap-4">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => d && setDate(d)}
        />

        <Select value={vehicleId} onValueChange={setVehicleId}>
          {/* 차량 목록 */}
        </Select>

        <Select value={shuttleType} onValueChange={(v: any) => setShuttleType(v)}>
          <option value="MORNING">오전 셔틀</option>
          <option value="EVENING">오후 셔틀</option>
        </Select>

        <Button
          onClick={() => optimizeMutation.mutate()}
          disabled={optimizeMutation.isPending}
        >
          {optimizeMutation.isPending ? '최적화 중...' : '경로 최적화 실행'}
        </Button>
      </div>

      {optimizeMutation.data && (
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">최적화 결과</h3>
          <p>총 거리: {optimizeMutation.data.totalDistance.toFixed(1)} km</p>
          <p>예상 소요시간: {optimizeMutation.data.estimatedDuration}분</p>

          <div className="mt-4 space-y-2">
            {optimizeMutation.data.optimizedSequence.map((stop: any) => (
              <div key={stop.passengerId} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                <span className="font-bold text-blue-600">{stop.sequence}</span>
                <span>{stop.passengerName}</span>
                <span className="text-sm text-gray-600">{stop.address}</span>
                <span className="ml-auto text-sm">{new Date(stop.eta).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

#### 테스트 계획

```typescript
// route/domain/services/route-optimizer.service.spec.ts

describe('RouteOptimizerService', () => {
  it('should optimize route with 10 passengers in under 5 seconds', async () => {
    const result = await service.optimize({
      vehicleCapacity: 15,
      depot: { lat: 37.5665, lng: 126.9780 }, // Seoul
      pickups: generateRandomPickups(10),
    });

    expect(result.optimizationTime).toBeLessThan(5000);
    expect(result.sequence).toHaveLength(10);
  });

  it('should respect vehicle capacity constraint', async () => {
    const result = await service.optimize({
      vehicleCapacity: 5,
      pickups: generateRandomPickups(10), // 10명 > 5인승
    });

    // 용량 초과 시 에러 또는 여러 차량 할당
    expect(result).toBeDefined();
  });

  it('should handle time window constraints', async () => {
    const result = await service.optimize({
      vehicleCapacity: 15,
      depot: { lat: 37.5665, lng: 126.9780 },
      pickups: [
        { id: '1', lat: 37.5, lng: 127.0, timeWindow: { start: '08:00', end: '08:30' } },
        { id: '2', lat: 37.6, lng: 127.1, timeWindow: { start: '09:00', end: '09:30' } },
      ],
    });

    // 시간 제약 위반 없는지 검증
    expect(result.sequence[0].eta).toBeLessThanOrEqual(new Date('2025-01-01T08:30:00'));
  });
});
```

---

### Phase 1.2: 실시간 알림 시스템 (Week 7-12)

#### 기술 스택
```typescript
// 신규 의존성
- firebase-admin: ^12.0.0           // FCM Push 알림
- @nestjs/bull: ^10.0.0            // Queue 관리
- bull: ^4.12.0                     // Redis 기반 작업 큐
- ioredis: ^5.3.0                   // Redis 클라이언트
```

#### 데이터 모델 확장

```prisma
// Notification Context
model DeviceToken {
  id        String   @id @default(uuid())
  userId    String?  // User 또는 Passenger
  token     String   @unique @db.VarChar(255) // FCM token
  platform  Platform // IOS, ANDROID, WEB
  isActive  Boolean  @default(true)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
  @@map("device_tokens")
}

enum Platform {
  IOS
  ANDROID
  WEB

  @@map("platform")
}

model Notification {
  id         String           @id @default(uuid())
  recipientId String          // User or Passenger ID
  title      String           @db.VarChar(100)
  body       String           @db.Text
  type       NotificationType
  data       Json?            // 추가 페이로드 (routeId, vehicleId 등)
  status     NotificationStatus @default(PENDING)
  sentAt     DateTime?
  readAt     DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([recipientId, status])
  @@index([type, createdAt])
  @@map("notifications")
}

enum NotificationType {
  TRIP_STARTED           // 차량 출발
  APPROACHING            // 5분 내 도착 예정
  ARRIVED                // 도착
  BOARDING_CONFIRMED     // 승차 확인
  ALIGHTING_CONFIRMED    // 하차 확인
  SCHEDULE_CHANGED       // 스케줄 변경

  @@map("notification_type")
}

enum NotificationStatus {
  PENDING
  SENT
  FAILED
  READ

  @@map("notification_status")
}
```

#### 백엔드 아키텍처

```
backend/src/
├── notification/                    # 신규 모듈
│   ├── domain/
│   │   ├── entities/
│   │   │   └── notification.entity.ts
│   │   └── services/
│   │       └── notification.service.ts
│   ├── application/
│   │   ├── use-cases/
│   │   │   ├── send-push-notification.use-case.ts
│   │   │   └── register-device-token.use-case.ts
│   │   └── dto/
│   │       └── notification.dto.ts
│   ├── infrastructure/
│   │   ├── persistence/
│   │   │   └── notification.repository.ts
│   │   ├── external/
│   │   │   └── fcm.service.ts
│   │   └── jobs/
│   │       ├── approaching-alert.processor.ts
│   │       └── geofence-checker.processor.ts
│   ├── interface/
│   │   └── controllers/
│   │       └── notification.controller.ts
│   └── notification.module.ts
```

#### 핵심 구현

```typescript
// notification/infrastructure/external/fcm.service.ts

import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FCMService {
  private messaging: admin.messaging.Messaging;

  constructor() {
    // Firebase Admin SDK 초기화
    const app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
    this.messaging = app.messaging();
  }

  async sendToDevice(
    token: string,
    payload: {
      title: string;
      body: string;
      data?: Record<string, string>;
    }
  ): Promise<void> {
    try {
      await this.messaging.send({
        token,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data,
        apns: {
          payload: {
            aps: {
              sound: 'default',
            },
          },
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
          },
        },
      });
    } catch (error) {
      console.error('FCM send error:', error);
      throw error;
    }
  }

  async sendMulticast(
    tokens: string[],
    payload: {
      title: string;
      body: string;
      data?: Record<string, string>;
    }
  ): Promise<void> {
    const message = {
      tokens,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data,
    };

    const response = await this.messaging.sendEachForMulticast(message);
    console.log(`${response.successCount} messages sent successfully`);
  }
}
```

```typescript
// notification/infrastructure/jobs/approaching-alert.processor.ts

import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { FCMService } from '../external/fcm.service';
import { NotificationRepository } from '../persistence/notification.repository';

@Processor('approaching-alerts')
export class ApproachingAlertProcessor {
  constructor(
    private fcmService: FCMService,
    private notificationRepo: NotificationRepository
  ) {}

  @Process('check-eta')
  async handleCheckETA(job: Job<{ routeId: string }>) {
    const { routeId } = job.data;

    // 1. 현재 경로의 다음 승객 조회
    const nextStop = await this.getNextStop(routeId);
    if (!nextStop) return;

    // 2. 현재 차량 위치에서 다음 정류장까지 ETA 계산
    const eta = await this.calculateETA(nextStop);

    // 3. 5분 이내 도착 예정이면 알림 발송
    if (eta <= 5) {
      await this.sendApproachingAlert(nextStop.passengerId, eta);
    }
  }

  private async sendApproachingAlert(passengerId: string, eta: number) {
    const passenger = await this.getPassenger(passengerId);
    const tokens = await this.getDeviceTokens(passengerId);

    if (tokens.length === 0) return;

    await this.fcmService.sendMulticast(tokens, {
      title: '차량 도착 예정',
      body: `${passenger.name}님, 차량이 약 ${eta}분 후 도착 예정입니다.`,
      data: {
        type: 'APPROACHING',
        passengerId,
        eta: eta.toString(),
      },
    });

    // 알림 기록 저장
    await this.notificationRepo.create({
      recipientId: passengerId,
      title: '차량 도착 예정',
      body: `차량이 약 ${eta}분 후 도착 예정입니다.`,
      type: 'APPROACHING',
      status: 'SENT',
      sentAt: new Date(),
    });
  }
}
```

#### API 엔드포인트

```typescript
// POST /api/notifications/register-token
interface RegisterTokenRequest {
  userId: string;
  token: string;
  platform: 'IOS' | 'ANDROID' | 'WEB';
}

// GET /api/notifications
// 사용자의 알림 목록 조회

// PATCH /api/notifications/:id/read
// 알림 읽음 처리
```

#### 프론트엔드 (예시: Passenger Web App)

```typescript
// frontend/app/notifications/page.tsx

'use client';

import { useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

export default function NotificationsPage() {
  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => fetch('/api/notifications').then(r => r.json()),
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) =>
      fetch(`/api/notifications/${notificationId}/read`, { method: 'PATCH' }),
  });

  useEffect(() => {
    // FCM 토큰 등록
    const registerToken = async () => {
      const messaging = getMessaging();
      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      });

      await fetch('/api/notifications/register-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          platform: 'WEB',
        }),
      });
    };

    registerToken();

    // Foreground 메시지 수신
    const messaging = getMessaging();
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Foreground message:', payload);
      // 알림 UI 표시
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">알림</h1>

      {notifications?.map((notif: any) => (
        <div
          key={notif.id}
          className={`p-4 border rounded ${notif.readAt ? 'bg-gray-50' : 'bg-white'}`}
          onClick={() => markAsReadMutation.mutate(notif.id)}
        >
          <h3 className="font-semibold">{notif.title}</h3>
          <p className="text-sm text-gray-600">{notif.body}</p>
          <span className="text-xs text-gray-400">
            {new Date(notif.createdAt).toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}
```

---

### Q1 테스트 전략

```typescript
// E2E Test Scenario
describe('Q1: Route Optimization + Notifications', () => {
  it('should optimize route and send notifications to all passengers', async () => {
    // 1. 경로 최적화 요청
    const optimizeRes = await request(app.getHttpServer())
      .post('/api/routes/optimize')
      .send({
        vehicleId: 'vehicle-1',
        routeDate: '2025-01-15',
        shuttleType: 'MORNING',
      });

    expect(optimizeRes.status).toBe(200);
    const routeId = optimizeRes.body.routeId;

    // 2. 운행 시작 (차량 출발 알림 발송)
    await request(app.getHttpServer())
      .post(`/api/routes/${routeId}/start`)
      .send();

    // 3. 알림 발송 확인
    const notifications = await db.notification.findMany({
      where: { type: 'TRIP_STARTED' },
    });

    expect(notifications.length).toBeGreaterThan(0);
  });
});
```

---

### Q1 완료 기준 (Definition of Done)

- [ ] Google OR-Tools VRP 알고리즘 통합 완료
- [ ] 10명 승객 기준 5초 이내 최적화 완료
- [ ] 최적화된 경로 Admin Portal에서 시각화
- [ ] FCM Push 알림 iOS/Android/Web 모두 작동
- [ ] 차량 출발, 도착 예정(5분 전), 승하차 확인 알림 자동 발송
- [ ] 단위 테스트 커버리지 80% 이상
- [ ] E2E 테스트 통과
- [ ] 성능 테스트: 100명 승객 동시 최적화 가능

---

## 🚗 Q2: Driver App + Excel 고도화 (Week 13-24)

### 비즈니스 목표
- 기사 전용 모바일 앱 출시 (React Native)
- Excel 업로드 시 주소 검증 및 자동 위도/경도 변환
- **핵심 가치**: 기사 업무 효율 50% 향상, 데이터 품질 향상, 수작업 오류 제거

### Phase 2.1: Driver Mobile App (React Native) (Week 13-20)

#### 기술 스택
```json
{
  "dependencies": {
    "react-native": "0.73.x",
    "expo": "~50.0.0",
    "expo-location": "~17.0.0",
    "expo-camera": "~14.0.0",
    "react-navigation": "^6.0.0",
    "@react-native-async-storage/async-storage": "^1.21.0",
    "@tanstack/react-query": "^5.14.0",
    "axios": "^1.6.0",
    "react-native-maps": "^1.10.0",
    "react-native-qrcode-scanner": "^1.5.5"
  }
}
```

#### 앱 화면 구조

```
driver-app/
├── src/
│   ├── screens/
│   │   ├── LoginScreen.tsx              # 로그인
│   │   ├── TodayTripsScreen.tsx         # 오늘의 운행 목록
│   │   ├── TripDetailsScreen.tsx        # 운행 상세 (승객 명단)
│   │   ├── NavigationScreen.tsx         # 내비게이션 연동
│   │   ├── PassengerCheckScreen.tsx     # 승객 체크인 (QR/수동)
│   │   └── ReceiptUploadScreen.tsx      # 영수증 업로드
│   ├── components/
│   │   ├── PassengerCard.tsx
│   │   ├── CheckInButton.tsx
│   │   └── QRScanner.tsx
│   ├── services/
│   │   ├── api.ts
│   │   ├── location.ts
│   │   └── storage.ts
│   └── App.tsx
```

#### 핵심 기능

**1. 일일 운행 목록**
```typescript
// screens/TodayTripsScreen.tsx

export default function TodayTripsScreen() {
  const { data: trips } = useQuery({
    queryKey: ['driver-trips', new Date().toISOString().split('T')[0]],
    queryFn: () => api.get('/api/driver/trips/today').then(r => r.data),
  });

  return (
    <FlatList
      data={trips}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() => navigation.navigate('TripDetails', { tripId: item.id })}
        >
          <View style={styles.tripCard}>
            <Text style={styles.time}>{item.startTime} 출발</Text>
            <Text style={styles.type}>
              {item.shuttleType === 'MORNING' ? '오전 셔틀' : '오후 셔틀'}
            </Text>
            <Text style={styles.passengers}>{item.passengerCount}명</Text>
            {item.status === 'IN_PROGRESS' && (
              <Badge color="blue">운행 중</Badge>
            )}
          </View>
        </TouchableOpacity>
      )}
    />
  );
}
```

**2. 승객 체크인 (QR 코드)**
```typescript
// screens/PassengerCheckScreen.tsx

import { BarCodeScanner } from 'expo-camera';

export default function PassengerCheckScreen({ route }) {
  const { passengerId } = route.params;
  const [hasPermission, setHasPermission] = useState(null);

  const checkInMutation = useMutation({
    mutationFn: (passengerId: string) =>
      api.post(`/api/driver/passengers/${passengerId}/check-in`),
  });

  const handleBarCodeScanned = ({ data }) => {
    // QR 코드에서 승객 ID 추출
    const scannedPassengerId = JSON.parse(data).passengerId;
    checkInMutation.mutate(scannedPassengerId);
  };

  return (
    <View style={styles.container}>
      <BarCodeScanner
        onBarCodeScanned={handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
      />

      <Button title="수동 체크인" onPress={() => checkInMutation.mutate(passengerId)} />
    </View>
  );
}
```

**3. 내비게이션 연동 (Tmap/Kakao)**
```typescript
// screens/NavigationScreen.tsx

export default function NavigationScreen({ route }) {
  const { destinations } = route.params; // 최적화된 경로

  const openNavigation = async () => {
    const url = `tmap://route?goalname=${encodeURIComponent(
      destinations[0].address
    )}&goalx=${destinations[0].lng}&goaly=${destinations[0].lat}`;

    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      // Fallback: Kakao Navi
      const kakaoUrl = `kakaomap://route?ep=${destinations[0].lat},${destinations[0].lng}`;
      await Linking.openURL(kakaoUrl);
    }
  };

  return (
    <View>
      <MapView
        initialRegion={{
          latitude: destinations[0].lat,
          longitude: destinations[0].lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {destinations.map((dest, idx) => (
          <Marker
            key={idx}
            coordinate={{ latitude: dest.lat, longitude: dest.lng }}
            title={`${idx + 1}. ${dest.passengerName}`}
          />
        ))}
      </MapView>

      <Button title="Tmap으로 내비게이션 시작" onPress={openNavigation} />
    </View>
  );
}
```

#### 백엔드 API

```typescript
// backend/src/driver/interface/controllers/driver.controller.ts

@Controller('api/driver')
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles('DRIVER')
export class DriverController {
  // GET /api/driver/trips/today
  @Get('trips/today')
  async getTodayTrips(@CurrentUser() user: User) {
    const driverId = user.id;
    const today = new Date().toISOString().split('T')[0];

    return this.driverService.getTripsByDate(driverId, today);
  }

  // GET /api/driver/trips/:tripId/passengers
  @Get('trips/:tripId/passengers')
  async getTripPassengers(@Param('tripId') tripId: string) {
    return this.driverService.getPassengersWithSequence(tripId);
  }

  // POST /api/driver/passengers/:passengerId/check-in
  @Post('passengers/:passengerId/check-in')
  async checkInPassenger(@Param('passengerId') passengerId: string) {
    return this.driverService.checkIn(passengerId, 'BOARDING');
  }

  // POST /api/driver/trips/:tripId/start
  @Post('trips/:tripId/start')
  async startTrip(@Param('tripId') tripId: string) {
    // 운행 시작 → GPS 추적 시작 + 승객 알림 발송
    return this.driverService.startTrip(tripId);
  }
}
```

---

### Phase 2.2: Excel 업로드 고도화 (Week 21-24)

#### 기능 강화
1. **주소 자동 검증** (Kakao/Naver Geocoding API)
2. **위도/경도 자동 변환**
3. **중복 승객 자동 감지** (전화번호 기준)
4. **시간 충돌 검증** (동일 차량, 동일 시간대)
5. **템플릿 다운로드** (샘플 Excel 파일)

#### 백엔드 구현

```typescript
// roster/application/use-cases/upload-passengers-excel.use-case.ts

import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { GeocodingService } from '../../../common/geocoding.service';

@Injectable()
export class UploadPassengersExcelUseCase {
  constructor(
    private geocodingService: GeocodingService,
    private passengerRepo: PassengerRepository
  ) {}

  async execute(
    institutionId: string,
    file: Express.Multer.File
  ): Promise<{
    success: number;
    failed: number;
    errors: Array<{ row: number; message: string }>;
  }> {
    // 1. Excel 파싱
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<PassengerRow>(sheet);

    const errors: Array<{ row: number; message: string }> = [];
    const validPassengers: Passenger[] = [];

    // 2. 각 행 검증 및 지오코딩
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // Excel 행 번호 (헤더 제외)

      try {
        // 필수 필드 검증
        if (!row.name || !row.phoneNumber || !row.pickupAddress) {
          errors.push({ row: rowNum, message: '필수 필드 누락' });
          continue;
        }

        // 전화번호 중복 체크
        const existing = await this.passengerRepo.findByPhoneNumber(
          institutionId,
          row.phoneNumber
        );
        if (existing) {
          errors.push({ row: rowNum, message: '중복된 전화번호' });
          continue;
        }

        // 주소 → 위도/경도 변환
        const pickupCoords = await this.geocodingService.geocode(row.pickupAddress);
        if (!pickupCoords) {
          errors.push({ row: rowNum, message: '유효하지 않은 탑승지 주소' });
          continue;
        }

        const dropoffCoords = await this.geocodingService.geocode(row.dropoffAddress);
        if (!dropoffCoords) {
          errors.push({ row: rowNum, message: '유효하지 않은 하차지 주소' });
          continue;
        }

        validPassengers.push({
          institutionId,
          name: row.name,
          phoneNumber: row.phoneNumber.replace(/-/g, ''),
          pickupAddress: row.pickupAddress,
          pickupLat: pickupCoords.lat,
          pickupLng: pickupCoords.lng,
          dropoffAddress: row.dropoffAddress,
          dropoffLat: dropoffCoords.lat,
          dropoffLng: dropoffCoords.lng,
          shuttleType: row.shuttleType,
        });
      } catch (error) {
        errors.push({ row: rowNum, message: error.message });
      }
    }

    // 3. 일괄 저장
    await this.passengerRepo.createMany(validPassengers);

    return {
      success: validPassengers.length,
      failed: errors.length,
      errors,
    };
  }
}

interface PassengerRow {
  name: string;
  phoneNumber: string;
  pickupAddress: string;
  dropoffAddress: string;
  shuttleType: 'MORNING' | 'EVENING';
}
```

```typescript
// common/geocoding.service.ts

import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class GeocodingService {
  async geocode(address: string): Promise<{ lat: number; lng: number } | null> {
    try {
      // Kakao Maps Geocoding API
      const response = await axios.get(
        'https://dapi.kakao.com/v2/local/search/address.json',
        {
          headers: {
            Authorization: `KakaoAK ${process.env.KAKAO_API_KEY}`,
          },
          params: { query: address },
        }
      );

      const result = response.data.documents[0];
      if (!result) return null;

      return {
        lat: parseFloat(result.y),
        lng: parseFloat(result.x),
      };
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }

  async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    try {
      const response = await axios.get(
        'https://dapi.kakao.com/v2/local/geo/coord2address.json',
        {
          headers: {
            Authorization: `KakaoAK ${process.env.KAKAO_API_KEY}`,
          },
          params: { x: lng, y: lat },
        }
      );

      const result = response.data.documents[0];
      return result?.address?.address_name || null;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  }
}
```

#### 프론트엔드 UI

```typescript
// frontend/app/passengers/upload/page.tsx

'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';

export default function PassengerUploadPage() {
  const [file, setFile] = useState<File | null>(null);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/passengers/upload', {
        method: 'POST',
        body: formData,
      });
      return res.json();
    },
    onSuccess: (data) => {
      alert(`성공: ${data.success}명, 실패: ${data.failed}명`);
      if (data.errors.length > 0) {
        console.log('Errors:', data.errors);
      }
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">승객 일괄 업로드</h1>

      <div>
        <Button
          variant="outline"
          onClick={() => {
            // 템플릿 다운로드
            window.open('/api/passengers/template');
          }}
        >
          Excel 템플릿 다운로드
        </Button>
      </div>

      <div>
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
      </div>

      <Button
        onClick={() => file && uploadMutation.mutate(file)}
        disabled={!file || uploadMutation.isPending}
      >
        {uploadMutation.isPending ? '업로드 중...' : '업로드'}
      </Button>

      {uploadMutation.data && (
        <div className="border rounded p-4">
          <p className="text-green-600">성공: {uploadMutation.data.success}명</p>
          <p className="text-red-600">실패: {uploadMutation.data.failed}명</p>

          {uploadMutation.data.errors.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold">오류 목록:</h3>
              <ul className="list-disc pl-5">
                {uploadMutation.data.errors.map((err: any, idx: number) => (
                  <li key={idx}>
                    {err.row}행: {err.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

---

### Q2 완료 기준

- [ ] Driver App iOS/Android 출시 (App Store, Play Store)
- [ ] 운행 시작/종료, 승객 체크인 기능 작동
- [ ] QR 코드 스캔 기능 작동
- [ ] Tmap/Kakao Navi 연동 작동
- [ ] Excel 업로드 시 주소 → 위도/경도 자동 변환
- [ ] 중복 승객 자동 감지
- [ ] 템플릿 다운로드 기능
- [ ] 100명 승객 일괄 업로드 30초 이내 완료

---

## 📍 Q3: GPS 트래킹 + Basic BI (Week 25-36)

### 비즈니스 목표
- 실시간 차량 위치 추적 및 주행 거리 기록
- 관리자용 BI 대시보드 (정시 도착률, 평균 탑승률, 비용 트렌드)
- **핵심 가치**: 데이터 기반 의사결정, 비용 투명성, SLA 관리

### Phase 3.1: GPS 트래킹 & 거리 계산 (Week 25-30)

#### 기술 스택
```typescript
// 신규 의존성
- @googlemaps/google-maps-services-js: ^3.3.0  // Roads API
- geolib: ^3.3.0                                // 지리 계산
```

#### 데이터 모델 확장

```prisma
// GPS Tracking Context
model Trip {
  id          String      @id @default(uuid())
  routeId     String
  route       Route       @relation(fields: [routeId], references: [id], onDelete: Cascade)
  driverId    String
  driver      User        @relation(fields: [driverId], references: [id])

  startTime   DateTime
  endTime     DateTime?
  status      TripStatus  @default(SCHEDULED)

  // GPS 추적 데이터
  gpsLogs     GPSLog[]

  // 주행 거리 (계산 값)
  totalDistanceKm       Float? // 실제 주행 거리
  totalDurationMinutes  Int?   // 실제 소요 시간

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([routeId])
  @@index([driverId, startTime])
  @@map("trips")
}

enum TripStatus {
  SCHEDULED
  IN_PROGRESS
  COMPLETED
  CANCELLED

  @@map("trip_status")
}

model GPSLog {
  id        String   @id @default(uuid())
  tripId    String
  trip      Trip     @relation(fields: [tripId], references: [id], onDelete: Cascade)

  latitude  Float
  longitude Float
  accuracy  Float?   // meters
  speed     Float?   // km/h
  heading   Float?   // degrees (0-360)

  timestamp DateTime @default(now())

  @@index([tripId, timestamp])
  @@map("gps_logs")
}

model PassengerCheckIn {
  id          String   @id @default(uuid())
  tripId      String
  passengerId String

  type        CheckInType // BOARDING, ALIGHTING
  latitude    Float?
  longitude   Float?
  timestamp   DateTime    @default(now())

  createdAt DateTime @default(now())

  @@index([tripId, passengerId])
  @@map("passenger_check_ins")
}

enum CheckInType {
  BOARDING   // 승차
  ALIGHTING  // 하차

  @@map("check_in_type")
}
```

#### 백엔드 구현

```typescript
// trip/application/use-cases/start-trip.use-case.ts

import { Injectable } from '@nestjs/common';
import { NotificationService } from '../../../notification/domain/services/notification.service';

@Injectable()
export class StartTripUseCase {
  constructor(
    private tripRepo: TripRepository,
    private notificationService: NotificationService
  ) {}

  async execute(tripId: string, driverId: string): Promise<void> {
    // 1. Trip 상태 변경
    await this.tripRepo.update(tripId, {
      status: 'IN_PROGRESS',
      startTime: new Date(),
    });

    // 2. 해당 경로의 모든 승객에게 "차량 출발" 알림 발송
    const passengers = await this.getPassengersForTrip(tripId);

    for (const passenger of passengers) {
      await this.notificationService.sendPushNotification({
        recipientId: passenger.id,
        title: '차량 출발',
        body: `${passenger.name}님, 차량이 출발했습니다.`,
        type: 'TRIP_STARTED',
        data: { tripId },
      });
    }

    // 3. GPS 추적 시작 (Driver App에서 주기적으로 위치 전송)
  }
}
```

```typescript
// trip/interface/controllers/trip.controller.ts

@Controller('api/trips')
export class TripController {
  // POST /api/trips/:tripId/gps
  // Driver App에서 5-10초마다 GPS 좌표 전송
  @Post(':tripId/gps')
  async logGPS(
    @Param('tripId') tripId: string,
    @Body() gpsData: {
      latitude: number;
      longitude: number;
      accuracy: number;
      speed: number;
      heading: number;
    }
  ) {
    await this.gpsLogRepo.create({
      tripId,
      ...gpsData,
      timestamp: new Date(),
    });

    // WebSocket으로 실시간 위치 브로드캐스트 (Admin Portal & Passenger App)
    this.websocketGateway.broadcast(`trip:${tripId}:location`, gpsData);

    return { success: true };
  }

  // POST /api/trips/:tripId/complete
  @Post(':tripId/complete')
  async completeTrip(@Param('tripId') tripId: string) {
    // 1. Trip 종료
    await this.tripRepo.update(tripId, {
      status: 'COMPLETED',
      endTime: new Date(),
    });

    // 2. GPS 로그 기반 실제 주행 거리 계산
    const distance = await this.calculateTripDistance(tripId);
    await this.tripRepo.update(tripId, {
      totalDistanceKm: distance.totalKm,
      totalDurationMinutes: distance.durationMinutes,
    });

    return { success: true };
  }

  private async calculateTripDistance(tripId: string): Promise<{
    totalKm: number;
    durationMinutes: number;
  }> {
    // GPS 로그 조회
    const gpsLogs = await this.gpsLogRepo.findByTripId(tripId);

    // Snap to Roads API로 GPS 좌표를 도로에 보정
    const snappedPoints = await this.snapToRoads(
      gpsLogs.map(log => ({ lat: log.latitude, lng: log.longitude }))
    );

    // 보정된 좌표 간 거리 합산
    let totalDistance = 0;
    for (let i = 1; i < snappedPoints.length; i++) {
      totalDistance += geolib.getDistance(snappedPoints[i - 1], snappedPoints[i]);
    }

    const durationMs = gpsLogs[gpsLogs.length - 1].timestamp.getTime() - gpsLogs[0].timestamp.getTime();

    return {
      totalKm: totalDistance / 1000,
      durationMinutes: Math.round(durationMs / 60000),
    };
  }

  private async snapToRoads(
    points: Array<{ lat: number; lng: number }>
  ): Promise<Array<{ lat: number; lng: number }>> {
    const client = new Client({});
    const response = await client.snapToRoads({
      params: {
        path: points.map(p => `${p.lat},${p.lng}`).join('|'),
        interpolate: true,
        key: process.env.GOOGLE_MAPS_API_KEY!,
      },
    });

    return response.data.snappedPoints.map(p => ({
      lat: p.location.latitude,
      lng: p.location.longitude,
    }));
  }
}
```

#### Driver App - GPS 추적

```typescript
// driver-app/src/services/location.ts

import * as Location from 'expo-location';
import { api } from './api';

let locationSubscription: Location.LocationSubscription | null = null;

export async function startGPSTracking(tripId: string) {
  // 위치 권한 요청
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Location permission not granted');
  }

  // 5초마다 GPS 좌표 전송
  locationSubscription = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      timeInterval: 5000,
      distanceInterval: 10, // 10m 이동 시에만 업데이트
    },
    (location) => {
      api.post(`/api/trips/${tripId}/gps`, {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        speed: location.coords.speed,
        heading: location.coords.heading,
      });
    }
  );
}

export function stopGPSTracking() {
  if (locationSubscription) {
    locationSubscription.remove();
    locationSubscription = null;
  }
}
```

---

### Phase 3.2: BI 대시보드 (Week 31-36)

#### 핵심 지표

1. **정시 도착률 (On-Time Performance)**
   - 목표 도착 시간 ±5분 이내 도착 비율

2. **차량별 평균 탑승률**
   - (실제 탑승 인원 / 차량 정원) × 100

3. **노선별 평균 운행 시간**
   - 계획 시간 vs 실제 소요 시간

4. **월별 운행 거리/비용 트렌드**
   - 총 주행 거리, 연료비, 유지보수 비용

5. **취소율/노쇼율**
   - 예약 대비 실제 탑승 비율

#### 데이터 모델

```prisma
// Analytics 뷰 (PostgreSQL Materialized View)
// 매일 새벽 1시 갱신

// CREATE MATERIALIZED VIEW analytics_daily_summary AS
// SELECT ...

model AnalyticsDailySummary {
  id                 String   @id @default(uuid())
  institutionId      String
  date               DateTime @db.Date

  totalTrips         Int
  completedTrips     Int
  cancelledTrips     Int

  totalPassengers    Int
  actualBoarding     Int
  noShowCount        Int

  totalDistanceKm    Float
  totalDurationMin   Int

  onTimeTrips        Int      // ±5분 이내 도착
  lateTrips          Int
  earlyTrips         Int

  avgOccupancyRate   Float    // 평균 탑승률 (%)

  createdAt DateTime @default(now())

  @@unique([institutionId, date])
  @@map("analytics_daily_summary")
}
```

#### 백엔드 API

```typescript
// analytics/interface/controllers/analytics.controller.ts

@Controller('api/analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  // GET /api/analytics/dashboard
  // 대시보드 메인 화면 데이터
  @Get('dashboard')
  async getDashboard(@Query('institutionId') institutionId: string) {
    const today = new Date();
    const lastMonth = new Date(today.setMonth(today.getMonth() - 1));

    const [summary, trends] = await Promise.all([
      this.getSummary(institutionId, lastMonth, new Date()),
      this.getTrends(institutionId, lastMonth, new Date()),
    ]);

    return { summary, trends };
  }

  private async getSummary(
    institutionId: string,
    startDate: Date,
    endDate: Date
  ) {
    const data = await this.analyticsRepo.aggregate({
      where: {
        institutionId,
        date: { gte: startDate, lte: endDate },
      },
      _sum: {
        totalTrips: true,
        completedTrips: true,
        totalDistanceKm: true,
        onTimeTrips: true,
      },
      _avg: {
        avgOccupancyRate: true,
      },
    });

    return {
      totalTrips: data._sum.totalTrips,
      completedTrips: data._sum.completedTrips,
      totalDistance: data._sum.totalDistanceKm,
      onTimeRate: (data._sum.onTimeTrips / data._sum.completedTrips) * 100,
      avgOccupancy: data._avg.avgOccupancyRate,
    };
  }

  private async getTrends(
    institutionId: string,
    startDate: Date,
    endDate: Date
  ) {
    const dailyData = await this.analyticsRepo.findMany({
      where: {
        institutionId,
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: 'asc' },
    });

    return dailyData.map(d => ({
      date: d.date,
      trips: d.completedTrips,
      distance: d.totalDistanceKm,
      occupancy: d.avgOccupancyRate,
    }));
  }
}
```

#### 프론트엔드 BI 대시보드

```typescript
// frontend/app/analytics/page.tsx

'use client';

import { useQuery } from '@tanstack/react-query';
import { Line, Bar } from 'react-chartjs-2';

export default function AnalyticsPage() {
  const { data } = useQuery({
    queryKey: ['analytics-dashboard'],
    queryFn: () => fetch('/api/analytics/dashboard').then(r => r.json()),
  });

  if (!data) return <div>Loading...</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">운영 분석</h1>

      {/* KPI 카드 */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader>총 운행 횟수</CardHeader>
          <CardContent className="text-3xl font-bold">
            {data.summary.totalTrips}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>정시 도착률</CardHeader>
          <CardContent className="text-3xl font-bold text-green-600">
            {data.summary.onTimeRate.toFixed(1)}%
          </CardContent>
        </Card>

        <Card>
          <CardHeader>평균 탑승률</CardHeader>
          <CardContent className="text-3xl font-bold text-blue-600">
            {data.summary.avgOccupancy.toFixed(1)}%
          </CardContent>
        </Card>

        <Card>
          <CardHeader>총 주행 거리</CardHeader>
          <CardContent className="text-3xl font-bold">
            {data.summary.totalDistance.toLocaleString()} km
          </CardContent>
        </Card>
      </div>

      {/* 트렌드 차트 */}
      <Card>
        <CardHeader>월별 운행 트렌드</CardHeader>
        <CardContent>
          <Line
            data={{
              labels: data.trends.map(t => new Date(t.date).toLocaleDateString()),
              datasets: [
                {
                  label: '운행 횟수',
                  data: data.trends.map(t => t.trips),
                  borderColor: 'rgb(59, 130, 246)',
                },
                {
                  label: '주행 거리 (km)',
                  data: data.trends.map(t => t.distance),
                  borderColor: 'rgb(34, 197, 94)',
                },
              ],
            }}
          />
        </CardContent>
      </Card>

      {/* 탑승률 분포 */}
      <Card>
        <CardHeader>차량별 평균 탑승률</CardHeader>
        <CardContent>
          <Bar
            data={{
              labels: data.vehicleOccupancy.map(v => v.vehicleName),
              datasets: [
                {
                  label: '탑승률 (%)',
                  data: data.vehicleOccupancy.map(v => v.occupancyRate),
                  backgroundColor: 'rgba(59, 130, 246, 0.5)',
                },
              ],
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
```

---

### Q3 완료 기준

- [ ] Driver App에서 GPS 위치 5초마다 전송
- [ ] Admin Portal에서 실시간 차량 위치 지도 표시
- [ ] Snap-to-Roads API로 실제 주행 거리 계산
- [ ] BI 대시보드: 정시 도착률, 탑승률, 트렌드 차트 표시
- [ ] Materialized View 매일 자동 갱신
- [ ] 대시보드 로딩 시간 2초 이내

---

## 📱 Q4: Passenger App + 임시 셔틀 (Week 37-48)

### 비즈니스 목표
- 승객/보호자 전용 모바일 앱 출시
- 임시 셔틀 신청/취소 기능 (신규 수익원)
- **핵심 가치**: 서비스 차별화, 고객 만족도 극대화, 추가 수익 확보

### Phase 4.1: Passenger Mobile App (Week 37-42)

#### 기술 스택
- React Native (Driver App과 동일)
- Push 알림 (FCM)
- 실시간 지도 (React Native Maps)

#### 앱 화면 구조

```
passenger-app/
├── src/
│   ├── screens/
│   │   ├── LoginScreen.tsx              # 로그인 (전화번호 인증)
│   │   ├── HomeScreen.tsx               # 홈 (다음 스케줄)
│   │   ├── ScheduleScreen.tsx           # 전체 스케줄
│   │   ├── TrackingScreen.tsx           # 실시간 차량 위치
│   │   ├── RequestShuttleScreen.tsx     # 임시 셔틀 신청
│   │   └── HistoryScreen.tsx            # 운행 히스토리
```

#### 핵심 기능

**1. 실시간 차량 추적**
```typescript
// screens/TrackingScreen.tsx

import MapView, { Marker } from 'react-native-maps';
import { useQuery } from '@tanstack/react-query';

export default function TrackingScreen({ route }) {
  const { tripId } = route.params;

  const { data: location } = useQuery({
    queryKey: ['trip-location', tripId],
    queryFn: () => api.get(`/api/trips/${tripId}/location`).then(r => r.data),
    refetchInterval: 5000, // 5초마다 갱신
  });

  const { data: passenger } = useQuery({
    queryKey: ['my-info'],
    queryFn: () => api.get('/api/passengers/me').then(r => r.data),
  });

  if (!location || !passenger) return <LoadingSpinner />;

  return (
    <MapView
      initialRegion={{
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }}
    >
      {/* 차량 위치 */}
      <Marker
        coordinate={{
          latitude: location.latitude,
          longitude: location.longitude,
        }}
        title="차량"
        description={`현재 위치 (${location.speed.toFixed(0)} km/h)`}
      >
        <Image source={require('../assets/bus-icon.png')} style={{ width: 40, height: 40 }} />
      </Marker>

      {/* 내 탑승지 */}
      <Marker
        coordinate={{
          latitude: passenger.pickupLat,
          longitude: passenger.pickupLng,
        }}
        title="내 탑승지"
        pinColor="blue"
      />
    </MapView>
  );
}
```

**2. 스케줄 조회**
```typescript
// screens/ScheduleScreen.tsx

export default function ScheduleScreen() {
  const { data: schedules } = useQuery({
    queryKey: ['my-schedules'],
    queryFn: () => api.get('/api/passengers/me/schedules').then(r => r.data),
  });

  return (
    <FlatList
      data={schedules}
      renderItem={({ item }) => (
        <View style={styles.scheduleCard}>
          <Text style={styles.date}>{new Date(item.date).toLocaleDateString()}</Text>
          <Text style={styles.type}>
            {item.shuttleType === 'MORNING' ? '등원' : '하원'}
          </Text>
          <Text style={styles.time}>
            {item.shuttleType === 'MORNING'
              ? `탑승: ${item.pickupTime}`
              : `하차: ${item.dropoffTime}`}
          </Text>

          {item.status === 'IN_PROGRESS' && (
            <Button
              title="차량 위치 보기"
              onPress={() => navigation.navigate('Tracking', { tripId: item.tripId })}
            />
          )}
        </View>
      )}
    />
  );
}
```

---

### Phase 4.2: 임시 셔틀 신청 시스템 (Week 43-48)

#### 데이터 모델

```prisma
model ShuttleRequest {
  id             String               @id @default(uuid())
  passengerId    String
  passenger      Passenger            @relation(fields: [passengerId], references: [id])
  institutionId  String
  institution    Institution          @relation(fields: [institutionId], references: [id])

  requestDate    DateTime             // 요청 날짜
  pickupAddress  String               @db.VarChar(200)
  pickupLat      Float
  pickupLng      Float
  dropoffAddress String               @db.VarChar(200)
  dropoffLat     Float
  dropoffLng     Float

  desiredTime    String               @db.VarChar(5) // HH:MM

  status         ShuttleRequestStatus @default(PENDING)
  rejectionReason String?             @db.Text

  // 승인 후 할당된 차량/운행
  assignedVehicleId String?
  assignedTripId    String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([institutionId, status])
  @@index([passengerId, requestDate])
  @@map("shuttle_requests")
}

enum ShuttleRequestStatus {
  PENDING     // 승인 대기
  APPROVED    // 승인됨
  ASSIGNED    // 차량 배정됨
  COMPLETED   // 완료
  REJECTED    // 거절
  CANCELLED   // 취소됨

  @@map("shuttle_request_status")
}
```

#### 백엔드 API

```typescript
// shuttle-request/interface/controllers/shuttle-request.controller.ts

@Controller('api/shuttle-requests')
export class ShuttleRequestController {
  // POST /api/shuttle-requests
  @Post()
  async createRequest(
    @Body() dto: CreateShuttleRequestDto,
    @CurrentUser() user: User
  ) {
    // 1. 주소 → 위도/경도 변환
    const pickupCoords = await this.geocodingService.geocode(dto.pickupAddress);
    const dropoffCoords = await this.geocodingService.geocode(dto.dropoffAddress);

    // 2. 임시 셔틀 요청 생성
    const request = await this.shuttleRequestRepo.create({
      passengerId: user.id,
      institutionId: dto.institutionId,
      requestDate: new Date(dto.requestDate),
      pickupAddress: dto.pickupAddress,
      pickupLat: pickupCoords.lat,
      pickupLng: pickupCoords.lng,
      dropoffAddress: dto.dropoffAddress,
      dropoffLat: dropoffCoords.lat,
      dropoffLng: dropoffCoords.lng,
      desiredTime: dto.desiredTime,
      status: 'PENDING',
    });

    // 3. 관리자에게 알림 발송
    await this.notificationService.sendToAdmins(dto.institutionId, {
      title: '새 임시 셔틀 요청',
      body: `${user.name}님이 임시 셔틀을 요청했습니다.`,
      data: { requestId: request.id },
    });

    return request;
  }

  // PATCH /api/shuttle-requests/:id/approve
  @Patch(':id/approve')
  @Roles('INSTITUTION_ADMIN')
  async approveRequest(
    @Param('id') requestId: string,
    @Body() dto: { vehicleId: string }
  ) {
    await this.shuttleRequestRepo.update(requestId, {
      status: 'APPROVED',
      assignedVehicleId: dto.vehicleId,
    });

    // TODO: 차량에 임시 셔틀 할당 로직
  }

  // DELETE /api/shuttle-requests/:id
  @Delete(':id')
  async cancelRequest(@Param('id') requestId: string) {
    await this.shuttleRequestRepo.update(requestId, {
      status: 'CANCELLED',
    });
  }
}
```

#### Passenger App - 임시 셔틀 신청

```typescript
// screens/RequestShuttleScreen.tsx

export default function RequestShuttleScreen() {
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [desiredTime, setDesiredTime] = useState('');
  const [requestDate, setRequestDate] = useState(new Date());

  const requestMutation = useMutation({
    mutationFn: (data) => api.post('/api/shuttle-requests', data),
    onSuccess: () => {
      Alert.alert('요청 완료', '임시 셔틀 요청이 접수되었습니다.');
      navigation.goBack();
    },
  });

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>요청 날짜</Text>
      <DatePicker
        value={requestDate}
        onChange={setRequestDate}
      />

      <Text style={styles.label}>탑승지</Text>
      <TextInput
        value={pickupAddress}
        onChangeText={setPickupAddress}
        placeholder="탑승지 주소 입력"
      />

      <Text style={styles.label}>하차지</Text>
      <TextInput
        value={dropoffAddress}
        onChangeText={setDropoffAddress}
        placeholder="하차지 주소 입력"
      />

      <Text style={styles.label}>희망 시간</Text>
      <TimePicker
        value={desiredTime}
        onChange={setDesiredTime}
      />

      <Button
        title="임시 셔틀 신청"
        onPress={() =>
          requestMutation.mutate({
            requestDate: requestDate.toISOString(),
            pickupAddress,
            dropoffAddress,
            desiredTime,
          })
        }
        disabled={requestMutation.isPending}
      />
    </ScrollView>
  );
}
```

#### Admin Portal - 임시 셔틀 요청 관리

```typescript
// frontend/app/shuttle-requests/page.tsx

export default function ShuttleRequestsPage() {
  const { data: requests } = useQuery({
    queryKey: ['shuttle-requests'],
    queryFn: () => fetch('/api/shuttle-requests').then(r => r.json()),
  });

  const approveMutation = useMutation({
    mutationFn: ({ requestId, vehicleId }) =>
      fetch(`/api/shuttle-requests/${requestId}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleId }),
      }),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">임시 셔틀 요청</h1>

      {requests?.map((req: any) => (
        <Card key={req.id}>
          <CardHeader>
            <span className={`badge ${req.status === 'PENDING' ? 'bg-yellow-500' : 'bg-green-500'}`}>
              {req.status}
            </span>
          </CardHeader>
          <CardContent>
            <p>승객: {req.passenger.name}</p>
            <p>날짜: {new Date(req.requestDate).toLocaleDateString()}</p>
            <p>탑승지: {req.pickupAddress}</p>
            <p>하차지: {req.dropoffAddress}</p>
            <p>희망 시간: {req.desiredTime}</p>

            {req.status === 'PENDING' && (
              <div className="flex gap-2 mt-4">
                <Select
                  placeholder="차량 선택"
                  onChange={(vehicleId) =>
                    approveMutation.mutate({ requestId: req.id, vehicleId })
                  }
                >
                  {/* 차량 목록 */}
                </Select>
                <Button variant="destructive">거절</Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

---

### Q4 완료 기준

- [ ] Passenger App iOS/Android 출시
- [ ] 실시간 차량 위치 추적 기능 작동
- [ ] 스케줄 조회 및 Push 알림 수신
- [ ] 임시 셔틀 신청/취소 기능 작동
- [ ] Admin Portal에서 임시 셔틀 승인/거절 가능
- [ ] 승인된 임시 셔틀 자동으로 Driver App에 표시
- [ ] 운행 히스토리 조회 가능

---

## 🏗️ 기술 아키텍처 Overview

### 마이크로서비스 모듈 구조

```
backend/src/
├── common/                  # 공통 모듈
│   ├── auth/               # JWT 인증
│   ├── geocoding/          # Kakao/Naver 지오코딩
│   └── database/           # Prisma Client
├── institution/            # 기관 관리
├── fleet/                  # 차량 관리
├── roster/                 # 승객 명단 관리
├── route/                  # 경로 최적화 (Q1)
├── notification/           # 알림 시스템 (Q1)
├── driver/                 # Driver App API (Q2)
├── trip/                   # GPS 트래킹 (Q3)
├── analytics/              # BI 대시보드 (Q3)
├── passenger/              # Passenger App API (Q4)
└── shuttle-request/        # 임시 셔틀 (Q4)
```

### 인프라 요구사항

| 서비스 | Q1 | Q2 | Q3 | Q4 |
|--------|----|----|----|----|
| PostgreSQL | ✅ | ✅ | ✅ | ✅ |
| Redis | ✅ (알림 큐) | ✅ | ✅ | ✅ |
| Firebase FCM | ✅ | ✅ | ✅ | ✅ |
| Google OR-Tools | ✅ | ✅ | ✅ | ✅ |
| Google Maps API | ✅ | ✅ | ✅ (Roads API) | ✅ |
| Kakao Maps API | - | ✅ (Geocoding) | ✅ | ✅ |
| WebSocket | - | - | ✅ (실시간 위치) | ✅ |

---

## 📈 성공 지표 (KPIs)

| 지표 | 현재 (MVP) | Q1 목표 | Q2 목표 | Q3 목표 | Q4 목표 |
|------|-----------|---------|---------|---------|---------|
| 경로 최적화 시간 | 수동 (30분+) | 자동 (5초) | - | - | - |
| 운행 시간 단축 | 0% | 15-20% | 20% | 20% | 20% |
| 기사 업무 시간 | 100% | 80% | 50% | 50% | 50% |
| 고객 만족도 | 70% | 80% | 85% | 85% | 90% |
| 데이터 품질 | 60% | 70% | 90% | 95% | 95% |
| 월 활성 사용자 | - | - | - | - | 1,000+ |

---

## 💰 예상 비용 (월간)

| 항목 | Q1 | Q2 | Q3 | Q4 |
|------|----|----|----|----|
| Cloud Hosting (AWS/GCP) | $200 | $300 | $500 | $800 |
| PostgreSQL (RDS) | $100 | $100 | $150 | $200 |
| Redis (ElastiCache) | $50 | $50 | $100 | $150 |
| Firebase FCM | Free | Free | $50 | $100 |
| Google Maps API | $100 | $200 | $500 | $800 |
| Kakao Maps API | $50 | $100 | $150 | $200 |
| **총 예상 비용** | **$500** | **$750** | **$1,450** | **$2,250** |

---

## 🚀 다음 단계 (Next Actions)

### 즉시 시작 가능한 작업

1. **Q1 준비**:
   ```bash
   # Google OR-Tools 설치
   npm install @google-cloud/optimization

   # Firebase Admin SDK 설정
   npm install firebase-admin

   # Prisma Schema 업데이트 (Route, Notification 모델)
   npx prisma migrate dev --name add-route-notification
   ```

2. **환경 변수 추가** (`.env`):
   ```env
   # Google Cloud
   GOOGLE_MAPS_API_KEY=your_key
   GOOGLE_CLOUD_PROJECT_ID=your_project

   # Firebase
   FIREBASE_PROJECT_ID=your_project
   FIREBASE_CLIENT_EMAIL=your_email
   FIREBASE_PRIVATE_KEY=your_key

   # Kakao Maps
   KAKAO_API_KEY=your_key

   # Redis
   REDIS_URL=redis://localhost:6379
   ```

3. **팀 구성 검토**:
   - Backend: 2명 (NestJS, Prisma, OR-Tools)
   - Frontend: 1명 (Next.js, React Query)
   - Mobile: 2명 (React Native, iOS/Android)
   - DevOps: 1명 (AWS/GCP, CI/CD)

---

## 📚 참고 자료

- [Google OR-Tools VRP Guide](https://developers.google.com/optimization/routing)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Google Maps Roads API](https://developers.google.com/maps/documentation/roads)
- [Kakao Maps API](https://developers.kakao.com/docs/latest/ko/local/dev-guide)
- [React Native Maps](https://github.com/react-native-maps/react-native-maps)

---

**작성일**: 2025-01-15
**작성자**: Claude Code
**버전**: 1.0
